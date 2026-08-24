import { useCallback, useEffect, useMemo, useState } from "react";
import React from "react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./OwnerEnquiries.css";
import { TableSkeleton } from "../public/Skeleton";

const PAGE_SIZE = 20;

const OwnerEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [summary, setSummary] = useState({ total: 0, NEW: 0, RESPONDED: 0, THIS_MONTH: 0 });

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
      const now = new Date();
      const thisMonthEnquiries = all.filter(e => {
        if (!e.createdAt) return false;
        // Assuming format dd-MM-yyyy HH:mm:ss, but handle ISO as well
        let dt;
        if (e.createdAt.includes("-") && e.createdAt.indexOf("-") === 2) {
          // dd-MM-yyyy
          const parts = e.createdAt.substring(0, 10).split("-");
          dt = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
        } else {
          dt = new Date(e.createdAt);
        }
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
      });

      setSummary({
        total: res.data?.totalElements || all.length,
        NEW: all.filter((e) => e.status === "NEW").length,
        RESPONDED: all.filter((e) => e.status === "CONTACTED" || e.status === "CONVERTED").length,
        THIS_MONTH: thisMonthEnquiries.length,
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
    confirmDelete(id);
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
    <DashboardLayout title="Enquiries" subtitle="Manage and respond to all enquiries">

      {/* ── STAT CARDS ── */}
      <div className="owners-stats-row">
        <div className="owners-stat-card">
          <div className="owners-stat-icon owners-stat-icon--purple">
            <i className="bi bi-file-earmark-text"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-label">Total Enquiries</div>
            <div className="owners-stat-value">{summary.total}</div>
          </div>
        </div>
        <div className="owners-stat-card">
          <div className="owners-stat-icon owners-stat-icon--blue">
            <i className="bi bi-check2-square"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-label">New Enquiries</div>
            <div className="owners-stat-value">{summary.NEW}</div>
          </div>
        </div>
        <div className="owners-stat-card">
          <div className="owners-stat-icon owners-stat-icon--green">
            <i className="bi bi-person-lines-fill"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-label">Responded</div>
            <div className="owners-stat-value">{summary.RESPONDED}</div>
          </div>
        </div>
        <div className="owners-stat-card">
          <div className="owners-stat-icon owners-stat-icon--orange">
            <i className="bi bi-clock-history"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-label">This Month</div>
            <div className="owners-stat-value">{summary.THIS_MONTH}</div>
          </div>
        </div>
      </div>

      {/* ── SHELL ── */}
      <div className="enquiries-shell">

        {/* Toolbar */}
        <div className="enquiries-toolbar">
          <div className="enquiries-toolbar-left">
            <div className="enquiries-search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Search by name, phone or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
          <div className="enquiries-toolbar-right">
            <button className="enquiries-export-btn" onClick={() => toast("Export feature coming soon")}>
              <i className="bi bi-download"></i> Export
            </button>
          </div>
        </div>

        {/* ── TABLE SCOPE ── */}
        <div className="enq-table-scope">

          {/* Desktop: scrollable table wrapper */}
          <div className="enq-desktop-wrap">
            <table className="enq-desktop-table">
              <colgroup>
                <col width="60" />
                <col width="220" />
                <col width="160" />
                <col width="200" />
                <col width="250" />
                <col width="140" />
                <col width="120" />
                <col width="120" />
                <col width="80" />
              </colgroup>
              <thead>
                <tr>
                  <th>NO.</th>
                  <th>NAME</th>
                  <th>CONTACT</th>
                  <th>EMAIL</th>
                  <th>MESSAGE</th>
                  <th>STATUS</th>
                  <th>PG</th>
                  <th>DATE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9"><TableSkeleton rows={6} cols={9} /></td></tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="enq-empty">No matching enquiries found</td>
                  </tr>
                ) : (
                  enquiries.map((e, i) => {
                    const dateParts = e.createdAt ? e.createdAt.split(" ") : ["-"];
                    return (
                      <tr key={e.id} className="enq-card-row">
                        <td className="enq-no-cell">
                          <div className="enq-no-badge">{page * PAGE_SIZE + i + 1}</div>
                        </td>
                        <td className="enq-name-cell-table">
                          <div className="enq-name-wrapper">
                            <div className="enq-avatar"><i className="bi bi-person"></i></div>
                            <span className="enq-name-text">{e.name}</span>
                          </div>
                        </td>
                        <td className="enq-contact-cell-table">
                          <div className="enq-phone-number">{e.phone}</div>
                          <div className="enq-contact-actions">
                            <button className="enq-action-icon" onClick={() => { navigator.clipboard.writeText(e.phone); setCopiedId(e.id); setTimeout(() => setCopiedId(null), 1500); }} title="Copy">
                              {copiedId === e.id ? <i className="bi bi-check2 text-success" /> : <i className="bi bi-copy" />}
                            </button>
                            <a href={`tel:${e.phone}`} className="enq-action-icon" title="Call"><i className="bi bi-telephone-fill" style={{color: '#10B981'}} /></a>
                            <a href={`https://wa.me/91${e.phone}`} target="_blank" rel="noopener noreferrer" className="enq-action-icon" title="WhatsApp"><i className="bi bi-whatsapp" style={{color: '#22C55E'}} /></a>
                          </div>
                        </td>
                        <td className="enq-email-cell">{e.email || "-"}</td>
                        <td className="enq-msg-cell">{e.adminNote || "-"}</td>
                        <td className="enq-status-cell">
                          <select
                            className={`enq-status-badge enq-status-badge--${e.status.toLowerCase()}`}
                            value={e.status}
                            onChange={(ev) => updateStatus(e.id, ev.target.value)}
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="CONVERTED">CONVERTED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </td>
                        <td className="enq-pg-cell">{e.pgName}</td>
                        <td className="enq-date-cell">
                          <div className="enq-date-part">{dateParts[0]}</div>
                          {dateParts[1] && <div className="enq-time-part">{dateParts[1]}</div>}
                        </td>
                        <td className="enq-action-cell-table" onClick={(ev) => ev.stopPropagation()}>
                          <button
                            className="enq-action-dots enq-delete-btn"
                            onClick={() => handleDeleteClick(e.id)}
                            title="Delete"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
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
                          className="enq-icon-btn enq-delete-btn"
                          onClick={() => handleDeleteClick(e.id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash" />
                        </button>
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