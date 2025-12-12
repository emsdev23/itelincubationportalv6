import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Download, Trash2, Eye, Edit, Shield } from "lucide-react";
import * as XLSX from "xlsx";
import { IPAdress } from "../Datafetching/IPAdrees";
import ReusableDataGrid from "../Datafetching/ReusableDataGrid"; // Import the reusable component

// Material UI imports
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Styled components for custom styling
const StyledChip = styled(Chip)(({ theme, category }) => {
  const getCategoryColor = (category) => {
    switch (category) {
      case "Financial":
        return { backgroundColor: "#e8f5e9", color: "#2e7d32" };
      case "Legal":
        return { backgroundColor: "#e3f2fd", color: "#1565c0" };
      case "Secretarial":
        return { backgroundColor: "#fff3e0", color: "#e65100" };
      default:
        return { backgroundColor: "#f3e5f5", color: "#6a1b9a" };
    }
  };

  return {
    ...getCategoryColor(category),
    fontWeight: 500,
    borderRadius: 4,
  };
});

// Configure SweetAlert2 to ensure it appears above modals
Swal.mixin({
  customClass: {
    popup: 'swal2-popup-high-zindex',
  }
});

export default function CollectedDocumentsTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");
  const incubateeId = sessionStorage.getItem("incubateeId");

  const API_BASE_URL = IPAdress;
  const isXLSXAvailable = !!XLSX;

  // State for ALL Documents Table
  const [allDocuments, setAllDocuments] = useState([]);
  const [allDocumentsLoading, setAllDocumentsLoading] = useState(true);
  const [allDocumentsError, setAllDocumentsError] = useState(null);

  // State for Documents WITH ACCESS Table
  const [documentsWithAccess, setDocumentsWithAccess] = useState([]);
  const [documentsWithAccessLoading, setDocumentsWithAccessLoading] = useState(true);
  const [documentsWithAccessError, setDocumentsWithAccessError] = useState(null);

  // State for operations
  const [isDeleting, setIsDeleting] = useState(null); // Stores the docaccessrecid being deleted
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // State for Grant Access modal
  const [grantAccessModalOpen, setGrantAccessModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [isSubmittingAccess, setIsSubmittingAccess] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // State for Edit Access modal
  const [editAccessModalOpen, setEditAccessModalOpen] = useState(false);
  const [selectedAccessRecord, setSelectedAccessRecord] = useState(null);
  const [editRoles, setEditRoles] = useState([]);
  const [editUsers, setEditUsers] = useState([]);
  const [editSelectedRole, setEditSelectedRole] = useState("");
  const [editSelectedUser, setEditSelectedUser] = useState("");
  const [editFromDate, setEditFromDate] = useState(new Date());
  const [editToDate, setEditToDate] = useState(new Date());
  const [editExpiryDate, setEditExpiryDate] = useState(new Date());
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editRolesLoading, setEditRolesLoading] = useState(false);
  const [editUsersLoading, setEditUsersLoading] = useState(false);

  // NEW: State for all roles and users lookup
  const [allRoles, setAllRoles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [rolesMap, setRolesMap] = useState({});
  const [usersMap, setUsersMap] = useState({});

  // NEW: Fetch all roles for lookup
  const fetchAllRoles = () => {
    fetch(`${API_BASE_URL}/itelinc/resources/generic/getroledetails`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json", 
      },
      body: JSON.stringify({ 
        userId: userId || "1",
        userIncId: "ALL"
      }),
    })
    .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! Status: ${res.status}`))
    .then(data => {
      if (data.statusCode === 200) {
        setAllRoles(data.data);
        
        // Create a map for quick lookup
        const roleMap = {};
        data.data.forEach(role => {
          roleMap[role.rolesrecid] = role.rolesname;
        });
        setRolesMap(roleMap);
      } else {
        throw new Error(data.message || "Failed to fetch roles");
      }
    })
    .catch(err => {
      console.error("Error fetching all roles:", err);
    });
  };

  // NEW: Fetch all users for lookup
  const fetchAllUsers = () => {
    fetch(`${API_BASE_URL}/itelinc/resources/generic/getusers`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json", 
      },
      body: JSON.stringify({ 
        userId: userId || "1",
        userIncId: "1"
      }),
    })
    .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! Status: ${res.status}`))
    .then(data => {
      if (data.statusCode === 200) {
        setAllUsers(data.data);
        
        // Create a map for quick lookup
        const userMap = {};
        data.data.forEach(user => {
          userMap[user.usersrecid] = user.usersname;
        });
        setUsersMap(userMap);
      } else {
        throw new Error(data.message || "Failed to fetch users");
      }
    })
    .catch(err => {
      console.error("Error fetching all users:", err);
    });
  };

  // Fetch documents
  const fetchDocuments = () => {
    setAllDocumentsLoading(true);
    setDocumentsWithAccessLoading(true);
    setAllDocumentsError(null);
    setDocumentsWithAccessError(null);

    const collectedDocsPromise = fetch(`${API_BASE_URL}/itelinc/resources/generic/getcollecteddocuments`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json", 
        userid: userId || "8",
        "X-Module": "Document Management",
        "X-Action": "Fetching All Documents",
      },
      body: JSON.stringify({ userId: userId || "8", incUserId: incUserid || "35" }),
    }).then(res => res.ok ? res.json() : Promise.reject(`HTTP error! Status: ${res.status}`));

    const accessDetailsPromise = fetch(`${API_BASE_URL}/itelinc/resources/generic/getdocaccessdetails`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json", 
        userid: userId || "1",
        "X-Module": "Document Management",
        "X-Action": "Fetching Document Access Details",
      },
      body: JSON.stringify({ userId: userId || "1", incUserId: incUserid || "1" }),
    }).then(res => res.ok ? res.json() : Promise.reject(`HTTP error! Status: ${res.status}`));

    Promise.all([collectedDocsPromise, accessDetailsPromise])
      .then(([collectedData, accessData]) => {
        if (collectedData.statusCode !== 200 || accessData.statusCode !== 200) {
          throw new Error("Failed to fetch data from one or more endpoints.");
        }
        const collectedDocs = collectedData.data || [];
        const accessDetails = accessData.data || [];

        // Set state for ALL documents table
        setAllDocuments(collectedDocs);

        // For the WITH ACCESS table, use access details directly since they already contain document info
        // But also add any missing fields from collected docs if needed
        const documentsWithAccessMerged = accessDetails.map(access => {
          // Find the corresponding collected document
          const collectedDoc = collectedDocs.find(doc => 
            doc.collecteddocrecid?.toString() === access.docaccessdocid ||
            doc.collecteddocdocumentsrecid?.toString() === access.docaccessdocid
          );
          
          // Get role name and user name from the maps
          const roleName = rolesMap[access.usersrolesrecid] || "Unknown Role";
          const userName = usersMap[access.docaccessuserrecid] || "Unknown User";
          
          // Merge the data, with access details taking precedence
          return {
            ...collectedDoc,
            ...access,
            // Add role name and user name
            roleName: roleName,
            userName: userName,
            // Ensure we have the document ID for operations
            collecteddocrecid: collectedDoc?.collecteddocrecid || access.docaccessdocid,
            // Keep access details nested for easier access
            accessDetails: access
          };
        });

        setDocumentsWithAccess(documentsWithAccessMerged);
      })
      .catch((err) => {
        console.error("Error fetching documents:", err);
        const errorMessage = err.message || "Failed to load documents. Please try again.";
        setAllDocumentsError(errorMessage);
        setDocumentsWithAccessError(errorMessage);
      })
      .finally(() => {
        setAllDocumentsLoading(false);
        setDocumentsWithAccessLoading(false);
      });
  };

  // Fetch roles
  const fetchRoles = () => {
    setRolesLoading(true);
    fetch(`${API_BASE_URL}/itelinc/resources/generic/getroledetails`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json", 
      },
      body: JSON.stringify({ 
        userId: userId || "1",
        userIncId: "ALL"
      }),
    })
    .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! Status: ${res.status}`))
    .then(data => {
      if (data.statusCode === 200) {
        // Filter roles to only include IDs 1, 2, 4, 7
        const filteredRoles = data.data.filter(role => 
          [1, 2, 7].includes(role.rolesrecid)
        );
        setRoles(filteredRoles);
      } else {
        throw new Error(data.message || "Failed to fetch roles");
      }
    })
    .catch(err => {
      console.error("Error fetching roles:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch roles. Please try again.",
        icon: "error",
      });
    })
    .finally(() => {
      setRolesLoading(false);
    });
  };

  // Fetch users based on selected role
  const fetchUsers = (roleId) => {
    if (!roleId) return;
    
    setUsersLoading(true);
    fetch(`${API_BASE_URL}/itelinc/resources/generic/getusers`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json", 
      },
      body: JSON.stringify({ 
        userId: userId || "1",
        userIncId: "1"
      }),
    })
    .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! Status: ${res.status}`))
    .then(data => {
      if (data.statusCode === 200) {
        // Filter users by selected role
        const filteredUsers = data.data.filter(user => 
          user.usersrolesrecid === parseInt(roleId)
        );
        setUsers(filteredUsers);
      } else {
        throw new Error(data.message || "Failed to fetch users");
      }
    })
    .catch(err => {
      console.error("Error fetching users:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch users. Please try again.",
        icon: "error",
      });
    })
    .finally(() => {
      setUsersLoading(false);
    });
  };

  // Fetch roles for edit modal
  const fetchEditRoles = () => {
    setEditRolesLoading(true);
    fetch(`${API_BASE_URL}/itelinc/resources/generic/getroledetails`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json", 
      },
      body: JSON.stringify({ 
        userId: userId || "1",
        userIncId: "ALL"
      }),
    })
    .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! Status: ${res.status}`))
    .then(data => {
      if (data.statusCode === 200) {
        // Filter roles to only include IDs 1, 2, 4, 7
        const filteredRoles = data.data.filter(role => 
          [1, 2, 4, 7].includes(role.rolesrecid)
        );
        setEditRoles(filteredRoles);
      } else {
        throw new Error(data.message || "Failed to fetch roles");
      }
    })
    .catch(err => {
      console.error("Error fetching roles:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch roles. Please try again.",
        icon: "error",
      });
    })
    .finally(() => {
      setEditRolesLoading(false);
    });
  };

  // Fetch users based on selected role for edit modal
  const fetchEditUsers = (roleId) => {
    if (!roleId) return;
    
    setEditUsersLoading(true);
    fetch(`${API_BASE_URL}/itelinc/resources/generic/getusers`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json", 
      },
      body: JSON.stringify({ 
        userId: userId || "1",
        userIncId: "1"
      }),
    })
    .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! Status: ${res.status}`))
    .then(data => {
      if (data.statusCode === 200) {
        // Filter users by selected role
        const filteredUsers = data.data.filter(user => 
          user.usersrolesrecid === parseInt(roleId)
        );
        setEditUsers(filteredUsers);
      } else {
        throw new Error(data.message || "Failed to fetch users");
      }
    })
    .catch(err => {
      console.error("Error fetching users:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch users. Please try again.",
        icon: "error",
      });
    })
    .finally(() => {
      setEditUsersLoading(false);
    });
  };

  // Handle role selection change
  const handleRoleChange = (event) => {
    const roleId = event.target.value;
    setSelectedRole(roleId);
    setSelectedUser(""); // Reset user selection when role changes
    fetchUsers(roleId);
  };

  // Handle role selection change for edit modal
  const handleEditRoleChange = (event) => {
    const roleId = event.target.value;
    setEditSelectedRole(roleId);
    setEditSelectedUser(""); // Reset user selection when role changes
    fetchEditUsers(roleId);
  };

  // Handle grant access submission
  const handleGrantAccess = () => {
    if (!selectedDocument || !selectedRole || !selectedUser) {
      Swal.fire({
        title: "Error",
        text: "Please fill all required fields",
        icon: "error",
      });
      return;
    }

    // Store current form values
    const currentDocument = selectedDocument;
    const currentRole = selectedRole;
    const currentUser = selectedUser;
    const currentFromDate = fromDate;
    const currentToDate = toDate;

    // Close the modal first
    setGrantAccessModalOpen(false);

    // Then show the confirmation
    Swal.fire({
      title: 'Are you sure?',
      text: `Grant access to "${currentDocument.documentname}" for the selected user?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, grant access!'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsSubmittingAccess(true);
        
        const accessData = {
          userid: userId || "1",
          userincid: incubateeId || "19",
          categoryid: currentDocument.collecteddoccatrecid.toString(),
          roleid: currentRole,
          userrecid: currentUser,
          docaccessdocsubcatid: currentDocument.collecteddocsubcatrecid.toString(),
          docaccessdocid: currentDocument.collecteddocrecid.toString(),
          fromdate: currentFromDate.toISOString().split('T')[0],
          todate: currentToDate.toISOString().split('T')[0]
        };

        fetch(`${API_BASE_URL}/itelinc/resources/generic/setdocaccess`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`, 
            "Content-Type": "application/json", 
          },
          body: JSON.stringify(accessData),
        })
        .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! Status: ${res.status}`))
        .then(data => {
          if (data.statusCode === 200) {
            Swal.fire('Success!', 'Access has been granted.', 'success');
            // Refresh the documents to update the access details
            fetchDocuments();
          } else {
            throw new Error(data.message || "Failed to grant access");
          }
        })
        .catch(err => {
          console.error("Error granting access:", err);
          Swal.fire('Error', 'Failed to grant access. Please try again.', 'error');
        })
        .finally(() => {
          setIsSubmittingAccess(false);
        });
      } else {
        // If user cancels, reopen the modal with the same values
        setSelectedDocument(currentDocument);
        setSelectedRole(currentRole);
        setSelectedUser(currentUser);
        setFromDate(currentFromDate);
        setToDate(currentToDate);
        setGrantAccessModalOpen(true);
      }
    });
  };

  // Handle update access submission
  const handleUpdateAccess = () => {
    if (!selectedAccessRecord || !editSelectedRole || !editSelectedUser) {
      Swal.fire({
        title: "Error",
        text: "Please fill all required fields",
        icon: "error",
      });
      return;
    }

    // Store current form values
    const currentAccessRecord = selectedAccessRecord;
    const currentRole = editSelectedRole;
    const currentUser = editSelectedUser;
    const currentFromDate = editFromDate;
    const currentToDate = editToDate;
    const currentExpiryDate = editExpiryDate;

    // Close the modal first
    setEditAccessModalOpen(false);

    // Then show the confirmation
    Swal.fire({
      title: 'Are you sure?',
      text: `Update access for "${currentAccessRecord.documentname}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update access!'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsSubmittingEdit(true);
        
        // Build the URL with query parameters
        const params = new URLSearchParams({
          docaccessrecid: currentAccessRecord.docaccessrecid,
          docaccessincubateesrecid: incubateeId || "35",
          docaccessrolerecid: currentRole,
          docaccesscatrecid: currentAccessRecord.docaccesscatrecid,
          docaccessexpirydate: currentExpiryDate.toISOString().split('T')[0],
          docaccessadminstate: "1", // CHANGE: Always send adminstate as 1
          docaccessuserrecid: currentUser,
          docaccessdocsubcatid: currentAccessRecord.collecteddocsubcatrecid || currentAccessRecord.docaccessdocsubcatid,
          docaccessfromdate: currentFromDate.toISOString().split('T')[0],
          docaccesstodate: currentToDate.toISOString().split('T')[0],
          docaccessdocid: currentAccessRecord.docaccessdocid
        });
        
        fetch(`${API_BASE_URL}/itelinc/updateDocAccess?${params.toString()}`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`, 
            "Content-Type": "application/json", 
          },
        })
        .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! Status: ${res.status}`))
        .then(data => {
          if (data.statusCode === 200) {
            Swal.fire('Success!', 'Access has been updated.', 'success');
            // Refresh the documents to update the access details
            fetchDocuments();
          } else {
            throw new Error(data.message || "Failed to update access");
          }
        })
        .catch(err => {
          console.error("Error updating access:", err);
          Swal.fire('Error', 'Failed to update access. Please try again.', 'error');
        })
        .finally(() => {
          setIsSubmittingEdit(false);
        });
      } else {
        // If user cancels, reopen the modal with the same values
        setSelectedAccessRecord(currentAccessRecord);
        setEditSelectedRole(currentRole);
        setEditSelectedUser(currentUser);
        setEditFromDate(currentFromDate);
        setEditToDate(currentToDate);
        setEditExpiryDate(currentExpiryDate);
        setEditAccessModalOpen(true);
      }
    });
  };

  // Handle opening the grant access modal
  const handleOpenGrantAccessModal = (document) => {
    setSelectedDocument(document);
    setGrantAccessModalOpen(true);
    // Fetch roles if not already loaded
    if (roles.length === 0) {
      fetchRoles();
    }
  };

  // Handle opening the edit access modal
  const handleOpenEditAccessModal = (document) => {
    setSelectedAccessRecord(document);
    setEditAccessModalOpen(true);
    
    // Set initial values from the access record
    setEditSelectedRole(document.usersrolesrecid?.toString() || "");
    setEditSelectedUser(document.docaccessuserrecid?.toString() || "");
    
    // Parse dates if they exist
    if (document.docaccessfromdate) {
      setEditFromDate(new Date(document.docaccessfromdate));
    }
    if (document.docaccesstodate) {
      setEditToDate(new Date(document.docaccesstodate));
    }
    if (document.docaccessexpirydate) {
      setEditExpiryDate(new Date(document.docaccessexpirydate));
    }
    
    // Fetch roles if not already loaded
    if (editRoles.length === 0) {
      fetchEditRoles();
    }
    
    // Fetch users for the current role
    if (document.usersrolesrecid) {
      fetchEditUsers(document.usersrolesrecid);
    }
  };

  // Handle closing the grant access modal
  const handleCloseGrantAccessModal = () => {
    setGrantAccessModalOpen(false);
    setSelectedDocument(null);
    setSelectedRole("");
    setSelectedUser("");
    setFromDate(new Date());
    setToDate(new Date());
  };

  // Handle closing the edit access modal
  const handleCloseEditAccessModal = () => {
    setEditAccessModalOpen(false);
    setSelectedAccessRecord(null);
    setEditSelectedRole("");
    setEditSelectedUser("");
    setEditFromDate(new Date());
    setEditToDate(new Date());
    setEditExpiryDate(new Date());
  };

  useEffect(() => {
    // Fetch all roles and users for lookup
    fetchAllRoles();
    fetchAllUsers();
    
    // Then fetch documents
    fetchDocuments();
  }, []);

  // Action handlers
  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  // UPDATED: Handle delete action with API call
  const handleDelete = (row) => {
    const accessRecId = row.docaccessrecid;

    if (!accessRecId) {
      Swal.fire("Error", "Cannot find access record ID to delete.", "error");
      return;
    }

    // Store current row for potential rollback
    const currentRow = row;

    Swal.fire({
      title: 'Are you sure?', 
      text: `Delete access for "${row.documentname}"?`, 
      icon: 'warning',
      showCancelButton: true, 
      confirmButtonColor: '#d33', 
      cancelButtonColor: '#3085d6', 
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(accessRecId); // Set loading state for this specific item
        
        const params = new URLSearchParams({
          docaccessrecid: accessRecId,
          docaccessmodifiedby: userId || "1" // Use session user ID
        });

        fetch(`${API_BASE_URL}/itelinc/deleteDocAccess?${params.toString()}`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`, 
            "Content-Type": "application/json", 
          },
        })
        .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! Status: ${res.status}`))
        .then(data => {
          if (data.statusCode === 200) {
            Swal.fire('Deleted!', `Access for "${row.documentname}" has been removed.`, 'success');
            // Update local state to remove the deleted item
            setDocumentsWithAccess(prev => prev.filter(doc => doc.docaccessrecid !== row.docaccessrecid));
          } else {
            throw new Error(data.message || "Failed to delete access");
          }
        })
        .catch(err => {
          console.error("Error deleting access:", err);
          Swal.fire('Error', 'Failed to delete access. Please try again.', 'error');
        })
        .finally(() => {
          setIsDeleting(null); // Clear loading state
        });
      }
    });
  };

  const handleView = (row) => {
    if (!row) return;
    
    Swal.fire({ 
      title: row.documentname, 
      html: `<div style="text-align:left;">
        <p><strong>Document Name:</strong> ${row.documentname}</p>
        <p><strong>Category:</strong> ${row.doccatname}</p>
        <p><strong>Sub-Category:</strong> ${row.docsubcatname || "-"}</p>
        <p><strong>Periodicity:</strong> ${row.docperiodicityname || "-"}</p>
        <p><strong>Upload Date:</strong> ${row.collecteddocuploaddate?.replace("T", " ") || "-"}</p>
        ${row.docaccessusername ? `
          <p><strong>Access User:</strong> ${row.docaccessusername}</p>
          <p><strong>Access Role:</strong> ${row.roleName || "-"}</p>
          <p><strong>Access Expiry:</strong> ${row.docaccessexpirydate || "-"}</p>
        ` : ''}
      </div>`, 
      icon: 'info',
      width: '600px'
    });
  };

  const handleEdit = (row) => { 
    Swal.fire({ 
      title: 'Edit', 
      text: `Editing "${row.documentname}"`, 
      icon: 'info' 
    }); 
  };

  // Define columns for ALL Documents table
  const allDocumentsColumns = [
    {
      field: "sno",
      headerName: "S.No",
      width: 100,
      sortable: true,
      renderCell: (params) => {
        // Ensure we have valid params and row
        if (!params || !params.api || !params.row) return "1";

        const rowIndex = params.api.getRowIndexRelativeToVisibleRows(
          params.row.id
        );
        const pageSize = params.api.state.pagination.pageSize;
        const currentPage = params.api.state.pagination.page;

        // Ensure we have valid numbers
        const validRowIndex = isNaN(rowIndex) ? 0 : rowIndex;
        const validPageSize = isNaN(pageSize) ? 10 : pageSize;
        const validCurrentPage = isNaN(currentPage) ? 0 : currentPage;

        return (
          validRowIndex +
          1 +
          validCurrentPage * validPageSize
        ).toString();
      },
    },
    {
      field: "documentname",
      headerName: "Document Name",
      width: 250,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: "primary.main" }}>
          {params.row.documentname}
        </Typography>
      ),
    },
    {
      field: "doccatname",
      headerName: "Category",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <StyledChip 
          label={params.row.doccatname} 
          size="small" 
          category={params.row.doccatname} 
        />
      ),
    },
    {
      field: "docsubcatname",
      headerName: "Sub-Category",
      width: 280,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.docsubcatname}
        </Typography>
      ),
    },
    {
      field: "docperiodicityname",
      headerName: "Periodicity",
      width: 120,
      sortable: true,
      renderCell: (params) => (
        <Chip 
          label={params.row.docperiodicityname} 
          size="small" 
          variant="outlined" 
          color="primary" 
        />
      ),
    },
    {
      field: "collecteddocuploaddate",
      headerName: "Upload Date",
      width: 180,
      sortable: true,
      renderCell: (params) => (
        params.row.collecteddocuploaddate ? 
          new Date(params.row.collecteddocuploaddate).toLocaleString() : 
          "-"
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Grant Access">
            <IconButton
              color="primary"
              onClick={() => handleOpenGrantAccessModal(params.row)}
            >
              <Shield size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Define columns for Documents WITH ACCESS table
  const documentsWithAccessColumns = [
    {
      field: "sno",
      headerName: "S.No",
      width: 100,
      sortable: true,
      renderCell: (params) => {
        // Ensure we have valid params and row
        if (!params || !params.api || !params.row) return "1";

        const rowIndex = params.api.getRowIndexRelativeToVisibleRows(
          params.row.id
        );
        const pageSize = params.api.state.pagination.pageSize;
        const currentPage = params.api.state.pagination.page;

        // Ensure we have valid numbers
        const validRowIndex = isNaN(rowIndex) ? 0 : rowIndex;
        const validPageSize = isNaN(pageSize) ? 10 : pageSize;
        const validCurrentPage = isNaN(currentPage) ? 0 : currentPage;

        return (
          validRowIndex +
          1 +
          validCurrentPage * validPageSize
        ).toString();
      },
    },
    {
      field: "documentname",
      headerName: "Document Name",
      width: 250,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: "primary.main" }}>
          {params.row.documentname}
        </Typography>
      ),
    },
    {
      field: "doccatname",
      headerName: "Category",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <StyledChip 
          label={params.row.doccatname} 
          size="small" 
          category={params.row.doccatname} 
        />
      ),
    },
    {
      field: "userName",
      headerName: "User",
      width: 180,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.userName || params.row.docaccessusername || "-"}
        </Typography>
      ),
    },
    {
      field: "docaccesstodate",
      headerName: "Access Expirty",
      width: 180,
      sortable: true,
      renderCell: (params) => (
        params.row.docaccesstodate ? 
          new Date(params.row.docaccesstodate).toLocaleDateString() : 
          "-"
      ),
    },
    {
      field: "docaccesscreatedname",
      headerName: "Created By",
      width: 180,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.docaccesscreatedname || "-"}
        </Typography>
      ),
    },
    {
      field: "docaccesscreatedtime",
      headerName: "Created Time",
      width: 180,
      sortable: true,
      renderCell: (params) => (
        params.row.docaccesscreatedtime ? 
          new Date(params.row.docaccesscreatedtime).toLocaleString() : 
          "-"
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit Access">
            <IconButton
              color="primary"
              onClick={() => handleOpenEditAccessModal(params.row)}
            >
              <Edit size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              color="error"
              onClick={() => handleDelete(params.row)} // Pass the row directly
              disabled={isDeleting === params.row.docaccessrecid}
            >
              {isDeleting === params.row.docaccessrecid ? (
                <CircularProgress size={20} />
              ) : (
                <Trash2 size={18} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Custom export function for ALL documents
  const onExportAllDocumentsData = (data) => {
    return data.map((item) => ({
      "Document Name": item.documentname || "",
      "Category": item.doccatname || "",
      "Sub-Category": item.docsubcatname || "",
      "Periodicity": item.docperiodicityname || "",
      "Upload Date": item.collecteddocuploaddate?.replace("T", " ") || "",
    }));
  };

  // Custom export function for documents WITH ACCESS
  const onExportDocumentsWithAccessData = (data) => {
    return data.map((item) => ({
      "Document Name": item.documentname || "",
      "Category": item.doccatname || "",
      "Role": item.roleName || "",
      "User": item.userName || item.docaccessusername || "",
      "Access To": item.docaccesstodate || "",
      "Created By": item.docaccesscreatedname || "",
      "Created Time": item.docaccesscreatedtime || "",
    }));
  };

  // Export configurations
  const allDocumentsExportConfig = {
    filename: "all_documents",
    sheetName: "All Documents",
  };

  const documentsWithAccessExportConfig = {
    filename: "documents_with_access",
    sheetName: "Documents With Access",
  };

  // Add IDs to rows if they don't have them
  const rowsWithIdForAll = allDocuments.map(item => ({
    ...item, 
    id: item.collecteddocrecid || Math.random().toString(36).substr(2, 9) 
  }));

  const rowsWithIdForAccess = documentsWithAccess.map(item => ({
    ...item, 
    id: item.docaccessrecid || Math.random().toString(36).substr(2, 9) 
  }));

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      {/* Add CSS for SweetAlert2 z-index */}
      <style jsx global>{`
        .swal2-popup-high-zindex {
          z-index: 99999 !important;
        }
      `}</style>
      
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          📄 Uploaded Documents
        </Typography>
        <Button 
          variant="contained" 
          onClick={fetchDocuments} 
          disabled={allDocumentsLoading || documentsWithAccessLoading}
          startIcon={
            allDocumentsLoading || documentsWithAccessLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : null
          }
        >
          {allDocumentsLoading || documentsWithAccessLoading ? "Loading..." : "Refresh Data"}
        </Button>
      </Box>

      {/* --- TABLE 1: ALL UPLOADED DOCUMENTS --- */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        </Box>

        {allDocumentsError && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: "error.light",
              color: "error.contrastText",
              borderRadius: 1,
            }}
          >
            {allDocumentsError}
          </Box>
        )}

        <ReusableDataGrid
          data={rowsWithIdForAll}
          columns={allDocumentsColumns}
          title=""
          enableExport={true}
          enableColumnFilters={true}
          searchPlaceholder="Search by name, category, sub-category..."
          searchFields={["documentname", "doccatname", "docsubcatname"]}
          uniqueIdField="collecteddocrecid"
          onExportData={onExportAllDocumentsData}
          exportConfig={allDocumentsExportConfig}
          className="all-documents-table"
        />

        <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Chip label={`Total: ${allDocuments.length} documents`} color="primary" variant="outlined" />
          <Chip 
            label={`Financial: ${allDocuments.filter(d => d.doccatname === "Financial").length}`} 
            sx={{ backgroundColor: "#e8f5e9", color: "#2e7d32" }} 
          />
          <Chip 
            label={`Legal: ${allDocuments.filter(d => d.doccatname === "Legal").length}`} 
            sx={{ backgroundColor: "#e3f2fd", color: "#1565c0" }} 
          />
          <Chip 
            label={`Secretarial: ${allDocuments.filter(d => d.doccatname === "Secretarial").length}`} 
            sx={{ backgroundColor: "#fff3e0", color: "#e65100" }} 
          />
        </Box>
      </Box>

      {/* --- TABLE 2: DOCUMENTS WITH ACCESS DETAILS --- */}
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" component="h2">
            🔐 Documents with Access Details
          </Typography>
        </Box>

        {documentsWithAccessError && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: "error.light",
              color: "error.contrastText",
              borderRadius: 1,
            }}
          >
            {documentsWithAccessError}
          </Box>
        )}

        <ReusableDataGrid
          data={rowsWithIdForAccess}
          columns={documentsWithAccessColumns}
          title=""
          enableExport={true}
          enableColumnFilters={true}
          searchPlaceholder="Search by name, category, user..."
          searchFields={["documentname", "doccatname", "userName", "docaccessusername"]}
          uniqueIdField="docaccessrecid"
          onExportData={onExportDocumentsWithAccessData}
          exportConfig={documentsWithAccessExportConfig}
          className="documents-with-access-table"
        />

        <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Chip label={`Total: ${documentsWithAccess.length} documents`} color="primary" variant="outlined" />
          <Chip 
            label={`Financial: ${documentsWithAccess.filter(d => d.doccatname === "Financial").length}`} 
            sx={{ backgroundColor: "#e8f5e9", color: "#2e7d32" }} 
          />
          <Chip 
            label={`Legal: ${documentsWithAccess.filter(d => d.doccatname === "Legal").length}`} 
            sx={{ backgroundColor: "#e3f2fd", color: "#1565c0" }} 
          />
          <Chip 
            label={`Secretarial: ${documentsWithAccess.filter(d => d.doccatname === "Secretarial").length}`} 
            sx={{ backgroundColor: "#fff3e0", color: "#e65100" }} 
          />
        </Box>
      </Box>

      {/* Grant Access Modal */}
      <Dialog open={grantAccessModalOpen} onClose={handleCloseGrantAccessModal} maxWidth="md" fullWidth>
        <DialogTitle>Grant Document Access</DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box sx={{ mb: 3, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Document Details
              </Typography>
              <Typography variant="body2">
                <strong>Name:</strong> {selectedDocument.documentname}
              </Typography>
              <Typography variant="body2">
                <strong>Category:</strong> {selectedDocument.doccatname}
              </Typography>
              <Typography variant="body2">
                <strong>Sub-Category:</strong> {selectedDocument.docsubcatname}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                id="role-select"
                value={selectedRole}
                label="Role"
                onChange={handleRoleChange}
                disabled={rolesLoading}
              >
                {roles.map((role) => (
                  <MenuItem key={role.rolesrecid} value={role.rolesrecid}>
                    {role.rolesname}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel id="user-select-label">User</InputLabel>
              <Select
                labelId="user-select-label"
                id="user-select"
                value={selectedUser}
                label="User"
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={!selectedRole || usersLoading}
              >
                {users.map((user) => (
                  <MenuItem key={user.usersrecid} value={user.usersrecid}>
                    {user.usersname}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGrantAccessModal}>Cancel</Button>
          <Button 
            onClick={handleGrantAccess} 
            variant="contained"
            disabled={isSubmittingAccess || !selectedRole || !selectedUser}
            startIcon={isSubmittingAccess ? <CircularProgress size={20} /> : null}
          >
            {isSubmittingAccess ? "Granting..." : "Grant Access"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Access Modal */}
      <Dialog open={editAccessModalOpen} onClose={handleCloseEditAccessModal} maxWidth="md" fullWidth>
        <DialogTitle>Edit Document Access</DialogTitle>
        <DialogContent>
          {selectedAccessRecord && (
            <Box sx={{ mb: 3, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Document Details
              </Typography>
              <Typography variant="body2">
                <strong>Name:</strong> {selectedAccessRecord.documentname}
              </Typography>
              <Typography variant="body2">
                <strong>Category:</strong> {selectedAccessRecord.doccatname}
              </Typography>
              <Typography variant="body2">
                <strong>Sub-Category:</strong> {selectedAccessRecord.docsubcatname || "-"}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="edit-role-select-label">Role</InputLabel>
              <Select
                labelId="edit-role-select-label"
                id="edit-role-select"
                value={editSelectedRole}
                label="Role"
                onChange={handleEditRoleChange}
                disabled={editRolesLoading}
              >
                {editRoles.map((role) => (
                  <MenuItem key={role.rolesrecid} value={role.rolesrecid}>
                    {role.rolesname}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel id="edit-user-select-label">User</InputLabel>
              <Select
                labelId="edit-user-select-label"
                id="edit-user-select"
                value={editSelectedUser}
                label="User"
                onChange={(e) => setEditSelectedUser(e.target.value)}
                disabled={!editSelectedRole || editUsersLoading}
              >
                {editUsers.map((user) => (
                  <MenuItem key={user.usersrecid} value={user.usersrecid}>
                    {user.usersname}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From Date"
                value={editFromDate}
                onChange={(newValue) => setEditFromDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              
              <DatePicker
                label="To Date"
                value={editToDate}
                onChange={(newValue) => setEditToDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditAccessModal}>Cancel</Button>
          <Button 
            onClick={handleUpdateAccess} 
            variant="contained"
            disabled={isSubmittingEdit || !editSelectedRole || !editSelectedUser}
            startIcon={isSubmittingEdit ? <CircularProgress size={20} /> : null}
          >
            {isSubmittingEdit ? "Updating..." : "Update Access"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
