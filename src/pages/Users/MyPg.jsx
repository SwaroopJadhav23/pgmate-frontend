import { useEffect, useState, useMemo, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import UserLayout from "../../layouts/UserLayout";
import api from "../../api/axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { generateBookingInvoice } from "../../utils/generateInvoice";
import "./MyPg.css";

const STATUS_TABS = ["ACTIVE", "PENDING", "INACTIVE", "CANCELLED"];

const MyPg = () => {
  const [myPgs, setMyPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [ownerMessages, setOwnerMessages] = useState([]);
  const [openMsgPopover, setOpenMsgPopover] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [searchParams] = useSearchParams();

  const fetchMyPgs = () => {
    setLoading(true);
    api
      .get("/residents/my-pgs")
      .then((res) => {
        const pgs = res.data || [];
        setMyPgs(pgs);
        // Auto-switch to PENDING if there's any pending reservation
        const anyPending = pgs.some(
          p => p.status === "RESERVED" || 
               p.status === "PENDING_TENANT_DETAILS" || 
               p.status === "PENDING_OWNER_VERIFICATION"
        );
        if (anyPending) {
          setActiveTab("PENDING");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyPgs();
  }, []);

  useEffect(() => {
    api.get("/complaints/my")
      .then((res) => {
        const withResponse = (res.data || []).filter(
          (c) => c.ownerResponse && c.ownerResponse.trim()
        );
        setOwnerMessages(withResponse);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab")?.toUpperCase();
    if (tab && STATUS_TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleCancelBooking = async (pg) => {
    const result = await Swal.fire({
      title: "Cancel Booking?",
      text: `You are about to cancel your reservation at ${pg.pgName}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel Booking",
      cancelButtonText: "Keep Booking",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#4f46e5",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    const residentId = pg.residentId || pg.id;
    setCancelling(residentId);
    try {
      await api.put(`/residents/${residentId}/cancel`);
      toast.success("Your reservation has been cancelled successfully.");
      fetchMyPgs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setCancelling(null);
    }
  };

  const handleGiveNotice = async (pg) => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 30);
    const minDateStr = minDate.toISOString().split("T")[0];

    const { value: targetDate, isConfirmed } = await Swal.fire({
      title: "Give Notice to Move Out",
      html: `
        <div style="padding: 10px 0;">
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 8px; text-align: left; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #1e3a8a; line-height: 1.5; font-weight: 500;">
              As per standard policy, a minimum <strong>30-day notice</strong> is required before vacating.
            </p>
          </div>
          <div style="text-align: left;">
            <label style="font-weight: 700; font-size: 12px; color: #64748b; margin-bottom: 8px; display: block; text-transform: uppercase; letter-spacing: 0.5px;">Expected Checkout Date</label>
            <div style="position: relative;">
              <input type="date" id="moveOutDate" style="width: 100%; box-sizing: border-box; padding: 14px 16px; height: 52px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-weight: 600; color: #1e293b; background: #f8fafc; outline: none; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-family: inherit; cursor: pointer;" min="${minDateStr}" value="${minDateStr}" onfocus="this.style.borderColor='#6366f1'; this.style.boxShadow='0 0 0 4px rgba(99, 102, 241, 0.15)'; this.style.background='#fff'" onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'; this.style.background='#f8fafc'" />
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Confirm Move Out",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        popup: 'modern-swal-popup',
        title: 'modern-swal-title',
        confirmButton: 'modern-swal-confirm-btn',
        cancelButton: 'modern-swal-cancel-btn',
        actions: 'modern-swal-actions'
      },
      preConfirm: () => {
        const date = document.getElementById("moveOutDate").value;
        if (!date || date < minDateStr) {
          Swal.showValidationMessage("Please select a date at least 30 days from today.");
          return false;
        }
        return date;
      }
    });

    if (!isConfirmed || !targetDate) return;

    try {
      const residentId = pg.residentId || pg.id;
      await api.put(`/residents/${residentId}/give-notice?targetDate=${targetDate}`);
      toast.success("Notice served successfully.");
      fetchMyPgs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to serve notice.");
    }
  };

  const getUiStatus = (status) =>
    ({
      RESERVED: "PENDING",
      PENDING_TENANT_DETAILS: "PENDING",
      PENDING_OWNER_VERIFICATION: "PENDING",
      ACTIVE: "ACTIVE",
      EXITED: "INACTIVE",
      CANCELLED: "CANCELLED",
    })[status] || status;

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-IN") : "-";
  const getStayType = (pg) =>
    pg.stayType === "DAILY_BASIC" ? "Daily Basic" : "Monthly Basic";
  const getPrimaryAmount = (pg) =>
    pg.stayType === "DAILY_BASIC"
      ? `₹${pg.dailyRent || 0}/day`
      : `₹${pg.monthlyRent || 0}`;
  const getSecondaryAmount = (pg) =>
    pg.stayType === "DAILY_BASIC"
      ? `${pg.numberOfDays || 0} day(s)`
      : `₹${pg.deposit || 0}`;

  const getPaymentStatus = (pg) => {
    if (pg.status === "CANCELLED" || pg.status === "EXITED") return "N/A";
    if (pg.reservationAmount && pg.reservationAmount > 0) return "COMPLETE";
    return "PENDING";
  };

  const filteredData = useMemo(
    () =>
      myPgs.filter(
        (pg) =>
          pg.pgName?.toLowerCase().includes(search.toLowerCase()) &&
          getUiStatus(pg.status) === activeTab,
      ),
    [myPgs, search, activeTab],
  );

  // Raw backend status: RESERVED / ACTIVE / EXITED / CANCELLED
  const ReservationStatusBadge = ({ status }) => {
    const cls = {
      RESERVED:  "res-badge res-badge--reserved",
      ACTIVE:    "res-badge res-badge--active",
      EXITED:    "res-badge res-badge--exited",
      CANCELLED: "res-badge res-badge--cancelled",
    };
    return (
      <span className={cls[status] ?? "res-badge"}>{status || "—"}</span>
    );
  };

  const PaymentStatusBadge = ({ pg }) => {
    const ps = getPaymentStatus(pg);
    const cls = {
      "COMPLETE": "pay-badge pay-badge--today",
      "PENDING":  "pay-badge pay-badge--pending",
      "N/A":      "pay-badge pay-badge--na",
    };
    return <span className={cls[ps] ?? "pay-badge"}>{ps}</span>;
  };

  const OwnerInfoBtn = ({ pg }) => {
    const residentId = pg.residentId || pg.id;
    const popoverRef = useRef(null);
    const isOpen = openMsgPopover === residentId;

    const msgs = ownerMessages.filter(
      (c) => c.pgId === pg.pgId || c.pgName === pg.pgName
    );

    const getSystemMessage = () => {
      switch (pg.status) {
        case "RESERVED":
        case "PENDING":
          return {
            id: 'sys-msg-1',
            subject: "Reservation Under Review",
            ownerResponse: "I am still reviewing your reservation and I will let you know soon.",
            category: "System Update",
            updatedAt: pg.createdAt || new Date().toISOString()
          };
        case "PENDING_TENANT_DETAILS":
        case "PENDING_OWNER_VERIFICATION":
        case "ACCEPTED":
          return {
            id: 'sys-msg-2',
            subject: "Reservation Accepted",
            ownerResponse: "I accepted your reservation for the bed. Please complete onboarding.",
            category: "System Update",
            updatedAt: pg.updatedAt || new Date().toISOString()
          };
        case "ACTIVE":
          return {
            id: 'sys-msg-3',
            subject: "Welcome to the PG",
            ownerResponse: "I hope you enjoy the stay!",
            category: "System Update",
            updatedAt: pg.updatedAt || new Date().toISOString()
          };
        default:
          return null;
      }
    };

    const sysMsg = getSystemMessage();
    const displayMsgs = sysMsg ? [sysMsg, ...msgs] : msgs;

    useEffect(() => {
      if (!isOpen) return;
      const handle = (e) => {
        if (popoverRef.current && !popoverRef.current.contains(e.target)) {
          setOpenMsgPopover(null);
        }
      };
      document.addEventListener("mousedown", handle);
      return () => document.removeEventListener("mousedown", handle);
    }, [isOpen]);

    return (
      <div className="info-wrapper">
        <button
          className="info-btn"
          onClick={() => setOpenMsgPopover(isOpen ? null : residentId)}
          title="Messages from Owner"
        >
          i
        </button>

        {isOpen && createPortal(
          <div className="info-modal-overlay" onClick={() => setOpenMsgPopover(null)}>
            <div className="info-modal-content" onClick={e => e.stopPropagation()}>
              <div className="info-popover-header">
                <span className="info-popover-title">Messages from Owner</span>
                <button className="info-popover-close" onClick={() => setOpenMsgPopover(null)}>✕</button>
              </div>
              <div className="info-popover-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {displayMsgs.length === 0 ? (
                  <p className="info-empty" style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', margin: '20px 0' }}>No messages from the owner yet.</p>
                ) : (
                  displayMsgs.map((c) => (
                    <div key={c.id} className="info-msg-item">
                      <div className="info-msg-subject">{c.subject || "Message"}</div>
                      <div className="info-msg-text">{c.ownerResponse}</div>
                      <div className="info-msg-meta">
                        <span className="info-msg-category">{c.category}</span>
                        <span className="info-msg-date">
                          {c.updatedAt
                            ? new Date(c.updatedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  };

  const CancelButton = ({ pg }) => {
    const residentId = pg.residentId || pg.id;
    const isCancelling = cancelling === residentId;
    return (
      <button
        className="cancel-booking-btn"
        onClick={() => handleCancelBooking(pg)}
        disabled={isCancelling}
      >
        {isCancelling ? <span className="cancel-btn-spinner" /> : <>Cancel</>}
      </button>
    );
  };

  const DownloadInvoiceButton = ({ pg }) => {
    const residentId = pg.residentId || pg.id;
    const isDownloading = downloadingInvoice === residentId;
    const handleDownload = () => {
      setDownloadingInvoice(residentId);
      try {
        generateBookingInvoice(pg);
      } catch (err) {
        toast.error("Could not generate invoice.");
      } finally {
        setTimeout(() => setDownloadingInvoice(null), 800);
      }
    };
    return (
      <button
        className="invoice-download-btn"
        onClick={handleDownload}
        disabled={isDownloading}
        title="Download Invoice"
      >
        {isDownloading ? (
          <span className="cancel-btn-spinner invoice-spinner" />
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Invoice
          </>
        )}
      </button>
    );
  };

  const TabButtons = () =>
    STATUS_TABS.map((s) => (
      <button
        key={s}
        className={`status-btn ${activeTab === s ? "active" : ""}`}
        onClick={() => setActiveTab(s)}
      >
        {s}
      </button>
    ));

  const EmptyState = () => (
    <div className="empty-box">
      <div className="empty-box-icon">🏠</div>
      <div className="empty-box-text">
        No {activeTab.toLowerCase()} bookings
      </div>
    </div>
  );

  const OnboardingButton = ({ pg }) => {
    return (
      <button
        className="action-btn"
        style={{ backgroundColor: "#10b981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
        onClick={() => window.location.reload()}
      >
        Complete Details
      </button>
    );
  };

  const MoveOutButton = ({ pg }) => {
    if (pg.status !== "ACTIVE") return null;
    if (pg.noticeServed) {
      return (
        <button className="move-out-btn notice-served-btn" disabled style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, cursor: 'not-allowed' }} title={`Expected Checkout: ${formatDate(pg.expectedCheckoutDate)}`}>
          ⚠️ Notice Served
        </button>
      );
    }
    return (
      <button
        className="move-out-btn"
        style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
        onClick={() => handleGiveNotice(pg)}
      >
        Move Out
      </button>
    );
  };



  const DesktopTable = () => {
    const showCancelCol = activeTab === "PENDING";
    return (
      <div className="table-wrapper">
        <table className="booking-table">
          <thead>
            <tr>
              <th>PG & Room</th>
              <th>Stay Type</th>
              <th>Check-in</th>
              <th>Checkout</th>
              <th>Charge</th>
              <th>Extra</th>
              <th>Reservation Status</th>
              <th>Payment Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((pg) => (
              <Fragment key={pg.residentId || pg.id}>
                <tr>
                  <td>
                    <div style={{ fontWeight: 700, color: '#1e1b4b', marginBottom: '4px' }}>{pg.pgName}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, lineHeight: 1.4 }}>
                      <div>Room: {pg.roomNumber}</div>
                      <div>Bed: {pg.bedNumber}</div>
                    </div>
                  </td>
                  <td>{getStayType(pg)}</td>
                  <td>{formatDate(pg.checkinDate)}</td>
                  <td>{formatDate(pg.expectedCheckoutDate)}</td>
                  <td>{getPrimaryAmount(pg)}</td>
                  <td>{getSecondaryAmount(pg)}</td>
                  <td>
                    <div className="res-status-cell">
                      <ReservationStatusBadge status={pg.status} />
                      <OwnerInfoBtn pg={pg} />
                    </div>
                  </td>
                  <td>
                    <PaymentStatusBadge pg={pg} />
                  </td>
                  <td>
                    <div className="action-cell">
                      {pg.status === "PENDING_TENANT_DETAILS" && <OnboardingButton pg={pg} />}
                      {pg.status === "PENDING_OWNER_VERIFICATION" && <span className="text-muted small">Verifying...</span>}
                      <DownloadInvoiceButton pg={pg} />
                      {showCancelCol && <CancelButton pg={pg} />}
                      <MoveOutButton pg={pg} />
                    </div>
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const BookingCard = ({ pg }) => (
    <div className="booking-card">
      <div className="booking-card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px', flex: 1 }}>
          <span className="booking-card-name" style={{ flex: 'none', whiteSpace: 'normal', wordBreak: 'break-word' }}>{pg.pgName}</span>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3 }}>
            <div>Room: {pg.roomNumber}</div>
            <div>Bed: {pg.bedNumber}</div>
          </div>
        </div>
        <div className="res-status-cell">
          <ReservationStatusBadge status={pg.status} />
          <OwnerInfoBtn pg={pg} />
        </div>
      </div>
      <div className="booking-card-body">
        <div className="booking-card-row">
          <span className="bcard-label">Stay Type</span>
          <span className="bcard-val">{getStayType(pg)}</span>
        </div>
        <div className="booking-card-row">
          <span className="bcard-label">Charge</span>
          <span className="bcard-val bcard-val--money">{getPrimaryAmount(pg)}</span>
        </div>
        <div className="booking-card-row">
          <span className="bcard-label">Extra</span>
          <span className="bcard-val bcard-val--money">{getSecondaryAmount(pg)}</span>
        </div>
        <div className="booking-card-row">
          <span className="bcard-label">Check-in</span>
          <span className="bcard-val">{formatDate(pg.checkinDate)}</span>
        </div>
        <div className="booking-card-row">
          <span className="bcard-label">Checkout</span>
          <span className="bcard-val">{formatDate(pg.expectedCheckoutDate)}</span>
        </div>
        <div className="booking-card-row">
          <span className="bcard-label">Payment</span>
          <span className="bcard-val">
            <PaymentStatusBadge pg={pg} />
          </span>
        </div>
        
        {pg.status === "PENDING_TENANT_DETAILS" && (
          <div className="booking-card-row" style={{ marginTop: "10px", justifyContent: "center" }}>
            <OnboardingButton pg={pg} />
          </div>
        )}
        {pg.status === "PENDING_OWNER_VERIFICATION" && (
          <div className="booking-card-row" style={{ marginTop: "10px", justifyContent: "center" }}>
            <span className="text-muted small">Verifying...</span>
          </div>
        )}

        {activeTab === "PENDING" && (
          <div className="booking-card-row booking-card-cancel-row">
            <DownloadInvoiceButton pg={pg} />
            <CancelButton pg={pg} />
          </div>
        )}
        {activeTab !== "PENDING" && (
          <div className="booking-card-row booking-card-cancel-row">
            <DownloadInvoiceButton pg={pg} />
            <MoveOutButton pg={pg} />
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading)
      return <div className="table-loader">Loading your bookings...</div>;
    if (filteredData.length === 0) return <EmptyState />;
    return (
      <>
        <div className="desktop-view">
          <DesktopTable />
        </div>
        <div className="mobile-view booking-cards">
          {filteredData.map((pg) => (
            <BookingCard key={pg.residentId || pg.id} pg={pg} />
          ))}
        </div>
      </>
    );
  };

  return (
<UserLayout hideWelcome>
      <main className="my-pg-history">
          <div className="history-hero">
          <h2 className="page-title">My PG Booking History</h2>
          {/* Desktop: filter + tabs in one row */}
          <div className="filter-tabs-row">
            <div className="filter-bar">
              <input
                placeholder="Search PG..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="desktop-view">
              <div className="status-tabs">
                <TabButtons />
              </div>
            </div>
          </div>
          {/* Mobile: search bar alone, tabs in own scroll strip below */}
          <div className="mobile-view mobile-tabs-strip">
            <div className="status-tabs-scroll-wrap">
              <div className="status-tabs">
                <TabButtons />
              </div>
            </div>
          </div>
        </div>
        {renderContent()}
      </main>
     </UserLayout>
  );
};

export default MyPg;