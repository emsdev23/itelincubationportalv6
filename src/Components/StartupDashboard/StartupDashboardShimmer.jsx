import React from "react";
import styles from "./StartupDashboard.module.css";

// This is the key style for the animation
const shimmerStyle = {
  backgroundColor: "#f0f0f0",
  backgroundImage: "linear-gradient(90deg, #f0f0f0, #fafafa, #f0f0f0)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.8s infinite linear",
};

const StartupDashboardShimmer = () => {
  return (
    <div style={{ marginTop: "100px" }}>
      {/* Shimmer for Header Card */}
      <div className={`${styles.headerCard} ${styles.shimmerCard}`}>
        <div className={styles.headerContent}>
          <div className={styles.headerFlex}>
            <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
              <div
                style={{
                  ...shimmerStyle,
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                }}
              />
              <div>
                <div
                  style={{
                    ...shimmerStyle,
                    width: "250px",
                    height: "36px",
                    borderRadius: "4px",
                    marginBottom: "0.5rem",
                  }}
                />
              </div>
            </div>
            <div className={styles.headerBadges}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...shimmerStyle,
                    width: "180px",
                    height: "20px",
                    borderRadius: "4px",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shimmer for Stats Cards */}
      <div className={styles.statsGrid}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${styles.card} ${styles.shimmerCard}`}>
            <div
              style={{
                ...shimmerStyle,
                width: "60%",
                height: "20px",
                borderRadius: "4px",
              }}
            ></div>
            <div
              style={{
                ...shimmerStyle,
                width: "40%",
                height: "32px",
                borderRadius: "4px",
                marginTop: "1rem",
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* Shimmer for Progress Bar Card */}
      <div className={`${styles.card} ${styles.shimmerCard}`}>
        <div
          style={{
            ...shimmerStyle,
            width: "200px",
            height: "28px",
            borderRadius: "4px",
          }}
        ></div>
        <div
          style={{
            ...shimmerStyle,
            width: "80%",
            height: "20px",
            borderRadius: "4px",
            marginTop: "1rem",
          }}
        ></div>
        <br />
        <div
          style={{
            ...shimmerStyle,
            width: "100%",
            height: "30px",
            borderRadius: "15px",
          }}
        ></div>
        <div className={styles.progressStats} style={{ marginTop: "1rem" }}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={styles.progressStat}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <div
                style={{
                  ...shimmerStyle,
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                }}
              ></div>
              <div
                style={{
                  ...shimmerStyle,
                  width: "100px",
                  height: "16px",
                  borderRadius: "4px",
                }}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartupDashboardShimmer;
