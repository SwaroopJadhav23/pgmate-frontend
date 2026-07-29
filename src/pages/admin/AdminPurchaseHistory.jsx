import { FaUnlock } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./AdminPurchaseHistory.css";
import { TableSkeleton, UniversalCardSkeleton } from "../public/Skeleton";

const AdminPurchaseHistory = () => {

  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState({});

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortDir, setSortDir] = useState("newest");
  const [loading, setLoading] = useState(true);

  /* ================= DATE FORMAT ================= */

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

  /* ================= SAFE DATE PARSER ================= */

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);

    // Handle "DD-MM-YYYY HH:mm:ss" format from backend
    if (typeof dateStr === "string" && dateStr.includes("-") && dateStr.indexOf("-") === 2) {
      const [datePart, timePart = "00:00:00"] = dateStr.split(" ");
      const [day, month, year] = datePart.split("-");
      return new Date(`${year}-${month}-${day}T${timePart}`);
    }

    return new Date(dateStr);
  };

  const formatMode = (mode) => {
    if (!mode) return "—";
    if (mode === "HARD_RESET") return "Fresh Start";
    if (mode === "FLAT_DIFFERENCE") return "Extend & Save";
    return mode;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const p = name.trim().split(" ");
    return p.length === 1
      ? p[0][0].toUpperCase()
      : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    setLoading(true);
    api.get("/purchase-history/admin")
      .then(res => {
        const data = res.data || [];
        data.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
        setHistory(data);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ================= FILTER ================= */

  let filtered = [...history];

  if (search) {
    filtered = filtered.filter(h =>
      h.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      h.ownerEmail?.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (planFilter) {
    filtered = filtered.filter(h => h.planType === planFilter);
  }

  if (typeFilter) {
    filtered = filtered.filter(h =>
      (h.transactionType || "").toUpperCase() === typeFilter
    );
  }

  /* ================= GROUP BY OWNER ================= */

  const grouped = filtered.reduce((acc, h) => {
    const key = h.ownerId;
    if (!acc[key]) {
      acc[key] = {
        ownerName: h.ownerName,
        ownerEmail: h.ownerEmail,
        rows: [],
        latestPurchaseDate: null,
      };
    }
    acc[key].rows.push(h);

    const parsedDate = parseDate(h.purchaseDate);
    if (!acc[key].latestPurchaseDate || parsedDate > acc[key].latestPurchaseDate) {
      acc[key].latestPurchaseDate = parsedDate;
    }

    return acc;
  }, {});

  /* ================= SORT GROUPED OWNERS ================= */

  const sortedGroupEntries = Object.entries(grouped).sort(([, a], [, b]) => {
    if (sortDir === "a_z") {
      return (a.ownerName || "").toLowerCase().localeCompare((b.ownerName || "").toLowerCase());
    } else if (sortDir === "oldest") {
      return a.latestPurchaseDate - b.latestPurchaseDate;
    } else {
      return b.latestPurchaseDate - a.latestPurchaseDate;
    }
  });

  /* ================= EXPAND TOGGLE ================= */

  const toggle = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  /* ================= UI ================= */

  return (
    <DashboardLayout
      title="Purchase History"
      subtitle="All subscription transactions"
    >
      <div className="card p-3 history-card">

        {/* ================= TOOLBAR ================= */}
        <div className="">
          <div className="history-left">

            <input
              className="form-control history-search"
              placeholder="Search owner..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select
              className="form-select history-filter"
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
            >
              <option value="">All Plans</option>
              <option value="FREE">FREE</option>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="PREMIUM">PREMIUM</option>
            </select>

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

            <select
              className="form-select history-filter"
              value={sortDir}
              onChange={e => setSortDir(e.target.value)}
            >
              <option value="a_z">A → Z</option>
              <option value="newest">Newest to Oldest</option>
              <option value="oldest">Oldest to Newest</option>
            </select>

          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="table-responsive history-table">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Sr No</th>
                <th></th>
                <th>Owner</th>
                <th>Email</th>
                <th>Total Purchases</th>
                <th>Total Revenue</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton rows={6} cols={6} />
              ) : sortedGroupEntries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">
                    No purchase history
                  </td>
                </tr>
              ) : (
                sortedGroupEntries.map(([key, g], index) => {

                  const open = expanded[key];
                  const total = g.rows.reduce((sum, r) => sum + (r.finalAmountPaid || 0), 0);

                  return (
                    <>
                      {/* ===== OWNER ROW ===== */}
                      <tr
                        key={key}
                        className="parent-row"
                        onClick={() => toggle(key)}
                      >
                        <td>{index + 1}</td>

                        <td>
                          <div className={`expand-btn ${open ? "open" : ""}`}>
                            {open ? "▲" : "▼"}
                          </div>
                        </td>

                        <td>{g.ownerName}</td>
                        <td>{g.ownerEmail}</td>
                        <td>{g.rows.length}</td>
                        <td className="amount">₹{total}</td>
                      </tr>

                      {/* ===== EXPANDED TABLE ===== */}
                      {open && (
                        <tr>
                          <td colSpan="6">
                            <div className="child-scroll">
                              <div className="child-inner">
                                <table className="child-table">
                                  <thead>
                                    <tr>
                                      <th>Plan</th>
                                      <th>Previous</th>
                                      <th>Transaction</th>
                                      <th>Mode</th>
                                      <th>Paid</th>
                                      <th>Wallet</th>
                                      <th>Discount</th>
                                      <th>Start</th>
                                      <th>Expiry</th>
                                      <th>Purchase Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[...g.rows]
                                      .sort((a, b) => {
                                        if (a.current) return -1;
                                        if (b.current) return 1;
                                        return new Date(b.purchaseDate) - new Date(a.purchaseDate);
                                      })
                                      .map((h, i) => {
                                        const isFeature = h.transactionType === "FEATURE_UNLOCK";
                                        const isCurrent = h.current === true;
                                        const isFree = h.planType === "FREE";

                                        return (
                                          <tr key={i}>
                                            <td>
                                              {isFeature ? (
                                                <span className="history-pill feature-pill">
                                                  <FaUnlock /> FEATURE
                                                </span>
                                              ) : (
                                                <>
                                                  <span className="history-pill">
                                                    {h.planType}
                                                  </span>
                                                  {isCurrent && (
                                                    <span className="admin-current-pill">
                                                      CURRENT
                                                    </span>
                                                  )}
                                                </>
                                              )}
                                            </td>
                                            <td>
                                              {isFeature ? "N/A" : (isFree ? "N/A" : (h.previousPlanType || "N/A"))}
                                            </td>
                                            <td>
                                              {isFeature ? "Feature Unlock" : (isFree ? "TRIAL" : h.transactionType)}
                                            </td>
                                            <td>
                                              {isFeature ? (
                                                h.featureName === "VERIFICATION" ? "PG Verification" : "Offers Enabled"
                                              ) : isFree ? (
                                                "Trial Plan"
                                              ) : (
                                                formatMode(h.upgradeMode)
                                              )}
                                            </td>
                                            <td className="amount">₹{h.finalAmountPaid}</td>
                                            <td>₹{h.walletUsedAmount}</td>
                                            <td>₹{h.discountApplied}</td>
                                            <td>{formatDate(h.planStartDate)}</td>                                            
                                            <td>{formatDate(h.planExpiryDate)}</td>
                                            <td className="date-link">{formatDate(h.purchaseDate)}</td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>
                              </div>
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

        {/* ===== MOBILE VIEW ===== */}
        <div className="history-card-list">
          {loading ? (
            <UniversalCardSkeleton count={4} />
          ) : sortedGroupEntries.length === 0 ? (
            <div>No purchase history</div>
          ) : (
            sortedGroupEntries.map(([key, g], index) => {
              const open = expanded[key];
              const total = g.rows.reduce(
                (sum, r) => sum + (r.finalAmountPaid || 0),
                0
              );

              return (
                <div key={key} className="history-card">

                  {/* HEADER */}
                  <div
                    className="history-card-header"
                    onClick={() => toggle(key)}
                  >
                    <div className="history-card-left">
                      <div className="history-srno">#{index + 1}</div>
                      <div className="history-avatar">
                        {getInitials(g.ownerName)}
                      </div>
                      <div>
                        <div className="history-name">{g.ownerName}</div>
                        <div className="history-email">{g.ownerEmail}</div>
                      </div>
                    </div>

                    <div className="history-card-right">
                      <div className="history-total">₹{total}</div>
                      <div className="expand-btn">
                        {open ? "▲" : "▼"}
                      </div>
                    </div>
                  </div>

                  {/* BODY */}
                  {open && (
                    <div className="history-body">
                      {g.rows.map((h, i) => (
                        <div key={i} className="history-item">
                          <div className="history-item-top">
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <span className="plan-badge">{h.planType}</span>
                              {h.current && (
                                <span className="admin-current-pill">CURRENT</span>
                              )}
                            </div>
                            <span className="amount">₹{h.finalAmountPaid}</span>
                          </div>
                          <div className="history-meta">{h.transactionType}</div>
                          <div className="history-date">{formatDate(h.purchaseDate)}</div>
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
    </DashboardLayout>
  );

};

export default AdminPurchaseHistory;