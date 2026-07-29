import { FaUnlock, FaClipboardList } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "../../CSS/purchaseHistory.css";
import { TableSkeleton } from "../public/Skeleton";

const OwnerPurchaseHistory = () => {

  const [history, setHistory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const stats = {
  totalSpent: history.reduce((sum, h) => sum + (h.finalAmountPaid || 0), 0),
  totalTransactions: history.filter(h => (h.planType || "").toUpperCase() !== "FREE").length,
  currentPlan: history.find(h => h.current)?.planType || "N/A"
};

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    if (typeof dateStr === "string" && dateStr.includes(" ")) {
      return dateStr.split(" ")[0].replace(/-/g, "/");
    }
    const date = new Date(dateStr);
    if (isNaN(date)) return "—";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatMode = (mode) => {
    if (!mode) return "—";
    if (mode === "HARD_RESET") return "Fresh Start";
    if (mode === "FLAT_DIFFERENCE") return "Extend & Save";
    return mode;
  };

  useEffect(() => {
    const load = async () => {
  try {
    setLoading(true);
    const [histRes, profileRes] = await Promise.all([
  api.get("/purchase-history/owner"),
  api.get("/owner/profile")
]);

let data = histRes.data || [];
// Extract creation date from MongoDB ObjectId (no backend change needed)
const createdAt = profileRes.data?.id
  ? new Date(parseInt(profileRes.data.id.substring(0, 8), 16) * 1000).toISOString()
  : null;

    if (data.length === 0) {
      data = [{
        planType: "FREE",
        transactionType: "ACTIVATION",
        finalAmountPaid: 0,
        walletUsedAmount: 0,
        discountApplied: 0,
        planStartDate: createdAt,   // ← was null
        planExpiryDate: null,
        purchaseDate: createdAt,    // ← was null
        previousPlanType: null,
        upgradeMode: null,
        current: true,
      }];
    }

    data.sort((a, b) => {
      if (a.current) return -1;
      if (b.current) return 1;
      return new Date(b.purchaseDate) - new Date(a.purchaseDate);
    });
    setHistory(data);
    setFiltered(data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
    load();
  }, []);

  useEffect(() => {
    let data = [...history];

    if (typeFilter) {
      data = data.filter(h =>
        (h.transactionType || "").toUpperCase() === typeFilter
      );
    }

    if (search) {
      data = data.filter(h =>
        (
          (h.planType || "") +
          (h.featureName || "") +
          (h.transactionType || "")
        )
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    data.sort((a, b) => {
      if (a.current) return -1;
      if (b.current) return 1;
      return new Date(b.purchaseDate) - new Date(a.purchaseDate);
    });

    setFiltered(data);
  }, [search, typeFilter, history]);

  /* ── shared row-level helpers ── */
  const getRowMeta = (h) => {
    const isFeature = h.transactionType === "FEATURE_UNLOCK";
    const isFree = (h.planType || "").toUpperCase() === "FREE";
    const isCurrent = h.current;

    const planLabel        = isFeature ? "FEATURE" : h.planType;
    const transactionLabel = isFeature ? "Feature Unlock" : (isFree ? "TRIAL" : h.transactionType);
    const detailLabel      = isFeature
      ? (h.featureName === "VERIFICATION" ? "PG Verification" : "Offers Enabled")
      : isFree
      ? "Trial Plan"
      : formatMode(h.upgradeMode);

    return { isFeature, isFree, isCurrent, planLabel, transactionLabel, detailLabel };
  };

  return (
    <DashboardLayout
      title="Billing History"
      subtitle="Your subscription payments"
    >

      {/* ── STATS CARDS ── */}
      <div className="booking-stats-grid">

        {/* TOTAL SPENT */}
        <div className="booking-stat-card total">
          <div className="icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="res-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4h12"/>
              <path d="M6 8h12"/>
              <path d="M6 12h5a4 4 0 0 0 0-8"/>
              <path d="M6 12l8 8"/>
            </svg>
          </div>
          <div>
            <div className="value">₹{stats.totalSpent.toLocaleString("en-IN")}</div>
            <div className="label">Total Spent</div>
          </div>
        </div>

        {/* CURRENT PLAN */}
        <div className="booking-stat-card monthly">
          <div className="icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="res-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <div className="value">{stats.currentPlan}</div>
            <div className="label">Current Plan</div>
          </div>
        </div>

        {/* TOTAL TRANSACTIONS */}
        <div className="booking-stat-card daily">
          <div className="icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="res-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="6" x2="12" y2="12"/>
              <line x1="12" y1="12" x2="16" y2="14"/>
            </svg>
          </div>
          <div>
            <div className="value">{stats.totalTransactions}</div>
            <div className="label">Transactions</div>
          </div>
        </div>

      </div>

      <div className="card p-3 history-card">

        {/* ── TOOLBAR ── */}
        <div className="history-toolbar">
          <input
            className="form-control history-search"
            placeholder="Search plan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-select history-filter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">All Transactions</option>
            <option value="NEW_PURCHASE">New Purchase</option>
            <option value="RENEWAL">Renewal</option>
            <option value="UPGRADE">Upgrade</option>
            <option value="FEATURE_UNLOCK">Feature Unlock</option>
          </select>
        </div>

        {/* ════════════════════════════════════════
            MOBILE CARD LIST
            Lives outside the scroll wrapper so
            overflow / min-width never clips it.
            Hidden on desktop via CSS.
            ════════════════════════════════════════ */}
        <div className="oph-mobile-list">
          {loading ? (
            <div className="p-3 text-center text-muted">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-4 text-muted">No purchase history</div>
          ) : (
            filtered.map((h, i) => {
              const { isFeature, isFree, isCurrent, planLabel, transactionLabel, detailLabel } = getRowMeta(h);

              return (
                <div
                  key={i}
                  className={`oph-card${isCurrent ? " oph-card--current" : ""}${isFeature ? " oph-card--feature" : ""}`}
                >
                  {/* Card Header */}
                  <div className="oph-card-header">
                    <div className="oph-card-header-left">
                      <div className="oph-card-icon">
                        {isFeature ? <FaUnlock /> : <FaClipboardList />}
                      </div>
                      <div>
                        <div className="oph-card-plan-name">{planLabel}</div>
                        <div className="oph-card-transaction">{transactionLabel}</div>
                      </div>
                    </div>
                    <div className="oph-card-header-right">
                      <div className="oph-card-amount">₹{h.finalAmountPaid || 0}</div>
                      {isCurrent && (
                        <span className="oph-badge oph-badge--current">CURRENT</span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="oph-card-body">

                    <div className="oph-card-row">
                      <span className="oph-card-label">Details</span>
                      <span className="oph-card-value">
                        {detailLabel}
                        {!isFeature && !isFree && h.previousPlanType && (
                          <span className="oph-upgrade-arrow">
                            {" "}{h.previousPlanType} → {h.planType}
                          </span>
                        )}
                      </span>
                    </div>

                    {!isFeature && (
                      <div className="oph-card-row">
                        <span className="oph-card-label">Previous Plan</span>
                        <span className="oph-card-value">
                          {isFree ? "N/A" : (h.previousPlanType || "N/A")}
                        </span>
                      </div>
                    )}

                    <div className="oph-card-row">
                      <span className="oph-card-label">Start → Expiry</span>
                      <span className="oph-card-value">
                        {formatDate(h.planStartDate)} → {formatDate(h.planExpiryDate)}
                      </span>
                    </div>

                    <div className="oph-card-row">
                      <span className="oph-card-label">Purchase Date</span>
                      <span className="oph-card-value oph-card-value--date">
                        {formatDate(h.purchaseDate)}
                      </span>
                    </div>

                  </div>

                  {/* Card Footer */}
                  <div className="oph-card-footer">
                    <div className="oph-fin-item">
                      <span className="oph-fin-label">Paid</span>
                      <span className="oph-fin-value oph-fin-value--paid">₹{h.finalAmountPaid || 0}</span>
                    </div>
                    <div className="oph-fin-divider" />
                    <div className="oph-fin-item">
                      <span className="oph-fin-label">Wallet</span>
                      <span className="oph-fin-value">₹{h.walletUsedAmount || 0}</span>
                    </div>
                    <div className="oph-fin-divider" />
                    <div className="oph-fin-item">
                      <span className="oph-fin-label">Discount</span>
                      <span className="oph-fin-value oph-fin-value--discount">₹{h.discountApplied || 0}</span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* ════════════════════════════════════════
            DESKTOP TABLE
            Hidden on mobile via CSS.
            Clean table — no card cells inside.
            ════════════════════════════════════════ */}
        <div className="table-scroll history-table oph-desktop-table">
          <table className="modern-table">

            <thead>
              <tr>
                <th>Plan</th>
                <th>Previous</th>
                <th>Transaction</th>
                <th>Upgrade Details</th>
                <th>Start</th>
                <th>Expiry</th>
                <th>Paid</th>
                <th>Wallet</th>
                <th>Discount</th>
                <th>Purchase Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton rows={6} cols={10} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center">
                    No purchase history
                  </td>
                </tr>
              ) : (
                filtered.map((h, i) => {
                  const { isFeature, isFree, isCurrent } = getRowMeta(h);

                  return (
                    <tr key={i}>

                      <td data-label="Plan">
                        {isFeature ? (
                          <span className="history-pill feature-pill"><FaUnlock /> FEATURE</span>
                        ) : (
                          <>
                            <span className="history-pill">{h.planType}</span>
                            {isCurrent && (
                              <span className="admin-current-pill">CURRENT</span>
                            )}
                          </>
                        )}
                      </td>

                      <td data-label="Previous">
                        {isFeature ? "N/A" : (isFree ? "N/A" : (h.previousPlanType || "N/A"))}
                      </td>

                      <td data-label="Transaction">
                        {isFeature ? "Feature Unlock" : (isFree ? "TRIAL" : h.transactionType)}
                      </td>

                      <td data-label="Upgrade Details">
                        {isFeature ? (
                          <div className="upgrade-info">
                            {h.featureName === "VERIFICATION" ? "PG Verification" : "Offers Enabled"}
                          </div>
                        ) : isFree ? (
                          <div className="upgrade-info">Trial Plan</div>
                        ) : (
                          <>
                            <div className="upgrade-info">{formatMode(h.upgradeMode)}</div>
                            {h.previousPlanType && (
                              <div className="upgrade-from">
                                {h.previousPlanType} → {h.planType}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      <td data-label="Start">{formatDate(h.planStartDate)}</td>
                      <td data-label="Expiry">{formatDate(h.planExpiryDate)}</td>
                      <td data-label="Paid" className="amount">₹{h.finalAmountPaid || 0}</td>
                      <td data-label="Wallet">₹{h.walletUsedAmount || 0}</td>
                      <td data-label="Discount">₹{h.discountApplied || 0}</td>
                      <td data-label="Purchase Date" className="date-link">{formatDate(h.purchaseDate)}</td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

      </div>

    </DashboardLayout>
  );
};

export default OwnerPurchaseHistory;
