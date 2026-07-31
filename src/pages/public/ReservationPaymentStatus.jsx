import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2, XCircle, Clock3, AlertTriangle,
  Hash, IndianRupee, Home, CalendarDays, CreditCard,
  RefreshCw, Headset, ClipboardList, ShieldCheck,
} from "lucide-react";
import api from "../../api/axios";
import "./ReservationPaymentStatus.css";

const STATUS_META = {
  COMPLETED: {
    icon: CheckCircle2,
    tone: "success",
    heading: "Reservation Confirmed",
    lead: "Your payment went through.",
    sub: "Your reservation has been created successfully.",
  },
  FAILED: {
    icon: XCircle,
    tone: "danger",
    heading: "Reservation Not Completed",
    lead: "Your payment could not be completed.",
    sub: "No amount has been deducted from your account.",
  },
  EXPIRED: {
    icon: XCircle,
    tone: "danger",
    heading: "Reservation Not Completed",
    lead: "Your payment session expired.",
    sub: "No amount has been deducted from your account.",
  },
  PENDING: {
    icon: Clock3,
    tone: "pending",
    heading: "Reservation Payment In Progress",
    lead: "We're confirming your payment.",
    sub: "This usually takes a few seconds — hang tight.",
  },
  REDIRECT_REQUIRED: {
    icon: Clock3,
    tone: "pending",
    heading: "Reservation Payment In Progress",
    lead: "We're confirming your payment.",
    sub: "This usually takes a few seconds — hang tight.",
  },
  ERROR: {
    icon: AlertTriangle,
    tone: "danger",
    heading: "Reservation Status",
    lead: "We couldn't verify this reservation.",
    sub: "The link may be incomplete or expired.",
  },
  LOADING: {
    icon: Clock3,
    tone: "pending",
    heading: "Checking Reservation Status",
    lead: "Please wait a moment.",
    sub: "We're checking with the payment gateway.",
  },
};

const WHAT_HAPPENED = {
  success: [
    { icon: CheckCircle2, text: "Your payment was completed." },
    { icon: ClipboardList, text: "Your reservation has been created." },
    { icon: ShieldCheck, text: "You'll receive a confirmation shortly." },
  ],
  danger: [
    { icon: CreditCard, text: "Your payment was not completed." },
    { icon: CalendarDays, text: "Your reservation has NOT been created." },
    { icon: ShieldCheck, text: "You can retry the payment safely anytime." },
  ],
  pending: [
    { icon: CreditCard, text: "Your payment is being verified." },
    { icon: CalendarDays, text: "Your reservation is not yet confirmed." },
    { icon: ShieldCheck, text: "This page will update automatically." },
  ],
};

const ReservationPaymentStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const merchantOrderId = searchParams.get("merchantOrderId");
  const paymentToken = searchParams.get("paymentToken");
  const [status, setStatus] = useState("LOADING");
  const [message, setMessage] = useState("Checking reservation status...");
  const [details, setDetails] = useState(null);
  const pollRef = useRef(null);
  const authToken = localStorage.getItem("token");

  useEffect(() => {
    const clearPoll = () => {
      if (pollRef.current) {
        clearTimeout(pollRef.current);
        pollRef.current = null;
      }
    };

    const loadStatus = async () => {
      if (!merchantOrderId || !paymentToken) {
        setStatus("ERROR");
        setMessage("The reservation redirect link is incomplete. Please retry the reservation flow.");
        return;
      }

      try {
        const res = await api.get("/public/reservation/payment-status", {
          params: { merchantOrderId, paymentToken },
        });

        const data = res.data || {};
        const nextStatus = data.status || "ERROR";
        setDetails(data);
        setStatus(nextStatus);
        setMessage(data.message || "Reservation payment status updated.");

        if (nextStatus === "COMPLETED" && data.reservationCreated) {
          if (authToken) {
            navigate("/my-pg?tab=PENDING", { replace: true });
            return;
          }
        }

        if (nextStatus === "PENDING" || nextStatus === "REDIRECT_REQUIRED") {
          clearPoll();
          pollRef.current = setTimeout(loadStatus, 4000);
        }
      } catch (err) {
        setStatus("ERROR");
        setMessage(err.response?.data?.message || "Could not verify reservation status.");
      }
    };

    loadStatus();
    return clearPoll;
  }, [authToken, merchantOrderId, navigate, paymentToken]);

  const meta = STATUS_META[status] || STATUS_META.ERROR;
  const StatusIcon = meta.icon;
  const explainer = WHAT_HAPPENED[meta.tone] || WHAT_HAPPENED.danger;
  const canRetry = meta.tone === "danger";

  const formattedCheckin = (() => {
    if (!details?.checkinDate) return "-";
    const d = new Date(details.checkinDate);
    if (isNaN(d.getTime())) return details.checkinDate;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  })();

  const detailCards = [
    { icon: Hash, label: "Order ID", value: merchantOrderId || "N/A", copyable: true },
    { icon: IndianRupee, label: "Reservation Amount", value: `\u20B9${details?.reservationAmount ?? 0}` },
    { icon: Home, label: "Stay Type", value: details?.stayType ? details.stayType.replace("_", " ") : "-" },
    { icon: CalendarDays, label: "Check-in Date", value: formattedCheckin },
    { icon: CreditCard, label: "Payment Gateway", value: details?.gateway || "PhonePe" },
    {
      icon: AlertTriangle,
      label: "Payment Status",
      value: details?.gatewayState || status,
      pill: true,
      tone: meta.tone,
    },
  ];

  return (
    <div className="rps-page">
      <header className="rps-header">
        <div className="rps-logo">PGMate</div>
        <div className="rps-help">
          <Headset size={18} />
          <div>
            <span className="rps-help-label">Need Help?</span>
            <a href="mailto:support@pgmate.in">support@pgmate.in</a>
            <a href="tel:+919637605805">+91 96376 05805</a>
          </div>
        </div>
      </header>

      <main className="rps-main">
        <section className={`rps-hero rps-hero--${meta.tone}`}>
          <div className="rps-hero-icon-wrap">
            <StatusIcon size={44} strokeWidth={2} />
          </div>
          <div className="rps-hero-copy">
            <h1>{meta.heading}</h1>
            <p className="rps-hero-lead">{message || meta.lead}</p>
            <p className="rps-hero-sub">{meta.sub}</p>
          </div>
        </section>

        <section className="rps-details">
          <h2 className="rps-section-title">
            <ClipboardList size={16} /> Reservation Details
          </h2>
          <div className="rps-details-grid">
            {detailCards.map((c) => (
              <div className="rps-detail-card" key={c.label}>
                <div className={`rps-detail-icon rps-detail-icon--${c.tone || "default"}`}>
                  <c.icon size={16} strokeWidth={2.25} />
                </div>
                <div>
                  <p className="rps-detail-label">{c.label}</p>
                  {c.pill ? (
                    <span className={`rps-status-pill rps-status-pill--${c.tone}`}>{c.value}</span>
                  ) : (
                    <p className="rps-detail-value">{c.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rps-explainer">
          <h2 className="rps-section-title rps-section-title--center">What happened?</h2>
          <div className="rps-explainer-grid">
            {explainer.map((e) => (
              <div className="rps-explainer-item" key={e.text}>
                <e.icon size={26} strokeWidth={1.75} />
                <p>{e.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rps-actions">
          <h2 className="rps-section-title rps-section-title--center">What would you like to do next?</h2>
          <div className="rps-actions-row">
            {canRetry && (
              <button className="rps-btn rps-btn--primary" onClick={() => navigate(-1)}>
                <RefreshCw size={16} /> Retry Payment
              </button>
            )}
            <Link to="/" className="rps-btn rps-btn--outline">
              <Home size={16} /> Back to Home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ReservationPaymentStatus;