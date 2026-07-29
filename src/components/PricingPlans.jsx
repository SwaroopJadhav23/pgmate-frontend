import {useNavigate} from "react-router-dom";
import api from "../api/axios";
import "./PricingPlans.css";
import {useEffect, useMemo, useState} from "react";
import {
  Headphones,
  Users,
  User,
  PhoneCall,
  ShieldCheck,
  Cloud,
  Lock,
  CheckCircle2,
  Briefcase,
  Infinity as InfinityIcon,
  Building,
  Gift,
  Check,
  Crown,
  MessageCircle,
  Phone,
} from "lucide-react";

const PLAN_ORDER = ["FREE", "BASIC", "PRO", "PREMIUM"];

const PricingPlans = () => {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [upgradeMode, setUpgradeMode] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [showOwnerPop, setShowOwnerPop] = useState(false);
  const [showDowngradePop, setShowDowngradePop] = useState(false);

  const [freeTrialUsed, setFreeTrialUsed] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [previousPlan, setPreviousPlan] = useState(null);
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isLoggedIn = !!token;
  const isOwner = role === "OWNER";

  const [showContactChoice, setShowContactChoice] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/public/plans")
      .then((res) => setPlans(res.data || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    api
      .get("/owner/subscription/summary")
      .then((res) => {
        const data = res.data;
        if (data.expired || !data.active) {
          setCurrentPlan(null);
          setIsExpired(true);
        } else {
          setCurrentPlan(data.planType || "FREE");
          setIsExpired(false);
        }
        setFreeTrialUsed(data.freeTrialUsed || false);
        setPreviousPlan(data.previousPlanType || null);
      })
      .catch(() => {
        setCurrentPlan(null);
      });
  }, [isOwner]);

  useEffect(() => {
    if (!isOwner) return;
    api
      .get("/api/wallet/me", { silent: true })
      .then((res) => setWalletBalance(res.data?.points || 0))
      .catch(() => setWalletBalance(0));
  }, [isOwner]);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.displayOrder - b.displayOrder),
    [plans],
  );

  const rank = (p) => PLAN_ORDER.indexOf(p);
  const isUpgrade = (t) => currentPlan && rank(t) > rank(currentPlan);
  const isDowngrade = (t) => currentPlan && rank(t) < rank(currentPlan);
  const isRenewal = (t) => t === currentPlan;

  const fetchPreview = async (planType, mode, points) => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await api.post("/owner/subscription/preview", null, {
        params: {
          plan: planType,
          upgradeMode: mode || undefined,
          redeemPoints: points || 0,
        },
      });
      setPreview(res.data);
    } catch (err) {
      setPreviewError(
        err.response?.data?.message || "Could not load pricing preview.",
      );
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const buyPlan = async (planType) => {
    if (!isLoggedIn) {
      setShowOwnerPop("login");
      return;
    }
    if (!isOwner) {
      setShowOwnerPop("owner");
      return;
    }
    if (isDowngrade(planType)) {
      setShowDowngradePop(true);
      return;
    }

    try {
      await api.post("/owner/subscription/initiate", null, {
        params: {plan: planType},
      });
    } catch (err) {
      alert(
        err.response?.data?.message || "Could not initiate. Please try again.",
      );
      return;
    }

    setSelectedPlan(planType);
    setRedeemPoints(0);

    // ✅ If subscription expired — always use HARD_RESET for any paid plan
    const defaultMode = isExpired
      ? "HARD_RESET"
      : isUpgrade(planType) && currentPlan !== "FREE"
        ? "FLAT_DIFFERENCE"
        : isUpgrade(planType)
          ? "HARD_RESET"
          : null;

    setUpgradeMode(defaultMode);
    await fetchPreview(planType, defaultMode, 0);
    setShowConfirm(true);
  };

  const handleModeChange = (mode) => {
    setUpgradeMode(mode);
    fetchPreview(selectedPlan, mode, redeemPoints);
  };

  const handleRedeemChange = (e) => {
    const val = Math.max(
      0,
      Math.min(walletBalance, parseInt(e.target.value, 10) || 0),
    );
    setRedeemPoints(val);
    fetchPreview(selectedPlan, upgradeMode, val);
  };

  const confirmPayment = async () => {
    setCheckoutLoading(true);
    try {
      const res = await api.post("/owner/subscription/checkout", null, {
        params: {
          plan: selectedPlan,
          upgradeMode: upgradeMode || undefined,
          redeemPoints: redeemPoints || 0,
        },
      });

      const data = res.data || {};

      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }

      setShowConfirm(false);
      navigate("/owner/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Payment failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <section className="pricing-section">
      <div className="pricing-header">
        <h2 className="pricing-title">
          Choose the perfect plan for your PG business
        </h2>
        <p className="pricing-subtitle">
          Simple plans. Powerful features. No hidden charges.
        </p>
      </div>

      {loading ? (
        <div className="pricing-loading">
          <div className="loading-spinner" />
          <span>Loading plans…</span>
        </div>
      ) : (
        <>
          {/* ✅ PREMIUM BANNER — above ALL cards */}
          {isOwner && currentPlan === "PREMIUM" && (
            <div className="premium-owner-banner">
              <span className="premium-banner-icon">👑</span>
              <span className="premium-banner-text">
                You're on Premium — Unlimited Access, No Restrictions
              </span>
              <span className="premium-banner-icon">👑</span>
            </div>
          )}

          <div className="pricing-cards">
            {/* 1. Talk to Our Executive Card (Hardcoded) */}
            <div className="pricing-card-wrapper">
              <div className="pricing-card card-executive">
                <div className="card-top-section exec-top-section">
                  <div className="exec-head">
                    <div className="executive-icon">
                      <Headphones size={28} />
                    </div>
                    <h3 className="exec-title">
                      Talk to Our Executive
                    </h3>
                    <p className="plan-tagline exec-tagline">
                      If you have less than <br />
                      <strong>15 beds</strong>, we'll think of <br />
                      the perfect solution for you.
                    </p>
                  </div>

                  <div className="executive-shaded-box exec-shaded-box">
                    <div className="exec-row">
                      <Users size={16} /> Up to 15 Tenants
                    </div>
                    <div className="exec-row">
                      <User size={16} /> 1 Staff Login
                    </div>
                  </div>
                </div>

                <div className="exec-divider"></div>

                <div className="executive-contact-box">
                  <PhoneCall className="exec-contact-icon" size={24} />
                  <div>
                    <strong>Personalized Plan</strong>
                    <p className="exec-desc">
                      Our executive will understand your needs and suggest the
                      best plan for your PG.
                    </p>
                  </div>
                </div>

                <button
                  className="plan-btn btn-executive-outline"
                  onClick={() =>
                    // window.open("https://wa.me/919637605805", "_blank")
                    setShowContactChoice(true)
                  }
                >
                  Talk to Executive
                </button>
              </div>
            </div>

            {/* 2, 3, 4. Paid Plans from API */}
            {sortedPlans
              .filter((p) => p.planType !== "FREE")
              .map((p, idx) => {
                const today = new Date();
                let finalPrice = p.yearlyPrice;
                let hasValidOffer = false;

                if (
                  p.offerActive &&
                  p.offerValidUntil &&
                  new Date(p.offerValidUntil) >= today
                ) {
                  hasValidOffer = true;
                  if (p.offerDiscountAmount) {
                    finalPrice = p.yearlyPrice - p.offerDiscountAmount;
                  } else if (p.offerDiscountPercent) {
                    finalPrice =
                      p.yearlyPrice -
                      (p.yearlyPrice * p.offerDiscountPercent) / 100;
                  }
                }
                if (finalPrice < 0) finalPrice = 0;

                const isCurrent = isOwner && p.planType === currentPlan;
                const isHighest =
                  p.planType === sortedPlans[sortedPlans.length - 1]?.planType;
                const isDg = isOwner && isDowngrade(p.planType) && !isExpired;
                const isFreeBlocked = p.planType === "FREE" && freeTrialUsed;

                // ✅ After expiry — block plans lower than previous plan
                const isPrevDowngrade =
                  isExpired &&
                  previousPlan &&
                  rank(p.planType) < rank(previousPlan);

                const isDisabled =
                  isCurrent || !p.active || isFreeBlocked || isPrevDowngrade;
                return (
                  <div key={p.planType} className="pricing-card-wrapper">
                    <div
                      className={[
                        "pricing-card",
                        isHighest && !isCurrent ? "featured" : "",
                        isCurrent ? "card-current" : "",
                        isCurrent && p.planType === "PREMIUM"
                          ? "premium-active"
                          : "",
                        !p.active ? "card-disabled" : "",
                        hasValidOffer ? "card-offer" : "",
                        isDg ? "card-downgrade" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{"--card-index": idx}}
                    >
                      {isCurrent && (
                        <div className="badge badge-current">✦ Active Plan</div>
                      )}
                      {!isCurrent && p.planType === "PREMIUM" && (
                        <div className="badge badge-best-value">
                          <Crown size={16} style={{marginRight: "4px"}} /> Best
                          Value
                        </div>
                      )}

                      <div className="card-top-section exec-top-section">
                        <div className="card-top">
                          <div
                            className={`plan-head-row head-${p.planType.toLowerCase()}`}
                          >
                            <span
                              className={`plan-icon icon-${p.planType.toLowerCase()}`}
                            >
                              {p.planType === "BASIC" ? (
                                <User size={28} />
                              ) : p.planType === "PRO" ? (
                                <Briefcase size={28} />
                              ) : (
                                <InfinityIcon size={28} />
                              )}
                            </span>
                            <h3
                              className={`plan-name name-${p.planType.toLowerCase()}`}
                            >
                              {p.title}
                            </h3>
                          </div>
                          <p className="plan-tagline">
                            {p.planType === "BASIC"
                              ? "For individual PG owners"
                              : p.planType === "PRO"
                                ? "For growing PG businesses"
                                : "For professional operators"}
                          </p>
                        </div>

                        <div className="plan-price-block">
                          {hasValidOffer && (
                            <span className="price-original">
                              ₹{p.yearlyPrice.toLocaleString()}
                            </span>
                          )}
                          <div className="price-main">
                            <span className="price-currency">₹</span>
                            <span className="price-amount">
                              {Math.round(finalPrice).toLocaleString()}
                            </span>
                            <span className="price-cycle">/year</span>
                          </div>
                        </div>

                        <div
                          className={`offer-strip offer-${p.planType.toLowerCase()}`}
                        >
                          <Gift size={16} style={{marginRight: "4px"}} />1 Month
                          Extra Free
                        </div>

                        <div className={`plan-shaded-box box-${p.planType.toLowerCase()} plan-shaded-box-margin`}>
                          <div className="plan-row">
                            <Building size={16} />{" "}
                            {p.pgLimit < 0
                              ? "Unlimited PGs"
                              : `${p.pgLimit} PG${p.pgLimit !== 1 ? "s" : ""}`}
                          </div>
                          <div className="plan-row">
                            <Users size={16} /> Unlimited Tenants
                          </div>
                          <div className="plan-row">
                            <User size={16} />{" "}
                            {p.planType === "PRO"
                              ? "Unlimited Staff Logins"
                              : "5 Staff Logins"}
                          </div>
                        </div>
                      </div>

                      <div className="plan-divider"></div>

                      <ul className="plan-features">
                        {(p.planType === "BASIC"
                          ? [
                              "Tenant Management",
                              "Bed Management",
                              "Rent Collection",
                              "Online Rent Collection",
                              "Expense Management",
                              "Digital Rent Receipts",
                              "Staff Login (1 User)",
                              "Payment Reminders",
                              "Reports & Analytics (Basic)",
                              "Community Support",
                            ]
                          : p.planType === "PRO"
                            ? [
                                "All Basic features",
                                "Unlimited Payment Reminders",
                                "Reports & Analytics (Advanced)",
                                "Document Management",
                                "Priority WhatsApp Support",
                              ]
                            : [
                                "All Pro features",
                                "Advanced Analytics",
                                "Unlimited Document Management",
                                "<strong>Free PG verification</strong>",
                                "Offer <strong>promotion</strong> support",
                                "Dedicated account manager",
                                "Priority WhatsApp Support",
                              ]
                        ).map((f, i) => (
                          <li key={i}>
                            <span
                              className={`feat-icon check-${p.planType.toLowerCase()}`}
                            >
                              <Check size={16} />
                            </span>
                            <span dangerouslySetInnerHTML={{__html: f}}></span>
                          </li>
                        ))}
                      </ul>

                      {isDg ? (
                        <button
                          className="plan-btn btn-downgrade"
                          onClick={() => setShowDowngradePop(true)}
                        >
                          Contact Support
                        </button>
                      ) : (
                        <>
                          <button
                            className={`plan-btn btn-${p.planType.toLowerCase()} ${isDisabled ? "btn-disabled" : ""}`}
                            disabled={isDisabled}
                            onClick={() => !isDisabled && buyPlan(p.planType)}
                          >
                            {isFreeBlocked
                              ? "Trial Used"
                              : isPrevDowngrade
                                ? "Not Available"
                                : `Choose ${p.title}`}
                          </button>
                          {/* ✅ Free trial used note */}
                          {isFreeBlocked && (
                            <p className="trial-used-note">
                              Free trial already claimed. Upgrade to a paid
                              plan.
                            </p>
                          )}
                          {isPrevDowngrade && (
                            <p className="prev-downgrade-note">
                              You were on a higher plan. Contact support to
                              downgrade.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Bottom Trust/Features Bar */}
          <div className="pricing-trust-bar">
            <div className="trust-item">
              <ShieldCheck size={20} className="trust-icon" />
              <span>Secure & Reliable</span>
            </div>
            <div className="trust-item">
              <Cloud size={20} className="trust-icon" />
              <span>Cloud Backup</span>
            </div>
            <div className="trust-item">
              <Lock size={20} className="trust-icon" />
              <span>Your Data is Safe</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={20} className="trust-icon" />
              <span>Trusted by PG Owners</span>
            </div>
          </div>
        </>
      )}

      {/* ══ DOWNGRADE POPUP ══ */}
      {showDowngradePop && (
        <div
          className="overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowDowngradePop(false)
          }
        >
          <div className="modal-box downgrade-modal">
            <div className="modal-icon-wrap downgrade-icon-wrap">
              <span>🔒</span>
            </div>
            <h4>Downgrade Not Available</h4>
            <p>
              Plan downgrades require manual review by our support team to
              ensure your data and PG listings are handled correctly.
            </p>
            <div className="downgrade-steps">
              <div className="step">
                <span className="step-num">1</span>
                <span>Contact our support team via email or chat</span>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <span>Our team will review your account</span>
              </div>
              <div className="step">
                <span className="step-num">3</span>
                <span>Downgrade will be applied within 24–48 hrs</span>
              </div>
            </div>
            <div className="modal-actions">
              <a href="mailto:support@pglinker.com" className="btn btn-primary">
                Email Support →
              </a>
              <button
                className="btn btn-ghost"
                onClick={() => setShowDowngradePop(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ OWNER-ONLY POPUP ══ */}
      {showOwnerPop && (
        <div
          className="overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowOwnerPop(false)
          }
        >
          <div className="modal-box">
            <div className="modal-icon-wrap">
              <span>{showOwnerPop === "login" ? "🔑" : "🏢"}</span>
            </div>
            <h4>
              {showOwnerPop === "login" ? "Login Required" : "Owners Only"}
            </h4>
            <p>
              {showOwnerPop === "login"
                ? "Please log in to your PG Owner account to purchase or upgrade a subscription plan."
                : "Subscription plans are exclusively available for PG owners."}
            </p>
            <div className="modal-actions">
              {showOwnerPop === "login" && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowOwnerPop(false);
                    navigate("/login", {state: {from: "/owner/pricing"}});
                  }}
                >
                  Login as Owner →
                </button>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => setShowOwnerPop(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {showContactChoice && (
        <div
          className="overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowContactChoice(false)
          }
        >
          <div className="modal-box contact-choice-modal">
            <div className="modal-icon-wrap modal-icon-wrap-light">
              <span>👋</span>
            </div>
            <h4>Talk to Our Executive</h4>
            <p>Choose how you'd like to reach us — we're happy to help.</p>

            <div className="contact-options">
              <a
                href="https://wa.me/919637605805"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-option option-whatsapp"
                onClick={() => setShowContactChoice(false)}
              >
                <span className="option-icon-wrap icon-whatsapp">
                  <MessageCircle size={22} />
                </span>
                <span className="option-text">
                  <strong>Chat on WhatsApp</strong>
                  <span>Usually replies in minutes</span>
                </span>
              </a>

              <a
                href="tel:+919637605805"
                className="contact-option option-call"
                onClick={() => setShowContactChoice(false)}
              >
                <span className="option-icon-wrap icon-call">
                  <Phone size={22} />
                </span>
                <span className="option-text">
                  <strong>Call Us Now</strong>
                  <span>+91 96376 05805</span>
                </span>
              </a>
            </div>

            <button
              className="btn btn-ghost modal-cancel-btn"
              onClick={() => setShowContactChoice(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ══ CONFIRM MODAL ══ */}
      {showConfirm && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowConfirm(false)}
        >
          <div className="modal-box confirm-modal">
            <div className="confirm-header">
              <div className="confirm-title-row">
                <h4>
                  {isRenewal(selectedPlan)
                    ? "Renew Plan"
                    : isUpgrade(selectedPlan)
                      ? "Upgrade Plan"
                      : "Confirm Purchase"}
                </h4>
                <div className="plan-chip">⚡ {selectedPlan}</div>
              </div>
            </div>

            {isUpgrade(selectedPlan) && currentPlan !== "FREE" && (
              <div className="mode-section">
                <p className="section-label">Choose upgrade type</p>
                <div className="mode-grid">
                  <div
                    className={`mode-card ${upgradeMode === "FLAT_DIFFERENCE" ? "mode-selected" : ""}`}
                    onClick={() => handleModeChange("FLAT_DIFFERENCE")}
                  >
                    <div className="mode-card-top">
                      <span className="mode-title">Extend &amp; Save</span>
                      {upgradeMode === "FLAT_DIFFERENCE" && (
                        <span className="mode-tick">✓</span>
                      )}
                    </div>
                    <p className="mode-desc">
                      Pay only the difference. Keep your remaining days.
                    </p>
                  </div>
                  <div
                    className={`mode-card ${upgradeMode === "HARD_RESET" ? "mode-selected" : ""}`}
                    onClick={() => handleModeChange("HARD_RESET")}
                  >
                    <div className="mode-card-top">
                      <span className="mode-title">Fresh Year</span>
                      {upgradeMode === "HARD_RESET" && (
                        <span className="mode-tick">✓</span>
                      )}
                    </div>
                    <p className="mode-desc">
                      Start a brand new 1-year subscription today.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="confirm-divider" />

            {walletBalance > 0 && (
              <div className="wallet-block">
                <div className="wallet-header">
                  <span className="wallet-title">💰 Wallet Balance</span>
                  <span className="wallet-bal">
                    ₹{walletBalance.toLocaleString()} available
                  </span>
                </div>
                <div className="wallet-input-wrap">
                  <span className="wallet-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={walletBalance}
                    maxLength="10"
                    value={redeemPoints}
                    onChange={handleRedeemChange}
                    placeholder="0"
                    className="wallet-input"
                  />
                  <span className="wallet-suffix">points to redeem</span>
                </div>
              </div>
            )}

            {previewLoading ? (
              <div className="preview-loading">
                <div className="loading-spinner sm" />
                <span>Calculating…</span>
              </div>
            ) : previewError ? (
              <div className="preview-error">
                <span>⚠</span>
                <span>{previewError}</span>
              </div>
            ) : (
              preview && (
                <div className="price-table">
                  <div className="price-row">
                    <span>Full plan price</span>
                    <span>₹{preview.originalPrice.toLocaleString()}</span>
                  </div>
                  {preview.upgradeCreditApplied > 0 && (
                    <div className="price-row saving">
                      <span>Current plan credit</span>
                      <span>
                        −₹{preview.upgradeCreditApplied.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {preview.discountApplied > 0 && (
                    <div className="price-row saving">
                      <span>Offer discount</span>
                      <span>−₹{preview.discountApplied.toLocaleString()}</span>
                    </div>
                  )}
                  {preview.walletUsed > 0 && (
                    <div className="price-row saving">
                      <span>Wallet redeemed</span>
                      <span>−₹{preview.walletUsed.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="price-row total-row">
                    <span>Total payable</span>
                    <span>₹{preview.finalPayable.toLocaleString()}</span>
                  </div>
                </div>
              )
            )}

            <div className="modal-actions">
              <button
                onClick={confirmPayment}
                className="btn btn-primary"
                disabled={
                  checkoutLoading ||
                  previewLoading ||
                  !preview ||
                  !!previewError
                }
              >
                Pay ₹{(preview?.finalPayable ?? 0).toLocaleString()} →
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PricingPlans;
