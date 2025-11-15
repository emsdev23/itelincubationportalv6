// src/services/chatService.js
import { IPAdress } from "../Datafetching/IPAdrees";
import api from "../Datafetching/api";
const API_BASE_URL = `${IPAdress}/itelinc`;

export const getChatLists = async (userId, incUserid) => {
  try {
    console.log("Fetching chat lists for user:", userId, incUserid);

    const response = await api.post("/generic/getchatlist", {
      userId: parseInt(userId),
      incUserId: parseInt(incUserid),
    });

    // Log the response to see its structure
    console.log("API response:", response);

    // Most API clients return data directly in response.data
    // Adjust this based on your API client's response structure
    const data = response.data || response;

    // Log the data to verify it has the expected structure
    console.log("Chat lists data:", data);

    return data.data || data || [];
  } catch (error) {
    console.error("Error fetching chat lists:", error);
    throw error;
  }
};
export const createChat = async (chatData) => {
  try {
    const response = await api.post("/chat/initiate", {
      chattype: chatData.chattype,
      from: chatData.from,
      to: chatData.to,
      subject: chatData.subject,
    });

    // Adjust based on your API client's response structure
    // Most API clients return data directly in response.data
    return response.data || response;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

export const getChatDetails = async (userId, chatId, incUserid) => {
  try {
    const response = await api.post("/generic/getchatdetails", {
      userId: parseInt(userId),
      chatId: parseInt(chatId),
      incuserid: parseInt(incUserid), // Keeping the lowercase as in the original
    });

    // Adjust based on your API client's response structure
    // Most API clients return data directly in response.data
    return response.data?.data || [];
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

    const response = await api.post("/chat/send", requestBody);

    // Adjust based on your API client's response structure
    // Most API clients return data directly in response.data
    return response.data || response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const getUsers = async (userId, incUserid) => {
  try {
    const response = await fetch(`${API_BASE_URL}/resources/generic/getusers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        userid: userId,
        "X-Module": "Chat Module",
        "X-Action": "Fetching users",
      },
      body: JSON.stringify({
        userId: userId || null,
        userIncId: parseInt(incUserid) || null,
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
export const getChatTypes = async (userId, incUserid) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/resources/generic/getchattype`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          userid: userId,
          "X-Module": "Chat Module",
          "X-Action": "Fetching chat types",
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          incUserId: parseInt(incUserid),
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
export const getChatHistory = async (userId, incuserid) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/resources/generic/getchatdetails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          userid: userId,
          "X-Module": "Chat Module",
          "X-Action": "Fetching chat history",
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          incuserid: parseInt(incuserid),
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
