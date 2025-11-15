import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Download } from "lucide-react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Box,
  Button,
  Paper,
  Typography,
  Toolbar,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid"; // <-- CORRECT IMPORT PATH
import * as XLSX from "xlsx";

// Styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    maxWidth: "1200px",
    width: "100%",
    maxHeight: "90vh",
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(2),
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor:
    status === 200 ? theme.palette.success.light : theme.palette.error.light,
  color: status === 200 ? theme.palette.success.dark : theme.palette.error.dark,
  fontWeight: 600,
}));

// Date formatting function to handle "2025-11-11T07:32:53Z[UTC]" format
const formatDate = (dateString) => {
  if (!dateString) return "-";

  try {
    // Handle Z[UTC] format by removing [UTC] and parsing the rest
    const cleanTimestamp = dateString.replace("[UTC]", "");
    const date = new Date(cleanTimestamp);

    // Check if the date is valid before formatting
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return date.toLocaleString();
  } catch (error) {
    console.error("Error parsing date:", error);
    return dateString; // Return original string as a fallback
  }
};

// Get today's date in YYYY-MM-DD format
const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AuditLogsModal = ({ isOpen, onClose, IPAddress, token, userid }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state for Material UI
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Fetch logs function
  const fetchLogs = async () => {
    if (!isOpen) return;

    setLoading(true);
    setError("");
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });

    try {
      const start = startDate || getTodayString();
      const end = endDate || getTodayString();

      const response = await fetch(
        `${IPAddress}/itelinc/resources/generic/getauditlogs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            startDate: `${start} 00:00:00`,
            endDate: `${end} 23:59:59`,
            userId: userid.toString(),
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.data) {
        setLogs(result.data);
      } else {
        setError(result.message || "Failed to fetch logs");
      }
    } catch (err) {
      setError("Error fetching logs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refetch logs when date or modal open state changes
  useEffect(() => {
    fetchLogs();
  }, [IPAddress, token, userid, startDate, endDate, isOpen]);

  console.log("Fetched Logs:", logs);

  // Filter data using useMemo for performance
  const filteredData = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        (log.usersname || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (log.auditlogModule || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (log.auditlogAction || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (log.auditlogStatus && log.auditlogStatus.toString() === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [logs, searchTerm, statusFilter]);

  // Define columns for DataGrid with proper null checks
  const columns = [
    {
      field: "usersname",
      headerName: "User Name",
      width: 200,
      sortable: true,
    },
    {
      field: "auditlogModule",
      headerName: "Module",
      width: 180,
      sortable: true,
    },
    {
      field: "auditlogAction",
      headerName: "Action",
      width: 200,
      sortable: true,
    },
    {
      field: "auditlogMessage",
      headerName: "Status Message",
      width: 200,
      sortable: true,
    },
    // {
    //   field: "auditlogStatus",
    //   headerName: "Status",
    //   width: 120,
    //   sortable: true,
    //   renderCell: (params) => {
    //     if (!params || !params.row)
    //       return <StatusChip label="—" size="small" />;
    //     return (
    //       <StatusChip label={params.value} size="small" status={params.value} />
    //     );
    //   },
    // },
    // {
    //   field: "auditlogDurationMs",
    //   headerName: "Duration (ms)",
    //   width: 150,
    //   sortable: true,
    // },
    // {
    //   field: "auditlogTimestampStart",
    //   headerName: "Start Time",
    //   width: 200,
    //   sortable: true,
    //   renderCell: (params) => {
    //     if (!params || !params.row) return "-";
    //     return formatDate(params.row.auditlogTimestampStart);
    //   },
    // },
    {
      field: "auditlogTimestampEnd",
      headerName: "Time Stamp",
      width: 200,
      sortable: true,
      renderCell: (params) => {
        if (!params || !params.row) return "-";
        return formatDate(params.row.auditlogTimestampEnd);
      },
    },
  ];

  // Add unique ID to each row if not present
  const rowsWithId = useMemo(() => {
    return filteredData.map((item, index) => ({
      ...item,
      id: item.auditlogId || `log-${index}`, // Fallback ID
    }));
  }, [filteredData]);

  // Export to CSV function
  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = [
      "User Name",
      "Module",
      "Action",
      "Status",
      "Duration (ms)",
      "Start Time",
      "End Time",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredData.map((log) =>
        [
          `"${log.usersname}"`,
          `"${log.auditlogModule}"`,
          `"${log.auditlogAction}"`,
          log.auditlogStatus,
          log.auditlogDurationMs,
          `"${formatDate(log.auditlogTimestampStart)}"`,
          `"${formatDate(log.auditlogTimestampEnd)}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-logs-${getTodayString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (filteredData.length === 0) return;

    try {
      const exportData = filteredData.map((log) => ({
        "User Name": log.usersname || "",
        Module: log.auditlogModule || "",
        Action: log.auditlogAction || "",
        Status: log.auditlogStatus || "",
        "Duration (ms)": log.auditlogDurationMs || "",
        "Start Time": formatDate(log.auditlogTimestampStart),
        "End Time": formatDate(log.auditlogTimestampEnd),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
      XLSX.writeFile(wb, `audit-logs-${getTodayString()}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting to Excel. Falling back to CSV export.");
      exportToCSV();
    }
  };

  return (
    <StyledDialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" component="div">
          Audit Logs
        </Typography>
        <IconButton edge="end" onClick={onClose}>
          <X />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Filters */}
        <StyledPaper elevation={1} sx={{ p: 2 }}>
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 200 }}
            />

            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: startDate }}
              sx={{ minWidth: 200 }}
            />

            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="200">Success</MenuItem>
                <MenuItem value="400">Client Error</MenuItem>
                <MenuItem value="500">Server Error</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <Search size={18} />
                )
              }
              disabled={loading}
              onClick={fetchLogs}
            >
              {loading ? "Loading..." : "Fetch Logs"}
            </Button>

            {logs.length > 0 && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Download size={18} />}
                  onClick={exportToCSV}
                  title="Export as CSV"
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download size={18} />}
                  onClick={exportToExcel}
                  title="Export as Excel"
                >
                  Export Excel
                </Button>
              </>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </StyledPaper>

        {/* Results Info */}
        <Box sx={{ mb: 1, color: "text.secondary" }}>
          Showing {paginationModel.page * paginationModel.pageSize + 1} to{" "}
          {Math.min(
            (paginationModel.page + 1) * paginationModel.pageSize,
            filteredData.length
          )}{" "}
          of {filteredData.length} entries
        </Box>

        {/* Material UI DataGrid */}
        <StyledPaper>
          <DataGrid
            rows={rowsWithId}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25, 50, 100]}
            disableRowSelectionOnClick
            sx={{ border: 0 }}
            autoHeight
            loading={loading}
          />
        </StyledPaper>

        {filteredData.length === 0 && !loading && (
          <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
            No logs found matching your criteria.
          </Box>
        )}
      </DialogContent>
    </StyledDialog>
  );
};

export default AuditLogsModal;
