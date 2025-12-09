import React, { useContext } from "react";
import styles from "./MetricCardDashboard.module.css";
import MetricCard from "./MetricCard";
import MetricCardShimmer from "./MetricCardShimmer";
import { DataContext } from "../Components/Datafetching/DataProvider";
import { Building2, Users, TrendingUp } from "lucide-react";

const MetricCardDashboard = ({ stats }) => {
  const { companyDoc } = useContext(DataContext);

  // ✅ This is the loading logic.
  // It's "loading" if `stats` is null, undefined, or an empty object.
  const isLoading = !stats || Object.keys(stats).length === 0;

  // This data depends on `companyDoc` from the context
  const overdueDocuments =
    companyDoc?.filter((doc) => doc.status?.toLowerCase() === "overdue")
      .length || 0;

  return (
    <main className={styles.dashboardMain}>
      <div className={styles.metricsGrid}>
        {isLoading ? (
          // If stats are not available, show the shimmer placeholders
          <>
            <MetricCardShimmer variant="primary" />
            <MetricCardShimmer variant="default" />
            <MetricCardShimmer variant="warning" />
          </>
        ) : (
          // If stats are available, show the actual data cards
          <>
            <MetricCard
              title="Total Incubatees"
              value={stats.total_incubatees}
              subtitle="Active startups in portfolio"
              icon={<Building2 size={20} />}
              variant="primary"
            />

            <MetricCard
              title="Total Founders"
              value={stats.total_founders}
              subtitle="Registered entrepreneurs"
              icon={<Users size={20} />}
              variant="default"
            />

            <MetricCard
              title="Overdue Documents"
              value={overdueDocuments}
              subtitle="Require immediate attention"
              icon={<TrendingUp size={20} />}
              variant="warning"
            />
          </>
        )}
      </div>
    </main>
  );
};

export default MetricCardDashboard;
