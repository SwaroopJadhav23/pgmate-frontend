import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import "./NotificationBell.css";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [open, setOpen]                   = useState(false);
  const [loading, setLoading]             = useState(false);
  const panelRef = useRef(null);

  /* ── fetch unread count on mount ── */
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  /* ── close panel on outside click ── */
  useEffect(() => {
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/owner/dashboard/notifications/unread-count");
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // silent fail
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/owner/dashboard/notifications");
      setNotifications(res.data || []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const togglePanel = () => {
    if (!open) fetchNotifications();
    setOpen((prev) => !prev);
  };

  const markAllRead = async () => {
    try {
      await api.patch("/owner/dashboard/notifications/mark-all-read");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent fail
    }
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/owner/dashboard/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent fail
    }
  };

  return (
    <div className="notif-bell-wrapper" ref={panelRef}>

      {/* ── Bell button ── */}
      <button className="notif-bell-btn" onClick={togglePanel} aria-label="Notifications">
        <i className="bi bi-bell-fill"></i>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {loading ? (
              <div className="notif-empty">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <i className="bi bi-bell-slash"></i>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${n.read ? "read" : "unread"}`}
                  onClick={() => !n.read && markOneRead(n.id)}
                >
                  <div className="notif-item-icon">
                    {n.type === "ADMIN" ? (
                      <i className="bi bi-shield-fill-check"></i>
                    ) : (
                      <i className="bi bi-info-circle-fill"></i>
                    )}
                  </div>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-msg">{n.message}</div>
                    <div className="notif-item-time">{n.createdAt}</div>
                  </div>
                  {!n.read && <span className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;