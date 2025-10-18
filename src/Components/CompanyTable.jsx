import React, { useState, useContext, useEffect, useMemo } from "react";
import styles from "./CompanyTable.module.css";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../Components/Datafetching/DataProvider";
import api from "../Components/Datafetching/api";

// Direct import at the top level
import * as XLSX from "xlsx";

export default function CompanyTable({ companyList = [] }) {
  const navigate = useNavigate();
  const { roleid, setadminviewData } = useContext(DataContext);

  // Filters & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [fieldOfWorkList, setFieldOfWorkList] = useState([]);

  // Sorting state
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  // ✅ Fetch Field of Work List from API
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await api.post(
          "/generic/getcombyfield",
          { userId: "39" },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data?.statusCode === 200) {
          setFieldOfWorkList(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching field of work list:", error);
      }
    };

    fetchFields();
  }, []);

  // ✅ Deduplicate companies by recid
  const uniqueCompanies = Array.from(
    new Map(
      (companyList || []).map((item) => [item.incubateesrecid, item])
    ).values()
  );

  // Handle sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // If clicking the same column, toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a different column, set it as the sort column and default to asc
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort and filter data using useMemo for performance
  const processedData = useMemo(() => {
    // First sort the data
    let sortedData = [...uniqueCompanies];

    if (sortColumn) {
      sortedData.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        // Handle null/undefined values
        if (aVal === null || aVal === undefined) aVal = "";
        if (bVal === null || bVal === undefined) bVal = "";

        // Handle date sorting
        if (sortColumn.includes("date")) {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
          if (isNaN(aVal)) aVal = new Date(0);
          if (isNaN(bVal)) bVal = new Date(0);
        }

        // Compare values
        let comparison = 0;
        if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal);
        } else {
          comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    // Then filter the data
    return sortedData.filter((item) => {
      const matchesSearch =
        (item.incubateesname || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (item.incubateesfieldofworkname || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStage =
        stageFilter === "all" ||
        (item.incubateesstagelevel &&
          item.incubateesstagelevel === Number(stageFilter));

      const matchesField =
        fieldFilter === "all" ||
        (item.incubateesfieldofworkname &&
          item.incubateesfieldofworkname.toLowerCase() ===
            fieldFilter.toLowerCase());

      return matchesSearch && matchesStage && matchesField;
    });
  }, [
    uniqueCompanies,
    sortColumn,
    sortDirection,
    searchTerm,
    stageFilter,
    fieldFilter,
  ]);

  // ✅ Pagination logic
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = processedData.slice(startIndex, endIndex);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stageFilter, fieldFilter, sortColumn, sortDirection]);

  // Pagination helper
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Helper function to render sort indicator
  const renderSortIndicator = (column) => {
    const isActive = sortColumn === column;
    const isAsc = sortDirection === "asc";

    return (
      <span
        className={`${styles.sortIndicator} ${
          isActive ? styles.activeSort : styles.inactiveSort
        }`}
      >
        {isActive ? (isAsc ? " ▲" : " ▼") : " ↕"}
      </span>
    );
  };

  // Export to CSV function
  const exportToCSV = () => {
    // Create a copy of the data for export
    const exportData = processedData.map((item) => ({
      "Company Name": item.incubateesname || "",
      "Field of Work": item.incubateesfieldofworkname || "",
      Stage: item.incubateesstagelevelname || "",
      "Date of Incorporation": item.incubateesdateofincorporation
        ? new Date(item.incubateesdateofincorporation).toLocaleDateString()
        : "",
      "Date of Incubation": item.incubateesdateofincubation
        ? new Date(item.incubateesdateofincubation).toLocaleDateString()
        : "",
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
      `incubatees_${new Date().toISOString().slice(0, 10)}.csv`
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
      const exportData = processedData.map((item) => ({
        "Company Name": item.incubateesname || "",
        "Field of Work": item.incubateesfieldofworkname || "",
        Stage: item.incubateesstagelevelname || "",
        "Date of Incorporation": item.incubateesdateofincorporation
          ? new Date(item.incubateesdateofincorporation).toLocaleDateString()
          : "",
        "Date of Incubation": item.incubateesdateofincubation
          ? new Date(item.incubateesdateofincubation).toLocaleDateString()
          : "",
      }));

      // Create a workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Incubatees");

      // Generate the Excel file and download
      XLSX.writeFile(
        wb,
        `incubatees_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting to Excel. Falling back to CSV export.");
      exportToCSV();
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>Incubatees</h2>
        <div className={styles.exportButtons}>
          <button
            className={styles.exportButton}
            onClick={exportToCSV}
            title="Export as CSV"
          >
            Export CSV
          </button>
          <button
            className={`${styles.exportButton} ${
              !isXLSXAvailable ? styles.disabledButton : ""
            }`}
            onClick={exportToExcel}
            title={
              isXLSXAvailable ? "Export as Excel" : "Excel export not available"
            }
            disabled={!isXLSXAvailable}
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search companies or fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.input}
        />

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Stages</option>
          <option value="1">Pre Seed</option>
          <option value="2">Seed Stage</option>
          <option value="3">Early Stage</option>
          <option value="4">Growth Stage</option>
          <option value="5">Expansion Stage</option>
        </select>

        {/* ✅ New Field of Work Filter */}
        <select
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Fields</option>
          {fieldOfWorkList.map((field, index) => (
            <option key={index} value={field.fieldofworkname}>
              {field.fieldofworkname} ({field.incubatees_count})
            </option>
          ))}
        </select>

        <select
          value={itemsPerPage}
          onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
          className={styles.select}
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>

      {/* Results Info */}
      <div className={styles.resultsInfo}>
        Showing {startIndex + 1} to {Math.min(endIndex, processedData.length)}{" "}
        of {processedData.length} entries
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("incubateesname")}
              >
                Company {renderSortIndicator("incubateesname")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("incubateesfieldofworkname")}
              >
                Field of Work {renderSortIndicator("incubateesfieldofworkname")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("incubateesstagelevel")}
              >
                Stage {renderSortIndicator("incubateesstagelevel")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("incubateesdateofincorporation")}
              >
                Date of Incorporation{" "}
                {renderSortIndicator("incubateesdateofincorporation")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("incubateesdateofincubation")}
              >
                Date of Incubation{" "}
                {renderSortIndicator("incubateesdateofincubation")}
              </th>
              {(Number(roleid) === 1 || Number(roleid) === 3) && (
                <th>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentData.map((item) => (
              <tr key={item.incubateesrecid}>
                <td>{item.incubateesname}</td>
                <td>{item.incubateesfieldofworkname}</td>
                <td>
                  <span
                    className={`${styles.badge} ${
                      styles[item.incubateesstagelevel]
                    }`}
                  >
                    {item.incubateesstagelevelname || "—"}
                  </span>
                </td>
                <td>
                  {item.incubateesdateofincorporation
                    ? new Date(
                        item.incubateesdateofincorporation
                      ).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  {item.incubateesdateofincubation
                    ? new Date(
                        item.incubateesdateofincubation
                      ).toLocaleDateString()
                    : "-"}
                </td>

                {(Number(roleid) === 1 ||
                  Number(roleid) === 3 ||
                  Number(roleid) === 7) && (
                  <td>
                    <button
                      className={styles.buttonPrimary}
                      style={{
                        background: "#4f46e5",
                        color: "#fff",
                        borderRadius: "0.3rem",
                        padding: "0.4rem 0.8rem",
                        borderColor: "#4f46e5",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setadminviewData(item.usersrecid);
                        navigate("/startup/Dashboard", {
                          state: {
                            usersrecid: item.usersrecid,
                            companyName: item.incubateesname,
                          },
                        });
                      }}
                    >
                      View Details
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {processedData.length === 0 && (
          <div className={styles.noData}>
            No companies found matching your criteria.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={`${styles.paginationBtn} ${
              currentPage === 1 ? styles.disabled : ""
            }`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className={styles.ellipsis}>...</span>
              ) : (
                <button
                  className={`${styles.paginationBtn} ${styles.pageNumber} ${
                    currentPage === page ? styles.active : ""
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          <button
            className={`${styles.paginationBtn} ${
              currentPage === totalPages ? styles.disabled : ""
            }`}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
