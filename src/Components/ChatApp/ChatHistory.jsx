import React, { useState, useEffect } from "react";
import styles from "../Navbar.module.css";
import {
  Search,
  Calendar,
  User,
  ArrowLeft,
  FileText,
  Download,
} from "lucide-react";
import { getChatHistory } from "./chatService";
import "./ChatHistory.css";
import { useNavigate } from "react-router-dom";
import ITELLogo from "../../assets/ITEL_Logo.png";
import { IPAdress } from "../Datafetching/IPAdrees";
import api from "../Datafetching/api";
import * as XLSX from "xlsx";

// Material UI imports
import {
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Modal,
  CircularProgress,
  Chip,
  IconButton,
  Avatar,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";

// Import the ReusableDataGrid component
import ReusableDataGrid from "../Datafetching/ReusableDataGrid";

// Styled components for custom styling
const MessageCard = styled(Card)(({ theme, $isSent }) => ({
  marginBottom: theme.spacing(1),
  backgroundColor: $isSent
    ? theme.palette.primary.light
    : theme.palette.background.paper,
  alignSelf: $isSent ? "flex-end" : "flex-start",
  maxWidth: "70%",
}));

const AttachmentChip = styled(Chip)(({ theme }) => ({
  marginTop: theme.spacing(1),
  backgroundColor: theme.palette.grey[200],
}));

// Styled component for attachment container
const AttachmentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(0.5),
  backgroundColor: theme.palette.action.hover,
  transition: "background-color 0.2s",
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
  },
}));

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
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const navigate = useNavigate();

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

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
      const response = await api.post(
        `${IPAdress}/itelinc/resources/generic/getfileurl`,
        {
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
            userid: currentUser.id,
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
              userid: currentUser.id,
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

  // Define columns for ReusableDataGrid
  const columns = [
    {
      field: "chatlistsubject",
      headerName: "Chat Subject",
      width: 200,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || `Chat ID: ${params.row.chatdetailslistid}`}
        </Typography>
      ),
    },
    {
      field: "chatdetailsfromusername",
      headerName: "From",
      width: 150,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2">{params.value}</Typography>
      ),
    },
    {
      field: "chatdetailstousername",
      headerName: "To",
      width: 150,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2">{params.value}</Typography>
      ),
    },
    {
      field: "chatdetailsmessage",
      headerName: "Message",
      width: 250,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value
            ? params.value.length > 100
              ? `${params.value.substring(0, 100)}...`
              : params.value
            : ""}
        </Typography>
      ),
    },
    {
      field: "chatdetailscreatedtime",
      headerName: "Date & Time",
      width: 180,
      sortable: true,
      filterable: true,
      type: "date",
      renderCell: (params) => (
        <Typography variant="body2">{formatDate(params.value)}</Typography>
      ),
    },
    {
      field: "chatlistchatstate",
      headerName: "Status",
      width: 120,
      sortable: true,
      filterable: true,
      type: "chip",
      chipColors: {
        Active: { backgroundColor: "#e3f2fd", color: "#1976d2" },
        Closed: { backgroundColor: "#f5f5f5", color: "#616161" },
        Pending: { backgroundColor: "#fff3e0", color: "#f57c00" },
      },
    },
    {
      field: "chatdetailsattachmentpath",
      headerName: "Attachment",
      width: 250,
      sortable: true,
      filterable: true,
      renderCell: (params) => {
        if (!params.value) {
          return (
            <Typography variant="body2" color="text.secondary">
              No attachment
            </Typography>
          );
        }

        return (
          <AttachmentContainer>
            <FileText size={16} color="#666" />
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "0.875rem",
              }}
              title={params.row.chatdetailsfilename || "File"}
            >
              {params.row.chatdetailsfilename || "File"}
            </Typography>
            <Tooltip title="Download attachment">
              <IconButton
                size="small"
                onClick={() => downloadAttachment(params.row)}
                disabled={downloadingFiles.has(params.row.chatdetailsrecid)}
                sx={{
                  padding: "4px",
                  ml: 0.5,
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                {downloadingFiles.has(params.row.chatdetailsrecid) ? (
                  <CircularProgress size={16} />
                ) : (
                  <Download size={16} color="black" />
                )}
              </IconButton>
            </Tooltip>
          </AttachmentContainer>
        );
      },
    },
  ];

  // Custom export function for chat history
  const onExportData = (data) => {
    return data.map((item) => ({
      "Chat Subject":
        item.chatlistsubject || `Chat ID: ${item.chatdetailslistid}`,
      From: item.chatdetailsfromusername || "",
      To: item.chatdetailstousername || "",
      Message: item.chatdetailsmessage || "",
      "Date & Time": formatDate(item.chatdetailscreatedtime),
      Status: item.chatlistchatstate || "",
      Attachment: item.chatdetailsfilename || "None",
    }));
  };

  // Export configuration
  const exportConfig = {
    filename: "chat_history",
    sheetName: "Chat History",
  };

  return (
    <Box
      className="chat-history-page"
      sx={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <main className="chat-history-main" sx={{ flexGrow: 1, p: 3 }}>
        <Box className="chat-history-container" sx={{ p: 2 }}>
          {/* Use the ReusableDataGrid component */}
          <ReusableDataGrid
            data={chatHistory}
            columns={columns}
            title="Chat History"
            searchPlaceholder="Search by subject, from, to, or message content..."
            searchFields={[
              "chatlistsubject",
              "chatdetailsfromusername",
              "chatdetailstousername",
              "chatdetailsmessage",
              "chatdetailslistid",
            ]}
            uniqueIdField="chatdetailsrecid"
            onExportData={onExportData}
            exportConfig={exportConfig}
            enableExport={true}
            enableColumnFilters={true}
          />
        </Box>
      </main>

      <Modal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        aria-labelledby="chat-details-modal"
        aria-describedby="modal for chat details"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: 800,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            maxHeight: "80vh",
            overflow: "auto",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5" component="h2">
              Chat Details - ID: {selectedChatId}
            </Typography>
            <IconButton onClick={() => setShowDetails(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {loadingDetails[selectedChatId] ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                p: 2,
                maxHeight: "60vh",
                overflow: "auto",
              }}
            >
              {getChatMessages(selectedChatId).map((message) => (
                <MessageCard
                  key={message.chatdetailsrecid}
                  $isSent={message.chatdetailsfrom == currentUser.id}
                >
                  <CardHeader
                    avatar={
                      <Avatar>
                        {message.chatdetailsfrom == currentUser.id ? (
                          <User size={20} />
                        ) : (
                          message.chatdetailsfromusername?.charAt(0) || "U"
                        )}
                      </Avatar>
                    }
                    title={
                      message.chatdetailsfrom == currentUser.id
                        ? "You"
                        : message.chatdetailsfromusername || "Unknown"
                    }
                    subheader={formatDate(message.chatdetailscreatedtime)}
                  />
                  <CardContent>
                    <Typography variant="body1">
                      {message.chatdetailsmessage}
                    </Typography>
                    {message.chatdetailsattachmentpath && (
                      <AttachmentChip
                        icon={<FileText size={16} />}
                        label={message.chatdetailsfilename || "File"}
                        onClick={() => downloadAttachment(message)}
                        onDelete={
                          downloadingFiles.has(message.chatdetailsrecid)
                            ? undefined
                            : () => downloadAttachment(message)
                        }
                        deleteIcon={
                          downloadingFiles.has(message.chatdetailsrecid) ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Download size={16} />
                          )
                        }
                      />
                    )}
                  </CardContent>
                </MessageCard>
              ))}
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default ChatHistory;
