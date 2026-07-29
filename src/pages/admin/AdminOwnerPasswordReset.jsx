import { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./adminOwnerPassword.css";
import { TableSkeleton, OwnerCardSkeleton } from "../public/Skeleton";
import PGDetailModal from "./AdminPGContol/PGDetailModal";

const PAGE_SIZE = 20;

const getInitials = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const formatName = (name) => {
  if (!name) return "";
  return name.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const AdminOwnerPasswordReset = () => {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [pgs, setPgs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pgFilter, setPgFilter] = useState("ALL");
  const [sortDir, setSortDir] = useState("a_z");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [resetModal, setResetModal] = useState(false);
  const [selectedOwnerForReset, setSelectedOwnerForReset] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [pgDetail, setPgDetail] = useState(null);
  const [showPgDetailModal, setShowPgDetailModal] = useState(false);

  const loadOwners = useCallback(
    async (nextPage = 0, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const res = await api.get("/admin/owners/paged", {
          params: {
            page: nextPage,
            size: PAGE_SIZE,
            search: search.trim() || undefined,
            hasPg: pgFilter !== "ALL" ? pgFilter : undefined,
            sortDir: sortDir,
          },
        });

        const content = res.data?.content || [];
        setOwners((prev) => (append ? [...prev, ...content] : content));
        setPage(res.data?.number || nextPage);
        setTotalPages(res.data?.totalPages || 0);
        setTotalElements(res.data?.totalElements || 0);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [pgFilter, search, sortDir],
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadOwners(0, false);
  }, [loadOwners]);

  const refreshOwners = async () => {
    await loadOwners(0, false);
  };

  const getPgPreviewText = (owner) => {
    const names = owner.pgNames || [];
    if (names.length === 0) return "";
    const visiblePgs = names.slice(0, 2);
    const remainingPgs = names.length - visiblePgs.length;
    return `${visiblePgs.join(", ")}${remainingPgs > 0 ? ` +${remainingPgs} more` : ""}`;
  };

  const openPGModal = async (owner) => {
    setSelectedOwner(owner);
    setShowModal(true);
    setPgs([]);
    try {
      const res = await api.get(`/admin/owners/${owner.id}/pgs`);
      setPgs(res.data || []);
    } catch (error) {
      console.error(`Failed to refresh PGs for owner ${owner.id}`, error);
    }
  };

  const openPgDetailModal = async (pgId) => {
    setShowModal(false);
    setPgDetail(null);
    setShowPgDetailModal(true);
    try {
      const res = await api.get(`/admin/owners/pg/${pgId}`);
      setPgDetail(res.data);
    } catch (error) {
      console.error(`Failed to load PG detail for ${pgId}`, error);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      return toast.error("Please enter a new password.");
    }
    try {
      await api.put(`/admin/owners/${selectedOwnerForReset.id}/reset-password`, { password: newPassword });
      toast.success("Password reset successfully.");
      setResetModal(false);
      await refreshOwners();
    } catch {
      toast.error("Password reset failed.");
    }
  };

  const resetPhone = async (ownerId) => {
    const owner = owners.find((o) => o.id === ownerId);
    const { value: phone } = await Swal.fire({
      title: "Enter new phone number",
      input: "text",
      inputPlaceholder: "10-digit phone number",
      showCancelButton: true,
      confirmButtonText: "Update",
      confirmButtonColor: "#6366f1",
      inputAttributes: { maxlength: 10 },
      didOpen: () => {
        const input = Swal.getInput();
        input.addEventListener("input", () => {
          input.value = input.value.replace(/\D/g, "");
          if (input.value.length > 10) {
            input.value = input.value.slice(0, 10);
          }
        });
      },
      inputValidator: (value) => {
        if (!value) return "Phone is required";
        if (value.length !== 10) return "Phone must be exactly 10 digits";
      },
    });

    if (!phone) return;
    if (owner?.phone === phone) {
      return toast("New phone number is the same as the current one.", { icon: "ℹ️" });
    }

    try {
      await api.put(`/admin/owners/${ownerId}/reset-phone`, { phone });
      toast.success("Phone number updated successfully.");
      await refreshOwners();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || "Failed to update phone.");
    }
  };

  const pageOffset = page * PAGE_SIZE;

  return (
    <DashboardLayout title="Password Control" subtitle="Reset owner passwords and view their PGs">
      <div className="filter-card">
        <div className="filter-bar">
          <div className="search-wrapper">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              placeholder="Search by owner name, phone or PG name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="form-control search"
            />
          </div>
          <select value={pgFilter} onChange={(e) => setPgFilter(e.target.value)} className="form-select select">
            <option value="ALL">All Owners</option>
            <option value="HAS_PG">Has PGs</option>
            <option value="NO_PG">No PGs</option>
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value)} className="form-select select">
            <option value="a_z">A → Z</option>
            <option value="newest">Newest to Oldest</option>
            <option value="oldest">Oldest to Newest</option>
          </select>
        </div>
      </div>

      <div className="admin-results-count">Showing {owners.length} of {totalElements} owners</div>

      <div className="owner-password-page">
        <div className="owner-table-wrapper">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Owner</th>
                <th>Phone</th>
                <th className="text-center">Total PGs</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={8} cols={5} />
              ) : owners.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">No owners found</td>
                </tr>
              ) : (
                owners.map((o, index) => (
                  <tr key={o.id}>
                    <td style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>
                      {pageOffset + index + 1}
                    </td>
                    <td>
                      <div className="owner-name-cell">
                        <div className="owner-avatar">{getInitials(o.name)}</div>
                        <div className="owner-name-block">
                          <span className="owner-name-text">{formatName(o.name)}</span>
                          {getPgPreviewText(o) && <span className="owner-pg-preview">PGs: {getPgPreviewText(o)}</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#475569", fontSize: "13px" }}>{o.phone}</td>
                    <td className="text-center">
                      <span className={`pg-count-badge ${o.totalPgs > 0 ? "has-pgs" : ""}`}>{o.totalPgs}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-view" onClick={() => openPGModal(o)}>View PGs</button>
                        <button className="btn-reset" onClick={() => { setSelectedOwnerForReset(o); setNewPassword(""); setShowPassword(false); setResetModal(true); }}>Reset Password</button>
                        <button className="btn-phone" onClick={() => resetPhone(o.id)}>Reset Phone</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="owner-card-list">
          {loading ? (
            <OwnerCardSkeleton count={4} />
          ) : owners.length === 0 ? (
            <p className="text-center text-muted py-4">No owners found</p>
          ) : (
            owners.map((o, index) => (
              <div key={o.id} className="owner-pwd-card">
                <div className="owner-pwd-card-top">
                  <div className="owner-avatar">{getInitials(o.name)}</div>
                  <div className="owner-pwd-card-info">
                    <div className="owner-pwd-card-name">
                      <span style={{ color: "#94a3b8", fontSize: "12px", marginRight: "6px" }}>
                        #{pageOffset + index + 1}
                      </span>
                      {formatName(o.name)}
                    </div>
                    <div className="owner-pwd-card-phone">
                      {o.phone} · <span className={`pg-count-badge ${o.totalPgs > 0 ? "has-pgs" : ""}`} style={{ fontSize: "11px", padding: "1px 7px" }}>{o.totalPgs} PG{o.totalPgs !== 1 ? "s" : ""}</span>
                    </div>
                    {getPgPreviewText(o) && <div className="owner-pwd-card-pgs">PGs: {getPgPreviewText(o)}</div>}
                  </div>
                </div>
                <div className="owner-pwd-card-actions">
                  <button className="btn-view" onClick={() => openPGModal(o)}>View PGs</button>
                  <button className="btn-reset" onClick={() => { setSelectedOwnerForReset(o); setNewPassword(""); setShowPassword(false); setResetModal(true); }}>Reset Password</button>
                  <button className="btn-phone" onClick={() => resetPhone(o.id)}>Reset Phone</button>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && page + 1 < totalPages && (
          <div className="admin-load-more-wrap">
            <button className="admin-load-more-btn" onClick={() => loadOwners(page + 1, true)} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>

      {/* ===== PG LIST MODAL ===== */}
      {showModal && (
        <div className="pg-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pg-modal pg-list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pg-modal-header">
              <h4>PGs of {formatName(selectedOwner?.name)}</h4>
              <button className="pg-modal-close" onClick={() => setShowModal(false)}>X</button>
            </div>
            <div className="pg-modal-body">
              {pgs.length === 0 ? (
                <div className="pg-modal-empty">
                  <i className="bi bi-building" style={{ fontSize: "28px", display: "block", marginBottom: "8px", opacity: 0.3 }}></i>
                  No PGs found for this owner
                </div>
              ) : (
                <>
                  <div className="owner-table-wrapper" style={{ borderRadius: 0, border: "none" }}>
                    <table className="owner-table" style={{ minWidth: "unset" }}>
                      <thead>
                        <tr>
                          <th>PG Name</th>
                          <th>City</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pgs.map((pg) => (
                          <tr key={pg.id}>
                            <td style={{ fontWeight: 500 }}>{pg.name}</td>
                            <td style={{ color: "#64748b" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <i className="bi bi-geo-alt-fill" style={{ color: "#94a3b8", fontSize: 11 }}></i>
                                {pg.city}
                              </span>
                            </td>
                            <td>
                              <button className="btn-pg-detail" onClick={() => openPgDetailModal(pg.id)}>
                                View PG Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pg-modal-cards">
                    {pgs.map((pg) => (
                      <div key={pg.id} className="pg-modal-card">
                        <div>
                          <div className="pg-modal-card-name">{pg.name}</div>
                          <div className="pg-modal-card-city">
                            <i className="bi bi-geo-alt-fill" style={{ color: "#94a3b8", fontSize: 11 }}></i>
                            {pg.city}
                          </div>
                        </div>
                        <button className="btn-pg-detail" onClick={() => openPgDetailModal(pg.id)}>
                          View PG Details
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== RESET PASSWORD MODAL ===== */}
      {resetModal && (
        <div className="modal-backdrop-custom" onClick={() => setResetModal(false)}>
          <div className="modal-box" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <h4 className="mb-3">Reset Password - {formatName(selectedOwnerForReset?.name)}</h4>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-control mb-3"
              />
              <span className="toggle-eye" onClick={() => setShowPassword(!showPassword)}>
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </span>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setResetModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleResetPassword}>Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PG DETAIL MODAL ===== */}
      {showPgDetailModal && (
        <PGDetailModal
          pgDetail={pgDetail}
          onClose={() => {
            setShowPgDetailModal(false);
            setPgDetail(null);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminOwnerPasswordReset;