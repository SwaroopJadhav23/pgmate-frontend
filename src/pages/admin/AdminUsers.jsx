import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../api/axios";
import "./AdminUsers.css";
// eslint-disable-next-line no-unused-vars
import { OwnerCardSkeleton, TableSkeleton } from "../public/Skeleton";

const PAGE_SIZE = 20;

const getInitials = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const UserAvatar = ({ name, profilePicUrl, onPreview }) => (
  profilePicUrl ? (
    <img
      src={profilePicUrl}
      alt={name || "User"}
      className="user-avatar user-avatar-image cursor-pointer"
      onClick={() => onPreview(profilePicUrl)}
    />
  ) : (
    <div className="user-avatar">{getInitials(name)}</div>
  )
);

const DocumentLink = ({ url, onPreview, emptyLabel = "Not uploaded" }) => (
  url ? (
    <button
      className="user-doc-link"
      onClick={() => onPreview(url)}
    >
      <i className="bi bi-file-earmark-text"></i>
      View
    </button>
  ) : (
    <span className="user-doc-empty">{emptyLabel}</span>
  )
);

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cityFilter, setCityFilter] = useState("");
  const [cities, setCities] = useState([]);
  const [sortOrder, setSortOrder] = useState("");

  const stats = {
    total: totalElements,
    active: users.filter((u) => u.active).length,
    paused: users.filter((u) => !u.active).length,
    cities: cities.length,
  };

  const loadUsers = useCallback(async (nextPage = 0, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      params.append("page", nextPage);
      params.append("size", PAGE_SIZE);

      if (search) params.append("search", search);
      if (cityFilter) params.append("city", cityFilter);
      if (sortOrder) params.append("sort", sortOrder);

      const res = await api.get(`/admin/users/paged?${params.toString()}`);
      const content = res.data?.content || [];
      const totalPages = res.data?.totalPages || 0;

      setUsers((prev) => (append ? [...prev, ...content] : content));
      setPage(nextPage);
      setTotalElements(res.data?.totalElements || 0);
      setHasMore(nextPage + 1 < totalPages);

    } catch {
      alert("Failed to load users");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cityFilter, sortOrder, search]);

  const loadCities = async () => {
    try {
      const res = await api.get("/admin/users/cities");
      setCities(res.data || []);
    } catch {
      console.log("Failed to load cities");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadUsers(0, false);
  }, [loadUsers]);

  useEffect(() => {
    loadCities();
  }, []);

  const formatCity = (city) => {
    if (!city) return "";
    return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  };

  const reloadFirstPage = () => loadUsers(0, false);

  const toggleStatus = async (id, active) => {
    await api.put(`/admin/users/${id}/${active ? "deactivate" : "activate"}`);
    reloadFirstPage();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    await api.delete(`/admin/users/${id}`);
    reloadFirstPage();
  };

  const copyPhone = (phone, id) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const PhoneActions = ({ phone, id }) => (
    <div className="phone-wrapper">
      <span className="phone-number">{phone || "-"}</span>
      {phone && (
        <>
          <button className="icon-btn" title="Copy" onClick={() => copyPhone(phone, id)}>
            <i className={`bi ${copiedId === id ? "bi-check2 text-success" : "bi-copy"}`}></i>
          </button>
          <a href={`tel:${phone}`} className="icon-btn" title="Call">
            <i className="bi bi-telephone-fill text-success"></i>
          </a>
          <a href={`https://wa.me/91${phone}`} target="_blank" rel="noopener noreferrer" className="icon-btn" title="WhatsApp">
            <i className="bi bi-whatsapp text-success"></i>
          </a>
        </>
      )}
    </div>
  );

  return (
    <DashboardLayout
      title="Users"
      subtitle="All registered users (excluding owners & admins)"
    >
      <div className="users-management">
        {/* STAT CARDS */}
        <div className="users-stats-row">
          <div className="users-stat-card user-stat-total">
            <div className="users-stat-icon user-stat-total-icon">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="users-stat-info">
              <div className="users-stat-value">{loading ? "—" : stats.total}</div>
              <div className="users-stat-label">Total Users</div>
              <div className="users-stat-sub">Registered on platform</div>
            </div>
          </div>

          <div className="users-stat-card user-stat-active">
            <div className="users-stat-icon user-stat-active-icon">
              <i className="bi bi-person-check-fill"></i>
            </div>
            <div className="users-stat-info">
              <div className="users-stat-value">{loading ? "—" : stats.active}</div>
              <div className="users-stat-label">Active Users</div>
              <div className="users-stat-sub">Currently active</div>
            </div>
          </div>

          <div className="users-stat-card user-stat-block">
            <div className="users-stat-icon user-stat-block-icon">
              <i className="bi bi-person-x-fill"></i>
            </div>
            <div className="users-stat-info">
              <div className="users-stat-value">{loading ? "—" : stats.paused}</div>
              <div className="users-stat-label">Paused Users</div>
              <div className="users-stat-sub">Inactive accounts</div>
            </div>
          </div>

          <div className="users-stat-card user-stat-verify">
            <div className="users-stat-icon user-stat-verify-icon">
              <i className="bi bi-geo-alt-fill"></i>
            </div>
            <div className="users-stat-info">
              <div className="users-stat-value">{loading ? "—" : stats.cities}</div>
              <div className="users-stat-label">Total Cities</div>
              <div className="users-stat-sub">Cities covered</div>
            </div>
          </div>
        </div>


        <div className="users-top-bar">
          <div className="users-search-wrapper">
            <i className="bi bi-search search-icon"></i>
            <input
              className="form-control users-search"
              placeholder="Search by name, email, phone or city..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="users-filters-row">
            <select
              className="form-control users-city-filter"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              style={{ marginLeft: "10px", width: "160px" }}
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {formatCity(city)}
                </option>
              ))}
            </select>

            <select
              className="form-select user-filter-select users-city-filter"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="">Sort: A → Z</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <span className="users-count-badge">
            {totalElements} user{totalElements !== 1 ? "s" : ""}
          </span>
        </div>

        <p className="users-result-count">
          Showing <strong>{users.length}</strong> of {totalElements} users
        </p>

        <div className="users-table-wrapper">
          <table className="table pg-table mb-0">
            <thead>
              <tr>
                <th>SR.No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>PG</th>
                <th>ID Proof</th>
                <th className="text-center">Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={6} cols={9} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="9" className="users-empty">
                    {search ? `No users found for "${search}"` : "No users found"}
                  </td>
                </tr>
              ) : (
                users.map((u, index) => (
                  <tr key={u.id}>
                    <td className="user-table-muted-bold">
                      {page * PAGE_SIZE + index + 1}
                    </td>
                    <td>
                      <div className="user-name-cell">
                        <UserAvatar
                          name={u.name}
                          profilePicUrl={u.profilePicUrl}
                          onPreview={setPreviewUrl}
                        />
                        <span className="user-name-text">{u.name || "-"}</span>
                      </div>
                    </td>
                    <td className="user-table-muted">{u.email || "-"}</td>
                    <td className="user-table-muted">{u.phone || "-"}</td>
                    <td className="user-table-muted">{u.city || "-"}</td>
                    <td className="user-table-id">
                      {u.pgName || "—"}
                    </td>
                    <td>
                      <DocumentLink
                        url={u.idProofUrl}
                        onPreview={setPreviewUrl}
                      />
                    </td>
                    <td className="text-center">
                      <span className={`user-status ${u.active ? "active" : "paused"}`}>
                        {u.active ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          className={u.active ? "btn-action-pause" : "btn-action-activate"}
                          onClick={() => toggleStatus(u.id, u.active)}
                        >
                          {u.active ? "Pause" : "Activate"}
                        </button>
                        <button className="btn-action-delete" onClick={() => remove(u.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ══ MOBILE CARDS ══ */}
        <div className="users-card-list">
          {loading ? (
            <OwnerCardSkeleton count={4} />
          ) : users.length === 0 ? (
            <div className="users-empty">
              {search ? `No users found for "${search}"` : "No users found"}
            </div>
          ) : (
            users.map((u, index) => (
              <div key={u.id} className="user-card">
                <div className={`user-card-bar ${u.active ? "" : "paused"}`} />
                <div className="user-card-body">

                  <div className="user-card-id-text">
                    #{page * PAGE_SIZE + index + 1}
                  </div>

                  {/* Name + Status row */}
                  <div className="user-card-top">
                    <div className="user-card-title-flex">
                      <UserAvatar
                        name={u.name}
                        profilePicUrl={u.profilePicUrl}
                        onPreview={setPreviewUrl}
                      />
                      <div className="user-card-info">
                        <div className="user-card-name">{u.name || "-"}</div>
                        <div className="user-card-email">{u.email || "-"}</div>
                      </div>
                    </div>
                    <span className={`user-status ${u.active ? "active" : "paused"}`}>
                      {u.active ? "Active" : "Paused"}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="user-card-phone">
                    <PhoneActions phone={u.phone} id={`card-${u.id}`} />
                  </div>

                  {/* Meta pills */}
                  <div className="user-card-meta">
                    {u.city && (
                      <div className="user-card-meta-item">
                        <i className="bi bi-geo-alt-fill"></i>{u.city}
                      </div>
                    )}
                    {u.pgName && (
                      <div className="user-card-meta-item">
                        <i className="bi bi-building"></i>{u.pgName}
                      </div>
                    )}
                  </div>

                  {/* ID Proof */}
                  {u.idProofUrl && (
                    <div className="user-card-doc-wrapper">
                      <span className="user-card-doc-label">
                        ID Proof
                      </span>
                      <DocumentLink url={u.idProofUrl} onPreview={setPreviewUrl} />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="user-card-action-flex user-card-action-container">
                    <button
                      className={`${u.active ? "btn-action-pause" : "btn-action-activate"} user-card-action-btn`}
                      onClick={() => toggleStatus(u.id, u.active)}
                    >
                      {u.active ? "Pause" : "Activate"}
                    </button>
                    <button
                      className="btn-action-delete user-card-action-btn"
                      onClick={() => remove(u.id)}
                    >
                      Delete
                    </button>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {hasMore && !loading && (
          <div className="users-load-more-wrap">
            <button
              className="users-load-more-btn"
              onClick={() => loadUsers(page + 1, true)}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>

      {
        previewUrl && (
          <div
            className="modal-backdrop-custom"
            onClick={() => setPreviewUrl(null)}
          >
            <div
              className="modal-box modal-box-wide"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-custom">
                <h4>Preview</h4>
                <button
                  className="modal-close"
                  onClick={() => setPreviewUrl(null)}
                >
                  ✕
                </button>
              </div>

              <div className="preview-container">
                {previewUrl?.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={previewUrl}
                    title="Document"
                    className="doc-iframe"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Document Preview"
                    className="doc-img"
                  />
                )}
              </div>
            </div>
          </div>
        )
      }
    </DashboardLayout >
  );
};

export default AdminUsers;