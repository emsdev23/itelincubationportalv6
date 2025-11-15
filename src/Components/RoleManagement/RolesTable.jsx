import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { FaTrash, FaEdit, FaPlus } from "react-icons/fa";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import RoleAppList from "./RoleAppList";
import { IPAdress } from "../Datafetching/IPAdrees";
// Material UI imports
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import {
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

// Styled components for custom styling
const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(2),
}));

const StyledChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = (status) => {
    return status === "Enabled"
      ? { backgroundColor: "#e8f5e9", color: "#2e7d32" }
      : { backgroundColor: "#ffebee", color: "#c62828" };
  };

  return {
    ...getStatusColor(status),
    fontWeight: 500,
    borderRadius: 4,
  };
});

export default function RolesTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");
  const roleId = sessionStorage.getItem("roleid");

  const API_BASE_URL = IPAdress;

  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // State to manage the selected role for the detail view
  const [selectedRole, setSelectedRole] = useState({ id: null, name: "" });

  // Loading states for operations
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

  // Pagination state for Material UI
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  // Function to filter roles based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRoles(roles);
    } else {
      const filtered = roles.filter(
        (role) =>
          role.rolesname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          role.rolesdescription
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredRoles(filtered);
    }
  }, [searchQuery, roles]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [searchQuery]);

  // Fetch all roles using the specific API endpoint
  const fetchRoles = () => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/itelinc/resources/generic/getroledetails`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        userid: userId || "1",
        "X-Module": "Roles Management",
        "X-Action": "Fetching Roles Details List",
      },
      body: JSON.stringify({
        userId: userId || 1,
        userIncId: "ALL",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          setRoles(data.data || []);
          setFilteredRoles(data.data || []);
        } else {
          throw new Error(data.message || "Failed to fetch roles");
        }
      })
      .catch((err) => {
        console.error("Error fetching roles:", err);
        setError("Failed to load roles. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  // Delete role - Updated to use the specific API endpoint
  const handleDelete = (role) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${role.rolesname}. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(role.rolesrecid);

        const deleteUrl = `${API_BASE_URL}/itelinc/deleteRole?rolesrecid=${
          role.rolesrecid
        }&rolesmodifiedby=${userId || "39"}`;

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
                `${role.rolesname} has been deleted successfully.`,
                "success"
              );
              fetchRoles(); // Refresh the role list
            } else {
              throw new Error(data.message || "Failed to delete role");
            }
          })
          .catch((err) => {
            console.error("Error deleting role:", err);
            Swal.fire(
              "Error",
              `Failed to delete ${role.rolesname}: ${err.message}`,
              "error"
            );
          })
          .finally(() => {
            setIsDeleting(null);
          });
      }
    });
  };

  // Add new role
  const handleAddRole = () => {
    Swal.fire({
      title: "Add New Role",
      html: `
        <div class="swal-form-container">
          <div class="swal-form-row">
            <input id="swal-name" class="swal2-input" placeholder="Role Name" required>
          </div>
          <div class="swal-form-row">
            <select id="swal-state" class="swal2-select" required>
              <option value="" disabled selected>Select state</option>
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
          <div class="swal-form-row">
            <textarea id="swal-description" class="swal2-textarea" placeholder="Description" rows="4" required></textarea>
          </div>
        </div>
      `,
      width: "600px",
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const name = document.getElementById("swal-name");
        const state = document.getElementById("swal-state");
        const description = document.getElementById("swal-description");

        if (!name || !state || !description) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }

        if (!name.value || !state.value || !description.value) {
          Swal.showValidationMessage("Please fill all required fields");
          return false;
        }

        return {
          rolesname: name.value,
          rolesadminstate: state.value,
          rolesdescription: description.value,
        };
      },
      didOpen: () => {
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
          .swal2-input, .swal2-select, .swal2-textarea {
            width: 100% !important;
            margin: 0 !important;
          }
          .swal2-select, .swal2-textarea {
            padding: 0.75em !important;
          }
        `;
        document.head.appendChild(style);
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const formData = result.value;
        setIsAdding(true);

        const params = new URLSearchParams();
        params.append("rolesname", formData.rolesname);
        params.append(
          "rolesadminstate",
          formData.rolesadminstate === "Enabled" ? "1" : "0"
        );
        params.append("rolesdescription", formData.rolesdescription);
        params.append("rolescreatedby", userId || "system");
        params.append("rolesmodifiedby", userId || "system");

        const addUrl = `${API_BASE_URL}/itelinc/addRole?${params.toString()}`;
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
              Swal.fire("✅ Success", "Role added successfully", "success");
              fetchRoles();
            } else {
              Swal.fire(
                "❌ Error",
                data.message || "Failed to add role",
                "error"
              );
            }
          })
          .catch((err) => {
            console.error("Error adding role:", err);
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

  // Edit role with popup form - Updated to use the specific API endpoint
  const handleEdit = (role) => {
    Swal.fire({
      title: "Edit Role",
      html: `
        <div class="swal-form-container">
          <div class="swal-form-row">
            <input id="swal-name" class="swal2-input" placeholder="Role Name" value="${
              role.rolesname || ""
            }">
          </div>
          <div class="swal-form-row">
            <select id="swal-state" class="swal2-select">
              <option value="Enabled" ${
                role.rolesadminstate === "Enabled" ? "selected" : ""
              }>Enabled</option>
              <option value="Disabled" ${
                role.rolesadminstate === "Disabled" ? "selected" : ""
              }>Disabled</option>
            </select>
          </div>
          <div class="swal-form-row">
            <textarea id="swal-description" class="swal2-textarea" placeholder="Description" rows="4">${
              role.rolesdescription || ""
            }</textarea>
          </div>
        </div>
      `,
      width: "600px",
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const name = document.getElementById("swal-name");
        const state = document.getElementById("swal-state");
        const description = document.getElementById("swal-description");

        if (!name || !state || !description) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }

        return {
          rolesname: name.value,
          rolesadminstate: state.value,
          rolesdescription: description.value,
        };
      },
      didOpen: () => {
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
          .swal2-input, .swal2-select, .swal2-textarea {
            width: 100% !important;
            margin: 0 !important;
          }
          .swal2-select, .swal2-textarea {
            padding: 0.75em !important;
          }
        `;
        document.head.appendChild(style);
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const formData = result.value;
        setIsUpdating(role.rolesrecid);

        const updateUrl = `${API_BASE_URL}/itelinc/updateRole?rolesrecid=${
          role.rolesrecid
        }&rolesname=${encodeURIComponent(formData.rolesname)}&rolesadminstate=${
          formData.rolesadminstate === "Enabled" ? "1" : "0"
        }&rolesdescription=${encodeURIComponent(
          formData.rolesdescription
        )}&rolesmodifiedby=${userId || "0"}`;

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
              Swal.fire("✅ Success", "Role updated successfully", "success");
              fetchRoles();
            } else {
              Swal.fire(
                "❌ Error",
                data.message || "Failed to update role",
                "error"
              );
            }
          })
          .catch((err) => {
            console.error("Error updating role:", err);
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

  // Function to check if delete should be disabled for a role
  const shouldDisableDelete = (role) => {
    return role.rolesrecid === 0 || role.rolesrecid === 1;
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Handler for when a role is clicked
  const handleRoleClick = (role) => {
    setSelectedRole({ id: role.rolesrecid, name: role.rolesname });
  };

  // Export to CSV function
  const exportToCSV = () => {
    // Create a copy of the data for export
    const exportData = filteredRoles.map((item) => ({
      "Role ID": item.rolesrecid || "",
      "Role Name": item.rolesname || "",
      State: item.rolesadminstate || "",
      Description: item.rolesdescription || "",
      "Created Time": item.rolescreatedtime?.replace("T", " ") || "",
      "Modified Time": item.rolesmodifiedtime?.replace("T", " ") || "",
      "Created By": item.rolescreatedby || "",
      "Modified By": item.rolesmodifiedby || "",
    }));

    // Convert to CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            // Handle values that might contain commas
            const value = row[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `roles_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (!isXLSXAvailable) {
      console.error("XLSX library not available");
      alert("Excel export is not available. Please install the xlsx package.");
      return;
    }

    try {
      // Create a copy of the data for export
      const exportData = filteredRoles.map((item) => ({
        "Role ID": item.rolesrecid || "",
        "Role Name": item.rolesname || "",
        State: item.rolesadminstate || "",
        Description: item.rolesdescription || "",
        "Created Time": item.rolescreatedtime?.replace("T", " ") || "",
        "Modified Time": item.rolesmodifiedtime?.replace("T", " ") || "",
        "Created By": item.rolescreatedby || "",
        "Modified By": item.rolesmodifiedby || "",
      }));

      // Create a workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Roles");

      // Generate the Excel file and download
      XLSX.writeFile(wb, `roles_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting to Excel. Falling back to CSV export.");
      exportToCSV();
    }
  };

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Define columns for DataGrid
  const columns = [
    {
      field: "rolesrecid",
      headerName: "S.No",
      width: 80,
      sortable: true,
      renderCell: (params) => {
        return (
          params.api.getRowIndexRelativeToVisibleRows(params.row.rolesrecid) +
          1 +
          paginationModel.page * paginationModel.pageSize
        );
      },
    },
    {
      field: "rolesname",
      headerName: "Role Name",
      width: 200,
      sortable: true,
      renderCell: (params) => {
        return (
          <Button
            variant="text"
            color="primary"
            onClick={() => handleRoleClick(params.row)}
            sx={{ justifyContent: "flex-start", textTransform: "none" }}
          >
            {params.row.rolesname}
          </Button>
        );
      },
    },
    {
      field: "rolesadminstate",
      headerName: "State",
      width: 120,
      sortable: true,
      renderCell: (params) => {
        return (
          <StyledChip
            label={params.row.rolesadminstate}
            size="small"
            status={params.row.rolesadminstate}
          />
        );
      },
    },
    {
      field: "rolesdescription",
      headerName: "Description",
      width: 250,
      sortable: true,
    },
    {
      field: "rolescreatedtime",
      headerName: "Created Time",
      width: 180,
      sortable: true,
      renderCell: (params) => {
        return params.row.rolescreatedtime?.replace("T", " ") || "-";
      },
    },
    {
      field: "rolesmodifiedtime",
      headerName: "Modified Time",
      width: 180,
      sortable: true,
      renderCell: (params) => {
        return params.row.rolesmodifiedtime?.replace("T", " ") || "-";
      },
    },
    {
      field: "rolescreatedby",
      headerName: "Created By",
      width: 120,
      sortable: true,
    },
    {
      field: "rolesmodifiedby",
      headerName: "Modified By",
      width: 120,
      sortable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => {
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              color="primary"
              onClick={() => handleEdit(params.row)}
              disabled={
                isUpdating === params.row.rolesrecid ||
                isDeleting === params.row.rolesrecid
              }
            >
              {isUpdating === params.row.rolesrecid ? (
                <CircularProgress size={20} />
              ) : (
                <FaEdit size={18} />
              )}
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDelete(params.row)}
              disabled={
                isDeleting === params.row.rolesrecid ||
                isUpdating === params.row.rolesrecid ||
                shouldDisableDelete(params.row)
              }
              title={
                shouldDisableDelete(params.row)
                  ? "Cannot delete system roles (superadmin or incubator admin)"
                  : ""
              }
            >
              {isDeleting === params.row.rolesrecid ? (
                <CircularProgress size={20} />
              ) : (
                <FaTrash size={18} />
              )}
            </IconButton>
          </Box>
        );
      },
    },
  ];

  // Add unique ID to each row if not present
  const rowsWithId = useMemo(() => {
    return filteredRoles.map((item) => ({
      ...item,
      id: item.rolesrecid || Math.random().toString(36).substr(2, 9), // Fallback ID
    }));
  }, [filteredRoles]);

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">🔐 Roles</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={exportToCSV}
            title="Export as CSV"
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={exportToExcel}
            title="Export as Excel"
            disabled={!isXLSXAvailable}
          >
            Export Excel
          </Button>
          <Button
            variant="contained"
            startIcon={
              isAdding ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <FaPlus />
              )
            }
            onClick={handleAddRole}
            disabled={isAdding}
          >
            {isAdding ? "Adding..." : "Add Role"}
          </Button>
        </Box>
      </Box>

      {error && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: "error.light",
            color: "error.contrastText",
            borderRadius: 1,
          }}
        >
          {error}
        </Box>
      )}

      {/* Search Section */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        <TextField
          label="Search by name or description..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <SearchIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
            ),
            endAdornment: searchQuery && (
              <IconButton size="small" onClick={clearSearch}>
                <ClearIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="items-per-page-label">Items per page</InputLabel>
          <Select
            labelId="items-per-page-label"
            value={paginationModel.pageSize}
            onChange={(e) =>
              setPaginationModel({
                ...paginationModel,
                pageSize: Number(e.target.value),
                page: 0,
              })
            }
            label="Items per page"
          >
            <MenuItem value={5}>5 per page</MenuItem>
            <MenuItem value={10}>10 per page</MenuItem>
            <MenuItem value={25}>25 per page</MenuItem>
            <MenuItem value={50}>50 per page</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Results Info */}
      <Box sx={{ mb: 1, color: "text.secondary" }}>
        Showing {paginationModel.page * paginationModel.pageSize + 1} to{" "}
        {Math.min(
          (paginationModel.page + 1) * paginationModel.pageSize,
          filteredRoles.length
        )}{" "}
        of {filteredRoles.length} entries
      </Box>

      {/* Material UI DataGrid */}
      <StyledPaper>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={rowsWithId}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25, 50]}
            disableRowSelectionOnClick
            sx={{ border: 0 }}
            autoHeight
            rowCount={filteredRoles.length}
            paginationMode="client"
          />
        )}
      </StyledPaper>

      {filteredRoles.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
          {searchQuery
            ? "No roles found matching your search"
            : "No roles found"}
        </Box>
      )}

      {/* Render the detail component below */}
      {selectedRole.id !== null && (
        <Box sx={{ mt: 3 }}>
          <RoleAppList
            roleId={selectedRole.id}
            roleName={selectedRole.name}
            token={token}
            userId={userId}
          />
        </Box>
      )}

      {/* Loading overlay for operations */}
      {(isAdding || isUpdating !== null || isDeleting !== null) && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              p: 3,
              bgcolor: "background.paper",
              borderRadius: 1,
            }}
          >
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography>
              {isAdding
                ? "Adding role..."
                : isUpdating !== null
                ? "Updating role..."
                : "Deleting role..."}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
