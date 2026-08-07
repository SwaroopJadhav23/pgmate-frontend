import { FaLeaf, FaDrumstickBite, FaFileAlt } from "react-icons/fa";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../../api/axios";
import "./ActiveResidents.css";
import "./Resident.css";
import "./Agreement.css";
import { TableSkeleton } from "../../public/Skeleton";
import AgreementSignaturePad from "./AgreementSignaturePad";
import PoliceVerificationModal from "./PoliceVerificationModal";

const UploadSignatureModal = ({ resident, onClose, onSave, saving }) => {
  const [sigDataUrl, setSigDataUrl] = useState(null);
  const handleSave = async () => {
    if (!sigDataUrl) {
      await Swal.fire({ icon: "warning", title: "Signature Required", text: "Please draw the tenant's signature before saving.", confirmButtonColor: "#5B5BD6" });
      return;
    }
    onSave(resident.residentId, sigDataUrl);
  };
  return (
    <div className="agreement-view-popup-overlay" onClick={onClose}>
      <div className="agreement-view-popup agreement-view-popup-lg" onClick={(e) => e.stopPropagation()}>
        <button className="agreement-popup-close" onClick={onClose}>×</button>
        <h5>✍️ Add Agreement Signature</h5>
        <p className="ar-modal-subtitle">
          Tenant: <strong>{resident.name}</strong> &nbsp;|&nbsp; {resident.pgName} — {resident.roomNumber} Bed {resident.bedNumber}
        </p>
        <AgreementSignaturePad
          residentName={resident.name}
          pgName={resident.pgName}
          monthlyRent={resident.monthlyRent}
          checkinDate={resident.checkinDate}
          onSigned={(url) => setSigDataUrl(url)}
          onClear={() => setSigDataUrl(null)}
        />
        <div className="ar-modal-actions">
          <button className="modal-btn primary ar-btn-text" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save Signature"}
          </button>
          <button className="modal-btn cancel ar-btn-text" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
};

const PAGE_SIZE = 20;
const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString("en-GB") : "-";
const normalize = (v) => (typeof v === "string" ? v.trim().toUpperCase() : "");
const PAYMENT_MODES = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "WALLET"];
const STAY_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "MONTHLY_BASIC", label: "Monthly" },
  { key: "DAILY_BASIC", label: "Daily" },
];
const formatMoney = (value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
const isDailyResident = (resident) => resident?.stayType === "DAILY_BASIC";
const chargeLabel = (resident) => isDailyResident(resident) ? `${formatMoney(resident.dailyRent)}/day` : formatMoney(resident.monthlyRent);
// eslint-disable-next-line
const extraLabel = (resident) => isDailyResident(resident) ? `${resident.numberOfDays || 0} day(s)` : formatMoney(resident.deposit);


const ActiveResidents = ({ refreshKey, onReload, apiPrefix }) => {
  const isOwner = apiPrefix !== "/manager/residents"; // caretaker/manager = no Dues visibility
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [residents, setResidents] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stayFilter, setStayFilter] = useState("ALL");
  const [detailResident, setDetailResident] = useState(null);
  const [showSettlement, setShowSettlement] = useState(false);
  const [settlementResident, setSettlementResident] = useState(null);
  const [agreementPopup, setAgreementPopup] = useState(null);
  const [uploadSigResident, setUploadSigResident] = useState(null);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [policeResident, setPoliceResident] = useState(null);
  const [settlementForm, setSettlementForm] = useState({ deductedAmount: "", deductionReason: "", refundPaymentMode: "" });
  const [refundFile, setRefundFile] = useState(null);

  const loadResidents = useCallback(async (nextPage = 0, append = false) => {
    try {
      if (append) setLoadingMore(true); else setLoading(true);
      const params = new URLSearchParams();
      params.append("page", nextPage); params.append("size", PAGE_SIZE);
      if (search.trim()) params.append("search", search.trim());
      if (stayFilter !== "ALL") params.append("stayType", stayFilter);
      const res = await api.get(`${apiPrefix}/paged?${params.toString()}`);
      const content = res.data?.content || [];
      const totalPages = res.data?.totalPages || 0;
      setResidents((prev) => (append ? [...prev, ...content] : content));
      setPage(nextPage); setTotalElements(res.data?.totalElements || 0); setHasMore(nextPage + 1 < totalPages);
      return content;
    } finally { setLoading(false); setLoadingMore(false); }
  }, [apiPrefix, search, stayFilter]);

  useEffect(() => { const timer = setTimeout(() => setSearch(searchInput.trim()), 350); return () => clearTimeout(timer); }, [searchInput]);
  useEffect(() => { loadResidents(0, false); }, [loadResidents, refreshKey]);

  const openCheckout = (r) => { setSettlementResident(r); setSettlementForm({ deductedAmount: "", deductionReason: "", refundPaymentMode: "" }); setRefundFile(null); setShowSettlement(true); };

  const submitSettlement = async () => {
    if (!settlementResident) return;
    const isDaily = isDailyResident(settlementResident);
    const deposit = settlementResident.deposit || 0;
    const deducted = isDaily ? 0 : (parseFloat(settlementForm.deductedAmount) || 0);
    if (!isDaily) {
      if (deducted < 0) { Swal.fire({ title: "Invalid Amount", text: "Deduction cannot be negative", icon: "warning", confirmButtonColor: "#5B5BD6" }); return; }
      if (deducted > deposit) { Swal.fire({ title: "Invalid Deduction", text: "Deduction cannot exceed deposit", icon: "warning", confirmButtonColor: "#5B5BD6" }); return; }
      if (deducted > 0 && !settlementForm.deductionReason.trim()) { Swal.fire({ title: "Reason Required", text: "Please provide a deduction reason", icon: "warning", confirmButtonColor: "#5B5BD6" }); return; }
    }
    const fd = new FormData();
    fd.append("deductedAmount", deducted);
    fd.append("deductionReason", isDaily ? "Daily checkout completed" : settlementForm.deductionReason);
    fd.append("refundPaymentMode", isDaily ? "" : settlementForm.refundPaymentMode);
    if (!isDaily && refundFile) fd.append("refundProof", refundFile);
    await api.post(`${apiPrefix}/${settlementResident.residentId}/settle`, fd);
    setShowSettlement(false);
    await Swal.fire({
      icon: "success",
      title: "Checkout Successful!",
      text: `Deposit settled for ${settlementResident.name}.`,
      confirmButtonColor: "#5B5BD6",
      timer: 2000,
      showConfirmButton: false,
    });
    await loadResidents(0, false); onReload?.();
  };

  const uploadSignatureForResident = async (residentId, signatureDataUrl) => {
    setUploadingSig(true);
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
      setResidents((prev) => prev.map((r) => r.residentId === residentId ? { ...r, agreementSignatureUrl: savedUrl } : r));
      setUploadSigResident(null);
      await Swal.fire({ icon: "success", title: "Signature Saved", timer: 1400, showConfirmButton: false });
    } catch (err) {
      console.error("Signature upload error:", err);
      await Swal.fire({ icon: "error", title: "Failed", text: "Could not save signature. Please try again." });
    } finally { setUploadingSig(false); }
  };

  const liveDetail = detailResident
    ? residents.find(r => r.residentId === detailResident.residentId) ?? detailResident
    : null;
  const currentSettlementIsDaily = isDailyResident(settlementResident);
  const residentStats = useMemo(() => ({ total: totalElements, monthly: residents.filter(r => r.stayType === "MONTHLY_BASIC").length, daily: residents.filter(r => r.stayType === "DAILY_BASIC").length, veg: residents.filter(r => r.foodPreference === "VEG").length, nonVeg: residents.filter(r => r.foodPreference === "NON_VEG").length }), [residents, totalElements]);
  const goToDues = (r) => {
    navigate("/owner/rent", {
      state: {
        prefillDue: {
          residentId: r.residentId,
          name: r.name,
          pgName: r.pgName,
          roomNumber: r.roomNumber,
        },
      },
    });
  };

  return (
    <>
      <div className="res-stats-grid">
        <div className="res-stat-card res-stat--total">
          <div className="res-stat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" className="res-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
          <div className="res-stat-info"><span className="res-stat-value">{residentStats.total}</span><span className="res-stat-label">Total Tenants</span><span className="res-stat-sub">Currently staying</span></div>
        </div>
        <div className="res-stat-card res-stat--monthly">
          <div className="res-stat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" className="res-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg></div>
          <div className="res-stat-info"><span className="res-stat-value">{residentStats.monthly}</span><span className="res-stat-label">Monthly</span><span className="res-stat-sub">Long-term tenants</span></div>
        </div>
        <div className="res-stat-card res-stat--daily">
          <div className="res-stat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" className="res-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div>
          <div className="res-stat-info"><span className="res-stat-value">{residentStats.daily}</span><span className="res-stat-label">Daily</span><span className="res-stat-sub">Short-term tenants</span></div>
        </div>
        <div className="res-stat-card res-stat--food">
          <div className="res-stat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" className="res-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg></div>
          <div className="res-stat-info">
            <span className="res-stat-value">{residentStats.veg + residentStats.nonVeg}</span>
            <span className="res-stat-label">Food Preference</span>
            <span className="res-stat-sub"><span className="ar-veg-text">Veg {residentStats.veg}</span>&nbsp;·&nbsp;<span className="ar-nonveg-text">Non-Veg {residentStats.nonVeg}</span></span>
          </div>
        </div>
      </div>

      <h5 className="mb-2">Currently Staying<span className="residents-count-badge">{totalElements}</span></h5>
      <div className="residents-search-bar mb-3">
        <span className="search-icon">Search</span>
        <input type="text" className="residents-search-input" placeholder="Search by name, phone or room..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        {searchInput && <button className="search-clear-btn" onClick={() => setSearchInput("")}>Clear</button>}
      </div>
      <div className="status-tabs mb-3">
        {STAY_FILTERS.map((filter) => (
          <button key={filter.key} className={`status-btn ${stayFilter === filter.key ? "active" : ""}`} onClick={() => setStayFilter(filter.key)}>{filter.label}</button>
        ))}
      </div>
      <p className="search-result-count">Showing <strong>{residents.length}</strong> of {totalElements} residents</p>

      {/* DESKTOP TABLE */}
      {!isMobile && (
        <div className="residents-table-scroll">
          <table className="modern-table">
            <thead>
              <tr>
                <th>S.No</th><th>Name</th><th>Phone</th><th>Rent</th><th>Check-in</th><th>Expected Checkout</th><th>Stay Type</th><th>Paid Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={6} cols={9} />
              ) : residents.length === 0 ? (
                <tr><td colSpan="9" className="ar-text-center">{search ? `No residents found for "${search}"` : "No active residents"}</td></tr>
              ) : (
                residents.map((r, idx) => {
                  // eslint-disable-next-line
                  const mode = normalize(r?.onboardingPaymentMode || "");
                  // eslint-disable-next-line
                  const amount = r?.onboardingPaymentAmount || 0;
                  return (
                    <tr key={r.residentId} onClick={() => setDetailResident(r)} className="ar-cursor-pointer">
                      <td data-label="S.No">{idx + 1}</td>
                      <td data-label="Name">{r.name}</td>
                      <td data-label="Phone">
                        <div className="phone-cell">
                          <span className="phone-number">{r.phone}</span>
                          <button className="copy-btn" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(r.phone); setCopiedId(r.residentId); setTimeout(() => setCopiedId(null), 1500); }}>
                            {copiedId === r.residentId ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-copy"></i>}
                          </button>
                        </div>
                      </td>
                      <td data-label="Charge">{chargeLabel(r)}</td>
                      <td data-label="Check-in">{formatDate(r.checkinDate)}</td>
                      <td data-label="Expected Checkout">{formatDate(r.expectedCheckoutDate)}</td>
                      <td data-label="Stay Type">
                        <span className={`payment-pill ${isDailyResident(r) ? "pill-online" : "pill-cash"}`}>
                          {isDailyResident(r) ? "Daily" : "Monthly"}
                        </span>
                      </td>
                      <td data-label="Paid Status">
                        <span className={`payment-pill ${r.hasPendingDues ? "pill-dues" : "pill-online"}`}>
                          {r.hasPendingDues ? "Pending" : "Paid"}
                        </span>
                      </td>
                      <td data-label="Actions" className="d-flex gap-2 justify-content-center align-items-center" onClick={(e) => e.stopPropagation()}>
                        <a href={`tel:${r.phone}`} className="icon-btn" aria-label="Call">
                          <i className="bi bi-telephone-fill text-success"></i>
                        </a>
                        <a href={`https://wa.me/91${r.phone}`} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="WhatsApp">
                          <i className="bi bi-whatsapp text-success"></i>
                        </a>
                        {isOwner && (
                          <span
                            className="payment-pill pill-dues ar-cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); goToDues(r); }}>
                            Dues
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MOBILE Table */}
      {isMobile && (
        <div className="residents-table-scroll">
          <table className="modern-table mob-table">
            <thead>
              <tr>
                <th>Name</th><th>Rent</th><th>Paid Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={6} cols={4} />
              ) : residents.length === 0 ? (
                <tr><td colSpan="4" className="ar-text-center">{search ? `No residents found for "${search}"` : "No active residents"}</td></tr>
              ) : (
                residents.map((r) => {
                  return (
                    <tr key={r.residentId} onClick={() => setDetailResident(r)} className="ar-cursor-pointer">
                      <td data-label="Name">{r.name}</td>
                      <td data-label="Rent">{chargeLabel(r)}</td>
                      <td data-label="Paid Status">
                        <span className={`payment-pill ${r.hasPendingDues ? "pill-dues" : "pill-online"}`} style={{ fontSize: "0.75rem" }}>
                          {r.hasPendingDues ? "Pending" : "Paid"}
                        </span>
                      </td>
                      <td data-label="Actions" onClick={(e) => e.stopPropagation()}>
                        <div className="mob-actions-wrap">
                          <div className="mob-actions-icons">
                            <a href={`tel:${r.phone}`} className="icon-btn" aria-label="Call"><i className="bi bi-telephone-fill text-success"></i></a>
                            <a href={`https://wa.me/91${r.phone}`} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="WhatsApp"><i className="bi bi-whatsapp text-success"></i></a>
                          </div>
                          {isOwner && (
                            <span
                              className="payment-pill pill-dues ar-cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); goToDues(r); }}
                            >
                              Dues
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && <div className="residents-load-more-wrap"><button className="residents-load-more-btn" onClick={() => loadResidents(page + 1, true)} disabled={loadingMore}>{loadingMore ? "Loading..." : "Load More"}</button></div>}

      {/* SETTLEMENT MODAL */}
      {showSettlement && settlementResident && (
        <div className="modal-backdrop-custom">
          <div className="modal-box ar-modal-fullscreen-mobile">
            <div className="modal-header-custom"><h4>{currentSettlementIsDaily ? "Complete Daily Checkout" : "Deposit Settlement"}</h4><button className="modal-close-btn" onClick={() => setShowSettlement(false)}>✕</button></div>
            <div className="modal-body ar-modal-scrollable-body">
              {currentSettlementIsDaily ? (
                <>
                  <p><strong>Daily Charge:</strong> {formatMoney(settlementResident.dailyRent)}/day</p>
                  <p><strong>Number of Days:</strong> {settlementResident.numberOfDays || 0}</p>
                  <p><strong>Total Stay Amount:</strong> {formatMoney(settlementResident.totalStayAmount)}</p>
                  <p className="text-muted">This will complete the daily stay and free the bed. No deposit settlement is needed.</p>
                </>
              ) : (
                <>
                  <p><strong>Total Deposit:</strong> {formatMoney(settlementResident.deposit)}</p>
                  <Form.Group className="mb-3"><Form.Label>Deduction Amount</Form.Label><Form.Control type="number" maxLength="10" value={settlementForm.deductedAmount} onChange={(e) => setSettlementForm({ ...settlementForm, deductedAmount: e.target.value })} /></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Deduction Reason</Form.Label><Form.Control as="textarea" rows={2} value={settlementForm.deductionReason} onChange={(e) => setSettlementForm({ ...settlementForm, deductionReason: e.target.value })} /></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Refund Payment Mode</Form.Label><Form.Select value={settlementForm.refundPaymentMode} onChange={(e) => setSettlementForm({ ...settlementForm, refundPaymentMode: e.target.value })}><option value="">Select</option>{PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}</Form.Select></Form.Group>
                  <Form.Group><Form.Label>Refund Proof (Optional)</Form.Label><Form.Control type="file" accept="image/*,.pdf" onChange={(e) => setRefundFile(e.target.files[0])} /></Form.Group>
                </>
              )}
            </div>
            <div className="modal-actions ar-modal-sticky-actions">
              <button className="modal-btn cancel" onClick={() => setShowSettlement(false)}>Cancel</button>
              <button className="modal-btn success" onClick={submitSettlement}>{currentSettlementIsDaily ? "Complete Checkout" : "Confirm and Checkout"}</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL POPUP — compact card layout */}
      {liveDetail && (
        <div className="modal-backdrop-custom" onClick={() => setDetailResident(null)}>
          <div className="modal-box rdp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rdp-header">
              <div className="rdp-avatar">{liveDetail.name ? liveDetail.name.charAt(0).toUpperCase() : "?"}</div>
              <div className="rdp-header-text">
                <h4>{liveDetail.name}</h4>
                <span>{liveDetail.pgName} &nbsp;·&nbsp; Room {liveDetail.roomNumber}, Bed {liveDetail.bedNumber} &nbsp;·&nbsp; {isDailyResident(liveDetail) ? "Daily" : "Monthly"}</span>
              </div>
              <button className="rdp-close-btn" onClick={() => setDetailResident(null)}>✕</button>
            </div>

            {isMobile ? (
              <div className="rdp-body-mobile">

                <span className="rdpm-section-title">CONTACT</span>
                <div className="rdpm-row">
                  <div>
                    <span className="rdpm-label">Phone</span>
                    <span className="rdpm-value">{liveDetail.phone}</span>
                  </div>
                  <div className="rdp-phone-icons">
                    <a href={`tel:${liveDetail.phone}`} aria-label="Call"><i className="bi bi-telephone-fill text-success"></i></a>
                    <a href={`https://wa.me/91${liveDetail.phone}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i className="bi bi-whatsapp text-success"></i></a>
                  </div>
                </div>
                <div className="rdpm-row">
                  <span className="rdpm-label">Food preference</span>
                  <span className="rdpm-value">{liveDetail.foodPreference === "VEG" ? <><FaLeaf /> Veg</> : liveDetail.foodPreference === "NON_VEG" ? <><FaDrumstickBite /> Non-Veg</> : "-"}</span>
                </div>

                <div className="rdpm-divider" />

                <span className="rdpm-section-title">ROOM & STAY</span>
                <div className="rdpm-row">
                  <span className="rdpm-label">PG</span>
                  <span className="rdpm-value rdp-link">{liveDetail.pgName}</span>
                </div>
                <div className="rdpm-row">
                  <span className="rdpm-label">Room / bed &middot; stay type</span>
                  <span className="rdpm-value">{liveDetail.roomNumber} / Bed {liveDetail.bedNumber} &middot; {isDailyResident(liveDetail) ? "Daily" : "Monthly"}</span>
                </div>

                <div className="rdpm-divider" />

                <span className="rdpm-section-title">CHARGES</span>
                {isDailyResident(liveDetail) ? (
                  <>
                    <div className="rdpm-row">
                      <span className="rdpm-label">Daily rent &middot; days booked</span>
                      <span className="rdpm-value">{formatMoney(liveDetail.dailyRent)}/day &middot; {liveDetail.numberOfDays || 0}</span>
                    </div>
                    <div className="rdpm-row">
                      <span className="rdpm-label">Onboarding</span>
                      <span className="rdpm-value">
                        {liveDetail.onboardingPaymentMode && <span className="rdp-pill">{liveDetail.onboardingPaymentMode}</span>} {formatMoney(liveDetail.onboardingPaymentAmount)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rdpm-row">
                      <span className="rdpm-label">Rent &middot; deposit</span>
                      <span className="rdpm-value">{formatMoney(liveDetail.monthlyRent)} &middot; {formatMoney(liveDetail.deposit)}</span>
                    </div>
                    <div className="rdpm-row">
                      <span className="rdpm-label">Onboarding</span>
                      <span className="rdpm-value">
                        {liveDetail.onboardingPaymentMode && <span className="rdp-pill">{liveDetail.onboardingPaymentMode}</span>} {formatMoney(liveDetail.onboardingPaymentAmount)}
                      </span>
                    </div>
                  </>
                )}

                <div className="rdpm-divider" />

                <span className="rdpm-section-title">DATES</span>
                <div className="rdpm-row">
                  <span className="rdpm-label">Check-in &middot; expected checkout</span>
                  <span className="rdpm-value">{formatDate(liveDetail.checkinDate)} &middot; {formatDate(liveDetail.expectedCheckoutDate)}</span>
                </div>
                <div className="rdpm-row">
                  <span className="rdpm-label">ID proof</span>
                  <span className="rdpm-value">
                    {liveDetail.idProofUrl ? (
                      <button className="rdp-link-btn" onClick={() => { setPreviewUrl(liveDetail.idProofUrl); setDetailResident(null); }}>View document ↗</button>
                    ) : "-"}
                  </span>
                </div>

                {(liveDetail.emergencyContactName || liveDetail.emergencyContact || liveDetail.emergencyContactRelation) && (
                  <>
                    <div className="rdpm-divider" />
                    <span className="rdpm-section-title">EMERGENCY CONTACT</span>
                    <div className="rdpm-row">
                      <span className="rdpm-label">Name &middot; relation</span>
                      <span className="rdpm-value">{liveDetail.emergencyContactName || "-"} &middot; {liveDetail.emergencyContactRelation || "-"}</span>
                    </div>
                    <div className="rdpm-row">
                      <span className="rdpm-label">Contact</span>
                      <span className="rdpm-value">{liveDetail.emergencyContact || "-"}</span>
                    </div>
                  </>
                )}
                {(liveDetail.agreementSignatureUrl || liveDetail.onboardingPaymentProofUrl) && (
                  <div className="rdpm-row rdpm-row-col">
                    {liveDetail.agreementSignatureUrl && (
                      <button className="rdp-link-btn" onClick={() => { setAgreementPopup({ name: liveDetail.name, signatureUrl: liveDetail.agreementSignatureUrl, pgName: liveDetail.pgName, monthlyRent: liveDetail.monthlyRent, deposit: liveDetail.deposit, dailyRent: liveDetail.dailyRent, numberOfDays: liveDetail.numberOfDays, stayType: liveDetail.stayType, checkinDate: liveDetail.checkinDate, roomNumber: liveDetail.roomNumber, bedNumber: liveDetail.bedNumber }); setDetailResident(null); }}>View agreement ↗</button>
                    )}
                    {liveDetail.onboardingPaymentProofUrl && (
                      <button className="rdp-link-btn" onClick={() => { setPreviewUrl(liveDetail.onboardingPaymentProofUrl); setDetailResident(null); }}>View payment proof ↗</button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rdp-body">
                <div className="rdp-col">
                  <span className="rdp-col-title">CONTACT</span>
                  <span className="rdp-label">Phone</span>
                  <span className="rdp-value">{liveDetail.phone}</span>
                  <div className="rdp-phone-icons">
                    <a href={`tel:${liveDetail.phone}`} aria-label="Call"><i className="bi bi-telephone-fill text-success"></i></a>
                    <a href={`https://wa.me/91${liveDetail.phone}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i className="bi bi-whatsapp text-success"></i></a>
                  </div>
                  <span className="rdp-label">Food Preference</span>
                  <span className="rdp-value">{liveDetail.foodPreference === "VEG" ? <><FaLeaf /> Veg</> : liveDetail.foodPreference === "NON_VEG" ? <><FaDrumstickBite /> Non-Veg</> : "-"}</span>
                </div>

                <div className="rdp-col">
                  <span className="rdp-col-title">ROOM & STAY</span>
                  <span className="rdp-label">PG</span>
                  <span className="rdp-value rdp-link">{liveDetail.pgName}</span>
                  <span className="rdp-label">Room / Bed</span>
                  <span className="rdp-value">{liveDetail.roomNumber} / Bed {liveDetail.bedNumber}</span>
                  <span className="rdp-label">Stay Type</span>
                  <span className="rdp-value">{isDailyResident(liveDetail) ? "Daily" : "Monthly"}</span>
                </div>

                <div className="rdp-col">
                  <span className="rdp-col-title">CHARGES</span>
                  {isDailyResident(liveDetail) ? (
                    <>
                      <span className="rdp-label">Daily Rent</span>
                      <span className="rdp-value">{formatMoney(liveDetail.dailyRent)}/day</span>
                      <span className="rdp-label">Days Booked</span>
                      <span className="rdp-value">{liveDetail.numberOfDays || 0}</span>
                      <span className="rdp-label">Onboarding</span>
                      <span className="rdp-value">
                        {liveDetail.onboardingPaymentMode && <span className="rdp-pill">{liveDetail.onboardingPaymentMode}</span>} {formatMoney(liveDetail.onboardingPaymentAmount)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="rdp-label">Rent</span>
                      <span className="rdp-value">{formatMoney(liveDetail.monthlyRent)}</span>
                      <span className="rdp-label">Deposit</span>
                      <span className="rdp-value">{formatMoney(liveDetail.deposit)}</span>
                      <span className="rdp-label">Onboarding</span>
                      <span className="rdp-value">
                        {liveDetail.onboardingPaymentMode && <span className="rdp-pill">{liveDetail.onboardingPaymentMode}</span>} {formatMoney(liveDetail.onboardingPaymentAmount)}
                      </span>
                    </>
                  )}
                </div>

                <div className="rdp-col">
                  <span className="rdp-col-title">DATES</span>
                  <span className="rdp-label">Check-in</span>
                  <span className="rdp-value">{formatDate(liveDetail.checkinDate)}</span>
                  <span className="rdp-label">Expected Checkout</span>
                  <span className="rdp-value">{formatDate(liveDetail.expectedCheckoutDate)}</span>
                  <span className="rdp-label">ID Proof</span>
                  <span className="rdp-value">
                    {liveDetail.idProofUrl ? (
                      <button className="rdp-link-btn" onClick={() => { setPreviewUrl(liveDetail.idProofUrl); setDetailResident(null); }}>View Document ↗</button>
                    ) : "-"}
                  </span>
                </div>

                <div className="rdp-col">
                  <span className="rdp-col-title">EMERGENCY CONTACT</span>
                  <span className="rdp-label">Contact</span>
                  <span className="rdp-value">{liveDetail.emergencyContact || "-"}</span>
                  <span className="rdp-label">Name</span>
                  <span className="rdp-value">{liveDetail.emergencyContactName || "-"}</span>
                  <span className="rdp-label">Relation</span>
                  <span className="rdp-value">{liveDetail.emergencyContactRelation || "-"}</span>
                  {liveDetail.agreementSignatureUrl && (
                    <button className="rdp-link-btn" onClick={() => { setAgreementPopup({ name: liveDetail.name, signatureUrl: liveDetail.agreementSignatureUrl, pgName: liveDetail.pgName, monthlyRent: liveDetail.monthlyRent, deposit: liveDetail.deposit, dailyRent: liveDetail.dailyRent, numberOfDays: liveDetail.numberOfDays, stayType: liveDetail.stayType, checkinDate: liveDetail.checkinDate, roomNumber: liveDetail.roomNumber, bedNumber: liveDetail.bedNumber }); setDetailResident(null); }}>View Agreement ↗</button>
                  )}
                  {liveDetail.onboardingPaymentProofUrl && (
                    <button className="rdp-link-btn" onClick={() => { setPreviewUrl(liveDetail.onboardingPaymentProofUrl); setDetailResident(null); }}>View Payment Proof ↗</button>
                  )}
                </div>
              </div>
            )}

            <div className="rdp-actions">
  <button className="rdp-btn-edit" onClick={() => { navigate(`/owner/residents/edit/${liveDetail.residentId}`, { state: { resident: liveDetail, apiPrefix } }); setDetailResident(null); }}>Edit</button>
 <button className="rdp-btn-police" onClick={() => { setPoliceResident(liveDetail); setDetailResident(null); }}>Police Verification</button>
  <button className="rdp-btn-checkout" onClick={() => { openCheckout(liveDetail); setDetailResident(null); }}>{isDailyResident(liveDetail) ? "Complete" : "Checkout"}</button>
</div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewUrl && (
        <div className="modal-backdrop-custom">
          <div className="modal-box preview-modal ar-modal-fullscreen-mobile">
            <div className="modal-header-custom"><h4>Document Preview</h4><button className="modal-close-btn" onClick={() => setPreviewUrl(null)}>✕</button></div>
            <div className="modal-body text-center ar-modal-scrollable-body">
              {previewUrl.toLowerCase().endsWith(".pdf") ? (<iframe src={previewUrl} title="Document Preview" width="100%" height="500" className="ar-doc-iframe" />) : (<img src={previewUrl} alt="Document preview" className="ar-doc-img" />)}
            </div>
          </div>
        </div>
      )}

      {/* AGREEMENT POPUP */}
      {agreementPopup && (
        <div className="agreement-view-popup-overlay" onClick={() => setAgreementPopup(null)}>
          <div className="agreement-view-popup agreement-view-popup-md" onClick={(e) => e.stopPropagation()}>
            <button className="agreement-popup-close" onClick={() => setAgreementPopup(null)}>×</button>
            <h5><FaFileAlt /> Rental Agreement</h5>
            <p className="ar-modal-subtitle-sm">
              Tenant: <strong>{agreementPopup.name}</strong> &nbsp;|&nbsp; {agreementPopup.pgName} — Room {agreementPopup.roomNumber}, Bed {agreementPopup.bedNumber}
            </p>
            <div className="ar-modal-content">
              <h6 className="agreement-title">PG Rental Agreement</h6>
              <p className="agreement-body">This agreement is between the PG Owner of <strong>{agreementPopup.pgName}</strong> and tenant <strong>{agreementPopup.name}</strong>.</p>
              <ol className="agreement-terms">
                {agreementPopup.stayType === "DAILY_BASIC" ? (
                  <li>The tenant agrees to pay a daily rent of <strong>₹{Number(agreementPopup.dailyRent || 0).toLocaleString("en-IN")}/day</strong> for <strong>{agreementPopup.numberOfDays} day(s)</strong>. Total: <strong>₹{Number((agreementPopup.dailyRent || 0) * (agreementPopup.numberOfDays || 0)).toLocaleString("en-IN")}</strong>.</li>
                ) : (
                  <>
                    <li>The tenant agrees to pay a monthly rent of <strong>₹{Number(agreementPopup.monthlyRent || 0).toLocaleString("en-IN")}</strong> by the 5th of every month.</li>
                    <li>A security deposit of <strong>₹{Number(agreementPopup.deposit || 0).toLocaleString("en-IN")}</strong> has been collected and will be refunded within 7 days of checkout after deducting damages or dues.</li>
                  </>
                )}
                <li>Check-in date: <strong>{agreementPopup.checkinDate ? new Date(agreementPopup.checkinDate).toLocaleDateString("en-IN") : "-"}</strong>. Early checkout requires 15 days prior written notice.</li>
                <li>The tenant shall keep the room and common areas clean at all times.</li>
                <li>No illegal activities, loud noise after 11 PM, or smoking inside the premises.</li>
                <li>Guests are allowed only in common areas and must leave by 10 PM.</li>
                <li>Management reserves the right to terminate with 7 days notice for rule violations.</li>
                <li>The tenant accepts sole responsibility for their personal belongings.</li>
              </ol>
            </div>
            <p className="ar-sig-label">Tenant Signature:</p>
            <img src={agreementPopup.signatureUrl} alt="Tenant Signature" className="agreement-popup-sig agreement-popup-sig-bg" />
            <div className="ar-modal-actions">
              <a href={agreementPopup.signatureUrl} target="_blank" rel="noopener noreferrer" className="modal-btn primary ar-link-btn">Download</a>
              <button className="modal-btn cancel ar-btn-text" onClick={() => setAgreementPopup(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {uploadSigResident && (
        <UploadSignatureModal resident={uploadSigResident} onClose={() => setUploadSigResident(null)} onSave={uploadSignatureForResident} saving={uploadingSig} />
      )}
      {policeResident && (
        <PoliceVerificationModal resident={policeResident} onClose={() => setPoliceResident(null)} />
      )}
    </>
  );
};

export default ActiveResidents;