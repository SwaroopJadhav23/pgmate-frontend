import { useEffect, useState } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./OfferManager.css";
import FeatureUnlockModal from "../../components/FeatureUnlockModal";
import FeaturePageLock from "../../components/FeaturePageLock";
import { TableSkeleton } from "../public/Skeleton";

const OfferManager = () => {
  const [pgs, setPgs] = useState([]);
  const [selectedPg, setSelectedPg] = useState("");
  const [selectedPgData, setSelectedPgData] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedOffers, setSelectedOffers] = useState([]);
  const [unlockModal, setUnlockModal] = useState(false);
  const [planType, setPlanType] = useState(null);
  const [locked, setLocked] = useState(false);
  const [planStartDate, setPlanStartDate] = useState(null);
  const [planExpiryDate, setPlanExpiryDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [offerForm, setOfferForm] = useState({
    offerTitle: "",
    offerPercent: "",
    offerType: "",
  });

  /* ================= LOAD PGs ================= */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/owner/pgs");
        setPgs(res.data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const pg = pgs.find((p) => p.id === selectedPg);
    setSelectedPgData(pg || null);
  }, [selectedPg, pgs]);

  const reloadPGs = async () => {
    const res = await api.get("/owner/pgs");
    setPgs(res.data);
  };

  useEffect(() => {
    api.get("/owner/subscription").then(async (res) => {
      const plan = res.data.planType;
      setPlanType(plan);
      setPlanStartDate(res.data.startDate || null);
      setPlanExpiryDate(res.data.expiryDate || null);

      if (plan === "FREE") {
        setLocked(true);
        return;
      }

      if (plan === "BASIC") {
        const unlock = await api.get("/owner/unlock/status");

        if (!unlock.data.offersUnlocked) {
          setLocked(true);
        }
      }
    });
  }, []);

  /* ================= SAVE OFFER ================= */
  const saveOffer = async () => {
    if (!selectedPg) {
      toast("Please select a PG first.", { icon: "ℹ️" });
      return;
    }

    if (!offerForm.offerTitle.trim()) {
      toast("Enter offer title.", { icon: "ℹ️" });
      return;
    }

    const percent = Number(offerForm.offerPercent);

    if (!percent || percent <= 0 || percent > 100) {
      toast("Offer % must be between 1 and 100.", { icon: "⚠️" });
      return;
    }
    if (!offerForm.offerType) {
      toast("Please select offer type.", { icon: "ℹ️" });
      return;
    }

    setSaving(true);
    try {
      if (selectedPg === "ALL") {
        await api.put("/owner/pg/offer/all", offerForm);
      } else {
        await api.put(`/owner/pg/${selectedPg}/offer`, offerForm);
      }

      toast.success("Offer saved!");
      await reloadPGs();
      setShowModal(false);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Something went wrong";

      if (message.includes("Offers locked")) {
        setUnlockModal(true);
        return;
      }

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE OFFER ================= */
  const deleteOffer = async (pgId) => {
    if (pgId === "ALL") {
      toast("Delete individual offers manually.", { icon: "ℹ️" });
      return;
    }

    const ok = await Swal.fire({
      title: "Delete offer?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!ok.isConfirmed) return;

    await api.delete(`/owner/pg/${pgId}/offer`);
    toast.success("Offer removed.");
    await reloadPGs();
  };

  const toggleSelect = (pgId) => {
    setSelectedOffers((prev) =>
      prev.includes(pgId) ? prev.filter((id) => id !== pgId) : [...prev, pgId]
    );
  };

  const deleteSelectedOffers = async () => {
    if (selectedOffers.length === 0) {
      toast("Please select at least one offer.", { icon: "ℹ️" });
      return;
    }

    const confirm = await Swal.fire({
      title: "Delete selected offers?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.post("/owner/pg/offers/delete-bulk", selectedOffers);

      toast.success("Selected offers removed.");

      setSelectedOffers([]);
      await reloadPGs();
    } catch (err) {
      toast.error("Failed to delete offers.");
    }
  };

  const offeredPGs = pgs.filter((pg) => pg.offerPercent && pg.offerPercent > 0);

  return (
    <DashboardLayout title="Offer Manager" subtitle="Manage PG offers">
      <div className="offer-page-wrapper">
        <div className="page-content-wrapper">
          <div className={locked ? "page-locked" : ""}>

            {/* FILTER BAR */}
            <div className="offer-filter-bar">
              <select
                className="form-control offer-select-pg"
                value={selectedPg}
                onChange={(e) => setSelectedPg(e.target.value)}
              >
                <option value="">Select PG</option>
                <option value="ALL">Apply to All PGs</option>
                {pgs.map((pg) => (
                  <option key={pg.id} value={pg.id}>
                    {pg.name}
                  </option>
                ))}
              </select>

              <button
                className="add-room-btn"
                disabled={!selectedPg}
                onClick={async () => {
                  try {
                    if (!planType) return;

                    if (planType === "FREE") {
                      setUnlockModal(true);
                      return;
                    }

                    if (planType === "BASIC") {
                      const unlock = await api.get("/owner/unlock/status");

                      if (!unlock.data.offersUnlocked) {
                        setUnlockModal(true);
                        return;
                      }
                    }

                    setOfferForm({
                      offerTitle: "",
                      offerPercent: "",
                      offerType: "",
                    });

                    setIsEdit(false);
                    setShowModal(true);
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                <i className="bi bi-plus-lg me-1"></i> Apply Offer
              </button>
            </div>

            {/* OFFER TABLE */}
            <div className="table-responsive-x owner-mobile-card-table">
              {selectedOffers.length > 0 && (
                <div className="d-flex justify-content-end mb-3">
                  <button
                    className="btn btn-sm offer-delete-btn"
                    onClick={deleteSelectedOffers}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete Selected ({selectedOffers.length})
                  </button>
                </div>
              )}

              {/* ── TABLE ── */}
              <table className="table table-bordered offer-table om-offer-table">
                <thead>
                  <tr>
                    <th>PG Name</th>
                    <th>Offer Title</th>
                    <th>Discount %</th>
                    <th>Discount</th>
                    <th width="200">Actions</th>
                    <th width="90" className="text-center fw-semibold text-muted">
                      <div className="d-flex flex-column align-items-center">
                        <span style={{ fontSize: "11px", fontWeight: "600" }}>Select</span>
                        <input
                          type="checkbox"
                          className="form-check-input mt-1"
                          checked={
                            offeredPGs.length > 0 &&
                            selectedOffers.length === offeredPGs.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOffers(offeredPGs.map((pg) => pg.id));
                            } else {
                              setSelectedOffers([]);
                            }
                          }}
                        />
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <TableSkeleton rows={6} cols={6} />
                  ) : offeredPGs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        No offers applied yet.
                      </td>
                    </tr>
                  ) : (
                    offeredPGs.map((pg) => (
                      <tr key={pg.id} className="om-table-row">

                        {/* ── MOBILE CARD CELL (hidden on desktop) ── */}
                        <td colSpan="6" className="om-card-cell">
                          <div className="om-card">

                            {/* Card Header */}
                            <div className="om-card-header">
                              <span className="om-card-pg-name">{pg.name}</span>
                              <span className="om-card-badge">{pg.offerPercent}% OFF</span>
                            </div>

                            {/* Card Body */}
                            <div className="om-card-body">
                              <div className="om-card-row">
                                <span className="om-card-label">Offer Title</span>
                                <span className="om-card-value">{pg.offerTitle}</span>
                              </div>
                              <div className="om-card-row">
                                <span className="om-card-label">Type</span>
                                <span className="om-card-value">
                                  {pg.offerType === "NO_PRICE_CHANGE"
                                    ? "Badge Only (No price change)"
                                    : "Discount on room rent"}
                                </span>
                              </div>
                            </div>

                            {/* Card Footer */}
                            <div className="om-card-footer">
                              <div className="om-card-actions">
                                <button
                                  className="btn btn-sm offer-edit-btn"
                                  onClick={() => {
                                    setSelectedPg(pg.id);
                                    setOfferForm({
                                      offerTitle: pg.offerTitle,
                                      offerPercent: pg.offerPercent,
                                      offerType: pg.offerType || "",
                                    });
                                    setIsEdit(true);
                                    setShowModal(true);
                                  }}
                                >
                                  <i className="bi bi-pencil-square me-1"></i> Edit
                                </button>
                                <button
                                  className="btn btn-sm offer-delete-btn"
                                  onClick={() => deleteOffer(pg.id)}
                                >
                                  <i className="bi bi-trash me-1"></i> Delete
                                </button>
                              </div>
                              <label className="om-card-select-label">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={selectedOffers.includes(pg.id)}
                                  onChange={() => toggleSelect(pg.id)}
                                />
                                <span>Select</span>
                              </label>
                            </div>

                          </div>
                        </td>

                        {/* ── DESKTOP CELLS (hidden on mobile) ── */}
                        <td data-label="PG Name" className="om-desktop-cell" data-card-primary>
                          {pg.name}
                        </td>
                        <td data-label="Offer Title" className="om-desktop-cell">
                          {pg.offerTitle}
                        </td>
                        <td data-label="Discount %" className="om-desktop-cell">
                          {pg.offerPercent}%
                        </td>
                        <td data-label="Discount" className="om-desktop-cell">
                          {pg.offerType === "NO_PRICE_CHANGE"
                            ? `${pg.offerPercent}% OFF (No price change)`
                            : `${pg.offerPercent}% OFF on room rent`}
                        </td>
                        <td
                          data-label="Actions"
                          data-card-actions
                          className="om-desktop-cell offer-actions"
                        >
                          <button
                            className="btn btn-sm offer-edit-btn"
                            onClick={() => {
                              setSelectedPg(pg.id);
                              setOfferForm({
                                offerTitle: pg.offerTitle,
                                offerPercent: pg.offerPercent,
                                offerType: pg.offerType || "",
                              });
                              setIsEdit(true);
                              setShowModal(true);
                            }}
                          >
                            <i className="bi bi-pencil-square me-1"></i> Edit
                          </button>
                          <button
                            className="btn btn-sm offer-delete-btn"
                            onClick={() => deleteOffer(pg.id)}
                          >
                            <i className="bi bi-trash me-1"></i> Delete
                          </button>
                        </td>
                        <td className="om-desktop-cell text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedOffers.includes(pg.id)}
                            onChange={() => toggleSelect(pg.id)}
                          />
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* OFFER MODAL */}
            {showModal && (
              <div className="modal-backdrop-custom">
                <div className="modal-box offer-modal">
                  <div className="offer-modal-header">
                    <h5 className="offer-modal-title">
                      <i className="bi bi-tag-fill me-2 text-indigo"></i>
                      {isEdit ? "Edit Offer" : "Apply Offer"}
                    </h5>
                    <button
                      className="offer-modal-close"
                      onClick={() => setShowModal(false)}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  {selectedPg === "ALL" ? (
                    <p className="offer-modal-subtitle">
                      Target: <span className="pg-badge-tag">All PGs</span>
                    </p>
                  ) : (
                    selectedPgData && (
                      <p className="offer-modal-subtitle">
                        Target: <span className="pg-badge-tag">{selectedPgData.name}</span>
                      </p>
                    )
                  )}

                  <div className="offer-form-group">
                    <label className="offer-form-label">
                      Offer Title <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control offer-form-input"
                      placeholder="e.g. Summer Special Offer"
                      value={offerForm.offerTitle}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          offerTitle: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="offer-form-group">
                    <label className="offer-form-label">
                      Discount Percentage (%) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control offer-form-input"
                      placeholder="Enter percentage (1-100)"
                      min="1"
                      max="100"
                      value={offerForm.offerPercent}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          offerPercent: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="offer-form-group">
                    <label className="offer-form-label">
                      Offer Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-control offer-form-select"
                      value={offerForm.offerType}
                      onChange={(e) =>
                        setOfferForm({
                          ...offerForm,
                          offerType: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Offer Type</option>
                      <option value="DISCOUNT">Discount (Reduce Room Rent)</option>
                      <option value="NO_PRICE_CHANGE">
                        Badge Only (No Price Change)
                      </option>
                    </select>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="modal-btn cancel"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="modal-btn primary"
                      onClick={saveOffer}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="so-spinner" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2-circle me-1"></i> Save Offer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <FeatureUnlockModal
        feature="OFFERS"
        planType={planType || "FREE"}
        show={unlockModal}
        planStartDate={planStartDate}
        planExpiryDate={planExpiryDate}
        onClose={() => {
          setUnlockModal(false);
          setLocked(true);
        }}
        onSuccess={async () => {
          setUnlockModal(false);

          const unlock = await api.get("/owner/unlock/status");

          if (unlock.data.offersUnlocked) {
            setLocked(false);
            reloadPGs();
          }
        }}
      />

      {locked && (
        <FeaturePageLock
          feature="Offers"
          onUnlock={() => {
            setLocked(false);
            setUnlockModal(true);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default OfferManager;