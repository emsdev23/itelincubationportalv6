import React from "react";
import ReactApexChart from "react-apexcharts";
import styles from "./FundingStageChart.module.css";
import MetricCardShimmer from "./MetricCardShimmer";

const FundingStageChart = ({ byStage }) => {
  // if (!byStage || byStage.length === 0) return <p>No data available</p>;
  // if (!byStage || byStage.length === 0) return <p></p>;
  const isLoading = !byStage || Object.keys(byStage).length === 0;

  // ✅ Define desired order
  const stageOrder = [
    "Expansion Stage",
    "Growth Stage",
    "Early Stage",
    "Seed Stage",
    "Pre Seed Stage",
  ];

  // Sort byStage array based on stageOrder
  const sortedStages = [...byStage].sort(
    (a, b) =>
      stageOrder.indexOf(a.startupstagesname) -
      stageOrder.indexOf(b.startupstagesname)
  );

  // Prepare data
  const categories = sortedStages.map((item) => item.startupstagesname);
  const data = sortedStages.map((item) => item.incubatees_count);

  // Get current date and time string: YYYY-MM-DD_HH-MM-SS
  const now = new Date();
  const pad = (num) => num.toString().padStart(2, "0");
  const dateTimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  const options = {
    chart: {
      type: "bar",
      toolbar: {
        show: true,
        export: {
          csv: { filename: `StageBased_${dateTimeStr}` },
          svg: { filename: `StageBased_${dateTimeStr}` },
          png: { filename: `StageBased_${dateTimeStr}` },
        },
      },
    },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } },
    colors: ["#3b82f6"],
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: { style: { fontSize: "12px", colors: "#6b7280" } },
    },
    yaxis: { labels: { style: { fontSize: "12px", colors: "#6b7280" } } },
    tooltip: { y: { formatter: (val) => `${val} companies` } },
    grid: { borderColor: "#e5e7eb", strokeDashArray: 3 },
    legend: { show: false },
  };

  const series = [{ name: "Companies", data }];

  return (
    <div className={styles.card}>
      {isLoading ? (
        // If stats are not available, show the shimmer placeholders
        <>
          <MetricCardShimmer />
        </>
      ) : (
        <div>
          <div className={styles.header}>
            <h3 className={styles.title}>Companies by Stage</h3>
          </div>
          <div className={styles.content}>
            <div className={styles.statsGrid}>
              {sortedStages.map((stage) => (
                <div key={stage.startupstagesname} className={styles.statItem}>
                  <div className={styles.statValue}>
                    {stage.incubatees_count}
                  </div>
                  <div className={styles.statLabel}>
                    {stage.startupstagesname}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.chartWrapper}>
              <ReactApexChart
                options={options}
                series={series}
                type="bar"
                height="100%"
                width="100%"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundingStageChart;
