import React from "react";
import IncubationTable from "./IncubationTable";
import "./IncubationManagement.css"; // page-specific CSS
import styles from "../Navbar.module.css"; // CSS module for scoped styles
import ITELLogo from "../../assets/ITEL_Logo.png"; // Logo image
import { NavLink } from "react-router-dom";
import { FolderDown, MoveLeft } from "lucide-react"; // Icon for the button

export default function IncubationManagementPage() {
  return (
    <div className="doc-management-page">
      <main className="doc-management-main" style={{ paddingTop: "100px" }}>
        <h1>Incubator Management</h1>

        <section className="doccat-section">
          <IncubationTable />
        </section>
      </main>
    </div>
  );
}
