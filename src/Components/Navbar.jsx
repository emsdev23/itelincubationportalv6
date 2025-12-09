import React, { useEffect, useState, useRef, useContext } from "react";
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
  Home,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  History,
  ChevronDown,
} from "lucide-react";
import ITELLogo from "../assets/ITEL_Logo.png";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import AuditLogsModal from "../Components/AuditLogsModal ";
import api from "./Datafetching/api";
import { DataContext } from "../Components/Datafetching/DataProvider";
import { IPAdress } from "./Datafetching/IPAdrees";
import { AuthContext } from "../App";
import ChangePasswordModal from "../Components/StartupDashboard/ChangePasswordModal";
import ContactModal from "../Components/StartupDashboard/ContactModal";
import NewChatModal from "../Components/ChatApp/NewChatModal";

const Navbar = () => {
  const {
    stats,
    byField,
    byStage,
    loading,
    companyDoc,
    listOfIncubatees,
    clearAllData,
    roleid,
    selectedIncubation,
    founderName,
    adminviewData,
    menuItemsFromAPI,
    menuItemsLoading,
  } = useContext(DataContext);
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // --- State Variables ---
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // --- Refs ---
  const actionsRef = useRef(null);
  const chatDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // --- User and Session Data ---
  const currentUser = {
    id: sessionStorage.getItem("userid") || "1",
    name: sessionStorage.getItem("username") || "User",
    role: sessionStorage.getItem("userrole") || "incubatee",
    roleid: sessionStorage.getItem("roleid") || null,
    incUserid: sessionStorage.getItem("incuserid") || null,
  };

  const userid =
    roleid === "0"
      ? sessionStorage.getItem("userid")
      : JSON.parse(sessionStorage.getItem("userid"));
  const sessionRoleid = sessionStorage.getItem("roleid");
  const token = sessionStorage.getItem("token");
  const incuserid = sessionStorage.getItem("incuserid");

  const isOperator = Number(roleid) === 3 || Number(sessionRoleid) === 3;
  const isDueDeeligence = Number(roleid) === 7 || Number(sessionRoleid) === 7;
  const SuperAdmin = Number(roleid) === 0 || Number(sessionRoleid) === 0;
  const isIncubatee = Number(roleid) === 4 || Number(sessionRoleid) === 4;

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

  // --- Functions ---

  // Function to map icon names from API to Lucide React components
  const getIconComponent = (iconName) => {
    const iconMap = {
      Home: <Home size={20} />,
      UserRound: <UserRound size={20} />,
      FolderDown: <FolderDown size={20} />,
      FileBadge: <FileBadge size={20} />,
      MessageSquare: <MessageSquare size={20} />,
      FileText: <FileText size={20} />,
      History: <History size={20} />,
      // Add more icon mappings as needed
    };
    return iconMap[iconName] || <Home size={20} />;
  };

  // Initialize body class on component mount
  useEffect(() => {
    document.body.classList.add("sidebar-collapsed");
    document.body.classList.remove("sidebar-expanded");
    return () => {
      document.body.classList.remove("sidebar-collapsed", "sidebar-expanded");
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isChatDropdownOpen &&
        chatDropdownRef.current &&
        !chatDropdownRef.current.contains(event.target)
      ) {
        setIsChatDropdownOpen(false);
      }
      if (
        isProfileDropdownOpen &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isChatDropdownOpen || isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isChatDropdownOpen, isProfileDropdownOpen]);

  const handleLogout = async () => {
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

    if (!confirmResult.isConfirmed) return;

    try {
      Swal.fire({
        title: "Logging out...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const logoutUserId =
        roleid === "0" ? "32" : sessionStorage.getItem("userid");
      const currentTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      await api.post("/auth/logout", {
        userid: logoutUserId,
        reason: `Manual Logout at ${currentTime}`,
      });

      Swal.close();
      clearAllData();
      sessionStorage.clear();
      document.body.classList.remove("sidebar-expanded", "sidebar-collapsed");
      setIsAuthenticated(false);

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
        text: error.response?.data?.message || "Something went wrong.",
      });
    }
  };

  const getLogoUrl = () => {
    if (selectedIncubation && selectedIncubation.incubationslogopath) {
      if (selectedIncubation.incubationslogopath.startsWith("http")) {
        return selectedIncubation.incubationslogopath;
      }
      return `${IPAdress}${selectedIncubation.incubationslogopath}`;
    }
    return ITELLogo;
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      document.body.classList.add("sidebar-expanded");
      document.body.classList.remove("sidebar-collapsed");
    } else {
      document.body.classList.add("sidebar-collapsed");
      document.body.classList.remove("sidebar-expanded");
    }
  };

  const handleBackToAdmin = () => {
    navigate("/Incubation/Dashboard");
  };

  const handleHistory = () => {
    setIsChatDropdownOpen(false);
    sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
    navigate("/Incubation/Dashboard/ChatHistory");
  };

  const handleChatCreated = async (newChat) => {
    setShowNewChatModal(false);
    if (newChat && newChat.chatlistrecid) {
      navigate(`/Incubation/Dashboard/Chats?chatId=${newChat.chatlistrecid}`);
    }
  };

  // --- Render Logic ---

  // Define paths that should be in the top navigation bar, not sidebar
  const topNavPaths = [
    "/Incubation/Dashboard/Chats",
    "/Incubation/Dashboard/ChatHistory",
  ];

  // Filter API data to get only sidebar items
  const sidebarMenuItems = menuItemsFromAPI
    .filter((item) => {
      // Exclude top nav items
      if (topNavPaths.includes(item.guiappspath)) {
        return false;
      }
      // Only include startup dashboard for incubatees (roleid 4)
      if (item.guiappspath === "/startup/Dashboard") {
        return Number(roleid) === 4 || Number(sessionRoleid) === 4;
      }
      // Include all other items based on read access
      return item.appsreadaccess === 1;
    })
    .map((item) => ({
      ...item, // Keep original item data
      label: item.guiappsappname,
      icon: getIconComponent(item.guiappsappicon),
      path: item.guiappspath,
      exact:
        item.guiappspath === "/Incubation/Dashboard" ||
        item.guiappspath === "/startup/Dashboard",
    }));

  // Add Audit Logs manually to the sidebar menu items
  const allSidebarItems = [
    ...sidebarMenuItems,
    {
      label: "Audit Logs",
      icon: <FileText size={20} />,
      path: null,
      visible: true,
      exact: false,
      isModal: true,
      onClick: () => setIsLogsModalOpen(true),
    },
  ];

  // Check if user has access to chat functionality
  const hasChatAccess = menuItemsFromAPI.some(
    (item) =>
      item.guiappspath === "/Incubation/Dashboard/Chats" &&
      item.appsreadaccess === 1
  );

  const hasChatHistoryAccess = menuItemsFromAPI.some(
    (item) =>
      item.guiappspath === "/Incubation/Dashboard/ChatHistory" &&
      item.appsreadaccess === 1
  );

  return (
    <>
      {/* Top Navigation Bar */}
      <div className={styles.topNavbar}>
        <div className={styles.topNavbarLeft}>
          <img
            src={getLogoUrl()}
            className={styles.topLogo}
            alt="Incubator Logo"
          />
          <div className={styles.topTitle}>
            <h1>ITEL Incubation Portal</h1>
            <p>
              {Number(roleid) === 1
                ? "Admin Dashboard"
                : "Startup Management Dashboard"}
            </p>
          </div>
        </div>
        <div className={styles.topNavbarRight}>
          {/* Chat Dropdown */}
          {hasChatAccess && !isDueDeeligence && !SuperAdmin && (
            <div className={styles.chatDropdown} ref={chatDropdownRef}>
              <button
                className={`${styles.chatButton} ${
                  location.pathname === "/Incubation/Dashboard/Chats"
                    ? styles.active
                    : ""
                }`}
                onClick={() => setIsChatDropdownOpen(!isChatDropdownOpen)}
              >
                <MessageSquare size={20} />
                <span>Chat</span>
                <ChevronDown size={16} />
              </button>
              {isChatDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <NavLink
                    to="/Incubation/Dashboard/Chats"
                    className={({ isActive }) =>
                      `${styles.dropdownItem} ${isActive ? styles.active : ""}`
                    }
                    onClick={() => setIsChatDropdownOpen(false)}
                  >
                    <MessageSquare size={16} />
                    Open Chat
                  </NavLink>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      setShowNewChatModal(true);
                      setIsChatDropdownOpen(false);
                    }}
                  >
                    <MessageSquare size={16} />
                    New Chat
                  </button>
                  {hasChatHistoryAccess && Number(roleid) === 1 && (
                    <button
                      className={styles.dropdownItem}
                      onClick={handleHistory}
                    >
                      <History size={16} />
                      Chat History
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Back to Portal button */}
          {(Number(roleid) === 1 ||
            Number(roleid) === 3 ||
            (Number(roleid) === 7 && adminviewData)) && (
            <button className={styles.topNavButton} onClick={handleBackToAdmin}>
              <ArrowLeft size={20} />
              <span>Back to Portal</span>
            </button>
          )}

          {/* Profile Dropdown for incubatees */}
          {Number(roleid) === 4 && (
            <div className={styles.profileDropdown} ref={profileDropdownRef}>
              <button
                className={styles.profileButton}
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <CircleUserRound size={20} />
                <span>
                  {listOfIncubatees && listOfIncubatees.length > 0
                    ? listOfIncubatees[0].incubateesfoundername || "Incubatee"
                    : "Incubatee"}
                </span>
              </button>
              {isProfileDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      setIsChangePasswordOpen(true);
                      setIsProfileDropdownOpen(false);
                    }}
                  >
                    Change Password
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Profile for non-incubatees */}
          {Number(roleid) !== 4 && (
            <div className={styles.profileInfo}>
              <CircleUserRound size={20} />
              <span>{logedinProfile}</span>
            </div>
          )}

          {/* Logout button */}
          <button className={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`${styles.sidebar} ${
          isExpanded ? styles.expanded : styles.collapsed
        }`}
      >
        <nav className={styles.navMenu}>
          {menuItemsLoading
            ? // Shimmer loading effect for menu items
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <div
                    key={`shimmer-${index}`}
                    className={styles.navItemWrapper}
                  >
                    <div className={styles.navItem}>
                      <div className={styles.iconContainer}>
                        <div className={styles.shimmerIcon}></div>
                      </div>
                      {isExpanded && (
                        <div className={styles.navLabel}>
                          <div className={styles.shimmerText}></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            : allSidebarItems.map((item, index) => {
                if (!item.visible && item.visible !== undefined) return null;

                // Handle modal items like Audit Logs
                if (item.isModal) {
                  return (
                    <div
                      key={`audit-logs-${index}`}
                      className={styles.navItemWrapper}
                    >
                      <button
                        className={`${styles.navItem} ${
                          isLogsModalOpen ? styles.active : ""
                        }`}
                        onClick={item.onClick}
                      >
                        <div className={styles.iconContainer}>{item.icon}</div>
                        {isExpanded && (
                          <span className={styles.navLabel}>{item.label}</span>
                        )}
                      </button>
                      {!isExpanded && (
                        <div className={styles.tooltip}>{item.label}</div>
                      )}
                    </div>
                  );
                }

                // Handle regular navigation items
                return (
                  <div
                    key={item.guiappsrecid || index}
                    className={styles.navItemWrapper}
                  >
                    <NavLink
                      to={item.path}
                      end={item.exact}
                      className={({ isActive }) =>
                        `${styles.navItem} ${isActive ? styles.active : ""}`
                      }
                    >
                      <div className={styles.iconContainer}>{item.icon}</div>
                      {isExpanded && (
                        <span className={styles.navLabel}>{item.label}</span>
                      )}
                    </NavLink>
                    {!isExpanded && (
                      <div className={styles.tooltip}>{item.label}</div>
                    )}
                  </div>
                );
              })}
        </nav>
      </div>

      {/* Toggle Button */}
      <button className={styles.toggleButton} onClick={toggleSidebar}>
        {isExpanded ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />}
      </button>

      {/* Main Content Wrapper */}
      <div className={styles.mainContentWrapper}></div>

      {/* Modals */}
      <AuditLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        IPAddress={IPAdress}
        token={token}
        userid={userid}
      />
      <ChangePasswordModal
        isOpen={isChangePasswordOpen && Number(roleid) === 4}
        onClose={() => setIsChangePasswordOpen(false)}
      />
      <ContactModal
        isOpen={isContactModalOpen && Number(roleid) === 4}
        onClose={() => setIsContactModalOpen(false)}
        userId={Number(userid)}
        incuserid={incuserid}
      />
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={handleChatCreated}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default Navbar;
