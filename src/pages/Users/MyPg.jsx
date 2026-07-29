import { useEffect, useState, useMemo, useRef } from "react";
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
      .then((res) => setMyPgs(res.data || []))
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

  const getUiStatus = (status) =>
    ({
      RESERVED: "PENDING",
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
      <div className="info-wrapper" ref={popoverRef}>
        <button
          className="info-btn"
          onClick={() => setOpenMsgPopover(isOpen ? null : residentId)}
          title="Messages from Owner"
        >
          i
        </button>

        {isOpen && (
          <div className="info-popover">
            <div className="info-popover-arrow" />
            <div className="info-popover-header">
              <span className="info-popover-title">Messages from Owner</span>
              <button className="info-popover-close" onClick={() => setOpenMsgPopover(null)}>✕</button>
            </div>
            <div className="info-popover-body">
              {msgs.length === 0 ? (
                <p className="info-empty">Owner will check in</p>
              ) : (
                msgs.map((c) => (
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

  const DesktopTable = () => {
    const showCancelCol = activeTab === "PENDING";
    return (
      <div className="table-wrapper">
        <table className="booking-table">
          <thead>
            <tr>
              <th>PG</th>
              <th>Room / Bed</th>
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
              <tr key={pg.residentId || pg.id}>
                <td>{pg.pgName}</td>
                <td>Room {pg.roomNumber} — Bed {pg.bedNumber}</td>
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
                    <DownloadInvoiceButton pg={pg} />
                    {showCancelCol && <CancelButton pg={pg} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const BookingCard = ({ pg }) => (
    <div className="booking-card">
      <div className="booking-card-header">
        <span className="booking-card-name">{pg.pgName}</span>
        <div className="res-status-cell">
          <ReservationStatusBadge status={pg.status} />
          <OwnerInfoBtn pg={pg} />
        </div>
      </div>
      <div className="booking-card-body">
        <div className="booking-card-row">
          <span className="bcard-label">Room / Bed</span>
          <span className="bcard-val">Room {pg.roomNumber} — Bed {pg.bedNumber}</span>
        </div>
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
        {activeTab === "PENDING" && (
          <div className="booking-card-row booking-card-cancel-row">
            <DownloadInvoiceButton pg={pg} />
            <CancelButton pg={pg} />
          </div>
        )}
        {activeTab !== "PENDING" && (
          <div className="booking-card-row booking-card-cancel-row">
            <DownloadInvoiceButton pg={pg} />
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
            <div className="mobile-view status-tabs-scroll-wrap">
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