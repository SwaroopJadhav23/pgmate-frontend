import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "../owner/OwnerEnquiries.css";
import { TableSkeleton } from "../public/Skeleton";

const PAGE_SIZE = 20;

const ManagerEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [summary, setSummary] = useState({ total: 0, NEW: 0, CONTACTED: 0, CONVERTED: 0, CLOSED: 0 });

  const queryParams = useMemo(
    () => ({ search: searchTerm.trim(), status: statusFilter || undefined }),
    [searchTerm, statusFilter],
  );

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get("/manager/enquiries/paged", {
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
      const res = await api.get("/manager/enquiries/paged", {
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

  return (
    <DashboardLayout title="PG Enquiries" subtitle="Leads from assigned PGs">

      {/* ── STAT CARDS ── */}
      <div className="owners-stats-row">
        <div className="owners-stat-card" style={{ borderTopColor: "#5B5BD6" }}>
          <div className="owners-stat-icon" style={{ background: "#eef2ff" }}>
            <i className="bi bi-envelope-fill" style={{ color: "#5B5BD6" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.total}</div>
            <div className="owners-stat-label">Total Enquiries</div>
            <div className="owners-stat-sub">All incoming leads</div>
          </div>
        </div>
        <div className="owners-stat-card" style={{ borderTopColor: "#0284c7" }}>
          <div className="owners-stat-icon" style={{ background: "#e0f2fe" }}>
            <i className="bi bi-bell-fill" style={{ color: "#0284c7" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.NEW}</div>
            <div className="owners-stat-label">New</div>
            <div className="owners-stat-sub">Awaiting response</div>
          </div>
        </div>
        <div className="owners-stat-card" style={{ borderTopColor: "#ea580c" }}>
          <div className="owners-stat-icon" style={{ background: "#fff7ed" }}>
            <i className="bi bi-telephone-fill" style={{ color: "#ea580c" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.CONTACTED}</div>
            <div className="owners-stat-label">Contacted</div>
            <div className="owners-stat-sub">Follow-up in progress</div>
          </div>
        </div>
        <div className="owners-stat-card" style={{ borderTopColor: "#16a34a" }}>
          <div className="owners-stat-icon" style={{ background: "#f0fdf4" }}>
            <i className="bi bi-check-circle-fill" style={{ color: "#16a34a" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.CONVERTED}</div>
            <div className="owners-stat-label">Converted</div>
            <div className="owners-stat-sub">Successful leads</div>
          </div>
        </div>
        <div className="owners-stat-card" style={{ borderTopColor: "#dc2626" }}>
          <div className="owners-stat-icon" style={{ background: "#fef2f2" }}>
            <i className="bi bi-x-circle-fill" style={{ color: "#dc2626" }}></i>
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
                <col style={{ width: "52px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "170px" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "155px" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "160px" }} />
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
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={6} cols={8} />
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="enq-empty">No matching enquiries found</td>
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
                      <td>{e.status}</td>
                      <td>{e.pgName}</td>
                      <td>{e.createdAt}</td>
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
                    <span className={`enq-badge enq-badge--${e.status.toLowerCase()}`}>{e.status}</span>
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

                  {/* Status footer — read-only badge for manager */}
                  <div className="enq-footer">
                    <span className="enq-footer-label">Status</span>
                    <span className={`enq-badge enq-badge--${e.status.toLowerCase()}`}>{e.status}</span>
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

export default ManagerEnquiries;