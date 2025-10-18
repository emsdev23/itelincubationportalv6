import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaSpinner,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import "./UserTable.css";

export default function UserTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const IP = "http://121.242.232.212:8086";
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  const [incubatees, setIncubatees] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Sorting states
  const [sortColumn, setSortColumn] = useState("sno");
  const [sortDirection, setSortDirection] = useState("asc");

  // Loading states for operations
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(null); // Store user ID being updated
  const [isDeleting, setIsDeleting] = useState(null); // Store user ID being deleted

  // Define the role IDs that are allowed to select an incubatee
  // Change these IDs if they are different in your system
  const INCUBATEE_ROLE_IDS = [4, 5, 6]; // Assuming IDs for incubateeadmin, incubateemanager, incubateeoperator

  // Function to map role ID to the correct role name
  const getRoleName = (roleId) => {
    const roleMap = {
      1: "Incubator admin",
      2: "Incubator manager",
      3: "Incubator operator",
      4: "Incubatee admin",
      5: "Incubatee manager",
      6: "Incubatee operator",
      7: "DDI admin",
      8: "DDI manager",
    };
    return roleMap[roleId] || "Unknown Role";
  };

  // Function to filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.usersname.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Function to handle sorting
  const handleSort = (column) => {
    // If clicking the same column, toggle direction
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new column, set it and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort the filtered users based on the current sort column and direction
  const sortedUsers = useMemo(() => {
    if (!filteredUsers.length) return [];

    return [...filteredUsers].sort((a, b) => {
      let aValue, bValue;

      // Get the values to compare based on the column
      switch (sortColumn) {
        case "sno":
          aValue = filteredUsers.indexOf(a);
          bValue = filteredUsers.indexOf(b);
          break;
        case "usersname":
          aValue = a.usersname || "";
          bValue = b.usersname || "";
          break;
        case "usersemail":
          aValue = a.usersemail || "";
          bValue = b.usersemail || "";
          break;
        case "usersrolesrecid":
          aValue = getRoleName(a.usersrolesrecid);
          bValue = getRoleName(b.usersrolesrecid);
          break;
        case "userscreatedtime":
          aValue = a.userscreatedtime
            ? new Date(a.userscreatedtime)
            : new Date(0);
          bValue = b.userscreatedtime
            ? new Date(b.userscreatedtime)
            : new Date(0);
          break;
        case "usersmodifiedtime":
          aValue = a.usersmodifiedtime
            ? new Date(a.usersmodifiedtime)
            : new Date(0);
          bValue = b.usersmodifiedtime
            ? new Date(b.usersmodifiedtime)
            : new Date(0);
          break;
        case "userscreatedby":
          aValue = a.userscreatedby || "";
          bValue = b.userscreatedby || "";
          break;
        case "usersmodifiedby":
          aValue = a.usersmodifiedby || "";
          bValue = b.usersmodifiedby || "";
          break;
        default:
          return 0;
      }

      // Compare the values
      if (typeof aValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        // For numbers and dates
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });
  }, [filteredUsers, sortColumn, sortDirection]);

  // Function to get the appropriate sort icon for a column
  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <FaSort className="sort-icon" />;
    }
    return sortDirection === "asc" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  // ✅ Fetch all users
  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    fetch(`${IP}/itelinc/resources/generic/getusers`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          setUsers(data.data || []);
          setFilteredUsers(data.data || []);
        } else {
          throw new Error(data.message || "Failed to fetch users");
        }
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  // ✅ Fetch roles for dropdown
  const fetchRoles = () => {
    return fetch(`${IP}/itelinc/resources/generic/getrolelist`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          // Map the roles to ensure correct display names
          const mappedRoles = (data.data || []).map((role) => ({
            ...role,
            text: getRoleName(role.value),
          }));
          setRoles(mappedRoles);
          return mappedRoles;
        } else {
          throw new Error(data.message || "Failed to fetch roles");
        }
      })
      .catch((err) => {
        console.error("Error fetching roles:", err);
        Swal.fire("❌ Error", "Failed to load roles", "error");
        return [];
      });
  };

  // ✅ Fetch incubatees for dropdown
  const fetchIncubatees = () => {
    return fetch(`${IP}/itelinc/resources/generic/getinclist`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          setIncubatees(data.data || []);
          return data.data || [];
        } else {
          throw new Error(data.message || "Failed to fetch incubatees");
        }
      })
      .catch((err) => {
        console.error("Error fetching incubatees:", err);
        Swal.fire("❌ Error", "Failed to load incubatees", "error");
        return [];
      });
  };

  // ✅ Fetch all required data
  useEffect(() => {
    fetchUsers();
    // Load dropdown data on component mount
    setDropdownsLoading(true);
    Promise.all([fetchRoles(), fetchIncubatees()])
      .then(() => setDropdownsLoading(false))
      .catch(() => setDropdownsLoading(false));
  }, []);

  // ✅ Delete user
  const handleDelete = (user) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${user.usersname}. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(user.usersrecid);
        const deleteUrl = `${IP}/itelinc/deleteUser?usersmodifiedby=${
          userId || "system"
        }&usersrecid=${user.usersrecid}`;

        fetch(deleteUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire(
                "Deleted!",
                `${user.usersname} has been deleted successfully.`,
                "success"
              );
              fetchUsers(); // Refresh the user list
            } else {
              throw new Error(data.message || "Failed to delete user");
            }
          })
          .catch((err) => {
            console.error("Error deleting user:", err);
            Swal.fire(
              "Error",
              `Failed to delete ${user.usersname}: ${err.message}`,
              "error"
            );
          })
          .finally(() => {
            setIsDeleting(null);
          });
      }
    });
  };

  // ✅ Add new user
  const handleAddUser = async () => {
    // Check if dropdown data is loaded, if not, wait for it
    if (dropdownsLoading || roles.length === 0) {
      Swal.fire({
        title: "Loading...",
        text: "Please wait while we load the required data",
        icon: "info",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
      });

      try {
        await Promise.all([fetchRoles(), fetchIncubatees()]);
        setDropdownsLoading(false);
        Swal.close();
      } catch (error) {
        Swal.close();
        Swal.fire("❌ Error", "Failed to load dropdown data", "error");
        return;
      }
    }

    // Create role dropdown HTML with mapped role names
    const roleOptions = roles
      .map((role) => `<option value="${role.value}">${role.text}</option>`)
      .join("");

    // Create incubatee dropdown HTML with "Select incubatee" as placeholder
    const incubateeOptions = [
      `<option value="" disabled selected>Select incubatee</option>`,
      ...incubatees.map(
        (incubatee) =>
          `<option value="${incubatee.incubateesrecid}">${incubatee.incubateesname}</option>`
      ),
    ].join("");

    Swal.fire({
      title: "Add New User",
      html: `
        <div class="swal-form-container">
          <div class="swal-form-row">
            <input id="swal-name" class="swal2-input" placeholder="Name" required>
          </div>
          <div class="swal-form-row">
            <input id="swal-email" class="swal2-input" placeholder="Email" required>
          </div>
          <div class="swal-form-row">
            <input id="swal-password" type="password" class="swal2-input" placeholder="Password" required>
          </div>
          <div class="swal-form-row">
            <select id="swal-role" class="swal2-select" required>
              <option value="" disabled selected>Select a role</option>
              ${roleOptions}
            </select>
          </div>
          <div class="swal-form-row">
            <select id="swal-incubatee" class="swal2-select" disabled>
              ${incubateeOptions}
            </select>
          </div>
        </div>
      `,
      width: "600px",
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const name = document.getElementById("swal-name");
        const email = document.getElementById("swal-email");
        const password = document.getElementById("swal-password");
        const role = document.getElementById("swal-role");
        const incubatee = document.getElementById("swal-incubatee");

        if (!name || !email || !password || !role || !incubatee) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }

        if (!name.value || !email.value || !password.value || !role.value) {
          Swal.showValidationMessage("Please fill all required fields");
          return false;
        }

        return {
          usersname: name.value,
          usersemail: email.value,
          userspassword: password.value,
          usersrolesrecid: role.value,
          usersincubateesrecid: incubatee.value || null, // Send null if nothing is selected
        };
      },
      didOpen: () => {
        // Add custom CSS for better styling
        const style = document.createElement("style");
        style.textContent = `
          .swal-form-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .swal-form-row {
            width: 100%;
          }
          .swal2-input, .swal2-select {
            width: 100% !important;
            margin: 0 !important;
          }
          .swal2-select {
            padding: 0.75em !important;
          }
          select:disabled {
            background-color: #f8f9fa;
            cursor: not-allowed;
            opacity: 0.8;
          }
        `;
        document.head.appendChild(style);

        // Add event listener to role dropdown to enable/disable incubatee dropdown
        const roleSelect = document.getElementById("swal-role");
        const incubateeSelect = document.getElementById("swal-incubatee");

        const toggleIncubateeDropdown = () => {
          const selectedRole = parseInt(roleSelect.value);
          // Enable incubatee dropdown if role ID is in the allowed list
          if (INCUBATEE_ROLE_IDS.includes(selectedRole)) {
            incubateeSelect.disabled = false;
          } else {
            incubateeSelect.disabled = true;
            incubateeSelect.value = ""; // Reset selection when disabled
          }
        };

        roleSelect.addEventListener("change", toggleIncubateeDropdown);
        // Initial check
        toggleIncubateeDropdown();
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const formData = result.value;
        setIsAdding(true);

        // Build URL with query parameters for adding user
        const params = new URLSearchParams();
        params.append("usersemail", formData.usersemail);
        params.append("userspassword", formData.userspassword);
        params.append("usersname", formData.usersname);
        params.append("usersrolesrecid", formData.usersrolesrecid);
        params.append("usersadminstate", "1");
        params.append("userscreatedby", userId || "system");
        params.append("usersmodifiedby", userId || "system");

        // Only add incubateesrecid if it's not null or empty
        if (formData.usersincubateesrecid) {
          params.append("usersincubateesrecid", formData.usersincubateesrecid);
        }

        const addUrl = `${IP}/itelinc/addUser?${params.toString()}`;
        fetch(addUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire("✅ Success", "User added successfully", "success");
              fetchUsers();
            } else {
              Swal.fire(
                "❌ Error",
                data.message || "Failed to add user",
                "error"
              );
            }
          })
          .catch((err) => {
            console.error("Error adding user:", err);
            if (
              err.name === "TypeError" &&
              err.message.includes("Failed to fetch")
            ) {
              Swal.fire(
                "❌ CORS Error",
                "Unable to connect to the server. This might be a CORS issue. Please contact your system administrator.",
                "error"
              );
            } else {
              Swal.fire(
                "❌ Error",
                err.message || "Something went wrong",
                "error"
              );
            }
          })
          .finally(() => {
            setIsAdding(false);
          });
      }
    });
  };

  // ✅ Edit user with popup form
  const handleEdit = async (user) => {
    // Check if dropdown data is loaded, if not, wait for it
    if (dropdownsLoading || roles.length === 0 || incubatees.length === 0) {
      Swal.fire({
        title: "Loading...",
        text: "Please wait while we load the required data",
        icon: "info",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
      });

      try {
        await Promise.all([fetchRoles(), fetchIncubatees()]);
        setDropdownsLoading(false);
        Swal.close();
      } catch (error) {
        Swal.close();
        Swal.fire("❌ Error", "Failed to load dropdown data", "error");
        return;
      }
    }

    // Create role dropdown HTML with mapped role names
    const roleOptions = roles
      .map(
        (role) =>
          `<option value="${role.value}" ${
            user.usersrolesrecid == role.value ? "selected" : ""
          }>${role.text}</option>`
      )
      .join("");

    // Create incubatee dropdown HTML with "Select incubatee" as placeholder
    const incubateeOptions = [
      `<option value="" ${
        !user.usersincubateesrecid ? "selected" : ""
      }>Select incubatee</option>`,
      ...incubatees.map(
        (incubatee) =>
          `<option value="${incubatee.incubateesrecid}" ${
            user.usersincubateesrecid == incubatee.incubateesrecid
              ? "selected"
              : ""
          }>${incubatee.incubateesname}</option>`
      ),
    ].join("");

    Swal.fire({
      title: "Edit User",
      html: `
        <div class="swal-form-container">
          <div class="swal-form-row">
            <input id="swal-name" class="swal2-input" placeholder="Name" value="${
              user.usersname || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-email" class="swal2-input" placeholder="Email" value="${
              user.usersemail || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-password" type="password" class="swal2-input" placeholder="Password" value="${
              user.userspassword || ""
            }" readonly>
          </div>
          <div class="swal-form-row">
            <select id="swal-role" class="swal2-select">
              ${roleOptions}
            </select>
          </div>
          <div class="swal-form-row">
            <select id="swal-incubatee" class="swal2-select" ${
              !INCUBATEE_ROLE_IDS.includes(parseInt(user.usersrolesrecid))
                ? "disabled"
                : ""
            }>
              ${incubateeOptions}
            </select>
          </div>
        </div>
      `,
      width: "600px", // Make the popup wider
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        // Get all form values
        const name = document.getElementById("swal-name");
        const email = document.getElementById("swal-email");
        const password = document.getElementById("swal-password");
        const role = document.getElementById("swal-role");
        const incubatee = document.getElementById("swal-incubatee");

        // Validate that all elements exist
        if (!name || !email || !password || !role || !incubatee) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }

        return {
          usersname: name.value,
          usersemail: email.value,
          userspassword: password.value, // Password is included but not editable
          usersrolesrecid: role.value,
          usersincubateesrecid: incubatee.value || null, // Send null if nothing is selected
        };
      },
      didOpen: () => {
        // Add custom CSS for better styling
        const style = document.createElement("style");
        style.textContent = `
          .swal-form-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .swal-form-row {
            width: 100%;
          }
          .swal2-input, .swal2-select {
            width: 100% !important;
            margin: 0 !important;
          }
          .swal2-select {
            padding: 0.75em !important;
          }
          input[readonly] {
            background-color: #f8f9fa;
            cursor: not-allowed;
            opacity: 0.8;
          }
          select:disabled {
            background-color: #f8f9fa;
            cursor: not-allowed;
            opacity: 0.8;
          }
        `;
        document.head.appendChild(style);

        // Add event listener to role dropdown to enable/disable incubatee dropdown
        const roleSelect = document.getElementById("swal-role");
        const incubateeSelect = document.getElementById("swal-incubatee");

        const toggleIncubateeDropdown = () => {
          const selectedRole = parseInt(roleSelect.value);
          // Enable incubatee dropdown if role ID is in the allowed list
          if (INCUBATEE_ROLE_IDS.includes(selectedRole)) {
            incubateeSelect.disabled = false;
          } else {
            incubateeSelect.disabled = true;
            incubateeSelect.value = ""; // Reset selection when disabled
          }
        };

        roleSelect.addEventListener("change", toggleIncubateeDropdown);
        // Initial check
        toggleIncubateeDropdown();
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const formData = result.value;
        setIsUpdating(user.usersrecid);

        // ✅ Build URL with query parameters
        const params = new URLSearchParams();
        params.append("usersemail", formData.usersemail);
        params.append("usersname", formData.usersname);
        params.append("usersrolesrecid", formData.usersrolesrecid);
        params.append("userspassword", formData.userspassword); // Always include the password
        params.append("usersadminstate", "1");
        params.append("usersmodifiedby", userId);
        params.append("usersrecid", user.usersrecid);

        // Only add incubateesrecid if it's not null or empty
        if (formData.usersincubateesrecid) {
          params.append("usersincubateesrecid", formData.usersincubateesrecid);
        }

        const updateUrl = `${IP}/itelinc/updateUser?${params.toString()}`;
        fetch(updateUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire("✅ Success", "User updated successfully", "success");
              fetchUsers();
            } else {
              Swal.fire(
                "❌ Error",
                data.message || "Failed to update user",
                "error"
              );
            }
          })
          .catch((err) => {
            console.error("Error updating user:", err);
            if (
              err.name === "TypeError" &&
              err.message.includes("Failed to fetch")
            ) {
              Swal.fire(
                "❌ CORS Error",
                "Unable to connect to the server. This might be a CORS issue. Please contact your system administrator.",
                "error"
              );
            } else {
              Swal.fire("❌ Error", "Something went wrong", "error");
            }
          })
          .finally(() => {
            setIsUpdating(null);
          });
      }
    });
  };

  // Function to check if delete should be disabled for a user
  const shouldDisableDelete = (user) => {
    return user.usersrolesrecid === 4 || user.usersrolesrecid === 1;
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="doccat-container">
      <div className="doccat-header">
        <h2 className="doccat-title">👤 Users</h2>
        <div className="header-actions">
          <div className="search-container">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={clearSearch}>
                  ×
                </button>
              )}
            </div>
          </div>
          <button
            className="btn-add-user"
            onClick={handleAddUser}
            disabled={isAdding}
          >
            {isAdding ? (
              <>
                <FaSpinner className="spinner" size={16} /> Adding...
              </>
            ) : (
              <>
                <FaPlus size={16} /> Add User
              </>
            )}
          </button>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <p className="doccat-empty">Loading users...</p>
      ) : (
        <div className="doccat-table-wrapper">
          <table className="doccat-table">
            <thead>
              <tr>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("sno")}
                >
                  S.No {getSortIcon("sno")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("usersname")}
                >
                  Name {getSortIcon("usersname")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("usersemail")}
                >
                  Email {getSortIcon("usersemail")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("usersrolesrecid")}
                >
                  Role Name {getSortIcon("usersrolesrecid")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("userscreatedtime")}
                >
                  Created Time {getSortIcon("userscreatedtime")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("usersmodifiedtime")}
                >
                  Modified Time {getSortIcon("usersmodifiedtime")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("userscreatedby")}
                >
                  Created By {getSortIcon("userscreatedby")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("usersmodifiedby")}
                >
                  Modified By {getSortIcon("usersmodifiedby")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length > 0 ? (
                sortedUsers.map((user, idx) => (
                  <tr key={user.usersrecid || idx}>
                    <td>{users.indexOf(user) + 1}</td>
                    <td>{user.usersname}</td>
                    <td>{user.usersemail}</td>
                    <td>{getRoleName(user.usersrolesrecid)}</td>
                    <td>{user.userscreatedtime?.replace("T", " ")}</td>
                    <td>{user.usersmodifiedtime?.replace("T", " ")}</td>
                    <td>{user.userscreatedby}</td>
                    <td>{user.usersmodifiedby}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(user)}
                        disabled={
                          isUpdating === user.usersrecid ||
                          isDeleting === user.usersrecid
                        }
                      >
                        {isUpdating === user.usersrecid ? (
                          <FaSpinner className="spinner" size={18} />
                        ) : (
                          <FaEdit size={18} />
                        )}
                      </button>
                      <button
                        className={`btn-delete ${
                          shouldDisableDelete(user) ? "disabled" : ""
                        }`}
                        onClick={() => handleDelete(user)}
                        disabled={
                          isDeleting === user.usersrecid ||
                          isUpdating === user.usersrecid ||
                          shouldDisableDelete(user)
                        }
                        title={
                          shouldDisableDelete(user)
                            ? "Cannot delete users with role ID 1 or 4"
                            : ""
                        }
                      >
                        {isDeleting === user.usersrecid ? (
                          <FaSpinner className="spinner" size={18} />
                        ) : (
                          <FaTrash size={18} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="doccat-empty">
                    {searchQuery
                      ? "No users found matching your search"
                      : "No users found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading overlay for operations */}
      {(isAdding || isUpdating !== null || isDeleting !== null) && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <FaSpinner className="spinner" size={40} />
            <p>
              {isAdding
                ? "Adding user..."
                : isUpdating !== null
                ? "Updating user..."
                : "Deleting user..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
