import React, { useState, useEffect, useMemo } from "react";
import {
  FaTrash,
  FaEdit,
  FaUsers,
  FaTimes,
  FaPlus,
  FaSpinner,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "./UserAssociationTable.css";
import { IPAdress } from "../Datafetching/IPAdrees";
export default function UserAssociationTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incUserid");
  const IP = IPAdress;

  const [associations, setAssociations] = useState([]);
  const [incubatees, setIncubatees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedIncubatees, setSelectedIncubatees] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showNewAssociationModal, setShowNewAssociationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedIncubateesForNew, setSelectedIncubateesForNew] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // New state for search

  // Sorting states
  const [sortColumn, setSortColumn] = useState("usersname");
  const [sortDirection, setSortDirection] = useState("asc");

  // Fetch user associations
  const fetchAssociations = () => {
    setLoading(true);
    setError(null);

    fetch(`${IP}/itelinc/resources/generic/getuserasslist`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
        incUserId: incUserid,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.statusCode === 200) {
          setAssociations(data.data || []);
        } else {
          throw new Error(data.message || "Failed to fetch user associations");
        }
      })
      .catch((err) => {
        console.error("Error fetching user associations:", err);
        setError("Failed to load user associations. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  // Fetch incubatees list
  const fetchIncubatees = () => {
    fetch(`${IP}/itelinc/resources/generic/getinclist`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
        incUserId: incUserid,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.statusCode === 200) {
          setIncubatees(data.data || []);
        } else {
          throw new Error(data.message || "Failed to fetch incubatees");
        }
      })
      .catch((err) => {
        console.error("Error fetching incubatees:", err);
        Swal.fire("❌ Error", "Failed to load incubatees", "error");
      });
  };

  // Fetch users list
  const fetchUsers = () => {
    fetch(`${IP}/itelinc/resources/generic/getusers`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
        userIncId: incUserid,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.statusCode === 200) {
          setUsers(data.data || []);
        } else {
          throw new Error(data.message || "Failed to fetch users");
        }
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        Swal.fire("❌ Error", "Failed to load users", "error");
      });
  };

  useEffect(() => {
    fetchAssociations();
    fetchIncubatees();
    fetchUsers();
  }, []);

  // Normalize the associations data to handle both associated and unassociated users
  const normalizedData = useMemo(() => {
    const userMap = {};

    associations.forEach((item) => {
      if (item.usrincassnrecid) {
        const userId = item.usrincassnusersrecid;
        if (!userMap[userId]) {
          userMap[userId] = {
            usersrecid: userId,
            usersname: item.usersname,
            userscreatedby: item.userscreatedby,
            associations: [],
          };
        }
        userMap[userId].associations.push({
          usrincassnrecid: item.usrincassnrecid,
          incubateesname: item.incubateesname,
          usrincassncreatedtime: item.usrincassncreatedtime,
          usrincassncreatedbyname: item.usrincassncreatedby,
          usrincassnmodifiedtime: item.usrincassnmodifiedtime,
          usrincassnincubateesrecid: item.usrincassnincubateesrecid,
        });
      } else {
        const userId = item.usersrecid;
        if (!userMap[userId]) {
          userMap[userId] = {
            usersrecid: userId,
            usersname: item.usersname,
            userscreatedby: item.userscreatedby || "N/A",
            associations: [],
          };
        }
      }
    });

    return Object.values(userMap);
  }, [associations]);

  // Filter normalized data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return normalizedData;
    }

    const query = searchQuery.toLowerCase();
    return normalizedData.filter((user) =>
      user.usersname.toLowerCase().includes(query)
    );
  }, [normalizedData, searchQuery]);

  // Sort the filtered data based on the current sort column and direction
  const sortedData = useMemo(() => {
    if (!filteredData.length) return [];

    return [...filteredData].sort((a, b) => {
      let aValue, bValue;

      // Get the values to compare based on the column
      switch (sortColumn) {
        case "usersname":
          aValue = a.usersname || "";
          bValue = b.usersname || "";
          break;
        case "userscreatedby":
          aValue = a.userscreatedby || "";
          bValue = b.userscreatedby || "";
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
  }, [filteredData, sortColumn, sortDirection]);

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

  // Start editing a user's incubatees
  const startEditing = (user) => {
    setEditingUserId(user.usersrecid);
    const userIncubatees = user.associations.map(
      (assoc) => assoc.usrincassnincubateesrecid
    );
    setSelectedIncubatees(userIncubatees);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingUserId(null);
    setSelectedIncubatees([]);
  };

  // Cancel new association
  const cancelNewAssociation = () => {
    setShowNewAssociationModal(false);
    setSelectedUser("");
    setSelectedIncubateesForNew([]);
  };

  // Handle checkbox change for edit modal
  const handleCheckboxChange = (incubateeId) => {
    setSelectedIncubatees((prev) => {
      if (prev.includes(incubateeId)) {
        return prev.filter((id) => id !== incubateeId);
      } else {
        return [...prev, incubateeId];
      }
    });
  };

  // Handle checkbox change for new association modal
  const handleNewCheckboxChange = (incubateeId) => {
    setSelectedIncubateesForNew((prev) => {
      if (prev.includes(incubateeId)) {
        return prev.filter((id) => id !== incubateeId);
      } else {
        return [...prev, incubateeId];
      }
    });
  };

  // Handle user selection for new association
  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  // Update user associations
  const updateAssociations = () => {
    if (!editingUserId) return;

    setUpdateLoading(true);

    const currentUserAssociations = associations.filter(
      (assoc) => assoc.usrincassnusersrecid === editingUserId
    );

    const currentIncubateeIds = currentUserAssociations.map(
      (assoc) => assoc.usrincassnincubateesrecid
    );

    const toAdd = selectedIncubatees.filter(
      (id) => !currentIncubateeIds.includes(id)
    );
    const toRemove = currentUserAssociations.filter(
      (assoc) => !selectedIncubatees.includes(assoc.usrincassnincubateesrecid)
    );

    const addPromises = toAdd.map((incubateeId) => {
      const url = `${IP}/itelinc/addUserIncubationAssociation?usrincassnusersrecid=${editingUserId}&usrincassnincubateesrecid=${incubateeId}&usrincassncreatedby=${
        userId || "1"
      }&usrincassnmodifiedby=${userId || "1"}&usrincassnadminstate=1`;

      return fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.statusCode !== 200) {
            throw new Error(data.message || "Failed to add association");
          }
          return { success: true, incubateeId, action: "add" };
        })
        .catch((error) => {
          return {
            success: false,
            incubateeId,
            action: "add",
            error: error.message,
          };
        });
    });

    const removePromises = toRemove.map((association) => {
      const url = `${IP}/itelinc/deleteUserIncubationAssociation?usrincassnmodifiedby=${
        userId || "1"
      }&usrincassnrecid=${association.usrincassnrecid}`;

      return fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.statusCode !== 200) {
            throw new Error(data.message || "Failed to remove association");
          }
          return {
            success: true,
            associationId: association.usrincassnrecid,
            action: "remove",
          };
        })
        .catch((error) => {
          return {
            success: false,
            associationId: association.usrincassnrecid,
            action: "remove",
            error: error.message,
          };
        });
    });

    const allPromises = [...addPromises, ...removePromises];

    Promise.all(allPromises)
      .then((results) => {
        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        if (failed.length === 0) {
          Swal.fire(
            "✅ Success",
            "User associations updated successfully!",
            "success"
          );
          fetchAssociations();
          cancelEditing();
        } else if (successful.length > 0) {
          const errorMessages = failed
            .map((f) => {
              if (f.action === "add") {
                return `Failed to add incubatee ${f.incubateeId}: ${f.error}`;
              } else {
                return `Failed to remove association ${f.associationId}: ${f.error}`;
              }
            })
            .join("<br>");

          Swal.fire({
            title: "⚠️ Partial Success",
            html: `${successful.length} operations succeeded, but ${failed.length} failed.<br><br>${errorMessages}`,
            icon: "warning",
          });
          fetchAssociations();
          cancelEditing();
        } else {
          const errorMessages = failed
            .map((f) => {
              if (f.action === "add") {
                return `Failed to add incubatee ${f.incubateeId}: ${f.error}`;
              } else {
                return `Failed to remove association ${f.associationId}: ${f.error}`;
              }
            })
            .join("<br>");

          Swal.fire({
            title: "❌ Error",
            html: `All operations failed.<br><br>${errorMessages}`,
            icon: "error",
          });
        }
      })
      .catch((err) => {
        console.error("Error updating user associations:", err);
        Swal.fire("❌ Error", "Failed to update user associations", "error");
      })
      .finally(() => {
        setUpdateLoading(false);
      });
  };

  // Create new user association
  const createNewAssociation = () => {
    if (!selectedUser || selectedIncubateesForNew.length === 0) {
      Swal.fire(
        "❌ Error",
        "Please select a user and at least one incubatee",
        "error"
      );
      return;
    }

    setUpdateLoading(true);

    const promises = selectedIncubateesForNew.map((incubateeId) => {
      const url = `${IP}/itelinc/addUserIncubationAssociation?usrincassnusersrecid=${selectedUser}&usrincassnincubateesrecid=${incubateeId}&usrincassncreatedby=${
        userId || "1"
      }&usrincassnmodifiedby=${userId || "1"}&usrincassnadminstate=1`;

      return fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.statusCode !== 200) {
            throw new Error(data.message || "Failed to create association");
          }
          return { success: true, incubateeId };
        })
        .catch((error) => {
          return { success: false, incubateeId, error: error.message };
        });
    });

    Promise.all(promises)
      .then((results) => {
        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        if (failed.length === 0) {
          Swal.fire(
            "✅ Success",
            "All user associations created successfully!",
            "success"
          );
          fetchAssociations();
          cancelNewAssociation();
        } else if (successful.length > 0) {
          const errorMessages = failed
            .map((f) => `Incubatee ${f.incubateeId}: ${f.error}`)
            .join("<br>");
          Swal.fire({
            title: "⚠️ Partial Success",
            html: `${successful.length} associations created successfully, but ${failed.length} failed.<br><br>${errorMessages}`,
            icon: "warning",
          });
          fetchAssociations();
          cancelNewAssociation();
        } else {
          const errorMessages = failed
            .map((f) => `Incubatee ${f.incubateeId}: ${f.error}`)
            .join("<br>");
          Swal.fire({
            title: "❌ Error",
            html: `Failed to create any user associations.<br><br>${errorMessages}`,
            icon: "error",
          });
        }
      })
      .catch((err) => {
        console.error("Error creating user associations:", err);
        Swal.fire("❌ Error", "Failed to create user associations", "error");
      })
      .finally(() => {
        setUpdateLoading(false);
      });
  };

  // Delete association
  const handleDelete = (associationId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This association will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      showLoaderOnConfirm: true,
      preConfirm: () => {
        setIsDeleting(true);
        const url = `${IP}/itelinc/deleteUserIncubationAssociation?usrincassnmodifiedby=${
          userId || "1"
        }&usrincassnrecid=${associationId}`;

        return fetch(url, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            if (data.statusCode === 200) {
              return data;
            } else {
              throw new Error(data.message || "Failed to delete association");
            }
          })
          .catch((error) => {
            Swal.showValidationMessage(`Request failed: ${error.message}`);
          })
          .finally(() => {
            setIsDeleting(false);
          });
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Deleted!", "Association deleted successfully!", "success");
        fetchAssociations();
      }
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="user-association-container">
      <div className="user-association-header">
        <h1 className="user-association-title">
          <FaUsers style={{ marginRight: "8px" }} />
          Operator–Incubatee Associations list
        </h1>
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
                <FaTimes size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p className="user-association-empty">Loading user associations...</p>
      ) : (
        <div className="table-container">
          <table className="association-table">
            <thead>
              <tr>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("usersname")}
                >
                  Name {getSortIcon("usersname")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("userscreatedby")}
                >
                  Created By {getSortIcon("userscreatedby")}
                </th>
                <th>Companies</th>
                <th>Associated By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((user) => {
                const hasAssociations = user.associations.length > 0;
                const rowCount = Math.max(1, user.associations.length);

                return (
                  <React.Fragment key={user.usersrecid}>
                    {Array.from({ length: rowCount }).map((_, index) => (
                      <tr
                        key={`${user.usersrecid}-${index}`}
                        className="association-row"
                      >
                        {index === 0 ? (
                          <>
                            <td className="user-name-cell" rowSpan={rowCount}>
                              <div className="user-info">
                                <span className="user-name">
                                  {user.usersname}
                                </span>
                                <button
                                  className="btn-edit"
                                  onClick={() => startEditing(user)}
                                  title="Edit associations"
                                >
                                  <FaEdit size={16} />
                                </button>
                              </div>
                            </td>
                            <td className="created-by-cell" rowSpan={rowCount}>
                              {user.userscreatedby}
                            </td>
                          </>
                        ) : null}

                        {hasAssociations ? (
                          <>
                            <td className="company-cell">
                              <div className="company-info">
                                <span className="company-name">
                                  {user.associations[index].incubateesname}
                                </span>
                                <span className="association-date">
                                  {formatDate(
                                    user.associations[index]
                                      .usrincassncreatedtime
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="associated-by-cell">
                              {user.associations[index]
                                .usrincassncreatedbyname || "N/A"}
                            </td>
                            <td className="delete-cell">
                              <button
                                className="btn-delete"
                                onClick={() =>
                                  handleDelete(
                                    user.associations[index].usrincassnrecid
                                  )
                                }
                                disabled={isDeleting}
                                title="Remove association"
                              >
                                {isDeleting ? (
                                  <FaSpinner className="spinner" size={14} />
                                ) : (
                                  <FaTrash size={14} />
                                )}
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="no-association-cell" colSpan="3">
                              <span className="no-association">
                                No companies associated
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {sortedData.length === 0 && (
            <div className="user-association-empty">
              {searchQuery
                ? "No users found matching your search"
                : "No users found"}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingUserId && (
        <div className="user-association-modal-backdrop">
          <div className="user-association-modal-content">
            <div className="user-association-modal-header">
              <h3>Edit User Associations</h3>
              <button className="btn-close" onClick={cancelEditing}>
                <FaTimes size={20} />
              </button>
            </div>

            <div className="user-association-modal-body">
              <h4>Select Incubatees:</h4>
              <div className="incubatees-checklist">
                {incubatees.map((incubatee) => (
                  <div
                    key={incubatee.incubateesrecid}
                    className="incubatee-checkbox-item"
                  >
                    <input
                      type="checkbox"
                      id={`incubatee-${incubatee.incubateesrecid}`}
                      checked={selectedIncubatees.includes(
                        incubatee.incubateesrecid
                      )}
                      onChange={() =>
                        handleCheckboxChange(incubatee.incubateesrecid)
                      }
                      disabled={updateLoading}
                    />
                    <label htmlFor={`incubatee-${incubatee.incubateesrecid}`}>
                      {incubatee.incubateesname}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="user-association-modal-footer">
              <button
                className="btn-cancel"
                onClick={cancelEditing}
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={updateAssociations}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <>
                    <FaSpinner className="spinner" size={14} /> Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>

            {updateLoading && (
              <div className="modal-loading-overlay">
                <div className="modal-loading-spinner">
                  <FaSpinner className="spinner" size={24} />
                  <p>Updating associations...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Association Modal */}
      {showNewAssociationModal && (
        <div className="user-association-modal-backdrop">
          <div className="user-association-modal-content">
            <div className="user-association-modal-header">
              <h3>Associate New Operator</h3>
              <button className="btn-close" onClick={cancelNewAssociation}>
                <FaTimes size={20} />
              </button>
            </div>

            <div className="user-association-modal-body">
              <div className="form-group">
                <label htmlFor="user-select">Select User:</label>
                <select
                  id="user-select"
                  className="user-select"
                  value={selectedUser}
                  onChange={handleUserChange}
                  disabled={updateLoading}
                >
                  <option value="">-- Select User --</option>
                  {users.map((user) => (
                    <option key={user.usersrecid} value={user.usersrecid}>
                      {user.usersname}
                    </option>
                  ))}
                </select>
              </div>

              <h4>Select Incubatees:</h4>
              <div className="incubatees-checklist">
                {incubatees.map((incubatee) => (
                  <div
                    key={incubatee.incubateesrecid}
                    className="incubatee-checkbox-item"
                  >
                    <input
                      type="checkbox"
                      id={`new-incubatee-${incubatee.incubateesrecid}`}
                      checked={selectedIncubateesForNew.includes(
                        incubatee.incubateesrecid
                      )}
                      onChange={() =>
                        handleNewCheckboxChange(incubatee.incubateesrecid)
                      }
                      disabled={updateLoading}
                    />
                    <label
                      htmlFor={`new-incubatee-${incubatee.incubateesrecid}`}
                    >
                      {incubatee.incubateesname}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="user-association-modal-footer">
              <button
                className="btn-cancel"
                onClick={cancelNewAssociation}
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={createNewAssociation}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <>
                    <FaSpinner className="spinner" size={14} /> Creating...
                  </>
                ) : (
                  "Create Association"
                )}
              </button>
            </div>

            {updateLoading && (
              <div className="modal-loading-overlay">
                <div className="modal-loading-spinner">
                  <FaSpinner className="spinner" size={24} />
                  <p>Creating associations...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
