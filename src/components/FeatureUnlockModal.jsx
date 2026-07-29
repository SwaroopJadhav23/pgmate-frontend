import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./FeatureUnlockModal.css";

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
};
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};
  const FeatureUnlockModal = ({ feature, planType, show, onClose, onSuccess, planStartDate, planExpiryDate }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(1000);
  
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [show]);

  useEffect(() => {
    if (!show || planType !== "BASIC" || !feature) return;

    api
      .get("/owner/unlock/amount", { params: { feature } })
      .then((res) => setAmount(Number(res.data || 1000)))
      .catch(() => setAmount(1000));
  }, [show, planType, feature]);

  if (!show) return null;

  const unlockFeature = async () => {
    const payableText = `Rs ${formatAmount(amount)}`;
    const confirm = await Swal.fire({
      title: "Confirm Payment",
      text: `Do you want to pay ${payableText} to unlock ${feature}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Continue to PhonePe",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280"
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const response = await api.post("/owner/unlock/checkout", null, {
        params: { feature }
      });

      const data = response.data || {};

      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }

      if (data.status === "COMPLETED") {
        await Swal.fire({
          icon: "success",
          title: "Already Unlocked",
          text: `${feature} feature is already unlocked for your account.`,
          confirmButtonColor: "#22c55e"
        });
        onSuccess?.();
        onClose?.();
        return;
      }

      throw new Error(data.message || "PhonePe checkout URL was not returned.");
    } catch (err) {
      Swal.fire(
        "Payment Failed",
        err.response?.data?.message || err.message || "Something went wrong",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const payableText = `Rs ${formatAmount(amount)}`;

  return (
    <div className="payment-confirm-overlay">
      <div className="payment-confirm-box">
        <h4>Unlock {feature}</h4>

<div className="modal-plan-tag">
  {feature} Feature
</div>

{(planStartDate || planExpiryDate) && (
  <div className="plan-date-banner">
    <div className="plan-date-row">
      <span className="plan-date-item">
        <span className="plan-date-label">📅 Plan Started</span>
        <span className="plan-date-value">{formatDate(planStartDate)}</span>
      </span>
      <div className="plan-date-divider" />
      <span className="plan-date-item">
        <span className="plan-date-label">⏳ Plan Expires</span>
        <span className="plan-date-value">{formatDate(planExpiryDate)}</span>
      </span>
    </div>
    <p className="plan-expiry-note">
      ⚠️ Unlocking this feature does <strong>not</strong> extend your plan.
      Access will expire on <strong>{formatDate(planExpiryDate)}</strong> along with your current plan.
    </p>
  </div>
)}

        {planType === "FREE" && (
          <>
            <h5 className="mt-3">Upgrade Required</h5>

            <p className="text-muted">
              This feature is not available in the FREE plan.
              Please upgrade your plan to access this feature.
            </p>

            <div className="confirm-actions">
              <button
                className="btn btn-success"
                onClick={() => navigate("/owner/pricing")}
              >
                Upgrade Plan
              </button>

              <button
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {planType === "BASIC" && (
          <>
            {feature === "VERIFICATION" && (
              <>
                <h5 className="mt-3">Verification Feature Locked</h5>

                <p className="text-muted">
                  Verification is not included in the BASIC subscription.
                  Please choose one of the options below.
                </p>

                <div className="upgrade-mode-cards">
                  <div className="upgrade-mode-card selected">
                    <p className="upgrade-mode-title">
                      Unlock Verification
                    </p>

                    <p className="upgrade-mode-desc">
                      Pay a one-time fee to enable the Verification feature
                      for your PG listings.
                    </p>

                    <p className="upgrade-mode-price">
                      You pay: {payableText}
                    </p>

                    <button
                      className="unlock-pay-btn"
                      onClick={unlockFeature}
                      disabled={loading}
                    >
                      {loading ? "Redirecting..." : `Pay ${payableText}`}
                    </button>
                  </div>

                  <div className="upgrade-mode-card">
                    <p className="upgrade-mode-title">
                      Upgrade Subscription
                    </p>

                    <p className="upgrade-mode-desc">
                      Upgrade your subscription to unlock verification and
                      other premium features included in higher plans.
                    </p>

                    <button
                      className="unlock-upgrade-btn"
                      onClick={() => navigate("/owner/pricing")}
                    >
                      Upgrade Plan
                    </button>
                  </div>
                </div>

                <div className="confirm-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {feature === "OFFERS" && (
              <>
                <h5 className="mt-3">Offers Feature Locked</h5>

                <p className="text-muted">
                  This feature is not included in the BASIC subscription.
                  Please choose one of the options below.
                </p>

                <div className="upgrade-mode-cards">
                  <div className="upgrade-mode-card selected">
                    <p className="upgrade-mode-title">
                      Unlock with One-Time Payment
                    </p>

                    <p className="upgrade-mode-desc">
                      Pay once to unlock the Offers feature for your account.
                    </p>

                    <p className="upgrade-mode-price">
                      You pay: {payableText}
                    </p>

                    <button
                      className="unlock-pay-btn"
                      onClick={unlockFeature}
                      disabled={loading}
                    >
                      {loading ? "Redirecting..." : `Pay ${payableText}`}
                    </button>
                  </div>

                  <div className="upgrade-mode-card">
                    <p className="upgrade-mode-title">
                      Upgrade Subscription
                    </p>

                    <p className="upgrade-mode-desc">
                      Upgrade your plan to access Offers and many other
                      premium features included in higher plans.
                    </p>

                    <button
                      className="unlock-upgrade-btn"
                      onClick={() => navigate("/owner/pricing")}
                    >
                      Upgrade Plan
                    </button>
                  </div>
                </div>

                <div className="confirm-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeatureUnlockModal;
