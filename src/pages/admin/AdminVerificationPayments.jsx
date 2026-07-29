import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import "./adminReservations.css";
import DashboardLayout from "../../layouts/DashboardLayout";
import { TableSkeleton, OwnerCardSkeleton } from "../public/Skeleton";

const formatDate = (dt) =>
  dt ? new Date(dt).toLocaleDateString("en-GB") : "-";

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
};

const FEATURE_TABS = [
  { key: "VERIFICATION", label: "Verification Transactions" },
  { key: "OFFERS", label: "Offers Transactions" },
];

const AdminVerificationPayments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("VERIFICATION");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/feature-unlock-transactions")
      .then((res) => setTransactions(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
    setSortOrder("desc");
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((payment) => {
        const query = search.toLowerCase();
        const matchesTab = payment.featureType === activeTab;
        const matchesSearch =
          payment.ownerName?.toLowerCase().includes(query) ||
          payment.ownerEmail?.toLowerCase().includes(query) ||
          payment.ownerPhone?.includes(search) ||
          payment.merchantOrderId?.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "ALL" || payment.status === statusFilter;

        const paymentDate = payment.completedAt || payment.createdAt;
        const date = paymentDate ? new Date(paymentDate) : null;
        const matchesFrom = fromDate && date ? date >= new Date(fromDate) : true;
        const matchesTo = toDate && date ? date <= new Date(toDate) : true;

        return matchesTab && matchesSearch && matchesStatus && matchesFrom && matchesTo;
      })
      .sort((a, b) => {
        const da = a.completedAt || a.createdAt ? new Date(a.completedAt || a.createdAt) : 0;
        const db = b.completedAt || b.createdAt ? new Date(b.completedAt || b.createdAt) : 0;
        return sortOrder === "desc" ? db - da : da - db;
      });
  }, [transactions, activeTab, search, statusFilter, fromDate, toDate, sortOrder]);

  const activeLabel = FEATURE_TABS.find((tab) => tab.key === activeTab)?.label || "Transactions";

  return (
    <DashboardLayout
      title="Feature Transactions"
      subtitle="Track verification and offers unlock payment history"
    >
      <div className="admin-res-container">
        <div className="status-tabs" style={{ marginBottom: 24 }}>
          {FEATURE_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`status-btn ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="res-filter-bar">
          <div className="res-filter-group">
            <label>Search</label>
            <div className="res-search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                className="form-control"
                placeholder="Owner / Email / Phone / Order ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="res-filter-group">
            <label>Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="REDIRECT_REQUIRED">REDIRECT REQUIRED</option>
              <option value="PAID">PAID</option>
            </select>
          </div>

          <div className="res-filter-group">
            <label>From</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="res-filter-group">
            <label>To</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="res-filter-group">
            <label>Sort By</label>
            <select
              className="form-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <button className="res-reset-btn" onClick={resetFilters}>
            Reset
          </button>
        </div>

        <p className="res-count">
          {filteredTransactions.length} {activeLabel.toLowerCase()}
          {filteredTransactions.length !== 1 ? " entries" : " entry"} found
        </p>

        <div className="reservation-table-wrapper">
          <table className="reservation-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Gateway</th>
                <th>Order ID</th>
                <th>Paid On</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton rows={8} cols={9} />
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty">
                    No {activeLabel.toLowerCase()} found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((payment, i) => (
                  <tr key={payment.id || payment.merchantOrderId || i}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{payment.ownerName}</td>
                    <td style={{ color: "#64748b" }}>{payment.ownerEmail}</td>
                    <td style={{ color: "#64748b" }}>{payment.ownerPhone}</td>
                    <td>
                      <span className="res-amount">Rs {formatAmount(payment.amount)}</span>
                    </td>
                    <td>
                      <span className={`status ${payment.status || "PENDING"}`}>
                        {payment.status || "PENDING"}
                      </span>
                    </td>
                    <td style={{ color: "#64748b" }}>{payment.gatewayState || "-"}</td>
                    <td style={{ color: "#0f172a", fontWeight: 500 }}>{payment.merchantOrderId || "-"}</td>
                    <td style={{ color: "#64748b" }}>
                      {formatDate(payment.completedAt || payment.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="res-card-list">
          {loading ? (
            <OwnerCardSkeleton count={4} />
          ) : filteredTransactions.length === 0 ? (
            <div className="empty">No {activeLabel.toLowerCase()} found</div>
          ) : (
            filteredTransactions.map((payment, i) => (
              <div key={payment.id || payment.merchantOrderId || i} className="res-card">
                <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                  Sr. No. {i + 1}
                </div>

                <div className={`res-card-bar ${payment.status || "PENDING"}`} />

                <div className="res-card-body">
                  <div className="res-card-top">
                    <div className="res-card-pg">
                      <div className="res-pg-icon"><i className="bi bi-person-fill"></i></div>
                      <div>
                        <div className="res-card-pgname">{payment.ownerName}</div>
                        <div className="res-card-owner">{payment.ownerEmail}</div>
                      </div>
                    </div>
                    <span className={`status ${payment.status || "PENDING"}`}>
                      {payment.status || "PENDING"}
                    </span>
                  </div>

                  <div className="res-card-resident">{payment.ownerPhone}</div>
                  <div className="res-card-phone">{payment.merchantOrderId || "-"}</div>

                  <div className="res-card-meta">
                    <div className="res-card-meta-item">
                      <i className="bi bi-calendar3"></i>
                      {formatDate(payment.completedAt || payment.createdAt)}
                    </div>
                    <div className="res-card-meta-item">
                      <i className="bi bi-credit-card"></i>
                      {payment.gatewayState || "-"}
                    </div>
                  </div>

                  <div className="res-card-footer">
                    <div className="res-card-amount">Rs {formatAmount(payment.amount)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminVerificationPayments;
