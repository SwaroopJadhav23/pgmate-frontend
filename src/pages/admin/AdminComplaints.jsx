import { FaExclamationTriangle, FaChartBar, FaHome, FaInbox, FaImage, FaUser, FaClipboardList } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./AdminComplaints.css"
const STATUS_COLOR = {
  PENDING: { bg: "#fef9c3", color: "#92400e" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1d4ed8" },
  RESOLVED: { bg: "#dcfce7", color: "#166534" },
};

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCity, setFilterCity] = useState("");
  const [cityOptions, setCityOptions] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [expandedDesc, setExpandedDesc] = useState({});
  const [viewingImages, setViewingImages] = useState(null);

  const fetchComplaints = () => {
    setLoading(true);
    api.get("/complaints/admin/all")
      .then((res) => setComplaints(res.data || []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, []);

  useEffect(() => {
    api.get("/public/cities")
      .then((res) => setCityOptions(res.data || []))
      .catch(() => { });
  }, []);

  const filtered = complaints.filter((c) => {
    const matchSearch =
      c.pgName?.toLowerCase().includes(search.toLowerCase()) ||
      c.userName?.toLowerCase().includes(search.toLowerCase()) ||
      c.subject?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || c.status === filterStatus;
    const matchCity = filterCity === "" || c.city === filterCity;
    return matchSearch && matchStatus && matchCity;
  });

  const pgComplaintCount = filtered.reduce((acc, c) => {
    acc[c.pgName] = (acc[c.pgName] || 0) + 1;
    return acc;
  }, {});

  const tabFiltered =
    activeTab === "ALL" || activeTab === "SORT_PG"
      ? filtered
      : filtered.filter((c) => c.status === activeTab);

  const displayed =
    activeTab === "SORT_PG"
      ? [...tabFiltered].sort((a, b) => (pgComplaintCount[b.pgName] || 0) - (pgComplaintCount[a.pgName] || 0))
      : tabFiltered;

  const topPGs = Object.entries(pgComplaintCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

// ── SUMMARY CARDS ──
const total = complaints.length;
const pending = complaints.filter(c => c.status === "PENDING").length;
const inProgress = complaints.filter(c => c.status === "IN_PROGRESS").length;
const resolved = complaints.filter(c => c.status === "RESOLVED").length;

const topPG = Object.entries(
  complaints.reduce((acc, c) => {
    acc[c.pgName] = (acc[c.pgName] || 0) + 1;
    return acc;
  }, {})
).sort((a, b) => b[1] - a[1])[0];

  return (
    <DashboardLayout title="Tenant Complaints" subtitle="All complaints across platform">
      <div className="ac-wrap">
        <div className="ac-stats-row">

  {/* Top PG */}
  <div className="ac-stat-card ac-stat-top">
    <div className="ac-stat-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 17L8 21H16L12 17Z" fill="#f59e0b"/>
        <path d="M6 3H18V10C18 13.3137 15.3137 16 12 16C8.68629 16 6 13.3137 6 10V3Z" stroke="#f59e0b" strokeWidth="1.5"/>
      </svg>
    </div>
    <div>
      <div className="ac-stat-value">{topPG ? topPG[1] : 0}</div>
      <div className="ac-stat-label">Top PG</div>
      <div className="ac-stat-sub">{topPG ? topPG[0] : "No data"}</div>
    </div>
  </div>

  {/* Total */}
  <div className="ac-stat-card ac-stat-total">
    <div className="ac-stat-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="#4f46e5" strokeWidth="1.5"/>
        <path d="M7 8H17M7 12H17M7 16H13" stroke="#4f46e5" strokeWidth="1.5"/>
      </svg>
    </div>
    <div>
      <div className="ac-stat-value">{total}</div>
      <div className="ac-stat-label">Total Complaints</div>
    </div>
  </div>

  {/* Pending */}
  <div className="ac-stat-card ac-stat-pending">
    <div className="ac-stat-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#d97706" strokeWidth="1.5"/>
        <path d="M12 7V12L15 14" stroke="#d97706" strokeWidth="1.5"/>
      </svg>
    </div>
    <div>
      <div className="ac-stat-value">{pending}</div>
      <div className="ac-stat-label">Pending</div>
    </div>
  </div>

  {/* In Progress */}
  <div className="ac-stat-card ac-stat-progress">
    <div className="ac-stat-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 12A8 8 0 0118 7" stroke="#2563eb" strokeWidth="1.5"/>
        <path d="M20 12A8 8 0 016 17" stroke="#2563eb" strokeWidth="1.5"/>
      </svg>
    </div>
    <div>
      <div className="ac-stat-value">{inProgress}</div>
      <div className="ac-stat-label">In Progress</div>
    </div>
  </div>

  {/* Resolved */}
  <div className="ac-stat-card ac-stat-resolved">
    <div className="ac-stat-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#16a34a" strokeWidth="1.5"/>
        <path d="M8 12L11 15L16 9" stroke="#16a34a" strokeWidth="1.5"/>
      </svg>
    </div>
    <div>
      <div className="ac-stat-value">{resolved}</div>
      <div className="ac-stat-label">Resolved</div>
    </div>
  </div>

</div>
        {/* ── Header ── */}
        <div className="ac-header">
          <div>
            <h2><FaExclamationTriangle /> All Complaints</h2>
            <p>Total: {complaints.length} complaints</p>
          </div>

        </div>

        {/* ── Filters ── */}
        <div className="ac-filters">
          <input
            placeholder="Search by PG, tenant or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
            <option value="">All Cities</option>
            {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>

        {/* ── Tabs ── */}
        <div className="ac-tabs">
          <button
            className={`ac-tab sort-tab ${activeTab === "SORT_PG" ? "active" : ""}`}
            onClick={() => setActiveTab("SORT_PG")}
          >
            <FaChartBar /> {activeTab === "SORT_PG" ? "Sorted by PG" : "Sort by PG"}
          </button>
          {["ALL", "PENDING", "IN_PROGRESS", "RESOLVED"].map((s) => {
            const count = s === "ALL" ? complaints.length : complaints.filter((c) => c.status === s).length;
            return (
              <button
                key={s}
                className={`ac-tab ${activeTab === s ? "active" : ""}`}
                onClick={() => setActiveTab(s)}
              >
                {s.replace("_", " ")}: {count}
              </button>
            );
          })}
        </div>

        {/* ── Sort PG Banner ── */}
        {activeTab === "SORT_PG" && topPGs.length > 0 && (
          <div className="ac-pg-banner">
            {/* Desktop head row */}
            <div className="ac-pg-banner-head">
              {["RANK", "PG NAME", "TOTAL", "PENDING", "IN PROGRESS", "RESOLVED"].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {topPGs.map(([pgName, count], i) => {
              const pgC = complaints.filter((c) => c.pgName === pgName);
              const pending = pgC.filter((c) => c.status === "PENDING").length;
              const inProg = pgC.filter((c) => c.status === "IN_PROGRESS").length;
              const resolved = pgC.filter((c) => c.status === "RESOLVED").length;
              const rankColors = ["#dc2626", "#f97316", "#eab308"];
              return (
                <div className="ac-pg-banner-row" key={pgName}>
                  <div>
                    <span className="ac-badge" style={{ background: rankColors[i], color: "#fff" }}>#{i + 1}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: "#1e1b4b", fontSize: "13px" }}><FaHome /> {pgName}</div>
                  <div><span className="ac-badge" style={{ background: "#e0e7ff", color: "#4f46e5" }}>{count} total</span></div>
                  <div><span className="ac-badge" style={{ background: "#fef9c3", color: "#92400e" }}>{pending} pending</span></div>
                  <div><span className="ac-badge" style={{ background: "#dbeafe", color: "#1d4ed8" }}>{inProg} in-progress</span></div>
                  <div><span className="ac-badge" style={{ background: "#dcfce7", color: "#166534" }}>{resolved} resolved</span></div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Table / Cards ── */}
        {activeTab !== "SORT_PG" && (
          loading ? (
            <p style={{ color: "#64748b", fontSize: "14px" }}>Loading complaints...</p>
          ) : displayed.length === 0 ? (
            <div className="ac-empty">
              <div className="icon"><FaInbox /></div>
              <p>No complaints found</p>
            </div>
          ) : (
            <>
              {/* ── DESKTOP TABLE ── */}
              <div className="ac-table">
                <div className="ac-table-head">
                  {["SUBJECT & REASON", "PG NAME", "TENANT", "CATEGORY", "STATUS", "PHONE"].map((h) => (
                    <span key={h}>{h}</span>
                  ))}
                </div>

                {displayed.map((c) => {
                  const sc = STATUS_COLOR[c.status] || STATUS_COLOR.PENDING;
                  const isExpanded = expandedDesc[c.id];
                  const DESC_LIMIT = 70;
                  const shortDesc = c.description?.length > DESC_LIMIT
                    ? c.description.slice(0, DESC_LIMIT) + "…"
                    : c.description;

                  return (
                    <div className="ac-row" key={c.id}>
                      <div className="ac-row-inner">

                        {/* Subject */}
                        <div className="ac-cell-subject">
                          <p className="ac-subject">{c.subject}</p>
                          <p className="ac-filed">Filed: {c.createdAt}</p>
                          {c.description && (
                            <p className="ac-desc">
                              {isExpanded ? c.description : shortDesc}
                              {c.description?.length > DESC_LIMIT && (
                                <span
                                  className="ac-read-more"
                                  onClick={() => setExpandedDesc((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                                >
                                  {isExpanded ? "Read less" : "Read more"}
                                </span>
                              )}
                            </p>
                          )}
                          {c.imageUrls?.length > 0 && (
                            <button className="ac-img-btn" onClick={() => setViewingImages(c.imageUrls)}>
                              <FaImage /> View {c.imageUrls.length} Image{c.imageUrls.length > 1 ? "s" : ""}
                            </button>
                          )}
                        </div>

                        {/* PG Name */}
                        <div style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>
                          <FaHome /> {c.pgName}
                        </div>

                        {/* Tenant */}
                        <div style={{ fontSize: "13px", color: "#374151" }}>
                          <FaUser /> {c.userName}
                        </div>

                        {/* Category */}
                        <div>
                          <span className="ac-cat-badge">{c.category}</span>
                        </div>

                        {/* Status */}
                        <div>
                          <span className="ac-badge" style={{ background: sc.bg, color: sc.color }}>
                            {c.status}
                          </span>
                        </div>

                        {/* Phone */}
                        <div className="ac-phone-cell">
                          <span>{c.userPhone || "—"}</span>
                          {c.userPhone && (
                            <button
                              className="ac-copy-btn"
                              onClick={() => {
                                navigator.clipboard.writeText(c.userPhone);
                                Swal.fire({ icon: "success", title: "Copied!", timer: 800, showConfirmButton: false });
                              }}
                            ><FaClipboardList /></button>
                          )}
                        </div>
                      </div>

                      {/* Owner response */}
                      {c.ownerResponse && (
                        <div className="ac-owner-resp">
                          <div className="ac-owner-resp-inner">
                            <p className="label">Owner Response</p>
                            <p className="text">{c.ownerResponse}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── MOBILE CARD LIST ── */}
              <div className="ac-card-list">
                {displayed.map((c) => {
                  const sc = STATUS_COLOR[c.status] || STATUS_COLOR.PENDING;
                  const isExpanded = expandedDesc[c.id];
                  const DESC_LIMIT = 100;
                  const shortDesc = c.description?.length > DESC_LIMIT
                    ? c.description.slice(0, DESC_LIMIT) + "…"
                    : c.description;

                  return (
                    <div className="ac-card" key={c.id}>
                      {/* Card Header */}
                      <div className="ac-card-header">
                        <div className="ac-card-header-left">
                          <p className="ac-card-subject">{c.subject}</p>
                          <p className="ac-card-filed">Filed: {c.createdAt}</p>
                        </div>
                        <span className="ac-badge" style={{ background: sc.bg, color: sc.color, flexShrink: 0 }}>
                          {c.status.replace("_", " ")}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="ac-card-body">

                        {/* PG Name */}
                        <div className="ac-card-row">
                          <span className="ac-card-row-label">PG</span>
                          <span className="ac-card-row-val" style={{ fontWeight: 600, color: "#1e1b4b" }}>
                            <FaHome /> {c.pgName}
                          </span>
                        </div>

                        {/* Tenant */}
                        <div className="ac-card-row">
                          <span className="ac-card-row-label">Tenant</span>
                          <span className="ac-card-row-val"><FaUser /> {c.userName}</span>
                        </div>

                        {/* Category */}
                        <div className="ac-card-row">
                          <span className="ac-card-row-label">Category</span>
                          <span className="ac-card-row-val">
                            <span className="ac-cat-badge">{c.category}</span>
                          </span>
                        </div>

                        {/* Phone */}
                        {c.userPhone && (
                          <div className="ac-card-row">
                            <span className="ac-card-row-label">Phone</span>
                            <span className="ac-card-row-val" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {c.userPhone}
                              <button
                                className="ac-copy-btn"
                                onClick={() => {
                                  navigator.clipboard.writeText(c.userPhone);
                                  Swal.fire({ icon: "success", title: "Copied!", timer: 800, showConfirmButton: false });
                                }}
                              ><FaClipboardList /></button>
                            </span>
                          </div>
                        )}

                        {/* Description */}
                        {c.description && (
                          <div className="ac-card-row">
                            <span className="ac-card-row-label">Details</span>
                            <span className="ac-card-row-val ac-card-desc">
                              {isExpanded ? c.description : shortDesc}
                              {c.description?.length > DESC_LIMIT && (
                                <span
                                  className="ac-read-more"
                                  onClick={() => setExpandedDesc((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                                >
                                  {isExpanded ? " Read less" : " Read more"}
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Images */}
                        {c.imageUrls?.length > 0 && (
                          <div>
                            <button className="ac-img-btn" onClick={() => setViewingImages(c.imageUrls)}>
                              <FaImage /> View {c.imageUrls.length} Image{c.imageUrls.length > 1 ? "s" : ""}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Owner Response */}
                      {c.ownerResponse && (
                        <div className="ac-card-footer">
                          <div className="ac-card-owner-resp">
                            <div className="label">Owner Response</div>
                            <p className="text">{c.ownerResponse}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}
      </div>

      {/* ── Image Modal ── */}
      {viewingImages && (
        <div className="ac-modal-backdrop" onClick={() => setViewingImages(null)}>
          <div className="ac-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ac-modal-header">
              <h3><FaImage /> Complaint Images</h3>
              <button className="ac-modal-close" onClick={() => setViewingImages(null)}>✕ Close</button>
            </div>
            <div className="ac-modal-images">
              {viewingImages.map((url, i) => (
                <img key={i} src={url} alt={`img-${i + 1}`} onClick={() => window.open(url, "_blank")} />
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminComplaints;