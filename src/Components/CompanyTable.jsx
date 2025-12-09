import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../Components/Datafetching/DataProvider";
import api from "../Components/Datafetching/api";
import ReusableDataGrid from "../Components/Datafetching/ReusableDataGrid"; // Import the reusable component
import styles from "./CompanyTable.module.css";

export default function CompanyTable({ companyList = [] }) {
  const navigate = useNavigate();
  const { roleid, setadminviewData, incuserid, loading } =
    useContext(DataContext);
  const [fieldOfWorkList, setFieldOfWorkList] = useState([]);

  // Fetch Field of Work List from API
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await api.post(
          "/generic/getcombyfield",
          { userId: 1, userIncId: incuserid },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data?.statusCode === 200) {
          setFieldOfWorkList(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching field of work list:", error);
      }
    };

    fetchFields();
  }, [incuserid]);

  // Stage colors mapping
  const stageColors = {
    1: { backgroundColor: "#e0e7ff", color: "#4338ca" }, // Pre Seed
    2: { backgroundColor: "#dbeafe", color: "#1e40af" }, // Seed
    3: { backgroundColor: "#d1fae5", color: "#065f46" }, // Early
    4: { backgroundColor: "#fef3c7", color: "#92400e" }, // Growth
    5: { backgroundColor: "#ede9fe", color: "#5b21b6" }, // Expansion
  };

  // Define columns
  const columns = [
    {
      field: "incubateesname",
      headerName: "Company",
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      field: "incubateesfieldofworkname",
      headerName: "Field of Work",
      width: 180,
      sortable: true,
      filterable: true,
    },
    {
      field: "incubateesstagelevel",
      headerName: "Stage",
      width: 150,
      sortable: true,
      filterable: true,
      type: "chip",
      displayField: "incubateesstagelevelname", // Display this field's value in the chip
      chipColors: stageColors,
    },
    {
      field: "incubationshortname",
      headerName: "Incubator",
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      field: "incubateesdateofincorporation",
      headerName: "Date of Incorporation",
      width: 180,
      sortable: true,
      filterable: true,
      type: "date",
    },
    {
      field: "incubateesdateofincubation",
      headerName: "Date of Incubation",
      width: 180,
      sortable: true,
      filterable: true,
      type: "date",
    },
  ];

  // Conditionally add actions column based on role
  if ([1, 3, 7].includes(Number(roleid))) {
    columns.push({
      field: "actions",
      headerName: "Actions",
      width: 150,
      type: "actions",
      actions: [
        {
          label: "View Details",
          variant: "contained",
          size: "small",
          onClick: (row) => {
            setadminviewData(row.usersrecid);
            navigate("/startup/Dashboard", {
              state: {
                usersrecid: row.usersrecid,
                companyName: row.incubateesname,
              },
            });
          },
        },
      ],
    });
  }

  // Define dropdown filters
  const dropdownFilters = [
    {
      field: "incubateesstagelevel",
      label: "Stage",
      width: 150,
      options: [
        { value: "1", label: "Pre Seed" },
        { value: "2", label: "Seed Stage" },
        { value: "3", label: "Early Stage" },
        { value: "4", label: "Growth Stage" },
        { value: "5", label: "Expansion Stage" },
      ],
    },
    {
      field: "incubateesfieldofworkname",
      label: "Field of Work",
      width: 200,
      options: fieldOfWorkList.map((field) => ({
        value: field.fieldofworkname,
        label: field.fieldofworkname,
        count: field.incubatees_count,
      })),
    },
  ];

  // Custom export data formatter (optional - customize export columns)
  const handleExportData = (data) => {
    return data.map((item) => ({
      "Company Name": item.incubateesname || "",
      "Field of Work": item.incubateesfieldofworkname || "",
      Stage: item.incubateesstagelevelname || "",
      Incubator: item.incubationshortname || "",
      "Date of Incorporation": item.incubateesdateofincorporation
        ? new Date(item.incubateesdateofincorporation).toLocaleDateString()
        : "-",
      "Date of Incubation": item.incubateesdateofincubation
        ? new Date(item.incubateesdateofincubation).toLocaleDateString()
        : "-",
    }));
  };

  return (
    <ReusableDataGrid
      // Data
      data={companyList}
      // Column configuration
      columns={columns}
      // Table title
      title="Incubatees"
      // Dropdown filters
      dropdownFilters={dropdownFilters}
      // Search configuration
      searchPlaceholder="Search companies or fields..."
      searchFields={["incubateesname", "incubateesfieldofworkname"]}
      // Unique ID field for row identification
      uniqueIdField="incubateesrecid"
      // Export configuration
      enableExport={true}
      onExportData={handleExportData}
      exportConfig={{
        filename: "incubatees",
        sheetName: "Incubatees",
      }}
      // Column filters
      enableColumnFilters={true}
      loading={loading} // <-- PASS THE LOADING STATE HERE
      shimmerRowCount={5} // <-- OPTIONAL: Customize shimmer rows
      // Custom CSS class
      className={styles.card}
    />
  );
}
