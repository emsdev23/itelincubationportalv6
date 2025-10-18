// src/components/ChatApp.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import NewChatModal from "./NewChatModal";
import styles from "../Navbar.module.css";
import { getChatLists, getChatDetails, sendMessage } from "./chatService";
import "./ChatApp.css";
import ITELLogo from "../../assets/ITEL_Logo.png";
import { useNavigate } from "react-router-dom";
import { MessageSquare, MoveLeft, History } from "lucide-react";

const ChatApp = () => {
  const [chatLists, setChatLists] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messagePolling, setMessagePolling] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: sessionStorage.getItem("userid") || "1",
    name: sessionStorage.getItem("username") || "User",
    role: sessionStorage.getItem("userrole") || "incubatee",
    roleid: sessionStorage.getItem("roleid") || null,
  });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const chatListIntervalRef = useRef(null);
  const messageIntervalRef = useRef(null);
  const messageIdsRef = useRef(new Map());
  const [newChatId, setNewChatId] = useState(null);

  // Fetch chat lists
  const fetchChatLists = useCallback(async () => {
    try {
      const data = await getChatLists(currentUser.id);
      setChatLists(data);
      return data;
    } catch (error) {
      console.error("Error fetching chat lists:", error);
      return [];
    }
  }, [currentUser.id]);

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(
    async (chatId) => {
      try {
        console.log(
          "Fetching messages for chatId:",
          chatId,
          "and userId:",
          currentUser.id
        );
        const data = await getChatDetails(currentUser.id, chatId);
        console.log("Messages data:", data);

        const newMessageIds = new Set(data.map((msg) => msg.chatdetailsrecid));
        messageIdsRef.current.set(chatId, newMessageIds);

        setMessages((prev) => ({
          ...prev,
          [chatId]: data,
        }));
        return data;
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    },
    [currentUser.id]
  );

  // Check for new messages
  const checkForNewMessages = useCallback(
    async (chatId) => {
      if (messagePolling) return;

      setMessagePolling(true);
      try {
        const data = await getChatDetails(currentUser.id, chatId);
        const storedMessageIds = messageIdsRef.current.get(chatId) || new Set();

        const newMessages = data.filter(
          (msg) => !storedMessageIds.has(msg.chatdetailsrecid)
        );

        if (newMessages.length > 0) {
          const updatedMessageIds = new Set([
            ...storedMessageIds,
            ...newMessages.map((msg) => msg.chatdetailsrecid),
          ]);
          messageIdsRef.current.set(chatId, updatedMessageIds);

          setMessages((prev) => ({
            ...prev,
            [chatId]: data,
          }));

          const latestMessage = newMessages[newMessages.length - 1];
          setChatLists((prev) =>
            prev.map((chat) =>
              chat.chatlistrecid === chatId
                ? {
                    ...chat,
                    chatlistmodifiedtime: latestMessage.chatdetailscreatedtime,
                    lastMessage: latestMessage.chatdetailsmessage,
                  }
                : chat
            )
          );
        }
      } catch (error) {
        console.error("Error checking for new messages:", error);
      } finally {
        setMessagePolling(false);
      }
    },
    [currentUser.id, messagePolling]
  );

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchChatLists();
      setLoading(false);
    };

    fetchData();
  }, [fetchChatLists]);

  // Set up auto-refresh for chat lists every 30 seconds
  useEffect(() => {
    chatListIntervalRef.current = setInterval(() => {
      fetchChatLists();
    }, 3000);

    return () => {
      if (chatListIntervalRef.current) {
        clearInterval(chatListIntervalRef.current);
      }
    };
  }, [fetchChatLists]);

  // Set up message polling for the selected chat every 1 second
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.chatlistrecid);

      messageIntervalRef.current = setInterval(() => {
        checkForNewMessages(selectedChat.chatlistrecid);
      }, 1000);

      return () => {
        if (messageIntervalRef.current) {
          clearInterval(messageIntervalRef.current);
        }
      };
    }
  }, [selectedChat, fetchMessages, checkForNewMessages]);

  // Check for new chat and select it if it's the one we just created
  useEffect(() => {
    if (newChatId && chatLists.length > 0) {
      const newChat = chatLists.find(
        (chat) => chat.chatlistrecid === newChatId
      );
      if (newChat) {
        setSelectedChat(newChat);
        setNewChatId(null);
      }
    }
  }, [chatLists, newChatId]);

  // Manual refresh handler - kept for internal use but removed from UI
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchChatLists();
      if (selectedChat) {
        await fetchMessages(selectedChat.chatlistrecid);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Handle history button click - navigate to history page
  const handleHistory = () => {
    // Store the current user in sessionStorage to be used by ChatHistory component
    sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
    navigate("/Incubation/Dashboard/ChatHistory");
  };

  // Modified handleSendMessage to separate filename and base64 data
  const handleSendMessage = async (messageContent, attachment, replyToId) => {
    try {
      let attachmentBase64 = null;
      let fileName = "";

      if (attachment) {
        // Convert file to base64
        attachmentBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Data = reader.result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(attachment);
        });

        // Store the original filename separately
        fileName = attachment.name;
      }

      const messageData = {
        chatdetailstypeid: selectedChat.chatlistchattypeid,
        chatdetailslistid: selectedChat.chatlistrecid,
        chatdetailsfrom: currentUser.id,
        chatdetailsto: selectedChat.chatlistto,
        chatdetailsmessage: messageContent,
        chatdetailsattachmentpath: attachmentBase64 || "",
        filename: fileName,
      };

      if (replyToId) {
        messageData.chatdetailsreplyfor = replyToId;
      }

      const newMessage = await sendMessage(messageData);

      setMessages((prev) => ({
        ...prev,
        [selectedChat.chatlistrecid]: [
          ...(prev[selectedChat.chatlistrecid] || []),
          newMessage,
        ],
      }));

      const currentIds =
        messageIdsRef.current.get(selectedChat.chatlistrecid) || new Set();
      currentIds.add(newMessage.chatdetailsrecid);
      messageIdsRef.current.set(selectedChat.chatlistrecid, currentIds);

      setChatLists((prev) =>
        prev.map((chat) =>
          chat.chatlistrecid === selectedChat.chatlistrecid
            ? {
                ...chat,
                chatlistmodifiedtime: newMessage.chatdetailscreatedtime,
                lastMessage: newMessage.chatdetailsmessage,
              }
            : chat
        )
      );

      setTimeout(() => {
        fetchMessages(selectedChat.chatlistrecid);
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleChatCreated = async (newChat) => {
    setShowNewChatModal(false);
    if (newChat && newChat.chatlistrecid) {
      setNewChatId(newChat.chatlistrecid);
    }
    await fetchChatLists();
  };

  const handleBackToPortal = () => {
    const roleId = Number(currentUser.roleid);
    const id = Number(currentUser.id);

    if (roleId === 1 || roleId == 2 || roleId == 3) {
      navigate("/Incubation/Dashboard");
    } else if (roleId === 4 || roleId === 5 || roleId === 6) {
      if (id) {
        navigate("/startup/Dashboard/");
      } else {
        navigate("/startup/Dashboard/");
      }
    }
  };

  return (
    <div className="chat-app-page">
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.logoSection}>
            <img src={ITELLogo} className={styles.logoIcon} alt="ITEL Logo" />
            <div>
              <h1 className={styles.title}>ITEL Incubation Portal</h1>
              <p className={styles.subtitle}>Startup Management Dashboard</p>
            </div>
          </div>
          <div className={styles.actions}>
            <button
              className={styles.btnPrimary}
              onClick={() => setShowNewChatModal(true)}
            >
              <MessageSquare className={styles.icon} />
              New Chat
            </button>
            {/* History button for all users */}
            {Number(currentUser.roleid) === 1 && (
              <button
                className={styles.btnPrimary}
                onClick={handleHistory}
                title="View chat history"
              >
                <History className={styles.icon} />
                Chat History
              </button>
            )}

            <button className={styles.btnPrimary} onClick={handleBackToPortal}>
              <MoveLeft className={styles.icon} />
              Back To Portal
            </button>
          </div>
        </div>
      </header>

      <main className="chat-app-main">
        <div className="chat-container">
          <ChatList
            chatLists={chatLists}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
            loading={loading}
            currentUser={currentUser}
            refreshing={refreshing}
          />

          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              messages={messages[selectedChat.chatlistrecid] || []}
              onSendMessage={handleSendMessage}
              currentUser={currentUser}
              fileInputRef={fileInputRef}
              chatLists={chatLists}
            />
          ) : (
            <div className="no-chat-selected">
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </main>

      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={handleChatCreated}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default ChatApp;
