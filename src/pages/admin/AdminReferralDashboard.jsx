import { FaGift } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";
import "./AdminReferralDashboard.css";
import { TableSkeleton, OwnerCardSkeleton } from "../public/Skeleton";
import Swal from "sweetalert2";

const getInitials = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const AdminReferralDashboard = () => {
  const [ownerPoints, setOwnerPoints] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [referrals, setReferrals] = useState([]);
  const [filterType, setFilterType] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("newest");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [configRes, referralRes] = await Promise.all([
        api.get("/admin/referrals/referral-configs"),
        api.get(`/admin/referrals?sort=${sortOrder}`),
      ]);

      const owner = configRes.data.find(
        (c) => c.trigger === "OWNER_REFERRAL_REWARD" && c.active
      );
      const user = configRes.data.find(
        (c) => c.trigger === "USER_REFERRAL_REWARD" && c.active
      );
      if (owner) setOwnerPoints(owner.rewardPoints);
      if (user) setUserPoints(user.rewardPoints);

      setReferrals(referralRes.data);

    } finally {
      setLoading(false);
    }
  }, [sortOrder]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = referrals.filter((r) => {
    if (filterType === "OWNER" && r.referrerRole !== "OWNER") return false;
    if (filterType === "USER" && r.referrerRole !== "USER") return false;
    if (statusFilter === "PAID" && !r.paid) return false;
    if (statusFilter === "PENDING" && r.paid) return false;
    const s = searchTerm.toLowerCase();
    if (s && !r.referrerName?.toLowerCase().includes(s) && !r.referredName?.toLowerCase().includes(s)) return false;
    return true;
  });

  const grouped = filtered.reduce((acc, r) => {
    const key = r.referrerId || r.referrerName;
    if (!acc[key]) acc[key] = { name: r.referrerName, role: r.referrerRole, rows: [] };
    acc[key].rows.push(r);
    return acc;
  }, {});

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const updateConfig = async (trigger, rewardPoints) => {
    try {
      await api.post("/admin/referrals/referral-config", {
        trigger,
        rewardPoints: Number(rewardPoints),
      });

      if (trigger === "OWNER_REFERRAL_REWARD") {
        setOwnerPoints(Number(rewardPoints));
      } else {
        setUserPoints(Number(rewardPoints));
      }

      Swal.fire({
        icon: "success",
        title: <>Updated <FaGift /></>,
        text: "Referral reward updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      loadData();

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not update referral config",
      });
    }
  };

  const groupEntries = Object.entries(grouped);

  return (
    <DashboardLayout title="Referral Management">
      <div className="referral-root">

        <div className="config-grid">
          <div className="config-card config-card--owner">
            <div className="config-card-text">
              <div className="config-card-label">
                <i className="bi bi-person-badge-fill"></i>
                Owner Referral Reward
              </div>
              <p>Set the reward points issued whenever an owner referral is completed.</p>
            </div>
            <div className="config-card-input-row">
              <span className="config-card-symbol">Pts</span>
              <input
                value={ownerPoints}
                type="number"
                maxLength="10"
                onChange={(e) => setOwnerPoints(Number(e.target.value))}
              />
              <button className="btn-save" onClick={() => updateConfig("OWNER_REFERRAL_REWARD", ownerPoints)}>
                <i className="bi bi-check-lg"></i> Update
              </button>
            </div>
            <div className="config-card-pts">{ownerPoints} points per referral</div>
          </div>

          <div className="config-card config-card--user">
            <div className="config-card-text">
              <div className="config-card-label">
                <i className="bi bi-people-fill"></i>
                User Referral Reward
              </div>
              <p>Configure the reward points given when a user referral successfully converts.</p>
            </div>
            <div className="config-card-input-row">
              <span className="config-card-symbol">Pts</span>
              <input
                value={userPoints}
                type="number"
                maxLength="10"
                onChange={(e) => setUserPoints(Number(e.target.value))}
              />
              <button className="btn-save" onClick={() => updateConfig("USER_REFERRAL_REWARD", userPoints)}>
                <i className="bi bi-check-lg"></i> Update
              </button>
            </div>
            <div className="config-card-pts">{userPoints} points per referral</div>
          </div>
        </div>

        <div className="ledger-card">

          <div className="ledger-header">
            <h4>Referral Ledger</h4>
          </div>

          <div className="filter-bar">
            <div className="filter-group">
              <label>Role</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="ALL">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="USER">User</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Sort</label>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Referrer or referred…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>&nbsp;</label>
              <button
                className="btn-reset"
                onClick={() => {
                  setFilterType("ALL");
                  setStatusFilter("ALL");
                  setSearchTerm("");
                  setSortOrder("newest");
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="ref-table-wrapper">
            <table className="ref-table">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th style={{ width: 44 }}></th>
                  <th>Referrer</th>
                  <th>Role</th>
                  <th>Referrals</th>
                  <th>Total Points</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={6} cols={6} />
                ) : groupEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="ref-empty">
                      No referrals found
                    </td>
                  </tr>
                ) : (
                  groupEntries.map(([key, g], index) => {
                    const open = expanded[key];
                    const total = g.rows.reduce((s, r) => s + (r.rewardPoints || 0), 0);

                    return (
                      <>
                        <tr key={key} className={`parent-row ${open ? "open" : ""}`} onClick={() => toggle(key)}>
                          <td>{index + 1}</td>
                          <td>
                            <div className={`expand-btn ${open ? "open" : ""}`}>
                              {open ? "▲" : "▼"}
                            </div>
                          </td>
                          <td className="referrer-name">{g.name}</td>
                          <td>
                            <span className={`badge-role ${g.role === "OWNER" ? "badge-owner" : "badge-user"}`}>{g.role}</span>
                          </td>
                          <td><span className="count-chip">{g.rows.length}</span></td>
                          <td><span className="points-value">{total} pts</span></td>
                        </tr>

                        {open && (
                          <tr className="child-container">
                            <td colSpan={6}>
                              <div className="child-inner">
                                <table className="child-table">
                                  <thead>
                                    <tr>
                                      <th>Referred</th>
                                      <th>Trigger</th>
                                      <th>Status</th>
                                      <th>Points</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {g.rows.map((r) => (
                                      <tr key={r.referralId}>
                                        <td>{r.referredName}</td>
                                        <td><span className="trigger-tag">{r.trigger}</span></td>
                                        <td>
                                          {r.paid
                                            ? <span className="status-paid">✓ Issued</span>
                                            : <span className="status-pending">⏳ Pending</span>}
                                        </td>
                                        <td><span className="child-points">{r.rewardPoints} pts</span></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="ref-card-list">
            {loading ? (
              <OwnerCardSkeleton count={4} />
            ) : groupEntries.length === 0 ? (
              <div className="ref-empty">No referrals found</div>
            ) : (
              groupEntries.map(([key, g]) => {
                const open = expanded[key];
                const total = g.rows.reduce((s, r) => s + (r.rewardPoints || 0), 0);

                return (
                  <div key={key} className="ref-card">
                    <div className="ref-card-bar" />
                    <div className="ref-card-header" onClick={() => toggle(key)}>
                      <div className="ref-card-left">
                        <div className="ref-card-avatar">{getInitials(g.name)}</div>
                        <div>
                          <div className="ref-card-name">{g.name}</div>
                          <div className="ref-card-meta">
                            <span className={`badge-role ${g.role === "OWNER" ? "badge-owner" : "badge-user"}`}>{g.role}</span>
                            <span className="count-chip">{g.rows.length} referral{g.rows.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ref-card-right">
                        <div className="ref-card-pts">{total}</div>
                        <div className="ref-card-pts-label">total pts</div>
                        <div className={`expand-btn ${open ? "open" : ""}`}>{open ? "▲" : "▼"}</div>
                      </div>
                    </div>

                    {open && (
                      <div className="ref-card-children">
                        {g.rows.map((r) => (
                          <div key={r.referralId} className="ref-child-row">
                            <div>
                              <div className="ref-child-name">{r.referredName}</div>
                              <div className="ref-child-trigger">{r.trigger}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                              {r.paid
                                ? <span className="status-paid">✓ Issued</span>
                                : <span className="status-pending">⏳ Pending</span>}
                              <span className="child-points">{r.rewardPoints} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReferralDashboard;
