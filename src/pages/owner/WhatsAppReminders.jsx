import {FaGift} from "react-icons/fa";
import {useState, useEffect, useCallback} from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./WhatsAppReminders.css";

const SENT_IDS_STORAGE_KEY = "pgmate_wa_reminders_sent_ids";

// ── Load/save sentIds from localStorage ──
const loadSentIds = () => {
  try {
    const raw = localStorage.getItem(SENT_IDS_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch (err) {
    console.error("Failed to load sent reminder ids:", err);
    return new Set();
  }
};

const saveSentIds = (set) => {
  try {
    localStorage.setItem(SENT_IDS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error("Failed to save sent reminder ids:", err);
  }
};

const buildMessage = (record) => {
  const dueDateFormatted = record.dueDate
    ? new Date(record.dueDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "soon";

  return `Hello ${record.residentName}, your rent for ${record.pgName} amounting to ₹${record.rentAmount?.toLocaleString("en-IN")} is pending. Please make the payment before ${dueDateFormatted} to avoid any inconvenience. Thank you - PGMate`;
};

const buildWhatsAppLink = (phone, message) => {
  let cleanPhone = (phone || "").replace(/\D/g, "");
  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone;
  }
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
};

// Collapse multiple pending records for the same tenant down to ONE row —
// the oldest unpaid month (earliest dueDate). This also naturally removes
// exact duplicate records since only the first one encountered is kept.
const getOldestPendingPerResident = (records) => {
  const oldestByResident = new Map();

  for (const record of records) {
    if (!record.dueDate) continue;

    const existing = oldestByResident.get(record.residentId);
    if (!existing || new Date(record.dueDate) < new Date(existing.dueDate)) {
      oldestByResident.set(record.residentId, record);
    }
  }

  return Array.from(oldestByResident.values());
};

const WhatsAppReminders = () => {
  const [pendingRecords, setPendingRecords] = useState([]);
  const [residentsMap, setResidentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sentIds, setSentIds] = useState(loadSentIds);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rentRes, residentsRes] = await Promise.all([
        api.get("/owner/rent", {params: {status: "PENDING"}}),
        api.get("/owner/residents"),
      ]);

      const oldestPending = getOldestPendingPerResident(rentRes.data || []);
      setPendingRecords(oldestPending);

      const map = {};
      (residentsRes.data || []).forEach((r) => {
        map[r.residentId] = r;
      });
      setResidentsMap(map);

      // ── Prune sentIds: drop any recordId no longer in the pending list
      // (e.g. rent got paid, or record changed after a new due cycle) ──
      setSentIds((prev) => {
        const stillValidIds = new Set(oldestPending.map((r) => r.recordId));
        const pruned = new Set([...prev].filter((id) => stillValidIds.has(id)));
        if (pruned.size !== prev.size) saveSentIds(pruned);
        return pruned;
      });
    } catch (err) {
      console.error("Failed to load pending rent records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendReminder = (record) => {
    const resident = residentsMap[record.residentId];
    const phone = resident?.phone;

    if (!phone) {
      alert(`No phone number found for ${record.residentName}`);
      return;
    }

    const message = buildMessage(record);
    const link = buildWhatsAppLink(phone, message);

    window.open(link, "_blank");

    setSentIds((prev) => {
      const updated = new Set(prev).add(record.recordId);
      saveSentIds(updated);
      return updated;
    });
  };

  const filtered = pendingRecords.filter(
    (r) =>
      r.residentName?.toLowerCase().includes(search.toLowerCase()) ||
      r.pgName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout
      title="WhatsApp Rent Reminders"
      subtitle="Send a quick WhatsApp nudge to tenants with pending rent"
    >
      {/* STAT */}
      <div className="war-stats-row">
        <div className="war-stat-card">
          <div className="war-stat-icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              stroke="#d97706"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className="war-stat-info">
            <span className="war-stat-value">{pendingRecords.length}</span>
            <span className="war-stat-label">Tenants with Pending Rent</span>
          </div>
        </div>
        <div className="war-stat-card">
          <div className="war-stat-icon-wrap" style={{background: "#dcfce7"}}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              stroke="#16a34a"
            >
              <path d="M21.5 12a9.5 9.5 0 1 1-3-7" />
              <path d="M3.5 3v6h6" />
            </svg>
          </div>
          <div className="war-stat-info">
            <span className="war-stat-value">{sentIds.size}</span>
            <span className="war-stat-label">
              Reminders Opened This Session
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="war-search-row">
        <div className="war-search-wrap">
          <svg
            className="war-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="war-search-input"
            placeholder="Search tenant or PG..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="war-loading">Loading pending tenants...</div>
      ) : filtered.length === 0 ? (
        <div className="war-empty">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.5"
            stroke="#94a3b8"
          >
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <p>
            No pending rent. Everyone is paid up! <FaGift />
          </p>
        </div>
      ) : (
        <div className="war-list">
          {filtered.map((record) => {
            const resident = residentsMap[record.residentId];
            const alreadySent = sentIds.has(record.recordId);
            const dueDateFormatted = record.dueDate
              ? new Date(record.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            return (
              <div className="war-card" key={record.recordId}>
                <div className="war-card-left">
                  <div className="war-avatar">
                    {record.residentName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="war-card-info">
                    <span className="war-card-name">{record.residentName}</span>
                    <span className="war-card-meta">
                      {record.pgName} · Room {record.roomNumber} · Bed{" "}
                      {record.bedNumber}
                    </span>
                    <span className="war-card-phone">
                      {resident?.phone || "No phone on record"}
                    </span>
                  </div>
                </div>

                <div className="war-card-middle">
                  <div className="war-rent-chip">
                    <span className="war-rent-label">Rent Due</span>
                    <span className="war-rent-amount">
                      ₹{record.rentAmount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="war-due-chip">
                    <span className="war-due-label">Due Date</span>
                    <span className="war-due-date">{dueDateFormatted}</span>
                  </div>
                </div>

                <div className="war-card-right">
                  <button
                    className={`war-send-btn ${alreadySent ? "war-send-btn--sent" : ""}`}
                    onClick={() => handleSendReminder(record)}
                    disabled={!resident?.phone}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.6 6.32A8.9 8.9 0 0 0 12.02 3.5c-4.92 0-8.93 4.01-8.93 8.93 0 1.58.42 3.12 1.21 4.46L3.5 21.5l4.71-1.23a8.9 8.9 0 0 0 4.26 1.08h.01c4.92 0 8.93-4.01 8.93-8.93a8.9 8.9 0 0 0-2.81-6.1zm-5.58 13.74h-.01a7.4 7.4 0 0 1-3.77-1.03l-.27-.16-2.8.73.75-2.73-.18-.28a7.4 7.4 0 0 1-1.13-3.94c0-4.09 3.33-7.42 7.42-7.42a7.37 7.37 0 0 1 5.25 2.18 7.37 7.37 0 0 1 2.17 5.25c0 4.09-3.33 7.4-7.43 7.4zm4.07-5.56c-.22-.11-1.32-.65-1.53-.73-.21-.07-.36-.11-.51.11-.15.22-.58.73-.71.88-.13.15-.26.16-.48.05-1.3-.65-2.16-1.16-3.02-2.63-.23-.39.23-.36.65-1.21.07-.15.04-.28-.03-.39-.07-.11-.49-1.18-.67-1.61-.18-.43-.36-.37-.51-.38-.13-.01-.28-.01-.43-.01-.15 0-.39.06-.6.28-.21.22-.79.78-.79 1.89s.81 2.19 .92 2.34c.11.15 1.55 2.37 3.76 3.23 1.86.73 2.24.59 2.65.55.41-.04 1.32-.54 1.51-1.06.19-.52.19-.96.13-1.06-.06-.1-.21-.16-.44-.27z" />
                    </svg>
                    {alreadySent ? "Send Again" : "Send Reminder"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default WhatsAppReminders;
