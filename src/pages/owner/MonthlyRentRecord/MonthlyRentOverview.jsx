import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import api from "../../../api/axios";
import DashboardLayout from "../../../layouts/DashboardLayout";
import MonthlyRentTable from "./MonthlyRentTable";
import "./MonthlyRentTable.css";
import toast from "react-hot-toast";

const DUE_FOR_OPTIONS = [
  "Rent",
  "Electricity Bill",
  "Mess",
  "Maintenance",
  "Penalty",
  "Water Bill",
  "Other",
];

const DUE_FOR_ICONS = {
  Rent: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  "Electricity Bill": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Mess: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  Maintenance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  "Late Fine": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  "Water Bill": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  Other: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
};

const MonthlyRentOverview = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("OVERDUE");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddDue, setShowAddDue] = useState(false);

  const [duesStats, setDuesStats] = useState({
    totalDues: 0,
    overdueAmount: 0,
    tenantsWithDue: 0,
    collectionThisMonth: 0,
  });

  const [residents, setResidents] = useState([]);
  const [form, setForm] = useState({
    residentId: "",
    pgName: "",
    roomNumber: "",
    dueFor: "",
    customReason: "",
    description: "",
    amount: "",
    dueDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get(`/owner/rent/stats`);
      setDuesStats({
        totalDues: res.data?.totalDues || 0,
        overdueAmount: res.data?.overdueAmount || 0,
        tenantsWithDue: res.data?.tenantsWithDue || 0,
        collectionThisMonth: res.data?.collectionThisMonth || 0,
      });
    } catch (error) {
      console.error("Failed to load dues stats:", error);
      if (error.response && error.response.status === 500) {
        toast.error("Something went wrong on our server.\nOur team has been notified.", { duration: 4000 });
      } else if (error instanceof TypeError || (error.message && error.message.includes("Cannot read properties of undefined"))) {
        toast.error("We couldn't complete your request.\nPlease try again in a few minutes.", { duration: 4000 });
      } else {
        toast.error("Unable to load rent statistics.\nPlease refresh the page.", { duration: 4000 });
      }
    }
  }, []);

  const loadResidents = useCallback(async () => {
    try {
      const res = await api.get(`/owner/residents`);
      setResidents(res.data || []);
      return res.data || [];
    } catch (err) {
      console.error("Failed to load residents:", err);
      toast.error("Unable to load resident information.", { duration: 4000 });
      return [];
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshKey]);

  useEffect(() => {
    if (showAddDue) loadResidents();
  }, [showAddDue, loadResidents]);

  // Autofill + auto-open when redirected from Dues button on Tenants page
  useEffect(() => {
    const pre = location.state?.prefillDue;
    if (pre) {
      loadResidents().then(() => {
        setForm((f) => ({
          ...f,
          residentId: pre.residentId,
          pgName: pre.pgName || "",
          roomNumber: pre.roomNumber || "",
        }));
        setShowAddDue(true);
      });
      window.history.replaceState({}, document.title); // stop reopening on back/refresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = () => setRefreshKey((prev) => prev + 1);

  const handleTenantChange = (residentId) => {
    const r = residents.find((x) => x.residentId === residentId);
    setForm((f) => ({
      ...f,
      residentId,
      pgName: r?.pgName || "",
      roomNumber: r?.roomNumber || "",
    }));
  };

  const handleSubmit = async () => {
    const finalDueFor = form.dueFor === "Other" ? form.customReason : form.dueFor;
    if (!form.residentId || !form.dueFor || !form.amount || !form.dueDate) {
      alert("Please fill all required fields.");
      return;
    }
    if (form.dueFor === "Other" && !form.customReason.trim()) {
      alert("Please enter a reason for Other.");
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/owner/rent/manual`, {
        residentId: form.residentId,
        dueFor: finalDueFor,
        description: form.description,
        amount: Number(form.amount),
        dueDate: form.dueDate,
      });
      setShowAddDue(false);
      setForm({ residentId: "", pgName: "", roomNumber: "", dueFor: "", customReason: "", description: "", amount: "", dueDate: "" });
      reload();
      toast.success("Penalty added successfully.");
    } catch (err) {
      toast.error("Failed to add penalty. No changes were saved.", { duration: 4000 });
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: "OVERDUE", label: "Overdue" },
    { key: "PAID", label: "Paid" },
    { key: "DUE_TODAY", label: "Due Today" },
    { key: "THIS_MONTH", label: "This Month" },
    { key: "ALL", label: "All" },
  ]

  return (
    <DashboardLayout
      title="Dues"
      subtitle="Track, Manage & Collect Payments"
      rightAction={
        <button className="add-due-btn" onClick={() => setShowAddDue(true)}>
          + Add Due
        </button>
      }
    >
      {/* DUES STAT CARDS */}
      <div className="rent-stats-grid">
        <div className="rent-stat-card rent-stat--total">
          <div className="rent-stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="rent-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="rent-stat-info">
            <span className="rent-stat-value">₹{duesStats.totalDues}</span>
            <span className="rent-stat-label">Total Dues</span>
            <span className="rent-stat-sub">All pending</span>
          </div>
        </div>

        <div className="rent-stat-card rent-stat--pending">
          <div className="rent-stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="rent-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className="rent-stat-info">
            <span className="rent-stat-value">₹{duesStats.overdueAmount}</span>
            <span className="rent-stat-label">Overdue Amount</span>
            <span className="rent-stat-sub">7+ days</span>
          </div>
        </div>

        <div className="rent-stat-card rent-stat--total">
          <div className="rent-stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="rent-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="rent-stat-info">
            <span className="rent-stat-value">{duesStats.tenantsWithDue}</span>
            <span className="rent-stat-label">Tenants with Due</span>
            <span className="rent-stat-sub">Out of total</span>
          </div>
        </div>

        <div className="rent-stat-card rent-stat--paid">
          <div className="rent-stat-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="rent-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l3 3 5-5" />
            </svg>
          </div>
          <div className="rent-stat-info">
            <span className="rent-stat-value">₹{duesStats.collectionThisMonth}</span>
            <span className="rent-stat-label">Collection This Month</span>
            <span className="rent-stat-sub">Total collected</span>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="dues-filter-tabs mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`status-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <MonthlyRentTable
        status={activeTab}
        refreshKey={refreshKey}
        onReload={reload}
      />

      {/* ADD DUE PANEL OVERLAY */}
      {showAddDue && (
        <>
          <div className="add-due-overlay" onClick={() => setShowAddDue(false)} />
          <div className="add-due-panel">
            <div className="adp-header">
              <div>
                <div className="adp-title">Add Dues</div>
                <div className="adp-sub">Add a new due entry for tenant</div>
              </div>
              <button className="adp-close" onClick={() => setShowAddDue(false)}>✕</button>
            </div>

            <div className="adp-body">

              {/* Tenant */}
              <div className="adp-field">
                <label className="adp-label">Tenant <span className="adp-req">*</span></label>
                <select
                  className="adp-select"
                  value={form.residentId}
                  onChange={(e) => handleTenantChange(e.target.value)}
                >
                  <option value="">Select Tenant</option>
                  {residents.map((r) => (
                    <option key={r.residentId} value={r.residentId}>
                      {r.name} — Room {r.roomNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* PG + Room autofill */}
              <div className="adp-row">
                <div className="adp-field">
                  <label className="adp-label">PG</label>
                  <input className="adp-input adp-readonly" value={form.pgName} readOnly placeholder="Auto filled" />
                </div>
                <div className="adp-field">
                  <label className="adp-label">Room</label>
                  <input className="adp-input adp-readonly" value={form.roomNumber} readOnly placeholder="Auto filled" />
                </div>
              </div>

              {/* Due Date + Due For */}
              <div className="adp-row">
                <div className="adp-field">
                  <label className="adp-label">Due Date <span className="adp-req">*</span></label>
                  <input
                    type="date"
                    className="adp-input"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div className="adp-field">
                  <label className="adp-label">Due For <span className="adp-req">*</span></label>
                  <select
                    className="adp-select"
                    value={form.dueFor}
                    onChange={(e) => setForm((f) => ({ ...f, dueFor: e.target.value, customReason: "" }))}
                  >
                    <option value="">Select Due For</option>
                    {DUE_FOR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DUE DETAILS SECTION */}
              <div className="adp-section-title">Due Details</div>

              {/* Selected Due Type Box */}
              {form.dueFor && form.dueFor !== "Other" && (
                <div className="adp-due-type-box">
                  <span className="adp-due-type-icon">
                    {DUE_FOR_ICONS[form.dueFor]}
                  </span>
                  <div className="adp-due-type-info">
                    <span className="adp-due-type-name">{form.dueFor}</span>
                    <span className="adp-due-type-sub">Selected due category</span>
                  </div>
                  <button
                    className="adp-due-type-clear"
                    onClick={() => setForm((f) => ({ ...f, dueFor: "" }))}
                  >✕</button>
                </div>
              )}

              {/* Other — custom reason input */}
              {form.dueFor === "Other" && (
                <div className="adp-field">
                  <label className="adp-label">Reason <span className="adp-req">*</span></label>
                  <input
                    type="text"
                    className="adp-input"
                    placeholder="Enter reason e.g. Damage repair"
                    value={form.customReason}
                    onChange={(e) => setForm((f) => ({ ...f, customReason: e.target.value }))}
                  />
                </div>
              )}

              {/* Amount */}
              <div className="adp-field">
                <label className="adp-label">Amount (₹) <span className="adp-req">*</span></label>
                <input
                  type="number"
                  className="adp-input"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="adp-field">
                <label className="adp-label">Description (optional)</label>
                <input
                  type="text"
                  className="adp-input"
                  placeholder="e.g. Electricity Jun 2026"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

            </div>

            {/* Footer — equal size buttons */}
            <div className="adp-footer">
              <button className="adp-cancel" onClick={() => setShowAddDue(false)}>Cancel</button>
              <button className="adp-save" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : "Save Due"}
              </button>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default MonthlyRentOverview;