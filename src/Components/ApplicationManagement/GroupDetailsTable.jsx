import React, { useEffect, useState, useMemo } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import GroupApplicationDetails from "./GroupApplicationDetails"; // Import detail component
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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

const StyledChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = (status) => {
    return status === 1
      ? { backgroundColor: "#e8f5e9", color: "#2e7d32" }
      : { backgroundColor: "#ffebee", color: "#c62828" };
  };

  return {
    ...getStatusColor(status),
    fontWeight: 500,
    borderRadius: 4,
  };
});

export default function GroupDetailsTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");

  const API_BASE_URL = IPAdress;

  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // State to manage the selected group for the detail view
  const [selectedGroup, setSelectedGroup] = useState({ id: null, name: "" });

  // Pagination state for Material UI
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(
        (group) =>
          group.grpappsgroupname
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          group.grpappsdescription
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [searchQuery]);

  const clearSearch = () => setSearchQuery("");

  const fetchGroups = () => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/itelinc/resources/generic/getgroupdetails`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        userid: userId || "1",
        "X-Module": "Application Management",
        "X-Action": "Fetching Application Group Details",
      },
      body: JSON.stringify({
        userId: userId || 1,
        userIncId: incUserid || 0,
        groupId: "ALL",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          setGroups(data.data || []);
          setFilteredGroups(data.data || []);
        } else {
          throw new Error(data.message || "Failed to fetch group details");
        }
      })
      .catch((err) => {
        console.error("Error fetching group details:", err);
        setError("Failed to load group details. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Handler for when a group is clicked
  const handleGroupClick = (group) => {
    setSelectedGroup({ id: group.grpappsrecid, name: group.grpappsgroupname });
  };

  // Export to CSV function
  const exportToCSV = () => {
    // Create a copy of the data for export
    const exportData = filteredGroups.map((item) => ({
      "Group Name": item.grpappsgroupname || "",
      Description: item.grpappsdescription || "",
      State: item.grpappsadminstate === 1 ? "Enabled" : "Disabled",
      "Created Time": item.grpappscreatedtime?.replace("T", " ") || "",
      "Modified Time": item.grpappsmodifiedtime?.replace("T", " ") || "",
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
      `application_groups_${new Date().toISOString().slice(0, 10)}.csv`
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
      const exportData = filteredGroups.map((item) => ({
        "Group Name": item.grpappsgroupname || "",
        Description: item.grpappsdescription || "",
        State: item.grpappsadminstate === 1 ? "Enabled" : "Disabled",
        "Created Time": item.grpappscreatedtime?.replace("T", " ") || "",
        "Modified Time": item.grpappsmodifiedtime?.replace("T", " ") || "",
      }));

      // Create a workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Application Groups");

      // Generate the Excel file and download
      XLSX.writeFile(
        wb,
        `application_groups_${new Date().toISOString().slice(0, 10)}.xlsx`
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
      field: "grpappsgroupname",
      headerName: "Group Name",
      width: 200,
      sortable: true,
      renderCell: (params) => {
        return (
          <Button
            variant="text"
            color="primary"
            onClick={() => handleGroupClick(params.row)}
            sx={{ justifyContent: "flex-start", textTransform: "none" }}
          >
            {params.row.grpappsgroupname}
          </Button>
        );
      },
    },
    {
      field: "grpappsdescription",
      headerName: "Description",
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
      field: "grpappsadminstate",
      headerName: "State",
      width: 120,
      sortable: true,
      renderCell: (params) => {
        return (
          <StyledChip
            label={params.value === 1 ? "Enabled" : "Disabled"}
            size="small"
            status={params.value}
          />
        );
      },
    },
    {
      field: "grpappscreatedtime",
      headerName: "Created Time",
      width: 180,
      sortable: true,
      renderCell: (params) => {
        return params.value?.replace("T", " ") || "-";
      },
    },
    {
      field: "grpappsmodifiedtime",
      headerName: "Modified Time",
      width: 180,
      sortable: true,
      renderCell: (params) => {
        return params.value?.replace("T", " ") || "-";
      },
    },
  ];

  // Add unique ID to each row if not present
  const rowsWithId = useMemo(() => {
    return filteredGroups.map((item) => ({
      ...item,
      id: item.grpappsrecid || Math.random().toString(36).substr(2, 9), // Fallback ID
    }));
  }, [filteredGroups]);

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
        <Typography variant="h5">📋 Application Group Details</Typography>
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
          filteredGroups.length
        )}{" "}
        of {filteredGroups.length} entries
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
            rowCount={filteredGroups.length}
            paginationMode="client"
          />
        )}
      </StyledPaper>

      {filteredGroups.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
          {searchQuery
            ? "No groups found matching your search"
            : "No groups found"}
        </Box>
      )}

      {/* Render the detail component below */}
      {selectedGroup.id && (
        <Box sx={{ mt: 3 }}>
          <GroupApplicationDetails
            groupId={selectedGroup.id}
            groupName={selectedGroup.name}
            token={token}
            userId={userId}
            incUserid={incUserid}
          />
        </Box>
      )}
    </Box>
  );
}
