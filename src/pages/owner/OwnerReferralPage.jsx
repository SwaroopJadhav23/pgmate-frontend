import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./OwnerReferralPage.css";

const OwnerReferralPage = () => {
  const [data, setData] = useState(null);
  const [showWalletPopup, setShowWalletPopup] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "active" | "deleted"
  const [loading, setLoading] = useState(true);

  const copyCode = () => {
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Stat = ({ label, value, icon, color }) => (
    <div className={`stat-card referral-stat-card ${color}`}>
      <div className="stat-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  );

  useEffect(() => {
    const loadReferrals = async () => {
      try {
        const res = await api.get("/owner/referrals");
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadReferrals();
  }, []);

  const openWalletPopup = async () => {
    try {
      const res = await api.get("/api/wallet/transactions");
      setTransactions(res.data || []);
      setShowWalletPopup(true);
    } catch {
      setTransactions([]);
      setShowWalletPopup(true);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Refer & Earn" subtitle="Invite users and earn rewards">
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading referrals...
        </div>
      </DashboardLayout>
    );
  }

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
      year: "numeric",
    });
  };

  // ── Filter logic (pure frontend — backend sends all rows)
  const allReferrals = data.referrals ?? [];
  const activeCount = allReferrals.filter((r) => !r.deleted).length;
  const deletedCount = allReferrals.filter((r) => r.deleted).length;

  const filteredReferrals = allReferrals.filter((r) => {
    if (filter === "active") return !r.deleted;
    if (filter === "deleted") return r.deleted;
    return true;
  });

  return (
    <DashboardLayout title="Refer & Earn" subtitle="Invite users and earn rewards">

      {/* REFERRAL CODE */}
      <div className="card referral-code-card">
        <h4>
          <i className="bi bi-gift-fill"></i> Your Referral Code
        </h4>
        <div className="referral-code-box">
          <span>{data.referralCode}</span>
          <button onClick={copyCode}>
            {copied ? (
              <><i className="bi bi-check-circle-fill"></i> Copied</>
            ) : (
              <><i className="bi bi-copy"></i> Copy</>
            )}
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid referral-stats-grid">
        <div className="stat-card referral-stat-card clickable icon-blue" onClick={openWalletPopup}>
          <div className="stat-icon"><i className="bi bi-wallet-fill"></i></div>
          <p>Wallet Balance</p>
          <h3>{data.walletBalance}</h3>
          <small>View Transactions →</small>
        </div>
        <Stat label="Total Earned"         value={data.totalEarned}         icon="bi-currency-rupee"    color="icon-purple" />
        <Stat label="Successful Referrals" value={data.successfulReferrals} icon="bi-person-check-fill" color="icon-green"  />
        <Stat label="Pending Referrals"    value={data.pendingReferrals}    icon="bi-hourglass-split"   color="icon-orange" />
      </div>

      {/* ── FILTER BAR ── */}
      <div className="referral-filter-bar">
        <button
          className={`filter-btn ${filter === "all" ? "active-all" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
          <span className="filter-count count-all">{allReferrals.length}</span>
        </button>
        <button
          className={`filter-btn ${filter === "active" ? "active-active" : ""}`}
          onClick={() => setFilter("active")}
        >
          Active users
          <span className="filter-count count-active">{activeCount}</span>
        </button>
        <button
          className={`filter-btn ${filter === "deleted" ? "active-deleted" : ""}`}
          onClick={() => setFilter("deleted")}
        >
          Deleted users
          <span className="filter-count count-deleted">{deletedCount}</span>
        </button>
      </div>

      {/* REFERRAL TABLE
          orr- prefix on all new classes to avoid conflicts
          Desktop: .orr-desktop-cell (shown ≥769px)
          Mobile:  .orr-card-cell    (shown ≤768px, one per row) */}
      <table className="modern-table owner-mobile-card-table orr-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Status</th>
            <th>Reward</th>
          </tr>
        </thead>
        <tbody>
          {filteredReferrals.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center">No referrals match this filter</td>
            </tr>
          ) : (
            filteredReferrals.map((r, i) => (
              <tr key={i} className={`orr-table-row ${r.deleted ? "row-deleted" : ""}`}>

                {/* ── MOBILE CARD CELL (hidden on desktop) ── */}
                <td colSpan="6" className="orr-card-cell">
                  <div className={`orr-card ${r.deleted ? "orr-card--deleted" : ""}`}>

                    {/* Card Header */}
                    <div className="orr-card-header">
                      <div className="orr-card-header-left">
                        <div className="orr-card-avatar">
                          {(r.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={`orr-card-name ${r.deleted ? "orr-name-strike" : ""}`}>
                            {r.name || "—"}
                          </div>
                          <div className="orr-card-phone">{r.phone || "—"}</div>
                        </div>
                      </div>
                      <div className="orr-card-header-right">
                        {r.deleted ? (
                          <span className="orr-badge orr-badge--deleted">Deleted</span>
                        ) : (
                          <span className={`status-pill ${r.status?.toLowerCase()}`}>
                            {r.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="orr-card-body">
                      <div className="orr-card-row">
                        <span className="orr-card-label">Role</span>
                        <span className="orr-card-value">{r.role || "—"}</span>
                      </div>
                      <div className="orr-card-row">
                        <span className="orr-card-label">Joined</span>
                        <span className="orr-card-value">{formatDate(r.joinedAt)}</span>
                      </div>
                      <div className="orr-card-row orr-card-row--last">
                        <span className="orr-card-label">Reward Points</span>
                        <span className="orr-card-value orr-card-value--reward">
                          {r.rewardPoints ?? 0}
                        </span>
                      </div>
                    </div>

                  </div>
                </td>

                {/* ── DESKTOP CELLS (hidden on mobile) ── */}
                <td data-label="Name" className={`orr-desktop-cell ${r.deleted ? "name-strikethrough" : ""}`}>
                  {r.name || "—"}
                  {r.deleted && <span className="deleted-badge">Deleted</span>}
                </td>
                <td data-label="Phone" className="orr-desktop-cell">{r.phone || "—"}</td>
                <td data-label="Role" className="orr-desktop-cell">{r.role || "—"}</td>
                <td data-label="Joined" className="orr-desktop-cell">{formatDate(r.joinedAt)}</td>
                <td data-label="Status" className="orr-desktop-cell">
                  <span className={`status-pill ${r.status?.toLowerCase()}`}>
                    {r.status}
                  </span>
                </td>
                <td data-label="Reward" className="orr-desktop-cell">{r.rewardPoints ?? 0}</td>

              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* WALLET POPUP */}
      {showWalletPopup && (
        <div className="wallet-popup-overlay">
          <div className="wallet-popup-box">
            <h4>Wallet Transactions</h4>
            {transactions.length === 0 ? (
              <p>No transactions found.</p>
            ) : (
              <table className="table owner-mobile-card-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Points</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={i}>
                      <td data-label="Type" data-card-primary>{t.type}</td>
                      <td data-label="Points">{t.points}</td>
                      <td data-label="Description">{t.description}</td>
                      <td data-label="Date">{formatDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setShowWalletPopup(false)}
              style={{ marginTop: "10px" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default OwnerReferralPage;