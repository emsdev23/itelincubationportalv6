import React from "react";
import AppDetailsTable from "./AppDetailsTable";
import GroupDetailsTable from "./GroupDetailsTable";
import "./ApplicationManagement.css"; // page-specific CSS
import styles from "../Navbar.module.css"; // CSS module for scoped styles
import ITELLogo from "../../assets/ITEL_Logo.png"; // Logo image
import { NavLink } from "react-router-dom";
import { FolderDown, MoveLeft } from "lucide-react"; // Icon for the button

export default function ApplicationManagement() {
  return (
    <div className="doc-management-page">
      <header className={styles.header}>
        <div className={styles.container}>
          {/* Left - Logo + Title */}
          <div className={styles.logoSection}>
            <img src={ITELLogo} className={styles.logoIcon} alt="ITEL Logo" />
            <div>
              <h1 className={styles.title}>ITEL Incubation Portal</h1>
              <p className={styles.subtitle}>Startup Management Dashboard</p>
            </div>
          </div>

          {/* Right - Actions */}
          <div className={styles.actions}>
            <NavLink
              to="/Incubation/Dashboard/"
              style={{ textDecoration: "none" }}
            >
              <button className={styles.btnPrimary}>
                <MoveLeft className={styles.icon} />
                Back To Portal
              </button>
            </NavLink>
          </div>
        </div>
      </header>
      <main className="doc-management-main">
        <h1>Application Management</h1>

        <section className="doccat-section">
        <GroupDetailsTable/>
        </section>

      </main>
    </div>
  );
}
