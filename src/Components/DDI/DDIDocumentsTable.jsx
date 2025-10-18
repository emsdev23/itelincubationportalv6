import React, { useState, useEffect, useMemo } from "react";
import styles from "../CompanyTable.module.css";
import api from "../Datafetching/api";
import Swal from "sweetalert2";
import style from "../StartupDashboard/StartupDashboard.module.css";
import * as XLSX from "xlsx"; // Add this import for Excel export

export default function DDIDocumentsTable({ userRecID = "ALL" }) {
  const roleid = sessionStorage.getItem("roleid");
  const usersrecid = roleid === 7 ? "ALL" : userRecID;
  console.log("User Rec ID:", usersrecid);
  console.log(userRecID);

  //condition check to visibility state
  const isAdminRole =
    Number(roleid) === 1 || Number(roleid) === 3 || Number(roleid) === 7;
  const isStartupDashboard = location.pathname === "/startup/Dashboard";
  const shouldShowVisibilityColumn = isAdminRole && !isStartupDashboard;

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasFetchedData, setHasFetchedData] = useState(false); // New state to track if data has been fetched

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [togglingDoc, setTogglingDoc] = useState(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  // ✅ Fetch DDI Documents from API
  useEffect(() => {
    const fetchDDIDocuments = async () => {
      try {
        setLoading(true);
        setError("");
        setHasFetchedData(false);

        const response = await api.post(
          "/generic/getddidocs",
          { userId: usersrecid },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data?.statusCode === 200) {
          // ✅ Normalize API data so visibility is consistent
          const normalized = response.data.data.map((doc) => ({
            ...doc,
            ddidocumentsvisibility: doc.ddidocumentsvisibilitystate, // normalize key
          }));
          setDocuments(normalized);
          setHasFetchedData(true);
        } else {
          // Check if the response indicates no documents rather than an error
          if (
            response.data?.statusCode === 404 ||
            (response.data?.message &&
              response.data.message.toLowerCase().includes("no documents"))
          ) {
            setDocuments([]);
            setHasFetchedData(true);
          } else {
            setError(response.data?.message || "Failed to fetch documents");
          }
        }
      } catch (error) {
        console.error("Error fetching DDI documents:", error);
        // Only set error if it's a genuine network/API error, not a 404 for no documents
        if (error.response && error.response.status === 404) {
          setDocuments([]);
          setHasFetchedData(true);
        } else {
          setError("Error fetching documents. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDDIDocuments();
  }, [usersrecid]);

  // ✅ Unique Companies for filter
  const uniqueCompanies = Array.from(
    new Map(documents.map((doc) => [doc.incubateesname, doc])).values()
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
    let sortedData = [...documents];

    if (sortColumn) {
      sortedData.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        // Handle null/undefined values
        if (aVal === null || aVal === undefined) aVal = "";
        if (bVal === null || bVal === undefined) bVal = "";

        // Handle date sorting
        if (sortColumn.includes("date") || sortColumn.includes("time")) {
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
    return sortedData.filter((doc) => {
      const matchesSearch =
        (doc.incubateesname || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (doc.ddidocumentsname || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (doc.uploadedbyname || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStage =
        stageFilter === "all" ||
        (doc.ddidocumentsstartupstagesrecid &&
          doc.ddidocumentsstartupstagesrecid === Number(stageFilter));

      const matchesCompany =
        companyFilter === "all" || doc.incubateesname === companyFilter;

      return matchesSearch && matchesStage && matchesCompany;
    });
  }, [
    documents,
    sortColumn,
    sortDirection,
    searchTerm,
    stageFilter,
    companyFilter,
  ]);

  // ✅ Pagination logic
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = processedData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stageFilter, companyFilter, sortColumn, sortDirection]);

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

  // ✅ Visibility Toggle
  const handleVisibilityToggle = async (doc) => {
    const token = sessionStorage.getItem("token");
    const currentState = doc.ddidocumentsvisibility || 0;
    const newState = currentState === 1 ? 0 : 1;

    try {
      setTogglingDoc(doc.ddidocumentsrecid);

      const response = await fetch(
        "http://121.242.232.212:8086/itelinc/resources/generic/setvisibility",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            docid: doc.ddidocumentsrecid,
            docpath: doc.ddidocumentsfilepath,
            docstate: newState,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.statusCode === 200) {
        setDocuments((prevDocs) =>
          prevDocs.map((d) =>
            d.ddidocumentsrecid === doc.ddidocumentsrecid
              ? { ...d, ddidocumentsvisibility: newState }
              : d
          )
        );

        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Document ${
            newState === 1 ? "enabled" : "disabled"
          } successfully`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(data.message || "Failed to update visibility");
      }
    } catch (error) {
      console.error("Error toggling visibility:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update document visibility: " + error.message,
      });
    } finally {
      setTogglingDoc(null);
    }
  };

  // ✅ Helper function to download file with proper name
  const downloadFile = async (fileUrl, documentName, originalFilepath) => {
    try {
      const response = await fetch(fileUrl, { mode: "cors" });
      const blob = await response.blob();

      const fileExtension = originalFilepath.split(".").pop().toLowerCase();

      const now = new Date();
      // Format: YYYY/MM/DD HH-MM-SS
      const timestamp = `${now.getFullYear()}/${String(
        now.getMonth() + 1
      ).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(
        now.getHours()
      ).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(
        now.getSeconds()
      ).padStart(2, "0")}`;

      const newFileName = `${documentName}_${timestamp}.${fileExtension}`;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = newFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error downloading file:", err);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "Unable to download file. Please try again.",
      });
    }
  };

  // ✅ View/Download Document
  const handleViewDocument = async (filepath, documentName) => {
    try {
      const token = sessionStorage.getItem("token");
      const userid = sessionStorage.getItem("userid");

      const response = await fetch(
        "http://121.242.232.212:8086/itelinc/resources/generic/getfileurl",
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

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      if (data.statusCode === 200 && data.data) {
        const fileUrl = data.data;
        const fileExtension = filepath.split(".").pop().toLowerCase();
        const previewable = ["pdf", "png", "jpeg", "jpg"];

        if (previewable.includes(fileExtension)) {
          setPreviewUrl(fileUrl);
          setIsPreviewOpen(true);
        } else {
          Swal.fire({
            icon: "info",
            title: "No Preview Available",
            text: "This document cannot be previewed. Click download to get the file.",
            showCancelButton: true,
            confirmButtonText: "Download",
            cancelButtonText: "Cancel",
          }).then((result) => {
            if (result.isConfirmed) {
              downloadFile(fileUrl, documentName, filepath);
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
      "Document Name": item.ddidocumentsname || "",
      Company: item.incubateesname || "",
      Stage: item.startupstagesname || "",
      "Uploaded By": item.uploadedbyname || "",
      "Upload Date": item.ddidocumentscreatedtime
        ? new Date(item.ddidocumentscreatedtime).toLocaleDateString()
        : "",
      Visibility: item.ddidocumentsvisibility === 1 ? "Enabled" : "Disabled",
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
      `ddi_documents_${new Date().toISOString().slice(0, 10)}.csv`
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
        "Document Name": item.ddidocumentsname || "",
        Company: item.incubateesname || "",
        Stage: item.startupstagesname || "",
        "Uploaded By": item.uploadedbyname || "",
        "Upload Date": item.ddidocumentscreatedtime
          ? new Date(item.ddidocumentscreatedtime).toLocaleDateString()
          : "",
        Visibility: item.ddidocumentsvisibility === 1 ? "Enabled" : "Disabled",
      }));

      // Create a workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "DDI Documents");

      // Generate the Excel file and download
      XLSX.writeFile(
        wb,
        `ddi_documents_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting to Excel. Falling back to CSV export.");
      exportToCSV();
    }
  };

  // ✅ Loading & Error states
  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>DDI Documents</h2>
        </div>
        <div className={styles.loading}>Loading documents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>DDI Documents</h2>
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  // ✅ Main UI
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>Due Diligence Document Submission</h2>
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

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search documents, companies, or uploaders..."
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
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Companies</option>
          {uniqueCompanies.map((company, index) => (
            <option key={index} value={company.incubateesname}>
              {company.incubateesname}
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

      <div className={styles.resultsInfo}>
        Showing {startIndex + 1} to {Math.min(endIndex, processedData.length)}{" "}
        of {processedData.length} documents
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("ddidocumentsname")}
              >
                Document Name {renderSortIndicator("ddidocumentsname")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("incubateesname")}
              >
                Company {renderSortIndicator("incubateesname")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("startupstagesname")}
              >
                Stage {renderSortIndicator("startupstagesname")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("uploadedbyname")}
              >
                Uploaded By {renderSortIndicator("uploadedbyname")}
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("ddidocumentscreatedtime")}
              >
                Upload Date {renderSortIndicator("ddidocumentscreatedtime")}
              </th>

              {shouldShowVisibilityColumn && (
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("ddidocumentsvisibility")}
                >
                  Incubatee
                  <br />
                  Visibility {renderSortIndicator("ddidocumentsvisibility")}
                </th>
              )}
              <th>{}</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((doc) => (
              <tr key={doc.ddidocumentsrecid}>
                <td>
                  <div className={styles.documentName}>
                    <span className={styles.fileIcon}>📄</span>
                    {doc.ddidocumentsname}
                  </div>
                </td>
                <td>{doc.incubateesname}</td>
                <td>
                  <span
                    className={`${styles.badge} ${
                      styles[`stage-${doc.ddidocumentsstartupstagesrecid}`]
                    }`}
                  >
                    {doc.startupstagesname || "—"}
                  </span>
                </td>
                <td>{doc.uploadedbyname}</td>
                <td>
                  {doc.ddidocumentscreatedtime
                    ? new Date(doc.ddidocumentscreatedtime).toLocaleDateString()
                    : "-"}
                </td>

                {shouldShowVisibilityColumn && (
                  <td>
                    <button
                      style={{
                        padding: "0.4rem 0.8rem",
                        borderRadius: "0.3rem",
                        border: "none",
                        cursor:
                          togglingDoc === doc.ddidocumentsrecid
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        transition: "all 0.2s",
                        backgroundColor:
                          doc.ddidocumentsvisibility === 1
                            ? "#10b981"
                            : "#ef4444",
                        color: "#fff",
                        opacity:
                          togglingDoc === doc.ddidocumentsrecid ? 0.6 : 1,
                      }}
                    >
                      {doc.ddidocumentsvisibility === 1 ? "OK" : "NO"}
                    </button>
                  </td>
                )}
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
                    onClick={() =>
                      handleViewDocument(
                        doc.ddidocumentsfilepath,
                        doc.ddidocumentsname
                      )
                    }
                  >
                    View Document
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Preview Modal */}
        {isPreviewOpen && (
          <div className={style.previewModal}>
            <div className={style.previewContent}>
              <button
                className={style.closeButton}
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

        {/* Updated no data message */}
        {hasFetchedData && documents.length === 0 && (
          <div className={styles.noData}>No documents uploaded</div>
        )}

        {/* Keep the original message for filtered results */}
        {hasFetchedData &&
          documents.length > 0 &&
          processedData.length === 0 && (
            <div className={styles.noData}>
              No documents found matching your criteria.
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
