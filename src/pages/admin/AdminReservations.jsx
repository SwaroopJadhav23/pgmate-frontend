import { FaGift, FaHome } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import "./adminReservations.css";
import DashboardLayout from "../../layouts/DashboardLayout";
import { TableSkeleton, OwnerCardSkeleton } from "../public/Skeleton";
import Swal from "sweetalert2";

const formatDate = (dt) =>
  dt ? new Date(dt).toLocaleDateString("en-GB") : "—";

const AdminReservations = () => {
  const [amount, setAmount] = useState("");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    api
      .get("/admin/reservation-amount")
      .then((res) => setAmount(res.data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/reservations")
      .then((res) => setReservations(res.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const updateAmount = async () => {
    if (!amount || amount <= 0) {
      return Swal.fire({
        icon: "warning",
        title: "Invalid Amount",
        text: "Please enter a valid reservation amount",
      });
    }

    try {
      await api.put("/admin/reservation-amount", {
        reservationAmount: Number(amount),
      });

      Swal.fire({
        icon: "success",
        title: <>Updated <FaGift /></>,
        text: "Reservation amount updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Something went wrong while updating",
      });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setModeFilter("ALL");
    setFromDate("");
    setToDate("");
    setSortOrder("desc");
  };

  const filteredReservations = useMemo(() => {
    return reservations
      .filter((r) => {
        const matchesSearch =
          r.pgName?.toLowerCase().includes(search.toLowerCase()) ||
          r.residentName?.toLowerCase().includes(search.toLowerCase()) ||
          r.residentPhone?.includes(search);

        const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
        const matchesMode =
          modeFilter === "ALL" || r.reservationPaymentMode === modeFilter;

        const date = r.reservationDate ? new Date(r.reservationDate) : null;
        const matchesFrom = fromDate && date ? date >= new Date(fromDate) : true;
        const matchesTo = toDate && date ? date <= new Date(toDate) : true;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesMode &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort((a, b) => {
        const da = a.reservationDate ? new Date(a.reservationDate) : 0;
        const db = b.reservationDate ? new Date(b.reservationDate) : 0;
        return sortOrder === "desc" ? db - da : da - db;
      });
  }, [reservations, search, statusFilter, modeFilter, fromDate, toDate, sortOrder]);

  return (
    <DashboardLayout title="Reservation Management" subtitle="Manage global reservation token and view all reservations">
      <div className="admin-res-container">

        <div className="token-card">
          <div className="token-card-text">
            <h4>Global Reservation Token</h4>
            <p>Set the platform-wide reservation fee charged to Tenants</p>
          </div>

          <div className="token-input-group">
            <span className="token-symbol">₹</span>
            <input
              type="number"
              maxLength="10"
              value={amount}
              placeholder="0"
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={updateAmount}>
              <i className="bi bi-check-lg me-1"></i> Update
            </button>
          </div>
        </div>

        <div className="res-filter-mobile-toggle">
          <div className="res-search-wrapper" style={{ flex: 1 }}>
            <i className="bi bi-search search-icon"></i>
            <input
              className="form-control"
              placeholder="Search name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="res-filter-toggle-btn" onClick={() => setFiltersOpen(o => !o)}>
            <i className="bi bi-sliders"></i> Filters
          </button>
        </div>

        <div className={`res-filter-bar ${filtersOpen ? "open" : ""}`}>
          <div className="res-filter-group res-filter-search-desktop">
            <label>Search</label>
            <div className="res-search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                className="form-control"
                placeholder="PG / Resident / Phone"
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
              <option value="RESERVED">RESERVED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="res-filter-group">
            <label>Payment Mode</label>
            <select
              className="form-select"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="ALL">All Modes</option>
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
              <option value="CARD">CARD</option>
              <option value="CHEQUE">CHEQUE</option>
              <option value="WALLET">WALLET</option>
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
          {filteredReservations.length} reservation
          {filteredReservations.length !== 1 ? "s" : ""} found
        </p>

        <div className="reservation-table-wrapper">
          <table className="reservation-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>PG</th>
                <th>Owner</th>
                <th>Tenant</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Reservation Date</th>
                <th>Check-in</th>
                <th>Proof</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton rows={8} cols={11} />
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="11" className="empty">
                    No reservations found
                  </td>
                </tr>
              ) : (
                filteredReservations.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>

                    <td>
                      <div className="res-pg-cell">
                        <div className="res-pg-icon"><FaHome /></div>
                        <span className="res-pg-name">{r.pgName}</span>
                      </div>
                    </td>

                    <td style={{ color: "#64748b" }}>{r.ownerName}</td>
                    <td style={{ fontWeight: 500 }}>{r.residentName}</td>
                    <td style={{ color: "#64748b" }}>{r.residentPhone}</td>

                    <td>
                      <span className="res-amount">
                        ₹{r.reservationAmount}
                      </span>
                    </td>

                    <td>
                      <span className="mode-badge">
                        {r.reservationPaymentMode}
                      </span>
                    </td>

                    <td style={{ color: "#64748b" }}>
                      {formatDate(r.reservationDate)}
                    </td>

                    <td style={{ color: "#64748b" }}>
                      {formatDate(r.checkinDate)}
                    </td>

                    <td>
                      {r.reservationPaymentProofUrl ? (
                        <button
                          className="proof-link-btn"
                          onClick={() =>
                            setPreviewUrl(r.reservationPaymentProofUrl)
                          }
                        >
                          <i className="bi bi-file-earmark-text"></i> View
                        </button>
                      ) : (
                        <span style={{ color: "#cbd5e1" }}>—</span>
                      )}
                    </td>

                    <td>
                      <span className={`status ${r.status}`}>
                        {r.status}
                      </span>
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
          ) : filteredReservations.length === 0 ? (
            <div className="empty">No reservations found</div>
          ) : (
            filteredReservations.map((r, i) => (
              <div key={i} className="res-card">

                <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                  Sr. No. {i + 1}
                </div>

                <div className={`res-card-bar ${r.status}`} />

                <div className="res-card-body">

                  <div className="res-card-top">
                    <div className="res-card-pg">
                      <div className="res-pg-icon"><FaHome /></div>
                      <div>
                        <div className="res-card-pgname">{r.pgName}</div>
                        <div className="res-card-owner">{r.ownerName}</div>
                      </div>
                    </div>
                    <span className={`status ${r.status}`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="res-card-resident">{r.residentName}</div>
                  <div className="res-card-phone">{r.residentPhone}</div>

                  <div className="res-card-meta">
                    <div className="res-card-meta-item">
                      <i className="bi bi-calendar3"></i>
                      {formatDate(r.reservationDate)}
                    </div>

                    <div className="res-card-meta-item">
                      <i className="bi bi-calendar-check"></i>
                      {formatDate(r.checkinDate)}
                    </div>

                    <div className="res-card-meta-item">
                      <i className="bi bi-credit-card"></i>
                      {r.reservationPaymentMode}
                    </div>
                  </div>

                  <div className="res-card-footer">
                    <div className="res-card-amount">
                      ₹{r.reservationAmount}
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {r.reservationPaymentProofUrl && (
                        <button
                          className="proof-link-btn"
                          onClick={() =>
                            setPreviewUrl(r.reservationPaymentProofUrl)
                          }
                        >
                          <i className="bi bi-file-earmark-text"></i> Proof
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {previewUrl && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="modal-box proof-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="proof-modal-header">
              <h4>Payment Proof</h4>
              <button
                className="modal-close-btn"
                onClick={() => setPreviewUrl(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="proof-modal-body">
              {previewUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewUrl}
                  title="Proof"
                  className="proof-frame"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Proof"
                  className="proof-image"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminReservations;