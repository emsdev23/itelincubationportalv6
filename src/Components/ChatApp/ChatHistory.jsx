// src/components/ChatHistory.jsx
import React, { useState, useEffect } from "react";
import styles from "../Navbar.module.css";
import {
  Search,
  Calendar,
  User,
  ArrowLeft,
  Eye,
  FileText,
  Download,
} from "lucide-react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { getChatHistory } from "./chatService";
import "./ChatHistory.css";
import { useNavigate } from "react-router-dom";
import ITELLogo from "../../assets/ITEL_Logo.png";
import { IPAdress } from "../Datafetching/IPAdrees";

const ChatHistory = ({ currentUser: propCurrentUser }) => {
  // Get currentUser from prop or sessionStorage
  const [currentUser, setCurrentUser] = useState(
    propCurrentUser ||
      JSON.parse(sessionStorage.getItem("currentUser")) || {
        id: sessionStorage.getItem("userid") || "1",
        name: sessionStorage.getItem("username") || "User",
        role: sessionStorage.getItem("userrole") || "incubatee",
        roleid: sessionStorage.getItem("roleid") || null,
        incUserid: sessionStorage.getItem("incUserid") || null,
      }
  );

  const [chatHistory, setChatHistory] = useState([]);
  const [chatDetails, setChatDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "chatdetailscreatedtime",
    direction: "descending",
  });
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Use the new API to get all chat details for the current user
        const data = await getChatHistory(
          currentUser.id,
          currentUser.incUserid
        );
        setChatHistory(data);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser.id]);

  // Filter messages based on search term
  const filteredMessages = chatHistory.filter((message) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (message.chatlistsubject &&
        message.chatlistsubject.toLowerCase().includes(searchLower)) ||
      (message.chatdetailsfromusername &&
        message.chatdetailsfromusername.toLowerCase().includes(searchLower)) ||
      (message.chatdetailstousername &&
        message.chatdetailstousername.toLowerCase().includes(searchLower)) ||
      (message.chatdetailsmessage &&
        message.chatdetailsmessage.toLowerCase().includes(searchLower)) ||
      message.chatdetailslistid.toString().includes(searchLower)
    );
  });

  // Sort messages based on the current sort configuration
  const sortedMessages = React.useMemo(() => {
    let sortableItems = [...filteredMessages];

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle special cases for sorting
        if (sortConfig.key === "chatdetailscreatedtime") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (sortConfig.key === "chatdetailsattachmentpath") {
          // Sort by whether there's an attachment or not
          aValue = aValue ? 1 : 0;
          bValue = bValue ? 1 : 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [filteredMessages, sortConfig]);

  // Function to handle column sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Function to get the appropriate sort icon
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FaSort className="sort-icon" />;
    }

    return sortConfig.direction === "ascending" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  // Helper function to generate a filename with datetime
  const generateFilenameWithDateTime = (originalFileName) => {
    const now = new Date();
    const dateTimeString = now
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "");

    // Extract file extension if present
    const lastDotIndex = originalFileName.lastIndexOf(".");
    const nameWithoutExtension =
      lastDotIndex > 0
        ? originalFileName.substring(0, lastDotIndex)
        : originalFileName;
    const fileExtension =
      lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : "";

    return `${nameWithoutExtension}_${dateTimeString}${fileExtension}`;
  };

  // Function to get file URL from API
  const getFileUrl = async (path) => {
    try {
      const response = await fetch(
        `${IPAdress}/itelinc/resources/generic/getfileurl`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            userid: currentUser.id,
            incUserId: currentUser.incUserid,
            url: path,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get file URL");
      }

      const data = await response.json();
      return data.data; // Return the URL from the response
    } catch (error) {
      console.error("Error getting file URL:", error);
      throw error;
    }
  };

  // Function to download attachment
  const downloadAttachment = async (message) => {
    if (!message.chatdetailsattachmentpath || !message.chatdetailsfilename)
      return;

    // Add this message ID to the downloading set
    setDownloadingFiles((prev) => new Set(prev).add(message.chatdetailsrecid));

    try {
      // Use the filename from the API response with datetime
      const downloadFileName = generateFilenameWithDateTime(
        message.chatdetailsfilename
      );

      // Check if the attachment is a URL path (not base64)
      const isUrlPath =
        message.chatdetailsattachmentpath &&
        !message.chatdetailsattachmentpath.startsWith("http") &&
        !message.chatdetailsattachmentpath.startsWith("data:") &&
        message.chatdetailsattachmentpath.includes("/");

      // Check if the attachment is a base64 string
      const isBase64 =
        message.chatdetailsattachmentpath &&
        !message.chatdetailsattachmentpath.startsWith("http") &&
        !message.chatdetailsattachmentpath.startsWith("data:") &&
        !isUrlPath &&
        message.chatdetailsattachmentpath.length > 100;

      if (isUrlPath) {
        // Get the file URL from API
        const fileUrl = await getFileUrl(message.chatdetailsattachmentpath);

        // Fetch the file content
        const response = await fetch(fileUrl, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch file");
        }

        // Get the blob from the response
        const blob = await response.blob();

        // Create a URL for the blob
        const blobUrl = URL.createObjectURL(blob);

        // Create a link and trigger download
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = downloadFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
      } else if (isBase64) {
        // Handle base64 data
        const byteCharacters = atob(message.chatdetailsattachmentpath);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        // Determine MIME type based on file extension
        let mimeType = "application/octet-stream";
        const fileExtension = message.chatdetailsfilename
          .substring(message.chatdetailsfilename.lastIndexOf("."))
          .toLowerCase();

        if (fileExtension === ".png") {
          mimeType = "image/png";
        } else if (fileExtension === ".jpg" || fileExtension === ".jpeg") {
          mimeType = "image/jpeg";
        } else if (fileExtension === ".gif") {
          mimeType = "image/gif";
        } else if (fileExtension === ".pdf") {
          mimeType = "application/pdf";
        } else if (fileExtension === ".zip") {
          mimeType = "application/zip";
        }

        const blob = new Blob([byteArray], { type: mimeType });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = downloadFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // For direct URLs, we also need to fetch the content first
        try {
          // Fetch the file content
          const response = await fetch(message.chatdetailsattachmentpath, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch file");
          }

          // Get the blob from the response
          const blob = await response.blob();

          // Create a URL for the blob
          const blobUrl = URL.createObjectURL(blob);

          // Create a link and trigger download
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = downloadFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up the blob URL
          URL.revokeObjectURL(blobUrl);
        } catch (fetchError) {
          // If fetching fails, fall back to the original method
          console.warn(
            "Could not fetch file content, falling back to direct download:",
            fetchError
          );
          const link = document.createElement("a");
          link.href = message.chatdetailsattachmentpath;
          link.download = downloadFileName;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      // You could show an error message to the user here
    } finally {
      // Remove this message ID from the downloading set
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(message.chatdetailsrecid);
        return newSet;
      });
    }
  };

  // Fetch details for a specific chat when selected
  const fetchChatDetails = async (chatId) => {
    if (chatDetails[chatId]) {
      setSelectedChatId(chatId);
      setShowDetails(true);
      return; // Already fetched
    }

    try {
      setLoadingDetails((prev) => ({ ...prev, [chatId]: true }));
      // We already have all the details in chatHistory, just filter them
      const messages = chatHistory.filter(
        (msg) => msg.chatdetailslistid === chatId
      );
      setChatDetails((prev) => ({ ...prev, [chatId]: messages }));
      setSelectedChatId(chatId);
      setShowDetails(true);
    } catch (error) {
      console.error("Error fetching chat details:", error);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [chatId]: false }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const handleBackToPortal = () => {
    const roleId = Number(currentUser.roleid);
    const id = Number(currentUser.id);

    if (roleId === 1) {
      navigate("/Incubation/Dashboard/Chats");
    }
  };

  // Group messages by chat ID for the modal view
  const getChatMessages = (chatId) => {
    return chatHistory
      .filter((msg) => msg.chatdetailslistid === chatId)
      .sort(
        (a, b) =>
          new Date(a.chatdetailscreatedtime) -
          new Date(b.chatdetailscreatedtime)
      );
  };

  return (
    <div className="chat-history-page">
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.logoSection}>
            <img src={ITELLogo} className={styles.logoIcon} alt="ITEL Logo" />
            <div>
              <h1 className={styles.title}>ITEL Incubation Portal</h1>
              <p className={styles.subtitle}>Chat History</p>
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={handleBackToPortal}>
              <ArrowLeft className={styles.icon} />
              Back To Chats
            </button>
          </div>
        </div>
      </header>

      <main className="chat-history-main">
        <div className="chat-history-container">
          <div className="chat-history-header">
            <h2>Chat History</h2>
          </div>

          <div className="chat-history-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by subject, from, to, or message content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="chat-history-table-container">
            {loading ? (
              <div className="loading-history">Loading chat history...</div>
            ) : sortedMessages.length === 0 ? (
              <div className="no-history">No chat history found</div>
            ) : (
              <table className="chat-history-table">
                <thead>
                  <tr>
                    <th
                      className="sortable-header"
                      onClick={() => requestSort("chatlistsubject")}
                    >
                      <div className="header-content">
                        Chat Subject
                        {getSortIcon("chatlistsubject")}
                      </div>
                    </th>
                    <th
                      className="sortable-header"
                      onClick={() => requestSort("chatdetailsfromusername")}
                    >
                      <div className="header-content">
                        From
                        {getSortIcon("chatdetailsfromusername")}
                      </div>
                    </th>
                    <th
                      className="sortable-header"
                      onClick={() => requestSort("chatdetailstousername")}
                    >
                      <div className="header-content">
                        To
                        {getSortIcon("chatdetailstousername")}
                      </div>
                    </th>
                    <th
                      className="sortable-header"
                      onClick={() => requestSort("chatdetailsmessage")}
                    >
                      <div className="header-content">
                        Message
                        {getSortIcon("chatdetailsmessage")}
                      </div>
                    </th>
                    <th
                      className="sortable-header"
                      onClick={() => requestSort("chatdetailscreatedtime")}
                    >
                      <div className="header-content">
                        Date & Time
                        {getSortIcon("chatdetailscreatedtime")}
                      </div>
                    </th>
                    <th
                      className="sortable-header"
                      onClick={() => requestSort("chatdetailsattachmentpath")}
                    >
                      <div className="header-content">
                        Attachment
                        {getSortIcon("chatdetailsattachmentpath")}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMessages.map((message) => (
                    <tr
                      key={message.chatdetailsrecid}
                      className="chat-history-row"
                    >
                      <td>
                        <div className="chat-subject">
                          {message.chatlistsubject ||
                            `Chat ID: ${message.chatdetailslistid}`}
                        </div>
                      </td>
                      <td>{message.chatdetailsfromusername}</td>
                      <td>{message.chatdetailstousername}</td>
                      <td>
                        <div className="message-preview">
                          {message.chatdetailsmessage.substring(0, 100)}
                          {message.chatdetailsmessage.length > 100 ? "..." : ""}
                        </div>
                      </td>
                      <td>{formatDate(message.chatdetailscreatedtime)}</td>
                      <td>
                        {message.chatdetailsattachmentpath ? (
                          <div className="attachment-indicator">
                            <FileText size={14} />
                            <span className="attachment-filename">
                              {message.chatdetailsfilename || "File"}
                            </span>
                            <button
                              className="download-btn"
                              onClick={() => downloadAttachment(message)}
                              disabled={downloadingFiles.has(
                                message.chatdetailsrecid
                              )}
                              title="Download attachment"
                            >
                              {downloadingFiles.has(
                                message.chatdetailsrecid
                              ) ? (
                                <div className="download-spinner"></div>
                              ) : (
                                <Download size={14} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="no-attachment">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {showDetails && selectedChatId && (
            <div className="chat-details-modal">
              <div className="chat-details-header">
                <h3>Chat Details - ID: {selectedChatId}</h3>
                <button
                  className="close-details-btn"
                  onClick={() => setShowDetails(false)}
                >
                  ×
                </button>
              </div>
              <div className="chat-details-content">
                {loadingDetails[selectedChatId] ? (
                  <div className="loading-details">Loading messages...</div>
                ) : (
                  <div className="chat-messages">
                    {getChatMessages(selectedChatId).map((message) => (
                      <div
                        key={message.chatdetailsrecid}
                        className={`message-item ${
                          message.chatdetailsfrom == currentUser.id
                            ? "sent"
                            : "received"
                        }`}
                      >
                        <div className="message-header">
                          <User size={14} />
                          <span className="message-sender">
                            {message.chatdetailsfrom == currentUser.id
                              ? "You"
                              : message.chatdetailsfromusername || "Unknown"}
                          </span>
                          <span className="message-time">
                            {formatDate(message.chatdetailscreatedtime)}
                          </span>
                        </div>
                        <div className="message-content">
                          {message.chatdetailsmessage}
                        </div>
                        {message.chatdetailsattachmentpath && (
                          <div className="message-attachment">
                            <FileText size={14} />
                            <span className="attachment-filename">
                              {message.chatdetailsfilename || "File"}
                            </span>
                            <button
                              className="download-btn"
                              onClick={() => downloadAttachment(message)}
                              disabled={downloadingFiles.has(
                                message.chatdetailsrecid
                              )}
                              title="Download attachment"
                            >
                              {downloadingFiles.has(
                                message.chatdetailsrecid
                              ) ? (
                                <div className="download-spinner"></div>
                              ) : (
                                <Download size={14} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatHistory;
