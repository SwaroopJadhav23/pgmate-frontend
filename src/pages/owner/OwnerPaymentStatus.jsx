import { useContext, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import { AuthContext } from "../../context/AuthContext";

const OwnerPaymentStatus = () => {
  const { refreshSubscriptionStatus } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const merchantOrderId = searchParams.get("merchantOrderId");
  const paymentToken = searchParams.get("paymentToken");
  const [status, setStatus] = useState("LOADING");
  const [message, setMessage] = useState("Checking payment status...");
  const [details, setDetails] = useState(null);
  const pollRef = useRef(null);
  const authToken = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const canUseOwnerEndpoint = Boolean(authToken) && role === "OWNER";

  useEffect(() => {
    const clearPoll = () => {
      if (pollRef.current) {
        clearTimeout(pollRef.current);
        pollRef.current = null;
      }
    };

    const loadStatus = async () => {
      if (!merchantOrderId) {
        setStatus("ERROR");
        setMessage("Payment order id is missing from the redirect URL.");
        return;
      }

      if (!canUseOwnerEndpoint && !paymentToken) {
        setStatus("ERROR");
        setMessage("Payment redirect token is missing. Please retry the payment flow once.");
        return;
      }

      try {
        const endpoint = canUseOwnerEndpoint
          ? "/owner/subscription/payment-status"
          : "/public/subscription/payment-status";

        const res = await api.get(endpoint, {
          params: canUseOwnerEndpoint
            ? { merchantOrderId }
            : { merchantOrderId, paymentToken },
        });

        const data = res.data || {};
        const nextStatus = data.status || "ERROR";
        setDetails(data);
        setStatus(nextStatus);
        setMessage(data.message || "Payment status updated.");

        // ✅ Instant unlock: as soon as gateway confirms COMPLETED, re-pull
        // subscription status so `subscriptionExpired` flips false right
        // here — owner gets all pages back immediately, no logout/login.
        if (nextStatus === "COMPLETED" && canUseOwnerEndpoint) {
          refreshSubscriptionStatus();
        }

        if (nextStatus === "PENDING" || nextStatus === "REDIRECT_REQUIRED") {
          clearPoll();
          pollRef.current = setTimeout(loadStatus, 4000);
        }
      } catch (err) {
        setStatus("ERROR");
        setMessage(err.response?.data?.message || "Could not verify payment status.");
      }
    };

    loadStatus();
    return clearPoll;
  }, [canUseOwnerEndpoint, merchantOrderId, paymentToken, refreshSubscriptionStatus]);

  const title =
    status === "COMPLETED"
      ? "Payment Successful"
      : status === "FAILED" || status === "EXPIRED"
        ? "Payment Not Completed"
        : status === "PENDING" || status === "REDIRECT_REQUIRED"
          ? "Payment In Progress"
          : "Payment Status";

  const content = (
    <div className="card p-4" style={{ maxWidth: "760px", margin: "0 auto" }}>
      <h3 className="mb-2">{title}</h3>
      <p className="text-muted mb-4">{message}</p>

      <div className="mb-3">
        <div><strong>Order ID:</strong> {merchantOrderId || "N/A"}</div>
        <div><strong>Gateway State:</strong> {details?.gatewayState || "-"}</div>
        <div><strong>Plan:</strong> {details?.planType || "-"}</div>
        <div><strong>Amount:</strong> Rs {details?.amountPaid ?? 0}</div>
        <div><strong>Expiry:</strong> {details?.expiryDate || "-"}</div>
      </div>

      {!canUseOwnerEndpoint && (
        <p className="text-muted small mb-3">
          This payment was verified through the secure PhonePe redirect link. You can log in again anytime to
          view the updated subscription in your owner dashboard.
        </p>
      )}

      <div className="d-flex gap-2 flex-wrap">
        <Link to="/owner/pricing" className="btn btn-primary">
          Back to Plans
        </Link>
        <Link to="/owner/dashboard" className="btn btn-outline-secondary">
          Go to Dashboard
        </Link>
        <Link to="/owner/purchase-history" className="btn btn-outline-secondary">
          View Billing History
        </Link>
        {!canUseOwnerEndpoint && (
          <Link to="/login" className="btn btn-outline-secondary">
            Login
          </Link>
        )}
      </div>
    </div>
  );

  if (!canUseOwnerEndpoint) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 16px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="mb-3">
            <h2 style={{ marginBottom: "8px" }}>Subscription Payment</h2>
            <p className="text-muted mb-0">PhonePe payment status</p>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Subscription Payment"
      subtitle="PhonePe payment status"
    >
      {content}
    </DashboardLayout>
  );
};

export default OwnerPaymentStatus;