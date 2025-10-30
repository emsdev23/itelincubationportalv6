// DocumentTable.jsx
import React, { useState, useContext, useEffect, useMemo } from "react";
import styles from "./DocumentTable.module.css";
import { NavLink } from "react-router-dom";
import { DataContext } from "../Components/Datafetching/DataProvider";
import api from "./Datafetching/api";
import Swal from "sweetalert2";
import style from "../Components/StartupDashboard/StartupDashboard.module.css";
import * as XLSX from "xlsx"; // Add this import for Excel export
import { IPAdress } from "./Datafetching/IPAdrees";

export default function DocumentTable() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const {
    companyDoc,
    loading,
    fromYear,
    toYear,
    setFromYear,
    setToYear,
    userid,
    roleid,
    setCompanyDoc,
  } = useContext(DataContext);

  const [tempFromYear, setTempFromYear] = useState(fromYear);
  const [tempToYear, setTempToYear] = useState(toYear);

  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sorting state
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Loading state for year filter
  const [yearLoading, setYearLoading] = useState(false);

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  // Reset to first page when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    stageFilter,
    statusFilter,
    itemsPerPage,
    sortColumn,
    sortDirection,
  ]);

  // Helper to format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Map stage names to filter values
  const getStageFilterValue = (stageName) => {
    if (!stageName) return "";

    const normalizedStage = stageName.toLowerCase().trim();
    switch (normalizedStage) {
      case "pre seed stage":
        return "1";
      case "seed stage":
        return "2";
      case "early stage":
      case "early":
        return "3";
      case "growth stage":
      case "growth":
        return "4";
      case "expansion stage":
      case "expansion":
        return "5";
      default:
        return "";
    }
  };

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
    let sortedData = [...(companyDoc || [])];

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
      const statusNormalized = (item.status || "").toLowerCase();

      const matchesSearch =
        (item.incubateesname || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (item.documentname || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (item.doccatname || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // FIXED: Compare stage names instead of numbers
      const matchesStage =
        stageFilter === "all" ||
        (item.incubateesstagelevel &&
          getStageFilterValue(item.incubateesstagelevel) === stageFilter);

      const matchesStatus =
        statusFilter === "all" || statusNormalized === statusFilter;

      return matchesSearch && matchesStage && matchesStatus;
    });
  }, [
    companyDoc,
    sortColumn,
    sortDirection,
    searchTerm,
    stageFilter,
    statusFilter,
  ]);

  // Early return AFTER all hooks are defined
  if (loading) return <p>Loading documents...</p>;

  // Pagination calculations
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = processedData.slice(startIndex, endIndex);

  // Get display name for current stage filter
  const getStageDisplayName = (filterValue) => {
    switch (filterValue) {
      case "1":
        return "Pre Seed Stage";
      case "2":
        return "Seed Stage";
      case "3":
        return "Early Stage";
      case "4":
        return "Growth Stage";
      case "5":
        return "Expansion Stage";
      default:
        return "All Stages";
    }
  };

  // Fixed fetchDocumentsByYear function
  const fetchDocumentsByYear = async () => {
    setYearLoading(true);
    try {
      const response = await api.post("/generic/getcollecteddocsdash", {
        userId: Number(roleid) === 1 ? "ALL" : userid,
        startYear: tempFromYear,
        endYear: tempToYear,
      });

      // Handle different response structures
      let responseData;
      if (response.data && Array.isArray(response.data)) {
        responseData = response.data;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        responseData = response.data.data;
      } else if (
        response.data &&
        response.data.result &&
        Array.isArray(response.data.result)
      ) {
        responseData = response.data.result;
      } else {
        console.warn("Unexpected response structure:", response);
        responseData = [];
      }

      setCompanyDoc(responseData);
      setCurrentPage(1);
      setFromYear(tempFromYear);
      setToYear(tempToYear);
    } catch (err) {
      console.error("Error fetching documents by year:", err);
      setCompanyDoc([]);
      alert(
        `Error fetching documents: ${err.message || "Unknown error occurred"}`
      );
    } finally {
      setYearLoading(false);
    }
  };

  // Page navigation functions
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleViewDocument = async (filepath) => {
    try {
      const token = sessionStorage.getItem("token");
      const userid = sessionStorage.getItem("userid");

      const response = await fetch(
        `${IPAdress}/itelinc/resources/generic/getfileurl`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userid: userid,
            url: filepath,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.statusCode === 200 && data.data) {
        const fileUrl = data.data;
        const fileExtension = filepath.split(".").pop().toLowerCase();

        // Previewable formats
        const previewable = ["pdf", "png", "jpeg", "jpg"];

        if (previewable.includes(fileExtension)) {
          // Open preview modal
          setPreviewUrl(fileUrl);
          setIsPreviewOpen(true);
        } else {
          // Non-previewable formats: show SweetAlert to download
          Swal.fire({
            icon: "info",
            title: "No Preview Available",
            text: "This document cannot be previewed. Click download to get the file.",
            showCancelButton: true,
            confirmButtonText: "Download",
            cancelButtonText: "Cancel",
          }).then((result) => {
            if (result.isConfirmed) {
              const link = document.createElement("a");
              link.href = fileUrl;
              link.download = filepath.split("/").pop(); // use original filename
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          });
        }
      } else {
        throw new Error(data.message || "Failed to fetch document");
      }
    } catch (error) {
      console.error("Error fetching file:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to load document: " + error.message,
      });
    }
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
      "Document Category": item.doccatname || "",
      "Document Subcategory": item.docsubcatname || "",
      "Document Name": item.documentname || "",
      Stage: item.incubateesstagelevel || "",
      "Submission Date": item.submission_date
        ? formatDate(item.submission_date)
        : "Not submitted",
      "Due Date": formatDate(item.due_date),
      Status: item.status || "",
      "Document State": item.collecteddocobsoletestate || "---",
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
      `documents_${new Date().toISOString().slice(0, 10)}.csv`
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
        "Document Category": item.doccatname || "",
        "Document Subcategory": item.docsubcatname || "",
        "Document Name": item.documentname || "",
        Stage: item.incubateesstagelevel || "",
        "Submission Date": item.submission_date
          ? formatDate(item.submission_date)
          : "Not submitted",
        "Due Date": formatDate(item.due_date),
        Status: item.status || "",
        "Document State": item.collecteddocobsoletestate || "---",
      }));

      // Create a workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Documents");

      // Generate the Excel file and download
      XLSX.writeFile(
        wb,
        `documents_${new Date().toISOString().slice(0, 10)}.xlsx`
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
        <h2>Incubatee Document Submission</h2>
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

      <div className={styles.filters}>
        <input
          type="number"
          value={tempFromYear}
          onChange={(e) => setTempFromYear(e.target.value)}
          placeholder="From Year"
          className={styles.input}
        />
        <input
          type="number"
          value={tempToYear}
          onChange={(e) => setTempToYear(e.target.value)}
          placeholder="To Year"
          className={styles.input}
        />
        <button
          className={styles.button}
          onClick={fetchDocumentsByYear}
          disabled={yearLoading}
        >
          {yearLoading ? "Loading..." : "Apply"}
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search companies or documents..."
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="overdue">Overdue</option>
          {/* <option value="approved">Approved</option> */}
        </select>

        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className={styles.select}
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>

      {/* Results info */}
      {processedData.length > 0 && (
        <div className={styles.resultsInfo}>
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
          {totalItems} entries
          {stageFilter !== "all" && (
            <span>
              {" "}
              (Filtered by stage: {getStageDisplayName(stageFilter)})
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead style={{ fontSize: "15px", fontWeight: "600" }}>
            <tr>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("incubateesname")}
              >
                Company {renderSortIndicator("incubateesname")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("doccatname")}
              >
                Document Category {renderSortIndicator("doccatname")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("docsubcatname")}
              >
                Document <br />
                Subcategory {renderSortIndicator("docsubcatname")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("documentname")}
              >
                Document Name {renderSortIndicator("documentname")}
              </th>
              {Number(roleid) === 1 || Number(roleid) === 3 ? (
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("incubateesstagelevel")}
                >
                  Stage {renderSortIndicator("incubateesstagelevel")}
                </th>
              ) : null}
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("submission_date")}
              >
                Submission Date {renderSortIndicator("submission_date")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("due_date")}
              >
                Due Date {renderSortIndicator("due_date")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("status")}
              >
                Status {renderSortIndicator("status")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("collecteddocobsoletestate")}
              >
                Doc State {renderSortIndicator("collecteddocobsoletestate")}
              </th>
              <th>{}</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, idx) => {
              const statusNormalized = (item.status || "").toLowerCase();

              return (
                <tr
                  key={`${item.incubateesname}-${item.documentname}-${idx}`}
                  className={
                    statusNormalized === "overdue"
                      ? styles.overdueRow
                      : statusNormalized === "pending"
                      ? styles.pendingRow
                      : ""
                  }
                >
                  <td>{item.incubateesname}</td>
                  <td>{item.doccatname}</td>
                  <td>{item.docsubcatname}</td>
                  <td>{item.documentname}</td>
                  {Number(roleid) === 1 || Number(roleid) === 3 ? (
                    <td>
                      <span
                        className={`${styles.badge} ${styles.stage}`}
                        style={{ whiteSpace: "pre" }}
                      >
                        {item.incubateesstagelevel || "Unknown"}
                      </span>
                    </td>
                  ) : null}
                  <td>
                    {item.submission_date
                      ? formatDate(item.submission_date)
                      : "Not submitted"}
                  </td>
                  <td
                    className={
                      statusNormalized === "overdue" ? styles.dueOverdue : ""
                    }
                  >
                    {formatDate(item.due_date)}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${styles[statusNormalized]}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.collecteddocobsoletestate ? (
                      <p
                        style={{
                          background: "#ff8787",
                          color: "#c92a2a",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          display: "inline-block",
                          fontWeight: "600",
                          fontSize: "12px",
                        }}
                      >
                        {item.collecteddocobsoletestate}
                      </p>
                    ) : (
                      "---"
                    )}
                  </td>

                  <td className="text-right">
                    <div
                      className="flex gap-2 justify-end"
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        justifyContent: "flex-end",
                      }}
                    >
                      {item.filepath ? (
                        <button
                          className={styles.buttonPrimary}
                          onClick={() => handleViewDocument(item.filepath)}
                        >
                          View Doc
                        </button>
                      ) : (
                        <button
                          className={style.buttonPrimary}
                          style={{
                            background: "#6b7280",
                            color: "white",
                            border: "none",
                            borderRadius: "0.3rem",
                            padding: "0.3rem 0.6rem",
                            fontSize: "0.75rem",
                            cursor: "not-allowed",
                            opacity: "0.7",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                          disabled
                        >
                          No File
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {isPreviewOpen && (
          <div className={styles.previewModal}>
            <div className={styles.previewContent}>
              <button
                className={styles.closeButton}
                onClick={() => setIsPreviewOpen(false)}
              >
                ✖
              </button>
              <iframe
                src={previewUrl}
                title="Document Preview"
                width="100%"
                height="500px"
                style={{ border: "none" }}
              />
            </div>
          </div>
        )}

        {processedData.length === 0 && !yearLoading && (
          <div className={styles.noData}>
            No documents found matching your criteria.
            {stageFilter !== "all" && (
              <div>Try changing the stage filter or search term.</div>
            )}
          </div>
        )}

        {yearLoading && (
          <div className={styles.noData}>Loading documents...</div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className={`${styles.pageButton} ${
              currentPage === 1 ? styles.disabled : ""
            }`}
          >
            Previous
          </button>

          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className={styles.ellipsis}>...</span>
              ) : (
                <button
                  onClick={() => goToPage(page)}
                  className={`${styles.pageButton} ${
                    page === currentPage ? styles.active : ""
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`${styles.pageButton} ${
              currentPage === totalPages ? styles.disabled : ""
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
