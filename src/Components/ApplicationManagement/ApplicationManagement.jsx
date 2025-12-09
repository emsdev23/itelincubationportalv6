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
      <main className="doc-management-main" style={{ paddingTop: "100px" }}>
        <h1>Application Management</h1>

        <section className="doccat-section">
          <GroupDetailsTable />
        </section>
      </main>
    </div>
  );
}
