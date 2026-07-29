import { FaHome } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import toast from "react-hot-toast";
import "./adminReservations.css";

const formatDiscount = (offer) => {
  if (offer.offerAmount && offer.offerAmount > 0) {
    return `Rs ${offer.offerAmount}`;
  }
  if (offer.offerPercent && offer.offerPercent > 0) {
    return `${offer.offerPercent}%`;
  }
  return "-";
};

const statusClassName = (offer) => {
  if (offer.approvalStatus === "APPROVED" && offer.isPublic) return "approved";
  if (offer.approvalStatus === "APPROVED") return "pending";
  if (offer.approvalStatus === "REJECTED") return "rejected";
  return "pending";
};

const statusLabel = (offer) => {
  if (offer.approvalStatus === "APPROVED" && offer.isPublic) return "LIVE";
  if (offer.approvalStatus === "APPROVED") return "APPROVED";
  if (offer.approvalStatus === "REJECTED") return "REJECTED";
  return offer.approvalStatus || "PENDING";
};

const AdminOffers = () => {
  const [offersAmount, setOffersAmount] = useState("");
  const [pgOffers, setPgOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoadingOffers(true);
    try {
      const [amountRes, offersRes] = await Promise.all([
        api.get("/admin/offers-amount"),
        api.get("/admin/pg-offers"),
      ]);
      setOffersAmount(amountRes.data ?? "");
      setPgOffers(Array.isArray(offersRes.data) ? offersRes.data : []);
    } catch {
      setPgOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateOffersAmount = async () => {
    if (!offersAmount || Number(offersAmount) <= 0) {
      return toast.error("Please enter a valid offers amount.");
    }

    try {
      await api.put("/admin/offers-amount", {
        offersAmount: Number(offersAmount),
      });
      toast.success("Offers amount updated successfully.");
    } catch {
      toast.error("Unable to update offers amount.");
    }
  };

  const filteredOffers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pgOffers;

    return pgOffers.filter((offer) =>
      [offer.pgName, offer.ownerName, offer.ownerPhone, offer.city, offer.offerTitle]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [pgOffers, search]);

  return (
    <DashboardLayout title="Offers" subtitle="Manage global offers unlock amount and owner-added PG offers">
      <div className="admin-res-container">
        <div className="token-card">
          <div className="token-card-text">
            <h4>Global Offers Fee</h4>
            <p>Set the platform-wide offers unlock amount charged to owners</p>
          </div>

          <div className="token-input-group">
            <span className="token-symbol">₹</span>
            <input
              type="number"
              maxLength="10"
              value={offersAmount}
              placeholder="0"
              onChange={(e) => setOffersAmount(e.target.value)}
            />
            <button onClick={updateOffersAmount}>
              <i className="bi bi-check-lg me-1"></i> Update
            </button>
          </div>
        </div>

        <div className="res-filter-bar">
          <div className="res-filter-group" style={{ minWidth: "320px", flex: "1 1 320px" }}>
            <label>Search Offers</label>
            <div className="res-search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="PG / Owner / Phone / City / Offer title"
              />
            </div>
          </div>
          <button className="res-reset-btn" onClick={() => setSearch("")}>Reset</button>
        </div>

        <div className="res-count">{filteredOffers.length} owner offers found</div>

        <div className="reservation-table-wrapper">
          <table className="reservation-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>PG</th>
                <th>Owner</th>
                <th>Phone</th>
                <th>City</th>
                <th>Offer Title</th>
                <th>Discount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingOffers ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">Loading offers...</td>
                </tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">No owner-added offers found.</td>
                </tr>
              ) : (
                filteredOffers.map((offer, index) => (
                  <tr key={`${offer.pgId}-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{offer.pgName || "-"}</div>
                    </td>
                    <td>{offer.ownerName || "-"}</td>
                    <td>{offer.ownerPhone || "-"}</td>
                    <td>{offer.city || "-"}</td>
                    <td>{offer.offerTitle || "Special Offer"}</td>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>{formatDiscount(offer)}</td>
                    <td>
                      <span className={`res-status-chip ${statusClassName(offer)}`}>
                        {statusLabel(offer)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="res-card-list">
          {loadingOffers ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>Loading offers...</div>
          ) : filteredOffers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>No owner-added offers found.</div>
          ) : (
            filteredOffers.map((offer, index) => (
              <div className="res-card" key={`${offer.pgId}-${index}`}>
                <div className="res-card-bar" />
                <div className="res-card-body">
                  <div className="res-card-top">
                    <div className="res-card-pg">
                      <div className="res-pg-icon"><FaHome /></div>
                      <div>
                        <div className="res-card-pgname">{offer.pgName || "-"}</div>
                        <div className="res-card-owner">{offer.ownerName || "-"}</div>
                      </div>
                    </div>
                    <span className={`res-status-chip ${statusClassName(offer)}`}>
                      {statusLabel(offer)}
                    </span>
                  </div>

                  <div className="res-card-meta">
                    <div className="res-card-meta-item">
                      <i className="bi bi-telephone"></i> {offer.ownerPhone || "-"}
                    </div>
                    <div className="res-card-meta-item">
                      <i className="bi bi-geo-alt"></i> {offer.city || "-"}
                    </div>
                  </div>

                  <div className="res-card-resident">{offer.offerTitle || "Special Offer"}</div>

                  <div className="res-card-footer">
                    <div className="res-card-amount">{formatDiscount(offer)}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>#{index + 1}</div>
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

export default AdminOffers;
