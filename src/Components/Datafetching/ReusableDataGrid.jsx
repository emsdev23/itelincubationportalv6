import React, { useState, useMemo, useRef } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { FaFilter, FaTimes } from "react-icons/fa";

// Material UI imports
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import {
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tooltip,
  IconButton,
  Popover,
  Card,
  CardContent,
  CardActions,
  Skeleton,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// --- START: SHIMMER COMPONENT ---
const ShimmerContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(2),
  backgroundColor: "#fff",
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
}));

const ShimmerFiltersContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  flexWrap: "wrap",
}));

const TableShimmer = ({
  title,
  enableExport,
  columnCount = 8,
  rowCount = 10,
}) => {
  return (
    <ShimmerContainer>
      {/* Title and Export Buttons Shimmer */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Skeleton variant="text" width={200} height={32} />
        {enableExport && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Skeleton variant="rectangular" width={120} height={36} rx={4} />
            <Skeleton variant="rectangular" width={130} height={36} rx={4} />
          </Box>
        )}
      </Box>

      {/* Filters Shimmer */}
      <ShimmerFiltersContainer>
        <Skeleton variant="rectangular" width={250} height={40} rx={4} />
        <Skeleton variant="rectangular" width={200} height={40} rx={4} />
        <Skeleton variant="rectangular" width={120} height={40} rx={4} />
      </ShimmerFiltersContainer>

      {/* Table Shimmer using Material-UI DataGrid skeleton structure */}
      <Box sx={{ width: "100%" }}>
        {/* Header Row Shimmer */}
        <Box sx={{ display: "flex", borderBottom: "1px solid #e0e0e0", pb: 1 }}>
          {Array.from({ length: columnCount }).map((_, index) => (
            <Skeleton
              key={`header-${index}`}
              variant="text"
              height={24}
              sx={{ flex: 1, mx: 1 }}
            />
          ))}
        </Box>

        {/* Data Rows Shimmer */}
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <Box
            key={`row-${rowIndex}`}
            sx={{ display: "flex", borderBottom: "1px solid #f0f0f0", py: 1 }}
          >
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                variant="text"
                height={20}
                sx={{ flex: 1, mx: 1 }}
              />
            ))}
          </Box>
        ))}
      </Box>
    </ShimmerContainer>
  );
};
// --- END: SHIMMER COMPONENT ---

// Styled components for the main grid
const StyledPaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(2),
  boxShadow: "none",
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledChip = styled(Chip)(({ theme, customcolor }) => ({
  backgroundColor: customcolor?.backgroundColor || "#f3f4f6",
  color: customcolor?.color || "#374151",
  fontWeight: 500,
  borderRadius: 4,
}));

// Common date formatting function
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  } catch (error) {
    console.error("Error parsing date:", error);
    return dateString;
  }
};

/**
 * ReusableDataGrid - A flexible, feature-rich data grid component
 */
