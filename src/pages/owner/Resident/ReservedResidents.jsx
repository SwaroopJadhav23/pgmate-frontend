import { FaHome, FaExclamationTriangle } from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import { TableSkeleton } from "../../public/Skeleton";
import api from "../../../api/axios";
import toast from "react-hot-toast";
import AgreementSignaturePad from "./AgreementSignaturePad";
import "./Resident.css";
import "./Agreement.css";

// ── Inline modal for collecting signature from a booking tenant ────
const CollectSignatureModal = ({ resident, onClose, onSave, saving }) => {
  const [sigDataUrl, setSigDataUrl] = useState(null);
  const handleSave = async () => {
    if (!sigDataUrl) {
      toast("Please draw the tenant's signature before saving.", { icon: "⚠️" });
      return;
    }
    onSave(resident.residentId, sigDataUrl);
  };
  return (
    <div className="agreement-view-popup-overlay" onClick={onClose}>
      <div
        className="agreement-view-popup"
        style={{ width: "min(580px, 96vw)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="agreement-popup-close" onClick={onClose}>×</button>
        <h5>✍️ Collect Agreement Signature</h5>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          Tenant: <strong>{resident.name}</strong> &nbsp;|&nbsp; {resident.pgName} — Room{" "}
          {resident.roomNumber}, Bed {resident.bedNumber}
        </p>
        <AgreementSignaturePad
          residentName={resident.name}
          pgName={resident.pgName}
          monthlyRent={
            resident.stayType === "DAILY_BASIC" ? resident.dailyRent : resident.monthlyRent
          }
          checkinDate={resident.checkinDate}
          onSigned={(url) => setSigDataUrl(url)}
          onClear={() => setSigDataUrl(null)}
        />
        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button
            className="modal-btn primary"
            disabled={saving}
            onClick={handleSave}
            style={{ fontSize: 13 }}
          >
            {saving ? "Saving..." : "Save Signature"}
          </button>
          <button className="modal-btn cancel" style={{ fontSize: 13 }} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const PAGE_SIZE = 20;

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};
const formatMoney = (value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
const stayLabel = (resident) => (resident.stayType === "DAILY_BASIC" ? "Daily" : "Monthly");
const chargeLabel = (resident) =>
  resident.stayType === "DAILY_BASIC"
    ? `${formatMoney(resident.dailyRent)}/day`
    : resident.monthlyRent != null
    ? formatMoney(resident.monthlyRent)
    : "-";
const extraLabel = (resident) =>
  resident.stayType === "DAILY_BASIC"
    ? `${resident.numberOfDays || 0} day(s)`
    : resident.deposit != null
    ? formatMoney(resident.deposit)
    : "-";

const STAY_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "MONTHLY_BASIC", label: "Monthly" },
  { key: "DAILY_BASIC", label: "Daily" },
];

const ReservedResidents = ({
  apiPrefix,
  refreshKey,
  onConfirm,
  onDenied,
  pendingSignatureUpdate,
}) => {
  const [copiedId, setCopiedId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stayFilter, setStayFilter] = useState("ALL");
  const [residents, setResidents] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [agreementPopup, setAgreementPopup] = useState(null);
  const [collectSigResident, setCollectSigResident] = useState(null);
  const [savingSig, setSavingSig] = useState(false);
  const [stats, setStats] = useState({ total: 0, monthly: 0, daily: 0 });
  const [detailResident, setDetailResident] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const saveSignatureForResident = async (residentId, signatureDataUrl) => {
    setSavingSig(true);
    try {
      const arr = signatureDataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      const sigFile = new File([u8arr], "agreement_signature.png", { type: mime });
      const fd = new FormData();
      fd.append("agreementSignature", sigFile);
      const response = await api.put(`${apiPrefix}/${residentId}/signature`, fd);
      const savedUrl = response?.data?.agreementSignatureUrl || signatureDataUrl;
      setResidents((prev) =>
        prev.map((r) =>
          r.residentId === residentId ? { ...r, agreementSignatureUrl: savedUrl } : r
        )
      );
      setCollectSigResident(null);
      toast.success("Signature Saved.");
    } catch {
      toast.error("Could not save signature. Please try again.");
    } finally {
      setSavingSig(false);
    }
  };

  // When owner draws signature in ConfirmMoveInModal, update the row immediately
  useEffect(() => {
    if (pendingSignatureUpdate) {
      setResidents((prev) =>
        prev.map((r) =>
          r.residentId === pendingSignatureUpdate.residentId
            ? { ...r, agreementSignatureUrl: pendingSignatureUpdate.signatureUrl }
            : r
        )
      );
    }
  }, [pendingSignatureUpdate]);

  const liveDetail = detailResident
    ? residents.find((r) => r.residentId === detailResident.residentId) ?? detailResident
    : null;

  const loadResidents = useCallback(
    async (nextPage = 0, append = false) => {
      try {
        append ? setLoadingMore(true) : setLoading(true);
        const params = new URLSearchParams();
        params.append("page", nextPage);
        params.append("size", PAGE_SIZE);
        params.append("sort", "createdAt,desc");
        if (search.trim()) params.append("search", search.trim());
        if (stayFilter !== "ALL") params.append("stayType", stayFilter);
        const res = await fetchData(`${apiPrefix}/reserved/paged?${params.toString()}`);
        const content = res.content || [];
        const totalPages = res.totalPages || 0;
        setResidents((prev) => (append ? [...prev, ...content] : content));
        setPage(nextPage);
        setTotalElements(res.totalElements || 0);
        setHasMore(nextPage + 1 < totalPages);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiPrefix, search, stayFilter]
  );

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchData(`${apiPrefix}/reserved/paged?page=0&size=1000`);
      const data = res.content || [];
      setStats({
        total: data.length,
        monthly: data.filter((r) => r.stayType === "MONTHLY_BASIC").length,
        daily: data.filter((r) => r.stayType === "DAILY_BASIC").length,
      });
    } catch {
      setStats({ total: 0, monthly: 0, daily: 0 });
    }
  }, [apiPrefix]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadResidents(0, false);
    loadStats();
  }, [loadResidents, loadStats, refreshKey]);

  return (
    <>
      {/* ── STATS CARDS ─────────────────────────────────────────────── */}
      <div className="booking-stats-grid">
        <div className="booking-stat-card total">
          <div className="icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="res-stat-icon"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="value">{stats.total}</div>
            <div className="label">Total Bookings</div>
          </div>
        </div>

        <div className="booking-stat-card monthly">
          <div className="icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="res-stat-icon"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div className="value">{stats.monthly}</div>
            <div className="label">Monthly</div>
          </div>
        </div>

        <div className="booking-stat-card daily">
          <div className="icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="res-stat-icon"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div className="value">{stats.daily}</div>
            <div className="label">Daily</div>
          </div>
        </div>
      </div>

      {/* ── HEADING ─────────────────────────────────────────────────── */}
      <h5 className="mb-3">
        Pending Move-ins
        <span className="residents-count-badge">{totalElements}</span>
      </h5>

      {/* ── SEARCH ──────────────────────────────────────────────────── */}
      <div className="residents-search-bar mb-3">
        <span className="search-icon">Search</span>
        <input
          type="text"
          className="residents-search-input"
          placeholder="Search by name, phone or room..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput && (
          <button
            className="search-clear-btn"
            onClick={() => setSearchInput("")}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── STAY FILTERS ────────────────────────────────────────────── */}
      <div className="status-tabs mb-3">
        {STAY_FILTERS.map((filter) => (
          <button
            key={filter.key}
            className={`status-btn ${stayFilter === filter.key ? "active" : ""}`}
            onClick={() => setStayFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <p className="search-result-count">
        Showing <strong>{residents.length}</strong> of {totalElements} tenants
      </p>

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP TABLE — hidden on mobile via .rr-desktop-only
      ══════════════════════════════════════════════════════════════ */}
      <div className="residents-table-scroll rr-desktop-only">
        <table className="modern-table">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>PG</th>
              <th>Floor</th>
              <th>Room</th>
              <th>Bed</th>
              <th>Stay</th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={6} cols={12} />
            ) : residents.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: "#94a3b8",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {search
                    ? `No residents found for "${search}"`
                    : "No reserved Tenants"}
                </td>
              </tr>
            ) : (
              residents.map((r) => (
                <tr key={r.residentId} onClick={() => setDetailResident(r)} style={{ cursor: "pointer" }}>
                  <td data-label="Name">{r.name}</td>
                  <td data-label="Phone">
                    <div className="phone-cell">
                      <span>{r.phone}</span>
                      <button
                        className="copy-btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          color: '#475569',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          transition: 'all 0.2s ease',
                          fontSize: '12px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(r.phone);
                          setCopiedId(r.residentId);
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                      >
                        {copiedId === r.residentId ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-copy"></i>}
                      </button>
                    </div>
                  </td>
                  <td data-label="PG">{r.pgName}</td>
                  <td data-label="Floor">{r.floorNumber || "-"}</td>
                  <td data-label="Room">{r.roomNumber || "-"}</td>
                  <td data-label="Bed">
                    {r.bedNumber ? `Bed ${r.bedNumber}` : "-"}
                  </td>
                  <td data-label="Stay">{stayLabel(r)}</td>
                  <td data-label="Payment Status">
                    {r.reservationAmount > 0 ? (
                      <span className="pay-status-badge pay-status-success">✓ Successful</span>
                    ) : (
                      <span className="pay-status-badge pay-status-failed">✕ Failed</span>
                    )}
                  </td>
                  <td data-label="Actions">
                    <div className="d-flex justify-content-center gap-2 flex-nowrap">
                      {r.status === "RESERVED" && (
                        <button
                          className="action-btn"
                          style={{ 
                            backgroundColor: "#3b82f6", 
                            color: "white", 
                            padding: "8px 16px",
                            boxShadow: "0 4px 10px rgba(59, 130, 246, 0.3)",
                            borderRadius: "8px",
                            border: "none",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailResident(r);
                          }}
                        >
                          <i className="bi bi-file-earmark-text-fill"></i> Review
                        </button>
                      )}
                      {r.status === "PENDING_TENANT_DETAILS" && (
                        <span className="text-muted small" style={{ fontWeight: 600 }}>
                          Waiting for Tenant
                        </span>
                      )}
                      {r.status === "PENDING_OWNER_VERIFICATION" && (
                        <button
                          className="action-btn"
                          style={{ 
                            backgroundColor: "#10b981", 
                            color: "white", 
                            padding: "8px 16px",
                            boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)",
                            borderRadius: "8px",
                            border: "none",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailResident(r);
                          }}
                        >
                          <i className="bi bi-person-check-fill"></i> Verify
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE CARDS — completely outside the table scroll wrapper
          shown only on mobile via .rr-mobile-only
      ══════════════════════════════════════════════════════════════ */}
      <div className="rr-mobile-only">
        {loading ? (
          <div className="rr-cards-wrap">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rr-card rr-card--skeleton">
                <div className="rr-sk-header" />
                <div className="rr-sk-line" />
                <div className="rr-sk-line rr-sk-line--short" />
                <div className="rr-sk-grid">
                  <div className="rr-sk-cell" />
                  <div className="rr-sk-cell" />
                  <div className="rr-sk-cell" />
                  <div className="rr-sk-cell" />
                </div>
                <div className="rr-sk-footer" />
              </div>
            ))}
          </div>
        ) : residents.length === 0 ? (
          <div className="rr-empty">
            <span className="rr-empty__icon"><FaHome /></span>
            <p className="rr-empty__text">
              {search
                ? `No residents found for "${search}"`
                : "No reserved Tenants"}
            </p>
          </div>
        ) : (
          <div className="rr-cards-wrap">
            {residents.map((r) => (
              <div key={r.residentId} className="rr-card" onClick={() => setDetailResident(r)} style={{ cursor: 'pointer' }}>
                {/* Card head: avatar · name · pg · stay badge */}
                <div className="rr-card__head">
                  <div className="rr-card__avatar">
                    {r.name?.charAt(0)?.toUpperCase() || "T"}
                  </div>
                  <div className="rr-card__title">
                    <span className="rr-card__name">{r.name}</span>
                    <span className="rr-card__pg">{r.pgName}</span>
                  </div>
                  <span
                    className={`rr-card__badge rr-card__badge--${r.stayType === "DAILY_BASIC" ? "daily" : "monthly"}`}
                  >
                    {stayLabel(r)}
                  </span>
                </div>

                {/* Location strip */}
                <div className="rr-card__location">
                  <svg
                    className="rr-card__loc-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Floor {r.floorNumber || "-"}</span>
                  <span className="rr-card__loc-sep">·</span>
                  <span>Room {r.roomNumber || "-"}</span>
                  <span className="rr-card__loc-sep">·</span>
                  <span>{r.bedNumber ? `Bed ${r.bedNumber}` : "No Bed"}</span>
                </div>

                {/* Info grid (2-col) */}
                <div className="rr-card__grid">
                  <div className="rr-card__cell">
                    <span className="rr-card__cell-label">Phone</span>
                    <div className="rr-card__phone">
                      <span className="rr-card__cell-val">{r.phone}</span>
                      <button
                        className="rr-card__copy-btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px 10px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          color: '#475569',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          fontSize: '12px',
                          marginLeft: '8px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(r.phone);
                          setCopiedId(r.residentId);
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                      >
                        {copiedId === r.residentId ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-copy"></i>}
                      </button>
                    </div>
                  </div>

                  <div className="rr-card__cell">
                    <span className="rr-card__cell-label">Charge</span>
                    <span className="rr-card__cell-val rr-card__cell-val--money">
                      {chargeLabel(r)}
                    </span>
                  </div>

<div className="rr-card__cell">
                    <span className="rr-card__cell-label">
                      {r.stayType === "DAILY_BASIC" ? "Duration" : "Deposit"}
                    </span>
                    <span className="rr-card__cell-val">{extraLabel(r)}</span>
                  </div>

                  <div className="rr-card__cell">
                    <span className="rr-card__cell-label">Check-in</span>
                    <span className="rr-card__cell-val">
                      {formatDate(r.checkinDate)}
                    </span>
                  </div>

                  <div className="rr-card__cell">
                    <span className="rr-card__cell-label">Checkout</span>
                    <span className="rr-card__cell-val">
                      {formatDate(r.expectedCheckoutDate)}
                    </span>
                  </div>
                </div>

                {/* Emergency contact — only if present */}
                {(r.emergencyContactName || r.emergencyContact) && (
                  <div className="rr-card__emergency">
                    <span className="rr-card__emergency-icon"><FaExclamationTriangle /></span>
                    <div className="rr-card__emergency-body">
                      <span className="rr-card__emergency-name">
                        {r.emergencyContactName || "-"}
                        {r.emergencyContactRelation && (
                          <span className="rr-card__emergency-rel">
                            {" "}
                            · {r.emergencyContactRelation}
                          </span>
                        )}
                      </span>
                      {r.emergencyContact && (
                        <span className="rr-card__emergency-phone">
                          {r.emergencyContact}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="rr-card__actions" style={{ flexWrap: "wrap", justifyContent: "center" }}>
                  {r.status === "RESERVED" && (
                    <button
                      className="rr-card__btn"
                      style={{ 
                        backgroundColor: "#3b82f6", 
                        color: "white", 
                        padding: "8px 16px",
                        boxShadow: "0 4px 10px rgba(59, 130, 246, 0.3)",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailResident(r);
                      }}
                    >
                      <i className="bi bi-file-earmark-text-fill"></i> Review
                    </button>
                  )}
                  {r.status === "PENDING_TENANT_DETAILS" && (
                    <span className="text-muted small" style={{ fontWeight: 600, padding: "8px" }}>
                      Waiting for Tenant Details
                    </span>
                  )}
                  {r.status === "PENDING_OWNER_VERIFICATION" && (
                    <button
                      className="rr-card__btn"
                      style={{ 
                        backgroundColor: "#10b981", 
                        color: "white", 
                        padding: "8px 16px",
                        boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailResident(r);
                      }}
                    >
                      <i className="bi bi-person-check-fill"></i> Verify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL POPUP — compact card layout */}
      {liveDetail && (
        <div className="modal-backdrop-custom" onClick={() => setDetailResident(null)}>
          <div className="modal-box rdp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rdp-header">
              <div className="rdp-avatar">
                {liveDetail.profilePhotoUrl ? (
                  <img src={liveDetail.profilePhotoUrl} alt="Profile" className="rdp-avatar-img" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  liveDetail.name ? liveDetail.name.charAt(0).toUpperCase() : "?"
                )}
              </div>
              <div className="rdp-header-text">
                <h4>{liveDetail.name}</h4>
                <span>{liveDetail.pgName} &nbsp;·&nbsp; Room {liveDetail.roomNumber || "-"}, Bed {liveDetail.bedNumber || "-"} &nbsp;·&nbsp; {liveDetail.stayType === "DAILY_BASIC" ? "Daily" : "Monthly"}</span>
              </div>
              <button className="rdp-close-btn" onClick={() => setDetailResident(null)}>✕</button>
            </div>

            <div className="rdp-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' }}>
              
              {/* BASIC & CONTACT INFO */}
              <div className="rdp-col" style={{ width: '100%', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span className="rdp-col-title" style={{ color: '#3b82f6', marginBottom: '12px', display: 'block' }}>CONTACT & INFO</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="rdp-label">Phone</span>
                    <span className="rdp-value">{liveDetail.phone}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="rdp-label">Email</span>
                    <span className="rdp-value">{liveDetail.email || "-"}</span>
                  </div>
                  {liveDetail.dob && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="rdp-label">DOB</span>
                        <span className="rdp-value">{liveDetail.dob}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="rdp-label">Gender</span>
                        <span className="rdp-value">{liveDetail.gender}</span>
                      </div>
                    </>
                  )}
                  {liveDetail.aadhaarNumber && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="rdp-label">Aadhaar No.</span>
                      <span className="rdp-value">{liveDetail.aadhaarNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* PROFESSIONAL DETAILS */}
              {liveDetail.occupation && (
                <div className="rdp-col" style={{ width: '100%', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span className="rdp-col-title" style={{ color: '#3b82f6', marginBottom: '12px', display: 'block' }}>PROFESSIONAL DETAILS</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="rdp-label">Occupation</span>
                      <span className="rdp-value">{liveDetail.occupation}</span>
                    </div>
                    {liveDetail.education && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="rdp-label">Education</span>
                        <span className="rdp-value">{liveDetail.education}</span>
                      </div>
                    )}
                    {liveDetail.collegeOrCompanyName && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="rdp-label">Organization</span>
                        <span className="rdp-value">{liveDetail.collegeOrCompanyName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ADDRESS DETAILS */}
              {liveDetail.permanentAddress && (
                <div className="rdp-col" style={{ width: '100%', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span className="rdp-col-title" style={{ color: '#3b82f6', marginBottom: '12px', display: 'block' }}>ADDRESS DETAILS</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="rdp-label">Permanent Address</span>
                      <span className="rdp-value">{liveDetail.permanentAddress}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="rdp-label">City</span>
                      <span className="rdp-value">{liveDetail.permanentCity}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="rdp-label">State</span>
                      <span className="rdp-value">{liveDetail.permanentState}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="rdp-label">Pincode</span>
                      <span className="rdp-value">{liveDetail.permanentPincode}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* EMERGENCY & GUARDIAN */}
              {(liveDetail.emergencyContactName || liveDetail.guardianName) && (
                <div className="rdp-col" style={{ width: '100%', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span className="rdp-col-title" style={{ color: '#3b82f6', marginBottom: '12px', display: 'block' }}>EMERGENCY & GUARDIAN</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                    {liveDetail.emergencyContactName && (
                      <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                        <span className="rdp-label" style={{ fontWeight: 'bold' }}>Emergency Contact</span>
                        <span className="rdp-value">{liveDetail.emergencyContactName} ({liveDetail.emergencyContactRelation})</span>
                        <span className="rdp-value">{liveDetail.emergencyContact}</span>
                      </div>
                    )}
                    {liveDetail.guardianName && (
                      <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                        <span className="rdp-label" style={{ fontWeight: 'bold' }}>Guardian</span>
                        <span className="rdp-value">{liveDetail.guardianName} ({liveDetail.guardianRelation})</span>
                        <span className="rdp-value">{liveDetail.guardianPhone}</span>
                      </div>
                    )}
                    {liveDetail.localGuardianName && (
                      <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                        <span className="rdp-label" style={{ fontWeight: 'bold' }}>Local Guardian</span>
                        <span className="rdp-value">{liveDetail.localGuardianName} ({liveDetail.localGuardianRelation})</span>
                        <span className="rdp-value">{liveDetail.localGuardianPhone}</span>
                        <span className="rdp-value" style={{ fontSize: '12px', marginTop: '4px' }}>{liveDetail.localGuardianAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CHARGES & DATES */}
              <div className="rdp-col" style={{ width: '100%', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span className="rdp-col-title" style={{ color: '#3b82f6', marginBottom: '12px', display: 'block' }}>CHARGES & DATES</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                  {liveDetail.stayType === "DAILY_BASIC" ? (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="rdp-label">Daily Rent</span>
                        <span className="rdp-value">{formatMoney(liveDetail.dailyRent)}/day</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="rdp-label">Days Booked</span>
                        <span className="rdp-value">{liveDetail.numberOfDays || 0}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="rdp-label">Monthly Rent</span>
                        <span className="rdp-value">{formatMoney(liveDetail.monthlyRent)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="rdp-label">Deposit</span>
                        <span className="rdp-value">{formatMoney(liveDetail.deposit)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="rdp-label">Future Refund Amount</span>
                        <span className="rdp-value">{formatMoney(liveDetail.futureDepositRefund)}</span>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="rdp-label">Check-in</span>
                    <span className="rdp-value">{formatDate(liveDetail.checkinDate)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="rdp-label">Checkout</span>
                    <span className="rdp-value">{formatDate(liveDetail.expectedCheckoutDate)}</span>
                  </div>
                  {liveDetail.foodPreference && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="rdp-label">Food Preference</span>
                      <span className="rdp-value">{liveDetail.foodPreference}</span>
                    </div>
                  )}
                  {liveDetail.foodFacility && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="rdp-label">Food Facility</span>
                      <span className="rdp-value">{liveDetail.foodFacility}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* DOCUMENTS */}
              {(liveDetail.aadhaarCardUrl || liveDetail.depositProofUrl || liveDetail.onboardingPaymentProofUrl || liveDetail.agreementSignatureUrl) && (
                <div className="rdp-col" style={{ width: '100%', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span className="rdp-col-title" style={{ color: '#3b82f6', marginBottom: '12px', display: 'block' }}>DOCUMENTS & PROOFS</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {liveDetail.aadhaarCardUrl && (
                      <a href={liveDetail.aadhaarCardUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#1e293b', textDecoration: 'none', fontWeight: 600 }}>
                        <i className="bi bi-file-earmark-person"></i> Aadhaar Card
                      </a>
                    )}
                    {liveDetail.depositProofUrl && (
                      <a href={liveDetail.depositProofUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#1e293b', textDecoration: 'none', fontWeight: 600 }}>
                        <i className="bi bi-receipt"></i> Deposit Proof
                      </a>
                    )}
                    {liveDetail.onboardingPaymentProofUrl && (
                      <a href={liveDetail.onboardingPaymentProofUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#1e293b', textDecoration: 'none', fontWeight: 600 }}>
                        <i className="bi bi-receipt"></i> Payment Proof
                      </a>
                    )}
                    {liveDetail.agreementSignatureUrl && (
                      <a href={liveDetail.agreementSignatureUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#1e293b', textDecoration: 'none', fontWeight: 600 }}>
                        <i className="bi bi-pen"></i> Agreement Signature
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rdp-actions" style={{ justifyContent: 'center', gap: '15px', paddingTop: '15px' }}>
              {liveDetail.status === "RESERVED" && (
                <>
                  <button
                    className="action-btn confirm"
                    style={{ padding: '8px 24px', fontSize: '14px' }}
                    onClick={() => {
                      onConfirm(liveDetail);
                      setDetailResident(null);
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="action-btn deny"
                    style={{ padding: '8px 24px', fontSize: '14px' }}
                    onClick={() => {
                      onDenied(liveDetail.residentId);
                      setDetailResident(null);
                    }}
                  >
                    ✕ Deny
                  </button>
                </>
              )}
              {liveDetail.status === "PENDING_TENANT_DETAILS" && (
                <span className="text-muted small" style={{ fontWeight: 600 }}>
                  Waiting for Tenant Details
                </span>
              )}
              {liveDetail.status === "PENDING_OWNER_VERIFICATION" && (
                <>
                  <button
                    className="action-btn confirm"
                    style={{ padding: '8px 24px', fontSize: '14px', backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' }}
                    onClick={async () => {
                      try {
                        await api.put(`${apiPrefix}/${liveDetail.residentId}/verify-and-activate`);
                        setDetailResident(null);
                        window.location.reload();
                      } catch (err) {
                        toast.error("Failed to verify resident.");
                      }
                    }}
                  >
                    ✓ Activate
                  </button>
                  <button
                    className="action-btn deny"
                    style={{ padding: '8px 24px', fontSize: '14px' }}
                    onClick={() => {
                      onDenied(liveDetail.residentId);
                      setDetailResident(null);
                    }}
                  >
                    ✕ Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LOAD MORE ───────────────────────────────────────────────── */}
      {hasMore && (
        <div className="residents-load-more-wrap">
          <button
            className="residents-load-more-btn"
            onClick={() => loadResidents(page + 1, true)}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* ── COLLECT SIGNATURE MODAL ─────────────────────────────────── */}
      {collectSigResident && (
        <CollectSignatureModal
          resident={collectSigResident}
          onClose={() => setCollectSigResident(null)}
          onSave={saveSignatureForResident}
          saving={savingSig}
        />
      )}

      {/* ── AGREEMENT SIGNATURE POPUP ───────────────────────────────── */}
      {agreementPopup && (
        <div
          className="agreement-view-popup-overlay"
          onClick={() => setAgreementPopup(null)}
        >
          <div
            className="agreement-view-popup"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(400px, 95vw)" }}
          >
            <button
              className="agreement-popup-close"
              onClick={() => setAgreementPopup(null)}
            >
              ×
            </button>
            <h5 style={{ fontSize: 15, marginBottom: 4 }}>
              ✍️ Tenant Signature
            </h5>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
              {agreementPopup.name}
            </p>
            <img
              src={agreementPopup.signatureUrl}
              alt="Tenant Signature"
              className="agreement-popup-sig"
              style={{ background: "#f8faff", padding: 8, borderRadius: 8 }}
            />
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <a
                href={agreementPopup.signatureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-btn primary"
                style={{
                  textDecoration: "none",
                  fontSize: 13,
                  padding: "6px 16px",
                }}
              >
                Download
              </a>
              <button
                className="modal-btn cancel"
                style={{ fontSize: 13 }}
                onClick={() => setAgreementPopup(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const fetchData = async (url) => {
  const mod = await import("../../../api/axios");
  const res = await mod.default.get(url);
  return res.data;
};

export default ReservedResidents;