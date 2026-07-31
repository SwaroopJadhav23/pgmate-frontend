import { useEffect, useState } from "react";
import "./subAdmin.css";
import DashboardLayout from "../../../layouts/DashboardLayout";
import api from "../../../api/axios";
import { OwnerCardSkeleton, TableSkeleton } from "../../public/Skeleton";
import Swal from "sweetalert2";

const getInitials = (name) => {
  if (!name) return "SA";
  const p = name.trim().split(" ");
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const SubAdminManagement = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const stats = {
    total: subAdmins.length,
    active: subAdmins.filter((a) => a.active).length,
    inactive: subAdmins.filter((a) => !a.active).length,
  };
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetModal, setResetModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortFilter, setSortFilter] = useState("A_Z");
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  /* ── LOAD ── */
  const loadSubAdmins = () => {
    setLoading(true);
    api.get("/admin/sub-admins")
      .then((res) => {
        setSubAdmins(res.data);
        setFilteredAdmins(res.data);
      })
      .catch(() => alert("Failed to load sub admins"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSubAdmins(); }, []);

  useEffect(() => {
    document.body.classList.toggle("modal-open", showModal);
  }, [showModal]);

  /* ── FILTER + SORT ── */
  useEffect(() => {
    let data = [...subAdmins];

    if (search)
      data = data.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.phone.includes(search)
      );

    if (statusFilter !== "ALL")
      data = data.filter((a) => (statusFilter === "ACTIVE" ? a.active : !a.active));

    if (sortFilter === "A_Z") {
      data.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    } else if (sortFilter === "NEWEST") {
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortFilter === "OLDEST") {
      data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    setFilteredAdmins(data);
  }, [search, statusFilter, sortFilter, subAdmins]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  /* ── CREATE ── */
  const handleCreate = () => {
    api.post("/admin/sub-admins", form)
      .then(() => { setShowModal(false); setForm({ name: "", phone: "", password: "" }); loadSubAdmins(); })
      .catch((err) => alert(err.response?.data?.message || "Error"));
  };

  /* ── DELETE ── */
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Sub Admin?",
      text: "This sub admin will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admin/sub-admins/${id}`);
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Sub admin deleted successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      loadSubAdmins();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: "Unable to delete sub admin",
      });
    }
  };

  /* ── TOGGLE ── */
  const toggleStatus = (id) => {
    api.patch(`/admin/sub-admins/${id}/toggle-status`).then(loadSubAdmins).catch(() => alert("Failed"));
  };

  /* ── RESET PASSWORD ── */
  const openResetModal = (admin) => { setSelectedAdmin(admin); setNewPassword(""); setResetModal(true); };

  const resetPassword = () => {
    if (!newPassword) return alert("Enter password");
    api.put(`/admin/sub-admins/${selectedAdmin.id || selectedAdmin._id}/reset-password`, { password: newPassword })
      .then(() => { alert("Password reset successfully"); setResetModal(false); })
      .catch(() => alert("Reset failed"));
  };

  /* ── EDIT ── */
  const startEdit = (admin) => {
    setEditing(admin);
    setForm({ name: admin.name, phone: admin.phone, password: "" });
    setShowModal(true);
  };

  const handleUpdate = () => {
    api.put(`/admin/sub-admins/${editing.id || editing._id}`, form)
      .then(() => { setShowModal(false); setEditing(null); setForm({ name: "", phone: "", password: "" }); loadSubAdmins(); })
      .catch(() => alert("Update failed"));
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setForm({ name: "", phone: "", password: "" }); };

  return (
    <DashboardLayout
      title="Sub Admin Management"
      subtitle="Create and manage platform sub admins"
      rightAction={
        <button className="primary-btn" onClick={() => { setEditing(null); setShowModal(true); }}>
          + Add Sub Admin
        </button>
      }
    >
      {/* ── FILTER BAR ── */}
      {/* ── STAT CARDS ── */}
      <div className="sa-stats-row">
        <div className="sa-stat-card" style={{ borderTopColor: "#5B5BD6" }}>
          <div className="sa-stat-icon" style={{ background: "#eef0ff", color: "#5B5BD6" }}>
            <i className="bi bi-shield-fill"></i>
          </div>
          <div className="sa-stat-info">
            <div className="sa-stat-value">{loading ? "—" : stats.total}</div>
            <div className="sa-stat-label">Total Sub Admins</div>
            <div className="sa-stat-sub">Registered on platform</div>
          </div>
        </div>

        <div className="sa-stat-card" style={{ borderTopColor: "#16a34a" }}>
          <div className="sa-stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
            <i className="bi bi-shield-check"></i>
          </div>
          <div className="sa-stat-info">
            <div className="sa-stat-value">{loading ? "—" : stats.active}</div>
            <div className="sa-stat-label">Active</div>
            <div className="sa-stat-sub">Currently active</div>
          </div>
        </div>

        <div className="sa-stat-card" style={{ borderTopColor: "#dc2626" }}>
          <div className="sa-stat-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>
            <i className="bi bi-shield-x"></i>
          </div>
          <div className="sa-stat-info">
            <div className="sa-stat-value">{loading ? "—" : stats.inactive}</div>
            <div className="sa-stat-label">Paused / Inactive</div>
            <div className="sa-stat-sub">Disabled accounts</div>
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}

      <div className="sub-filter-bar">
        <div className="search-wrapper">
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control search"
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="status-select">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <select value={sortFilter} onChange={(e) => setSortFilter(e.target.value)} className="status-select">
          <option value="A_Z">A → Z</option>
          <option value="NEWEST">Newest → Oldest</option>
          <option value="OLDEST">Oldest → Newest</option>
        </select>
      </div>

      {/* ══ DESKTOP TABLE ══ */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>SrNo</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={6} cols={5} />
            ) : filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  No sub admins found
                </td>
              </tr>
            ) : (
              filteredAdmins.map((admin, index) => (
                <tr key={admin.id || admin._id}>
                  <td style={{ color: "#94a3b8", fontWeight: "600" }}>{index + 1}</td>
                  <td>
                    <div className="sa-name-cell">
                      <div className="sa-avatar">{getInitials(admin.name)}</div>
                      <span className="sa-name-text">{admin.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "#64748b" }}>{admin.phone}</td>
                  <td>
                    <span className={`status ${admin.active ? "active" : "inactive"}`}>
                      {admin.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn edit" onClick={() => startEdit(admin)}>Edit</button>
                      <button className="btn toggle" onClick={() => toggleStatus(admin.id || admin._id)}>{admin.active ? "Pause" : "Activate"}</button>
                      <button className="btn reset" onClick={() => openResetModal(admin)}>Reset Password</button>
                      <button className="btn delete" onClick={() => handleDelete(admin.id || admin._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ══ MOBILE CARDS ══ */}
      <div className="sa-card-list">
        {loading ? (
          <OwnerCardSkeleton count={4} actions={4} />
        ) : filteredAdmins.length === 0 ? (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "32px 0" }}>
            No sub admins found
          </p>
        ) : (
          filteredAdmins.map((admin, index) => (
            <div key={admin.id || admin._id} className="sa-card">
              <div className="sa-card-bar" />
              <div className="sa-card-body">
                <div className="sa-card-top">
                  <div className="sa-avatar sa-avatar-indexed">
                    <span className="sa-index-num">{index + 1}</span>
                    {getInitials(admin.name)}
                  </div>
                  <div className="sa-card-info">
                    <div className="sa-card-name">{admin.name}</div>
                    <div className="sa-card-phone">{admin.phone}</div>
                  </div>
                  <span className={`status ${admin.active ? "active" : "inactive"}`}>
                    {admin.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="sa-card-actions">
                  <button className="btn edit" onClick={() => startEdit(admin)}>Edit</button>
                  <button className="btn toggle" onClick={() => toggleStatus(admin.id || admin._id)}>{admin.active ? "Pause" : "Activate"}</button>
                  <button className="btn reset" onClick={() => openResetModal(admin)}>Reset Password</button>
                  <button className="btn delete" onClick={() => handleDelete(admin.id || admin._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ══ CREATE / EDIT MODAL ══ */}
      {showModal && (
        <div className="modal-backdrop-custom sa-modal-backdrop" onClick={closeModal}>
          <div className="modal-box sa-modal-box" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
              <h4 style={{ margin: 0, padding: 0, border: "none" }}>{editing ? "Update Sub Admin" : "Create Sub Admin"}</h4>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "18px", lineHeight: 1 }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="form-control mb-2" />
            <input
              type="tel"
              name="phone"
              placeholder="Enter 10-digit phone number"
              value={form.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 10) setForm({ ...form, phone: value });
              }}
              onKeyDown={(e) => {
                if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Tab") {
                  e.preventDefault();
                }
              }}
              className="form-control mb-2"
            />
            {!editing && (
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  className="form-control mb-2"
                />
                <span className="toggle-eye" onClick={() => setShowPassword(!showPassword)}>
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </span>
              </div>
            )}
            <div className="modal-footer-btns">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={editing ? handleUpdate : handleCreate}>
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ RESET PASSWORD MODAL ══ */}
      {resetModal && (
        <div className="modal-backdrop-custom sa-modal-backdrop" onClick={() => setResetModal(false)}>
          <div className="modal-box sa-modal-box" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <h4>Reset Password — {selectedAdmin?.name}</h4>
            <div className="password-field">
              <input
                type={showResetPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-control mb-2"
              />
              <span className="toggle-eye" onClick={() => setShowResetPassword(!showResetPassword)}>
                <i className={`bi ${showResetPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </span>
            </div>
            <div className="modal-footer-btns">
              <button className="btn btn-secondary" onClick={() => setResetModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={resetPassword}>Reset Password</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default SubAdminManagement;