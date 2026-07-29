import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import "./UserReferralPage.css";
import UserLayout from "../../layouts/UserLayout";

const TABS = [
  { key: "referrals", label: "Referrals", icon: "bi-people-fill" },
  { key: "transactions", label: "Transactions", icon: "bi-wallet2" },
  { key: "withdrawals", label: "Withdrawals", icon: "bi-bank2" },
];

const UserReferralPage = () => {
  const [data, setData]                 = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals]   = useState([]);
  const [activeTab, setActiveTab]       = useState("referrals");
  const [points, setPoints]             = useState("");
  const [upi, setUpi]                   = useState("");
  const [copied, setCopied]             = useState(false);

  const hasPending = withdrawals.some(w => w.status === "PENDING");

  useEffect(() => {
    api.get("/user/referrals").then(res => setData(res.data));
    api.get("/user/wallet/transactions").then(res => setTransactions(res.data));
    api.get("/user/withdrawals").then(res => setWithdrawals(res.data));
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const requestWithdraw = async () => {
    if (!points || !upi) {
      toast("Please enter points and UPI ID", { icon: "⚠️" });
      return;
    }
    try {
      await api.post("/user/withdrawals", null, { params: { points, upiId: upi } });
      toast.success("Your request has been submitted");
      setPoints(""); setUpi("");
      const res = await api.get("/user/withdrawals");
      setWithdrawals(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Withdrawal failed";
      toast.error(msg);
    }
  };

  const tabCounts = {
    referrals:    data?.referrals?.length ?? 0,
    transactions: transactions?.length    ?? 0,
    withdrawals:  withdrawals?.length     ?? 0,
  };

if (!data) return (
  <UserLayout hideWelcome>
    <div className="urp-loading">
      <div className="urp-spinner" />
      <p>Loading your referral data…</p>
    </div>
  </UserLayout>
);

return (
  <UserLayout hideWelcome>
    <div className="urp-page">

        {/* ── HERO ── */}
        <section className="urp-hero">
          <div className="urp-hero-glow urp-glow-1" />
          <div className="urp-hero-glow urp-glow-2" />
          <div className="urp-hero-content">
            <span className="urp-hero-badge">✦ Referral Program</span>
            <h1 className="urp-hero-title">Refer Friends,<br />Earn Rewards</h1>
            <p className="urp-hero-sub">
              Share your code. When your friend signs up and books a PG, you both get rewarded instantly.
            </p>
            <div className="urp-hero-actions">
              <button
                className="urp-hero-share-btn"
                onClick={() => {
                  if (data?.referralCode) {
                    const text = `Join PgMate using my referral code ${data.referralCode} and get rewarded! 🎉`;
                    if (navigator.share) {
                      navigator.share({ title: "Join PgMate", text });
                    } else {
                      navigator.clipboard.writeText(text);
                      toast.success("Referral message copied to clipboard.");
                    }
                  }
                }}
              >
                ↗ Share with Friends
              </button>
            </div>
          </div>
        </section>

        {/* ── REFERRAL CODE ── */}
        <section className="urp-card urp-code-card">
          <div className="urp-card-eyebrow">Your Referral Code</div>
          <div className="urp-code-row">
            <div className="urp-code-display">
              <span className="urp-code-dots">• • •</span>
              <span className="urp-code-value">{data.referralCode}</span>
            </div>
            <button
              className={`urp-copy-btn ${copied ? "urp-copy-btn--done" : ""}`}
              onClick={copyCode}
            >
              <span className="urp-copy-icon">{copied ? "✓" : "⎘"}</span>
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="urp-stats">
          {[
            { label: "Wallet Balance",       value: data.walletBalance,       unit: "pts", icon: "bi-wallet-fill", color: "gold"  },
            { label: "Total Earned",         value: data.totalEarned,         unit: "pts", icon: "bi-trophy-fill", color: "green" },
            { label: "Successful Referrals", value: data.successfulReferrals, unit: "",    icon: "bi-check-circle-fill", color: "blue"  },
            { label: "Pending Referrals",    value: data.pendingReferrals,    unit: "",    icon: "bi-hourglass-split", color: "amber" },
          ].map((s, i) => (
            <div className={`urp-stat urp-stat--${s.color}`} key={i} style={{ "--i": i }}>
              <div className="urp-stat-icon">
  <i className={`bi ${s.icon}`}></i>
</div>
              <div className="urp-stat-val">
                {s.value}<span className="urp-stat-unit">{s.unit}</span>
              </div>
              <div className="urp-stat-label">{s.label}</div>
            </div>
          ))}
        </section>

        {/* ── WITHDRAW ── */}
        <section className="urp-card urp-withdraw-card">
          <div className="urp-card-eyebrow">Withdraw Rewards</div>
          <div className="urp-withdraw-row">
            <div className="urp-field">
              <label>Points to Withdraw</label>
              <div className="urp-input-wrap">
                <span className="urp-prefix">
  <i className="bi bi-at"></i>
</span>
                <input
                  type="number"
                  maxLength="10"
                  placeholder="e.g. 500"
                  value={points}
                  onChange={e => setPoints(e.target.value)}
                />
              </div>
            </div>
            <div className="urp-field">
              <label>UPI ID</label>
              <div className="urp-input-wrap">
                <span className="urp-prefix">
  <i className="bi bi-at"></i>
</span>
                <input
                  type="text"
                  placeholder="name@upi"
                  value={upi}
                  onChange={e => setUpi(e.target.value)}
                />
              </div>
            </div>
            <div className="urp-field urp-field--btn">
              <label>&nbsp;</label>
              <button
                className={`urp-withdraw-btn ${hasPending ? "urp-withdraw-btn--blocked" : ""}`}
                onClick={requestWithdraw}
                disabled={hasPending}
              >
                {hasPending ? "⏸  Pending Exists" : "Request Withdrawal →"}
              </button>
            </div>
          </div>
          {hasPending && (
            <p className="urp-pending-note">
              ⚠ A pending withdrawal exists. It must be processed before requesting another.
            </p>
          )}
        </section>

        {/* ── TABBED TABLES ── */}
        <section className="urp-card urp-tables-card">

          <div className="urp-tab-bar">
            {TABS.map((t, idx) => (
              <button
                key={t.key}
                className={`urp-tab ${activeTab === t.key ? "urp-tab--active" : ""}`}
                onClick={() => setActiveTab(t.key)}
                style={{ "--idx": idx }}
              >
                <span className="urp-tab-icon">
  <i className={`bi ${t.icon}`}></i>
</span>
                <span>{t.label}</span>
                {tabCounts[t.key] > 0 && (
                  <span className="urp-tab-badge">{tabCounts[t.key]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Referrals */}
          {activeTab === "referrals" && (
            <div className="urp-table-wrap urp-anim-in">
              {data.referrals?.length === 0 ? (
                <div className="urp-empty">
                  <span className="urp-empty-icon"><i className="bi bi-link-45deg"></i></span>
                  <p>No referrals yet. Share your code to get started!</p>
                </div>
              ) : (
                <table className="urp-table">
                  <thead><tr><th>Name</th><th>Phone</th><th>Joined</th><th>Status</th><th>Reward</th></tr></thead>
                  <tbody>
                    {data.referrals.map((r, i) => (
                      <tr key={i} style={{ "--row": i }}>
                        <td className="urp-td-bold">{r.name}</td>
                        <td>{r.phone}</td>
                        <td>{new Date(r.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td><span className={`urp-pill urp-pill--${r.status?.toLowerCase()}`}>{r.status}</span></td>
                        <td className="urp-td-pts">{r.rewardPoints ?? 0} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Transactions */}
          {activeTab === "transactions" && (
            <div className="urp-table-wrap urp-anim-in">
              {transactions?.length === 0 ? (
                <div className="urp-empty">
                  <span className="urp-empty-icon"><i className="bi bi-wallet2"></i></span>
                  <p>No wallet transactions yet.</p>
                </div>
              ) : (
                <table className="urp-table">
                  <thead><tr><th>Type</th><th>Points</th><th>Description</th><th>Date</th></tr></thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={i} style={{ "--row": i }}>
                        <td><span className={`urp-pill urp-pill--${t.type?.toLowerCase()}`}>{t.type}</span></td>
                        <td className={t.type === "CREDIT" ? "urp-td-credit" : "urp-td-debit"}>
                          {t.type === "CREDIT" ? "+" : "−"}{t.points} pts
                        </td>
                        <td className="urp-td-desc">{t.description}</td>
                        <td>{new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Withdrawals */}
          {activeTab === "withdrawals" && (
            <div className="urp-table-wrap urp-anim-in">
              {withdrawals?.length === 0 ? (
                <div className="urp-empty">
                  <span className="urp-empty-icon"><i className="bi bi-bank2"></i></span>
                  <p>No withdrawal history yet.</p>
                </div>
              ) : (
                <table className="urp-table">
                  <thead><tr><th>Points</th><th>UPI ID</th><th>Status</th><th>Requested On</th></tr></thead>
                  <tbody>
                    {withdrawals.map((w, i) => (
                      <tr key={i} style={{ "--row": i }}>
                        <td className="urp-td-pts">{w.points} pts</td>
                        <td>{w.upiId}</td>
                        <td><span className={`urp-pill urp-pill--${w.status?.toLowerCase()}`}>{w.status}</span></td>
                        <td>{w.requestedAt ? new Date(w.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

</section>
      </div>
    </UserLayout>
  );
};

export default UserReferralPage;