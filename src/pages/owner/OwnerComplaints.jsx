import { FaExclamationTriangle, FaHome, FaInbox, FaImage, FaUser, FaCommentDots, FaPaperclip } from "react-icons/fa";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../api/axios";
import Swal from "sweetalert2";
import "./OwnerComplaints.css";

const STATUS_COLOR = {
  PENDING: { bg: "#fef9c3", color: "#92400e" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1d4ed8" },
  RESOLVED: { bg: "#dcfce7", color: "#166534" },
};

const TABS = ["ALL", "PENDING", "IN_PROGRESS", "RESOLVED"];

const OwnerComplaints = () => {
  const { setTopbarProps } = useOutletContext();

  // Clear the dashboard notification pill when this page is visited
  useEffect(() => {
    localStorage.setItem("seen_complaints_count", "999999");
  }, []);

  const [pgs, setPgs] = useState([]);
  const [selectedPg, setSelectedPg] = useState("");

  // allComplaints — NEVER touched by any filter; drives stat cards only
  const [allComplaints, setAllComplaints] = useState([]);

  // complaints — filtered by PG selection; drives table
  const [complaints, setComplaints] = useState([]);

  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [filterCity, setFilterCity] = useState("");
  const [cities, setCities] = useState([]);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [viewingImages, setViewingImages] = useState(null);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef(null);
  const [pgDropdownOpen, setPgDropdownOpen] = useState(false);
  const pgDropdownRef = useRef(null);

// Close city dropdown on outside click
useEffect(() => {
  const handleClickOutside = (e) => {
    if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
      setCityDropdownOpen(false);
    }
    if (pgDropdownRef.current && !pgDropdownRef.current.contains(e.target)) {
      setPgDropdownOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  // ── Stats ALWAYS from allComplaints — never affected by any filter ──
  const summary = {
    total: allComplaints.length,
    PENDING: allComplaints.filter((c) => c.status === "PENDING").length,
    IN_PROGRESS: allComplaints.filter((c) => c.status === "IN_PROGRESS").length,
    RESOLVED: allComplaints.filter((c) => c.status === "RESOLVED").length,
  };

  // ── City filter client-side on table complaints ──
  const cityFiltered = filterCity
    ? complaints.filter((c) => c.city === filterCity || c.pgCity === filterCity)
    : complaints;

  // ── Tab filter only affects table ──
  const filteredComplaints = activeTab === "ALL"
    ? cityFiltered
    : cityFiltered.filter((c) => c.status === activeTab);

  const getCount = (tab) =>
    tab === "ALL" ? cityFiltered.length : cityFiltered.filter((c) => c.status === tab).length;

  // ── Fetch the FULL owner complaints list (for stat cards) via the new /owner/all endpoint ──
  const fetchAllOwnerComplaints = useCallback(async () => {
    try {
      const res = await api.get("/complaints/owner/all");
      return res.data || [];
    } catch {
      return [];
    }
  }, []);

  // ── Fallback: fetch all by iterating each PG (used only if /owner/all fails) ──
  const fetchAllByPgs = useCallback(async (pgList) => {
    if (!pgList || pgList.length === 0) return [];
    const results = await Promise.all(
      pgList.map((pg) =>
        api.get(`/complaints/pg/${pg.id}`).then((r) => r.data || []).catch(() => [])
      )
    );
    const merged = Object.values(
      results.flat().reduce((acc, c) => { acc[c.id] = c; return acc; }, {})
    );
    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return merged;
  }, []);

  // ── Refresh stat cards — always fetches from /owner/all, never affected by PG filter ──
  const refreshStats = useCallback(async (pgList) => {
    let all = await fetchAllOwnerComplaints();
    if (!all.length && pgList?.length) {
      all = await fetchAllByPgs(pgList);
    }
    setAllComplaints(all);
    return all;
  }, [fetchAllOwnerComplaints, fetchAllByPgs]);

  // ── On initial load: fetch stats only, do NOT load table data ──
  const loadInitial = useCallback(async (pgList) => {
    setLoading(true);
    try {
      await refreshStats(pgList);
    } finally {
      setLoading(false);
    }
  }, [refreshStats]);

  // ── When a PG is selected: table narrows to that PG, stat cards stay from full list ──
  const loadForPg = useCallback(async (pgId, pgList) => {
    setLoading(true);
    try {
      const [pgComplaints] = await Promise.all([
        api.get(`/complaints/pg/${pgId}`).then((r) => r.data || []).catch(() => []),
        refreshStats(pgList),
      ]);
      setComplaints(pgComplaints);
      setSelectedPg(pgId);
    } finally {
      setLoading(false);
    }
  }, [refreshStats]);

  // ── Fetch PGs first, then load stats only ──
  useEffect(() => {
    setTopbarProps({ title: "Complaints", subtitle: "Manage tenant complaints" });
    const bell = document.querySelector(".notif-bell-wrapper");
    if (bell) bell.style.display = "none";

   api.get("/owner/pgs")
  .then((res) => {
    const pgList = res.data || [];
    setPgs(pgList);
    if (pgList.length > 0) {
      loadForPg(pgList[0].id, pgList);
    } else {
      loadInitial(pgList);
    }
  })
  .catch(() => setLoading(false));

    api.get("/public/cities").then((res) => setCities(res.data || [])).catch(() => { });

    return () => {
      const bell = document.querySelector(".notif-bell-wrapper");
      if (bell) bell.style.display = "";
    };
  // eslint-disable-next-line
  }, [setTopbarProps, loadInitial]);

  const handleUpdateStatus = async (id, status, ownerResponse) => {
    try {
      await api.put(`/complaints/${id}`, { status, ownerResponse });
      Swal.fire({ icon: "success", title: "Updated!", timer: 1500, showConfirmButton: false });
      setResponding(null);
      setResponseText("");

      await refreshStats(pgs);

      if (selectedPg) {
        const pgData = await api.get(`/complaints/pg/${selectedPg}`).then((r) => r.data || []).catch(() => []);
        setComplaints(pgData);
      }
    } catch { }
  };

  const handlePgChange = (pgId) => {
    setActiveTab("ALL");
    setFilterCity("");
    if (!pgId) {
      setSelectedPg("");
      setComplaints([]);
    } else {
      loadForPg(pgId, pgs);
    }
  };

  const showTable = !!selectedPg;

  return (
    <div style={{ padding: "24px" }}>

      {/* ══ HEADER ══ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
          <FaExclamationTriangle /> Tenant Complaints
        </h2>
      </div>

      {/* ══ STAT CARDS — always full dataset, never filtered ══ */}
      <div className="oc-stats-row">
        <div className="oc-stat-card" style={{ borderTopColor: "#5B5BD6" }}>
          <div className="oc-stat-icon" style={{ background: "#eef2ff" }}>
            <i className="bi bi-exclamation-circle-fill" style={{ color: "#5B5BD6" }}></i>
          </div>
          <div className="oc-stat-info">
            <div className="oc-stat-value">{summary.total}</div>
            <div className="oc-stat-label">Total Complaints</div>
            <div className="oc-stat-sub">All tenant complaints</div>
          </div>
        </div>

        <div className="oc-stat-card" style={{ borderTopColor: "#d97706" }}>
          <div className="oc-stat-icon" style={{ background: "#fef9c3" }}>
            <i className="bi bi-hourglass-split" style={{ color: "#d97706" }}></i>
          </div>
          <div className="oc-stat-info">
            <div className="oc-stat-value">{summary.PENDING}</div>
            <div className="oc-stat-label">Pending</div>
            <div className="oc-stat-sub">Awaiting action</div>
          </div>
        </div>

        <div className="oc-stat-card" style={{ borderTopColor: "#1d4ed8" }}>
          <div className="oc-stat-icon" style={{ background: "#dbeafe" }}>
            <i className="bi bi-arrow-repeat" style={{ color: "#1d4ed8" }}></i>
          </div>
          <div className="oc-stat-info">
            <div className="oc-stat-value">{summary.IN_PROGRESS}</div>
            <div className="oc-stat-label">In Progress</div>
            <div className="oc-stat-sub">Being worked on</div>
          </div>
        </div>

        <div className="oc-stat-card" style={{ borderTopColor: "#16a34a" }}>
          <div className="oc-stat-icon" style={{ background: "#dcfce7" }}>
            <i className="bi bi-check-circle-fill" style={{ color: "#16a34a" }}></i>
          </div>
          <div className="oc-stat-info">
            <div className="oc-stat-value">{summary.RESOLVED}</div>
            <div className="oc-stat-label">Resolved</div>
            <div className="oc-stat-sub">Successfully closed</div>
          </div>
        </div>
      </div>

      {/* ══ FILTERS + TABS ══ */}
      <div className="oc-filters">
{/* ── PG Selector: static label if only 1 PG, else dropdown ── */}
{pgs.length === 1 ? (
  <div
    style={{
      padding: "8px 14px",
      borderRadius: "8px",
      border: "1.5px solid #e5e7eb",
      fontSize: "13px",
      background: "#f3f4f6",
      color: "#374151",
      fontWeight: 600,
      minWidth: "150px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    }}
  >
    <FaHome /> {pgs[0].name}
  </div>
) : (
  <div ref={pgDropdownRef} style={{ position: "relative" }}>
    <button
      onClick={() => setPgDropdownOpen((o) => !o)}
      style={{
        padding: "8px 14px",
        borderRadius: "8px",
        border: "1.5px solid #e5e7eb",
        fontSize: "13px",
        background: "#fff",
        cursor: "pointer",
        minWidth: "150px",
        textAlign: "left",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
        color: "#374151",
        fontFamily: "inherit",
      }}
    >
      <span>{pgs.find((pg) => pg.id === selectedPg)?.name || "Select a PG"}</span>
      <span style={{
        fontSize: "10px",
        color: "#94a3b8",
        transition: "transform 0.2s",
        transform: pgDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
        display: "inline-block",
      }}>▼</span>
    </button>

    {pgDropdownOpen && (
      <div style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        zIndex: 999,
        background: "#fff",
        border: "1.5px solid #e5e7eb",
        borderRadius: "10px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        maxHeight: "240px",
        overflowY: "auto",
        minWidth: "180px",
      }}>
        {[{ id: "", name: "Select a PG" }, ...pgs].map((pg) => (
          <div
            key={pg.id || "__none__"}
            onClick={() => {
              handlePgChange(pg.id);
              setPgDropdownOpen(false);
            }}
            style={{
              padding: "9px 14px",
              fontSize: "13px",
              cursor: "pointer",
              color: selectedPg === pg.id ? "#4f46e5" : "#374151",
              fontWeight: selectedPg === pg.id ? 700 : 400,
              background: selectedPg === pg.id ? "#eef2ff" : "transparent",
            }}
            onMouseEnter={(e) => {
              if (selectedPg !== pg.id) e.currentTarget.style.background = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              if (selectedPg !== pg.id) e.currentTarget.style.background = "transparent";
            }}
          >
            {pg.name}
          </div>
        ))}
      </div>
    )}
  </div>
)}

        {/* ── Custom City Dropdown — always opens downward ── */}
        <div ref={cityDropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setCityDropdownOpen((o) => !o)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1.5px solid #e5e7eb",
              fontSize: "13px",
              background: "#fff",
              cursor: "pointer",
              minWidth: "130px",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              color: "#374151",
              fontFamily: "inherit",
            }}
          >
            <span>{filterCity || "All Cities"}</span>
            <span style={{
              fontSize: "10px",
              color: "#94a3b8",
              transition: "transform 0.2s",
              transform: cityDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              display: "inline-block",
            }}>▼</span>
          </button>

          {cityDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                zIndex: 999,
                background: "#fff",
                border: "1.5px solid #e5e7eb",
                borderRadius: "10px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                maxHeight: "240px",
                overflowY: "auto",
                minWidth: "160px",
              }}
            >
              {["", ...cities].map((city) => (
                <div
                  key={city || "__all__"}
                  onClick={() => {
                    setFilterCity(city);
                    setActiveTab("ALL");
                    setCityDropdownOpen(false);
                  }}
                  style={{
                    padding: "9px 14px",
                    fontSize: "13px",
                    cursor: "pointer",
                    color: filterCity === city ? "#4f46e5" : "#374151",
                    fontWeight: filterCity === city ? 700 : 400,
                    background: filterCity === city ? "#eef2ff" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (filterCity !== city) e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (filterCity !== city) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {city || "All Cities"}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="oc-tabs-row" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="oc-tab-btn"
                style={{
                  border: isActive ? "none" : "1.5px solid #e5e7eb",
                  background: isActive ? "#4f46e5" : "#fff",
                  color: isActive ? "#fff" : "#374151",
                }}
              >
                {tab.replace("_", " ")} ({getCount(tab)})
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      {!showTable ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "42px", marginBottom: "12px", color: "#64748b" }}><FaHome /></div>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#64748b", margin: "0 0 6px" }}>
            Select a PG to view complaints
          </p>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
            Choose a PG from the dropdown above to see its tenant complaints.
          </p>
        </div>
      ) : loading ? (
        <p style={{ color: "#64748b" }}>Loading complaints...</p>
      ) : filteredComplaints.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px", color: "#64748b" }}><FaInbox /></div>
          <p>No {activeTab === "ALL" ? "" : activeTab.replace("_", " ").toLowerCase()} complaints</p>
        </div>
      ) : (
        <>
          {/* ══ DESKTOP TABLE ══ */}
          <div
            className="oc-table"
            style={{
              background: "#fff",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div className="oc-table-head">
              {["SUBJECT", "TENANT", "CATEGORY", "FILED", "STATUS", "ACTIONS"].map((h) => (
                <div key={h}>{h}</div>
              ))}
            </div>

            {filteredComplaints.map((c, idx) => {
              const sc = STATUS_COLOR[c.status] || STATUS_COLOR.PENDING;
              return (
                <div key={c.id}>
                  <div className="oc-table-row">
                    <div>
                      <p style={{ fontWeight: 600, color: "#1e1b4b", fontSize: "13px", margin: 0 }}>{c.subject}</p>
                      <p style={{ fontSize: "11px", color: "#94a3b8", margin: "2px 0 0" }}>
                        {expandedDesc[c.id]
                          ? c.description
                          : c.description?.length > 80
                            ? c.description.slice(0, 80) + "…"
                            : c.description}
                        {c.description?.length > 80 && (
                          <span
                            onClick={() => setExpandedDesc((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                            style={{ color: "#4f46e5", fontSize: "11px", fontWeight: 600, cursor: "pointer", marginLeft: "4px" }}
                          >
                            {expandedDesc[c.id] ? "Read less" : "Read more"}
                          </span>
                        )}
                      </p>
                      {c.imageUrls?.length > 0 && (
                        <button
                          onClick={() => setViewingImages(c.imageUrls)}
                          style={{ marginTop: "6px", padding: "3px 8px", borderRadius: "6px", background: "#e0e7ff", color: "#4f46e5", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                        >
                          <FaImage /> View {c.imageUrls.length} Image{c.imageUrls.length > 1 ? "s" : ""}
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: "13px", color: "#374151" }}><FaUser /> {c.userName}</div>

                    <div>
                      <span style={{ padding: "3px 8px", borderRadius: "6px", background: "#f1f5f9", color: "#475569", fontSize: "11px", fontWeight: 600 }}>
                        {c.category}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "#64748b" }}>{c.createdAt}</div>

                    <div>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: sc.bg, color: sc.color }}>
                        {c.status}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {c.status !== "IN_PROGRESS" && (
                        <button
                          className="oc-action-btn oc-btn-in-progress"
                          onClick={() => handleUpdateStatus(c.id, "IN_PROGRESS", c.ownerResponse)}
                        >
                          In Progress
                        </button>
                      )}
                      {c.status !== "RESOLVED" && (
                        <button
                          className="oc-action-btn oc-btn-resolved"
                          onClick={() => handleUpdateStatus(c.id, "RESOLVED", c.ownerResponse)}
                        >
                          Resolved
                        </button>
                      )}
                      <button
                        className="oc-action-btn oc-btn-respond"
                        onClick={() => { setResponding(responding === c.id ? null : c.id); setResponseText(c.ownerResponse || ""); }}
                      >
                        <FaCommentDots /> Respond
                      </button>
                    </div>
                  </div>

                  {c.ownerResponse && (
                    <div className="oc-response-container">
                      <div className="oc-response-box">
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "#166534", marginBottom: "2px" }}>Your Response</p>
                        <p style={{ fontSize: "12px", color: "#166534", margin: 0 }}>{c.ownerResponse}</p>
                      </div>
                    </div>
                  )}

                  {responding === c.id && (
                    <div className="oc-respond-form">
                      <textarea
                        rows={3}
                        placeholder="Type your response to the tenant..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }}
                      />
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button
                          onClick={() => handleUpdateStatus(c.id, c.status, responseText)}
                          style={{ padding: "8px 16px", borderRadius: "7px", background: "#4f46e5", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                        >
                          Send Response
                        </button>
                        <button
                          onClick={() => { setResponding(null); setResponseText(""); }}
                          style={{ padding: "8px 16px", borderRadius: "7px", background: "#f1f5f9", color: "#475569", border: "none", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ══ MOBILE CARD LIST ══ */}
          <div className="oc-card-list">
            {filteredComplaints.map((c) => {
              const sc = STATUS_COLOR[c.status] || STATUS_COLOR.PENDING;
              const isExpanded = expandedDesc[c.id];
              const DESC_LIMIT = 100;

              return (
                <div className="oc-card" key={c.id}>
                  <div className="oc-card-header">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="oc-card-subject">{c.subject}</p>
                      <span style={{ padding: "3px 8px", borderRadius: "6px", background: "#f1f5f9", color: "#475569", fontSize: "11px", fontWeight: 600 }}>
                        {c.category}
                      </span>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                      {c.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="oc-card-body">
                    <div className="oc-card-row">
                      <span className="oc-card-label">Tenant</span>
                      <span className="oc-card-val"><FaUser /> {c.userName}</span>
                    </div>
                    <div className="oc-card-row">
                      <span className="oc-card-label">Filed</span>
                      <span className="oc-card-val" style={{ fontSize: "12px", color: "#64748b" }}>{c.createdAt}</span>
                    </div>
                    {c.description && (
                      <div className="oc-card-row">
                        <span className="oc-card-label">Details</span>
                        <span className="oc-card-val" style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                          {isExpanded
                            ? c.description
                            : c.description.length > DESC_LIMIT
                              ? c.description.slice(0, DESC_LIMIT) + "…"
                              : c.description}
                          {c.description.length > DESC_LIMIT && (
                            <span
                              onClick={() => setExpandedDesc((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                              style={{ color: "#4f46e5", fontSize: "11px", fontWeight: 600, cursor: "pointer", marginLeft: "4px" }}
                            >
                              {isExpanded ? "Read less" : "Read more"}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {c.imageUrls?.length > 0 && (
                      <div>
                        <button
                          onClick={() => setViewingImages(c.imageUrls)}
                          style={{ padding: "4px 10px", borderRadius: "6px", background: "#e0e7ff", color: "#4f46e5", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                        >
                          <FaImage /> View {c.imageUrls.length} Image{c.imageUrls.length > 1 ? "s" : ""}
                        </button>
                      </div>
                    )}
                    {c.ownerResponse && (
                      <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "8px 12px", borderLeft: "3px solid #22c55e" }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "#166534", marginBottom: "2px" }}>Your Response</p>
                        <p style={{ fontSize: "12px", color: "#166634", margin: 0 }}>{c.ownerResponse}</p>
                      </div>
                    )}
                  </div>

                  <div className="oc-card-actions">
                    {c.status !== "IN_PROGRESS" && (
                      <button
                        onClick={() => handleUpdateStatus(c.id, "IN_PROGRESS", c.ownerResponse)}
                        style={{ background: "#dbeafe", color: "#1d4ed8" }}
                      >
                        In Progress
                      </button>
                    )}
                    {c.status !== "RESOLVED" && (
                      <button
                        onClick={() => handleUpdateStatus(c.id, "RESOLVED", c.ownerResponse)}
                        style={{ background: "#dcfce7", color: "#166534" }}
                      >
                        Resolved
                      </button>
                    )}
                    <button
                      onClick={() => { setResponding(responding === c.id ? null : c.id); setResponseText(c.ownerResponse || ""); }}
                      style={{ background: "#f1f5f9", color: "#475569" }}
                    >
                      <FaCommentDots /> Respond
                    </button>
                  </div>

                  {responding === c.id && (
                    <div className="oc-respond-box">
                      <textarea
                        rows={3}
                        placeholder="Type your response to the tenant..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                      />
                      <div className="oc-respond-actions">
                        <button
                          onClick={() => handleUpdateStatus(c.id, c.status, responseText)}
                          style={{ background: "#4f46e5", color: "#fff" }}
                        >
                          Send Response
                        </button>
                        <button
                          onClick={() => { setResponding(null); setResponseText(""); }}
                          style={{ background: "#f1f5f9", color: "#475569" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══ IMAGE VIEWER MODAL ══ */}
      {viewingImages && (
        <div
          onClick={() => setViewingImages(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "14px", padding: "20px", maxWidth: "800px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e1b4b" }}><FaPaperclip /> Complaint Images</h3>
              <button
                onClick={() => setViewingImages(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
              >
                ✕ Close
              </button>
            </div>
            <div className="oc-modal-images">
              {viewingImages.map((url, i) => (
                <img key={i} src={url} alt={`img-${i + 1}`} onClick={() => window.open(url, "_blank")} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerComplaints;