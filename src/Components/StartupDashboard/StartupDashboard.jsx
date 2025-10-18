import { useState, useContext, useEffect, useMemo } from "react";
import styles from "./StartupDashboard.module.css";
import companyLogo from "../../Images/company6.png";
import DocumentUploadModal from "./DocumentUploadModal";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import DDIDocumentsTable from "../DDI/DDIDocumentsTable";
import { FaExternalLinkAlt } from "react-icons/fa";
import { GoLink } from "react-icons/go";
import { HiLink } from "react-icons/hi";
import { Link } from "react-router-dom";

import style from "../Navbar.module.css";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Calendar,
  Users,
  TrendingUp,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CircleUserRound,
  Mail,
  MessageSquare,
} from "lucide-react";
import ITELLogo from "../../assets/ITEL_Logo.png";
import * as XLSX from "xlsx"; // Add this import for Excel export

import { DataContext } from "../Datafetching/DataProvider";
import ChangePasswordModal from "./ChangePasswordModal";
import ContactModal from "./ContactModal";

const StartupDashboard = () => {
  const {
    roleid,
    listOfIncubatees,
    companyDoc,
    startupcompanyDoc,
    startupdetails,
    setadminviewData,
    refreshCompanyDocuments,
    adminStartupLoading,
    adminviewData,
    clearAllData,
    userid,
  } = useContext(DataContext);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Sorting state for documents table
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const location = useLocation();
  const navigate = useNavigate();

  // Get ID from location state instead of params
  const stateUsersRecid = location.state?.usersrecid;
  const companyName = location.state?.companyName;

  // Set the adminviewData when component mounts or state changes
  useEffect(() => {
    if (stateUsersRecid) {
      setadminviewData(stateUsersRecid);
    } else if (
      Number(roleid) === 1 ||
      Number(roleid) === 3 ||
      (Number(roleid) === 7 && !adminviewData)
    ) {
      // Redirect admin back to company list if no startup selected
      navigate("/Incubation/Dashboard");
    }
  }, [stateUsersRecid, setadminviewData, roleid, adminviewData, navigate]);

  // Determine which data to use based on role and admin viewing state
  const getIncubateeData = () => {
    if (
      Number(roleid) === 1 ||
      Number(roleid) === 3 ||
      (Number(roleid) === 7 && adminviewData)
    ) {
      // Admin viewing specific startup - use startupdetails
      return startupdetails?.[0];
    } else if (Number(roleid) === 4) {
      // Regular user - use listOfIncubatees
      return listOfIncubatees?.[0];
    }
    return null;
  };

  const getCompanyDocuments = () => {
    if (
      Number(roleid) === 1 ||
      Number(roleid) === 3 ||
      (Number(roleid) === 7 && adminviewData)
    ) {
      // Admin viewing specific startup - use startupcompanyDoc
      return startupcompanyDoc || [];
    } else if (Number(roleid) === 4) {
      // Regular user - use companyDoc
      return companyDoc || [];
    }
    return [];
  };

  const incubatee = getIncubateeData();
  const documentsData = getCompanyDocuments();

  // Company details
  const incubateesname = incubatee?.incubateesname;
  const incubateesdateofincorporation =
    incubatee?.incubateesdateofincorporation;
  const incubateesdateofincubation = incubatee?.incubateesdateofincubation;
  const incubateesfieldofworkname = incubatee?.incubateesfieldofworkname;
  const incubateesstagelevelname = incubatee?.incubateesstagelevelname;
  const incubateesfoundername = incubatee?.incubateesfoundername;
  const incubateesrecid = incubatee?.incubateesrecid;
  const usersrecid = incubatee?.usersrecid;
  const founderName = incubatee?.incubateesfoundername;
  const incubateeslogopath = incubatee?.incubateeslogopath;
  const incubateeswebsite = incubatee?.incubateeswebsite;
  const userRecID = incubatee?.usersrecid;

  console.log(incubateeswebsite);
  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [localCompanyDoc, setLocalCompanyDoc] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  // Update local state when context data changes
  useEffect(() => {
    setLocalCompanyDoc(documentsData);
  }, [documentsData]);

  // Sort and filter documents using useMemo for performance
  // MOVED THIS BEFORE THE CONDITIONAL RETURNS
  const processedDocuments = useMemo(() => {
    // First sort the data
    let sortedData = [...localCompanyDoc];

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
    return sortedData.filter((doc) => {
      const matchesSearch =
        doc.doccatname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.docsubcatname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.status?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || doc.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || doc.doccatname === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [
    localCompanyDoc,
    sortColumn,
    sortDirection,
    searchTerm,
    statusFilter,
    categoryFilter,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(processedDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = processedDocuments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, sortColumn, sortDirection]);

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
    const exportData = processedDocuments.map((item) => ({
      "Document Category": item.doccatname || "",
      "Document SubCategory": item.docsubcatname || "",
      "Document Name": item.documentname || "",
      Status: item.status || "",
      Periodicity: item.periodicity || "",
      "Upload Date": item.submission_date
        ? new Date(item.submission_date).toLocaleDateString()
        : "Not uploaded",
      "Due Date": item.due_date
        ? new Date(item.due_date.replace("Z", "")).toLocaleDateString()
        : "N/A",
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
      const exportData = processedDocuments.map((item) => ({
        "Document Category": item.doccatname || "",
        "Document SubCategory": item.docsubcatname || "",
        "Document Name": item.documentname || "",
        Status: item.status || "",
        Periodicity: item.periodicity || "",
        "Upload Date": item.submission_date
          ? new Date(item.submission_date).toLocaleDateString()
          : "Not uploaded",
        "Due Date": item.due_date
          ? new Date(item.due_date.replace("Z", "")).toLocaleDateString()
          : "N/A",
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

  // Show loading state when admin is fetching startup data
  if (
    adminStartupLoading ||
    (Number(roleid) === 1 && adminviewData && !incubatee)
  ) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading startup data...</div>
      </div>
    );
  }

  // Show message if no data is available
  if (!incubatee) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg text-gray-600">
          {Number(roleid) === 1
            ? "Please select a startup to view from the admin panel."
            : "No startup data found."}
        </div>
      </div>
    );
  }

  const convertData = (dateStr) => {
    const dateObj = new Date(dateStr);
    const formatted = dateObj.toLocaleDateString("en-GB");
    return formatted;
  };

  // Get unique categories and statuses for filters
  const uniqueCategories = [
    ...new Set(localCompanyDoc.map((doc) => doc.doccatname)),
  ];
  const uniqueStatuses = [...new Set(localCompanyDoc.map((doc) => doc.status))];

  // Manual refresh function to fetch company documents
  const fetchCompanyDocuments = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const userid = sessionStorage.getItem("userid");

      const response = await fetch(
        "http://121.242.232.212:8086/itelinc/resources/generic/getcompanydocs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userid: userid,
            incubateesrecid: incubateesrecid,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.statusCode === 200) {
        setLocalCompanyDoc(data.data);
      }
    } catch (error) {
      console.error("Error fetching company documents:", error);
    }
  };

  // Handle document upload success
  const handleDocumentUpload = async () => {
    try {
      if (refreshCompanyDocuments) {
        await refreshCompanyDocuments();
      } else {
        await fetchCompanyDocuments();
      }
      // Reset filters and pagination after upload
      setSearchTerm("");
      setStatusFilter("all");
      setCategoryFilter("all");
      setCurrentPage(1);
    } catch (error) {
      console.error("Error refreshing documents:", error);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  // Calculate stats based on actual API data (localCompanyDoc)
  const totalDocuments = localCompanyDoc.length;

  // Count documents that are submitted AND not obsolete
  const submittedDocuments = localCompanyDoc.filter(
    (d) =>
      d.status === "Submitted" && d.collecteddocobsoletestate !== "Obsolete"
  ).length;

  // Pending: status is Pending or Obsolete
  const pendingDocuments = localCompanyDoc.filter(
    (d) =>
      d.status === "Pending" ||
      (d.status === "Submitted" && d.collecteddocobsoletestate === "Obsolete")
  ).length;

  // Overdue: still the same
  const overdueDocuments = localCompanyDoc.filter(
    (d) => d.status === "Overdue"
  ).length;

  // Completion rate: submitted / total
  const completionRate =
    totalDocuments > 0 ? (submittedDocuments / totalDocuments) * 100 : 0;

  const getStatusBadge = (status) => {
    switch (status) {
      case "Submitted":
        return (
          <span className={`${styles.badge} ${styles.badgeApproved}`}>
            Submitted
          </span>
        );
      case "Pending":
        return (
          <span className={`${styles.badge} ${styles.badgePending}`}>
            Pending
          </span>
        );
      case "Overdue":
        return (
          <span className={`${styles.badge} ${styles.badgeOverdue}`}>
            Overdue
          </span>
        );
      default:
        return <span className={styles.badge}>Unknown</span>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Submitted":
        return <CheckCircle className={styles.iconApproved} />;
      case "Pending":
        return <Clock className={styles.iconPending} />;
      case "Overdue":
        return <AlertCircle className={styles.iconOverdue} />;
      default:
        return <FileText className={styles.iconDefault} />;
    }
  };

  const handleViewDocument = async (filepath) => {
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
              link.download = filepath.split("/").pop();
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

  const handleLogout = async () => {
    // Step 1️⃣: Ask for confirmation
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
    });

    // If user cancels, exit
    if (!confirmResult.isConfirmed) return;

    try {
      // Step 2️⃣: Show loading popup
      Swal.fire({
        title: "Logging out...",
        text: "Please wait while we log you out",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const userid = String(JSON.parse(sessionStorage.getItem("userid")));
      const token = sessionStorage.getItem("token");

      if (!userid || !token) {
        Swal.close();
        Swal.fire({
          icon: "warning",
          title: "Not Logged In",
          text: "User session missing or expired",
        });
        return;
      }

      const currentTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      // Step 3️⃣: Call logout API
      const response = await fetch(
        "http://121.242.232.212:8086/itelinc/resources/auth/logout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userid,
            reason: `Manual Logout at ${currentTime}`,
          }),
        }
      );

      const data = await response.json();
      console.log("Logout response:", data);

      // Step 4️⃣: Handle response
      Swal.close();

      if (response.ok) {
        // Clear all context and session storage
        clearAllData();
        sessionStorage.removeItem("userid");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("roleid");

        // Swal.fire({
        //   icon: "success",
        //   title: "Logged out successfully",
        //   text: "Redirecting to login...",
        //   timer: 1500,
        //   showConfirmButton: false,
        // });

        navigate("/", { replace: true });

        // setTimeout(() => navigate("/", { replace: true }), 1200);
      } else {
        Swal.fire({
          icon: "error",
          title: "Logout Failed",
          text: data.message || "Something went wrong",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: "Something went wrong while logging out.",
      });
    }
  };

  const handleBackToAdmin = () => {
    navigate("/Incubation/Dashboard");
  };

  // const handleBackToAdmin = () => {
  //   // Navigate to the appropriate dashboard based on role
  //   if (Number(roleid) === 1) {
  //     navigate("/Admin/Dashboard");
  //   } else if (Number(roleid) === 3) {
  //     navigate("/Incubator/Dashboard");
  //   } else if (Number(roleid) === 4) {
  //     navigate("/Startup/Dashboard");
  //   } else {
  //     // Fallback to incubation dashboard if role is not recognized
  //     navigate("/Incubation/Dashboard");
  //   }
  // };
  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setCurrentPage(1);
  };

  const handleAbolishDocument = async (filepath) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to mark this document as Obsolete? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, mark it!",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      const userId = sessionStorage.getItem("userid");
      const token = sessionStorage.getItem("token");

      if (!userId || !token) {
        Swal.fire(
          "Error",
          "User authentication not found. Please login again.",
          "error"
        );
        return;
      }

      const response = await fetch(
        `http://121.242.232.212:8086/itelinc/resources/generic/markobsolete?modifiedBy=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: filepath }),
        }
      );

      const resultData = await response.json();

      if (response.ok && resultData.statusCode === 200) {
        console.log("Document marked as obsolete:", resultData);

        Swal.fire(
          "Marked Obsolete!",
          "Document has been successfully marked as obsolete.",
          "success"
        );

        if (refreshCompanyDocuments) {
          await refreshCompanyDocuments();
        } else if (fetchCompanyDocuments) {
          await fetchCompanyDocuments();
        }
      } else {
        console.error("Failed to mark document as obsolete:", resultData);
        Swal.fire(
          "Failed",
          resultData.message ||
            "Failed to mark document as obsolete. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error marking document as obsolete:", error);
      Swal.fire(
        "Error",
        "An error occurred while marking the document as obsolete.",
        "error"
      );
    }
  };

  return (
    <div>
      {/* Navigation bar */}
      <header className={style.header}>
        <div className={style.container}>
          <div className={style.logoSection}>
            <img src={ITELLogo} className={style.logoIcon} alt="ITEL Logo" />
            <div>
              <h1 className={style.title}>ITEL Incubation Portal</h1>
              <p className={style.subtitle}>
                {Number(roleid) === 1
                  ? "Admin Dashboard"
                  : "Startup Management Dashboard"}
              </p>
            </div>
          </div>

          <div className={style.actions}>
            {/* Show back button for admin */}
            {(Number(roleid) === 1 ||
              Number(roleid) === 3 ||
              Number(roleid) === 7) &&
              adminviewData && (
                <button
                  className={style.btnPrimary}
                  onClick={handleBackToAdmin}
                  style={{
                    background: "#63e6be",
                    display: "flex",
                    fontWeight: "bold",
                    color: "#0b7285",
                  }}
                >
                  <ArrowLeft className={style.icon} />
                  Back to Portal
                </button>
              )}

            {/* Chat button */}
            {Number(roleid) === 4 && (
              <button
                className={style.btnPrimary}
                onClick={() => navigate(`/Incubation/Dashboard/Chats`)}
                style={{
                  background: "#4dabf7",
                  display: "flex",
                  fontWeight: "bold",
                  color: "#1864ab",
                }}
              >
                <MessageSquare className={style.icon} />
                Chat
              </button>
            )}

            {Number(roleid) === 4 && (
              <button
                className={style.btnPrimary}
                onClick={handleLogout}
                style={{ background: "#fa5252", fontWeight: "bold" }}
              >
                <LogOut className={style.icon} />
                Logout
              </button>
            )}

            {Number(roleid) === 4 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "0.8rem",
                  color: "gray",
                  cursor: "pointer",
                }}
                onClick={() => setIsChangePasswordOpen(true)}
              >
                <CircleUserRound />
                <div>{founderName}</div>
              </div>
            )}

            {isChangePasswordOpen && Number(roleid) === 4 && (
              <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
              />
            )}

            {/* Contact Modal */}
            {isContactModalOpen && Number(roleid) === 4 && (
              <ContactModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                userId={Number(userid)}
              />
            )}
          </div>
        </div>
      </header>

      {/* Startup dashboard */}
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.headerCard}>
          <div className={styles.headerContent}>
            <div className={styles.headerFlex}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "2rem" }}
              >
                <div className={styles.avatarWrapper}>
                  <img
                    src={incubateeslogopath ? incubateeslogopath : companyLogo}
                    alt="Company Logo"
                    className={styles.avatarImage}
                  />
                  {incubateeswebsite !== null ? (
                    <div className={styles.avatarStatus}>
                      <Link
                        to={incubateeswebsite}
                        style={{ textDecoration: "none", color: "inherit" }}
                        target="blank"
                      >
                        <HiLink
                          style={{
                            width: "20px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        />
                      </Link>
                    </div>
                  ) : (
                    ""
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">{incubateesname}</h1>
                </div>
              </div>
              <div>
                <div className={styles.headerBadges}>
                  <div className={styles.headerBadge}>
                    <Users className="h-4 w-4" /> Founded by:{" "}
                    {incubateesfoundername}
                  </div>
                  <div className={styles.headerBadge}>
                    <Calendar className="h-4 w-4" /> Date of Incorporation:
                    {incubateesdateofincorporation &&
                      convertData(incubateesdateofincorporation)}
                  </div>
                  <div className={styles.headerBadge}>
                    <Calendar className="h-4 w-4" /> Date of Incubation:
                    {incubateesdateofincubation &&
                      convertData(incubateesdateofincubation)}
                  </div>
                  <div className={styles.headerBadge}>
                    <TrendingUp className="h-4 w-4" />{" "}
                    {incubateesstagelevelname} Funding
                  </div>
                  <div className={styles.headerBadge}>
                    Field Of Work: {incubateesfieldofworkname}
                  </div>
                  {Number(roleid) === 4 && (
                    <div
                      className={styles.headerBadge}
                      onClick={() => setIsContactModalOpen(true)}
                      style={{ cursor: "pointer" }}
                    >
                      <Mail className="h-4 w-4" />
                      Contact
                      {/* <button
                        className={style.btnPrimary}
                       
                        style={{
                          background: "#3b82f6",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        
                      </button> */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Total Documents</div>
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className={styles.cardContent}>{totalDocuments}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Submitted</div>
              <div
                className={styles.tooltip}
                data-tooltip="Documents that have been submitted in the portal"
              >
                <CheckCircle className={styles.iconApproved} />
              </div>
            </div>
            <div className={styles.cardContent}>{submittedDocuments}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Pending</div>
              <div
                className={styles.tooltip}
                data-tooltip="Monthly due Documents"
              >
                <Clock className={styles.iconPending} />
              </div>
            </div>
            <div className={styles.cardContent}>{pendingDocuments}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Overdue</div>
              <AlertCircle className={styles.iconOverdue} />
            </div>
            <div className={styles.cardContent}>{overdueDocuments}</div>
          </div>
        </div>

        {/* Progress */}
        <div className={styles.card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2 className="text-xl font-bold mb-2">Document Update Progress</h2>
            {Number(roleid) === 4 && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className={styles.buttonPrimary}
                  onClick={() => setIsModalOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" /> Add Document
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-600 mb-2">
            {Number(roleid) === 1
              ? "Viewing document update progress for this startup"
              : "Complete your document updates by submitting all required documents"}
          </p>

          <br />
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{
                width: `${completionRate}%`,
                textAlign: "center",
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              {Math.round(completionRate)}%
            </div>
          </div>
          <div className={styles.progressStats}>
            <div
              className={`${styles.progressStat} ${styles.progressApproved}`}
            >
              <div className={styles.progressDot}></div>
              <div>{submittedDocuments} Submitted</div>
            </div>
            <div className={`${styles.progressStat} ${styles.progressPending}`}>
              <div className={styles.progressDot}></div>
              <div>{pendingDocuments} Pending</div>
            </div>
            <div className={`${styles.progressStat} ${styles.progressOverdue}`}>
              <div className={styles.progressDot}></div>
              <div>{overdueDocuments} Overdue</div>
            </div>
          </div>
        </div>

        <br />
        <br />

        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.filterGroup}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.searchInput}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Export Buttons */}
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
                isXLSXAvailable
                  ? "Export as Excel"
                  : "Excel export not available"
              }
              disabled={!isXLSXAvailable}
            >
              Export Excel
            </button>
          </div>

          <div className={styles.resultsInfo}>
            Showing {paginatedDocuments.length} of {processedDocuments.length}{" "}
            documents (filtered from {localCompanyDoc.length} total)
          </div>
        </div>

        {/* Documents Table */}
        <div className={styles.documentsTableFull}>
          <table>
            <thead>
              <tr className="bg-gray-200">
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
                  SubCategory {renderSortIndicator("docsubcatname")}
                </th>
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("documentname")}
                >
                  Document Name {renderSortIndicator("documentname")}
                </th>
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("status")}
                >
                  Status {renderSortIndicator("status")}
                </th>
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("periodicity")}
                >
                  Periodicity {renderSortIndicator("periodicity")}
                </th>
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("submission_date")}
                >
                  Upload Date {renderSortIndicator("submission_date")}
                </th>
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("due_date")}
                >
                  Due Date {renderSortIndicator("due_date")}
                </th>
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("collecteddocobsoletestate")}
                >
                  Doc State {renderSortIndicator("collecteddocobsoletestate")}
                </th>
                <th> </th>{" "}
                {/* Changed from empty {} to "Actions" for clarity */}
              </tr>
            </thead>
            <tbody>
              {paginatedDocuments.length > 0 ? (
                paginatedDocuments.map((doc, index) => (
                  <tr
                    key={`${doc.incubateesname}-${doc.doccatname}-${doc.docsubcatname}-${index}`}
                    className={
                      doc.status === "Overdue"
                        ? styles.overdueRow
                        : doc.status === "Pending"
                        ? styles.pendingRow
                        : ""
                    }
                  >
                    <td className="flex items-center gap-2">
                      {getStatusIcon(doc.status)} {doc.doccatname}
                    </td>
                    <td className="flex items-center gap-2">
                      {doc.docsubcatname}
                    </td>
                    <td className="flex items-center gap-2">
                      {doc.documentname}
                    </td>
                    <td>{getStatusBadge(doc.status)}</td>
                    <td>{doc.periodicity}</td>
                    <td>
                      {doc.submission_date ? (
                        new Date(doc.submission_date).toLocaleDateString()
                      ) : (
                        <em>Not uploaded</em>
                      )}
                    </td>
                    <td>
                      {doc.due_date
                        ? new Date(
                            doc.due_date.replace("Z", "")
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      {doc.collecteddocobsoletestate ? (
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
                          {doc.collecteddocobsoletestate}
                        </p>
                      ) : (
                        "---"
                      )}
                    </td>
                    <td className="text-right">
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          flexWrap: "nowrap",
                        }}
                      >
                        {doc.filepath && doc.status === "Submitted" ? (
                          <button
                            style={{
                              background:
                                "linear-gradient(to right, #3b82f6, #2563eb)",
                              color: "white",
                              border: "none",
                              borderRadius: "0.3rem",
                              padding: "0.3rem 0.6rem",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                            onClick={() => handleViewDocument(doc.filepath)}
                          >
                            View Doc
                          </button>
                        ) : (
                          <button
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
                            onClick={() => handleViewDocument(doc.filepath)}
                            disabled={!doc.filepath}
                          >
                            {doc.filepath ? "View Doc" : "No File"}
                          </button>
                        )}

                        {doc.collecteddocobsoletestate === "Not Obsolete" &&
                          Number(roleid) !== 1 &&
                          Number(roleid) !== 3 && (
                            <button
                              style={{
                                background: "#ff8787",
                                color: "#c92a2a",
                                border: "1px solid #ff8787",
                                borderRadius: "0.3rem",
                                padding: "0.3rem 0.6rem",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                                transition: "all 0.2s ease",
                              }}
                              onClick={() =>
                                handleAbolishDocument(doc.filepath)
                              }
                              title="Mark document as obsolete"
                              onMouseOver={(e) => {
                                e.target.style.background = "#ff6b6b";
                                e.target.style.transform = "scale(1.02)";
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = "#ff8787";
                                e.target.style.transform = "scale(1)";
                              }}
                            >
                              Obsolete
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className={styles.noData}>
                    No documents found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Rest of your code remains the same */}
        </div>

        {/* Add Document Modal - Only for users */}
        {isModalOpen && Number(roleid) === 4 && (
          <DocumentUploadModal
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            incubateesrecid={incubateesrecid}
            usersrecid={usersrecid}
            onUploadSuccess={handleDocumentUpload}
          />
        )}
      </div>

      <br />
      <DDIDocumentsTable userRecID={userRecID} />
    </div>
  );
};

export default StartupDashboard; // import { useState, useContext, useEffect } from "react";
// import styles from "./StartupDashboard.module.css";
// import companyLogo from "../../Images/company6.png";
// import DocumentUploadModal from "./DocumentUploadModal";
// import { useNavigate, useLocation } from "react-router-dom";
// import Swal from "sweetalert2";

// import style from "../Navbar.module.css";
// import {
//   CheckCircle,
//   Clock,
//   AlertCircle,
//   FileText,
//   Upload,
//   Calendar,
//   Users,
//   TrendingUp,
//   LogOut,
//   Search,
//   ChevronLeft,
//   ChevronRight,
//   ArrowLeft,
//   CircleUserRound,
// } from "lucide-react";
// import ITELLogo from "../../assets/ITEL_Logo.png";

// import { DataContext } from "../Datafetching/DataProvider";
// import ChangePasswordModal from "./ChangePasswordModal";

// const StartupDashboard = () => {
//   const {
//     roleid,
//     listOfIncubatees,
//     companyDoc,
//     startupcompanyDoc,
//     startupdetails,
//     setadminviewData,
//     refreshCompanyDocuments,
//     adminStartupLoading,
//     adminviewData,
//     clearAllData,
//   } = useContext(DataContext);

//   const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [isPreviewOpen, setIsPreviewOpen] = useState(false);

//   const location = useLocation();
//   const navigate = useNavigate();

//   // Get ID from location state instead of params
//   const stateUsersRecid = location.state?.usersrecid;
//   const companyName = location.state?.companyName;

//   // Set the adminviewData when component mounts or state changes
//   useEffect(() => {
//     if (stateUsersRecid) {
//       setadminviewData(stateUsersRecid);
//     } else if (
//       Number(roleid) === 1 ||
//       (Number(roleid) === 3 && !adminviewData)
//     ) {
//       // Redirect admin back to company list if no startup selected
//       navigate("/Incubation/Dashboard");
//     }
//   }, [stateUsersRecid, setadminviewData, roleid, adminviewData, navigate]);

//   // Determine which data to use based on role and admin viewing state
//   const getIncubateeData = () => {
//     if (Number(roleid) === 1 || (Number(roleid) === 3 && adminviewData)) {
//       // Admin viewing specific startup - use startupdetails
//       return startupdetails?.[0];
//     } else if (Number(roleid) === 4) {
//       // Regular user - use listOfIncubatees
//       return listOfIncubatees?.[0];
//     }
//     return null;
//   };

//   const getCompanyDocuments = () => {
//     if (Number(roleid) === 1 || (Number(roleid) === 3 && adminviewData)) {
//       // Admin viewing specific startup - use startupcompanyDoc
//       return startupcompanyDoc || [];
//     } else if (Number(roleid) === 4) {
//       // Regular user - use companyDoc
//       return companyDoc || [];
//     }
//     return [];
//   };

//   const incubatee = getIncubateeData();
//   const documentsData = getCompanyDocuments();

//   // Company details
//   const incubateesname = incubatee?.incubateesname;
//   const incubateesdateofincorporation =
//     incubatee?.incubateesdateofincorporation;
//   const incubateesdateofincubation = incubatee?.incubateesdateofincubation;
//   const incubateesfieldofworkname = incubatee?.incubateesfieldofworkname;
//   const incubateesstagelevelname = incubatee?.incubateesstagelevelname;
//   const incubateesfoundername = incubatee?.incubateesfoundername;
//   const incubateesrecid = incubatee?.incubateesrecid;
//   const usersrecid = incubatee?.usersrecid;
//   const founderName = incubatee?.incubateesfoundername;
//   const incubateeslogopath = incubatee?.incubateeslogopath;

//   // Local state
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [localCompanyDoc, setLocalCompanyDoc] = useState([]);
//   const [refreshKey, setRefreshKey] = useState(0);

//   // Filter and pagination state
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [categoryFilter, setCategoryFilter] = useState("all");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);

//   // ✅ Date filter state
//   const currentYear = new Date().getFullYear();
//   const [fromYear, setFromYear] = useState(currentYear);
//   const [toYear, setToYear] = useState(currentYear);
//   const [tempFromYear, setTempFromYear] = useState(currentYear);
//   const [tempToYear, setTempToYear] = useState(currentYear);
//   const [yearLoading, setYearLoading] = useState(false);

//   // Update local state when context data changes
//   useEffect(() => {
//     setLocalCompanyDoc(documentsData);
//   }, [documentsData]);

//   // Show loading state when admin is fetching startup data
//   if (
//     adminStartupLoading ||
//     (Number(roleid) === 1 && adminviewData && !incubatee)
//   ) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="text-lg">Loading startup data...</div>
//       </div>
//     );
//   }

//   // Show message if no data is available
//   if (!incubatee) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="text-lg text-gray-600">
//           {Number(roleid) === 1
//             ? "Please select a startup to view from the admin panel."
//             : "No startup data found."}
//         </div>
//       </div>
//     );
//   }

//   const convertData = (dateStr) => {
//     const dateObj = new Date(dateStr);
//     const formatted = dateObj.toLocaleDateString("en-GB");
//     return formatted;
//   };

//   // Get unique categories and statuses for filters
//   const uniqueCategories = [
//     ...new Set(localCompanyDoc.map((doc) => doc.doccatname)),
//   ];
//   const uniqueStatuses = [...new Set(localCompanyDoc.map((doc) => doc.status))];

//   // Filter documents based on search term and filters
//   const filteredDocuments = localCompanyDoc.filter((doc) => {
//     const matchesSearch =
//       doc.doccatname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       doc.docsubcatname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       doc.status?.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
//     const matchesCategory =
//       categoryFilter === "all" || doc.doccatname === categoryFilter;

//     return matchesSearch && matchesStatus && matchesCategory;
//   });

//   // Pagination calculations
//   const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const paginatedDocuments = filteredDocuments.slice(
//     startIndex,
//     startIndex + itemsPerPage
//   );

//   // ✅ Fetch documents by year range
//   const fetchDocumentsByYear = async () => {
//     setYearLoading(true);
//     try {
//       const token = sessionStorage.getItem("token");
//       const userid = sessionStorage.getItem("userid");

//       const response = await fetch(
//         "http://121.242.232.212:8089/itelinc/resources/generic/getcollecteddocsdash",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             userId: stateUsersRecid,
//             // incubateesrecid: incubateesrecid,
//             startYear: tempFromYear,
//             endYear: tempToYear,
//           }),
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();

//       // Handle different response structures
//       let responseData;
//       if (data && Array.isArray(data)) {
//         responseData = data;
//       } else if (data && data.data && Array.isArray(data.data)) {
//         responseData = data.data;
//       } else if (data && data.result && Array.isArray(data.result)) {
//         responseData = data.result;
//       } else if (data.statusCode === 200 && data.data) {
//         responseData = data.data;
//       } else {
//         console.warn("Unexpected response structure:", data);
//         responseData = [];
//       }

//       setLocalCompanyDoc(responseData);
//       setCurrentPage(1);
//       setFromYear(tempFromYear);
//       setToYear(tempToYear);

//       Swal.fire({
//         icon: "success",
//         title: "Success",
//         text: `Documents fetched for years ${tempFromYear} to ${tempToYear}`,
//         timer: 2000,
//         showConfirmButton: false,
//       });
//     } catch (error) {
//       console.error("Error fetching documents by year:", error);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: `Error fetching documents: ${
//           error.message || "Unknown error occurred"
//         }`,
//       });
//     } finally {
//       setYearLoading(false);
//     }
//   };

//   // Manual refresh function to fetch company documents
//   const fetchCompanyDocuments = async () => {
//     try {
//       const token = sessionStorage.getItem("token");
//       const userid = sessionStorage.getItem("userid");

//       const response = await fetch(
//         "http://121.242.232.212:8089/itelinc/resources/generic/getcompanydocs",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             userid: userid,
//             incubateesrecid: incubateesrecid,
//           }),
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       if (data.statusCode === 200) {
//         setLocalCompanyDoc(data.data);
//       }
//     } catch (error) {
//       console.error("Error fetching company documents:", error);
//     }
//   };

//   // Handle document upload success
//   const handleDocumentUpload = async () => {
//     try {
//       if (refreshCompanyDocuments) {
//         await refreshCompanyDocuments();
//       } else {
//         await fetchCompanyDocuments();
//       }
//       // Reset filters and pagination after upload
//       setSearchTerm("");
//       setStatusFilter("all");
//       setCategoryFilter("all");
//       setCurrentPage(1);
//     } catch (error) {
//       console.error("Error refreshing documents:", error);
//       setTimeout(() => {
//         window.location.reload();
//       }, 1000);
//     }
//   };

//   // Calculate stats based on actual API data (localCompanyDoc)
//   const totalDocuments = localCompanyDoc.length;

//   // Count documents that are submitted AND not obsolete
//   const submittedDocuments = localCompanyDoc.filter(
//     (d) =>
//       d.status === "Submitted" && d.collecteddocobsoletestate !== "Obsolete"
//   ).length;

//   // Pending: status is Pending or Obsolete
//   const pendingDocuments = localCompanyDoc.filter(
//     (d) =>
//       d.status === "Pending" ||
//       (d.status === "Submitted" && d.collecteddocobsoletestate === "Obsolete")
//   ).length;

//   // Overdue: still the same
//   const overdueDocuments = localCompanyDoc.filter(
//     (d) => d.status === "Overdue"
//   ).length;

//   // Completion rate: submitted / total
//   const completionRate =
//     totalDocuments > 0 ? (submittedDocuments / totalDocuments) * 100 : 0;

//   const getStatusBadge = (status) => {
//     switch (status) {
//       case "Submitted":
//         return (
//           <span className={`${styles.badge} ${styles.badgeApproved}`}>
//             Submitted
//           </span>
//         );
//       case "Pending":
//         return (
//           <span className={`${styles.badge} ${styles.badgePending}`}>
//             Pending
//           </span>
//         );
//       case "Overdue":
//         return (
//           <span className={`${styles.badge} ${styles.badgeOverdue}`}>
//             Overdue
//           </span>
//         );
//       default:
//         return <span className={styles.badge}>Unknown</span>;
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "Submitted":
//         return <CheckCircle className={styles.iconApproved} />;
//       case "Pending":
//         return <Clock className={styles.iconPending} />;
//       case "Overdue":
//         return <AlertCircle className={styles.iconOverdue} />;
//       default:
//         return <FileText className={styles.iconDefault} />;
//     }
//   };

//   const handleViewDocument = async (filepath) => {
//     try {
//       const token = sessionStorage.getItem("token");
//       const userid = sessionStorage.getItem("userid");

//       const response = await fetch(
//         "http://121.242.232.212:8089/itelinc/resources/generic/getfileurl",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             userid: userid,
//             url: filepath,
//           }),
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();

//       if (data.statusCode === 200 && data.data) {
//         const fileUrl = data.data;
//         const fileExtension = filepath.split(".").pop().toLowerCase();

//         // Previewable formats
//         const previewable = ["pdf", "png", "jpeg", "jpg"];

//         if (previewable.includes(fileExtension)) {
//           // Open preview modal
//           setPreviewUrl(fileUrl);
//           setIsPreviewOpen(true);
//         } else {
//           // Non-previewable formats: show SweetAlert to download
//           Swal.fire({
//             icon: "info",
//             title: "No Preview Available",
//             text: "This document cannot be previewed. Click download to get the file.",
//             showCancelButton: true,
//             confirmButtonText: "Download",
//             cancelButtonText: "Cancel",
//           }).then((result) => {
//             if (result.isConfirmed) {
//               const link = document.createElement("a");
//               link.href = fileUrl;
//               link.download = filepath.split("/").pop();
//               document.body.appendChild(link);
//               link.click();
//               document.body.removeChild(link);
//             }
//           });
//         }
//       } else {
//         throw new Error(data.message || "Failed to fetch document");
//       }
//     } catch (error) {
//       console.error("Error fetching file:", error);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: "Unable to load document: " + error.message,
//       });
//     }
//   };

//   const handleLogout = () => {
//     // Clear all context data first
//     clearAllData();

//     // Clear session storage
//     sessionStorage.removeItem("userid");
//     sessionStorage.removeItem("token");
//     sessionStorage.removeItem("roleid");

//     // Navigate to login
//     navigate("/", { replace: true });
//   };

//   const handleBackToAdmin = () => {
//     navigate("/Incubation/Dashboard");
//   };

//   // Pagination handlers
//   const handleNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   const handlePrevPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   const handlePageClick = (pageNumber) => {
//     setCurrentPage(pageNumber);
//   };

//   // Clear all filters
//   const handleClearFilters = () => {
//     setSearchTerm("");
//     setStatusFilter("all");
//     setCategoryFilter("all");
//     setCurrentPage(1);
//   };

//   const handleAbolishDocument = async (filepath) => {
//     try {
//       const result = await Swal.fire({
//         title: "Are you sure?",
//         text: "Do you want to mark this document as Obsolete? This action cannot be undone.",
//         icon: "warning",
//         showCancelButton: true,
//         confirmButtonText: "Yes, mark it!",
//         cancelButtonText: "Cancel",
//       });

//       if (!result.isConfirmed) return;

//       const userId = sessionStorage.getItem("userid");
//       const token = sessionStorage.getItem("token");

//       if (!userId || !token) {
//         Swal.fire(
//           "Error",
//           "User authentication not found. Please login again.",
//           "error"
//         );
//         return;
//       }

//       const response = await fetch(
//         `http://121.242.232.212:8089/itelinc/resources/generic/markobsolete?modifiedBy=${userId}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ url: filepath }),
//         }
//       );

//       const resultData = await response.json();

//       if (response.ok && resultData.statusCode === 200) {
//         console.log("Document marked as obsolete:", resultData);

//         Swal.fire(
//           "Marked Obsolete!",
//           "Document has been successfully marked as obsolete.",
//           "success"
//         );

//         if (refreshCompanyDocuments) {
//           await refreshCompanyDocuments();
//         } else if (fetchCompanyDocuments) {
//           await fetchCompanyDocuments();
//         }
//       } else {
//         console.error("Failed to mark document as obsolete:", resultData);
//         Swal.fire(
//           "Failed",
//           resultData.message ||
//             "Failed to mark document as obsolete. Please try again.",
//           "error"
//         );
//       }
//     } catch (error) {
//       console.error("Error marking document as obsolete:", error);
//       Swal.fire(
//         "Error",
//         "An error occurred while marking the document as obsolete.",
//         "error"
//       );
//     }
//   };

//   return (
//     <div>
//       {/* Navigation bar */}
//       <header className={style.header}>
//         <div className={style.container}>
//           <div className={style.logoSection}>
//             <img src={ITELLogo} className={style.logoIcon} alt="ITEL Logo" />
//             <div>
//               <h1 className={style.title}>ITEL Incubation Portal</h1>
//               <p className={style.subtitle}>
//                 {Number(roleid) === 1
//                   ? "Admin Dashboard"
//                   : "Startup Management Dashboard"}
//               </p>
//             </div>
//           </div>

//           <div className={style.actions}>
//             {/* Show back button for admin */}
//             {(Number(roleid) === 1 || Number(roleid) === 3) &&
//               adminviewData && (
//                 <button
//                   className={style.btnPrimary}
//                   onClick={handleBackToAdmin}
//                   style={{
//                     background: "#63e6be",
//                     display: "flex",
//                     fontWeight: "bold",
//                     color: "#0b7285",
//                   }}
//                 >
//                   <ArrowLeft className={style.icon} />
//                   Back to Portal
//                 </button>
//               )}
//             <div
//               style={{
//                 display: "flex",
//                 flexDirection: "column",
//                 justifyContent: "center",
//                 alignItems: "center",
//                 fontSize: "0.8rem",
//                 color: "gray",
//                 cursor: "pointer",
//               }}
//               onClick={() => setIsChangePasswordOpen(true)}
//             >
//               <CircleUserRound />
//               <div>{founderName}</div>
//             </div>

//             {isChangePasswordOpen && Number(roleid) === 4 && (
//               <ChangePasswordModal
//                 isOpen={isChangePasswordOpen}
//                 onClose={() => setIsChangePasswordOpen(false)}
//               />
//             )}

//             {Number(roleid) === 4 && (
//               <button
//                 className={style.btnPrimary}
//                 onClick={handleLogout}
//                 style={{ background: "#0ca678", fontWeight: "bold" }}
//               >
//                 <LogOut className={style.icon} />
//                 Logout
//               </button>
//             )}
//           </div>
//         </div>
//       </header>

//       {/* Startup dashboard */}
//       <div className={styles.container}>
//         {/* Header */}
//         <div className={styles.headerCard}>
//           <div className={styles.headerContent}>
//             <div className={styles.headerFlex}>
//               <div
//                 style={{ display: "flex", alignItems: "center", gap: "2rem" }}
//               >
//                 <div className={styles.avatarWrapper}>
//                   <img
//                     src={incubateeslogopath ? incubateeslogopath : companyLogo}
//                     alt="Company Logo"
//                     className={styles.avatarImage}
//                   />
//                   <div className={styles.avatarStatus}>
//                     <CheckCircle className="h-5 w-5 text-white" />
//                   </div>
//                 </div>
//                 <div>
//                   <h1 className="text-4xl font-bold mb-2">{incubateesname}</h1>
//                 </div>
//               </div>
//               <div>
//                 <div className={styles.headerBadges}>
//                   <div className={styles.headerBadge}>
//                     <Users className="h-4 w-4" /> Founded by:{" "}
//                     {incubateesfoundername}
//                   </div>
//                   <div className={styles.headerBadge}>
//                     <Calendar className="h-4 w-4" /> Date of Incorporation:
//                     {incubateesdateofincorporation &&
//                       convertData(incubateesdateofincorporation)}
//                   </div>
//                   <div className={styles.headerBadge}>
//                     <Calendar className="h-4 w-4" /> Date of Incubation:
//                     {incubateesdateofincubation &&
//                       convertData(incubateesdateofincubation)}
//                   </div>
//                   <div className={styles.headerBadge}>
//                     <TrendingUp className="h-4 w-4" />{" "}
//                     {incubateesstagelevelname} Funding
//                   </div>
//                   <div className={styles.headerBadge}>
//                     Field Of Work: {incubateesfieldofworkname}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className={styles.statsGrid}>
//           <div className={styles.card}>
//             <div className={styles.cardHeader}>
//               <div className={styles.cardTitle}>Total Documents</div>
//               <FileText className="h-5 w-5 text-primary" />
//             </div>
//             <div className={styles.cardContent}>{totalDocuments}</div>
//           </div>
//           <div className={styles.card}>
//             <div className={styles.cardHeader}>
//               <div className={styles.cardTitle}>Submitted</div>
//               <div
//                 className={styles.tooltip}
//                 data-tooltip="Documents that have been submitted in the portal"
//               >
//                 <CheckCircle className={styles.iconApproved} />
//               </div>
//             </div>
//             <div className={styles.cardContent}>{submittedDocuments}</div>
//           </div>
//           <div className={styles.card}>
//             <div className={styles.cardHeader}>
//               <div className={styles.cardTitle}>Pending</div>
//               <div
//                 className={styles.tooltip}
//                 data-tooltip="Monthly due Documents"
//               >
//                 <Clock className={styles.iconPending} />
//               </div>
//             </div>
//             <div className={styles.cardContent}>{pendingDocuments}</div>
//           </div>
//           <div className={styles.card}>
//             <div className={styles.cardHeader}>
//               <div className={styles.cardTitle}>Overdue</div>
//               <AlertCircle className={styles.iconOverdue} />
//             </div>
//             <div className={styles.cardContent}>{overdueDocuments}</div>
//           </div>
//         </div>

//         {/* Progress */}
//         <div className={styles.card}>
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <h2 className="text-xl font-bold mb-2">Document Update Progress</h2>
//             {Number(roleid) === 4 && (
//               <button
//                 className={styles.buttonPrimary}
//                 onClick={() => setIsModalOpen(true)}
//               >
//                 <Upload className="h-4 w-4 mr-2" /> Add Document
//               </button>
//             )}
//           </div>

//           <p className="text-gray-600 mb-2">
//             {Number(roleid) === 1
//               ? "Viewing document update progress for this startup"
//               : "Complete your document updates by submitting all required documents"}
//           </p>

//           <br />
//           <div className={styles.progressBarContainer}>
//             <div
//               className={styles.progressBar}
//               style={{
//                 width: `${completionRate}%`,
//                 textAlign: "center",
//                 color: "#fff",
//                 fontWeight: "bold",
//               }}
//             >
//               {Math.round(completionRate)}%
//             </div>
//           </div>
//           <div className={styles.progressStats}>
//             <div
//               className={`${styles.progressStat} ${styles.progressApproved}`}
//             >
//               <div className={styles.progressDot}></div>
//               <div>{submittedDocuments} Submitted</div>
//             </div>
//             <div className={`${styles.progressStat} ${styles.progressPending}`}>
//               <div className={styles.progressDot}></div>
//               <div>{pendingDocuments} Pending</div>
//             </div>
//             <div className={`${styles.progressStat} ${styles.progressOverdue}`}>
//               <div className={styles.progressDot}></div>
//               <div>{overdueDocuments} Overdue</div>
//             </div>
//           </div>
//         </div>

//         {/* ✅ Date Filter Section */}
//         <div className={styles.card}>
//           <h3 style={{ marginBottom: "1rem", fontWeight: "600" }}>
//             Filter by Year Range
//           </h3>
//           <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
//             <div>
//               <label style={{ fontSize: "0.9rem", marginRight: "0.5rem" }}>
//                 From Year:
//               </label>
//               <input
//                 type="number"
//                 value={tempFromYear}
//                 onChange={(e) => setTempFromYear(e.target.value)}
//                 placeholder="From Year"
//                 className={styles.filterSelect}
//                 style={{ width: "120px" }}
//               />
//             </div>
//             <div>
//               <label style={{ fontSize: "0.9rem", marginRight: "0.5rem" }}>
//                 To Year:
//               </label>
//               <input
//                 type="number"
//                 value={tempToYear}
//                 onChange={(e) => setTempToYear(e.target.value)}
//                 placeholder="To Year"
//                 className={styles.filterSelect}
//                 style={{ width: "120px" }}
//               />
//             </div>
//             <button
//               className={styles.buttonPrimary}
//               onClick={fetchDocumentsByYear}
//               disabled={yearLoading}
//               style={{ marginLeft: "1rem" }}
//             >
//               {yearLoading ? "Loading..." : "Apply Filter"}
//             </button>
//           </div>
//         </div>

//         {/* Filter Section */}
//         <div className={styles.filterSection}>
//           <div className={styles.filterGroup}>
//             <div className={styles.searchBox}>
//               <Search className={styles.searchIcon} />
//               <input
//                 type="text"
//                 placeholder="Search documents..."
//                 value={searchTerm}
//                 onChange={(e) => {
//                   setSearchTerm(e.target.value);
//                   setCurrentPage(1);
//                 }}
//                 className={styles.searchInput}
//               />
//             </div>

//             <select
//               value={statusFilter}
//               onChange={(e) => {
//                 setStatusFilter(e.target.value);
//                 setCurrentPage(1);
//               }}
//               className={styles.filterSelect}
//             >
//               <option value="all">All Statuses</option>
//               {uniqueStatuses.map((status) => (
//                 <option key={status} value={status}>
//                   {status}
//                 </option>
//               ))}
//             </select>

//             <select
//               value={categoryFilter}
//               onChange={(e) => {
//                 setCategoryFilter(e.target.value);
//                 setCurrentPage(1);
//               }}
//               className={styles.filterSelect}
//             >
//               <option value="all">All Categories</option>
//               {uniqueCategories.map((category) => (
//                 <option key={category} value={category}>
//                   {category}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className={styles.resultsInfo}>
//             Showing {paginatedDocuments.length} of {filteredDocuments.length}{" "}
//             documents (filtered from {localCompanyDoc.length} total)
//             {fromYear && toYear && (
//               <span style={{ marginLeft: "1rem", fontWeight: "600" }}>
//                 | Year Range: {fromYear} - {toYear}
//               </span>
//             )}
//           </div>
//         </div>

//         {/* Documents Table */}
//         <div className={styles.documentsTableFull}>
//           <table>
//             <thead>
//               <tr className="bg-gray-200">
//                 <th>Document Category</th>
//                 <th>Document SubCategory</th>
//                 <th>Document Name</th>
//                 <th>Status</th>
//                 <th>Periodicity</th>
//                 <th>Upload Date</th>
//                 <th>Due Date</th>
//                 <th>Doc State</th>
//                 <th>{}</th>
//               </tr>
//             </thead>
//             <tbody>
//               {paginatedDocuments.length > 0 ? (
//                 paginatedDocuments.map((doc, index) => (
//                   <tr
//                     key={`${doc.incubateesname}-${doc.doccatname}-${doc.docsubcatname}-${index}`}
//                     className={styles.tableRow}
//                   >
//                     <td className="flex items-center gap-2">
//                       {getStatusIcon(doc.status)} {doc.doccatname}
//                     </td>
//                     <td className="flex items-center gap-2">
//                       {doc.docsubcatname}
//                     </td>
//                     <td className="flex items-center gap-2">
//                       {doc.documentname}
//                     </td>
//                     <td>{getStatusBadge(doc.status)}</td>
//                     <td>{doc.periodicity}</td>
//                     <td>
//                       {doc.submission_date ? (
//                         new Date(doc.submission_date).toLocaleDateString()
//                       ) : (
//                         <em>Not uploaded</em>
//                       )}
//                     </td>
//                     <td>
//                       {doc.due_date
//                         ? new Date(
//                             doc.due_date.replace("Z", "")
//                           ).toLocaleDateString()
//                         : "N/A"}
//                     </td>
//                     <td>
//                       {doc.collecteddocobsoletestate ? (
//                         <p
//                           style={{
//                             background: "#ff8787",
//                             color: "#c92a2a",
//                             borderRadius: "4px",
//                             padding: "2px 6px",
//                             display: "inline-block",
//                             fontWeight: "600",
//                             fontSize: "12px",
//                           }}
//                         >
//                           {doc.collecteddocobsoletestate}
//                         </p>
//                       ) : (
//                         "---"
//                       )}
//                     </td>
//                     <td className="text-right">
//                       <div
//                         className="flex gap-2 justify-end"
//                         style={{
//                           display: "flex",
//                           gap: "0.5rem",
//                           justifyContent: "flex-end",
//                         }}
//                       >
//                         {doc.filepath && doc.status === "Submitted" ? (
//                           <button
//                             className={styles.buttonPrimary}
//                             onClick={() => handleViewDocument(doc.filepath)}
//                           >
//                             View Doc
//                           </button>
//                         ) : (
//                           <button
//                             className={styles.buttonPrimary}
//                             onClick={() => handleViewDocument(doc.filepath)}
//                             disabled={!doc.filepath}
//                           >
//                             {doc.filepath ? "View Doc" : "No File"}
//                           </button>
//                         )}

//                         {doc.collecteddocobsoletestate === "Not Obsolete" &&
//                           Number(roleid) !== 1 &&
//                           Number(roleid) !== 3 && (
//                             <button
//                               style={{
//                                 background: "#ff8787",
//                                 padding: "0.2rem",
//                                 border: "1px solid #ff8787",
//                                 borderRadius: "0.3rem",
//                                 color: "#c92a2a",
//                                 fontSize: "0.7rem",
//                                 cursor: "pointer",
//                               }}
//                               onClick={() =>
//                                 handleAbolishDocument(doc.filepath)
//                               }
//                               title="Mark document as obsolete"
//                             >
//                               Obselete
//                             </button>
//                           )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="8" className={styles.noData}>
//                     No documents found matching your filters.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>

//           <div>
//             {isPreviewOpen && (
//               <div className={styles.previewModal}>
//                 <div className={styles.previewContent}>
//                   <button
//                     className={styles.closeButton}
//                     onClick={() => setIsPreviewOpen(false)}
//                   >
//                     ✖
//                   </button>
//                   <iframe
//                     src={previewUrl}
//                     title="Document Preview"
//                     width="100%"
//                     height="500px"
//                     style={{ border: "none" }}
//                   />
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Pagination Controls */}
//           {filteredDocuments.length > 0 && (
//             <div className={styles.pagination}>
//               <div className={styles.paginationInfo}>
//                 Page {currentPage} of {totalPages}
//               </div>

//               <div className={styles.paginationControls}>
//                 <button
//                   onClick={handlePrevPage}
//                   disabled={currentPage === 1}
//                   className={styles.paginationButton}
//                 >
//                   <ChevronLeft className={styles.paginationIcon} />
//                   Previous
//                 </button>

//                 <div className={styles.pageNumbers}>
//                   {Array.from({ length: totalPages }, (_, i) => i + 1).map(
//                     (page) => (
//                       <button
//                         key={page}
//                         onClick={() => handlePageClick(page)}
//                         className={`${styles.pageButton} ${
//                           currentPage === page ? styles.pageButtonActive : ""
//                         }`}
//                       >
//                         {page}
//                       </button>
//                     )
//                   )}
//                 </div>

//                 <button
//                   onClick={handleNextPage}
//                   disabled={currentPage === totalPages}
//                   className={styles.paginationButton}
//                 >
//                   Next
//                   <ChevronRight className={styles.paginationIcon} />
//                 </button>
//               </div>

//               <div className={styles.itemsPerPage}>
//                 <label>Items per page: </label>
//                 <select
//                   value={itemsPerPage}
//                   onChange={(e) => {
//                     setItemsPerPage(Number(e.target.value));
//                     setCurrentPage(1);
//                   }}
//                   className={styles.pageSizeSelect}
//                 >
//                   <option value={5}>5</option>
//                   <option value={10}>10</option>
//                   <option value={20}>20</option>
//                   <option value={50}>50</option>
//                 </select>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Add Document Modal - Only for users */}
//         {isModalOpen && Number(roleid) === 4 && (
//           <DocumentUploadModal
//             isModalOpen={isModalOpen}
//             setIsModalOpen={setIsModalOpen}
//             incubateesrecid={incubateesrecid}
//             usersrecid={usersrecid}
//             onUploadSuccess={handleDocumentUpload}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default StartupDashboard;
