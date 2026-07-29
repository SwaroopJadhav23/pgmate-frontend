import { useEffect, useState } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import toast from "react-hot-toast";

import { TableSkeleton } from "../public/Skeleton";
import "./OwnerSponsorshipCard.css"

const OwnerSponsorship = () => {

  const [pgs, setPgs] = useState([]);

  useEffect(() => {
    const el = document.querySelector(".content");
    if (el) {
      el.style.overflowX = "visible";
      return () => { el.style.overflowX = ""; };
    }
  }, []);

  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [selectedPg, setSelectedPg] = useState("");
  const [note, setNote] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);

  const reapplyBtnStyle = {
    all: "unset",
    display: "inline-block",
    padding: "6px 14px",
    fontSize: "13px",
    fontWeight: "600",
    borderRadius: "999px",
    border: "1.5px solid #a78bfa",
    background: "linear-gradient(135deg, #ede9f8, #ddd6f2)",
    color: "#4f46e5",
    cursor: "pointer",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setTableLoading(true);

      const [pgRes, res] = await Promise.all([
        api.get("/owner/pgs"),
        api.get("/owner/sponsorship/my")
      ]);

      setPgs(pgRes.data || []);
      setRecords(res.data || []);

    } finally {
      setTableLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  };

  const applySponsorship = async () => {
    if (!selectedPg)
      return toast("Please select your PG.", { icon: "ℹ️" });

    try {
      setLoading(true);

      await api.post(`/owner/sponsorship/apply/${selectedPg}`, {
        note
      });

      toast.success("Sponsorship request submitted!");

      setShowModal(false);
      setSelectedPg("");
      setNote("");
      loadData();

    } catch (err) {
      const message =
        err.response?.data?.message || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const hasActive = selectedPg
    ? records.some(r =>
        r.pgId === selectedPg &&
        (r.status === "PENDING" || r.status === "APPROVED")
      )
    : false;

  const stats = {
    total: pgs.length,
    approved: records.filter(r => r.status === "APPROVED").length,
    pending: records.filter(r => r.status === "PENDING").length,
    rejected: records.filter(r => r.status === "REJECTED").length,
    expired: records.filter(r => r.status === "EXPIRED").length,
    prioritized: records.filter(r => r.status === "APPROVED" && r.cityPriority != null).length,
  };

  const filteredRecords = activeTab === "PENDING"
    ? records.filter(r => r.status === "PENDING")
    : records.filter(r => r.status !== "PENDING");

  const reApply = (pgId) => {
    setSelectedPg(pgId);
    setNote("");
    setShowModal(true);
  };

  return (
    <DashboardLayout
      title="PG Sponsorship"
      subtitle="Boost your PG visibility & get more bookings"
    >
      <div className="owner-sponsorship-page">

        <div className="spon-stats-grid">

          <div className="spon-stat-card spon-stat--total">
            <div className="spon-stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" className="spon-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>
              </svg>
            </div>
            <div className="spon-stat-info">
              <span className="spon-stat-value">{stats.total}</span>
              <span className="spon-stat-label">Total PGs</span>
              <span className="spon-stat-sub">All registered</span>
            </div>
          </div>

          <div className="spon-stat-card spon-stat--approved">
            <div className="spon-stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" className="spon-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/>
              </svg>
            </div>
            <div className="spon-stat-info">
              <span className="spon-stat-value">{stats.approved}</span>
              <span className="spon-stat-label">Approved</span>
              <span className="spon-stat-sub">Active sponsorships</span>
            </div>
          </div>

          <div className="spon-stat-card spon-stat--pending">
            <div className="spon-stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" className="spon-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="spon-stat-info">
              <span className="spon-stat-value">{stats.pending}</span>
              <span className="spon-stat-label">Pending</span>
              <span className="spon-stat-sub">Awaiting review</span>
            </div>
          </div>

          <div className="spon-stat-card spon-stat--rejected">
            <div className="spon-stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" className="spon-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
              </svg>
            </div>
            <div className="spon-stat-info">
              <span className="spon-stat-value">{stats.rejected}</span>
              <span className="spon-stat-label">Rejected</span>
              <span className="spon-stat-sub">Failed verification</span>
            </div>
          </div>

          <div className="spon-stat-card spon-stat--expired">
            <div className="spon-stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" className="spon-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
            </div>
            <div className="spon-stat-info">
              <span className="spon-stat-value">{stats.expired}</span>
              <span className="spon-stat-label">Expired</span>
              <span className="spon-stat-sub">Ended sponsorships</span>
            </div>
          </div>

          <div className="spon-stat-card spon-stat--priority">
            <div className="spon-stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" className="spon-stat-icon" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div className="spon-stat-info">
              <span className="spon-stat-value">{stats.prioritized}</span>
              <span className="spon-stat-label">Prioritized</span>
              <span className="spon-stat-sub">With city rank</span>
            </div>
          </div>

        </div>

        {/* STEPS */}
        <section className="steps-section">
          <div className="steps-header">
            <h3 className="sec-title">How Sponsorship Works</h3>
            <button
              className="apply-main-btn"
              onClick={() => setShowModal(true)}
            >
              Apply Sponsorship
            </button>
          </div>

          <div className="steps-grid">
            <StepCard
              number="01"
              icon="bi-send-check"
              title="Apply"
              text="Select your PG and submit sponsorship request."
            />
            <StepCard
              number="02"
              icon="bi-headset"
              title="Admin Contact"
              text="Admin contacts you & confirms details."
            />
            <StepCard
              number="03"
              icon="bi-megaphone"
              title="Activation"
              text="Your PG appears as Sponsored on platform."
            />
          </div>
        </section>

        {/* HISTORY */}
        <section className="history-card">
          <h4>My Sponsorship Requests</h4>

          {/* TAB BUTTONS */}
          <div className="spon-tab-btns">
            <button
              className={`spon-tab-btn ${activeTab === "PENDING" ? "active" : ""}`}
              onClick={() => setActiveTab("PENDING")}
            >
              Pending
            </button>
            <button
              className={`spon-tab-btn ${activeTab === "OTHERS" ? "active" : ""}`}
              onClick={() => setActiveTab("OTHERS")}
            >
              Others
            </button>
          </div>

          <div className="spon-table-scope">

            {/* ── DESKTOP TABLE ── */}
            <div className="spon-desktop-wrap">
              <table className="spon-desktop-table">
                <colgroup>
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "100px" }} />
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "120px" }} />
                  {activeTab !== "PENDING" && (
                    <>
                      <col style={{ width: "100px" }} />
                      <col style={{ width: "100px" }} />
                      <col style={{ width: "140px" }} />
                      <col style={{ width: "110px" }} />
                      <col style={{ width: "100px" }} />
                    </>
                  )}
                </colgroup>
                <thead>
                  <tr>
                    <th>PG</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Note</th>
                    {activeTab !== "PENDING" && (
                      <>
                        <th>Start</th>
                        <th>End</th>
                        <th>Reason</th>
                        <th>Priority Rank</th>
                        <th>Action</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tableLoading ? (
                    <TableSkeleton rows={6} cols={activeTab === "PENDING" ? 4 : 9} />
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === "PENDING" ? 4 : 9} className="spon-empty">
                        No sponsorship records
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="spon-dt-row">
                        <td>{r.pgName}</td>
                        <td>{r.city || "—"}</td>
                        <td>
                          <span className={`status-pill ${r.status}`}>{r.status}</span>
                        </td>
                        <td>{r.note || "—"}</td>
                        {activeTab !== "PENDING" && (
                          <>
                            <td>{formatDate(r.startDate)}</td>
                            <td>{formatDate(r.endDate)}</td>
                            <td>{r.status === "REJECTED" ? r.rejectionReason || "—" : "—"}</td>
                            <td>
                              {r.status === "APPROVED" && r.cityPriority != null
                                ? <span className="status-pill APPROVED">{r.cityPriority}</span>
                                : "—"}
                            </td>
                            <td>
                              {r.status === "REJECTED" && (
                                <button
                                  className="btn-reapply"
                                  style={reapplyBtnStyle}
                                  onClick={() => reApply(r.pgId)}
                                >
                                  Re-apply
                                </button>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE CARDS ── */}
            <div className="spon-cards-wrap">
              {tableLoading ? (
                <div className="spon-empty">Loading...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="spon-empty">No sponsorship records</div>
              ) : (
                filteredRecords.map((r) => (
                  <div key={r.id} className={`spon-card spon-card--${r.status.toLowerCase()}`}>

                    {/* Header */}
                    <div className="spon-card-header">
                      <div className="spon-card-title-block">
                        <div className="spon-card-name">{r.pgName}</div>
                        <div className="spon-card-sub">{r.city || "—"}</div>
                      </div>
                      <span className={`spon-card-badge spon-card-badge--${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </div>

                    {/* Dates row — only for non-pending */}
                    {activeTab !== "PENDING" && (
                      <div className="spon-card-money-row">
                        <div className="spon-card-money-cell">
                          <div className="spon-card-money-label">Start Date</div>
                          <div className="spon-card-money-val">{formatDate(r.startDate)}</div>
                        </div>
                        <div className="spon-card-money-cell">
                          <div className="spon-card-money-label">End Date</div>
                          <div className="spon-card-money-val">{formatDate(r.endDate)}</div>
                        </div>
                      </div>
                    )}

                    {/* Note — always visible */}
                    <div className="spon-card-section-row">
                      <div className="spon-card-detail-cell">
                        <div className="spon-card-detail-label">Note</div>
                        <div className="spon-card-detail-val">{r.note || "—"}</div>
                      </div>
                    </div>

                    {/* Priority rank — only for non-pending */}
                    {activeTab !== "PENDING" && (
                      <div className="spon-card-section-row">
                        <div className="spon-card-detail-cell">
                          <div className="spon-card-detail-label">Priority Rank</div>
                          <div className="spon-card-detail-val">
                            {r.status === "APPROVED" && r.cityPriority != null
                              ? <span className="status-pill APPROVED">{r.cityPriority}</span>
                              : "—"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejection reason — only if rejected */}
                    {r.status === "REJECTED" && r.rejectionReason && (
                      <div className="spon-card-reason-row">
                        <div className="spon-card-detail-label">Rejection Reason</div>
                        <div className="spon-card-detail-val">{r.rejectionReason}</div>
                      </div>
                    )}

                    {/* Action */}
                    {r.status === "REJECTED" && (
                      <div className="spon-card-actions">
                        <button
                          className="btn-reapply"
                          style={reapplyBtnStyle}
                          onClick={() => reApply(r.pgId)}
                        >
                          Re-apply
                        </button>
                      </div>
                    )}

                  </div>
                ))
              )}
            </div>

          </div>
        </section>

        {/* APPLY MODAL */}
        {showModal && (
          <div
            className="modal-backdrop-custom"
            onClick={() => setShowModal(false)}
          >
            <div
              className="modal-box sponsorship-modal"
              onClick={(e) => e.stopPropagation()}
            >

              {/* HEADER */}
              <div className="modal-header-custom">
                <h4>Apply for Sponsorship</h4>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>

              {/* BODY */}
              <div className="modal-body">

                <div className="mb-3">
                  <label>Select PG</label>
                  <select
                    className="form-control"
                    value={selectedPg}
                    onChange={(e) => setSelectedPg(e.target.value)}
                  >
                    <option value="">Select PG</option>
                    {pgs.map((pg) => (
                      <option
                        key={pg.id}
                        value={pg.id}
                        disabled={records.some(r =>
                          r.pgId === pg.id &&
                          (r.status === "PENDING" || r.status === "APPROVED")
                        )}
                      >
                        {pg.name}
                      </option>
                    ))}
                  </select>

                  {hasActive && (
                    <div className="text-danger small mt-2">
                      You already have an active or pending sponsorship for this PG.
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label>Additional Note</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
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
                  onClick={applySponsorship}
                  disabled={loading || hasActive}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

const StepCard = ({ number, icon, title, text }) => (
  <div className="step-card">
    <div className="step-top">
      <span className="step-number">{number}</span>
      <i className={`bi ${icon} step-icon`}></i>
    </div>
    <h5>{title}</h5>
    <p>{text}</p>
  </div>
);

export default OwnerSponsorship;