export default function ReusableDataGrid({
  data = [],
  columns = [],
  title = "Data Table",
  dropdownFilters = [],
  enableExport = true,
  enableColumnFilters = true,
  searchPlaceholder = "Search...",
  searchFields = [],
  uniqueIdField = "id",
  onExportData = null,
  exportConfig = {},
  className = "",
  loading = false,
  shimmerRowCount = 10,
}) {
  // --- FIX: ALL HOOKS MUST BE CALLED ON EVERY RENDER ---
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownFilterValues, setDropdownFilterValues] = useState(
    dropdownFilters.reduce(
      (acc, filter) => ({ ...acc, [filter.field]: "all" }),
      {}
    )
  );
  const [columnFilters, setColumnFilters] = useState({});
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filterColumn, setFilterColumn] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const filterInputRef = useRef(null);

  const handleFilterPopoverEnter = () => {
    if (filterInputRef.current) {
      filterInputRef.current.focus();
    }
  };

  // Memoized values are calculated on every render, but only used if `loading` is false.
  // This is correct and prevents the hook order error.
  const uniqueData = useMemo(() => {
    const hasValidIds = data.every((item) => item[uniqueIdField]);
    if (!hasValidIds) return data;
    return Array.from(
      new Map(data.map((item) => [item[uniqueIdField], item])).values()
    );
  }, [data, uniqueIdField]);

  const filteredData = useMemo(() => {
    return uniqueData.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        searchFields.some((field) =>
          (item[field] || "").toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesDropdowns = dropdownFilters.every((filter) => {
        const filterValue = dropdownFilterValues[filter.field];
        if (filterValue === "all") return true;
        const itemValue = item[filter.field];
        if (!itemValue) return false;
        return (
          itemValue.toString().toLowerCase() ===
          filterValue.toString().toLowerCase()
        );
      });

      const matchesColumnFilters = Object.entries(columnFilters).every(
        ([field, value]) => {
          if (!value) return true;
          return (item[field] || "")
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        }
      );

      return matchesSearch && matchesDropdowns && matchesColumnFilters;
    });
  }, [
    uniqueData,
    searchTerm,
    dropdownFilterValues,
    columnFilters,
    searchFields,
    dropdownFilters,
  ]);

  const dataGridColumns = useMemo(() => {
    return columns.map((col) => {
      const baseColumn = {
        field: col.field,
        headerName: col.headerName,
        width: col.width || 150,
        sortable: col.sortable !== false,
        renderHeader: (params) => {
          if (
            enableColumnFilters &&
            col.filterable !== false &&
            col.type !== "actions"
          ) {
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography noWrap>{col.headerName}</Typography>
                <Tooltip title="Filter">
                  <IconButton
                    size="small"
                    onClick={(e) => handleFilterClick(e, col.field)}
                    color={columnFilters[col.field] ? "primary" : "default"}
                  >
                    <FaFilter size={14} />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          }
          return <Typography noWrap>{col.headerName}</Typography>;
        },
      };

      if (col.type === "date") {
        baseColumn.renderCell = (params) => {
          if (!params?.row) return "-";
          return formatDate(params.row[col.field]);
        };
      } else if (col.type === "chip") {
        baseColumn.renderCell = (params) => {
          if (!params?.row) return <StyledChip label="—" size="small" />;
          const value = params.row[col.field];
          const displayValue = col.displayField
            ? params.row[col.displayField]
            : value;
          const customColor = col.chipColors ? col.chipColors[value] : null;
          return (
            <StyledChip
              label={displayValue || "—"}
              size="small"
              customcolor={customColor}
            />
          );
        };
      } else if (col.type === "actions") {
        baseColumn.sortable = false;
        baseColumn.renderCell = (params) => {
          if (!params?.row) return null;
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              {col.actions.map((action, idx) => (
                <Button
                  key={idx}
                  variant={action.variant || "contained"}
                  size={action.size || "small"}
                  color={action.color || "primary"}
                  startIcon={action.icon}
                  onClick={() => action.onClick(params.row)}
                  disabled={
                    action.disabled ? action.disabled(params.row) : false
                  }
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          );
        };
      } else if (col.renderCell) {
        baseColumn.renderCell = col.renderCell;
      }

      return baseColumn;
    });
  }, [columns, columnFilters, enableColumnFilters]);

  const rowsWithId = useMemo(() => {
    return filteredData.map((item, index) => ({
      ...item,
      id: item[uniqueIdField] || item.id || `row-${index}-${Date.now()}`,
    }));
  }, [filteredData, uniqueIdField]);

  // Filter handlers
  const handleFilterClick = (event, column) => {
    setFilterAnchorEl(event.currentTarget);
    setFilterColumn(column);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
    setFilterColumn(null);
  };

  const handleFilterChange = (column, value) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }));
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const clearFilter = () => {
    setColumnFilters((prev) => ({ ...prev, [filterColumn]: "" }));
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm("");
    setDropdownFilterValues(
      dropdownFilters.reduce(
        (acc, filter) => ({ ...acc, [filter.field]: "all" }),
        {}
      )
    );
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const hasActiveFilters =
    Object.values(columnFilters).some((value) => value !== "") ||
    Object.values(dropdownFilterValues).some((value) => value !== "all") ||
    searchTerm !== "";

  // Export functions
  const getExportData = () => {
    if (onExportData) {
      return onExportData(filteredData);
    }
    return filteredData.map((item) => {
      const row = {};
      columns
        .filter((col) => col.type !== "actions")
        .forEach((col) => {
          const header = col.exportHeader || col.headerName;
          let value = item[col.field];
          if (col.type === "date") {
            value = formatDate(value);
          } else if (col.type === "chip" && col.displayField) {
            value = item[col.displayField];
          }
          row[header] = value || "";
        });
      return row;
    });
  };

  const exportToCSV = () => {
    const exportData = getExportData();
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${exportConfig.filename || "data"}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (!XLSX) {
      alert("Excel export is not available.");
      return;
    }
    try {
      const exportData = getExportData();
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, exportConfig.sheetName || "Data");
      XLSX.writeFile(
        wb,
        `${exportConfig.filename || "data"}_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      exportToCSV();
    }
  };

  // --- FIX: Conditional rendering is now inside the return statement ---
  return (
    <div className={className}>
      {loading ? (
        <TableShimmer
          title={title}
          enableExport={enableExport}
          columnCount={columns.length}
          rowCount={shimmerRowCount}
        />
      ) : (
        <div style={{ marginBottom: "16px" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5">{title}</Typography>
            {enableExport && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download size={16} />}
                  onClick={exportToCSV}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download size={16} />}
                  onClick={exportToExcel}
                  disabled={!XLSX}
                >
                  Export Excel
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            {searchFields.length > 0 && (
              <TextField
                label={searchPlaceholder}
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 250 }}
              />
            )}

            {dropdownFilters.map((filter, idx) => (
              <FormControl
                key={idx}
                size="small"
                sx={{ minWidth: filter.width || 200 }}
              >
                <InputLabel id={`${filter.field}-label`}>
                  {filter.label}
                </InputLabel>
                <Select
                  labelId={`${filter.field}-label`}
                  value={dropdownFilterValues[filter.field]}
                  onChange={(e) =>
                    setDropdownFilterValues((prev) => ({
                      ...prev,
                      [filter.field]: e.target.value,
                    }))
                  }
                  label={filter.label}
                >
                  <MenuItem value="all">All {filter.label}</MenuItem>
                  {filter.options.map((option, optIdx) => (
                    <MenuItem key={optIdx} value={option.value}>
                      {option.label}
                      {option.count !== undefined && ` (${option.count})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}

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

            {hasActiveFilters && (
              <Button
                variant="outlined"
                startIcon={<FaTimes />}
                onClick={clearAllFilters}
                sx={{ height: "fit-content" }}
              >
                Clear All Filters
              </Button>
            )}
          </Box>

          <Box sx={{ mb: 1, color: "text.secondary" }}>
            Showing {paginationModel.page * paginationModel.pageSize + 1} to{" "}
            {Math.min(
              (paginationModel.page + 1) * paginationModel.pageSize,
              filteredData.length
            )}{" "}
            of {filteredData.length} entries
          </Box>

          <StyledPaper>
            <DataGrid
              rows={rowsWithId}
              columns={dataGridColumns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[5, 10, 25, 50]}
              disableRowSelectionOnClick
              sx={{ border: 0 }}
              autoHeight
              disableColumnMenu
            />
          </StyledPaper>

          {filteredData.length === 0 && (
            <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
              No data found matching your criteria.
            </Box>
          )}

          <Popover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={handleFilterClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            onEnter={handleFilterPopoverEnter}
          >
            <Card sx={{ minWidth: 280, maxWidth: 400 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Filter by{" "}
                  {columns.find((c) => c.field === filterColumn)?.headerName}
                </Typography>
                <TextField
                  inputRef={filterInputRef}
                  fullWidth
                  size="small"
                  placeholder={`Enter ${
                    columns.find((c) => c.field === filterColumn)?.headerName
                  }...`}
                  value={columnFilters[filterColumn] || ""}
                  onChange={(e) =>
                    handleFilterChange(filterColumn, e.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleFilterClose();
                    }
                  }}
                  variant="outlined"
                  margin="normal"
                />
              </CardContent>
              <CardActions sx={{ justifyContent: "flex-end" }}>
                <Button size="small" onClick={clearFilter}>
                  Clear
                </Button>
                <Button size="small" onClick={handleFilterClose}>
                  Close
                </Button>
              </CardActions>
            </Card>
          </Popover>
        </div>
      )}
    </div>
  );
}
