import React, { useEffect, useState, useRef } from "react";
import styles from "./Navbar.module.css";
import {
  UserRound,
  X,
  LogOut,
  CircleUserRound,
  FolderDown,
  MessageSquare,
  FileBadge,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import ITELLogo from "../assets/ITEL_Logo.png";
import MetricCardDashboard from "./MetricCardDashboard";
import CompanyFieldChart from "./CompanyFieldChart";
import FundingStageChart from "./FundingStageChart";
import DocumentTable from "./DocumentTable";
import { NavLink, useNavigate } from "react-router-dom";
import CompanyTable from "./CompanyTable";
import Swal from "sweetalert2";
import AuditLogsModal from "./AuditLogsModal ";
import api from "./Datafetching/api";

import { useContext } from "react";
import { DataContext } from "../Components/Datafetching/DataProvider";
import DDIDocumentUploadModal from "./DDI/DDIDocumentUploadModal ";
import DDIDocumentsTable from "./DDI/DDIDocumentsTable";
import { IPAdress } from "./Datafetching/IPAdrees";
import IncubatorSelectorTable from "./IncubatorSelectorTable";

const Navbar = () => {
  const {
    stats,
    byField,
    byStage,
    loading,
    companyDoc,
    listOfIncubatees,
    clearAllData,
    roleid, // Get roleid from context
    selectedIncubation, // Get selected incubation
  } = useContext(DataContext);
  const navigate = useNavigate();

  // Ref for actions container
  const actionsRef = useRef(null);

  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  console.log(stats);
  console.log(byField);
  console.log(byStage);
  console.log(loading);
  console.log(companyDoc);
  console.log(listOfIncubatees);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    founder: "",
    incorporationDate: "",
    website: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  //form for add startUP
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Startup:", formData);
    // TODO: send data to backend
    setIsModalOpen(false);
    setFormData({ name: "", founder: "", incorporationDate: "", website: "" });
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

      // Get session data without JSON.parse for incuserid
      const userid = roleid === "0" ? "32" : sessionStorage.getItem("userid");
      const incUserId = sessionStorage.getItem("incuserid"); // Don't parse this
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
      const response = await api.post("/auth/logout", {
        userid,
        reason: `Manual Logout at ${currentTime}`,
      });

      const data = response.data.data || response.data;
      console.log("Logout response:", data);

      // Step 4️⃣: Handle response
      Swal.close();

      // With axios, if we're here, request was successful
      // No need to check response.ok
      // Clear all context and session storage
      clearAllData();
      sessionStorage.removeItem("userid");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("roleid");
      sessionStorage.removeItem("incuserid");

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Logged Out",
        text: "You have been successfully logged out.",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        navigate("/", { replace: true });
      });
    } catch (error) {
      console.error("Logout error:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text:
          error.response?.data?.message ||
          "Something went wrong while logging out.",
      });
    }
  };

  //get data form session storage
  const userid =
    roleid === "0"
      ? sessionStorage.getItem("userid")
      : JSON.parse(sessionStorage.getItem("userid"));
  const sessionRoleid = sessionStorage.getItem("roleid"); // Get roleid from sessionStorage
  const token = sessionStorage.getItem("token");
  console.log(userid, sessionRoleid, token);

  // Check if user has roleid 3 (Incubator Operator)
  const isOperator = Number(roleid) === 3 || Number(sessionRoleid) === 3;
  const isDueDeeligence = Number(roleid) === 7 || Number(sessionRoleid) === 7;
  const SuperAdmin = Number(roleid) === 0 || Number(sessionRoleid) === 0;

  const logedinProfile =
    roleid === "1"
      ? "Incubator"
      : roleid === "3"
      ? "Incubator Operator"
      : roleid === "7"
      ? "Due Deligence Inspector"
      : roleid === "4"
      ? "Incubatee"
      : "Admin";
  console.log(logedinProfile);

  // Function to get logo URL
  const getLogoUrl = () => {
    if (selectedIncubation && selectedIncubation.incubationslogopath) {
      // If path starts with http, use it directly
      if (selectedIncubation.incubationslogopath.startsWith("http")) {
        return selectedIncubation.incubationslogopath;
      }
      // Otherwise, prepend the base URL
      return `${IPAdress}${selectedIncubation.incubationslogopath}`;
    }
    // Return default logo if no selected incubation or no logo path
    return ITELLogo;
  };

  useEffect(() => {}, []);

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          {/* Left - Logo + Title */}
          <div className={styles.logoSection}>
            <img
              src={getLogoUrl()}
              className={styles.logoIcon}
              alt="Incubator Logo"
            />
            <div>
              <h1 className={styles.title} style={{ whiteSpace: "pre" }}>
                ITEL Incubation Portal
              </h1>
              <p className={styles.subtitle} style={{ whiteSpace: "pre" }}>
                Startup Management Dashboard
              </p>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            className={styles.mobileMenuToggle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <MoreHorizontal size={24} />}
          </button>

          {/* Right - Actions */}
          <div
            ref={actionsRef}
            className={`${styles.actions} ${
              isMobileMenuOpen ? styles.mobileMenuOpen : ""
            }`}
          >
            {/* Chat button now available for all users */}
            {Number(roleid) === 0 && (
              <NavLink
                to="/Incubation/Dashboard/Incubation"
                style={{ textDecoration: "none" }}
              >
                <button className={styles.btnPrimary}>
                  <FileBadge className={styles.icon} />
                  Incubator Management
                </button>
              </NavLink>
            )}
            {Number(roleid) !== 7 && !SuperAdmin && (
              <NavLink
                to="/Incubation/Dashboard/Chats"
                style={{ textDecoration: "none" }}
              >
                <button className={styles.btnPrimary}>
                  <MessageSquare className={styles.icon} />
                  Chat
                </button>
              </NavLink>
            )}

            {/* Only show User Management button if roleid is not 3 */}
            {!isOperator && !isDueDeeligence && (
              <NavLink
                to="/Incubation/Dashboard/Usermanagement"
                style={{ textDecoration: "none" }}
              >
                <button
                  className={styles.btnPrimary}
                  style={{ whiteSpace: "pre" }}
                >
                  <UserRound className={styles.icon} />
                  User Management
                </button>
              </NavLink>
            )}

            {/* Only show User Association button if roleid is not 3 */}
            {!isOperator && !isDueDeeligence && !SuperAdmin && (
              <NavLink
                to="/Incubation/Dashboard/Userassociation"
                style={{ textDecoration: "none" }}
              >
                <button
                  className={styles.btnPrimary}
                  style={{ whiteSpace: "pre" }}
                >
                  <UserRound className={styles.icon} />
                  User Association
                </button>
              </NavLink>
            )}

            {/* Only show Document Management button if roleid is not 3 */}
            {!isOperator && !isDueDeeligence && !SuperAdmin && (
              <NavLink
                to="/Incubation/Dashboard/AddDocuments"
                style={{ textDecoration: "none" }}
              >
                <button
                  className={styles.btnPrimary}
                  style={{ whiteSpace: "pre" }}
                >
                  <FolderDown className={styles.icon} />
                  Document Management
                </button>
              </NavLink>
            )}
            {!isOperator && !isDueDeeligence && !SuperAdmin && (
              <NavLink
                to="/Incubation/Dashboard/Roles"
                style={{ textDecoration: "none" }}
              >
                <button className={styles.btnPrimary}>
                  <FolderDown className={styles.icon} />
                  Roles Management
                </button>
              </NavLink>
            )}
            {!isOperator && !isDueDeeligence && !SuperAdmin && (
              <NavLink
                to="/Incubation/Dashboard/Applications"
                style={{ textDecoration: "none" }}
              >
                <button className={styles.btnPrimary}>
                  <FolderDown className={styles.icon} />
                  Application Management
                </button>
              </NavLink>
            )}

            <button
              className={styles.btnPrimary}
              onClick={() => setIsLogsModalOpen(true)}
              style={{ whiteSpace: "pre" }}
            >
              <FileText className={styles.icon} />
              Audit Logs
            </button>

            <button
              className={styles.btnPrimary}
              onClick={handleLogout}
              style={{ color: "#fff", background: "#fa5252" }}
            >
              <LogOut className={styles.icon} />
              Logout
            </button>

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
              // onClick={() => setIsChangePasswordOpen(true)}
            >
              <CircleUserRound />
              <div>{logedinProfile}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {roleid === "0" ? <IncubatorSelectorTable /> : ""}

        <br />
        {roleid === "7" ? "" : <MetricCardDashboard stats={stats} />}

        {roleid === "7" ? (
          ""
        ) : (
          <div className={styles.charts}>
            <CompanyFieldChart byField={byField} />
            <FundingStageChart byStage={byStage} />
          </div>
        )}

        {/* Incubator Selector and Table Component */}

        <CompanyTable companyList={listOfIncubatees} />
        <br />
        <DDIDocumentUploadModal />
        <br />
        <DocumentTable />
        <br />
        {roleid === "0" ? "" : <DDIDocumentsTable />}
      </main>

      {/* Audit Logs Modal */}
      <AuditLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        IPAddress={IPAdress}
        token={token}
        userid={userid}
      />
    </div>
  );
};

export default Navbar;
