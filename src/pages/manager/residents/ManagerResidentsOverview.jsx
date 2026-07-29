import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import ActiveResidents from "../../owner/Resident/ActiveResidents";

const ManagerResidentsOverview = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const reloadLists = () => setRefreshKey((prev) => prev + 1);

  return (
    <DashboardLayout
      title="Tenants"
      subtitle="Manage Active Tenants"
      rightAction={
        <button className="add-resident-btn" onClick={() => navigate("/manager/residents/add")}>
          + Add Tenant
        </button>
      }
    >
      <ActiveResidents
        apiPrefix="/manager/residents"
        refreshKey={refreshKey}
        onReload={reloadLists}
      />
    </DashboardLayout>
  );
};

export default ManagerResidentsOverview;