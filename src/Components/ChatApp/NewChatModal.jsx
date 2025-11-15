// src/components/NewChatModal.jsx
import React, { useState, useEffect, useRef } from "react";
import "./NewChatModal.css";
import { getUsers, createChat, getChatTypes } from "./chatService";
import { IPAdress } from "../Datafetching/IPAdrees";

const NewChatModal = ({ onClose, onChatCreated, currentUser }) => {
  // Define role IDs as constants for clarity
  const ROLE_IDS = {
    SUPERADMIN: 1,
    ADMIN: 2, // Assuming an admin role exists
    ADMIN_OPERATOR: 3,
    INCUBATEE_ADMIN: 4,
    INCUBATEE_MANAGER: 5,
    INCUBATEE_OPERATOR: 6,
  };

  const [chatType, setChatType] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [chatTypes, setChatTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [chatTypesLoading, setChatTypesLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userAssociations, setUserAssociations] = useState([]);
  const [spocs, setSpocs] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchChatTypes();
    fetchUsers();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchChatTypes = async () => {
    try {
      setChatTypesLoading(true);
      setError("");

      console.log("Current user for chat types:", currentUser);
      console.log(
        "Token exists for chat types:",
        !!sessionStorage.getItem("token")
      );

      const data = await getChatTypes(currentUser.id, currentUser.incUserid);
      console.log("Chat types data from API:", data);

      // If API returns no data for SUPERADMIN, provide default chat types
      if (
        data.length === 0 &&
        parseInt(currentUser.roleid) === ROLE_IDS.SUPERADMIN
      ) {
        console.log("No chat types from API, using defaults for SUPERADMIN");
        const defaultChatTypes = [
          {
            value: 1,
            text: "incubator to incubatee",
            chattypedescription: "incubator to incubatee",
          },
          {
            value: 3,
            text: "broadcast without reply",
            chattypedescription: "broadcast without reply",
          },
          {
            value: 4,
            text: "broadcast with reply public",
            chattypedescription: "broadcast with reply public",
          },
          {
            value: 5,
            text: "broadcast with reply private",
            chattypedescription: "broadcast with reply private",
          },
        ];
        setChatTypes(defaultChatTypes);
        setChatType("1"); // Set default to incubator to incubatee
      } else {
        setChatTypes(data);

        // Set default chat type based on user role
        if (data.length > 0) {
          const userRoleId = parseInt(currentUser.roleid);
          let defaultChatType = "";

          // If user is SUPERADMIN (roleid 1), use incubator to incubatee (type 1)
          if (userRoleId === ROLE_IDS.SUPERADMIN) {
            defaultChatType = "1"; // incubator to incubatee
          }
          // If user is ADMIN or ADMIN_OPERATOR (roleid 2 or 3), use incubator to incubatee (type 1)
          else if (
            userRoleId === ROLE_IDS.ADMIN ||
            userRoleId === ROLE_IDS.ADMIN_OPERATOR
          ) {
            defaultChatType = "1"; // incubator to incubatee
          }
          // If user is INCUBATEE_ADMIN/MANAGER/OPERATOR (roleid 4, 5, or 6), use incubatee to incubator (type 2)
          else if (
            userRoleId === ROLE_IDS.INCUBATEE_ADMIN ||
            userRoleId === ROLE_IDS.INCUBATEE_MANAGER ||
            userRoleId === ROLE_IDS.INCUBATEE_OPERATOR
          ) {
            defaultChatType = "2"; // incubatee to incubator
          }

          setChatType(defaultChatType);
        } else {
          console.log(
            "No chat types returned from API and user is not SUPERADMIN"
          );
          // Set a default chat type even if no data is returned
          const userRoleId = parseInt(currentUser.roleid);
          if (userRoleId === ROLE_IDS.SUPERADMIN) {
            setChatType("1"); // incubator to incubatee
          } else if (
            userRoleId === ROLE_IDS.ADMIN ||
            userRoleId === ROLE_IDS.ADMIN_OPERATOR
          ) {
            setChatType("1"); // incubator to incubatee
          } else if (
            userRoleId === ROLE_IDS.INCUBATEE_ADMIN ||
            userRoleId === ROLE_IDS.INCUBATEE_MANAGER ||
            userRoleId === ROLE_IDS.INCUBATEE_OPERATOR
          ) {
            setChatType("2"); // incubatee to incubator
          }
        }
      }
    } catch (error) {
      console.error("Error fetching chat types:", error);
      setError(`Failed to load chat types: ${error.message}`);

      // Set default chat types on error for SUPERADMIN
      if (parseInt(currentUser.roleid) === ROLE_IDS.SUPERADMIN) {
        const defaultChatTypes = [
          {
            value: 1,
            text: "incubator to incubatee",
            chattypedescription: "incubator to incubatee",
          },
          {
            value: 3,
            text: "broadcast without reply",
            chattypedescription: "broadcast without reply",
          },
          {
            value: 4,
            text: "broadcast with reply public",
            chattypedescription: "broadcast with reply public",
          },
          {
            value: 5,
            text: "broadcast with reply private",
            chattypedescription: "broadcast with reply private",
          },
        ];
        setChatTypes(defaultChatTypes);
        setChatType("1");
      }
    } finally {
      setChatTypesLoading(false);
    }
  };

  // New function to fetch user associations for admin operators
  const fetchUserAssociations = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(
        `${IPAdress}/itelinc/resources/generic/getuserasslist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            userid: currentUser.id,
            "X-Module": "Chat Module",
            "X-Action": "Fetching user associations for  operators",
          },
          body: JSON.stringify({
            userId: currentUser.id,
            incUserId: currentUser.incUserid,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching user associations:", error);
      throw error;
    }
  };

  // New function to fetch SPOCs (Single Points of Contact)
  const fetchSpocs = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(
        `${IPAdress}/itelinc/resources/generic/getspocs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            userid: currentUser.id,
            "X-Module": "Chat Module",
            "X-Action": "Fetching SPOCs for users",
          },
          body: JSON.stringify({
            userId: currentUser.id,
            incUserId: currentUser.incUserid,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("");
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching SPOCs:", error);
      // MODIFICATION: Return empty array instead of throwing error to prevent breaking the flow
      return [];
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setError("");

      console.log("Current user:", currentUser);
      console.log("Token exists:", !!sessionStorage.getItem("token"));

      const userRoleId = parseInt(currentUser.roleid);

      // If user is incubatee admin/manager/operator (roleid 4, 5, or 6), fetch both SPOCs and user associations
      if (
        userRoleId === ROLE_IDS.INCUBATEE_ADMIN ||
        userRoleId === ROLE_IDS.INCUBATEE_MANAGER ||
        userRoleId === ROLE_IDS.INCUBATEE_OPERATOR
      ) {
        // Get the incubatee ID of the current user
        const currentUserIncubateeId = currentUser.incubateesrecid;

        // Fetch all users first
        const allUsers = await getUsers(currentUser.id, currentUser.incUserid);

        // Create a map of user details for quick lookup
        const userMap = {};
        allUsers.forEach((user) => {
          userMap[user.usersrecid] = user;
        });

        // MODIFICATION: Fetch SPOCs with error handling
        let spocsData = [];
        try {
          spocsData = await fetchSpocs();
          setSpocs(spocsData);
        } catch (error) {
          console.error(
            "Failed to fetch SPOCs, continuing without them:",
            error
          );
          // Continue with empty spocsData
        }

        // MODIFICATION: Get ALL SPOCs (not just those associated with the same incubatee)
        const allSpocs = spocsData.filter((spoc) => {
          // Exclude the current user
          return spoc.usersrecid != currentUser.id;
        });

        // Combine SPOC data with user details
        const combinedSpocs = allSpocs.map((spoc) => {
          const userDetails = userMap[spoc.usersrecid];
          return {
            ...spoc,
            usersname: userDetails ? userDetails.usersname : spoc.usersname,
            rolesname: userDetails ? userDetails.rolesname : spoc.rolesname,
            userType: "SPOC",
            // Add any other fields needed from userDetails
          };
        });

        // MODIFICATION: Get ALL users with role ID 1 (SUPERADMIN) from the users list (no incubatee filter)
        const superAdminUsers = allUsers
          .filter((user) => {
            // Exclude the current user
            if (user.usersrecid == currentUser.id) return false;

            // Check if user has role ID 1 (no incubatee restriction)
            return user.usersrolesrecid === ROLE_IDS.SUPERADMIN;
          })
          .map((user) => ({
            ...user,
            userType: "SUPERADMIN",
            spoc_type: null, // Explicitly set spoc_type to null for non-SPOC users
          }));

        // Fetch user associations
        const associations = await fetchUserAssociations();
        setUserAssociations(associations);

        // Get all users associated with the same incubatee
        const associatedUsers = associations.filter((assoc) => {
          // Exclude the current user
          if (assoc.usersrecid == currentUser.id) return false;

          // Check if user is associated with the same incubatee
          return assoc.usrincassnincubateesrecid === currentUserIncubateeId;
        });

        // Combine associated users data with user details
        const combinedAssociatedUsers = associatedUsers.map((assoc) => {
          const userDetails = userMap[assoc.usersrecid];
          return {
            ...assoc,
            usersname: userDetails ? userDetails.usersname : assoc.usersname,
            rolesname: userDetails ? userDetails.rolesname : assoc.rolesname,
            userType: "Associated User",
            // Add any other fields needed from userDetails
          };
        });

        // Combine all users: ALL SPOCs, ALL SUPERADMIN users, and associated users
        const combinedUsers = [
          ...combinedSpocs,
          ...superAdminUsers,
          ...combinedAssociatedUsers,
        ];

        // Remove duplicates based on usersrecid
        const uniqueUsers = combinedUsers.filter(
          (user, index, self) =>
            index === self.findIndex((u) => u.usersrecid === user.usersrecid)
        );

        // Sort users to prioritize SUPERADMIN and SPOC users at the top
        const sortedUsers = uniqueUsers.sort((a, b) => {
          // Priority order: SUPERADMIN, SPOC, others
          const aPriority =
            a.userType === "SUPERADMIN" ? 1 : a.userType === "SPOC" ? 2 : 3;
          const bPriority =
            b.userType === "SUPERADMIN" ? 1 : b.userType === "SPOC" ? 2 : 3;

          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }

          // If same priority, sort by name
          return a.usersname.localeCompare(b.usersname);
        });

        setUsers(sortedUsers);
      }
      // If user is admin operator, fetch user associations first
      else if (userRoleId === ROLE_IDS.ADMIN_OPERATOR) {
        const associations = await fetchUserAssociations();
        setUserAssociations(associations);

        // Get all incubatee IDs associated with the admin operator
        const incubateeIds = [
          ...new Set(
            associations
              .filter((assoc) => assoc.usrincassnincubateesrecid)
              .map((assoc) => assoc.usrincassnincubateesrecid)
          ),
        ];

        console.log("Admin operator incubatee IDs:", incubateeIds);

        // Fetch all users
        const allUsers = await getUsers(currentUser.id, currentUser.incUserid);

        // Filter users to only include those associated with the same incubatees
        const filteredUsers = allUsers.filter((user) => {
          // Exclude the current user
          if (user.usersrecid == currentUser.id) return false;

          // Check if user is associated with any of the admin operator's incubatees
          return incubateeIds.includes(user.usersincubateesrecid);
        });

        setUsers(filteredUsers);
      } else if (userRoleId === ROLE_IDS.ADMIN) {
        // For ADMIN (roleid 2), fetch user associations and filter users
        const associations = await fetchUserAssociations();
        setUserAssociations(associations);

        // Get all incubatee IDs associated with the admin
        const incubateeIds = [
          ...new Set(
            associations
              .filter((assoc) => assoc.usrincassnincubateesrecid)
              .map((assoc) => assoc.usrincassnincubateesrecid)
          ),
        ];

        console.log("Admin incubatee IDs:", incubateeIds);

        // Fetch all users
        const allUsers = await getUsers(currentUser.id, currentUser.incUserid);

        // Filter users to only include those associated with the same incubatees
        const filteredUsers = allUsers.filter((user) => {
          // Exclude the current user
          if (user.usersrecid == currentUser.id) return false;

          // Check if user is associated with any of the admin's incubatees
          return incubateeIds.includes(user.usersincubateesrecid);
        });

        setUsers(filteredUsers);
      } else {
        // For other roles, use the existing logic
        const data = await getUsers(currentUser.id, currentUser.incUserid);

        // Filter users based on current user's role ID
        let filteredUsers = data.filter(
          (user) => user.usersrecid != currentUser.id
        );

        // If current user is an incubatee admin/manager/operator, show all admin users
        // that are associated with the same incubatee
        if (
          userRoleId === ROLE_IDS.INCUBATEE_ADMIN ||
          userRoleId === ROLE_IDS.INCUBATEE_MANAGER ||
          userRoleId === ROLE_IDS.INCUBATEE_OPERATOR
        ) {
          // Get the incubatee ID of the current user
          const currentUserIncubateeId = currentUser.incubateesrecid;

          // Filter users to include all admin users (roles 1, 2, 3) that are associated with the same incubatee
          filteredUsers = filteredUsers.filter((user) => {
            return (
              (user.usersrolesrecid === ROLE_IDS.SUPERADMIN ||
                user.usersrolesrecid === ROLE_IDS.ADMIN ||
                user.usersrolesrecid === ROLE_IDS.ADMIN_OPERATOR) &&
              user.usersincubateesrecid === currentUserIncubateeId
            );
          });
        }

        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // setError(`Failed to load users: ${error.message}`);
      setError(`${error.message}`);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserSelection = (userId) => {
    const selectedChatType = chatTypes.find(
      (type) => type.value.toString() === chatType
    );
    const userRoleId = parseInt(currentUser.roleid);

    // Check if this is a multi-select chat type and user is admin
    if (
      selectedChatType &&
      (selectedChatType.value === 3 ||
        selectedChatType.value === 4 ||
        selectedChatType.value === 5) &&
      (userRoleId === ROLE_IDS.SUPERADMIN ||
        userRoleId === ROLE_IDS.ADMIN ||
        userRoleId === ROLE_IDS.ADMIN_OPERATOR)
    ) {
      // Multi-select for group chats (only for admins)
      setSelectedUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
    } else {
      // Single selection for one-to-one chats
      setSelectedUsers([userId]);
      setDropdownOpen(false); // Close dropdown after selection for single-select
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    if (selectedUsers.length === 0) {
      setError("Please select at least one recipient");
      return;
    }

    setLoading(true);

    try {
      const userRoleId = parseInt(currentUser.roleid);

      // For group chats (types 3, 4, 5), create a separate chat for each recipient (only for admins)
      if (
        (chatType === "3" || chatType === "4" || chatType === "5") &&
        (userRoleId === ROLE_IDS.SUPERADMIN ||
          userRoleId === ROLE_IDS.ADMIN ||
          userRoleId === ROLE_IDS.ADMIN_OPERATOR)
      ) {
        const promises = selectedUsers.map((userId) => {
          const chatData = {
            chattype: parseInt(chatType),
            from: currentUser.id,
            to: parseInt(userId),
            subject: subject,
          };
          return createChat(chatData);
        });

        const results = await Promise.all(promises);
        onChatCreated(results[0]); // Return the first chat created
      } else {
        // For one-to-one chats, use the first selected user
        const chatData = {
          chattype: parseInt(chatType),
          from: currentUser.id,
          to: parseInt(selectedUsers[0]),
          subject: subject,
        };

        const newChat = await createChat(chatData);
        onChatCreated(newChat);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      setError(`Failed to create chat: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getChatTypeDescription = () => {
    const selectedChatType = chatTypes.find(
      (type) => type.value.toString() === chatType
    );
    const userRoleId = parseInt(currentUser.roleid);

    // For INCUBATEE_ADMIN/MANAGER/OPERATOR (roleid 4, 5, or 6), always show "one <-> one"
    if (
      userRoleId === ROLE_IDS.INCUBATEE_ADMIN ||
      userRoleId === ROLE_IDS.INCUBATEE_MANAGER ||
      userRoleId === ROLE_IDS.INCUBATEE_OPERATOR
    ) {
      return "one <-> one";
    }

    // For SUPERADMIN, ADMIN, ADMIN_OPERATOR (roleid 1, 2, 3)
    if (
      userRoleId === ROLE_IDS.SUPERADMIN ||
      userRoleId === ROLE_IDS.ADMIN ||
      userRoleId === ROLE_IDS.ADMIN_OPERATOR
    ) {
      // If the selected chat type is incubator -> incubatee (type 1), show "one <-> one"
      if (selectedChatType && selectedChatType.value === 1) {
        return "one <-> one";
      }
      // Handle broadcast types
      else if (selectedChatType && selectedChatType.value === 3) {
        return "broadcast without reply";
      } else if (selectedChatType && selectedChatType.value === 4) {
        return "broadcast with reply public";
      } else if (selectedChatType && selectedChatType.value === 5) {
        return "broadcast with reply private";
      }
      // For all other types, show the actual description from the API
      else if (selectedChatType) {
        return selectedChatType.chattypedescription;
      }
    }

    // Fallback
    return "";
  };

  const isMultiSelect = () => {
    const selectedChatType = chatTypes.find(
      (type) => type.value.toString() === chatType
    );
    const userRoleId = parseInt(currentUser.roleid);

    // Only allow multi-select for group chats if user is admin
    if (
      userRoleId === ROLE_IDS.SUPERADMIN ||
      userRoleId === ROLE_IDS.ADMIN ||
      userRoleId === ROLE_IDS.ADMIN_OPERATOR
    ) {
      return (
        selectedChatType &&
        (selectedChatType.value === 3 ||
          selectedChatType.value === 4 ||
          selectedChatType.value === 5)
      );
    }

    // Always return false for non-admin users
    return false;
  };

  const getSelectedUsersDisplay = () => {
    if (selectedUsers.length === 0)
      return isMultiSelect() ? "Select recipients" : "Select recipient";

    const selectedNames = selectedUsers
      .map((userId) => {
        const user = users.find((u) => u.usersrecid.toString() === userId);
        return user ? user.usersname : "";
      })
      .filter((name) => name);

    if (selectedNames.length === 0)
      return isMultiSelect() ? "Select recipients" : "Select recipient";

    if (selectedNames.length === 1) return selectedNames[0];
    return `${selectedNames.length} users selected`;
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Filter chat types based on user role ID
  const getAvailableChatTypes = () => {
    if (!currentUser) {
      console.log("No current user");
      return [];
    }

    const userRoleId = parseInt(currentUser.roleid);
    console.log("User role ID:", userRoleId);
    console.log("Chat types:", chatTypes);

    // If user is SUPERADMIN (roleid 1), show all chat types EXCEPT incubatee <-> incubator
    if (userRoleId === ROLE_IDS.SUPERADMIN) {
      const filteredTypes = chatTypes.filter((type) => type.value !== 2);
      console.log("Filtered chat types for SUPERADMIN:", filteredTypes);

      // If no types are left after filtering, create a default one
      if (filteredTypes.length === 0) {
        console.log(
          "No chat types available after filtering, creating default"
        );
        return [
          {
            value: 1,
            text: "incubator to incubatee",
            chattypedescription: "incubator to incubatee",
          },
        ];
      }

      return filteredTypes;
    }

    // If user is ADMIN or ADMIN_OPERATOR (roleid 2 or 3), show all chat types EXCEPT incubatee <-> incubator
    if (
      userRoleId === ROLE_IDS.ADMIN ||
      userRoleId === ROLE_IDS.ADMIN_OPERATOR
    ) {
      const filteredTypes = chatTypes.filter((type) => type.value !== 2);
      console.log(
        "Filtered chat types for ADMIN/ADMIN_OPERATOR:",
        filteredTypes
      );

      // If no types are left after filtering, create a default one
      if (filteredTypes.length === 0) {
        console.log(
          "No chat types available after filtering, creating default"
        );
        return [
          {
            value: 1,
            text: "incubator to incubatee",
            chattypedescription: "incubator to incubatee",
          },
        ];
      }

      return filteredTypes;
    }

    // If user is INCUBATEE_ADMIN/MANAGER/OPERATOR (roleid 4, 5, or 6), only show incubatee to incubator
    if (
      userRoleId === ROLE_IDS.INCUBATEE_ADMIN ||
      userRoleId === ROLE_IDS.INCUBATEE_MANAGER ||
      userRoleId === ROLE_IDS.INCUBATEE_OPERATOR
    ) {
      const filteredTypes = chatTypes.filter((type) => type.value === 2);
      console.log("Filtered chat types for INCUBATEE:", filteredTypes);

      // If no types are left after filtering, create a default one
      if (filteredTypes.length === 0) {
        console.log(
          "No chat types available after filtering, creating default"
        );
        return [
          {
            value: 2,
            text: "incubatee to incubator",
            chattypedescription: "incubatee to incubator",
          },
        ];
      }

      return filteredTypes;
    }

    // Default to empty array if role doesn't match
    return [];
  };

  // Get display text for chat type based on user role
  const getChatTypeDisplayText = (type) => {
    const userRoleId = parseInt(currentUser.roleid);

    // For INCUBATEE_ADMIN/MANAGER/OPERATOR (roleid 4, 5, or 6), always show "one <-> one"
    if (
      userRoleId === ROLE_IDS.INCUBATEE_ADMIN ||
      userRoleId === ROLE_IDS.INCUBATEE_MANAGER ||
      userRoleId === ROLE_IDS.INCUBATEE_OPERATOR
    ) {
      return "one <-> one";
    }

    // For SUPERADMIN, ADMIN, ADMIN_OPERATOR (roleid 1, 2, 3)
    if (
      userRoleId === ROLE_IDS.SUPERADMIN ||
      userRoleId === ROLE_IDS.ADMIN ||
      userRoleId === ROLE_IDS.ADMIN_OPERATOR
    ) {
      // If the chat type is incubator -> incubatee (type 1), show "one <-> one"
      if (type.value === 1) {
        return "one <-> one";
      }
      // Handle broadcast types
      else if (type.value === 3) {
        return "broadcast without reply";
      } else if (type.value === 4) {
        return "broadcast with reply public";
      } else if (type.value === 5) {
        return "broadcast with reply private";
      }
      // For all other types, show the actual text from the API
      else {
        return type.text;
      }
    }

    // Fallback, though this case shouldn't be reached if roles are handled correctly
    return type.text;
  };

  // Get incubatee name for a user
  const getIncubateeName = (user) => {
    if (!user || !user.usersincubateesrecid) return "";

    // Find the incubatee in user associations
    const association = userAssociations.find(
      (assoc) => assoc.usrincassnincubateesrecid === user.usersincubateesrecid
    );

    return association ? association.incubateesname : "";
  };

  // Check if current user is admin
  const isAdmin = () => {
    const userRoleId = parseInt(currentUser.roleid);
    return (
      userRoleId === ROLE_IDS.SUPERADMIN ||
      userRoleId === ROLE_IDS.ADMIN ||
      userRoleId === ROLE_IDS.ADMIN_OPERATOR
    );
  };

  // Get SPOC type for display
  const getSpocType = (user) => {
    if (!user || !user.spoc_type) return "";

    // Map spoc_type to readable text
    switch (user.spoc_type) {
      case "1":
        return "SPOC";
      case "2":
        return "Associate";
      default:
        return "";
    }
  };

  // Get user type for display
  const getUserType = (user) => {
    if (!user || !user.userType) return "";

    return user.userType;
  };

  // MODIFICATION: Enhanced user display to highlight SUPERADMIN and SPOC users
  const getUserDisplayClass = (user) => {
    if (user.userType === "SUPERADMIN") return "superadmin-user";
    if (user.userType === "SPOC") return "spoc-user";
    return "";
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create New Chat</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="new-chat-form">
          <div className="form-group">
            <label htmlFor="chat-type">Chat Type</label>
            {chatTypesLoading ? (
              <div className="loading-users">Loading chat types...</div>
            ) : (
              <>
                <select
                  id="chat-type"
                  value={chatType}
                  onChange={(e) => {
                    setChatType(e.target.value);
                    setSelectedUsers([]); // Reset selected users when type changes
                  }}
                >
                  {getAvailableChatTypes().length > 0 ? (
                    getAvailableChatTypes().map((type) => (
                      <option key={type.value} value={type.value}>
                        {getChatTypeDisplayText(type)}
                      </option>
                    ))
                  ) : (
                    <option value="">
                      No chat types available for your role
                    </option>
                  )}
                </select>
                {getAvailableChatTypes().length === 0 && !chatTypesLoading && (
                  <p
                    style={{
                      color: "red",
                      fontSize: "0.8em",
                      marginTop: "5px",
                    }}
                  >
                    Your role (ID: {currentUser.roleid}) does not have
                    permission to create chats.
                  </p>
                )}
              </>
            )}
            <p className="chat-type-description">{getChatTypeDescription()}</p>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter chat subject"
            />
          </div>

          <div className="form-group">
            <label>
              {isMultiSelect() ? "Select Recipients" : "Select Recipient"}
            </label>
            {usersLoading ? (
              <div className="loading-users">Loading users...</div>
            ) : (
              <div className="custom-dropdown" ref={dropdownRef}>
                <div
                  className={`dropdown-header ${dropdownOpen ? "open" : ""}`}
                  onClick={toggleDropdown}
                >
                  {getSelectedUsersDisplay()}
                  <span className="dropdown-arrow"></span>
                </div>
                {dropdownOpen && (
                  <div className="dropdown-list">
                    {users.map((user) => (
                      <div
                        key={user.usersrecid}
                        className={`dropdown-item ${
                          selectedUsers.includes(user.usersrecid.toString())
                            ? "selected"
                            : ""
                        } ${getUserDisplayClass(user)}`}
                        onClick={() =>
                          handleUserSelection(user.usersrecid.toString())
                        }
                      >
                        {isMultiSelect() && (
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(
                              user.usersrecid.toString()
                            )}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className="user-info">
                          <span className="user-name">{user.usersname}</span>
                          <span className="user-role">({user.rolesname})</span>
                          {(parseInt(currentUser.roleid) ===
                            ROLE_IDS.INCUBATEE_ADMIN ||
                            parseInt(currentUser.roleid) ===
                              ROLE_IDS.INCUBATEE_MANAGER ||
                            parseInt(currentUser.roleid) ===
                              ROLE_IDS.INCUBATEE_OPERATOR) && (
                            <>
                              <span className="user-type">
                                {getUserType(user) && ` - ${getUserType(user)}`}
                              </span>
                              <span className="spoc-type">
                                {getSpocType(user) && ` (${getSpocType(user)})`}
                              </span>
                            </>
                          )}
                          {(parseInt(currentUser.roleid) ===
                            ROLE_IDS.ADMIN_OPERATOR ||
                            parseInt(currentUser.roleid) ===
                              ROLE_IDS.ADMIN) && (
                            <span className="incubatee-name">
                              {getIncubateeName(user) &&
                                ` - ${getIncubateeName(user)}`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Chat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewChatModal;
