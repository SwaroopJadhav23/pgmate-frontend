import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";

const OwnerFeatureUnlockPaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const merchantOrderId = searchParams.get("merchantOrderId");
  const paymentToken = searchParams.get("paymentToken");
  const requestedFeature = searchParams.get("feature");
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
          ? "/owner/unlock/payment-status"
          : "/public/unlock/payment-status";

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
  }, [canUseOwnerEndpoint, merchantOrderId, paymentToken]);

  const feature = details?.feature || requestedFeature || "FEATURE";
  const featureLabel = feature === "OFFERS" ? "Offers" : "Verification";
  const featurePath = feature === "OFFERS" ? "/owner/offers" : "/owner/verification";

  const title =
    status === "COMPLETED"
      ? `${featureLabel} Unlocked`
      : status === "FAILED" || status === "EXPIRED"
        ? `${featureLabel} Payment Not Completed`
        : status === "PENDING" || status === "REDIRECT_REQUIRED"
          ? `${featureLabel} Payment In Progress`
          : `${featureLabel} Payment Status`;

  const content = (
    <div className="card p-4" style={{ maxWidth: "760px", margin: "0 auto" }}>
      <h3 className="mb-2">{title}</h3>
      <p className="text-muted mb-4">{message}</p>

      <div className="mb-3">
        <div><strong>Order ID:</strong> {merchantOrderId || "N/A"}</div>
        <div><strong>Gateway State:</strong> {details?.gatewayState || "-"}</div>
        <div><strong>Feature:</strong> {featureLabel}</div>
        <div><strong>Amount:</strong> Rs {details?.amountPaid ?? 0}</div>
        <div><strong>Unlocked:</strong> {details?.featureUnlocked ? "Yes" : "No"}</div>
      </div>

      {!canUseOwnerEndpoint && (
        <p className="text-muted small mb-3">
          This payment was verified through the secure PhonePe redirect link. You can log in again anytime to
          access the unlocked feature in your owner dashboard.
        </p>
      )}

      <div className="d-flex gap-2 flex-wrap">
        <Link to={featurePath} className="btn btn-primary">
          Go to {featureLabel}
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
            <h2 style={{ marginBottom: "8px" }}>{featureLabel} Payment</h2>
            <p className="text-muted mb-0">PhonePe payment status</p>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title={`${featureLabel} Payment`}
      subtitle="PhonePe payment status"
    >
      {content}
    </DashboardLayout>
  );
};

export default OwnerFeatureUnlockPaymentStatus;
