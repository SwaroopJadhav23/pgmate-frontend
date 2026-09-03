import { FaFileAlt, FaUtensils, FaTimesCircle } from "react-icons/fa";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../../api/axios";
import "./ActiveResidents.css";
import "./Resident.css";
import "./Agreement.css";
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

const MovingOutLogo = ({ title = "Moving Out" }) => (
  <div className="ar-custom-tooltip" data-tooltip={title} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '12px', cursor: 'default', verticalAlign: 'middle' }}>
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'absolute', top: '-11px', right: '-11px', zIndex: 1 }} fill="none">
      <path d="M12 4l1 3" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M17 5.5l-1.5 2.5" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 9.5l-3 1" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
    <div style={{ width: '28px', height: '28px', backgroundColor: '#fee2e2', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, position: 'relative' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 3h7v18H5z" fill="#ef4444"/>
        <path d="M10 11v2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 12h6m0 0l-2.5-2.5M20 12l-2.5 2.5" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  </div>
);

const PAGE_SIZE = 20;
const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString("en-GB") : "-";
const PAYMENT_MODES = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "WALLET"];
const STAY_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "MONTHLY_BASIC", label: "Monthly" },
  { key: "DAILY_BASIC", label: "Daily" },
];
const formatMoney = (value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
const isDailyResident = (resident) => resident?.stayType === "DAILY_BASIC";
// eslint-disable-next-line
const extraLabel = (resident) => isDailyResident(resident) ? `${resident.numberOfDays || 0} day(s)` : formatMoney(resident.deposit);
// Police verification completeness: all key personal/guardian fields must be filled
const isPoliceVerificationComplete = (r) => {
  return !!(r?.name && r?.dob && r?.phone && r?.aadhaarNumber && r?.email &&
    r?.permanentAddress && r?.guardianName && r?.guardianPhone &&
    r?.localGuardianName && r?.localGuardianAddress && r?.localGuardianPhone);
};


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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stayFilter, setStayFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("newest");
const [sortMenuOpen, setSortMenuOpen] = useState(false);

const SORT_OPTIONS = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "az", label: "Name A–Z" },
  { key: "za", label: "Name Z–A" },
];
  const [detailResident, setDetailResident] = useState(null);
  const [showSettlement, setShowSettlement] = useState(false);
  const [settlementResident, setSettlementResident] = useState(null);
  const [agreementPopup, setAgreementPopup] = useState(null);
  const [uploadSigResident, setUploadSigResident] = useState(null);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [policeResident, setPoliceResident] = useState(null);
  const [settlementForm, setSettlementForm] = useState({ deductedAmount: "", deductionReason: "", refundPaymentMode: "" });
  const [refundFile, setRefundFile] = useState(null);
  
  // Payment History state for checkout
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);

  const fetchPaymentHistory = async (resident) => {
    const residentId = resident.residentId;
    setLoadingPaymentHistory(true);
    setShowPaymentHistory(true);
    try {
      const [manualRes, pendingRentRes, paidRentRes] = await Promise.all([
        api.get(`/owner/rent/manual/resident/${residentId}`),
        api.get("/owner/rent?status=ALL"),
        api.get("/owner/rent?status=PAID")
      ]);
      const manualDues = Array.isArray(manualRes.data) ? manualRes.data : [];
      
      const pendingRents = Array.isArray(pendingRentRes.data) ? pendingRentRes.data : [];
      const paidRents = Array.isArray(paidRentRes.data) ? paidRentRes.data : [];
      const allRents = [...pendingRents, ...paidRents];
      
      const residentRents = allRents.filter(r => r.residentId === residentId);
      
      const combined = [
        ...manualDues.map(d => ({ ...d, isManual: true })),
        ...residentRents.map(r => ({ ...r, isManual: false }))
      ];

      if (resident.deposit && Number(resident.deposit) > 0) {
        combined.push({
          isManual: true,
          dueFor: "Security Deposit",
          description: "Paid during check-in",
          dueDate: resident.checkinDate,
          paidDate: resident.checkinDate,
          amount: resident.deposit,
          status: 'PAID',
          paymentMode: "At Onboarding"
        });
      }

      combined.sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0));
      setPaymentHistory(combined);
    } catch (err) {
      console.error("Failed to fetch payment history", err);
      Swal.fire({ icon: "error", title: "Error", text: "Could not load payment history.", confirmButtonColor: "#5B5BD6" });
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  const loadResidents = useCallback(async (nextPage = 0, append = false) => {
    try {
      if (append) setLoadingMore(true); else setLoading(true);
      const params = new URLSearchParams();
      params.append("page", nextPage); params.append("size", PAGE_SIZE);
      params.append("sort", "createdAt,desc");
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
  const residentStats = useMemo(() => ({ total: totalElements, monthly: residents.filter(r => r.stayType === "MONTHLY_BASIC").length, daily: residents.filter(r => r.stayType === "DAILY_BASIC").length, withFood: residents.filter(r => r.foodFacility !== "Without Food").length, withoutFood: residents.filter(r => r.foodFacility === "Without Food").length }), [residents, totalElements]);

const sortedResidents = useMemo(() => {
  const arr = [...residents];
  switch (sortOption) {
    case "az": return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "za": return arr.sort((a, b) => b.name.localeCompare(a.name));
    case "oldest": return arr.sort((a, b) => new Date(a.checkinDate) - new Date(b.checkinDate));
    case "newest":
    default: return arr.sort((a, b) => new Date(b.checkinDate) - new Date(a.checkinDate));
  }
}, [residents, sortOption]);
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
            <span className="res-stat-value">{residentStats.withFood + residentStats.withoutFood}</span>
            <span className="res-stat-label">Food Facility</span>
            <span className="res-stat-sub"><span className="ar-veg-text">With Food {residentStats.withFood}</span>&nbsp;·&nbsp;<span className="ar-nonveg-text">Without Food {residentStats.withoutFood}</span></span>
          </div>
        </div>
      </div>

      <h5 className="mb-2">Currently Staying<span className="residents-count-badge">{totalElements}</span></h5>
      <div className="residents-search-bar mb-3">
        <span className="search-icon">Search</span>
        <input type="text" className="residents-search-input" placeholder="Search by name, phone or room..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        {searchInput && <button className="search-clear-btn" onClick={() => setSearchInput("")}>Clear</button>}
      </div>
      <div className="status-tabs-row mb-3">
  <div className="status-tabs">
    {STAY_FILTERS.map((filter) => (
      <button key={filter.key} className={`status-btn ${stayFilter === filter.key ? "active" : ""}`} onClick={() => setStayFilter(filter.key)}>{filter.label}</button>
    ))}
  </div>
  <div className="ar-filter-wrap">
    <button
      className="ar-filter-btn"
      onClick={() => setSortMenuOpen((v) => !v)}
      aria-label="Sort filter"
      type="button"
    >
      <i className="bi bi-sliders" style={{ fontSize: '16px' }}></i>
    </button>
    {sortMenuOpen && (
      <>
        <div className="ar-filter-backdrop" onClick={() => setSortMenuOpen(false)} />
        <div className="ar-filter-menu">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`ar-filter-option ${sortOption === opt.key ? "active" : ""}`}
              onClick={() => { setSortOption(opt.key); setSortMenuOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </>
    )}
  </div>
  <button
    type="button"
    aria-label="Send Reminder"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 16px',
      height: '38px',
      border: 'none',
      borderRadius: '999px',
      background: 'linear-gradient(135deg, #25d366 0%, #1ea952 100%)',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 700,
      boxShadow: '0 8px 18px rgba(37, 211, 102, 0.25)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      marginLeft: 'auto',
    }}
  >
    <i className="bi bi-whatsapp" style={{ fontSize: '16px', lineHeight: 1 }}></i>
    Send Reminder
  </button>
</div>
      <p className="search-result-count">Showing <strong>{residents.length}</strong> of {totalElements} residents</p>

      {/* UNIFIED CARD LAYOUT */}
      <div className="resident-card-list">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="resident-card-item" style={{ height: "100px", background: "#f8fafc", animation: "pulse 1.5s infinite" }}></div>
          ))
        ) : residents.length === 0 ? (
          <div className="ar-text-center py-4" style={{ color: "#64748b", background: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
            {search ? `No residents found for "${search}"` : "No active residents"}
          </div>
        ) : (
          sortedResidents.map((r, idx) => (
            <div key={r.residentId} className={`resident-card-item ${r.noticeServed ? 'moving-out-card' : ''}`} onClick={() => setDetailResident(r)}>
              {/* 1. S.No & Name */}
              <div className="r-card-col r-card-profile">
                <div className="r-card-sno">{idx + 1}</div>
                <div className="r-card-name-group">
                  <div className="r-card-name">
                    {r.name}
                    {r.noticeServed && (
                      <MovingOutLogo title="Moving Out" />
                    )}
                  </div>
                  <div className="r-card-pill">{isDailyResident(r) ? "Daily" : "Monthly"}</div>
                </div>
              </div>
              
              {/* 2. Stay Type */}
              <div className="r-card-col r-card-staytype">
                <div className="r-card-label">Stay Type</div>
                <div className="r-card-value">{isDailyResident(r) ? "Daily" : "Monthly"}</div>
              </div>
              
              {/* 3. Paid Status */}
              <div className="r-card-col">
                <div className="r-card-label">Paid Status</div>
                <div className="r-card-value">
                  <span className={`payment-pill ${r.hasPendingDues ? "pill-dues" : "pill-cash"}`}>
                    {r.hasPendingDues ? "Pending" : "Paid"}
                  </span>
                </div>
              </div>
              
              {/* 4. Police Verification */}
              <div className="r-card-col" onClick={(e) => e.stopPropagation()}>
                <div className="r-card-label">Police Verification</div>
                <div className="r-card-value pv-flex mt-1">
                  {isPoliceVerificationComplete(r) ? (
                    <>
                      <span className="pv-text-ok"><i className="bi bi-shield-check"></i> Verified</span>
                      <button className="pv-action-btn pv-action-btn--view ms-2" onClick={(e) => { e.stopPropagation(); setPoliceResident(r); }}><i className="bi bi-eye"></i></button>
                    </>
                  ) : (
                    <>
                      <span className="pv-text-warn"><i className="bi bi-exclamation-triangle-fill"></i> Not Verified</span>
                      <button className="pv-action-btn pv-action-btn--edit ms-2" onClick={(e) => { e.stopPropagation(); navigate(`/owner/residents/edit/${r.residentId}`, { state: { resident: r, apiPrefix } }); }}><i className="bi bi-pencil-square"></i></button>
                    </>
                  )}
                </div>
              </div>
              
              {/* 5. Actions */}
              <div className="r-card-col" onClick={(e) => e.stopPropagation()}>
                <div className="r-card-label">Actions</div>
                <div className="r-card-value d-flex gap-2 mt-1">
                  <a href={`tel:${r.phone}`} className="icon-btn" onClick={(e) => e.stopPropagation()}><i className="bi bi-telephone-fill text-success"></i></a>
                  <a href={`https://wa.me/91${r.phone}?text=Hi%20${encodeURIComponent(r.name)},%20`} target="_blank" rel="noopener noreferrer" className="icon-btn" onClick={(e) => e.stopPropagation()}><i className="bi bi-whatsapp text-success"></i></a>
                  {isOwner && <span className="payment-pill pill-dues ar-cursor-pointer" onClick={(e) => { e.stopPropagation(); goToDues(r); }}>Dues</span>}
                  {isOwner && (
                    <span className="payment-pill ar-cursor-pointer" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }} onClick={(e) => { e.stopPropagation(); setSettlementResident(r); fetchPaymentHistory(r); }}>History</span>
                  )}
                </div>
              </div>

              {/* 6. Three-dot Menu */}
              <div className="r-card-options" onClick={(e) => { e.stopPropagation(); navigate(`/owner/residents/edit/${r.residentId}`, { state: { resident: r, apiPrefix } }); }}>
                <i className="bi bi-three-dots-vertical" style={{ cursor: 'pointer' }}></i>
              </div>
            </div>
          ))
        )}
      </div>

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
            <div className="modal-actions ar-modal-sticky-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button className="modal-btn outline" style={{ marginRight: 'auto' }} onClick={() => fetchPaymentHistory(settlementResident)}>
                View Payment History
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="modal-btn cancel" onClick={() => setShowSettlement(false)}>Cancel</button>
                <button className="modal-btn success" onClick={submitSettlement}>{currentSettlementIsDaily ? "Complete Checkout" : "Confirm and Checkout"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT HISTORY MODAL */}
      {showPaymentHistory && (
        <div className="modal-backdrop-custom" style={{ zIndex: 1060 }}>
          <div className="modal-box ar-modal-fullscreen-mobile" style={{ maxWidth: '600px' }}>
            <div className="modal-header-custom">
              <h4>Payment History ({settlementResident?.name})</h4>
              <button className="modal-close-btn" onClick={() => setShowPaymentHistory(false)}>✕</button>
            </div>
            <div className="modal-body ar-modal-scrollable-body" style={{ padding: '0', backgroundColor: '#f8fafc' }}>
              {loadingPaymentHistory ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <div className="spinner-border text-primary mb-3" role="status"></div>
                  <div>Loading payment history...</div>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <i className="bi bi-receipt" style={{ fontSize: '32px', color: '#cbd5e1', display: 'block', marginBottom: '12px' }}></i>
                  No payment records found.
                </div>
              ) : (
                <div style={{ padding: isMobile ? '12px' : '10px 12px 24px' }}>
                  {isMobile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {paymentHistory.map((record, idx) => {
                        const isRent = !record.isManual || record.dueFor === "Rent";
                        const isPaid = record.status === 'PAID';
                        return (
                          <div key={idx} style={{ background: '#ffffff', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ 
                                  width: '36px', height: '36px', borderRadius: '10px', minWidth: '36px',
                                  backgroundColor: isRent ? '#eef2ff' : '#fff1f2', 
                                  color: isRent ? '#4f46e5' : '#e11d48', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' 
                                }}>
                                  <i className={`bi ${isRent ? 'bi-house-door-fill' : 'bi-lightning-charge-fill'}`}></i>
                                </div>
                                <div>
                                  <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{record.isManual ? (record.dueFor || "Manual Due") : "Monthly Rent"}</div>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Due: {formatDate(record.dueDate)}</div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                                  {formatMoney(record.totalAmount || record.amount || record.rentAmount)}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                              <div>
                                {isPaid && record.paidDate ? (
                                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                                    <i className="bi bi-calendar-check" style={{ marginRight: '4px' }}></i>Paid: {formatDate(record.paidDate)}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>Pending</div>
                                )}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ 
                                  padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                                  backgroundColor: isPaid ? '#dcfce7' : '#fee2e2',
                                  color: isPaid ? '#16a34a' : '#dc2626',
                                  display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }}>
                                  {isPaid && <i className="bi bi-check-circle-fill"></i>}
                                  {record.status || "PENDING"}
                                </span>
                                {isPaid && record.paymentMode && (
                                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Via {record.paymentMode.replace('_', ' ')}
                                  </div>
                                )}
                              </div>
                            </div>
                            {record.description && (
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                                {record.description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ margin: 0 }}>
                      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                          <tr>
                            <th style={{ padding: '4px 10px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none', textAlign: 'left' }}>Type</th>
                            <th style={{ padding: '4px 10px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none', textAlign: 'left' }}>Due Date</th>
                            <th style={{ padding: '4px 10px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none', textAlign: 'left' }}>Amount</th>
                            <th style={{ padding: '4px 10px', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none', textAlign: 'left' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.map((record, idx) => {
                            const isRent = !record.isManual || record.dueFor === "Rent";
                            const isPaid = record.status === 'PAID';
                            return (
                              <tr key={idx} style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                                <td style={{ padding: '12px 10px', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', border: '1px solid #f1f5f9', borderRight: 'none' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ 
                                      width: '36px', height: '36px', borderRadius: '10px', minWidth: '36px',
                                      backgroundColor: isRent ? '#eef2ff' : '#fff1f2', 
                                      color: isRent ? '#4f46e5' : '#e11d48', 
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' 
                                    }}>
                                      <i className={`bi ${isRent ? 'bi-house-door-fill' : 'bi-lightning-charge-fill'}`}></i>
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '13.5px', whiteSpace: 'nowrap' }}>{record.isManual ? (record.dueFor || "Manual Due") : "Monthly Rent"}</div>
                                      {record.description && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{record.description}</div>}
                                    </div>
                                  </div>
                              </td>
                              <td style={{ padding: '12px 10px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                <div>{formatDate(record.dueDate)}</div>
                                {isPaid && record.paidDate && (
                                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px', fontWeight: '600' }}>
                                    <i className="bi bi-calendar-check" style={{ marginRight: '4px' }}></i>
                                    Paid: {formatDate(record.paidDate)}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px 10px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontSize: '14px', fontWeight: '700' }}>
                                {formatMoney(record.totalAmount || record.amount || record.rentAmount)}
                              </td>
                              <td style={{ padding: '12px 10px', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', border: '1px solid #f1f5f9', borderLeft: 'none', whiteSpace: 'nowrap' }}>
                                <span style={{ 
                                  padding: '4px 8px', 
                                  borderRadius: '6px', 
                                  fontSize: '11px', 
                                  fontWeight: '700',
                                  backgroundColor: isPaid ? '#dcfce7' : '#fee2e2',
                                  color: isPaid ? '#16a34a' : '#dc2626',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  {isPaid && <i className="bi bi-check-circle-fill"></i>}
                                  {record.status || "PENDING"}
                                </span>
                                {isPaid && record.paymentMode && (
                                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Via {record.paymentMode.replace('_', ' ')}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                <span>{liveDetail.pgName} &nbsp;·&nbsp; Room {liveDetail.roomNumber}, Bed {liveDetail.bedNumber} &nbsp;·&nbsp; {isDailyResident(liveDetail) ? "Daily" : "Monthly"}</span>
              </div>
              <button className="rdp-close-btn" onClick={() => setDetailResident(null)}>✕</button>
            </div>

            {liveDetail.noticeServed && (
              <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", borderBottom: "1px solid #fecaca", padding: "10px 26px", fontSize: "13.5px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <span><strong>Notice Served:</strong> This tenant is scheduled to move out on <strong>{formatDate(liveDetail.expectedCheckoutDate)}</strong>.</span>
              </div>
            )}

            {isMobile ? (
              <div className="rdp-body-mobile">

                <span className="rdpm-section-title">CONTACT</span>
                <div className="rdpm-row">
                  <div>
                    <span className="rdpm-label">Phone</span>
                    <span className="rdpm-value">{liveDetail.phone}</span>
                  </div>
                  <div className="rdp-phone-icons">
                    <a href={`tel:${liveDetail.phone}`} aria-label="Call" onClick={(e) => e.stopPropagation()}><i className="bi bi-telephone-fill text-success"></i></a>
                    <a href={`https://wa.me/91${liveDetail.phone}?text=Hi%20${encodeURIComponent(liveDetail.name)},%20`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" onClick={(e) => e.stopPropagation()}><i className="bi bi-whatsapp text-success"></i></a>
                  </div>
                </div>
                <div className="rdpm-row">
                  <span className="rdpm-label">Food Facility</span>
                  <span className="rdpm-value">
                    {liveDetail.foodFacility !== "Without Food" 
                      ? <><FaUtensils className="text-warning" style={{marginRight: '4px'}} /> With Food</> 
                      : <><FaTimesCircle className="text-secondary" style={{marginRight: '4px'}} /> Without Food</>}
                  </span>
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
                    {liveDetail.futureDepositRefund != null && liveDetail.futureDepositRefund > 0 && (
                      <div className="rdpm-row">
                        <span className="rdpm-label">Future Refund</span>
                        <span className="rdpm-value">{formatMoney(liveDetail.futureDepositRefund)}</span>
                      </div>
                    )}
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
                    <a href={`tel:${liveDetail.phone}`} aria-label="Call" onClick={(e) => e.stopPropagation()}><i className="bi bi-telephone-fill text-success"></i></a>
                    <a href={`https://wa.me/91${liveDetail.phone}?text=Hi%20${encodeURIComponent(liveDetail.name)},%20`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" onClick={(e) => e.stopPropagation()}><i className="bi bi-whatsapp text-success"></i></a>
                  </div>
                  <span className="rdp-label">Food Facility</span>
                  <span className="rdp-value">
                    {liveDetail.foodFacility !== "Without Food" 
                      ? <><FaUtensils className="text-warning" style={{marginRight: '4px'}} /> With Food</> 
                      : <><FaTimesCircle className="text-secondary" style={{marginRight: '4px'}} /> Without Food</>}
                  </span>
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
                      {liveDetail.futureDepositRefund != null && liveDetail.futureDepositRefund > 0 && (
                        <>
                          <span className="rdp-label">Future Refund</span>
                          <span className="rdp-value">{formatMoney(liveDetail.futureDepositRefund)}</span>
                        </>
                      )}
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
              <button className="rdp-btn-police" onClick={() => { setPoliceResident(liveDetail); }}>Police Verification Form</button>
              <button className="rdp-btn-edit" onClick={() => { navigate(`/owner/residents/edit/${liveDetail.residentId}`, { state: { resident: liveDetail, apiPrefix } }); setDetailResident(null); }}>Edit</button>
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
        <PoliceVerificationModal resident={policeResident} apiPrefix={apiPrefix} onClose={() => setPoliceResident(null)} />
      )}
    </>
  );
};

export default ActiveResidents;