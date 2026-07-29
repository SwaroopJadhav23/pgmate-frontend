import {useEffect, useState} from "react";
import Swal from "sweetalert2";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";
import "./RentReminderSettings.css";

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 7];

const RentReminderSettings = () => {
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedResident, setSelectedResident] = useState(null);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  const [daysBefore, setDaysBefore] = useState(3);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  // ── Load active residents ──────────────────────────────
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        setLoadingResidents(true);
        const res = await api.get("/owner/residents");
        const list = res.data || [];
        setResidents(list);
        if (list.length > 0) setSelectedResident(list[0]);
      } catch (err) {
        console.error("Failed to load residents:", err);
      } finally {
        setLoadingResidents(false);
      }
    };
    fetchResidents();
  }, []);

  // ── Load reminder settings when resident changes ───────
  useEffect(() => {
    if (!selectedResident?.residentId) return;
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        const res = await api.get(
          `/reminder-settings/resident/${selectedResident.residentId}`,
        );
        setDaysBefore(res.data.daysBefore ?? 3);
        setReminderEnabled(res.data.reminderEnabled ?? true);
      } catch {
        setDaysBefore(3);
        setReminderEnabled(true);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [selectedResident?.residentId]);

  // ── Save ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedResident) return;
    try {
      setSaving(true);
      await api.post("/reminder-settings/save", {
        residentId: selectedResident.residentId,
        pgId: selectedResident.pgId,
        ownerId: selectedResident.ownerId,
        daysBefore,
        reminderEnabled,
      });
      Swal.fire({
        icon: "success",
        title: "Settings Saved",
        text: reminderEnabled
          ? `SMS will be sent ${daysBefore} day${daysBefore > 1 ? "s" : ""} before due date for ${selectedResident.name}.`
          : `Reminders disabled for ${selectedResident.name}.`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Failed to save",
        text: "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered list ──────────────────────────────────────
  const filtered = residents.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search) ||
      r.pgName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout
      title="SMS Reminder Settings"
      subtitle="Control rent reminder notifications per tenant"
    >
      <div className="rrs-layout">
        {/* ── LEFT: Tenant list ── */}
        <div className="rrs-sidebar">
          <div className="rrs-sidebar-header">
            <span className="rrs-sidebar-title">Tenants</span>
            <span className="rrs-sidebar-count">{residents.length}</span>
          </div>

          <div className="rrs-search-wrap">
            <svg
              className="rrs-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="rrs-search"
              type="text"
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loadingResidents ? (
            <div className="rrs-list-loading">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rrs-skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rrs-empty-list">No tenants found</div>
          ) : (
            <div className="rrs-list">
              {filtered.map((r) => {
                const isActive = selectedResident?.residentId === r.residentId;
                return (
                  <button
                    key={r.residentId}
                    className={`rrs-tenant-item ${isActive ? "rrs-tenant-item--active" : ""}`}
                    onClick={() => setSelectedResident(r)}
                  >
                    <div className="rrs-tenant-avatar">
                      {r.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="rrs-tenant-info">
                      <span className="rrs-tenant-name">{r.name}</span>
                      <span className="rrs-tenant-meta">{r.pgName || "—"}</span>
                    </div>
                    {isActive && (
                      <svg
                        className="rrs-check-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Settings panel ── */}
        <div className="rrs-panel">
          {!selectedResident ? (
            <div className="rrs-no-selection">
              <div className="rrs-no-selection-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <p>Select a tenant to configure their SMS reminder</p>
            </div>
          ) : loadingSettings ? (
            <div className="rrs-panel-loading">
              <div className="rrs-spinner" />
              <span>Loading settings...</span>
            </div>
          ) : (
            <>
              {/* Tenant header */}
              <div className="rrs-panel-header">
                <div className="rrs-panel-avatar">
                  {selectedResident.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="rrs-panel-name">{selectedResident.name}</h3>
                  <p className="rrs-panel-sub">
                    {selectedResident.pgName} · Room{" "}
                    {selectedResident.roomNumber} · Bed{" "}
                    {selectedResident.bedNumber}
                  </p>
                </div>
              </div>

              {/* Phone banner */}
              <div className="rrs-phone-banner">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 5.83 5.83l.98-.98a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16z" />
                </svg>
                <div>
                  <span className="rrs-phone-label">SMS will be sent to</span>
                  <span className="rrs-phone-value">
                    {selectedResident.phone || "No phone number on record"}
                  </span>
                </div>
              </div>

              {/* Rent info */}
              <div className="rrs-rent-info">
                <div className="rrs-rent-chip">
                  <span className="rrs-rent-chip-label">Monthly Rent</span>
                  <span className="rrs-rent-chip-val">
                    ₹
                    {selectedResident.monthlyRent?.toLocaleString("en-IN") ||
                      "—"}
                  </span>
                </div>
                <div className="rrs-rent-chip">
                  <span className="rrs-rent-chip-label">Due Day</span>
                  <span className="rrs-rent-chip-val">
                    {selectedResident.expectedCheckoutDate
                      ? `${new Date(selectedResident.expectedCheckoutDate).getDate()}th every month`
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Toggle */}
              <div className="rrs-field-card">
                <div className="rrs-toggle-row">
                  <div>
                    <p className="rrs-field-title">SMS Reminder</p>
                    <p className="rrs-field-desc">
                      Send an automatic SMS before rent is due
                    </p>
                  </div>
                  <label className="rrs-toggle">
                    <input
                      type="checkbox"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                    />
                    <span className="rrs-toggle-track" />
                  </label>
                </div>
                <div
                  className={`rrs-status-chip ${reminderEnabled ? "rrs-chip--on" : "rrs-chip--off"}`}
                >
                  <span className="rrs-chip-dot" />
                  {reminderEnabled ? "Reminders are ON" : "Reminders are OFF"}
                </div>
              </div>

              {/* Days selector */}
              <div
                className={`rrs-field-card ${!reminderEnabled ? "rrs-field-card--disabled" : ""}`}
              >
                <p className="rrs-field-title">Days Before Due Date</p>
                <p className="rrs-field-desc">
                  How many days in advance should the SMS be sent?
                </p>
                <div className="rrs-days-grid">
                  {DAYS_OPTIONS.map((d) => (
                    <button
                      key={d}
                      className={`rrs-day-btn ${daysBefore === d ? "rrs-day-btn--active" : ""}`}
                      onClick={() => reminderEnabled && setDaysBefore(d)}
                      disabled={!reminderEnabled}
                    >
                      <span className="rrs-day-num">{d}</span>
                      <span className="rrs-day-lbl">
                        {d === 1 ? "day" : "days"}
                      </span>
                    </button>
                  ))}
                </div>
                {reminderEnabled && (
                  <div className="rrs-preview">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    SMS fires{" "}
                    <strong>
                      {daysBefore} day{daysBefore > 1 ? "s" : ""} before
                    </strong>{" "}
                    the due date each month
                  </div>
                )}
              </div>

              {/* Save button */}
              <button
                className="rrs-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="rrs-btn-spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <path d="M17 21v-8H7v8M7 3v5h8" />
                    </svg>
                    Save Settings
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RentReminderSettings;
