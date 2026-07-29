import { FaInbox } from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";
import "./AdminWithdrawalDashboard.css";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { TableSkeleton, OwnerCardSkeleton } from "../public/Skeleton";

/* ── Helpers ─────────────────────────────────────────── */

const formatDate = (d) => {
  if (!d) return "—";
  if (Array.isArray(d)) {
    const [year, month, day, hour = 0, min = 0, sec = 0] = d;
    const dt = new Date(year, month - 1, day, hour, min, sec);
    return dt.toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:true });
  }
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:true });
};

const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";

/* ── Component ───────────────────────────────────────── */

const AdminWithdrawalDashboard = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [referrals, setReferrals]     = useState([]);   // for "referred by" lookup
  const [status, setStatus]           = useState("PENDING");
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState("");
  const [sortOrder, setSortOrder]     = useState("desc");

  /* ── Load withdrawals ──────────────────────────────── */
  const loadData = useCallback(async (s = status) => {
    setLoading(true);
    try {
      let url = "/admin/withdrawals";
      if (s === "PENDING")  url = "/admin/withdrawals/pending";
      if (s === "REJECTED") url = "/admin/withdrawals/rejected";
      const res = await api.get(url);
      setWithdrawals(res.data);
    } catch {
      toast.error("Failed to load withdrawals.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  /* ── Load referrals once (for referred-by lookup) ─── */
  useEffect(() => {
    api.get("/admin/referrals")
      .then((res) => setReferrals(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* Build a map: userId → referrerName (who referred this user) */
  const referredByMap = referrals.reduce((acc, r) => {
    if (r.referredUserId && r.referrerName) {
      acc[r.referredUserId] = r.referrerName;
    }
    return acc;
  }, {});

  /* ── Actions ─────────────────────────────────────────── */
  const approve = async (id) => {
    const result = await Swal.fire({ title:"Approve Withdrawal?", text:"This will allow the user to receive payment.", icon:"question", showCancelButton:true, confirmButtonText:"Yes, Approve" });
    if (!result.isConfirmed) return;
    try {
      await api.post(`/admin/withdrawals/${id}/approve`);
      toast.success("Withdrawal approved successfully.");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approval failed.");
    }
  };

  const reject = async (id) => {
    const { value: note } = await Swal.fire({
      title:"Reject Withdrawal", input:"textarea", inputLabel:"Enter rejection reason",
      inputPlaceholder:"Reason for rejection...", inputAttributes:{ maxlength:200 },
      showCancelButton:true, confirmButtonText:"Reject",
      inputValidator:(v) => { if (!v) return "Rejection reason is required"; }
    });
    if (!note) return;
    try {
      await api.post(`/admin/withdrawals/${id}/reject`, null, { params:{ note } });
      toast.success("Withdrawal rejected.");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Rejection failed.");
    }
  };

  const markPaid = async (id) => {
    const result = await Swal.fire({ title:"Mark as Paid?", text:"Confirm that the payment has been sent.", icon:"warning", showCancelButton:true, confirmButtonText:"Yes, Mark Paid" });
    if (!result.isConfirmed) return;
    try {
      await api.post(`/admin/withdrawals/${id}/paid`);
      toast.success("Withdrawal marked as paid.");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark as paid.");
    }
  };

  /* ── Filter + Sort ───────────────────────────────────── */
  const filtered = withdrawals
    .filter((w) => {
      if (status === "APPROVED") return w.status === "APPROVED";
      if (status === "PAID")     return w.status === "PAID";
      return true;
    })
    .filter((w) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (w.userName  || "").toLowerCase().includes(q) ||
        (w.userId    || "").toLowerCase().includes(q) ||
        (w.upiId     || "").toLowerCase().includes(q) ||
        String(w.amount).includes(q) ||
        String(w.points).includes(q)
      );
    })
    .sort((a, b) => {
      const parseDate = (x) => Array.isArray(x)
        ? new Date(x[0], x[1]-1, x[2], x[3]||0, x[4]||0)
        : new Date(x || 0);
      return sortOrder === "desc"
        ? parseDate(b.requestedAt) - parseDate(a.requestedAt)
        : parseDate(a.requestedAt) - parseDate(b.requestedAt);
    });

  /* ── Shared: referred-by tag ─────────────────────────── */
  const ReferredByTag = ({ userId }) => {
    const referrer = referredByMap[userId];
    if (!referrer) return null;
    return (
      <span className="referred-by-tag">
        <i className="bi bi-person-fill-add"></i>
        via {referrer}
      </span>
    );
  };

  /* ── Render ──────────────────────────────────────────── */
  const colSpan = (status === "PENDING" || status === "APPROVED") ? 8 : 7;

  return (
    <DashboardLayout
      title="Withdrawal Management"
      subtitle="Review and process user withdrawals"
    >
      <div className="withdraw-admin">

        {/* STATUS TABS */}
        <div className="withdraw-tabs">
          {["PENDING","APPROVED","REJECTED","PAID"].map((s) => (
            <button
              key={s}
              className={`tab${status === s ? " active" : ""}`}
              onClick={() => { setStatus(s); setSearch(""); }}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* FILTER BAR */}
        <div className="withdraw-filter-bar">
          <span className="filter-label">Filter</span>
          <input
            className="filter-search"
            type="text"
            placeholder="Search by user, UPI, amount…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
          {search && <button className="filter-clear" onClick={() => setSearch("")}>Clear</button>}
          <span className="filter-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* CARD WRAPPER */}
        <div className="withdraw-card">
          <div className="withdraw-card-header">
            <h3>
              {status.charAt(0) + status.slice(1).toLowerCase()} Withdrawals
            </h3>
            <span className="card-count">{filtered.length}</span>
          </div>

          {/* ══ DESKTOP TABLE ══ */}
          <div className="table-scroll-wrapper">
            <table className="withdraw-table">
              <thead>
                <tr>
                  <th>SrNo</th>
                  <th>User</th>
                  <th>Points</th>
                  <th>Amount</th>
                  <th>UPI</th>
                  <th>Requested</th>
                  <th>Status</th>
                  {(status === "PENDING" || status === "APPROVED") && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                // SKELETON 
                <TableSkeleton rows={8} cols={colSpan} />

              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>
                    <div className="empty-state">
                      <div className="empty-icon"><FaInbox /></div>
                      <p>No {status.toLowerCase()} withdrawals found.</p>
                    </div>
                  </td>
                </tr>

              ) : (
                filtered.map((w, index) => (
                  <tr key={w.id}>
                    <td><span className="srno-cell">{index + 1}</span></td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{getInitial(w.userName)}</div>
                        <div className="user-info">
                          <span className="user-name">{w.userName || w.userId}</span>
                          {/* referred-by shown only if this user was referred by someone */}
                          <ReferredByTag userId={w.userId} />
                        </div>
                      </div>
                    </td>
                    <td><span className="points-cell">{w.points} pts</span></td>
                    <td><span className="amount-cell">₹{w.amount}</span></td>
                    <td><span className="upi-cell">{w.upiId}</span></td>
                    <td><span className="date-cell">{formatDate(w.requestedAt)}</span></td>
                    <td>
                      <span className={`status-badge ${w.status}`}>
                        <span className="status-dot" />
                        {w.status}
                      </span>
                      {w.status === "REJECTED" && w.adminNote && (
                        <div className="rejection-note">
                          <span className="rejection-label">Reason:</span>{w.adminNote}
                        </div>
                      )}
                    </td>
                    {status === "PENDING" && (
                      <td>
                        <div className="actions-cell">
                          {w.status === "PENDING" ? (
                            <>
                              <button className="btn approve" onClick={() => approve(w.id)}>✓ Approve</button>
                              <button className="btn reject"  onClick={() => reject(w.id)}>✕ Reject</button>
                            </>
                          ) : <span className="no-action">—</span>}
                        </div>
                      </td>
                    )}
                    {status === "APPROVED" && (
                      <td>
                        <div className="actions-cell">
                          {w.status === "APPROVED"
                            ? <button className="btn paid" onClick={() => markPaid(w.id)}>✓ Mark Paid</button>
                            : <span className="no-action">—</span>}
                        </div>
                      </td>
                    )}
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ══ MOBILE CARDS ══ */}
          <div className="withdraw-card-list">
            {loading ? (
            <OwnerCardSkeleton count={4} />

          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FaInbox /></div>
              <p>No {status.toLowerCase()} withdrawals found.</p>
            </div>

          ) : (
            filtered.map((w, index) => (
              <div key={w.id} className="wd-card">
                <div className={`wd-card-bar ${w.status}`} />
                <div className="wd-card-body">

                  {/* user + status */}
                  <div className="wd-card-top">
                    <div className="wd-card-user">
                      <div className="user-avatar">{getInitial(w.userName)}</div>
                      <div>
                        <div className="wd-card-name">{w.userName || w.userId}</div>
                        <ReferredByTag userId={w.userId} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span className="srno-badge">#{index + 1}</span>
                      <span className={`status-badge ${w.status}`}>
                        <span className="status-dot" />{w.status}
                      </span>
                    </div>
                  </div>

                  {/* amounts */}
                  <div className="wd-card-amounts">
                    <div className="wd-card-amount-block">
                      <span className="wd-card-amount-label">Amount</span>
                      <span className="wd-card-amount-val green">₹{w.amount}</span>
                    </div>
                    <div className="wd-card-amount-block">
                      <span className="wd-card-amount-label">Points</span>
                      <span className="wd-card-amount-val">{w.points} pts</span>
                    </div>
                  </div>

                  {/* upi */}
                  <div className="wd-card-upi">
                    <i className="bi bi-phone me-1" style={{color:"#94a3b8",fontSize:11}}></i>
                    {w.upiId}
                  </div>

                  {/* meta */}
                  <div className="wd-card-meta">
                    <div className="wd-card-meta-item">
                      <i className="bi bi-calendar3"></i>{formatDate(w.requestedAt)}
                    </div>
                  </div>

                  {/* rejection note */}
                  {w.status === "REJECTED" && w.adminNote && (
                    <div className="wd-card-rejection">
                      <span className="rejection-label">Reason:</span> {w.adminNote}
                    </div>
                  )}

                  {/* actions */}
                  {status === "PENDING" && w.status === "PENDING" && (
                    <div className="wd-card-actions">
                      <button className="btn approve" onClick={() => approve(w.id)}>✓ Approve</button>
                      <button className="btn reject"  onClick={() => reject(w.id)}>✕ Reject</button>
                    </div>
                  )}
                  {status === "APPROVED" && w.status === "APPROVED" && (
                    <div className="wd-card-actions">
                      <button className="btn paid" onClick={() => markPaid(w.id)}>✓ Mark Paid</button>
                    </div>
                  )}

                </div>
              </div>
              ))
              )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminWithdrawalDashboard;