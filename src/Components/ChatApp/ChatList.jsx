import React, { useState } from "react";
import Swal from "sweetalert2";
import "./ChatList.css";
import { IPAdress } from "../Datafetching/IPAdrees";

const ChatList = ({
  chatLists,
  selectedChat,
  onSelectChat,
  loading,
  currentUser,
  refreshing,
  onCloseChat,
}) => {
  const [activeTab, setActiveTab] = useState("active");
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incUserid");

  const getChatTypeLabel = (chatTypeId) => {
    const types = {
      1: "Incubator → Incubatee",
      2: "Incubatee → Incubator",
      3: "Broadcast (No Reply)",
      4: "Group Chat (Public)",
      5: "Group Chat (Private)",
    };
    return types[chatTypeId] || "Unknown";
  };

  const getChatPartnerName = (chat) => {
    if (chat.chatlistfrom == currentUser.id) {
      return chat.usersnameto || "Unknown";
    }
    return chat.usersnamefrom || "Unknown";
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- MODIFIED FUNCTION ---
  const handleCloseChat = async (e, chat) => {
    e.stopPropagation(); // Prevent selecting the chat when clicking close

    // 1. Show confirmation dialog
    const result = await Swal.fire({
      title: "Close Chat",
      text: `Are you sure you want to close this chat with ${getChatPartnerName(
        chat
      )}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, close it!",
      cancelButtonText: "Cancel",
    });

    // If user cancels, do nothing
    if (!result.isConfirmed) {
      return;
    }

    // 2. Get the Bearer Token
    if (!token) {
      Swal.fire({
        title: "Authentication Error",
        text: "Authentication token not found. Please log in again.",
        icon: "error",
      });
      return;
    }

    // 3. Construct the Request Body
    const requestBody = {
      chatdetailsfrom: String(currentUser.id),
      userIncId: String(currentUser.incUserid),
      chatrecid: chat.chatlistrecid,
    };

    // 4. Show loading state
    Swal.fire({
      title: "Closing Chat",
      text: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // 5. Make the API Call
    try {
      const response = await fetch(`${IPAdress}/itelinc/resources/chat/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error: ${response.status} ${response.statusText}`
        );
      }

      // 6. Handle Success
      const result = await response.json();
      console.log("Chat closed successfully:", result);

      // Show success message
      Swal.fire({
        title: "Success!",
        text: "Chat closed successfully!",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      // 7. Notify Parent Component
      if (onCloseChat) {
        onCloseChat(chat);
      }
    } catch (error) {
      // 8. Handle Errors
      console.error("Failed to close chat:", error);
      Swal.fire({
        title: "Error",
        text: `Could not close chat: ${error.message}`,
        icon: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="chat-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading chats...</p>
      </div>
    );
  }

  const activeChats = chatLists.filter((chat) => chat.chatlistchatstate === 1);
  const closedChats = chatLists.filter((chat) => chat.chatlistchatstate === 0);
  const chatsToDisplay = activeTab === "active" ? activeChats : closedChats;
  const noChatsMessage =
    activeTab === "active"
      ? "No active chats. Start a new conversation!"
      : "No closed chats.";

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <div className="chat-list-tabs">
          <button
            className={`tab-button ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active
          </button>
          <button
            className={`tab-button ${activeTab === "closed" ? "active" : ""}`}
            onClick={() => setActiveTab("closed")}
          >
            Closed
          </button>
        </div>
        {refreshing && (
          <div className="refresh-indicator">
            <div className="spinner-small"></div>
            <span>Refreshing...</span>
          </div>
        )}
      </div>
      {chatsToDisplay.length === 0 ? (
        <div className="no-chats">{noChatsMessage}</div>
      ) : (
        <ul className="chat-list-items">
          {chatsToDisplay.map((chat) => (
            <li
              key={chat.chatlistrecid}
              className={`chat-list-item ${
                selectedChat?.chatlistrecid === chat.chatlistrecid
                  ? "active"
                  : ""
              }`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="chat-item-header">
                <span className="chat-partner">{getChatPartnerName(chat)}</span>
                <div className="chat-item-actions">
                  <span className="chat-time">
                    {formatTime(chat.chatlistmodifiedtime)}
                  </span>
                  {activeTab === "active" &&
                    chat.chatlistfrom == currentUser.id && (
                      <button
                        className="close-chat-btn"
                        onClick={(e) => handleCloseChat(e, chat)}
                        title="Close this chat"
                      >
                        Close
                      </button>
                    )}
                </div>
              </div>
              <div className="chat-item-subject">{chat.chatlistsubject}</div>
              <div className="chat-type-badge">
                {getChatTypeLabel(chat.chatlistchattypeid)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatList;
