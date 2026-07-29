import { FaTrash } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";
import { Button, Form } from "react-bootstrap";
import "./AdminOwners.css";
import AddOwnerModal from "./AddOwnerModal";
import { TableSkeleton, OwnerCardSkeleton } from "../public/Skeleton";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { useRef } from "react";

const EMPTY_FORM = { name: "", email: "", phone: "", city: "" };
const PAGE_SIZE = 20;

const formatName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const getInitials = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length === 1
    ? p[0][0].toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const AdminOwners = () => {
  const [owners, setOwners] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("ALL");
  const [filterPayment, setFilterPayment] = useState("ALL");
  const [sortDir, setSortDir] = useState("desc");
  const [summary, setSummary] = useState({
    total: 0,
    premium: 0,
    pro: 0,
    basic: 0,
    free: 0,
    paid: 0,
    unpaid: 0,
  });

  const [showEdit, setShowEdit] = useState(false);
  const [editOwnerId, setEditOwnerId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [idProofPreviews, setIdProofPreviews] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [idProofFiles, setIdProofFiles] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [showPgModal, setShowPgModal] = useState(false);
  const [ownerPgs, setOwnerPgs] = useState([]);
  const [pgLoading, setPgLoading] = useState(false);
  const [selectedOwnerName, setSelectedOwnerName] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pgDetail, setPgDetail] = useState(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState("image");
  const [showMediaViewer, setShowMediaViewer] = useState(false);

  const [showAddOwner, setShowAddOwner] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [expiryOwnerId, setExpiryOwnerId] = useState(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [cities, setCities] = useState([]);
  const [cityOpen, setCityOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [pgOpen, setPgOpen] = useState(false);
  const pgDropdownRef = useRef(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pgCount, setPgCount] = useState("ALL");

  useEffect(() => {
    api.get("/admin/owners/cities").then((res) => setCities(res.data || []));
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get("/admin/owners/summary");
      setSummary(res.data || {});
    } catch (error) {
      console.error("Failed to load owner summary", error);
    }
  }, []);



  const loadOwners = useCallback(
    async (nextPage = 0, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const res = await api.get("/admin/owners/paged", {
          params: {
            page: nextPage,
            size: PAGE_SIZE,
            search: search.trim() || undefined,
            plan: filterPlan !== "ALL" ? filterPlan : undefined,
            payment: filterPayment !== "ALL" ? filterPayment : undefined,
            city: cityFilter || undefined,
            pgCount: pgCount !== "ALL" ? pgCount : undefined,
            sortDir,
          },
        });

        const content = res.data?.content || [];
        setOwners((prev) => (append ? [...prev, ...content] : content));
        setPage(res.data?.number || nextPage);
        setTotalPages(res.data?.totalPages || 0);
        setTotalElements(res.data?.totalElements || 0);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filterPayment, filterPlan, search, cityFilter, pgCount, sortDir],
  );

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadOwners(0, false);
  }, [loadOwners]);

  const refreshOwners = async () => {
    await loadOwners(0, false);
    await loadSummary();
  };

  const viewOwnerPgs = async (owner) => {
    setSelectedOwnerName(owner.name);
    setShowPgModal(true);
    setPgLoading(true);
    try {
      const res = await api.get(`/admin/owners/${owner.id}/pgs`);
      setOwnerPgs(res.data || []);
    } catch {
      toast.error("Failed to load PGs.");
    } finally {
      setPgLoading(false);
    }
  };

  const openEdit = (owner) => {
    setEditOwnerId(owner.id);
    setForm({
      name: owner.name || "",
      email: owner.email || "",
      phone: owner.phone || "",
      city: owner.city || "",
    });
    setIdProofPreviews(owner.idProofUrl ? [owner.idProofUrl] : []);
    setPhotoPreviews(owner.photoUrl ? [owner.photoUrl] : []);
    setIdProofFiles([]);
    setPhotoFiles([]);
    setShowEdit(true);
  };

  const saveEdit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("city", form.city);
      idProofFiles.forEach((f) => fd.append("idProof", f));
      photoFiles.forEach((f) => fd.append("photo", f));
      await api.put(`/admin/owners/${editOwnerId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      closeModal();
      await refreshOwners();
    } catch {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowEdit(false);
    setEditOwnerId(null);
    setForm(EMPTY_FORM);
    setIdProofPreviews([]);
    setPhotoPreviews([]);
    setIdProofFiles([]);
    setPhotoFiles([]);
  };

  const toggleStatus = async (ownerId, active) => {
    try {
      const newStatus = !active;
      await api.put(`/admin/owners/${ownerId}/${newStatus ? "activate" : "deactivate"}`);
      toast.success(newStatus ? "Owner activated." : "Owner deactivated.");
      await refreshOwners();
    } catch (e) {
      toast.error("Failed to update status.");
    }
  };

  const remove = async (ownerId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the owner!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/admin/owners/${ownerId}`);
      toast.success("Owner deleted successfully.");
      await refreshOwners();
    } catch {
      toast.error("Failed to delete owner.");
    }
  };

  const getOwnerName = (pg) => {
    if (!pg) return "-";
    if (pg.ownerName?.trim()) return pg.ownerName;
    if (pg.owner?.name?.trim()) return pg.owner.name;
    if (pg.owner?.fullName?.trim()) return pg.owner.fullName;
    const first = pg.owner?.firstName?.trim() || "";
    const last = pg.owner?.lastName?.trim() || "";
    const name = `${first} ${last}`.trim();
    if (name) return name;
    return "-";
  };

  const openDetailModal = async (pgId) => {
    setShowDetailModal(true);
    setPgDetail(null);
    try {
      const res = await api.get(`/admin/owners/pg/${pgId}`);
      setPgDetail(res.data);
    } catch {
      alert("Failed to load PG details");
    }
  };

  const openExpiryModal = (owner) => {
    setExpiryOwnerId(owner.id);
    let formatted = "";
    if (owner.subscriptionExpiry) {
      if (Array.isArray(owner.subscriptionExpiry)) {
        const [y, m, d] = owner.subscriptionExpiry;
        formatted = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      } else {
        formatted = String(owner.subscriptionExpiry).split("T")[0];
      }
    }
    setExpiryDate(formatted);
    setShowExpiryModal(true);
  };

  const saveExpiry = async () => {
    if (!expiryDate) {
      alert("Please select a date");
      return;
    }
    setExpiryLoading(true);
    try {
      await api.put(`/admin/owners/${expiryOwnerId}/subscription/expiry`, null, {
        params: { expiryDate },
      });
      setShowExpiryModal(false);
      setExpiryOwnerId(null);
      setExpiryDate("");
      await refreshOwners();
    } catch {
      alert("Failed to update expiry");
    } finally {
      setExpiryLoading(false);
    }
  };

  const formatExpiry = (dateVal) => {
    if (!dateVal) return "-";
    let d;
    if (Array.isArray(dateVal)) {
      const [y, m, day] = dateVal;
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(dateVal);
    }
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const showValue = (value, fallback = "Not specified") =>
    value && value.length !== 0 ? value : fallback;

  const PlanBadge = ({ plan }) => (
    <span
      className={`plan-badge ${plan === "PREMIUM"
        ? "plan-premium"
        : plan === "PRO"
          ? "plan-pro"
          : plan === "BASIC"
            ? "plan-basic"
            : "plan-free"
        }`}
    >
      {plan || "FREE"}
    </span>
  );

  const PayBadge = ({ paid, plan }) => {
    if (plan === "FREE") return <span className="payment-free">Free</span>;
    return paid ? (
      <span className="payment-paid">Paid</span>
    ) : (
      <span className="payment-unpaid">Unpaid</span>
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(owners.map((o) => o.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} owners?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/admin/owners/${id}`)));
      toast.success(`${selectedIds.length} owner(s) deleted.`);
      setSelectedIds([]);
      setSelectAll(false);
      await refreshOwners();
    } catch {
      toast.error("Failed to delete selected owners.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCityOpen(false);
      }

      if (pgDropdownRef.current && !pgDropdownRef.current.contains(e.target)) {
        setPgOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatCity = (city) => {
    if (!city) return "";
    return city
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <DashboardLayout
      title="PG Owners"
      subtitle="All registered PG owners"
      rightAction={
        <button className="btn-add-owner" onClick={() => setShowAddOwner(true)}>
          <i className="bi bi-plus-lg"></i> Add Owner
        </button>
      }
    >

      <div className="owners-stats-row">
        <div className="owners-stat-card owner-stat-total">
          <div className="owners-stat-icon owner-stat-total-icon">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.total}</div>
            <div className="owners-stat-label">PG Owners</div>
            <div className="owners-stat-sub">Registered on platform</div>
          </div>
        </div>

        <div className="owners-stat-card owner-stat-active">
          <div className="owners-stat-icon owner-stat-active-icon">
            <i className="bi bi-geo-alt-fill"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{cities.length}</div>
            <div className="owners-stat-label">Total Cities</div>
            <div className="owners-stat-sub">Cities covered</div>
          </div>
        </div>

        <div className="owners-stat-card owner-stat-verify">
          <div className="owners-stat-icon owner-stat-verify-icon">
            <i className="bi bi-person-check-fill"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">
              {(summary.basic || 0) + (summary.pro || 0) + (summary.premium || 0)}
            </div>
            <div className="owners-stat-label">Paid Owners</div>
            <div className="owners-stat-sub">Basic + Pro + Premium</div>
          </div>
        </div>

        <div className="owners-stat-card owner-stat-block">
          <div className="owners-stat-icon owner-stat-block-icon">
            <i className="bi bi-person-x-fill"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.unpaid}</div>
            <div className="owners-stat-label">Unpaid Owners</div>
            <div className="owners-stat-sub">Pending payment</div>
          </div>
        </div>

        <div className="owners-stat-card owner-stat-suspend">
          <div className="owners-stat-icon owner-stat-suspend-icon">
            <i className="bi bi-person-fill-slash"></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{summary.free}</div>
            <div className="owners-stat-label">Free Plan</div>
            <div className="owners-stat-sub">Conversion targets</div>
          </div>
        </div>
      </div>

      <div className="owners-filter-bar">

        {/* MOBILE TOGGLE BUTTON — invisible on desktop via CSS */}
        <button
          className={`filter-toggle-btn ${filterOpen ? "open" : ""}`}
          onClick={() => setFilterOpen((p) => !p)}
        >
          <i className={`bi ${filterOpen ? "bi-x-lg" : "bi-sliders"}`}></i>
          {filterOpen ? "Hide Filters" : "Filters & Search"}
        </button>

        {/* ALL FILTERS — collapsible on mobile, display:contents on desktop */}
        <div className={`owners-filter-collapsible ${filterOpen ? "open" : ""}`}>

          {/* SEARCH — full width on mobile */}
          <div className="owners-search-bar owners-filter-full-row">
            <i className="bi bi-search search-icon"></i>
            <input
              className="form-control"
              placeholder="Search by name, email, phone or city or locality..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="filter-divider" />

          {/* CHIPS — horizontal scroll row on mobile */}
          <div className="owners-filter-chips-row owners-filter-full-row">
            {[
              { label: "All", value: "ALL", count: summary.total },
              { label: "Premium", value: "PREMIUM", count: summary.premium },
              { label: "Pro", value: "PRO", count: summary.pro },
              { label: "Basic", value: "BASIC", count: summary.basic },
              { label: "Free", value: "FREE", count: summary.free },
            ].map((c) => (
              <button
                key={c.value}
                className={`filter-chip ${filterPlan === c.value ? "active" : ""}`}
                onClick={() => setFilterPlan(c.value)}
              >
                {c.label} <span className="chip-count">{c.count || 0}</span>
              </button>
            ))}

            <div className="filter-divider" />

            <button
              className={`filter-chip ${filterPayment === "PAID" ? "active" : ""}`}
              onClick={() => setFilterPayment(filterPayment === "PAID" ? "ALL" : "PAID")}
            >
              <i className="bi bi-check-circle-fill"></i> Paid{" "}
              <span className="chip-count">{summary.paid || 0}</span>
            </button>
            <button
              className={`filter-chip ${filterPayment === "UNPAID" ? "active" : ""}`}
              onClick={() => setFilterPayment(filterPayment === "UNPAID" ? "ALL" : "UNPAID")}
            >
              <i className="bi bi-x-circle-fill"></i> Unpaid{" "}
              <span className="chip-count">{summary.unpaid || 0}</span>
            </button>
          </div>

          <div className="filter-divider" />

          {/* DROPDOWNS — 2-col grid on mobile */}
          <div className="owners-filter-dropdowns-row owners-filter-full-row">
            <div className="custom-dropdown" ref={pgDropdownRef}>
              <div
                className={`dropdown-selected ${pgOpen ? "active" : ""}`}
                onClick={() => setPgOpen((prev) => !prev)}
              >
                <span className="selected-text">
                  {pgCount === "ALL" ? "All PGs" : pgCount === "6_PLUS" ? "6+ PGs" : `${pgCount} PG`}
                </span>
                <span className={`arrow ${pgOpen ? "open" : ""}`}>▼</span>
              </div>

              {pgOpen && (
                <div className="dropdown-menu-custom">
                  {[
                    { label: "All", value: "ALL" },
                    { label: "0 PG", value: "0" },
                    { label: "1 PG", value: "1" },
                    { label: "2 PG", value: "2" },
                    { label: "3 PG", value: "3" },
                    { label: "4 PG", value: "4" },
                    { label: "5 PG", value: "5" },
                    { label: "6+ PGs", value: "6_PLUS" },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      className={`dropdown-item ${pgCount === opt.value ? "selected" : ""}`}
                      onClick={() => {
                        setPgCount(opt.value);
                        setPgOpen(false);
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="custom-dropdown" ref={dropdownRef}>
              <div
                className={`dropdown-selected ${cityOpen ? "active" : ""}`}
                onClick={() => setCityOpen((prev) => !prev)}
              >
                <span className="selected-text">{cityFilter || "All Cities"}</span>
                <span className={`arrow ${cityOpen ? "open" : ""}`}>▼</span>
              </div>
              {cityOpen && (
                <div className="dropdown-menu-custom">
                  <div
                    className={`dropdown-item ${!cityFilter ? "selected" : ""}`}
                    onClick={() => { setCityFilter(""); setCityOpen(false); }}
                  >
                    All Cities
                  </div>
                  {cities.map((city, i) => (
                    <div
                      key={i}
                      className={`dropdown-item ${cityFilter === city ? "selected" : ""}`}
                      onClick={() => { setCityFilter(city); setCityOpen(false); }}
                    >
                      {formatCity(city)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="filter-divider" />

          {/* SORT — full width on mobile */}
          <div className="owners-filter-sort-row owners-filter-full-row">
            <button
              className="filter-chip"
              onClick={() => setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))}
            >
              <i className={`bi ${sortDir === "desc" ? "bi-sort-down" : "bi-sort-up"}`}></i>
              {sortDir === "desc" ? "Newest First" : "Oldest First"}
            </button>
          </div>

        </div>
      </div>

      <div className="admin-results-count">
        <div>
          Showing {owners.length} of {totalElements} owners
        </div>
        <button
          className="btn-delete-selected"
          onClick={deleteSelected}
          disabled={selectedIds.length === 0}
        >
          <FaTrash /> Delete {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Selected"}
        </button>
      </div>

      <div className="owners-table-wrapper">
        <table className="table align-middle table-hover">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th className="text-center">Subscription</th>
              <th className="text-center">Expiry</th>
              <th className="text-center">Payment</th>
              <th className="text-center">Total PGs</th>
              <th className="text-center">ID Proof</th>
              <th className="text-center">Passport</th>
              <th>Action</th>
              <th className="text-center">
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={10} cols={13} />
            ) : owners.length === 0 ? (
              <tr>
                <td colSpan="13" className="text-center text-muted py-5">
                  No owners found
                </td>
              </tr>
            ) : (
              owners.map((o, index) => (
                <tr key={o.id}>
                  <td className="owner-table-muted">
                    {page * PAGE_SIZE + index + 1}
                  </td>
                  <td>
                    <div className="owner-name-cell">
                      <div className="owner-avatar">{getInitials(o.name)}</div>
                      <span className="owner-name-text" title={formatName(o.name)}>
                        {formatName(o.name)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="owner-email" title={o.email}>{o.email}</span>
                  </td>
                  <td>
                    <div className="phone-wrapper">
                      <span className="phone-number">{o.phone}</span>
                      <button className="icon-btn" title="Copy" onClick={() => { navigator.clipboard.writeText(o.phone); setCopiedId(o.id); setTimeout(() => setCopiedId(null), 1500); }}>
                        <i className={`bi ${copiedId === o.id ? "bi-check2 text-success" : "bi-copy"}`}></i>
                      </button>
                      <a href={`tel:${o.phone}`} className="icon-btn" title="Call">
                        <i className="bi bi-telephone-fill text-success"></i>
                      </a>
                      <a href={`https://wa.me/91${o.phone}`} target="_blank" rel="noopener noreferrer" className="icon-btn" title="WhatsApp">
                        <i className="bi bi-whatsapp text-success"></i>
                      </a>
                    </div>
                  </td>
                  <td><div className="city-cell"><i className="bi bi-geo-alt-fill"></i>{o.city}</div></td>
                  <td className="text-center"><PlanBadge plan={o.subscriptionPlan} /></td>
                  <td className="text-center">
                    {o.subscriptionPlan === "FREE" ? (
                      <span className="expiry-free">{formatExpiry(o.subscriptionExpiry)} (Trial)</span>
                    ) : (
                      <span className={`expiry-badge ${!o.subscriptionExpiry ? "expiry-none" : new Date(o.subscriptionExpiry) < new Date() ? "expiry-expired" : "expiry-active"}`}>
                        {formatExpiry(o.subscriptionExpiry)}
                      </span>
                    )}
                  </td>
                  <td className="text-center"><PayBadge paid={o.paymentDone} plan={o.subscriptionPlan} /></td>
                  <td className="text-center">
                    <div className="pgs-count-wrap">
                      <span className="pgs-count">{o.totalPgs ?? 0}</span>
                      {o.totalPgs > 0 && (
                        <i className="bi bi-eye pgs-eye-btn" role="button" title="View PGs" onClick={() => viewOwnerPgs(o)}></i>
                      )}
                    </div>
                  </td>
                  <td className="text-center">
                    {o.idProofUrl ? (
                      <button className="doc-preview-badge" onClick={() => setPreviewUrl(o.idProofUrl)}>
                        <i className="bi bi-file-earmark-text"></i> View
                      </button>
                    ) : (
                      <span className="doc-empty">-</span>
                    )}
                  </td>
                  <td className="text-center">
                    {o.photoUrl ? (
                      <button className="doc-preview-badge" onClick={() => setPreviewUrl(o.photoUrl)}>
                        <i className="bi bi-person-bounding-box"></i> View
                      </button>
                    ) : (
                      <span className="doc-empty">-</span>
                    )}
                  </td>
                  <td>
                    <div className="action-btn-group">
                      <button className="btn-action-edit" onClick={() => openEdit(o)}>Edit</button>
                      <button className="btn-action-expiry" onClick={() => openExpiryModal(o)}>Expiry</button>
                      <button className={o.active ? "btn-action-pause" : "btn-action-activate"} onClick={() => toggleStatus(o.id, o.active)}>
                        {o.active ? "Pause" : "Activate"}
                      </button>
                      <button className="btn-action-delete" onClick={() => remove(o.id)}>Delete</button>
                    </div>
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(o.id)}
                      onChange={() => toggleSelect(o.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-selection-bar">
        <label>
          <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
          Select All
        </label>
        <button
          className="btn-delete-selected"
          onClick={deleteSelected}
          disabled={selectedIds.length === 0}
        >
          <FaTrash /> {selectedIds.length > 0 ? `Delete (${selectedIds.length})` : "Delete"}
        </button>
      </div>

      <div className="owners-card-list">
        {loading ? (
          <OwnerCardSkeleton count={4} />
        ) : owners.length === 0 ? (
          <p className="text-center text-muted py-4">No owners found</p>
        ) : (
          owners.map((o, index) => (
            <div key={o.id} className="owner-card">
              <div className="owner-card-top">
                <input
                  type="checkbox"
                  className="card-checkbox"
                  checked={selectedIds.includes(o.id)}
                  onChange={() => toggleSelect(o.id)}
                />
                <div className="owner-avatar">{getInitials(o.name)}</div>
                <div className="owner-card-info">
                  <div className="owner-pg-city">
                    #{page * PAGE_SIZE + index + 1}
                  </div>
                  <div className="owner-card-name">{formatName(o.name)}</div>
                  <div className="owner-card-email">{o.email}</div>
                </div>
                <div className="owner-card-badges">
                  <PlanBadge plan={o.subscriptionPlan} />
                  <PayBadge paid={o.paymentDone} plan={o.subscriptionPlan} />
                </div>
              </div>
              <div className="owner-card-row">
                <div className="owner-card-phone">
                  <span className="phone-number">{o.phone}</span>
                  <button className="icon-btn" title="Copy" onClick={() => { navigator.clipboard.writeText(o.phone); setCopiedId(o.id); setTimeout(() => setCopiedId(null), 1500); }}>
                    <i className={`bi ${copiedId === o.id ? "bi-check2 text-success" : "bi-copy"}`}></i>
                  </button>
                  <a href={`tel:${o.phone}`} className="icon-btn" title="Call">
                    <i className="bi bi-telephone-fill text-success"></i>
                  </a>
                  <a href={`https://wa.me/91${o.phone}`} target="_blank" rel="noopener noreferrer" className="icon-btn" title="WhatsApp">
                    <i className="bi bi-whatsapp text-success"></i>
                  </a>
                </div>
                <div className="city-cell"><i className="bi bi-geo-alt-fill"></i>{o.city}</div>
              </div>
              <div className="owner-card-stats">
                <div className="owner-card-stat">
                  <i className="bi bi-building owner-pg-icon"></i>
                  <span><strong>{o.totalPgs ?? 0}</strong> PGs</span>
                  {o.totalPgs > 0 && (
                    <i className="bi bi-eye pgs-eye-btn" role="button" title="View PGs" onClick={() => viewOwnerPgs(o)}></i>
                  )}
                </div>
                {o.idProofUrl && (
                  <div className="owner-card-stat">
                    <button className="doc-preview-badge" onClick={() => setPreviewUrl(o.idProofUrl)}>
                      <i className="bi bi-file-earmark-text"></i> ID Proof
                    </button>
                  </div>
                )}
                {o.photoUrl && (
                  <div className="owner-card-stat">
                    <button className="doc-preview-badge" onClick={() => setPreviewUrl(o.photoUrl)}>
                      <i className="bi bi-person-bounding-box"></i> Photo
                    </button>
                  </div>
                )}
              </div>
              <div className="owner-card-actions">
                <button className="btn-action-edit" onClick={() => openEdit(o)}>Edit</button>
                <button className="btn-action-expiry" onClick={() => openExpiryModal(o)}>Expiry</button>
                <button className={o.active ? "btn-action-pause" : "btn-action-activate"} onClick={() => toggleStatus(o.id, o.active)}>
                  {o.active ? "Pause" : "Activate"}
                </button>
                <button className="btn-action-delete" onClick={() => remove(o.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && page + 1 < totalPages && (
        <div className="admin-load-more-wrap">
          <button
            className="admin-load-more-btn"
            onClick={() => loadOwners(page + 1, true)}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {showEdit && (
        <div className="modal-backdrop-custom" onClick={closeModal}>
          <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h4>Edit PG Owner</h4>
              <button className="modal-close" onClick={closeModal}>X</button>
            </div>
            <Form>
              <Form.Control className="mt-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Form.Control className="mt-2" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Form.Control className="mt-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Form.Control className="mt-2" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <div className="mt-4">
                <strong>ID Proof</strong>
                <Form.Control className="mt-2" type="file" accept="image/*,.pdf" onChange={(e) => { const f = Array.from(e.target.files); setIdProofFiles(f); setIdProofPreviews(f.map((x) => URL.createObjectURL(x))); }} />
                {idProofPreviews.length > 0 && (
                  <div className="preview-grid mt-2">
                    {idProofPreviews.map((src, i) => (
                      <div key={i} className="preview-box">
                        <img src={src} alt="ID" className="preview-img" />
                        <button type="button" className="remove-btn" onClick={() => { setIdProofPreviews([]); setIdProofFiles([]); }}>X</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <strong>Passport Size Photo</strong>
                <Form.Control className="mt-2" type="file" accept="image/*" onChange={(e) => { const f = Array.from(e.target.files); setPhotoFiles(f); setPhotoPreviews(f.map((x) => URL.createObjectURL(x))); }} />
                {photoPreviews.length > 0 && (
                  <div className="preview-grid mt-2">
                    {photoPreviews.map((src, i) => (
                      <div key={i} className="preview-box">
                        <img src={src} alt="Passport" className="preview-img tall" />
                        <button type="button" className="remove-btn" onClick={() => { setPhotoPreviews([]); setPhotoFiles([]); }}>X</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Form>
            <div className="modal-actions">
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button onClick={saveEdit} disabled={loading}>{loading ? "Saving..." : "Update"}</Button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="modal-backdrop-custom" onClick={() => setPreviewUrl(null)}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h4>Document Preview</h4>
              <button className="modal-close" onClick={() => setPreviewUrl(null)}>X</button>
            </div>
            <div className="text-center">
              {previewUrl?.toLowerCase().endsWith(".pdf") ? (
                <iframe src={previewUrl} title="Document" width="100%" height="500px" className="doc-iframe" />
              ) : (
                <img src={previewUrl} alt="Preview" className="doc-img" />
              )}
            </div>
          </div>
        </div>
      )}

      {showPgModal && (
        <div className="modal-backdrop-custom" onClick={() => setShowPgModal(false)}>
          <div className="modal-box modal-box-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h4>PGs of {selectedOwnerName}</h4>
              <button className="modal-close" onClick={() => setShowPgModal(false)}>X</button>
            </div>
            {pgLoading ? (
              <div className="text-center py-4">Loading PGs...</div>
            ) : ownerPgs.length === 0 ? (
              <div className="text-center text-muted py-4">No PGs found</div>
            ) : (
              <>
                <table className="pg-list-table">
                  <thead>
                    <tr>
                      <th>PG Name</th>
                      <th>City</th>
                      <th className="text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerPgs.map((pg) => (
                      <tr key={pg.id}>
                        <td>{pg.name}</td>
                        <td>{pg.city}</td>
                        <td className="text-center">
                          <button className="doc-preview-badge" onClick={() => { setShowPgModal(false); openDetailModal(pg.id); }}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pg-modal-cards">
                  {ownerPgs.map((pg) => (
                    <div key={pg.id} className="pg-modal-card">
                      <div className="pg-modal-card-info">
                        <div className="pg-modal-card-name">{pg.name}</div>
                        <div className="pg-modal-card-city">
                          <i className="bi bi-geo-alt-fill owner-geo-icon"></i>
                          {pg.city}
                        </div>
                      </div>
                      <button className="pg-modal-card-btn" onClick={() => { setShowPgModal(false); openDetailModal(pg.id); }}>
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showDetailModal && (
        <div className="modal-backdrop-custom" onClick={() => setShowDetailModal(false)}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h4>PG Details</h4>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>X</button>
            </div>
            {!pgDetail ? (
              <div className="text-center p-5">Loading PG Details...</div>
            ) : (
              <>
                <div className="pg-header">
                  <h3>{pgDetail.name}</h3>
                  <span className={`badge ${pgDetail.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>{pgDetail.status}</span>
                </div>
                <p className="fw-semibold mb-1">Owner: {pgDetail.ownerName || getOwnerName(pgDetail)}</p>
                <p className="text-muted mb-4">{pgDetail.locality}, {pgDetail.city}</p>
                <div className="media-section">
                  {pgDetail.imageUrls?.length ? (
                    <button className="media-view-btn" onClick={() => { setMediaType("image"); setMediaIndex(0); setShowMediaViewer(true); }}>
                      View Images ({pgDetail.imageUrls.length})
                    </button>
                  ) : (
                    <span className="empty-text">No Images</span>
                  )}
                  {pgDetail.videoUrls?.length ? (
                    <button className="media-view-btn" onClick={() => { setMediaType("video"); setMediaIndex(0); setShowMediaViewer(true); }}>
                      View Videos ({pgDetail.videoUrls.length})
                    </button>
                  ) : (
                    <span className="empty-text">No Videos</span>
                  )}
                </div>
                <h6 className="section-title mt-4">About Property</h6>
                <p className="about-text">{showValue(pgDetail.aboutDescription)}</p>
                <h6 className="section-title mt-4">Room Options</h6>
                <div className="room-grid">
                  {pgDetail.floors?.flatMap((floor) =>
                    floor.rooms?.map((room) => {
                      const avail = room.beds?.filter((b) => b.status === "AVAILABLE").length || 0;
                      return (
                        <div key={room.roomId} className="room-card">
                          <h6>{room.sharingType} Sharing</h6>
                          <p>Rs {room.monthlyRent}/month</p>
                          <small>Beds: {room.beds?.length || 0} · Available: {avail}</small>
                        </div>
                      );
                    })
                  )}
                </div>
                <h6 className="section-title mt-4">Amenities</h6>
                <div className="chip-container">
                  {pgDetail.amenities?.length ? (
                    pgDetail.amenities.map((a, i) => <span key={i} className="chip">{a}</span>)
                  ) : (
                    <p className="empty-text">Not specified</p>
                  )}
                </div>
                <h6 className="section-title mt-4">House Rules</h6>
                <ul className="rules-list">
                  {pgDetail.houseRules?.length ? (
                    pgDetail.houseRules.map((r, i) => <li key={i}>{r}</li>)
                  ) : (
                    <p className="empty-text">Not specified</p>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {showMediaViewer && (
        <div className="modal-backdrop-custom" onClick={() => setShowMediaViewer(false)}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <div className="media-viewer-body">
              <button className="media-close" onClick={() => setShowMediaViewer(false)}>X</button>
              <button className="media-nav prev" onClick={() => setMediaIndex((i) => Math.max(i - 1, 0))}>‹</button>
              {mediaType === "image" ? (
                <img src={pgDetail?.imageUrls?.[mediaIndex]} alt={pgDetail?.name} className="viewer-media" />
              ) : (
                <video controls src={pgDetail?.videoUrls?.[mediaIndex]} className="viewer-media" />
              )}
              <button className="media-nav next" onClick={() => setMediaIndex((i) => mediaType === "image" ? Math.min(i + 1, pgDetail.imageUrls.length - 1) : Math.min(i + 1, pgDetail.videoUrls.length - 1))}>›</button>
            </div>
          </div>
        </div>
      )}

      {showExpiryModal && (
        <div className="modal-backdrop-custom" onClick={() => setShowExpiryModal(false)}>
          <div className="modal-box expiry-modal-box modal-box-xs" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h4>Edit Subscription Expiry</h4>
              <button className="modal-close" onClick={() => setShowExpiryModal(false)}>X</button>
            </div>
            <p className="expiry-desc">
              Set a new expiry date for this owner's subscription.
            </p>
            <input type="date" className="form-control" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowExpiryModal(false)}>Cancel</Button>
              <Button onClick={saveExpiry} disabled={expiryLoading}>{expiryLoading ? "Saving..." : "Update Expiry"}</Button>
            </div>
          </div>
        </div>
      )}

      <AddOwnerModal show={showAddOwner} onClose={() => { setShowAddOwner(false); refreshOwners(); }} />
    </DashboardLayout>
  );
};

export default AdminOwners;