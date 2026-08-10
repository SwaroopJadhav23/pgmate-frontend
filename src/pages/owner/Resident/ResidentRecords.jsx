import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { TableSkeleton } from "../../public/Skeleton";
import "./ResidentRecords.css";

const PAGE_SIZE = 20;
const STAY_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "MONTHLY_BASIC", label: "Monthly" },
  { key: "DAILY_BASIC", label: "Daily" },
];
const formatDate = (dt) =>
  dt ? new Date(dt).toLocaleDateString("en-GB") : "-";
const formatMoney = (value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
const isDaily = (resident) => resident?.stayType === "DAILY_BASIC";
const chargeLabel = (resident) =>
  isDaily(resident)
    ? `${formatMoney(resident.dailyRent)}/day`
    : formatMoney(resident.monthlyRent);
const extraLabel = (resident) =>
  isDaily(resident)
    ? `${resident.numberOfDays || 0} day(s)`
    : formatMoney(resident.deposit);

const ResidentRecords = ({ apiPrefix }) => {
  const [records, setRecords] = useState([]);
  const stats = {
    totalCheckouts: records.length,
    totalRefundedAmount: records.reduce(
      (sum, r) => sum + (r.refundAmount || 0),
      0,
    ),
    totalRefunded: records.filter((r) => (r.refundAmount || 0) > 0).length,
    totalDeductions: records.reduce(
      (sum, r) => sum + (r.deductedAmount || 0),
      0,
    ),
  };

  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("ALL");
  const [stayFilter, setStayFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pgName, setPgName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const queryParams = useMemo(
    () => ({
      search: search.trim(),
      settlement: filterMode,
      stayType: stayFilter,
      pgName: pgName.trim(),
      roomNumber: roomNumber.trim(),
      bedNumber: bedNumber.trim(),
      fromDate,
      toDate,
    }),
    [
      search,
      filterMode,
      stayFilter,
      pgName,
      roomNumber,
      bedNumber,
      fromDate,
      toDate,
    ],
  );

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`${apiPrefix}/records/paged`, {
          params: {
            page: 0,
            size: PAGE_SIZE,
            sort: "createdAt,desc",
            search: queryParams.search || undefined,
            settlement:
              queryParams.settlement && queryParams.settlement !== "ALL"
                ? queryParams.settlement
                : undefined,
            stayType:
              queryParams.stayType && queryParams.stayType !== "ALL"
                ? queryParams.stayType
                : undefined,
            pgName: queryParams.pgName || undefined,
            roomNumber: queryParams.roomNumber || undefined,
            bedNumber: queryParams.bedNumber || undefined,
            fromDate: queryParams.fromDate || undefined,
            toDate: queryParams.toDate || undefined,
          },
        });
        setRecords(res.data?.content || []);
        setPage(res.data?.number || 0);
        setTotalPages(res.data?.totalPages || 0);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [apiPrefix, queryParams]);

  const handleLoadMore = async () => {
    if (loadingMore || page + 1 >= totalPages) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await api.get(`${apiPrefix}/records/paged`, {
        params: {
          page: nextPage,
          size: PAGE_SIZE,
          sort: "createdAt,desc",
          search: queryParams.search || undefined,
          settlement:
            queryParams.settlement && queryParams.settlement !== "ALL"
              ? queryParams.settlement
              : undefined,
          stayType:
            queryParams.stayType && queryParams.stayType !== "ALL"
              ? queryParams.stayType
              : undefined,
          pgName: queryParams.pgName || undefined,
          roomNumber: queryParams.roomNumber || undefined,
          bedNumber: queryParams.bedNumber || undefined,
          fromDate: queryParams.fromDate || undefined,
          toDate: queryParams.toDate || undefined,
        },
      });
      setRecords((prev) => [...prev, ...(res.data?.content || [])]);
      setPage(res.data?.number || nextPage);
      setTotalPages(res.data?.totalPages || totalPages);
    } finally {
      setLoadingMore(false);
    }
  };

    const handleDeleteRecord = async (record) => {
    const confirm = await Swal.fire({
      title: "Delete Checkout Record?",
      text: `This will permanently remove ${record.name}'s checkout record.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.delete(`${apiPrefix}/records/${record.residentId}`);
      setRecords((prev) => prev.filter((r) => r.residentId !== record.residentId));
      toast.success("Checkout record deleted.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete record.");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setFilterMode("ALL");
    setStayFilter("ALL");
    setPgName("");
    setRoomNumber("");
    setBedNumber("");
    setFromDate("");
    setToDate("");
  };

  const hasActiveFilters =
    search ||
    filterMode !== "ALL" ||
    stayFilter !== "ALL" ||
    pgName ||
    roomNumber ||
    bedNumber ||
    fromDate ||
    toDate;

  return (
    <DashboardLayout
      title="Checkout Records"
      subtitle="Exited Residents by Monthly and Daily stays"
    >
      {/* STATS CARDS */}
      <div className="booking-stats-grid">
        <div className="booking-stat-card total">
          <div className="icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="res-stat-icon"
              strokeWidth="2"
            >
              <path d="M3 12h18" />
              <path d="M13 5l7 7-7 7" />
            </svg>
          </div>
          <div>
            <div className="value">{stats.totalCheckouts}</div>
            <div className="label">Total Checkouts</div>
          </div>
        </div>
        <div className="booking-stat-card monthly">
          <div className="icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="res-stat-icon"
              strokeWidth="2"
            >
              <path d="M6 4h12" />
              <path d="M6 8h12" />
              <path d="M6 12h5a4 4 0 0 0 0-8" />
              <path d="M6 12l8 8" />
            </svg>
          </div>
          <div>
            <div className="value">
              ₹{stats.totalRefundedAmount.toLocaleString("en-IN")}
            </div>
            <div className="label">Refunded Amount</div>
          </div>
        </div>
        <div className="booking-stat-card daily">
          <div className="icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="res-stat-icon"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="value">{stats.totalRefunded}</div>
            <div className="label">Refunded</div>
          </div>
        </div>
        <div className="booking-stat-card rejected">
          <div className="icon-wrap">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="res-stat-icon"
              strokeWidth="2"
            >
              <path d="M6 4h12" />
              <path d="M6 8h12" />
              <path d="M6 12h5a4 4 0 0 0 0-8" />
              <path d="M6 12l8 8" />
            </svg>
          </div>
          <div>
            <div className="value">
              ₹{stats.totalDeductions.toLocaleString("en-IN")}
            </div>
            <div className="label">Deductions</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP FILTER BAR — hidden on mobile
      ══════════════════════════════════════════ */}
      <div className="records-filter-card rrc-desktop-filters">
        <div className="records-filter-grid records-filter-grid-simple">
          <div className="filter-search">
            <label className="form-label">Search</label>
            <input
              className="form-control"
              placeholder="Name / Phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-pg">
            <label className="form-label">PG</label>
            <input
              className="form-control"
              placeholder="PG name"
              value={pgName}
              onChange={(e) => setPgName(e.target.value)}
            />
          </div>
          <div className="filter-room">
            <label className="form-label">Room</label>
            <input
              className="form-control"
              placeholder="Room number"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />
          </div>
          <div className="filter-bed">
            <label className="form-label">Bed</label>
            <input
              className="form-control"
              placeholder="Bed number"
              value={bedNumber}
              onChange={(e) => setBedNumber(e.target.value)}
            />
          </div>
          <div className="filter-settlement">
            <label className="form-label">Settlement</label>
            <select
              className="form-select"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="SETTLED">Settled</option>
              <option value="UNSETTLED">Unsettled</option>
            </select>
          </div>
          <div className="filter-settlement">
            <label className="form-label">Stay Type</label>
            <select
              className="form-select"
              value={stayFilter}
              onChange={(e) => setStayFilter(e.target.value)}
            >
              {STAY_FILTERS.map((filter) => (
                <option key={filter.key} value={filter.key}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-from">
            <label className="form-label">From</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="filter-to">
            <label className="form-label">To</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="filter-reset">
            <button className="records-filter-reset" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE FILTER BAR — search + filter toggle
      ══════════════════════════════════════════ */}
      <div className="rrc-mobile-filter-bar">
        {/* Always-visible search row */}
        <div className="rrc-mobile-search-row">
          <div className="rrc-mobile-search-wrap">
            <svg
              className="rrc-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" />
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeLinecap="round"
              />
            </svg>
            <input
              className="rrc-mobile-search"
              placeholder="Search name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="rrc-clear-btn" onClick={() => setSearch("")}>
                ✕
              </button>
            )}
          </div>
          <button
            className={`rrc-filter-toggle ${showMobileFilters ? "rrc-filter-toggle--active" : ""} ${hasActiveFilters ? "rrc-filter-toggle--dot" : ""}`}
            onClick={() => setShowMobileFilters((v) => !v)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              width="16"
              height="16"
            >
              <path
                d="M4 6h16M7 12h10M10 18h4"
                stroke="currentColor"
                strokeLinecap="round"
              />
            </svg>
            Filters
          </button>
        </div>

        {/* Expandable filter panel */}
        {showMobileFilters && (
          <div className="rrc-mobile-filter-panel">
            <div className="rrc-mobile-filter-grid">
              <div className="rrc-mf-field">
                <label className="rrc-mf-label">PG Name</label>
                <input
                  className="form-control rrc-mf-input"
                  placeholder="PG name"
                  value={pgName}
                  onChange={(e) => setPgName(e.target.value)}
                />
              </div>
              <div className="rrc-mf-field">
                <label className="rrc-mf-label">Room</label>
                <input
                  className="form-control rrc-mf-input"
                  placeholder="Room number"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </div>
              <div className="rrc-mf-field">
                <label className="rrc-mf-label">Bed</label>
                <input
                  className="form-control rrc-mf-input"
                  placeholder="Bed number"
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                />
              </div>
              <div className="rrc-mf-field">
                <label className="rrc-mf-label">Settlement</label>
                <select
                  className="form-select rrc-mf-input"
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                >
                  <option value="ALL">All</option>
                  <option value="SETTLED">Settled</option>
                  <option value="UNSETTLED">Unsettled</option>
                </select>
              </div>
              <div className="rrc-mf-field">
                <label className="rrc-mf-label">Stay Type</label>
                <select
                  className="form-select rrc-mf-input"
                  value={stayFilter}
                  onChange={(e) => setStayFilter(e.target.value)}
                >
                  {STAY_FILTERS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rrc-mf-field">
                <label className="rrc-mf-label">From Date</label>
                <input
                  type="date"
                  className="form-control rrc-mf-input"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="rrc-mf-field">
                <label className="rrc-mf-label">To Date</label>
                <input
                  type="date"
                  className="form-control rrc-mf-input"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
            <div className="rrc-mf-actions">
              <button
                className="rrc-mf-reset"
                onClick={() => {
                  resetFilters();
                  setShowMobileFilters(false);
                }}
              >
                Reset All
              </button>
              <button
                className="rrc-mf-apply"
                onClick={() => setShowMobileFilters(false)}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP TABLE — hidden on mobile via CSS
      ══════════════════════════════════════════ */}
      <div className="rrc-desktop-table-wrap table-responsive rr-table-scope">
        <table className="modern-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name</th>
              <th>Phone</th>
              <th>PG</th>
              <th>Stay</th>
              <th>Charge</th>
              <th>Check-in</th>
              <th>Checkout</th>
              <th>Refund Mode</th>
              <th>Refund Proof</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={8} cols={11} />
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="11" className="rrc-table-empty">No records found</td>
              </tr>
            ) : (
              records.map((r, index) => {
                const isDailyStay = isDaily(r);
                return (
                  <tr
                    key={r.residentId}
                    onClick={() => setDetailRecord(r)}
                    className="rrc-cursor-pointer"
                  >
                    <td>{index + 1}</td>
                    <td>{r.name}</td>
                    <td>{r.phone}</td>
                    <td>{r.pgName}</td>
                    <td>{isDailyStay ? "Daily" : "Monthly"}</td>
                    <td>{chargeLabel(r)}</td>
                    <td>{formatDate(r.checkinDate)}</td>
                    <td>{formatDate(r.actualCheckoutDate)}</td>
                   <td>{r.refundPaymentMode || "Not Recorded"}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {r.refundProofUrl ? (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setPreviewUrl(r.refundProofUrl)}>View</button>
                      ) : "-"}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteRecord(r)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" width="16" height="16">
                          <path d="M3 6h18" stroke="currentColor" strokeLinecap="round" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeLinecap="round" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeLinecap="round" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* detail modal — hidden cols: Room, Bed, Bonus, Deducted, Refunded, Settlement Date */}
      {detailRecord && (
        <div className="rrp-backdrop" onClick={() => setDetailRecord(null)}>
          <div className="rrp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rrp-header">
              <div className="rrp-avatar">{detailRecord.name?.charAt(0).toUpperCase()}</div>
              <div className="rrp-header-text">
                <h4>{detailRecord.name}</h4>
                <span>{detailRecord.phone}</span>
              </div>
              <button className="rrp-close-btn" onClick={() => setDetailRecord(null)}>✕</button>
            </div>

            <div className="rrp-body">
              <div className="rrp-col">
                <div className="rrp-col-title">STAY INFO</div>
                <span className="rrp-label">PG</span><span className="rrp-value">{detailRecord.pgName}</span>
                <span className="rrp-label">Room / Bed</span><span className="rrp-value">{detailRecord.roomNumber} / Bed {detailRecord.bedNumber}</span>
                <span className="rrp-label">Stay Type</span><span className="rrp-value">{isDaily(detailRecord) ? "Daily" : "Monthly"}</span>
              </div>

              <div className="rrp-col">
                <div className="rrp-col-title">CHARGES</div>
                <span className="rrp-label">Charge</span><span className="rrp-value">{chargeLabel(detailRecord)}</span>
                <span className="rrp-label">Bonus</span><span className="rrp-value">{extraLabel(detailRecord)}</span>
                <span className="rrp-label">Deducted</span><span className="rrp-value rrp-danger">{formatMoney(detailRecord.deductedAmount)}</span>
                <span className="rrp-label">Refunded</span><span className="rrp-value rrp-success">{formatMoney(detailRecord.refundAmount)}</span>
                <span className="rrp-label">Refund Mode</span><span className="rrp-value">{detailRecord.refundPaymentMode || "Not Recorded"}</span>
              </div>

              <div className="rrp-col">
                <div className="rrp-col-title">DATES</div>
                <span className="rrp-label">Check-in</span><span className="rrp-value">{formatDate(detailRecord.checkinDate)}</span>
                <span className="rrp-label">Checkout</span><span className="rrp-value">{formatDate(detailRecord.actualCheckoutDate)}</span>
                <span className="rrp-label">Settlement Date</span><span className="rrp-value">{formatDate(detailRecord.settlementDate)}</span>
              </div>
            </div>

            {detailRecord.refundProofUrl && (
              <button
                className="rrp-link-btn"
                onClick={() => { setPreviewUrl(detailRecord.refundProofUrl); setDetailRecord(null); }}
              >
                View Refund Proof ↗
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MOBILE CARDS — completely outside the table,
          hidden on desktop via CSS
      ══════════════════════════════════════════ */}
      <div className="rrcm-card-list">
        {loading ? (
          <div className="rrcm-loading">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rrcm-skeleton" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="rrcm-empty">No records found</div>
        ) : (
          records.map((r) => {
            const isDailyStay = isDaily(r);
            return (
              <div
                key={r.residentId}
                className={`rrcm-card rrcm-card--${isDailyStay ? "daily" : "monthly"}`}
              >
                {/* Header */}
                <div className="rrcm-header">
                  <div className="rrcm-header__left">
                    <span className="rrcm-name">{r.name}</span>
                    <span className="rrcm-sub">
                      {r.pgName} · Room {r.roomNumber} · Bed {r.bedNumber}
                    </span>
                  </div>
                  <span
                    className={`rrcm-badge rrcm-badge--${isDailyStay ? "daily" : "monthly"}`}
                  >
                    {isDailyStay ? "Daily" : "Monthly"}
                  </span>
                </div>

                {/* Phone row */}
                <div className="rrcm-phone-row">
                  <span className="rrcm-phone">{r.phone}</span>
                  <div className="rrcm-phone-actions">
                    <button
                      className="rrcm-copy-pill"
                      onClick={() => navigator.clipboard.writeText(r.phone)}
                    >
                      Copy
                    </button>
                    <a
                      href={`tel:${r.phone}`}
                      className="rrcm-icon-btn rrcm-icon-btn--call"
                      aria-label="Call"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="2"
                        width="15"
                        height="15"
                      >
                        <path
                          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.37 1.78.72 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.48a2 2 0 0 1 2.11-.45c.82.35 1.7.6 2.6.72A2 2 0 0 1 22 16.92z"
                          stroke="currentColor"
                        />
                      </svg>
                    </a>
                    <a
                      href={`https://wa.me/${r.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rrcm-icon-btn rrcm-icon-btn--wa"
                      aria-label="WhatsApp"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="2"
                        width="15"
                        height="15"
                      >
                        <path
                          d="M21 11.5a8.38 8.38 0 0 1-1.9 5.4 8.5 8.5 0 0 1-7.6 2.7L3 21l1.9-8.2a8.5 8.5 0 0 1 2.7-7.6 8.38 8.38 0 0 1 5.4-1.9h.5a8.48 8.48 0 0 1 8 8v.2z"
                          stroke="currentColor"
                        />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Rent grid — 2 cols */}
                <div className="rrcm-rent-grid">
                  <div className="rrcm-rent-cell">
                    <span className="rrcm-rent-label">Charge</span>
                    <span className="rrcm-rent-val">{chargeLabel(r)}</span>
                  </div>
                  <div className="rrcm-rent-cell rrcm-rent-cell--right">
                    <span className="rrcm-rent-label">
                      {isDailyStay ? "Days" : "Deposit"}
                    </span>
                    <span className="rrcm-rent-val">{extraLabel(r)}</span>
                  </div>
                </div>

                {/* Dates row */}
                <div className="rrcm-dates-grid">
                  <div className="rrcm-date-cell">
                    <span className="rrcm-date-label">Check-in</span>
                    <span className="rrcm-date-val">
                      {formatDate(r.checkinDate)}
                    </span>
                  </div>
                  <div className="rrcm-date-cell rrcm-date-cell--right">
                    <span className="rrcm-date-label">Checkout</span>
                    <span className="rrcm-date-val">
                      {formatDate(r.actualCheckoutDate)}
                    </span>
                  </div>
                </div>

                {/* Financial row */}
                <div className="rrcm-finance-grid">
                  <div className="rrcm-finance-cell">
                    <span className="rrcm-finance-label">Deducted</span>
                    <span className="rrcm-finance-val rrcm-finance-val--deduct">
                      {formatMoney(r.deductedAmount)}
                    </span>
                  </div>
                  <div className="rrcm-finance-cell rrcm-finance-cell--mid">
                    <span className="rrcm-finance-label">Refunded</span>
                    <span className="rrcm-finance-val rrcm-finance-val--refund">
                      {formatMoney(r.refundAmount)}
                    </span>
                  </div>
                  <div className="rrcm-finance-cell">
                    <span className="rrcm-finance-label">Mode</span>
                    <span className="rrcm-finance-val">
                      {r.refundPaymentMode || "Not Recorded"}
                    </span>
                  </div>
                </div>

                {/* Footer: settlement date + optional proof */}
                <div className="rrcm-footer">
                  <div className="rrcm-settlement">
                    <span className="rrcm-settlement-label">Settlement</span>
                    <span className="rrcm-settlement-val">
                      {formatDate(r.settlementDate)}
                    </span>
                  </div>
                  {r.refundProofUrl && (
                    <button
                      className="rrcm-proof-btn"
                      onClick={() => setPreviewUrl(r.refundProofUrl)}
                    >
                      View Proof
                    </button>
                  )}
                  <button
                    className="rrcm-proof-btn"
                    style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                    onClick={() => handleDeleteRecord(r)}
                  >
                     <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" width="16" height="16">
                          <path d="M3 6h18" stroke="currentColor" strokeLinecap="round" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeLinecap="round" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeLinecap="round" />
                        </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More */}
      {!loading && page + 1 < totalPages && (
        <div className="records-load-more-wrap">
          <button
            className="records-load-more"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="modal-box preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="preview-header">
              <h4>Refund Proof</h4>
              <button
                className="modal-close-btn"
                onClick={() => setPreviewUrl(null)}
              >
                X
              </button>
            </div>
            <div className="preview-body">
              {previewUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewUrl}
                  title="Preview"
                  className="preview-frame"
                />
              ) : (
                <img src={previewUrl} alt="Preview" className="preview-image" />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ResidentRecords;
