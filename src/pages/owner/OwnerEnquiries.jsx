import { useCallback, useEffect, useMemo, useState } from "react";
import React from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./OwnerEnquiries.css";
import { TableSkeleton } from "../public/Skeleton";

const PAGE_SIZE = 20;

// Renders the 3-dot action menu into document.body via portal, positioned
// with `fixed` coords from the trigger button's bounding rect. This escapes
// any parent `overflow: auto/hidden` (e.g. the horizontally scrollable
// desktop table wrapper), so the menu never gets clipped for the last rows.
const ActionMenu = ({ anchorRect, onDelete }) => {
  if (!anchorRect) return null;

  const MENU_WIDTH = 140;
  const MENU_HEIGHT_ESTIMATE = 44; // single "Delete" item

  let top = anchorRect.bottom + 6;
  let left = anchorRect.right - MENU_WIDTH;

  // Flip above the button if there isn't enough room below the viewport
  if (top + MENU_HEIGHT_ESTIMATE > window.innerHeight) {
    top = anchorRect.top - MENU_HEIGHT_ESTIMATE - 6;
  }
  // Keep menu inside viewport horizontally
  if (left < 8) left = 8;
  if (left + MENU_WIDTH > window.innerWidth - 8) {
    left = window.innerWidth - MENU_WIDTH - 8;
  }

  const style = {
    position: "fixed",
    top,
    left,
    minWidth: MENU_WIDTH,
    zIndex: 1000,
  };

  return createPortal(
    <div className="enq-action-menu" style={style} onClick={(ev) => ev.stopPropagation()}>
      <button className="enq-action-menu-item enq-action-delete" onClick={onDelete}>
        <i className="bi bi-trash" /> Delete
      </button>
    </div>,
    document.body,
  );
};

const OwnerEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [summary, setSummary] = useState({ total: 0, NEW: 0, CONTACTED: 0, CONVERTED: 0, CLOSED: 0 });
  // { id, rect } of the enquiry whose action menu is open, or null
  const [menuAnchor, setMenuAnchor] = useState(null);

  const queryParams = useMemo(
    () => ({ search: searchTerm.trim(), status: statusFilter || undefined }),
    [searchTerm, statusFilter],
  );

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get("/enquiry/enquiries/paged", {
        params: { page: 0, size: 9999 },
      });
      const all = res.data?.content || [];
      setSummary({
        total: res.data?.totalElements || all.length,
        NEW: all.filter((e) => e.status === "NEW").length,
        CONTACTED: all.filter((e) => e.status === "CONTACTED").length,
        CONVERTED: all.filter((e) => e.status === "CONVERTED").length,
        CLOSED: all.filter((e) => e.status === "CLOSED").length,
      });
    } catch (err) {
      console.error("Summary load error", err);
    }
  }, []);

  const loadPage = useCallback(
    async (nextPage, append = false) => {
      const res = await api.get("/enquiry/enquiries/paged", {
        params: {
          page: nextPage,
          size: PAGE_SIZE,
          search: queryParams.search || undefined,
          status: queryParams.status,
        },
      });
      const content = res.data?.content || [];
      setEnquiries((prev) => (append ? [...prev, ...content] : content));
      setPage(res.data?.number || nextPage);
      setTotalPages(res.data?.totalPages || 0);
    },
    [queryParams],
  );

  useEffect(() => { loadSummary(); }, [loadSummary]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        await loadPage(0, false);
      } catch (err) {
        console.error("Enquiry load error", err);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [loadPage]);

  // Close the 3-dot action menu on any outside click
  useEffect(() => {
    const closeMenu = () => setMenuAnchor(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  // Close the menu on scroll/resize so it doesn't stay pinned to a stale position
  useEffect(() => {
    if (!menuAnchor) return;
    const close = () => setMenuAnchor(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menuAnchor]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/enquiry/${id}/status/${status}`);
      await loadPage(0, false);
      await loadSummary();
    } catch (err) {
      console.error("Status update failed", err);
      alert("Failed to update enquiry status");
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || page + 1 >= totalPages) return;
    try {
      setLoadingMore(true);
      await loadPage(page + 1, true);
    } catch (err) {
      console.error("Enquiry load more error", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeleteClick = (id) => {
    setMenuAnchor(null);
    confirmDelete(id);
  };

  const toggleMenu = (ev, id) => {
    const rect = ev.currentTarget.getBoundingClientRect();
    setMenuAnchor((prev) => (prev?.id === id ? null : { id, rect }));
  };

  const confirmDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete this enquiry?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: false,
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/enquiry/${id}`);
      await loadPage(0, false);
      await loadSummary();
      toast.success("Enquiry deleted.");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete enquiry.");
    }
  };

  return (
    <DashboardLayout title="PG Enquiries" subtitle="Leads from your PG detail pages">

      {/* ── STAT CARDS ── */}
      <div className="owners-stats-row">
        <div className="owners-stat-card owners-stat-card--purple">
          <div className="owners-stat-icon owners-stat-icon--purple">
            <i className="bi bi-envelope-fill"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.total}</div>
            <div className="owners-stat-label">Total Enquiries</div>
            <div className="owners-stat-sub">All incoming leads</div>
          </div>
        </div>
        <div className="owners-stat-card owners-stat-card--blue">
          <div className="owners-stat-icon owners-stat-icon--blue">
            <i className="bi bi-bell-fill"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.NEW}</div>
            <div className="owners-stat-label">New</div>
            <div className="owners-stat-sub">Awaiting response</div>
          </div>
        </div>
        <div className="owners-stat-card owners-stat-card--orange">
          <div className="owners-stat-icon owners-stat-icon--orange">
            <i className="bi bi-telephone-fill"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.CONTACTED}</div>
            <div className="owners-stat-label">Contacted</div>
            <div className="owners-stat-sub">Follow-up in progress</div>
          </div>
        </div>
        <div className="owners-stat-card owners-stat-card--green">
          <div className="owners-stat-icon owners-stat-icon--green">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.CONVERTED}</div>
            <div className="owners-stat-label">Converted</div>
            <div className="owners-stat-sub">Successful leads</div>
          </div>
        </div>
        <div className="owners-stat-card owners-stat-card--red">
          <div className="owners-stat-icon owners-stat-icon--red">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.CLOSED}</div>
            <div className="owners-stat-label">Closed</div>
            <div className="owners-stat-sub">No longer active</div>
          </div>
        </div>
      </div>

      {/* ── SHELL ── */}
      <div className="card p-3 enquiries-shell">

        {/* Filter bar */}
        <div className="filter-bar enquiries-filter-bar">
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by name, phone, email, PG..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="form-select status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="CONVERTED">CONVERTED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        {/* ── TABLE SCOPE ── */}
        <div className="enq-table-scope">

          {/* Desktop: scrollable table wrapper */}
          <div className="enq-desktop-wrap">
            <table className="enq-desktop-table">
              <colgroup>
                <col width="52" />
                <col width="140" />
                <col width="220" />
                <col width="170" />
                <col width="130" />
                <col width="155" />
                <col width="130" />
                <col width="160" />
                <col width="60" />
              </colgroup>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>PG</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={6} cols={9} />
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="enq-empty">No matching enquiries found</td>
                  </tr>
                ) : (
                  enquiries.map((e, i) => (
                    <tr key={e.id} className="enq-dt-row">
                      <td>{i + 1}</td>
                      <td>{e.name}</td>
                      <td>
                        <div className="enq-phone-wrap">
                          <span className="enq-phone-num">{e.phone}</span>
                          <button className="enq-icon-btn" onClick={() => { navigator.clipboard.writeText(e.phone); setCopiedId(e.id); setTimeout(() => setCopiedId(null), 1500); }}>
                            {copiedId === e.id ? <i className="bi bi-check2 text-success" /> : <i className="bi bi-copy" />}
                          </button>
                          <a href={`tel:${e.phone}`} className="enq-icon-btn"><i className="bi bi-telephone-fill text-success" /></a>
                          <a href={`https://wa.me/91${e.phone}`} target="_blank" rel="noopener noreferrer" className="enq-icon-btn"><i className="bi bi-whatsapp text-success" /></a>
                        </div>
                      </td>
                      <td>{e.email || "-"}</td>
                      <td className="enq-msg-cell">{e.adminNote || "-"}</td>
                      <td>
                        <select
                          className="enq-dt-status-select"
                          value={e.status}
                          onChange={(ev) => updateStatus(e.id, ev.target.value)}
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="CONVERTED">CONVERTED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>
                      <td>{e.pgName}</td>
                      <td>{e.createdAt}</td>
                      <td className="enq-action-cell" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          className="enq-icon-btn"
                          onClick={(ev) => toggleMenu(ev, e.id)}
                        >
                          <i className="bi bi-three-dots-vertical" />
                        </button>
                        {menuAnchor?.id === e.id && (
                          <ActionMenu
                            anchorRect={menuAnchor.rect}
                            onDelete={() => handleDeleteClick(e.id)}
                          />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards only */}
          <div className="enq-cards-wrap">
            {loading ? (
              <div className="enq-empty">Loading...</div>
            ) : enquiries.length === 0 ? (
              <div className="enq-empty">No matching enquiries found</div>
            ) : (
              enquiries.map((e) => (
                <div key={e.id} className={`enq-card enq-card--${e.status.toLowerCase()}`}>

                  {/* Header */}
                  <div className="enq-header">
                    <div className="enq-title-block">
                      <div className="enq-name">{e.name}</div>
                      <div className="enq-sub">{e.pgName} · {e.createdAt}</div>
                    </div>
                    <div className="enq-header-right">
                      <span className={`enq-badge enq-badge--${e.status.toLowerCase()}`}>{e.status}</span>
                      <div className="enq-action-cell" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          className="enq-icon-btn"
                          onClick={(ev) => toggleMenu(ev, e.id)}
                        >
                          <i className="bi bi-three-dots-vertical" />
                        </button>
                        {menuAnchor?.id === e.id && (
                          <ActionMenu
                            anchorRect={menuAnchor.rect}
                            onDelete={() => handleDeleteClick(e.id)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Row */}
                  <div className="enq-contact-row">
                    <div className="enq-contact-cell">
                      <div className="enq-contact-label">Phone</div>
                      <div className="enq-contact-actions">
                        <span className="enq-phone">{e.phone}</span>
                        <button className="enq-icon-btn" onClick={() => { navigator.clipboard.writeText(e.phone); setCopiedId(e.id); setTimeout(() => setCopiedId(null), 1500); }}>
                          {copiedId === e.id ? <i className="bi bi-check2 text-success" /> : <i className="bi bi-copy" />}
                        </button>
                        <a href={`tel:${e.phone}`} className="enq-icon-btn"><i className="bi bi-telephone-fill text-success" /></a>
                        <a href={`https://wa.me/91${e.phone}`} target="_blank" rel="noopener noreferrer" className="enq-icon-btn"><i className="bi bi-whatsapp text-success" /></a>
                      </div>
                    </div>
                    <div className="enq-contact-cell enq-contact-cell--right">
                      <div className="enq-contact-label">Email</div>
                      <div className="enq-contact-val">{e.email || "-"}</div>
                    </div>
                  </div>

                  {/* Message */}
                  {e.adminNote && (
                    <div className="enq-message-row">
                      <div className="enq-message-label">Message</div>
                      <div className="enq-message-val">{e.adminNote}</div>
                    </div>
                  )}

                  {/* Status footer */}
                  <div className="enq-footer">
                    <span className="enq-footer-label">Update Status</span>
                    <select
                      className="enq-status-select"
                      value={e.status}
                      onChange={(ev) => updateStatus(e.id, ev.target.value)}
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="CONVERTED">CONVERTED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>{/* end enq-table-scope */}

        {!loading && page + 1 < totalPages && (
          <div className="enquiries-load-more-wrap">
            <button className="enquiries-load-more" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default OwnerEnquiries;