import React from "react";
import UserAssociationTable from "./UserAssociationTable";
import "./UserAssociation.css"; // page-specific CSS
import styles from "../Navbar.module.css"; // CSS module for scoped styles
import ITELLogo from "../../assets/ITEL_Logo.png"; // Logo image
import { NavLink } from "react-router-dom";
import { FolderDown, MoveLeft } from "lucide-react"; // Icon for the button
import DDIAssociationTable from "./DDIAssociationTable";
import { IPAdress } from "../Datafetching/IPAdrees";

export default function UserAssociation() {
  return (
    <div className="doc-management-page">
      <main className="doc-management-main" style={{ paddingTop: "100px" }}>
        <h1>🔗 User Associations Management</h1>
        <section className="doccat-section">
          <UserAssociationTable />
        </section>
        <section className="doccat-section">
          <DDIAssociationTable />
        </section>
      </main>
    </div>
  );
}
