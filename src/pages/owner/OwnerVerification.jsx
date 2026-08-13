import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import toast from "react-hot-toast";
import "./OwnerVerification.css";
import FeaturePageLock from "../../components/FeaturePageLock";
import FeatureUnlockModal from "../../components/FeatureUnlockModal";
const OwnerVerification = () => {
  const [pgs, setPgs] = useState([]);
  const [records, setRecords] = useState([]);
  const stats = {
    total: records.length,
    approved: records.filter(r => r.status === "APPROVED").length,
    pending: records.filter(r => r.status === "PENDING").length,
    rejected: records.filter(r => r.status === "REJECTED").length,
  };

  const [selectedPg, setSelectedPg] = useState("");

  const [identityFile, setIdentityFile] = useState(null);
  const [propertyFile, setPropertyFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [buildingPhoto, setBuildingPhoto] = useState(null);

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [unlockModal, setUnlockModal] = useState(false);
  const [planType, setPlanType] = useState(null);
  const [tableRefreshing, setTableRefreshing] = useState(false);
  const [locked, setLocked] = useState(false);
  const [planStartDate, setPlanStartDate] = useState(null);
  const [planExpiryDate, setPlanExpiryDate] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [pgRes, res] = await Promise.all([
        api.get("/owner/pgs"),
        api.get("/owner/my-verifications"),
      ]);

      setPgs(pgRes.data || []);
      setRecords(res.data || []);
    };

    load();
  }, []);

  useEffect(() => {

    api.get("/owner/subscription").then(async res => {
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

        if (!unlock.data.verificationUnlocked) {
          setLocked(true);
        }
      }

    });

  }, []);
  const applyVerification = async () => {
    if (!selectedPg)
      return toast("Please select your PG.", { icon: "ℹ️" });

    if (!identityFile || !propertyFile || !buildingPhoto)
      return toast("Identity, Property proof & Building photo are required.", { icon: "⚠️" });

    if (!agreed)
      return toast("Please confirm declaration.", { icon: "⚠️" });

    const formData = new FormData();
    formData.append("identityProof", identityFile);
    formData.append("propertyProof", propertyFile);
    formData.append("buildingPhoto", buildingPhoto);
    if (licenseFile) formData.append("licenseProof", licenseFile);
    const alreadyApplied = records.some(r =>
      r.pgId === selectedPg &&
      (r.status === "PENDING" || r.status === "APPROVED")
    );

    if (alreadyApplied) {
      return toast("Verification already pending or approved for this PG.", { icon: "⚠️" });
    }

    try {
      setLoading(true);
      await api.post(`/owner/pg/${selectedPg}/apply-verification`, formData);

      toast.success("Your verification request has been sent. We'll review it shortly.");

      // BUG-04 FIX: show spinner on table while it reloads
      setTableRefreshing(true);
      const updated = await api.get("/owner/my-verifications");
      setRecords(updated.data || []);
      setTableRefreshing(false);

      setShowModal(false);
    } catch (err) {

      const message =
        err.response?.data?.message || "Something went wrong";

      if (message.includes("Verification locked")) {

        setUnlockModal(true);
        return;

      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="PG Verification"
      subtitle="Get your PG verified & increase trust"
    >
      {/* 🔹 STATS CARDS */}
      <div className="booking-stats-grid">

        {/* TOTAL */}
        <div className="booking-stat-card total">
          <div className="icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="res-stat-icon" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div>
            <div className="value">{stats.total}</div>
            <div className="label">Applications</div>
          </div>
        </div>

        {/* APPROVED */}
        <div className="booking-stat-card monthly">
          <div className="icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="res-stat-icon" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="value">{stats.approved}</div>
            <div className="label">Approved</div>
          </div>
        </div>

        {/* PENDING */}
        <div className="booking-stat-card daily">
          <div className="icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="res-stat-icon" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="6" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <div className="value">{stats.pending}</div>
            <div className="label">Pending</div>
          </div>
        </div>

        {/* REJECTED */}
        <div className="booking-stat-card rejected">
          <div className="icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" className="res-stat-icon" strokeWidth="2">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </div>
          <div>
            <div className="value">{stats.rejected}</div>
            <div className="label">Rejected</div>
          </div>
        </div>

      </div>

      <div className="owner-verification-page">

        <div className="page-content-wrapper">

          <div className={locked ? "page-locked" : ""}>

            {/* ================= STEPS ================= */}
            <section className="steps-section">

              <div className="steps-header">
                <h3 className="sec-title">How Verification Works</h3>

                <button
                  className="apply-main-btn"
                  onClick={async () => {

                    try {

                      if (!planType) return;

                      if (planType === "FREE") {
                        setUnlockModal(true);
                        return;
                      }

                      if (planType === "BASIC") {
                        const unlock = await api.get("/owner/unlock/status");

                        if (!unlock.data.verificationUnlocked) {
                          setUnlockModal(true);
                          return;
                        }
                      }

                      setShowModal(true);

                    } catch (err) {
                      console.error(err);
                    }

                  }}
                >
                  Apply for Verification
                </button>
              </div>

              <div className="steps-grid">

                <StepCard
                  icon="bi-cloud-upload"
                  number="01"
                  title="Upload Documents"
                  text="Upload identity proof, property proof & building photo."
                />

                <StepCard
                  icon="bi-shield-check"
                  number="02"
                  title="Admin Review"
                  text="Admin verifies authenticity & ownership."
                />

                <StepCard
                  icon="bi-patch-check"
                  number="03"
                  title="Approval"
                  text="Once approved, your PG gets Verified Badge."
                />

                <StepCard
                  icon="bi-graph-up-arrow"
                  number="04"
                  title="More Bookings"
                  text="Verified PGs gain higher trust & visibility."
                />

              </div>
            </section>

            {/* ================= HISTORY ================= */}
            <section className="history-card">

              <h4>
                Verification History
                {tableRefreshing && (
                  <span className="table-refresh-badge">
                    <span className="refresh-spinner" /> Updating...
                  </span>
                )}
              </h4>

              <div className="table-scroll owner-mobile-card-table">
                {/* DESKTOP TABLE */}
<div className="table-scroll verify-desktop-table">
  <table className="modern-table">
    <thead>
      <tr>
        <th>PG</th>
        <th>Status</th>
        <th>Applied</th>
        <th>Reviewed</th>
        <th>Reason</th>
      </tr>
    </thead>

    <tbody>
      {records.map((rec) => (
        <tr key={rec.id}>
          <td>{rec.pgName}</td>
          <td>
            <span className={`status-pill ${rec.status}`}>
              {rec.status}
            </span>
          </td>
          <td>{rec.appliedAt ? new Date(rec.appliedAt).toLocaleDateString() : "N/A"}</td>
          <td>{rec.reviewedAt ? new Date(rec.reviewedAt).toLocaleDateString() : "N/A"}</td>
          <td>{rec.status === "REJECTED" ? rec.rejectionReason : "N/A"}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{/* MOBILE CARDS */}
<div className="verify-card-list">
  {records.length === 0 ? (
    <p className="text-center">No verification records</p>
  ) : (
    records.map((rec) => (
      <div className="verify-history-card" key={rec.id}>

        <div className="verify-card-header">
          <h5>{rec.pgName}</h5>
          <span className={`status-pill ${rec.status}`}>
            {rec.status}
          </span>
        </div>

        <div className="verify-card-body">
          <div>
            <span>Applied</span>
            <p>{rec.appliedAt ? new Date(rec.appliedAt).toLocaleDateString() : "N/A"}</p>
          </div>

          <div>
            <span>Reviewed</span>
            <p>{rec.reviewedAt ? new Date(rec.reviewedAt).toLocaleDateString() : "N/A"}</p>
          </div>

          {rec.status === "REJECTED" && (
            <div className="verify-reason">
              <span>Reason</span>
              <p>{rec.rejectionReason || "N/A"}</p>
            </div>
          )}
        </div>

      </div>
    ))
  )}
</div>
              </div>
            </section>

            {/* ================= APPLY MODAL ================= */}
            {showModal && (
              <div
                className="modal-backdrop-custom"
                onClick={() => setShowModal(false)}
              >
                <div
                  className="modal-box verification-modal"
                  onClick={(e) => e.stopPropagation()}
                >

                  {/* HEADER */}
                  <div className="modal-header-custom">
                    <h4>Submit Verification</h4>
                    <button
                      className="modal-close-btn"
                      onClick={() => setShowModal(false)}
                    >
                      ✕
                    </button>
                  </div>

                  {/* BODY */}
                  <div className="modal-body">

                    <label>Select PG</label>
                    <select
                      className="form-control mb-3"
                      value={selectedPg}
                      onChange={(e) => setSelectedPg(e.target.value)}
                    >
                      <option value="">Select PG</option>

                      {pgs.map((pg) => {
                        const existing = records.find(r => r.pgId === pg.id);

                        const disabled =
                          existing &&
                          (existing.status === "PENDING" ||
                            existing.status === "APPROVED");

                        return (
                          <option
                            key={pg.id}
                            value={pg.id}
                            disabled={disabled}
                          >
                            {pg.name}
                            {disabled ? " (Already Applied)" : ""}
                          </option>
                        );
                      })}
                    </select>

                    <div className="row g-3">

                      <div className="col-md-6">
                        <label>Identity Proof *</label>
                        <input
                          type="file"
                          className="form-control"
                          onChange={(e) => setIdentityFile(e.target.files[0])}
                        />
                      </div>

                      <div className="col-md-6">
                        <label>Property Proof *</label>
                        <input
                          type="file"
                          className="form-control"
                          onChange={(e) => setPropertyFile(e.target.files[0])}
                        />
                      </div>

                      <div className="col-md-6">
                        <label>Business License</label>
                        <input
                          type="file"
                          className="form-control"
                          onChange={(e) => setLicenseFile(e.target.files[0])}
                        />
                      </div>

                      <div className="col-md-6">
                        <label>Building Photo *</label>
                        <input
                          type="file"
                          className="form-control"
                          onChange={(e) => setBuildingPhoto(e.target.files[0])}
                        />
                      </div>

                    </div>

                    <div className="verification-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                      />
                      <label className="form-check-label">
                        I confirm documents are genuine.
                      </label>
                    </div>

                  </div>

                  {/* FOOTER */}
                  <div className="modal-actions">

                    <button
                      className="modal-btn cancel"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>

                    <button
                      className="modal-btn primary"
                      onClick={applyVerification}
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Submit"}
                    </button>

                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

      </div>
      <FeatureUnlockModal
        feature="VERIFICATION"
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

          if (unlock.data.verificationUnlocked) {
            setLocked(false);
            setShowModal(true);
          }
        }}
      />
      {locked && (
        <FeaturePageLock
          feature="Verification"
          onUnlock={() => {
            setLocked(false);
            setUnlockModal(true);
          }}
        />
      )}
    </DashboardLayout>
  );
};

const StepCard = ({ icon, number, title, text }) => (
  <div className="step-card">
    <div className="step-top">
      <span className="step-number">{number}</span>
      <i className={`bi ${icon} step-icon`}></i>
    </div>
    <h5>{title}</h5>
    <p>{text}</p>
  </div>
);

export default OwnerVerification;
