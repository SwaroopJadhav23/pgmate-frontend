import { useState } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import AdminSponsorship from "./AdminSponsorship";
import AdminPGManagement from "./AdminPGManagement";
import "./AdminPriorityControl.css";

const AdminPriorityControl = () => {
  const [activeSection, setActiveSection] = useState("SPONSORSHIP");
  const [refreshKey, setRefreshKey] = useState(0);
   const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, reApplied: 0 });

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  return (
    <DashboardLayout
      title="PG Priority Control"
      subtitle="Sponsorship & City Priority Management"
    >
      <div className="spon-stats-row">
        <div className="spon-stat-card spon-stat-yellow" onClick={() => setActiveSection("SPONSORSHIP")}>
          <div className="spon-stat-icon">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="spon-stat-info">
            <div className="spon-stat-value">{stats.pending}</div>
            <div className="spon-stat-label">Pending</div>
            <div className="spon-stat-sub">Awaiting review</div>
          </div>
        </div>

        <div className="spon-stat-card spon-stat-indigo" onClick={() => setActiveSection("SPONSORSHIP")}>
          <div className="spon-stat-icon">
            <i className="bi bi-arrow-repeat"></i>
          </div>
          <div className="spon-stat-info">
            <div className="spon-stat-value">{stats.reApplied}</div>
            <div className="spon-stat-label">Re-Applied</div>
            <div className="spon-stat-sub">Resubmitted requests</div>
          </div>
        </div>

        <div className="spon-stat-card spon-stat-red" onClick={() => setActiveSection("SPONSORSHIP")}>
          <div className="spon-stat-icon">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="spon-stat-info">
            <div className="spon-stat-value">{stats.rejected}</div>
            <div className="spon-stat-label">Rejected</div>
            <div className="spon-stat-sub">Failed verification</div>
          </div>
        </div>

        <div className="spon-stat-card spon-stat-green" onClick={() => setActiveSection("SPONSORSHIP")}>
          <div className="spon-stat-icon">
            <i className="bi bi-patch-check-fill"></i>
          </div>
          <div className="spon-stat-info">
            <div className="spon-stat-value">{stats.approved}</div>
            <div className="spon-stat-label">Approved</div>
            <div className="spon-stat-sub">Active sponsorships</div>
          </div>
        </div>
      </div>

      <div className="section-toggle">
        <button
          className={`toggle-btn ${activeSection === "SPONSORSHIP" ? "active" : ""}`}
          onClick={() => setActiveSection("SPONSORSHIP")}
        >
          Sponsorship
        </button>
        <button
          className={`toggle-btn ${activeSection === "PRIORITY" ? "active" : ""}`}
          onClick={() => setActiveSection("PRIORITY")}
        >
          City Priority
        </button>
      </div>

      {activeSection === "SPONSORSHIP" && (
        <div className="priority-section">
          <div className="section-header">
            <h4 className="section-title">Sponsorship Requests</h4>
          </div>
          <AdminSponsorship onPriorityChanged={triggerRefresh} 
          onStatsChange={setStats} />
        </div>
      )}

      {activeSection === "PRIORITY" && (
        <div className="priority-section">
          <div className="section-header">
            <h4 className="section-title">City Priority Management</h4>
          </div>
          <AdminPGManagement refreshKey={refreshKey} />
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminPriorityControl;