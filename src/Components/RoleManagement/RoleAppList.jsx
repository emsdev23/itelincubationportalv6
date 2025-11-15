import React, { useEffect, useState, useMemo } from "react";
import { FaSpinner, FaSave, FaTimes } from "react-icons/fa";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

// Material UI imports
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { IPAdress } from "../Datafetching/IPAdrees";
import {
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

// Styled components for custom styling
const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(2),
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  padding: theme.spacing(0.5),
}));

const PermissionLabel = styled(Box)(({ theme, enabled }) => ({
  marginLeft: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: enabled ? "#e8f5e9" : "#ffebee",
  color: enabled ? "#2e7d32" : "#c62828",
  fontSize: "0.75rem",
  fontWeight: 500,
}));

export default function RoleAppList({ roleId, roleName, token, userId }) {
  const API_BASE_URL = IPAdress;

  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pagination state for Material UI
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  // Fetch applications whenever the roleId prop changes
  useEffect(() => {
    if (roleId === null || roleId === undefined) return;

    console.log("Fetching apps for roleId:", roleId);

    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/itelinc/resources/generic/getapplist`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        userid: userId || "1",
        "X-Module": "Roles Management",
        "X-Action": "Fetching Apps List",
      },
      body: JSON.stringify({
        userId: userId || 35,
        roleId: roleId,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("API Response:", data);
        if (data.statusCode === 200) {
          // Add a unique ID for each app using the appsinrolesguiid field
          const processedData = (data.data || []).map((app) => ({
            ...app,
            // Check if the app is assigned to the current role
            isAssigned: app.appsinrolesroleid === roleId,
            // Use the appsinrolesguiid as the app ID
            appId: app.appsinrolesguiid,
          }));
          setApps(processedData);
          setFilteredApps(processedData);
        } else {
          throw new Error(data.message || "Failed to fetch application list");
        }
      })
      .catch((err) => {
        console.error("Error fetching application list:", err);
        setError("Failed to load application list. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [roleId, token, userId]);

  // Filter logic
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredApps(apps);
    } else {
      const filtered = apps.filter(
        (app) =>
          app.guiappsappname
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          app.guiappspath.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  }, [searchQuery, apps]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [searchQuery]);

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Handle checkbox changes for permissions
  const handlePermissionChange = (appId, accessType, isChecked) => {
    const updatedApps = apps.map((app) => {
      if (app.appId === appId) {
        return {
          ...app,
          [accessType]: isChecked ? 1 : 0,
        };
      }
      return app;
    });

    setApps(updatedApps);
    setHasChanges(true);
  };

  // Handle assignment checkbox changes
  const handleAssignmentChange = (appId, isChecked) => {
    const updatedApps = apps.map((app) => {
      if (app.appId === appId) {
        return {
          ...app,
          isAssigned: isChecked,
          // When unassigning, reset permissions
          appsreadaccess: isChecked ? app.appsreadaccess : 0,
          appswriteaccess: isChecked ? app.appswriteaccess : 0,
        };
      }
      return app;
    });

    setApps(updatedApps);
    setHasChanges(true);
  };

  // Save changes to the API
  const saveChanges = () => {
    setIsSaving(true);

    // Create promises for each app update
    const updatePromises = apps.map((app) => {
      const params = new URLSearchParams();
      params.append("appsinrolesroleid", app.isAssigned ? roleId : 0);
      // Use the actual appsinrolesguiid from the API response
      params.append("appsinrolesguiid", app.appsinrolesguiid);
      params.append("appsreadaccess", app.isAssigned ? app.appsreadaccess : 0);
      params.append(
        "appswriteaccess",
        app.isAssigned ? app.appswriteaccess : 0
      );
      params.append("appsinrolesadminstate", "1"); // Default to enabled
      params.append("appsinrolescreatedby", userId || "system");
      params.append("appsinrolesmodifiedby", userId || "system");

      return fetch(
        `${API_BASE_URL}/itelinc/addAppsInRoles?${params.toString()}`,
        {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
    });

    Promise.all(updatePromises)
      .then((responses) => Promise.all(responses.map((res) => res.json())))
      .then((data) => {
        console.log("Update responses:", data);
        setHasChanges(false);
        // Show success message with SweetAlert2
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Applications and permissions updated successfully!",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        });
      })
      .catch((err) => {
        console.error("Error updating permissions:", err);
        // Show error message with SweetAlert2
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to update applications and permissions. Please try again.",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  // Cancel changes
  const cancelChanges = () => {
    // Reset to original data
    setLoading(true);

    fetch(`${API_BASE_URL}/itelinc/resources/generic/getapplist`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || 35,
        roleId: roleId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          const processedData = (data.data || []).map((app) => ({
            ...app,
            isAssigned: app.appsinrolesroleid === roleId,
            appId: app.appsinrolesguiid,
          }));
          setApps(processedData);
          setFilteredApps(processedData);
          setHasChanges(false);
        } else {
          throw new Error(data.message || "Failed to fetch application list");
        }
      })
      .catch((err) => {
        console.error("Error resetting application list:", err);
        setError("Failed to reset application list. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  // Export to CSV function
  const exportToCSV = () => {
    // Create a copy of the data for export
    const exportData = filteredApps.map((item) => ({
      "App Name": item.guiappsappname || "",
      Path: item.guiappspath || "",
      Assigned: item.isAssigned ? "Yes" : "No",
      "Read Access": item.appsreadaccess === 1 ? "Enabled" : "Disabled",
      "Write Access": item.appswriteaccess === 1 ? "Enabled" : "Disabled",
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
      `role_${roleName}_apps_${new Date().toISOString().slice(0, 10)}.csv`
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
      const exportData = filteredApps.map((item) => ({
        "App Name": item.guiappsappname || "",
        Path: item.guiappspath || "",
        Assigned: item.isAssigned ? "Yes" : "No",
        "Read Access": item.appsreadaccess === 1 ? "Enabled" : "Disabled",
        "Write Access": item.appswriteaccess === 1 ? "Enabled" : "Disabled",
      }));

      // Create a workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Applications");

      // Generate the Excel file and download
      XLSX.writeFile(
        wb,
        `role_${roleName}_apps_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting to Excel. Falling back to CSV export.");
      exportToCSV();
    }
  };

  // Define columns for DataGrid
  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: 80,
      sortable: false,
      renderCell: (params) => {
        return (
          params.api.getRowIndexRelativeToVisibleRows(params.row.id) +
          1 +
          paginationModel.page * paginationModel.pageSize
        );
      },
    },
    {
      field: "guiappsappname",
      headerName: "App Name",
      width: 200,
      sortable: true,
    },
    {
      field: "guiappspath",
      headerName: "Path",
      width: 300,
      sortable: true,
      renderCell: (params) => (
        <Box
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
          title={params.value}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: "isAssigned",
      headerName: "Assigned",
      width: 120,
      sortable: true,
      renderCell: (params) => (
        <StyledCheckbox
          checked={params.row.isAssigned}
          onChange={(e) =>
            handleAssignmentChange(params.row.appId, e.target.checked)
          }
        />
      ),
    },
    {
      field: "appsreadaccess",
      headerName: "Read Access",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <StyledCheckbox
            checked={params.row.appsreadaccess === 1}
            onChange={(e) =>
              handlePermissionChange(
                params.row.appId,
                "appsreadaccess",
                e.target.checked
              )
            }
            disabled={!params.row.isAssigned}
          />
          <PermissionLabel enabled={params.row.appsreadaccess === 1}>
            {params.row.appsreadaccess === 1 ? "Enabled" : "Disabled"}
          </PermissionLabel>
        </Box>
      ),
    },
    {
      field: "appswriteaccess",
      headerName: "Write Access",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <StyledCheckbox
            checked={params.row.appswriteaccess === 1}
            onChange={(e) =>
              handlePermissionChange(
                params.row.appId,
                "appswriteaccess",
                e.target.checked
              )
            }
            disabled={!params.row.isAssigned}
          />
          <PermissionLabel enabled={params.row.appswriteaccess === 1}>
            {params.row.appswriteaccess === 1 ? "Enabled" : "Disabled"}
          </PermissionLabel>
        </Box>
      ),
    },
  ];

  // Add unique ID to each row if not present
  const rowsWithId = useMemo(() => {
    return filteredApps.map((item) => ({
      ...item,
      id: item.appId || Math.random().toString(36).substr(2, 9), // Fallback ID
    }));
  }, [filteredApps]);

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">
          📱 Applications for Role: {roleName}
        </Typography>
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
          {hasChanges && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={
                  isSaving ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <FaSave />
                  )
                }
                onClick={saveChanges}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<FaTimes />}
                onClick={cancelChanges}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </>
          )}
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
          label="Search by name or path..."
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
          filteredApps.length
        )}{" "}
        of {filteredApps.length} entries
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
            rowCount={filteredApps.length}
            paginationMode="client"
          />
        )}
      </StyledPaper>

      {filteredApps.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
          {searchQuery
            ? "No applications found matching your search"
            : "No applications found for this role"}
        </Box>
      )}

      {/* Loading overlay for operations */}
      {isSaving && (
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
            <Typography>Saving changes...</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
