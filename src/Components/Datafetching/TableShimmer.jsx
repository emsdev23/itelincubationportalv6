import React from "react";
import { Box, Skeleton } from "@mui/material";
import { styled } from "@mui/material/styles";

const ShimmerContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(2),
  backgroundColor: "#fff",
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
}));

const ShimmerHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  marginBottom: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(1),
}));

const ShimmerRow = styled(Box)(({ theme }) => ({
  display: "flex",
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: `${theme.spacing(1)} 0`,
}));

const ShimmerCell = styled(Box)(({ theme, width }) => ({
  marginRight: theme.spacing(1),
  flex: `0 0 ${width}px`,
}));

const TableShimmer = ({ rowCount = 10, columns = [] }) => {
  // Default columns if none provided
  const defaultColumns = [
    { width: 180 },
    { width: 180 },
    { width: 180 },
    { width: 200 },
    { width: 150 },
    { width: 150 },
    { width: 120 },
    { width: 120 },
    { width: 200 },
    { width: 200 },
  ];

  const shimmerColumns = columns.length > 0 ? columns : defaultColumns;

  return (
    <ShimmerContainer>
      {/* Header shimmer */}
      <ShimmerHeader>
        {shimmerColumns.map((column, index) => (
          <ShimmerCell key={index} width={column.width}>
            <Skeleton variant="text" height={24} />
          </ShimmerCell>
        ))}
      </ShimmerHeader>

      {/* Row shimmers */}
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <ShimmerRow key={rowIndex}>
          {shimmerColumns.map((column, colIndex) => (
            <ShimmerCell key={colIndex} width={column.width}>
              <Skeleton variant="text" height={20} />
            </ShimmerCell>
          ))}
        </ShimmerRow>
      ))}
    </ShimmerContainer>
  );
};

export default TableShimmer;
