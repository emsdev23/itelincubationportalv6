import React from "react";
import { useContext } from "react";
import { DataContext } from "../Components/Datafetching/DataProvider";
import styles from "./Navbar.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import MetricCardDashboard from "./MetricCardDashboard";
import CompanyFieldChart from "./CompanyFieldChart";
import FundingStageChart from "./FundingStageChart";
import DocumentTable from "./DocumentTable";
import CompanyTable from "./CompanyTable";
import DDIDocumentUploadModal from "./DDI/DDIDocumentUploadModal ";
import DDIDocumentsTable from "./DDI/DDIDocumentsTable";
import { IPAdress } from "./Datafetching/IPAdrees";
import IncubatorSelectorTable from "./IncubatorSelectorTable";

function MainDashboard() {
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
  return (
    <div style={{ marginTop: "100px" }}>
      {/* Main Content */}
      <main className={styles.main}>
        {roleid === "0" ? <IncubatorSelectorTable /> : ""}

        <br />
        {roleid === "7" ? "" : <MetricCardDashboard stats={stats} />}

        {roleid === "7" ? (
          ""
        ) : (
          <div
            className={styles.charts}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <CompanyFieldChart byField={byField} loading={loading} />
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
    </div>
  );
}

export default MainDashboard;
