import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { TableSkeleton, OwnerCardSkeleton } from "../public/Skeleton";
import "./AdminContactMessages.css";

const getInitials = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const parseDate = (str) => {
  if (!str) return 0;
  const [datePart, timePart] = str.split(" ");
  const [dd, mm, yyyy] = datePart.split("-");
  return new Date(`${yyyy}-${mm}-${dd}T${timePart || "00:00:00"}`).getTime();
};

/* ===== SVG ICONS (no emoji, no icon-font dependency) ===== */

const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MailOpenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9.5l8.15-6a1.5 1.5 0 0 1 1.7 0L21 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 9.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 18l6.5-5M21 18l-6.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AdminContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "read" | "new"

  // key -> true/false, whether that specific rendered message node is actually clipped
  const [overflowMap, setOverflowMap] = useState({});
  const observersRef = useRef({});

  // measure real overflow (scrollWidth > clientWidth) instead of guessing by char count,
  // and keep watching it via ResizeObserver so column/viewport resizes stay accurate
  const measureRef = useCallback((key) => (el) => {
    if (observersRef.current[key]) {
      observersRef.current[key].disconnect();
      delete observersRef.current[key];
    }
    if (!el) return;

    const check = () => {
      const isOverflowing =
        el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
      setOverflowMap((prev) =>
        prev[key] === isOverflowing ? prev : { ...prev, [key]: isOverflowing }
      );
    };

    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    observersRef.current[key] = ro;
  }, []);

  useEffect(() => {
    return () => {
      Object.values(observersRef.current).forEach((ro) => ro.disconnect());
      observersRef.current = {};
    };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/contact-messages");
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to load contact messages", err);
      toast.error("Failed to load contact messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRead = async (msg) => {
    try {
      await api.put(`/admin/contact-messages/${msg.id}/read/${!msg.read}`);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, read: !m.read } : m))
      );
    } catch (err) {
      console.error("Failed to update message", err);
      toast.error("Failed to update message.");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete this message?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admin/contact-messages/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Message deleted.");
    } catch (err) {
      console.error("Failed to delete message", err);
      toast.error("Failed to delete message.");
    }
  };

  const toggleExpand = (m) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(m.id)) {
        next.delete(m.id);
      } else {
        next.add(m.id);
        // reading it counts as "read"
        if (!m.read) toggleRead(m);
      }
      return next;
    });
  };

  const filtered = messages
    .filter((m) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q) ||
        m.subject?.toLowerCase().includes(q) ||
        m.message?.toLowerCase().includes(q)
      );
    })
    .filter((m) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "read") return m.read;
      return !m.read; // "new"
    })
    .sort((a, b) => {
      const da = parseDate(a.createdAt);
      const db = parseDate(b.createdAt);
      return sortOrder === "newest" ? db - da : da - db;
    });

  return (
    <DashboardLayout title="Contact Messages" subtitle="Submissions from the public Contact Us form">

      <div className="acm-topbar">
        <div className="acm-search-wrapper">
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            className="form-control"
            placeholder="Search name / email / phone / subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="acm-filter-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        <select
          className="acm-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All status</option>
          <option value="new">New only</option>
          <option value="read">Read only</option>
        </select>
      </div>

      <p className="acm-result-count">
        Showing <strong>{filtered.length}</strong> of {messages.length} messages
      </p>

      <div className="acm-table-wrapper">
        <table className="acm-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Received</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={8} cols={9} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="acm-empty">
                  No contact messages yet.
                </td>
              </tr>
            ) : (
              filtered.map((m, index) => {
                const isExpanded = expandedIds.has(m.id);
                const tableKey = `${m.id}:table`;
                const showReadMore = m.message && (isExpanded || overflowMap[tableKey]);
                return (
                  <tr key={m.id} className={m.read ? "is-read" : ""}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="acm-name-cell">
                        <span className="acm-avatar">{getInitials(m.name)}</span>
                        {m.name || "-"}
                      </div>
                    </td>
                    <td style={{ color: "#64748b" }}>{m.email || "-"}</td>
                    <td style={{ color: "#64748b" }}>{m.phone || "-"}</td>
                    <td>{m.subject || "-"}</td>
                    <td className={isExpanded ? "acm-message-cell expanded" : "acm-message-cell"}>
                      <span className="acm-message-text" ref={measureRef(tableKey)}>
                        {m.message || "-"}
                      </span>
                      {showReadMore && (
                        <button
                          type="button"
                          className="acm-readmore-btn"
                          onClick={() => toggleExpand(m)}
                        >
                          {isExpanded ? (
                            <>Read less <ChevronUpIcon /></>
                          ) : (
                            <>Read more <ChevronDownIcon /></>
                          )}
                        </button>
                      )}
                    </td>
                    <td style={{ color: "#64748b" }}>{m.createdAt || "-"}</td>
                    <td>
                      <span className={`acm-status-pill ${m.read ? "READ" : "NEW"}`}>
                        {m.read ? "READ" : "NEW"}
                      </span>
                    </td>
                    <td className="acm-action-cell">
                      <button
                        className="acm-icon-btn acm-icon-btn-mail"
                        title={m.read ? "Mark as unread" : "Mark as read"}
                        onClick={() => toggleRead(m)}
                      >
                        {m.read ? <MailIcon /> : <MailOpenIcon />}
                      </button>
                      <button
                        className="acm-icon-btn acm-icon-btn-danger"
                        title="Delete"
                        onClick={() => handleDelete(m.id)}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="acm-card-list">
        {loading ? (
          <OwnerCardSkeleton count={4} />
        ) : filtered.length === 0 ? (
          <div className="acm-empty">No contact messages yet.</div>
        ) : (
          filtered.map((m, index) => {
            const isExpanded = expandedIds.has(m.id);
            const cardKey = `${m.id}:card`;
            const showReadMore = m.message && (isExpanded || overflowMap[cardKey]);
            return (
              <div key={m.id} className="acm-card">
                <div className="acm-card-bar" />
                <div className="acm-card-body">
                  <div className="acm-card-top-row">
                    <span>{index + 1}</span>
                    <span className={`acm-status-pill ${m.read ? "READ" : "NEW"}`}>
                      {m.read ? "READ" : "NEW"}
                    </span>
                  </div>

                  <div className="acm-card-sender">
                    <span className="acm-avatar">{getInitials(m.name)}</span>
                    <div className="acm-card-sender-info">
                      <div className="acm-card-sender-name">{m.name || "-"}</div>
                      <div className="acm-card-sender-email">{m.email || "-"}</div>
                    </div>
                  </div>

                  <div className="acm-card-meta">
                    {m.phone || "-"} &middot; {m.subject || "-"}
                  </div>

                  {m.message && (
                    <div className={isExpanded ? "acm-message-cell expanded" : "acm-message-cell"}>
                      <div className="acm-card-message">
                        <span className="acm-message-text" ref={measureRef(cardKey)}>
                          {m.message}
                        </span>
                      </div>
                      {showReadMore && (
                        <button
                          type="button"
                          className="acm-readmore-btn"
                          onClick={() => toggleExpand(m)}
                        >
                          {isExpanded ? (
                            <>Read less <ChevronUpIcon /></>
                          ) : (
                            <>Read more <ChevronDownIcon /></>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="acm-card-actions">
                    <button
                      className="acm-icon-btn acm-icon-btn-mail"
                      title={m.read ? "Mark as unread" : "Mark as read"}
                      onClick={() => toggleRead(m)}
                    >
                      {m.read ? <MailIcon /> : <MailOpenIcon />}
                    </button>
                    <button
                      className="acm-icon-btn acm-icon-btn-danger"
                      title="Delete"
                      onClick={() => handleDelete(m.id)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminContactMessages;