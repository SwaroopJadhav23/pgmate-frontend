import { FaHome } from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import "./AdminPGEnquiries.css";
import { TableSkeleton, OwnerCardSkeleton } from "../public/Skeleton";

const PAGE_SIZE = 20;

const getInitials = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const formatDateTime = (isoString) => {
  if (!isoString) return ["-", ""];
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return ["-", ""];
  const datePart = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");
  const timePart = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return [datePart, timePart];
};


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
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
    overflow: "hidden",
  };

  return createPortal(
    <div className="enq-action-menu" style={style} onClick={(ev) => ev.stopPropagation()}>
      <button
        className="enq-action-menu-item enq-action-delete"
        onClick={onDelete}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "8px 14px",
          background: "transparent",
          border: "none",
          color: "#dc2626",
          cursor: "pointer",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <i className="bi bi-trash3-fill" /> Delete
      </button>
    </div>,
    document.body,
  );
};

const AdminOwnerEnquiries = ({ basePath = "/admin/admin-enquiries" }) => {
  const [enquiries, setEnquiries] = useState([]);


  const stats = {
    contacted: enquiries.filter((e) => e.status === "CONTACTED").length,
    newEnq: enquiries.filter((e) => e.status === "NEW").length,
    single: enquiries.filter((e) => e.sharingType === "SINGLE").length,
    triple: enquiries.filter((e) => e.sharingType === "TRIPLE").length,
  };

  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Add with other useState declarations
  const [sortDir, setSortDir] = useState("desc");

  const toggleSort = () => setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
  const [filterOpen, setFilterOpen] = useState(false);
  const resetFilters = () => setFilters({ pg: "", owner: "", status: "", sharing: "", room: "", contactMethod: "" });

  const [summary, setSummary] = useState({
    pgs: [],
    owners: [],
    statuses: [],
    sharingTypes: [],
    roomTypes: [],
  });

  const [filters, setFilters] = useState({
    pg: "",
    owner: "",
    status: "",
    sharing: "",
    room: "",
    contactMethod: "",
  });

  // { id, rect } of the enquiry whose action menu is open, or null
  const [menuAnchor, setMenuAnchor] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get(`${basePath}/summary`);
      setSummary({
        pgs: res.data?.pgs || [],
        owners: res.data?.owners || [],
        statuses: res.data?.statuses || [],
        sharingTypes: res.data?.sharingTypes || [],
        roomTypes: res.data?.roomTypes || [],
      });
    } catch (err) {
      console.error("Failed to load enquiry summary", err);
    }
  }, [basePath]);

  const load = useCallback(async (nextPage = 0, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);

      const params = new URLSearchParams();
      params.append("page", nextPage);
      params.append("size", PAGE_SIZE);
      if (search.trim()) params.append("search", search.trim());
      if (filters.pg) params.append("pg", filters.pg);
      if (filters.owner) params.append("owner", filters.owner);
      if (filters.status) params.append("status", filters.status);
      if (filters.sharing) params.append("sharing", filters.sharing);
      if (filters.room) params.append("room", filters.room);
      if (filters.contactMethod) params.append("contactMethod", filters.contactMethod);
      params.append("sortDir", sortDir);

      const res = await api.get(`${basePath}/paged?${params.toString()}`);
      const content = res.data?.content || [];
      const totalPages = res.data?.totalPages || 0;

      setEnquiries((prev) => (append ? [...prev, ...content] : content));
      setPage(nextPage);
      setTotalElements(res.data?.totalElements || 0);
      setHasMore(nextPage + 1 < totalPages);
    } catch (err) {
      console.error("Failed to load enquiries", err);
      toast.error("Failed to load enquiries.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [basePath, filters.contactMethod, filters.owner, filters.pg, filters.room, filters.sharing, filters.status, search, sortDir]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    load(0, false);
  }, [load]);

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const hasFilters = useMemo(
    () => Boolean(search || filters.pg || filters.owner || filters.status || filters.sharing || filters.room || filters.contactMethod),
    [filters.contactMethod, filters.owner, filters.pg, filters.room, filters.sharing, filters.status, search]
  );

  const copyPhone = (phone, id) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleMenu = (ev, id) => {
    ev.stopPropagation();
    const rect = ev.currentTarget.getBoundingClientRect();
    setMenuAnchor((prev) => (prev?.id === id ? null : { id, rect }));
  };

  const handleDeleteClick = (id) => {
    setMenuAnchor(null);
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
      await api.delete(`${basePath}/${id}`);
      setTotalElements((prev) => Math.max(0, prev - 1));
      await load(0, false);
      toast.success("Enquiry deleted.");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete enquiry.");
    }
  };

  const PhoneActions = ({ phone, id }) => (
    <div className="pgenq-card-phone">
      <span className="phone-number">{phone || "-"}</span>
      {phone && (
        <>
          <button className="icon-btn" title="Copy" onClick={() => copyPhone(phone, id)}>
            <i className={`bi ${copiedId === id ? "bi-check2 text-success" : "bi-copy"}`}></i>
          </button>
          <a href={`tel:${phone}`} className="icon-btn" title="Call">
            <i className="bi bi-telephone-fill text-success"></i>
          </a>
          <a href={`https://wa.me/91${phone}`} target="_blank" rel="noopener noreferrer" className="icon-btn" title="WhatsApp">
            <i className="bi bi-whatsapp text-success"></i>
          </a>
        </>
      )}
    </div>
  );

  const emptyMessage = hasFilters ? "No enquiries found for the selected filters." : "No enquiries found";

  return (
    <DashboardLayout title="PG Enquiries" subtitle="Platform enquiry management">

      {/* STAT CARDS */}
      <div className="enq-stats-row">
        <div className="enq-stat-card enq-stat-warning">
          <div className="enq-stat-icon enq-stat-warning-icon">
            <i className="bi bi-envelope-check-fill"></i>
          </div>
          <div className="enq-stat-info">
            <div className="enq-stat-value">{loading ? "—" : stats.contacted}</div>
            <div className="enq-stat-label">Contacted</div>
            <div className="enq-stat-sub">Reached out</div>
          </div>
        </div>

        <div className="enq-stat-card enq-stat-primary">
          <div className="enq-stat-icon enq-stat-primary-icon">
            <i className="bi bi-bell-fill"></i>
          </div>
          <div className="enq-stat-info">
            <div className="enq-stat-value">{loading ? "—" : stats.newEnq}</div>
            <div className="enq-stat-label">New</div>
            <div className="enq-stat-sub">Fresh enquiries</div>
          </div>
        </div>

        <div className="enq-stat-card enq-stat-success">
          <div className="enq-stat-icon enq-stat-success-icon">
            <i className="bi bi-person-fill"></i>
          </div>
          <div className="enq-stat-info">
            <div className="enq-stat-value">{loading ? "—" : stats.single}</div>
            <div className="enq-stat-label">Single Sharing</div>
            <div className="enq-stat-sub">Single occupancy</div>
          </div>
        </div>

        <div className="enq-stat-card enq-stat-danger">
          <div className="enq-stat-icon enq-stat-danger-icon">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="enq-stat-info">
            <div className="enq-stat-value">{loading ? "—" : stats.triple}</div>
            <div className="enq-stat-label">Triple Sharing</div>
            <div className="enq-stat-sub">Triple occupancy</div>
          </div>
        </div>
      </div>


      {/* Search bar + Filters toggle */}
<div className="pgenq-topbar">
  <div className="pgenq-search-wrapper">
    <i className="bi bi-search search-icon"></i>
    <input
      type="text"
      className="form-control"
      placeholder="Search name / phone..."
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
    />
  </div>
  <button
    className={`pgenq-filter-toggle ${filterOpen ? "active" : ""} ${hasFilters ? "has-filters" : ""}`}
    onClick={() => setFilterOpen(o => !o)}
  >
    <i className="bi bi-sliders"></i>
    Filters
    {hasFilters && <span className="pgenq-filter-dot" />}
  </button>
</div>

{/* Collapsible filter panel */}
{filterOpen && (
  <div className="pgenq-filter-panel">
    <div className="pgenq-filter-grid">

      <div className="pgenq-field">
        <label className="pgenq-field-label">PG NAME</label>
        <select name="pg" className="pgenq-field-input" value={filters.pg} onChange={handleFilterChange}>
          <option value="">All PGs</option>
          {summary.pgs.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="pgenq-field">
        <label className="pgenq-field-label">OWNER</label>
        <select name="owner" className="pgenq-field-input" value={filters.owner} onChange={handleFilterChange}>
          <option value="">All Owners</option>
          {summary.owners.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>

      <div className="pgenq-field">
        <label className="pgenq-field-label">STATUS</label>
        <select name="status" className="pgenq-field-input" value={filters.status} onChange={handleFilterChange}>
          <option value="">All</option>
          {summary.statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="pgenq-field">
        <label className="pgenq-field-label">SHARING</label>
        <select name="sharing" className="pgenq-field-input" value={filters.sharing} onChange={handleFilterChange}>
          <option value="">All</option>
          {summary.sharingTypes.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="pgenq-field">
        <label className="pgenq-field-label">ROOM TYPE</label>
        <select name="room" className="pgenq-field-input" value={filters.room} onChange={handleFilterChange}>
          <option value="">All</option>
          {summary.roomTypes.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="pgenq-field">
        <label className="pgenq-field-label">SORT</label>
        <button className="pgenq-field-input pgenq-sort-inline" onClick={toggleSort}>
          <i className={`bi ${sortDir === "desc" ? "bi-sort-down" : "bi-sort-up"}`}></i>
          {sortDir === "desc" ? "Newest First" : "Oldest First"}
        </button>
      </div>

      <div className="pgenq-field">
        <label className="pgenq-field-label">VIA</label>
        <select name="contactMethod" className="pgenq-field-input" value={filters.contactMethod} onChange={handleFilterChange}>
          <option value="">All</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="ENQUIRY">Enquiry</option>
        </select>
      </div>

    </div>

    <div className="pgenq-filter-actions">
      <button className="pgenq-btn-reset" onClick={() => { resetFilters(); setFilterOpen(false); }}>
        Reset All
      </button>
      <button className="pgenq-btn-apply" onClick={() => setFilterOpen(false)}>
        Apply
      </button>
    </div>
  </div>
)}

      <p className="pgenq-result-count">
        Showing <strong>{enquiries.length}</strong> of {totalElements} enquiries
      </p>

      <div className="pgenq-table-wrapper">
        <table className="pgenq-table">
          <thead>
            <tr>
              <th><div className="th-content">Sr No <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th><div className="th-content">Date <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th><div className="th-content">PG <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th><div className="th-content">Owner <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th><div className="th-content">Enquirer <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th><div className="th-content">Phone <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th><div className="th-content">Email <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th><div className="th-content">Note <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th><div className="th-content">Sharing <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th><div className="th-content">Room <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th><div className="th-content">Via <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th><div className="th-content">Status <i className="bi bi-arrow-down-up pgenq-sort-icon"></i></div></th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={8} cols={12} />
            ) : enquiries.length === 0 ? (
              <tr>
                <td colSpan="12" className="pgenq-empty">{emptyMessage}</td>
              </tr>
            ) : (
              enquiries.map((e, index) => (
                <tr key={e.id}>
                  <td>{page * PAGE_SIZE + index + 1}</td>
                  <td>
                    {(() => {
                      const [d, t] = formatDateTime(e.createdAt || e.date || e.enquiryDate);
                      return (
                        <div className="pgenq-date-cell">
                          <div className="pgenq-date-part">{d}</div>
                          {t && <div className="pgenq-time-part">{t}</div>}
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="pgenq-name-cell">
                      <div className="pgenq-pg-icon"><FaHome /></div>
                      <span className="pgenq-pg-name">{e.pgName || "-"}</span>
                    </div>
                  </td>
                  <td className="enq-table-muted">{e.ownerName || "-"}</td>
                  <td>
                    <div className="enq-table-flex-center">
                      <span className="enq-avatar-sm">{getInitials(e.name)}</span>
                      {e.name || "-"}
                    </div>
                  </td>
                  <td><PhoneActions phone={e.phone} id={e.id} /></td>
                  <td className="enq-table-muted">{e.email || "-"}</td>
                  <td className="enq-table-truncate">{e.adminNote || "-"}</td>
                  <td>{e.sharingType ? <span className="sharing-badge">{e.sharingType}</span> : "-"}</td>
                  <td className="enq-table-muted">{e.roomTypeName || "-"}</td>
                  <td>
                    {e.contactMethod === "WHATSAPP"
                      ? <span style={{ color: "#25D366", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><i className="bi bi-whatsapp" /> WA</span>
                      : <span style={{ color: "#6b7280", fontSize: 13 }}>Form</span>
                    }
                  </td>
                  <td><span className={`status-pill ${e.status}`}>{e.status}</span></td>
                  <td className="enq-action-cell" onClick={(ev) => ev.stopPropagation()}>
                    <button
                      className="pgenq-action-dots"
                      title="Actions"
                      onClick={(ev) => toggleMenu(ev, e.id)}
                    >
                      <i className="bi bi-three-dots-vertical"></i>
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

      <div className="pgenq-card-list">
        {loading ? (
          <OwnerCardSkeleton count={4} />
        ) : enquiries.length === 0 ? (
          <div className="pgenq-empty">{emptyMessage}</div>
        ) : (
          enquiries.map((e, index) => (
            <div key={e.id} className="pgenq-card">
              <div className="pgenq-card-bar" />
              <div className="pgenq-card-body">

                <div className="enq-card-header-flex">
                  <span>#{page * PAGE_SIZE + index + 1} • {formatDateTime(e.createdAt || e.date || e.enquiryDate).join(" ")}</span>
                  <div className="enq-action-cell" onClick={(ev) => ev.stopPropagation()}>
                    <button
                      className="pgenq-action-dots"
                      title="Actions"
                      onClick={(ev) => toggleMenu(ev, e.id)}
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    {menuAnchor?.id === e.id && (
                      <ActionMenu
                        anchorRect={menuAnchor.rect}
                        onDelete={() => handleDeleteClick(e.id)}
                      />
                    )}
                  </div>
                </div>

                <div className="pgenq-card-top">
                  <div className="pgenq-card-pg">
                    <div className="pgenq-pg-icon"><FaHome /></div>
                    <div>
                      <div className="pgenq-card-pgname">{e.pgName || "-"}</div>
                      <div className="pgenq-card-owner">{e.ownerName || "-"}</div>
                    </div>
                  </div>
                  <span className={`status-pill ${e.status}`}>{e.status}</span>
                </div>

                <div className="pgenq-card-enquirer">
                  <span className="enq-avatar-sm enq-avatar-sm-fixed">
                    {getInitials(e.name)}
                  </span>
                  <div className="pgenq-card-enq-info">
                    <div className="pgenq-card-enq-name">{e.name || "-"}</div>
                    <div className="pgenq-card-enq-email">{e.email || "-"}</div>
                  </div>
                </div>

                <PhoneActions phone={e.phone} id={`card-${e.id}`} />

                <div className="pgenq-card-meta">
                  {e.sharingType && (
                    <div className="pgenq-card-meta-item">
                      <i className="bi bi-people-fill"></i>{e.sharingType}
                    </div>
                  )}
                  {e.roomTypeName && (
                    <div className="pgenq-card-meta-item">
                      <i className="bi bi-door-open-fill"></i>{e.roomTypeName}
                    </div>
                  )}
                  {e.contactMethod === "WHATSAPP" && (
                    <div className="pgenq-card-meta-item" style={{ color: "#25D366", fontWeight: 600 }}>
                      <i className="bi bi-whatsapp"></i> via WhatsApp
                    </div>
                  )}
                </div>

                {e.adminNote && (
                  <div className="pgenq-card-note">{e.adminNote}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {hasMore && !loading && (
        <div className="pgenq-load-more-wrap">
          <button
            className="pgenq-load-more-btn"
            onClick={() => load(page + 1, true)}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminOwnerEnquiries;