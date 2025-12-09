import React from "react";

const MetricCardShimmer = ({ variant = "" }) => {
  // Define colors for the left border to match your variants
  const variantColors = {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    default: "#6b7280",
  };

  // This is the key style for the animation
  const shimmerStyle = {
    backgroundColor: "#f0f0f0",
    backgroundImage: "linear-gradient(90deg, #f0f0f0, #f8f8f8, #f0f0f0)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite linear",
  };

  return (
    <div
      style={{
        borderRadius: "1rem",
        padding: "1rem",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderLeft: `4px solid ${variantColors[variant]}`,
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div
          style={{
            ...shimmerStyle,
            height: "16px",
            width: "60%",
            borderRadius: "4px",
          }}
        ></div>
        <div
          style={{
            ...shimmerStyle,
            height: "36px",
            width: "36px",
            borderRadius: "8px",
          }}
        ></div>
      </div>

      <div
        style={{
          ...shimmerStyle,
          height: "28px",
          width: "40%",
          borderRadius: "4px",
        }}
      ></div>

      <div
        style={{
          ...shimmerStyle,
          height: "14px",
          width: "80%",
          borderRadius: "4px",
        }}
      ></div>
    </div>
  );
};

export default MetricCardShimmer;
