import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import "./AdminVerification.css";
import "./adminReservations.css";
import { TableSkeleton, UniversalCardSkeleton } from "../public/Skeleton";
import { FaHome } from "react-icons/fa";

const PAGE_SIZE = 20;

const AdminVerification = ({ basePath = "/admin/verifications", showAmountControl = true }) => {
  const [requests, setRequests] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortDir, setSortDir] = useState("desc");
  const [verificationAmount, setVerificationAmount] = useState("");
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const load = useCallback(
    async (nextPage = 0, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const res = await api.get(`${basePath}/paged`, {
          params: {
            page: nextPage,
            size: PAGE_SIZE,
            search: search.trim() || undefined,
            status: activeTab,
            sortDir,
          },
        });

        const content = res.data?.content || [];
        setRequests((prev) => (append ? [...prev, ...content] : content));
        setPage(res.data?.number || nextPage);
        setTotalPages(res.data?.totalPages || 0);
        setTotalElements(res.data?.totalElements || 0);
      } catch {
        toast.error("Failed to load verification requests.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, basePath, search, sortDir],
  );

  useEffect(() => {
    if (!showAmountControl) return;
    api
      .get("/admin/verification-amount")
      .then((res) => setVerificationAmount(res.data ?? ""))
      .catch(() => {});
  }, [showAmountControl]);

  useEffect(() => {
    Promise.all([
      api.get(`${basePath}/paged`, { params: { page: 0, size: 1, status: "PENDING" } }),
      api.get(`${basePath}/paged`, { params: { page: 0, size: 1, status: "APPROVED" } }),
      api.get(`${basePath}/paged`, { params: { page: 0, size: 1, status: "REJECTED" } }),
      
    ])
      .then(([p, a, r, re]) => setStats({
        pending: p.data?.totalElements || 0,
        approved: a.data?.totalElements || 0,
        rejected: r.data?.totalElements || 0,
        
      }))
      .catch(() => {});
  }, [basePath]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    load(0, false);
  }, [load]);

  const updateVerificationAmount = async () => {
    if (!verificationAmount || Number(verificationAmount) <= 0) {
      return toast.error("Please enter a valid verification amount.");
    }

    try {
      await api.put("/admin/verification-amount", {
        verificationAmount: Number(verificationAmount),
      });
      toast.success("Verification amount updated successfully.");
    } catch {
      toast.error("Unable to update verification amount.");
    }
  };

  const approve = async (id) => {
    try {
      await api.put(`${basePath}/${id}/approve`);
      toast.success("PG verified successfully.");
      load(0, false);
    } catch {
      toast.error("Failed to approve verification.");
    }
  };

  const reject = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject Verification",
      input: "textarea",
      inputLabel: "Rejection Reason",
      inputPlaceholder: "Enter rejection reason...",
      showCancelButton: true,
      confirmButtonText: "Reject",
      confirmButtonColor: "#dc3545",
      preConfirm: (v) => {
        if (!v) Swal.showValidationMessage("Reason required");
        return v;
      },
    });
    if (!reason) return;
    try {
      await api.put(`${basePath}/${id}/reject`, { reason });
      toast.success("Verification rejected.");
      load(0, false);
    } catch {
      toast.error("Failed to reject verification.");
    }
  };

  const toggleSort = () => {
    setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const DocBadges = ({ req }) => (
    <div className="doc-badges">
      {req.identityUrl && (
        <button className="doc-badge doc-badge-id" onClick={() => setPreviewUrl(req.identityUrl)}>
          ID
        </button>
      )}
      {req.propertyUrl && (
        <button className="doc-badge doc-badge-property" onClick={() => setPreviewUrl(req.propertyUrl)}>
          Property
        </button>
      )}
      {req.licenseUrl && (
        <button className="doc-badge doc-badge-license" onClick={() => setPreviewUrl(req.licenseUrl)}>
          License
        </button>
      )}
      {req.buildingPhotoUrl && (
        <button className="doc-badge doc-badge-building" onClick={() => setPreviewUrl(req.buildingPhotoUrl)}>
          Building
        </button>
      )}
    </div>
  );

  const colSpan = activeTab === "PENDING" ? 8 : activeTab === "REJECTED" ? 8 : 7;

  return (
    <DashboardLayout title="PG Verifications" subtitle="Admin Verification Management">
      
     
      {showAmountControl && (
      <div className="token-card" style={{ marginBottom: 24 }}>
        <div className="token-card-text">
          <h4>Global Verification Fee</h4>
          <p>Set the platform-wide verification unlock amount charged to owners</p>
        </div>

        <div className="token-input-group">
          <span className="token-symbol">₹</span>
          <input
            type="number"
            maxLength="10"
            value={verificationAmount}
            placeholder="0"
            onChange={(e) => setVerificationAmount(e.target.value)}
          />
          <button onClick={updateVerificationAmount}>
            <i className="bi bi-check-lg me-1"></i> Update
          </button>
        </div>
      </div>
      )}
      
<div className="verif-stats-row">
        <div className="verif-stat-card verif-stat-pending">
          <div className="verif-stat-icon">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="verif-stat-info">
            <div className="verif-stat-value">{stats.pending}</div>
            <div className="verif-stat-label">Pending</div>
            <div className="verif-stat-sub">Awaiting review</div>
          </div>
        </div>

        <div className="verif-stat-card verif-stat-approved">
          <div className="verif-stat-icon">
            <i className="bi bi-patch-check-fill"></i>
          </div>
          <div className="verif-stat-info">
            <div className="verif-stat-value">{stats.approved}</div>
            <div className="verif-stat-label">Approved</div>
            <div className="verif-stat-sub">Live on platform</div>
          </div>
        </div>

        <div className="verif-stat-card verif-stat-rejected">
          <div className="verif-stat-icon">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div className="verif-stat-info">
            <div className="verif-stat-value">{stats.rejected}</div>
            <div className="verif-stat-label">Rejected</div>
            <div className="verif-stat-sub">Failed verification</div>
          </div>
        </div>
      </div>

      <div className="status-tabs">
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} className={`status-btn ${activeTab === s ? "active" : ""}`} onClick={() => setActiveTab(s)}>
            {s}
          </button>
        ))}

      <button className="status-btn status-btn--sort" onClick={toggleSort}>
          {sortDir === "desc" ? "⇅ Newest First" : "⇅ Oldest First"}
        </button>
      </div>

      <div className="verif-search-wrapper">
        <i className="bi bi-search search-icon"></i>
        <input
          className="form-control"
          placeholder="Search by PG name, owner, phone..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="admin-results-count">Showing {requests.length} of {totalElements} verification requests</div>

      <div className="verif-table-wrapper">
        <table className="verif-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>PG</th>
              <th>Owner</th>
              <th>Phone</th>
              <th>Documents</th>
              <th>Applied</th>
              <th className="text-center">Status</th>
              {activeTab === "PENDING" && <th>Actions</th>}
              {activeTab === "REJECTED" && <th>Reason</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={6} cols={activeTab === "PENDING" ? 8 : 7} />
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="verif-empty">No {activeTab.toLowerCase()} requests</td>
              </tr>
            ) : (
              requests.map((req, index) => (
                <tr key={req.id}>
                  <td>{page * PAGE_SIZE + index + 1}</td>

                  <td>
                    <div className="verif-pg-cell">
                      <div className="verif-pg-icon"><FaHome /></div>
                      <span className="verif-pg-name">{req.pgName || "Unknown PG"}</span>
                    </div>
                  </td>

                  <td style={{ color: "#64748b" }}>{req.ownerName || "-"}</td>
                  <td style={{ color: "#64748b" }}>{req.ownerPhone || "-"}</td>
                  <td><DocBadges req={req} /></td>

                  <td style={{ color: "#64748b" }}>
                    {req.appliedAt ? new Date(req.appliedAt).toLocaleDateString() : "-"}
                  </td>

                  <td className="text-center">
                    <span className={`status-pill ${req.status}`}>{req.status}</span>
                  </td>

                  {activeTab === "PENDING" && (
                    <td>
                      <div className="btn-actions">
                        <button className="btn-tbl-approve" onClick={() => approve(req.id)}>Approve</button>
                        <button className="btn-tbl-reject" onClick={() => reject(req.id)}>Reject</button>
                      </div>
                    </td>
                  )}

                  {activeTab === "REJECTED" && (
                    <td>
                      <span className="rejection-cell">{req.rejectionReason || "-"}</span>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="verif-card-list">
        {loading ? (
          <UniversalCardSkeleton count={4} actions={activeTab === "PENDING" ? 2 : 0} />
        ) : requests.length === 0 ? (
          <div className="verif-empty">No {activeTab.toLowerCase()} requests</div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="verif-card">
              <div className={`verif-card-bar ${req.status}`} />
              <div className="verif-card-body">

                <div className="verif-card-top">
                  <div className="verif-card-pg">
                    <div className="verif-pg-icon"><FaHome /></div>
                    <div>
                      <div className="verif-card-pgname">{req.pgName}</div>
                      <div className="verif-card-owner">{req.ownerName || "-"}</div>
                    </div>
                  </div>
                  <span className={`status-pill ${req.status}`}>{req.status}</span>
                </div>

                <div className="verif-card-meta">
                  <div className="verif-card-meta-item"><i className="bi bi-telephone-fill"></i>{req.ownerPhone || "-"}</div>
                  <div className="verif-card-meta-item"><i className="bi bi-calendar3"></i>{req.appliedAt ? new Date(req.appliedAt).toLocaleDateString() : "-"}</div>
                </div>

                <div className="verif-card-docs">
                  <div className="verif-card-docs-label">Documents</div>
                  <DocBadges req={req} />
                </div>

                {activeTab === "REJECTED" && req.rejectionReason && (
                  <div className="verif-card-rejection">Reason: {req.rejectionReason}</div>
                )}

                {activeTab === "PENDING" && (
                  <div className="verif-card-actions">
                    <button className="btn-tbl-approve" onClick={() => approve(req.id)}>Approve</button>
                    <button className="btn-tbl-reject" onClick={() => reject(req.id)}>Reject</button>
                  </div>
                )}

              </div>
            </div>
          ))
        )}
      </div>

      {!loading && page + 1 < totalPages && (
        <div className="admin-load-more-wrap">
          <button className="admin-load-more-btn" onClick={() => load(page + 1, true)} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="modal-backdrop-custom" onClick={() => setPreviewUrl(null)}>
          <div className="modal-box" style={{ maxWidth: "900px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h4>Document Preview</h4>
              <button className="modal-close" onClick={() => setPreviewUrl(null)}>X</button>
            </div>

            <div className="text-center">
              {previewUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe src={previewUrl} title="Document Preview" width="100%" height="500px" style={{ border: "none" }} />
              ) : (
                <img src={previewUrl} alt="Document" style={{ maxWidth: "100%", maxHeight: "500px" }} />
              )}
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminVerification;