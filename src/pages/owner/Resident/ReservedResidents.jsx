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

  const loadResidents = useCallback(
    async (nextPage = 0, append = false) => {
      try {
        append ? setLoadingMore(true) : setLoading(true);
        const params = new URLSearchParams();
        params.append("page", nextPage);
        params.append("size", PAGE_SIZE);
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
              <th>Charge</th>
              <th>Extra</th>
              <th>Check-in</th>
              <th>Expected Checkout</th>
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
                  colSpan="13"
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
                <tr key={r.residentId}>
                  <td data-label="Name">{r.name}</td>
                  <td data-label="Phone">
                    <div className="phone-cell">
                      <span>{r.phone}</span>
                      <button
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(r.phone);
                          setCopiedId(r.residentId);
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                      >
                        {copiedId === r.residentId ? "Done" : "Copy"}
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
                  <td data-label="Charge">{chargeLabel(r)}</td>
                  <td data-label="Extra">{extraLabel(r)}</td>
                  <td data-label="Check-in">{formatDate(r.checkinDate)}</td>
                  <td data-label="Expected Checkout">
                    {formatDate(r.expectedCheckoutDate)}
                  </td>
                  <td data-label="Payment Status">
                    {r.reservationAmount > 0 ? (
                      <span className="pay-status-badge pay-status-success">✓ Successful</span>
                    ) : (
                      <span className="pay-status-badge pay-status-failed">✕ Failed</span>
                    )}
                  </td>
                  <td data-label="Actions">
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        className="action-btn confirm"
                        onClick={() => onConfirm(r)}
                      >
                        Confirm
                      </button>
                      <button
                        className="action-btn deny"
                        onClick={() => onDenied(r.residentId)}
                      >
                        Deny
                      </button>
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
              <div key={r.residentId} className="rr-card">
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
                        className="rr-card__copy"
                        onClick={() => {
                          navigator.clipboard.writeText(r.phone);
                          setCopiedId(r.residentId);
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                      >
                        {copiedId === r.residentId ? "✓" : "⎘"}
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

                {/* Action buttons */}
                <div className="rr-card__actions">
                  <button
                    className="rr-card__btn rr-card__btn--confirm"
                    onClick={() => onConfirm(r)}
                  >
                    ✓ Confirm Move-in
                  </button>
                  <button
                    className="rr-card__btn rr-card__btn--deny"
                    onClick={() => onDenied(r.residentId)}
                  >
                    ✕ Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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