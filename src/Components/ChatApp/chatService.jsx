// src/services/chatService.js
const API_BASE_URL = "http://121.242.232.212:8086/itelinc";

export const getChatLists = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/resources/generic/getchatlist`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: parseInt(userId),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch chat lists");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching chat lists:", error);
    throw error;
  }
};

export const createChat = async (chatData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/resources/chat/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        chattype: chatData.chattype,
        from: chatData.from,
        to: chatData.to,
        subject: chatData.subject,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create chat: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

export const getChatDetails = async (userId, chatId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/resources/generic/getchatdetails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          chatId: parseInt(chatId),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch chat details");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching chat details:", error);
    throw error;
  }
};

export const sendMessage = async (messageData) => {
  try {
    const requestBody = {
      chatdetailstypeid: messageData.chatdetailstypeid,
      chatdetailslistid: messageData.chatdetailslistid,
      chatdetailsfrom: messageData.chatdetailsfrom,
      chatdetailsto: messageData.chatdetailsto,
      chatdetailsmessage: messageData.chatdetailsmessage,
      chatdetailsattachmentpath: messageData.chatdetailsattachmentpath || "",
      chatdetailsattachmentname: messageData.filename || "",
    };

    if (messageData.chatdetailsreplyfor) {
      requestBody.chatdetailsreplyfor = messageData.chatdetailsreplyfor;
    }

    const response = await fetch(`${API_BASE_URL}/resources/chat/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send message: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const getUsers = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/resources/generic/getusers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        userId: userId || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getChatTypes = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/resources/generic/getchattype`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: parseInt(userId),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch chat types: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching chat types:", error);
    throw error;
  }
};

// UPDATED: Function to get chat history (all chat details) - uses userId parameter
export const getChatHistory = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/resources/generic/getchatdetails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          chatId: "ALL", // Get all chat details for the user
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch chat history");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};
