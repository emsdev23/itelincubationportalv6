import React from "react";
import ReactApexChart from "react-apexcharts";
import styles from "./CompanyFieldChart.module.css";
import MetricCardShimmer from "./MetricCardShimmer";
const COLORS = [
  "#3b82f6",
  "#0ea5e9",
  "#8b5cf6",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#14b8a6",
  "#a855f7",
  "#facc15",
  "#84cc16",
  "#f87171",
  "#10b981",
  "#6366f1",
];

const CompanyFieldChart = ({ byField }) => {
  // if (!byField || byField.length === 0) return <p>No data available</p>;
  // if (!byField || byField.length === 0) return <p></p>;
  const isLoading = !byField || Object.keys(byField).length === 0;

  const total = byField.reduce((sum, item) => sum + item.incubatees_count, 0);

  const labels = byField.map((item) => item.fieldofworkname);
  const series = byField.map((item) =>
    parseFloat(((item.incubatees_count / total) * 100).toFixed(1))
  );

  // ✅ create filename with date
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0]; // e.g. 2025-09-29

  const options = {
    chart: {
      type: "pie",
      toolbar: {
        show: true,
        export: {
          csv: {
            filename: `FieldBased_${dateStr}`,
          },
          svg: {
            filename: `FieldBased_${dateStr}`,
          },
          png: {
            filename: `FieldBased_${dateStr}`,
          },
        },
      },
    },
    labels,
    colors: COLORS,
    legend: {
      position: "bottom",
    },
    tooltip: {
      y: {
        formatter: (val, { seriesIndex }) =>
          `${byField[seriesIndex].incubatees_count} companies (${val}%)`,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`,
    },
  };

  return (
    <div className={styles.card}>
      {isLoading ? (
        // If stats are not available, show the shimmer placeholders
        <>
          <MetricCardShimmer />
        </>
      ) : (
        <div>
          {" "}
          <div className={styles.header}>
            <h3 className={styles.title}>Companies by Field</h3>
          </div>
          <div className={styles.content}>
            <ReactApexChart
              options={options}
              series={series}
              type="pie"
              height={350}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyFieldChart;
