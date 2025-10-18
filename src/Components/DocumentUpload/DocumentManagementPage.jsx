import React, { useState } from "react";
import DocCatTable from "./DocCatTable"; // Document Categories table
import DocSubCatTable from "./DocSubCatTable"; // Document Subcategories table
import DocumentsTable from "./DocumentsTable"; // Documents table
import "./DocumentManagementPage.css"; // page-specific CSS
import styles from "../Navbar.module.css"; // CSS module for scoped styles
import ITELLogo from "../../assets/ITEL_Logo.png"; // Logo image
import { NavLink } from "react-router-dom";
import { FolderDown, MoveLeft } from "lucide-react"; // Icon for the button
import DDIDocCat from "./DDIDocCat";

export default function DocumentManagementPage() {
  const [activeTab, setActiveTab] = useState("documents"); // State to track active tab

  const tabs = [
    { id: "documents", label: "Incubatee Document Management" },
    { id: "ddiDocuments", label: "DDI Document Management" },
  ];

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
        <h1>Document Management</h1>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "documents" ? (
            <div className="documents-container">
              {/* Document Categories Table */}
              <section className="doccat-section">
                <DocCatTable />
              </section>

              {/* Document Subcategories Table */}
              <section className="docsubcat-section">
                <DocSubCatTable />
              </section>

              {/* Documents Table */}
              <section className="documents-section">
                <DocumentsTable />
              </section>
            </div>
          ) : (
            <div className="ddi-documents-container">
              <DDIDocCat />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
