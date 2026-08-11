import { useEffect, useState, useCallback } from "react";
import api from "../../../api/axios";
import { TableSkeleton } from "../../public/Skeleton";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import "./MonthlyRentTable.css";
import React from "react";

// ── Manual due type → icon (SVG, stroke-based) ──
const DUE_TYPE_ICONS = {
  Rent: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  "Electricity Bill": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Mess: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  Maintenance: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  "Late Fine": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  "Water Bill": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  Other: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

// ── WhatsApp message builder for Dues (rent + overdue fine warning) ──
const buildDueMessage = (record, daysOverdue) => {
  const dueDateFormatted = record.dueDate
    ? new Date(record.dueDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "the due date";

  const name = getResidentName(record);
  const pg = getPgName(record);
  const rent = getRentAmount(record);
  const penalty = record.penaltyAmount > 0 ? record.penaltyAmount : 0;
  const total = rent + penalty;

  if (daysOverdue > 0) {
    const penaltyLine = penalty > 0
      ? ` A penalty of ₹${penalty.toLocaleString("en-IN")} has been added for late payment, making your total payable amount ₹${total.toLocaleString("en-IN")}.`
      : ` As per PG policy, a late fine will be applicable on overdue rent.`;

    return `Hello ${name}, your rent of ₹${rent.toLocaleString("en-IN")} for ${pg} was due on ${dueDateFormatted} and is now overdue by ${daysOverdue} day${daysOverdue > 1 ? "s" : ""}.${penaltyLine} Please clear your dues at the earliest to avoid further penalty. \nThank you - PGMate`;
  }

  return `Hello ${name}, your rent of ₹${rent.toLocaleString("en-IN")} for ${pg} is due on ${dueDateFormatted}. Please make the payment on time to avoid a late fine as per PG policy. Thank you - PGMate`;
};

// ── Message builder for a manual due (electricity, mess, maintenance, etc.) ──
const buildManualDueMessage = (residentName, due, daysOverdue) => {
  const dueDateFormatted = due.dueDate
    ? new Date(due.dueDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "the due date";
  const amt = due.rentAmount ?? due.totalAmount ?? due.amount;

  if (daysOverdue > 0) {
    return `Hello ${residentName}, your ${due.dueFor} due of ₹${amt} was due on ${dueDateFormatted} and is overdue by ${daysOverdue} day${daysOverdue > 1 ? "s" : ""}. Please clear it soon as a late fine may apply as per PG policy. Thank you - PGMate`;
  }
  return `Hello ${residentName}, your ${due.dueFor} due of ₹${amt} is due on ${dueDateFormatted}. Please pay on time to avoid a late fine. Thank you - PGMate`;
};

const buildWhatsAppLink = (phone, message) => {
  let cleanPhone = (phone || "").replace(/\D/g, "");
  if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
};

const getDueIcon = (dueFor) =>
  DUE_TYPE_ICONS[dueFor] || DUE_TYPE_ICONS["Other"];

// ── Shared WhatsApp icon (used in desktop reminder btn + manual due reminder btn) ──
const WhatsAppIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.856L0 24l6.336-1.508A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.022-1.369l-.36-.214-3.733.888.936-3.623-.235-.374A9.861 9.861 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118c5.466 0 9.882 4.415 9.882 9.882 0 5.466-4.416 9.882-9.882 9.882z" />
  </svg>
);

// ── Safe field getters ──────────────────────────────────────────
const getResidentName = (r) =>
  r.residentName ?? r.resident_name ?? r.name ?? r.tenantName ?? "-";

const getRoomNumber = (r) =>
  r.roomNumber ?? r.room_number ?? r.room ?? r.roomNo ?? "-";

const getRentAmount = (r) =>
  r.rentAmount ?? r.rent_amount ?? r.rent ?? r.amount ?? 0;

const getPgName = (r) => r.pgName ?? r.pg_name ?? r.pg ?? "-";

const MonthlyRentTable = ({ status, refreshKey, onReload }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ── Manual dues expand state ──
  const [expandedResidentId, setExpandedResidentId] = useState(null);
  const [manualDuesMap, setManualDuesMap] = useState({}); // { residentId: [dues] }
  const [manualDuesLoading, setManualDuesLoading] = useState(null); // residentId currently loading

  // ── Mobile 3-dot action menu (open recordId or null) ──
  const [openActionId, setOpenActionId] = useState(null);

  const [residentsMap, setResidentsMap] = useState({});

  const isPaidView = status === "PAID";

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d)) return date;
    return d.toLocaleDateString("en-GB");
  };

  // Returns days difference from today to dueDate (negative = overdue)
  const getDaysDiff = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.round((due - today) / (1000 * 60 * 60 * 24));
  };

  const sendDueReminder = (record) => {
    const resident = residentsMap[record.residentId];
    const phone = resident?.phone;
    if (!phone) {
      toast(`No phone number found for ${getResidentName(record)}.`, { icon: "⚠️" });
      return;
    }
    const diff = getDaysDiff(record.dueDate);
    const daysOverdue = diff !== null && diff < 0 ? Math.abs(diff) : 0;
    const message = buildDueMessage(record, daysOverdue);
    window.open(buildWhatsAppLink(phone, message), "_blank");
  };

  const sendManualDueReminder = (r, due) => {
    const resident = residentsMap[r.residentId];
    const phone = resident?.phone;
    if (!phone) {
      toast(`No phone number found for ${getResidentName(r)}.`, { icon: "⚠️" });
      return;
    }
    const diff = getDaysDiff(due.dueDate);
    const daysOverdue = diff !== null && diff < 0 ? Math.abs(diff) : 0;
    const message = buildManualDueMessage(getResidentName(r), due, daysOverdue);
    window.open(buildWhatsAppLink(phone, message), "_blank");
  };

  // "Overdue (12 days)" or "Due Today" or null for paid
  const getDueLabel = (record) => {
    if (record.status === "PAID") return null;
    const diff = getDaysDiff(record.dueDate);
    if (diff === null) return null;
    if (diff < 0)
      return { text: `Overdue (${Math.abs(diff)} days)`, type: "overdue" };
    if (diff === 0) return { text: "Due Today", type: "today" };
    return null;
  };

  // Row-level (not tab-level) check: Mark Paid only valid when THIS record
  // is unpaid AND actually overdue (dueDate < today). Pending/Due-Today rows
  // don't get it, and PAID rows never get it, regardless of active tab.
  const isRowOverdue = (record) => {
    if (record.status === "PAID") return false;
    const diff = getDaysDiff(record.dueDate);
    return diff !== null && diff < 0;
  };

  // Smart status label: show Due Today / Overdue instead of PENDING
  const getStatusLabel = (record) => {
    if (record.status === "PAID") return { label: "Paid", cls: "paid" };
    const diff = getDaysDiff(record.dueDate);
    if (diff === null) return { label: "Pending", cls: "pending" };
    if (diff < 0) return { label: "Overdue", cls: "overdue" };
    if (diff === 0) return { label: "Due Today", cls: "due-today" };
    return { label: "Pending", cls: "pending" };
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/owner/rent`, { params: { status } });
      setData(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    api
      .get("/owner/residents")
      .then((res) => {
        const map = {};
        (res.data || []).forEach((r) => {
          map[r.residentId] = r;
        });
        setResidentsMap(map);
      })
      .catch((err) =>
        console.error("Failed to load residents for reminders:", err),
      );
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  // Collapse any open manual-dues panel + clear cache whenever table reloads
  useEffect(() => {
    setExpandedResidentId(null);
    setManualDuesMap({});
  }, [status, refreshKey]);

  const filteredData = data.filter((r) => {
    const searchLower = search.toLowerCase();
    return (
      getResidentName(r)?.toLowerCase().includes(searchLower) ||
      getPgName(r)?.toLowerCase().includes(searchLower)
    );
  });

  // Record currently open in the slide-over detail panel (desktop + mobile)
  const expandedRecord =
    filteredData.find((x) => x.residentId === expandedResidentId) || null;

  const markPaid = async (record) => {
    const hasOlderPending = data.some(
      (x) =>
        x.residentId === record.residentId &&
        x.status === "PENDING" &&
        new Date(x.dueDate) < new Date(record.dueDate),
    );
    if (hasOlderPending) {
      toast("Please clear previous month's rent first.", { icon: "⚠️" });
      return;
    }
    const totalAmt = record.totalAmount ?? getRentAmount(record);
    const result = await Swal.fire({
      title: "Mark as Paid?",
      text: `Are you sure you want to mark ₹${totalAmt} as paid?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
    });
    if (!result.isConfirmed) return;
    try {
      await api.post(`/owner/rent/${record.recordId}/pay`, null, {
        params: { paymentMode: "CASH" },
      });
      toast.success("Marked as Paid.");
      onReload();
    } catch (err) {
      const errorMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : "Previous month pending.");
      toast.error(errorMsg);
    }
  };

  const addPenalty = async (record) => {
    const { value: formValues } = await Swal.fire({
      title: "Add Penalty",
      html:
        `<input id="swal-penalty-amount" type="number" class="swal2-input" placeholder="Penalty Amount (₹)">` +
        `<input id="swal-penalty-reason" type="text" class="swal2-input" placeholder="Reason (optional)">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Add",
      customClass: { popup: "mrt-penalty-popup" },
      preConfirm: () => {
        const amount = document.getElementById("swal-penalty-amount").value;
        const reason = document.getElementById("swal-penalty-reason").value;
        if (!amount || Number(amount) <= 0) {
          Swal.showValidationMessage("Enter a valid penalty amount");
          return false;
        }
        return { amount: Number(amount), reason };
      },
    });

    if (!formValues) return;

    try {
      await api.post(`/owner/rent/${record.recordId}/penalty`, null, {
        params: { amount: formValues.amount, reason: formValues.reason },
      });
      toast.success("Penalty Added.");
      onReload();
    } catch (err) {
      const errorMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : "Could not add penalty.");
      toast.error(errorMsg);
    }
  };

  // ── Manual dues: fetch + toggle ──
  // Backend endpoint GET /owner/rent/manual/resident/:residentId
  // returns array of { dueId, dueFor, description, rentAmount, dueDate, status }
  const fetchManualDues = useCallback(
    async (residentId) => {
      if (manualDuesMap[residentId]) return; // already cached
      try {
        setManualDuesLoading(residentId);
        const res = await api.get(`/owner/rent/manual/resident/${residentId}`);
        setManualDuesMap((prev) => ({ ...prev, [residentId]: res.data || [] }));
      } catch (err) {
        console.error("Failed to load manual dues:", err);
        setManualDuesMap((prev) => ({ ...prev, [residentId]: [] }));
      } finally {
        setManualDuesLoading(null);
      }
    },
    [manualDuesMap],
  );

  // STRICT check: arrow/triangle only shows when owner actually added
  // manual dues for this tenant (manualDuesCount > 0). No "always try" fallback.
  const hasManualDues = (r) => Number(r.manualDuesCount) > 0;

  const toggleManualDues = (r) => {
    if (!hasManualDues(r)) return;

    if (expandedResidentId === r.residentId) {
      setExpandedResidentId(null);
      return;
    }
    setExpandedResidentId(r.residentId);
    fetchManualDues(r.residentId);
  };

  const markManualDuePaid = async (residentId, due) => {
    const amt = due.rentAmount ?? due.totalAmount ?? due.amount;
    const result = await Swal.fire({
      title: "Mark as Paid?",
      text: `Mark ₹${amt} (${due.dueFor}) as paid?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
    });
    if (!result.isConfirmed) return;
    try {
      await api.post(`/owner/rent/manual/${due.recordId}/pay`, null, {
        params: { paymentMode: "CASH" },
      });
      toast.success("Marked as Paid.");
      // refresh just this resident's manual dues
      setManualDuesMap((prev) => {
        const copy = { ...prev };
        delete copy[residentId];
        return copy;
      });
      fetchManualDues(residentId);
      onReload();
    } catch (err) {
      toast.error(err.response?.data?.message || (typeof err.response?.data === "string" ? err.response?.data : "Failed to mark as paid."));
    }
  };

  const getManualDueStatusInfo = (due) => {
    if (due.status === "PAID") return { label: "Paid", cls: "paid" };
    const diff = getDaysDiff(due.dueDate);
    if (diff !== null && diff < 0) return { label: "Overdue", cls: "overdue" };
    return { label: "Pending", cls: "pending" };
  };

  // Cols: Name, PG, Room, Rent, Penalty, Due Date, [Paid Date if paid], Status, [Action if not paid]
  const getCols = () => (isPaidView ? 7 : 9);
  const getRows = () => 5;

  // ── Shared render for one manual due row (used in the slide-over panel) ──
  const renderManualDueItem = (r, due) => {
    const dStatus = getManualDueStatusInfo(due);
    const amt = due.rentAmount ?? due.totalAmount ?? due.amount;
    return (
      <div className="mrt-manual-due-item" key={due.dueId}>
        <div className="mrt-manual-due-icon">{getDueIcon(due.dueFor)}</div>
        <div className="mrt-manual-due-info">
          <div className="mrt-manual-due-title">{due.dueFor}</div>
          {due.description && (
            <div className="mrt-manual-due-desc">{due.description}</div>
          )}
          <div className="mrt-manual-due-date">
            Due {formatDate(due.dueDate)}
          </div>
        </div>
        <div className="mrt-manual-due-amount">₹{amt}</div>
        <span className={`status-pill ${dStatus.cls}`}>{dStatus.label}</span>
        {due.status !== "PAID" && (
          <button
            className="mrt-manual-due-pay-btn"
            onClick={() => markManualDuePaid(r.residentId, due)}
          >
            Mark paid
          </button>
        )}
        {due.status !== "PAID" && (
          <button
            className="wa-reminder-btn mrt-manual-due-reminder-btn"
            onClick={() => sendManualDueReminder(r, due)}
          >
            <WhatsAppIcon size={14} />
            Send Reminder
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="mrt-table-scope">
      {/* SEARCH BAR */}
      <div className="residents-search-bar mb-3">
        <span className="search-icon">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          className="residents-search-input"
          placeholder="Search by name or PG..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear-btn" onClick={() => setSearch("")}>
            ✕
          </button>
        )}
      </div>

      <div className="mrt-table-wrap">
        <table className="modern-table mrt-table">
          <thead>
            {/* ── Desktop column headings ── */}
            <tr>
              <th>Name</th>
              <th>PG</th>
              <th>Room</th>
              <th>Rent</th>
              <th>Penalty</th>
              <th>Due Date</th>
              {isPaidView && <th>Paid Date</th>}
              <th>Status</th>
              {!isPaidView && <th>Action</th>}
              {!isPaidView && <th>Reminder</th>}
            </tr>
            {/* ── Mobile: real column headers matching visible columns ── */}
            <tr className="mrt-mobile-head-row">
              <th>Name</th>
              <th>Room</th>
              <th>Rent</th>
              <th>Status</th>
              {!isPaidView && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={getRows()} cols={getCols()} />
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={getCols()} className="mrt-empty">
                  No records found
                </td>
              </tr>
            ) : (
              filteredData.map((r) => {
                const isStandalone = r.isStandaloneManualDue === true;
                const dueLabel = getDueLabel(r);
                const statusInfo = getStatusLabel(r);
                const tenantHasManualDues = !isStandalone && hasManualDues(r);
                const isExpanded = expandedResidentId === r.residentId;
                const residentName = getResidentName(r);
                const roomNumber = getRoomNumber(r);
                const rentAmount = getRentAmount(r);
                const pgName = getPgName(r);

                return (
                  <React.Fragment key={r.recordId}>
                    {/* ── DESKTOP ROW ──
                        Clicking the name triangle (when tenant has manual dues)
                        opens the slide-over detail panel further below — no
                        inline expand row here anymore, desktop and mobile
                        both use the same side panel now. */}
                    <tr className="mrt-desktop-row">
                      <td>
                        <span
                          className={
                            tenantHasManualDues ? "mrt-name-toggle" : ""
                          }
                          onClick={
                            tenantHasManualDues
                              ? () => toggleManualDues(r)
                              : undefined
                          }
                          style={
                            tenantHasManualDues
                              ? { cursor: "pointer", userSelect: "none" }
                              : undefined
                          }
                        >
                          {residentName}
                          {tenantHasManualDues && (
                            <span
                              className={`mrt-expand-arrow ${isExpanded ? "mrt-expand-arrow--open" : ""}`}
                            >
                              ▾
                            </span>
                          )}
                        </span>
                      </td>
                      <td>{pgName}</td>
                      <td>{roomNumber}</td>

                      {/* RENT + due label below */}
                      <td>
                        <div className="mrt-rent-cell">
                          <span className="mrt-rent-amount">₹{rentAmount}</span>
                          {isStandalone && r.status !== "PAID" ? (
                            <span
                              className={`mrt-due-label mrt-due-label--${dueLabel ? dueLabel.type : "manual"}`}
                            >
                              {dueLabel
                                ? `${dueLabel.text} (${r.dueFor})`
                                : `Due (${r.dueFor})`}
                            </span>
                          ) : dueLabel ? (
                            <span
                              className={`mrt-due-label mrt-due-label--${dueLabel.type}`}
                            >
                              {dueLabel.text}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* PENALTY */}
                      <td>
                        {isStandalone ? (
                          <span className="mrt-zero">—</span>
                        ) : r.penaltyAmount > 0 ? (
                          <span className={`penalty-badge ${r.status === "PAID" ? "penalty-badge--paid" : ""}`}>
                            + ₹{r.penaltyAmount}
                          </span>
                        ) : (
                          <span className="mrt-zero">₹0</span>
                        )}
                      </td>

                      <td>{formatDate(r.dueDate)}</td>

                      {isPaidView && (
                        <td>
                          {r.paidDate ? (
                            formatDate(r.paidDate)
                          ) : (
                            <span className="pending-text">Not Paid</span>
                          )}
                        </td>
                      )}

                      {/* SMART STATUS */}
                      <td>
                        <span className={`status-pill ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {!isPaidView && (
                        <td className={`mrt-action-cell ${(r.status === "PAID" || isStandalone) ? "mrt-action-cell--center" : ""}`}>
                          {isStandalone ? (
                            r.status !== "PAID" && (
                              <button
                                className="action-btn confirm"
                                onClick={() => markManualDuePaid(r.residentId, r)}
                              >
                                Mark Paid
                              </button>
                            )
                          ) : (
                            <>
                              {isRowOverdue(r) && (
                                <button
                                  className="action-btn confirm"
                                  onClick={() => markPaid(r)}
                                >
                                  Mark Paid
                                </button>
                              )}
                              <button
                                className={`action-btn penalty ${r.status === "PAID" ? "penalty-disabled" : ""}`}
                                onClick={(e) => {
                                  if (r.status === "PAID") return;
                                  addPenalty(r);
                                }}
                                data-mrt-tooltip={r.status === "PAID" ? "Status is paid so cannot add penalty" : "Add Penalty"}
                              >
                                + Penalty
                              </button>
                            </>
                          )}
                        </td>
                      )}
                      {!isPaidView && (
                        <td>
                          <button
                            className="wa-reminder-btn"
                            onClick={() =>
                              isStandalone
                                ? sendManualDueReminder(r, r)
                                : sendDueReminder(r)
                            }
                          >
                            <WhatsAppIcon size={14} />
                            Send Reminder
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* ── MOBILE TABLE ROW (real columns: Name/Room/Rent/Status/Action) ── */}
                    <tr className="mrt-card-row">
                      <td>
                        <div
                          className="mrt-mrow-name"
                          onClick={
                            tenantHasManualDues
                              ? () => toggleManualDues(r)
                              : undefined
                          }
                          style={
                            tenantHasManualDues
                              ? { cursor: "pointer" }
                              : undefined
                          }
                        >
                          <div className="mrt-mrow-name-top">
                            <span className="mrt-mrow-name-text">{residentName}</span>
                            {tenantHasManualDues && (
                              <span
                                className={`mrt-expand-arrow ${isExpanded ? "mrt-expand-arrow--open" : ""}`}
                              >
                                ▾
                              </span>
                            )}
                          </div>
                          <div className="mrt-mrow-sub">{pgName}</div>
                        </div>
                      </td>

                      <td>{roomNumber}</td>

                      <td>
                        <div className="mrt-rent-cell">
                          <span className="mrt-rent-amount">₹{rentAmount}</span>
                          {dueLabel && (
                            <span
                              className={`mrt-due-label mrt-due-label--${dueLabel.type}`}
                            >
                              {dueLabel.type === "overdue"
                                ? `${Math.abs(getDaysDiff(r.dueDate))} days`
                                : dueLabel.text}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className={`status-pill ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {!isPaidView && (
                        <td className="mrt-mrow-action-cell">
                          <button
                            className="mrt-dots-btn"
                            onClick={() =>
                              setOpenActionId(
                                openActionId === r.recordId ? null : r.recordId,
                              )
                            }
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <circle cx="12" cy="5" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="19" r="2" />
                            </svg>
                          </button>

                          {openActionId === r.recordId && (
                            <div className="mrt-action-menu">
                              {isRowOverdue(r) && (
                                <button
                                  className="mrt-action-menu-item"
                                  title="Mark Paid"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    markPaid(r);
                                  }}
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </button>
                              )}
                              <button
                                className={`mrt-action-menu-item ${r.status === "PAID" ? "penalty-disabled" : ""}`}
                                data-mrt-tooltip={r.status === "PAID" ? "Status is paid so cannot add penalty" : "Add Penalty"}
                                onClick={(e) => {
                                  if (r.status === "PAID") return;
                                  setOpenActionId(null);
                                  addPenalty(r);
                                }}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="16" />
                                  <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                              </button>
                              <button
                                className="mrt-action-menu-item"
                                title="Send Reminder"
                                onClick={() => {
                                  setOpenActionId(null);
                                  sendDueReminder(r);
                                }}
                              >
                                <WhatsAppIcon size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── SLIDE-OVER DETAIL PANEL (desktop + mobile) ──
          Opens from the name triangle for both screen sizes now.
          Contains rent-row info + actions, plus the tenant's
          full manual dues list with their own Mark Paid / Reminder. */}
      {expandedRecord && hasManualDues(expandedRecord) && (
        <div
          className="mrt-mobile-detail-overlay"
          onClick={() => setExpandedResidentId(null)}
        >
          <div
            className="mrt-mobile-detail-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mrt-mdp-header">
              <div>
                <div className="mrt-mdp-title">
                  {getResidentName(expandedRecord)}
                </div>
                <div className="mrt-mdp-sub">
                  {getPgName(expandedRecord)} · Room{" "}
                  {getRoomNumber(expandedRecord)}
                </div>
              </div>
              <button
                className="mrt-mdp-close"
                onClick={() => setExpandedResidentId(null)}
              >
                ✕
              </button>
            </div>

            <div className="mrt-mdp-body">
              <div className="mrt-mdp-info-grid">
                <div className="mrt-mdp-info-item">
                  <span>Rent</span>
                  <b>₹{getRentAmount(expandedRecord)}</b>
                </div>
                <div className="mrt-mdp-info-item">
                  <span>Penalty</span>
                  {expandedRecord.penaltyAmount > 0 ? (
                    <span className={`penalty-badge ${expandedRecord.status === "PAID" ? "penalty-badge--paid" : ""}`}>
                      + ₹{expandedRecord.penaltyAmount}
                    </span>
                  ) : (
                    <b>₹0</b>
                  )}
                </div>
                <div className="mrt-mdp-info-item">
                  <span>Due Date</span>
                  <b>{formatDate(expandedRecord.dueDate)}</b>
                </div>
                {isPaidView && (
                  <div className="mrt-mdp-info-item">
                    <span>Paid Date</span>
                    <b>
                      {expandedRecord.paidDate
                        ? formatDate(expandedRecord.paidDate)
                        : "Not Paid"}
                    </b>
                  </div>
                )}
                <div className="mrt-mdp-info-item">
                  <span>Status</span>
                  <span
                    className={`status-pill ${getStatusLabel(expandedRecord).cls}`}
                  >
                    {getStatusLabel(expandedRecord).label}
                  </span>
                </div>
              </div>

              {!isPaidView && (
                <div className="mrt-mdp-actions">
                  {isRowOverdue(expandedRecord) && (
                    <button
                      className="action-btn confirm"
                      onClick={() => markPaid(expandedRecord)}
                    >
                      Mark Paid
                    </button>
                  )}
                  <button
                    className={`action-btn penalty ${expandedRecord.status === "PAID" ? "penalty-disabled" : ""}`}
                    onClick={(e) => {
                      if (expandedRecord.status === "PAID") return;
                      addPenalty(expandedRecord);
                    }}
                    data-mrt-tooltip={expandedRecord.status === "PAID" ? "Status is paid so cannot add penalty" : "Add Penalty"}
                  >
                    + Penalty
                  </button>
                  <button
                    className="wa-reminder-btn"
                    onClick={() => sendDueReminder(expandedRecord)}
                  >
                    <WhatsAppIcon size={14} />
                    Send Reminder
                  </button>
                </div>
              )}

              <div className="mrt-manual-dues-heading" style={{ marginTop: 18 }}>
                MANUAL DUES{" "}
                {(manualDuesMap[expandedRecord.residentId] || []).length > 0
                  ? `(${manualDuesMap[expandedRecord.residentId].length})`
                  : ""}
              </div>
              {manualDuesLoading === expandedRecord.residentId ? (
                <div className="mrt-manual-dues-loading">Loading...</div>
              ) : (manualDuesMap[expandedRecord.residentId] || []).length ===
                0 ? (
                <div className="mrt-manual-dues-loading">
                  No manual dues found
                </div>
              ) : (
                (manualDuesMap[expandedRecord.residentId] || []).map((due) =>
                  renderManualDueItem(expandedRecord, due),
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyRentTable;