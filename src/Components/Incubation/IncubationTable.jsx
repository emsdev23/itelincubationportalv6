import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaSpinner,
  FaSearch,
  FaFileCsv,
  FaFileExcel,
} from "react-icons/fa";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import "./IncubationTable.css";
import { IPAdress } from "../Datafetching/IPAdrees";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

// Common date formatting function
const formatDate = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    // Format: YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original if formatting fails
  }
};

export default function IncubationTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");
  const IP = IPAdress;
  const [incubations, setIncubations] = useState([]);
  const [filteredIncubations, setFilteredIncubations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Loading states for operations
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(null); // Store incubation ID being updated
  const [isDeleting, setIsDeleting] = useState(null); // Store incubation ID being deleted

  // Function to filter incubations based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredIncubations(incubations);
    } else {
      const filtered = incubations.filter(
        (incubation) =>
          incubation.incubationsname
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          incubation.incubationshortname
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredIncubations(filtered);
    }
  }, [searchQuery, incubations]);

  // Define columns for DataGrid
  const columns = [
    {
      field: "sno",
      headerName: "S.No",
      width: 70,
      sortable: true,
      sortComparator: (v1, v2) => v1 - v2,
      renderCell: (params) =>
        params.api.getRowIndexRelativeToVisibleRows(params.row.id) + 1,
    },
    {
      field: "incubationsname",
      headerName: "Name",
      width: 200,
      sortable: true,
    },
    {
      field: "incubationshortname",
      headerName: "Short Name",
      width: 150,
      sortable: true,
    },
    {
      field: "incubationsemail",
      headerName: "Email",
      width: 200,
      sortable: true,
    },
    {
      field: "incubationswebsite",
      headerName: "Website",
      width: 200,
      sortable: true,
      renderCell: (params) => {
        if (params.value) {
          return (
            <a
              href={params.value}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1976d2", textDecoration: "none" }}
            >
              {params.value}
            </a>
          );
        }
        return "";
      },
    },

    {
      field: "incubationscreatedtime",
      headerName: "Created Time",
      width: 180,
      sortable: true,
      renderCell: (params) => {
        // Safely access the row data
        if (params.row && params.row.incubationscreatedtime) {
          return formatDate(params.row.incubationscreatedtime);
        }
        return "";
      },
      sortComparator: (v1, v2, params1, params2) => {
        // Safely access the row data for sorting
        const date1 = params1.row?.incubationscreatedtime
          ? new Date(params1.row.incubationscreatedtime)
          : new Date(0);
        const date2 = params2.row?.incubationscreatedtime
          ? new Date(params2.row.incubationscreatedtime)
          : new Date(0);
        return date1 - date2;
      },
    },
    {
      field: "incubationsmodifiedtime",
      headerName: "Modified Time",
      width: 180,
      sortable: true,
      renderCell: (params) => {
        // Safely access the row data
        if (params.row && params.row.incubationsmodifiedtime) {
          return formatDate(params.row.incubationsmodifiedtime);
        }
        return "";
      },
      sortComparator: (v1, v2, params1, params2) => {
        // Safely access the row data for sorting
        const date1 = params1.row?.incubationsmodifiedtime
          ? new Date(params1.row.incubationsmodifiedtime)
          : new Date(0);
        const date2 = params2.row?.incubationsmodifiedtime
          ? new Date(params2.row.incubationsmodifiedtime)
          : new Date(0);
        return date1 - date2;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <div>
          <IconButton
            color="primary"
            onClick={() => handleEdit(params.row)}
            disabled={
              isUpdating === params.row.incubationsrecid ||
              isDeleting === params.row.incubationsrecid
            }
          >
            {isUpdating === params.row.incubationsrecid ? (
              <FaSpinner className="spinner" size={18} />
            ) : (
              <FaEdit size={18} />
            )}
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete(params.row)}
            disabled={
              isDeleting === params.row.incubationsrecid ||
              isUpdating === params.row.incubationsrecid
            }
          >
            {isDeleting === params.row.incubationsrecid ? (
              <FaSpinner className="spinner" size={18} />
            ) : (
              <FaTrash size={18} />
            )}
          </IconButton>
        </div>
      ),
    },
  ];

  // Transform data for DataGrid
  const rows = useMemo(() => {
    return filteredIncubations.map((incubation, index) => ({
      id: incubation.incubationsrecid,
      sno: index + 1, // Add sno for sorting
      ...incubation,
    }));
  }, [filteredIncubations]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "S.No",
      "Name",
      "Short Name",
      "Email",
      "Website",
      "Created Time",
      "Modified Time",
    ];

    const csvData = rows.map((row, index) => [
      index + 1,
      row.incubationsname,
      row.incubationshortname,
      row.incubationsemail,
      row.incubationswebsite,
      formatDate(row.incubationscreatedtime),
      formatDate(row.incubationsmodifiedtime),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "incubations.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel
  const exportToExcel = () => {
    const headers = [
      "S.No",
      "Name",
      "Short Name",
      "Email",
      "Website",
      "Created Time",
      "Modified Time",
    ];

    const excelData = rows.map((row, index) => ({
      "S.No": index + 1,
      Name: row.incubationsname,
      "Short Name": row.incubationshortname,
      Email: row.incubationsemail,
      Website: row.incubationswebsite,
      "Created Time": formatDate(row.incubationscreatedtime),
      "Modified Time": formatDate(row.incubationsmodifiedtime),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Incubations");
    XLSX.writeFile(workbook, "incubations.xlsx");
  };

  // ✅ Fetch all incubations
  const fetchIncubations = () => {
    setLoading(true);
    setError(null);
    fetch(`${IP}/itelinc/resources/generic/getincubationdetails`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        userid: userId || "1",
        "X-Module": "Incubator List",
        "X-Action": "Fetching all Incubators",
      },
      body: JSON.stringify({
        userId: userId || 1,
        userIncId: incUserid || 0,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          setIncubations(data.data || []);
          setFilteredIncubations(data.data || []);
        } else {
          throw new Error(data.message || "Failed to fetch incubations");
        }
      })
      .catch((err) => {
        console.error("Error fetching incubations:", err);
        setError("Failed to load incubations. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  // ✅ Delete incubation
  const handleDelete = (incubation) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${incubation.incubationsname}. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(incubation.incubationsrecid);
        const deleteUrl = `${IP}/itelinc/deleteIncubation?incubationsmodifiedby=${
          userId || "system"
        }&incubationsrecid=${incubation.incubationsrecid}`;

        fetch(deleteUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
            userid: userId || "1",
            "X-Module": "Incubator list",
            "X-Action": "Deleting Incubator",
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire(
                "Deleted!",
                `${incubation.incubationsname} has been deleted successfully.`,
                "success"
              );
              fetchIncubations(); // Refresh the incubation list
            } else {
              throw new Error(data.message || "Failed to delete incubation");
            }
          })
          .catch((err) => {
            console.error("Error deleting incubation:", err);
            Swal.fire(
              "Error",
              `Failed to delete ${incubation.incubationsname}: ${err.message}`,
              "error"
            );
          })
          .finally(() => {
            setIsDeleting(null);
          });
      }
    });
  };

  // ✅ Add new incubation
  const handleAddIncubation = () => {
    Swal.fire({
      title: "Add New Incubation",
      html: `
        <div class="swal-form-container">
          <div class="swal-form-row">
            <input id="swal-name" class="swal2-input" placeholder="Incubation Name" required>
          </div>
          <div class="swal-form-row">
            <input id="swal-shortname" class="swal2-input" placeholder="Short Name" required>
          </div>
          <div class="swal-form-row">
            <input id="swal-email" class="swal2-input" placeholder="Email">
          </div>
          <div class="swal-form-row">
            <input id="swal-website" class="swal2-input" placeholder="Website">
          </div>
          <div class="swal-form-row">
            <input id="swal-address" class="swal2-input" placeholder="Address">
          </div>
          <div class="swal-form-row">
            <input id="swal-founders" class="swal2-input" placeholder="Founders (comma separated)">
          </div>
          <div class="swal-form-row">
            <input id="swal-nooffounders" type="number" class="swal2-input" placeholder="Number of Founders">
          </div>
        </div>
      `,
      width: "600px",
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const name = document.getElementById("swal-name");
        const shortname = document.getElementById("swal-shortname");
        const email = document.getElementById("swal-email");
        const website = document.getElementById("swal-website");
        const address = document.getElementById("swal-address");
        const founders = document.getElementById("swal-founders");
        const nooffounders = document.getElementById("swal-nooffounders");

        if (
          !name ||
          !shortname ||
          !email ||
          !website ||
          !address ||
          !founders ||
          !nooffounders
        ) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }

        if (!name.value || !shortname.value) {
          Swal.showValidationMessage("Please fill all required fields");
          return false;
        }

        return {
          incubationsname: name.value,
          incubationshortname: shortname.value,
          incubationsemail: email.value,
          incubationswebsite: website.value,
          incubationsaddress: address.value,
          incubationsfounders: founders.value,
          incubationsnooffounders: nooffounders.value || null,
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
        `;
        document.head.appendChild(style);
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const formData = result.value;
        setIsAdding(true);

        // Build URL with query parameters for adding incubation
        const params = new URLSearchParams();
        params.append("incubationsname", formData.incubationsname);
        params.append("incubationshortname", formData.incubationshortname);
        params.append("incubationsemail", formData.incubationsemail);
        params.append("incubationswebsite", formData.incubationswebsite);
        params.append("incubationsaddress", formData.incubationsaddress);
        params.append("incubationsfounders", formData.incubationsfounders);
        params.append(
          "incubationsnooffounders",
          formData.incubationsnooffounders
        );
        params.append("incubationslogopath", ""); // Empty logopath for new incubation
        params.append("incubationsadminstate", "1");
        params.append("incubationscreatedby", userId || "1");
        params.append("incubationsmodifiedby", userId || "1");

        const addUrl = `${IP}/itelinc/addIncubation?${params.toString()}`;

        // Prepare the request body with userId and userIncId from session
        const requestBody = {
          userId: parseInt(userId) || 1,
          userIncId: parseInt(incUserid) || 0,
        };

        fetch(addUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            userid: userId || "1",
            "X-Module": "Incubator list",
            "X-Action": "Adding new Incubator",
          },
          body: JSON.stringify(requestBody),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire(
                "✅ Success",
                "Incubation added successfully",
                "success"
              );
              fetchIncubations();
            } else {
              Swal.fire(
                "❌ Error",
                data.message || "Failed to add incubation",
                "error"
              );
            }
          })
          .catch((err) => {
            console.error("Error adding incubation:", err);
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

  // ✅ Edit incubation with popup form
  const handleEdit = (incubation) => {
    Swal.fire({
      title: "Edit Incubator",
      html: `
        <div class="swal-form-container">
          <div class="swal-form-row">
            <input id="swal-name" class="swal2-input" placeholder="Incubation Name" value="${
              incubation.incubationsname || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-shortname" class="swal2-input" placeholder="Short Name" value="${
              incubation.incubationshortname || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-email" class="swal2-input" placeholder="Email" value="${
              incubation.incubationsemail || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-website" class="swal2-input" placeholder="Website" value="${
              incubation.incubationswebsite || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-address" class="swal2-input" placeholder="Address" value="${
              incubation.incubationsaddress || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-founders" class="swal2-input" placeholder="Founders (comma separated)" value="${
              incubation.incubationsfounders || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-nooffounders" type="number" class="swal2-input" placeholder="Number of Founders" value="${
              incubation.incubationsnooffounders || ""
            }">
          </div>
        </div>
      `,
      width: "600px", // Make the popup wider
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        // Get all form values
        const name = document.getElementById("swal-name");
        const shortname = document.getElementById("swal-shortname");
        const email = document.getElementById("swal-email");
        const website = document.getElementById("swal-website");
        const address = document.getElementById("swal-address");
        const founders = document.getElementById("swal-founders");
        const nooffounders = document.getElementById("swal-nooffounders");

        // Validate that all elements exist
        if (
          !name ||
          !shortname ||
          !email ||
          !website ||
          !address ||
          !founders ||
          !nooffounders
        ) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }

        return {
          incubationsname: name.value,
          incubationshortname: shortname.value,
          incubationsemail: email.value,
          incubationswebsite: website.value,
          incubationsaddress: address.value,
          incubationsfounders: founders.value,
          incubationsnooffounders: nooffounders.value || null,
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
        `;
        document.head.appendChild(style);
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const formData = result.value;
        setIsUpdating(incubation.incubationsrecid);

        // ✅ Build URL with query parameters as specified
        const params = new URLSearchParams();
        params.append("incubationsrecid", incubation.incubationsrecid);
        params.append("incubationsname", formData.incubationsname);
        params.append("incubationshortname", formData.incubationshortname);
        params.append("incubationsaddress", formData.incubationsaddress);
        params.append(
          "incubationslogopath",
          incubation.incubationslogopath || ""
        ); // Use existing logopath value
        params.append("incubationswebsite", formData.incubationswebsite);
        params.append("incubationsfounders", formData.incubationsfounders);
        params.append("incubationsemail", formData.incubationsemail);
        params.append(
          "incubationsnooffounders",
          formData.incubationsnooffounders
        );
        params.append("incubationsmodifiedby", userId || "1");
        params.append("incubationsadminstate", "1");

        const updateUrl = `${IP}/itelinc/updateIncubation?${params.toString()}`;

        // Prepare the request body with userId and userIncId from session
        const requestBody = {
          userId: parseInt(userId) || 1,
          userIncId: parseInt(incUserid) || 0,
        };

        fetch(updateUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            userid: userId || "1",
            "X-Module": "Incubator list",
            "X-Action": "Updating Incubator Details",
          },
          body: JSON.stringify(requestBody),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire(
                "✅ Success",
                "Incubation updated successfully",
                "success"
              );
              fetchIncubations();
            } else {
              Swal.fire(
                "❌ Error",
                data.message || "Failed to update incubation",
                "error"
              );
            }
          })
          .catch((err) => {
            console.error("Error updating incubation:", err);
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

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Fetch incubations on component mount
  useEffect(() => {
    fetchIncubations();
  }, []);

  return (
    <div className="doccat-container">
      <div className="doccat-header">
        <h2 className="doccat-title">🏢 Incubations</h2>
        <div className="header-actions">
          <div className="search-container">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or short name..."
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
            onClick={handleAddIncubation}
            disabled={isAdding}
            sx={{ mr: 1 }}
          >
            {isAdding ? "Adding..." : "Add Incubation"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={exportToCSV}
            sx={{ mr: 1 }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={exportToExcel}
          >
            Export Excel
          </Button>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <p className="doccat-empty">Loading incubations...</p>
      ) : (
        <Paper sx={{ width: "100%", mt: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f5f5f5",
                fontWeight: "bold",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #e0e0e0",
              },
            }}
          />
        </Paper>
      )}

      {/* Loading overlay for operations */}
      {(isAdding || isUpdating !== null || isDeleting !== null) && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <FaSpinner className="spinner" size={40} />
            <p>
              {isAdding
                ? "Adding incubator..."
                : isUpdating !== null
                ? "Updating incubator..."
                : "Deleting incubator..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
