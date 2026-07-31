import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import api from "../../../api/axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import "./OwnerManagers.css";
import { TableSkeleton } from "../../public/Skeleton";

const OwnerManagers = () => {

  const [managers, setManagers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [resetModal, setResetModal] = useState(false);
  const [pgs, setPgs] = useState([]);
  const [selectedPg, setSelectedPg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [newPassword, setNewPassword] = useState("");
const [openMenuId, setOpenMenuId] = useState(null);

useEffect(() => {
  const closeMenu = () => setOpenMenuId(null);
  document.addEventListener("click", closeMenu);
  return () => document.removeEventListener("click", closeMenu);
}, []);

  /* ================= LOAD ================= */
  const loadManagers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/owner/managers");
      setManagers(res.data || []);
    } catch {
      toast.error("Failed to load managers. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const loadPgs = async () => {
    try {
      const res = await api.get("/owner/pgs");
      setPgs(res.data || []);
    } catch {
      toast.error("Failed to load PGs.");
    }
  };

  useEffect(() => {
    loadManagers();
    loadPgs();
  }, []);

  /* ================= CREATE ================= */
  const handleCreate = async () => {
    if (!form.name || !form.phone || !form.password) {
      return toast.error("All fields are required.");
    }
    if (!/^[0-9]{10}$/.test(form.phone)) {
      return toast.error("Enter a valid 10-digit phone number.");
    }
    setCreateLoading(true);
    try {
      await api.post("/owner/managers", form);
      toast.success("Caretaker created successfully!");
      setShowModal(false);
      setForm({ name: "", phone: "", password: "" });
      loadManagers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create caretaker.");
    } finally {
      setCreateLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Caretaker?", text: "This caretaker will be permanently removed.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete", cancelButtonText: "Cancel"
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/owner/managers/${id}`);
      toast.success("Caretaker deleted successfully.");
      loadManagers();
    } catch {
      toast.error("Failed to delete caretaker.");
    }
  };

  /* ================= TOGGLE ================= */
  const toggleStatus = async (id) => {
    try {
      await api.put(`/owner/managers/${id}/toggle`);
      loadManagers();
    } catch {
      toast.error("Failed to update status.");
    }
  };

  /* ================= RESET PASSWORD ================= */
  const openResetModal = (manager) => {
    setSelectedManager(manager);
    setNewPassword("");
    setResetModal(true);
  };

  const resetPassword = async () => {
    if (!newPassword) {
      return toast.error("Please enter a new password.");
    }
    try {
      await api.put(`/owner/managers/${selectedManager.id}/reset-password`, { password: newPassword });
      toast.success("Password reset successfully.");
      setResetModal(false);
    } catch {
      toast.error("Failed to reset password.");
    }
  };

  /* ================= ASSIGN MODAL ================= */
  const openAssignModal = (manager) => {
    setSelectedManager(manager);
    setSelectedPg("");
    setAssignModal(true);
  };

  const assignPg = async () => {
    if (!selectedPg) {
      return toast.error("Please select a PG to assign.");
    }
    try {
      await api.post(`/owner/managers/${selectedManager.id}/assign/${selectedPg}`);
      toast.success("PG assigned successfully.");
      loadManagers();
      setAssignModal(false);
    } catch {
      toast.error("Failed to assign PG.");
    }
  };

  /* ================= REMOVE PG ================= */
  const removePg = async (pgId) => {
    try {
      await api.delete(`/owner/managers/${selectedManager.id}/remove/${pgId}`);
      toast.success("PG removed successfully.");
      loadManagers();
      setSelectedManager(prev => ({ ...prev, assignedPgIds: prev.assignedPgIds.filter(id => id !== pgId) }));
    } catch {
      toast.error("Failed to remove PG.");
    }
  };

  const filteredManagers = managers.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search);
    const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" && m.active) || (statusFilter === "INACTIVE" && !m.active);
    return matchSearch && matchStatus;
  });

  /* ================= UI ================= */
  return (
    <DashboardLayout
      title="Caretaker Management"
      subtitle="Create and manage PG caretakers"
      rightAction={
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          + Add Caretaker
        </button>
      }
    >
      {/* ── STAT CARDS ── */}
      <div className="owners-stats-row">
        <div className="owners-stat-card" style={{ borderTopColor: "#5B5BD6" }}>
          <div className="owners-stat-icon" style={{ background: "#eef2ff" }}>
            <i className="bi bi-people-fill" style={{ color: "#5B5BD6" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{managers.length}</div>
            <div className="owners-stat-label">Total Caretakers</div>
            <div className="owners-stat-sub">Registered on platform</div>
          </div>
        </div>
        <div className="owners-stat-card" style={{ borderTopColor: "#16a34a" }}>
          <div className="owners-stat-icon" style={{ background: "#f0fdf4" }}>
            <i className="bi bi-person-check-fill" style={{ color: "#16a34a" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{managers.filter(m => m.active).length}</div>
            <div className="owners-stat-label">Active</div>
            <div className="owners-stat-sub">Currently working</div>
          </div>
        </div>
        <div className="owners-stat-card" style={{ borderTopColor: "#dc2626" }}>
          <div className="owners-stat-icon" style={{ background: "#fef2f2" }}>
            <i className="bi bi-person-slash-fill" style={{ color: "#dc2626" }}></i>
          </div>
          <div className="owners-stat-info">
            <div className="owners-stat-value">{managers.filter(m => !m.active).length}</div>
            <div className="owners-stat-label">Paused</div>
            <div className="owners-stat-sub">Inactive caretakers</div>
          </div>
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="card">

        {/* Filter bar */}
        <div className="filter-card">
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search caretaker name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control filter-search"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control filter-select"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* ── TABLE SCOPE ── */}
        <div className="mgr-table-scope">

          {/* Desktop table */}
          <div className="mgr-desktop-wrap">
            <table className="mgr-desktop-table">
              <colgroup>
  <col style={{ width: "22%" }} />
  <col style={{ width: "18%" }} />
  <col style={{ width: "16%" }} />
  <col style={{ width: "14%" }} />
  <col style={{ width: "20%" }} />
  <col style={{ width: "10%" }} />
</colgroup>
              <thead>
  <tr>
    <th>Name</th>
    <th>Phone</th>
    <th>Assigned PGs</th>
    <th>Status</th>
    <th>Actions</th>
    <th>Others</th>
  </tr>
</thead>
              <tbody>
                {loading ? (
  <TableSkeleton rows={6} cols={6} />
) : filteredManagers.length === 0 ? (
  <tr><td colSpan="6" className="mgr-empty">No caretakers found</td></tr>
) : (
                  filteredManagers.map(m => (
                    <tr key={m.id} className="mgr-dt-row">
                      <td>{m.name}</td>
                      <td>{m.phone}</td>
                      <td>{m.assignedPgIds?.length || 0}</td>
                      <td>
                        <span className={m.active ? "status active" : "status inactive"}>
                          {m.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                     <td>
  <button className="action-btn manage" onClick={() => openAssignModal(m)}>Manage PGs</button>
</td>
<td>
  <div className="mgr-menu-wrap" onClick={(e) => e.stopPropagation()}>
    <button
      className="action-btn-dots"
      onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
    >
      <i className="bi bi-three-dots-vertical"></i>
    </button>

 {openMenuId === m.id && (
  <div className="mgr-dropdown">
    <button onClick={() => { openResetModal(m); setOpenMenuId(null); }}>
      <i className="bi bi-key-fill"></i> Reset Password
    </button>
    <button onClick={() => { toggleStatus(m.id); setOpenMenuId(null); }}>
      <i className={`bi ${m.active ? "bi-toggle2-off" : "bi-toggle2-on"}`}></i>
      {m.active ? "Deactivate" : "Activate"}
    </button>
    <button className="danger" onClick={() => { handleDelete(m.id); setOpenMenuId(null); }}>
      <i className="bi bi-trash-fill"></i> Delete
    </button>
  </div>
)}
  </div>
</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mgr-cards-wrap">
            {loading ? (
              <div className="mgr-empty">Loading...</div>
            ) : filteredManagers.length === 0 ? (
              <div className="mgr-empty">No caretakers found</div>
            ) : (
              filteredManagers.map(m => (
                <div key={m.id} className={`mgr-card ${m.active ? "mgr-card--active" : "mgr-card--inactive"}`}>

                  {/* Header */}
                  <div className="mgr-header">
                    <div className="mgr-title-block">
                      <div className="mgr-name">{m.name}</div>
                      <div className="mgr-sub">{m.phone}</div>
                    </div>
                    <span className={`mgr-badge ${m.active ? "mgr-badge--active" : "mgr-badge--inactive"}`}>
                      {m.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Info Row */}
                  <div className="mgr-info-row">
                    <div className="mgr-info-cell">
                      <div className="mgr-info-label">Assigned PGs</div>
                      <div className="mgr-info-val">{m.assignedPgIds?.length || 0}</div>
                    </div>
                    <div className="mgr-info-cell mgr-info-cell--right">
                      <div className="mgr-info-label">Account</div>
                      <div className="mgr-info-val">Caretaker</div>
                    </div>
                  </div>

                  {/* Action row 1 */}
                  <div className="mgr-actions">
                    <button className="mgr-act-btn mgr-act-btn--manage" onClick={() => openAssignModal(m)}>Manage PGs</button>
                    <button className="mgr-act-btn mgr-act-btn--reset" onClick={() => openResetModal(m)}>Reset Password</button>
                  </div>

                  {/* Action row 2 */}
                  <div className="mgr-actions mgr-actions--bottom">
                    <button className="mgr-act-btn mgr-act-btn--toggle" onClick={() => toggleStatus(m.id)}>
                      {m.active ? "Deactivate" : "Activate"}
                    </button>
                    <button className="mgr-act-btn mgr-act-btn--delete" onClick={() => handleDelete(m.id)}>Delete</button>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>{/* end mgr-table-scope */}

      </div>{/* end card */}

      {/* ================= CREATE MODAL ================= */}
      {showModal && createPortal(
        <div className="om-backdrop" onClick={() => setShowModal(false)}>
          <div className="om-modal-box" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h4>Create Caretaker</h4>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <input
              type="text" name="name" placeholder="Name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="form-control mb-2"
            />
            <input
              type="tel" name="phone" placeholder="Enter 10-digit phone number"
              value={form.phone}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) setForm({ ...form, phone: v }); }}
              onKeyDown={(e) => { if (!/[0-9]/.test(e.key) && !["Backspace", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) e.preventDefault(); }}
              className="form-control mb-2"
            />
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"} name="password" placeholder="Password"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="form-control mb-3"
              />
              <span className="toggle-eye" onClick={() => setShowPassword(!showPassword)}>
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </span>
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="modal-btn primary" onClick={handleCreate} disabled={createLoading}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: createLoading ? 0.85 : 1 }}
              >
                {createLoading ? (
                  <>
                    <span style={{ width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "om-spin 0.7s linear infinite", flexShrink: 0 }} />
                    Creating...
                  </>
                ) : "Create"}
                <style>{`@keyframes om-spin { to { transform: rotate(360deg); } }`}</style>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= ASSIGN / REMOVE MODAL ================= */}
      {assignModal && createPortal(
        <div className="om-backdrop" onClick={() => setAssignModal(false)}>
          <div className="om-modal-box" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h4>Manage PGs — {selectedManager?.name}</h4>
              <button className="modal-close-btn" onClick={() => setAssignModal(false)}>×</button>
            </div>
            <h6>Assigned PGs</h6>
            {selectedManager?.assignedPgIds?.length === 0 && <p>No PG assigned</p>}
            <div className="assigned-pg-list">
              {selectedManager?.assignedPgIds?.map(pgId => {
                const pg = pgs.find(p => p.id === pgId);
                return (
                  <div key={pgId} className="assigned-pg-item">
                    <span className="pg-name">{pg?.name || pgId}</span>
                    <button className="remove-pg-btn" onClick={() => removePg(pgId)}>✕</button>
                  </div>
                );
              })}
            </div>
            <hr />
            <h6>Assign New PG</h6>
            <select className="form-control mb-3" value={selectedPg} onChange={(e) => setSelectedPg(e.target.value)}>
              <option value="">Select PG</option>
              {pgs.filter(pg => !selectedManager?.assignedPgIds?.includes(pg.id)).map(pg => (
                <option key={pg.id} value={pg.id}>{pg.name}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setAssignModal(false)}>Close</button>
              <button className="modal-btn primary" onClick={assignPg}>Assign</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= RESET PASSWORD MODAL ================= */}
      {resetModal && createPortal(
        <div className="om-backdrop" onClick={() => setResetModal(false)}>
          <div className="om-modal-box" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h4>Reset Password — {selectedManager?.name}</h4>
              <button className="modal-close-btn" onClick={() => setResetModal(false)}>×</button>
            </div>
            <div className="password-field">
              <input
                type={showResetPassword ? "text" : "password"} placeholder="Enter new password"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="form-control mb-3"
              />
              <span className="toggle-eye" onClick={() => setShowResetPassword(!showResetPassword)}>
                <i className={`bi ${showResetPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </span>
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setResetModal(false)}>Cancel</button>
              <button className="modal-btn primary" onClick={resetPassword}>Reset</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </DashboardLayout>
  );
};

export default OwnerManagers;