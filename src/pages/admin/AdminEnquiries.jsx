import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./AdminEnquiries.css";
import { TableSkeleton, OwnerCardSkeleton } from "../public/Skeleton";

const PAGE_SIZE = 20;

const getInitials = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

// Renders the 3-dot action menu into document.body via portal, positioned
// with `fixed` coords from the trigger button's bounding rect. This escapes
// any parent `overflow: auto/hidden` (e.g. the horizontally scrollable
// desktop table wrapper), so the menu never gets clipped for the last rows.
// Hoisted OUTSIDE AdminEnquiries so it's never recreated on parent re-render
// (that was the earlier bug: recreating it each render remounted it and
// reset its position, so the menu always snapped to top:0,left:0).
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

const AdminEnquiries = ({ basePath = "/admin/enquiries" }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const stats = {
    cities: cities.length,
    newEnq: enquiries.filter((e) => e.status === "NEW").length,
    contacted: enquiries.filter((e) => e.status === "CONTACTED").length,
    closed: enquiries.filter((e) => e.status === "CLOSED").length,
  };
  const [loadingMore, setLoadingMore] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");

  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // { id, rect } of the enquiry whose action menu is open, or null
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    api.get(`${basePath}/summary`)
      .then(res => setCities(res.data?.cities || []))
      .catch(err => console.error("Failed to load summary", err));
  }, [basePath]);

  const loadEnquiries = useCallback(async (nextPage = 0, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);

      const params = new URLSearchParams();
      params.append("page", nextPage);
      params.append("size", PAGE_SIZE);
      if (search.trim()) params.append("search", search.trim());
      if (cityFilter.trim()) params.append("city", cityFilter.trim());
      if (statusFilter.trim()) params.append("status", statusFilter.trim());
      if (sortOrder) params.append("sort", sortOrder);

      const res = await api.get(`${basePath}/paged?${params.toString()}`);
      const content = res.data?.content || [];
      const totalPages = res.data?.totalPages || 0;

      setEnquiries((prev) => (append ? [...prev, ...content] : content));
      setPage(nextPage);
      setTotalElements(res.data?.totalElements || 0);
      setHasMore(nextPage + 1 < totalPages);
    } catch (err) {
      console.error("Failed to load enquiries", err);
      alert("Failed to load owner enquiries");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [basePath, search, cityFilter, statusFilter, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadEnquiries(0, false);
  }, [loadEnquiries]);

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
      const url = basePath.startsWith("/admin/enquiries")
        ? `${basePath}/${id}/status/${status}`
        : `${basePath}/${id}?status=${status}`;
      await api.put(url);
      loadEnquiries(0, false);
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Status update failed");
    }
  };

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
      await loadEnquiries(0, false);
      Swal.fire({
        title: "Deleted!",
        text: "Enquiry is deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Delete failed", err);
      Swal.fire({
        title: "Error",
        text: "Failed to delete enquiry",
        icon: "error",
      });
    }
  };

  const PhoneActions = ({ phone, id }) => (
    <div className="phone-wrapper">
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

  const emptyMessage = search ? `No owner enquiries found for "${search}".` : "No owner enquiries found.";

  return (
    <DashboardLayout
      title="Owner Enquiries"
      subtitle="All property listing requests from owners"
    >
      <div className="enquiry-management">

        {/* STAT CARDS */}
        <div className="oenq-stats-row">
          <div className="oenq-stat-card enq-stat-success">
            <div className="oenq-stat-icon enq-stat-success-icon">
              <i className="bi bi-geo-alt-fill"></i>
            </div>
            <div className="oenq-stat-info">
              <div className="oenq-stat-value">{loading ? "—" : stats.cities}</div>
              <div className="oenq-stat-label">Total Cities</div>
              <div className="oenq-stat-sub">Cities covered</div>
            </div>
          </div>

          <div className="oenq-stat-card enq-stat-primary">
            <div className="oenq-stat-icon enq-stat-primary-icon">
              <i className="bi bi-bell-fill"></i>
            </div>
            <div className="oenq-stat-info">
              <div className="oenq-stat-value">{loading ? "—" : stats.newEnq}</div>
              <div className="oenq-stat-label">New</div>
              <div className="oenq-stat-sub">Fresh enquiries</div>
            </div>
          </div>

          <div className="oenq-stat-card enq-stat-warning">
            <div className="oenq-stat-icon enq-stat-warning-icon">
              <i className="bi bi-envelope-check-fill"></i>
            </div>
            <div className="oenq-stat-info">
              <div className="oenq-stat-value">{loading ? "—" : stats.contacted}</div>
              <div className="oenq-stat-label">Contacted</div>
              <div className="oenq-stat-sub">Reached out</div>
            </div>
          </div>

          <div className="oenq-stat-card enq-stat-info">
            <div className="oenq-stat-icon enq-stat-info-icon">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div className="oenq-stat-info">
              <div className="oenq-stat-value">{loading ? "—" : stats.closed}</div>
              <div className="oenq-stat-label">Closed</div>
              <div className="oenq-stat-sub">Resolved enquiries</div>
            </div>
          </div>
        </div>

        {/* FILTER BAR — selects wrapped in grid div for mobile 2-col layout */}
        <div className="enquiry-filter-bar">
          <div className="enquiry-search-wrapper">
            <i className="bi bi-search search-icon"></i>
            <input
              className="form-control enquiry-search"
              placeholder="Search by name, email, phone, city..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="enquiry-filter-selects-row">
            <select
              className={`enquiry-filter-select ${cityFilter ? "active-filter" : ""}`}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">All Cities</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className={`enquiry-filter-select ${statusFilter ? "active-filter" : ""}`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <select
              className={`enquiry-filter-select ${sortOrder !== "newest" ? "active-filter" : ""}`}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">Name A→Z</option>
              <option value="za">Name Z→A</option>
            </select>
          </div>
        </div>

        <p className="enquiry-result-count">
          Showing <strong>{enquiries.length}</strong> of {totalElements} owner enquiries
        </p>

        <>
          <div className="enquiry-table-desktop">
            <div className="enquiry-table-wrapper">
              <table className="table pg-table mb-0">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Name</th>
                    <th>PG Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>PGs</th>
                    <th>Status</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton rows={8} cols={10} />
                  ) : enquiries.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="enquiry-empty">
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    enquiries.map((e, index) => (
                      <tr key={e.id}>
                        <td>{page * PAGE_SIZE + index + 1}</td>
                        <td>
                          <div className="enq-name-cell">
                            <div className="enq-avatar">{getInitials(e.name)}</div>
                            {e.name || "-"}
                          </div>
                        </td>
                        <td className="enq-table-muted">{e.pgName || "-"}</td>
                        <td className="enq-table-muted">{e.email || "-"}</td>
                        <td><PhoneActions phone={e.phone} id={e.id} /></td>
                        <td className="enq-table-muted">{e.city || "-"}</td>
                        <td className="enq-table-muted-center">{e.pgs ?? 0}</td>
                        <td>
                          <select
                            className="form-select"
                            value={e.status}
                            onChange={(ev) => updateStatus(e.id, ev.target.value)}
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </td>
                        <td className="enq-table-truncate">{e.message || "-"}</td>
                        <td className="enq-table-date">{e.createdAt || "-"}</td>
                        <td className="enq-action-cell" onClick={(ev) => ev.stopPropagation()}>
                          <button
                            className="icon-btn"
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
          </div>

          <div className="enquiry-cards-mobile">
            {loading ? (
              <OwnerCardSkeleton count={4} />
            ) : enquiries.length === 0 ? (
              <p className="enquiry-empty">{emptyMessage}</p>
            ) : (
              enquiries.map((e, index) => (
                <div key={e.id} className="enq-card">
                  <div className="enq-card-bar" />
                  <div className="enq-card-body">
                    <div className="enq-card-header-flex">
                      <span>#{page * PAGE_SIZE + index + 1}</span>
                      <div className="enq-action-cell" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          className="icon-btn"
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
                    <div className="enq-card-top">
                      <div className="enq-card-name-block">
                        <div className="enq-avatar">{getInitials(e.name)}</div>
                        <div>
                          <div className="enq-card-name">{e.name || "-"}</div>
                          <div className="enq-card-email">{e.email || "-"}</div>
                        </div>
                      </div>
                      <span className={`enq-status-pill ${e.status}`}>{e.status}</span>
                    </div>

                    <div className="enq-card-phone">
                      <PhoneActions phone={e.phone} id={`card-${e.id}`} />
                    </div>

                    {/* CHANGED: replaced meta row with labeled 2x2 field grid */}
                    <div className="enq-card-grid">
                      <div>
                        <div className="enq-card-field-label">
                          <i className="bi bi-geo-alt-fill enq-icon-mr"></i>City
                        </div>
                        <div className="enq-card-field-value">{e.city || "-"}</div>
                      </div>
                      <div>
                        <div className="enq-card-field-label">
                          <i className="bi bi-building enq-icon-mr"></i>PGs
                        </div>
                        <div className="enq-card-field-value">{e.pgs ?? 0} PG{e.pgs === 1 ? "" : "s"}</div>
                      </div>
                      <div>
                        <div className="enq-card-field-label">
                          <i className="bi bi-calendar3 enq-icon-mr"></i>Date
                        </div>
                        <div className="enq-card-field-value enq-field-value">{e.createdAt || "-"}</div>
                      </div>
                      <div className="enq-overflow-hidden">
                        <div className="enq-card-field-label">
                          <i className="bi bi-envelope enq-icon-mr"></i>Email
                        </div>
                        <div className="enq-card-field-value enq-field-value-truncate">{e.email || "-"}</div>
                      </div>
                    </div>

                    {e.message && (
                      <div className="enq-card-message">{e.message}</div>
                    )}

                    <div className="enq-card-footer">
                      {/* CHANGED: date moved to grid, serial number shown here instead */}
                      <span className="enq-card-date">#{page * PAGE_SIZE + index + 1}</span>
                      <select
                        className="form-select"
                        value={e.status}
                        onChange={(ev) => updateStatus(e.id, ev.target.value)}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>

        {hasMore && !loading && (
          <div className="enquiry-load-more-wrap">
            <button
              className="enquiry-load-more-btn"
              onClick={() => loadEnquiries(page + 1, true)}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminEnquiries;