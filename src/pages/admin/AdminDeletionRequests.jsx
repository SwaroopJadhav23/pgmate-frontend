import {useEffect, useState} from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";
import "./AdminDeletionRequests.css";

const AdminDeletionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // holds the id being acted on

  const handleDeleteNow = async (id) => {
    if (
      !window.confirm(
        "This will immediately delete the user's account. Continue?",
      )
    )
      return;
    setActionLoading(id);
    try {
      await api.post(`/admin/deletion-requests/${id}/delete-now`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? {...r, status: "COMPLETED"} : r)),
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (id) => {
    if (
      !window.confirm(
        "This will cancel the deletion request and restore the account. Continue?",
      )
    )
      return;
    setActionLoading(id);
    try {
      await api.post(`/admin/deletion-requests/${id}/restore`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? {...r, status: "CANCELLED"} : r)),
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to restore account");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    api
      .get("/admin/deletion-requests")
      .then((res) => setRequests(res.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const parseDate = (value) => {
    if (!value) return null;
    if (Array.isArray(value)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = value;
      return new Date(year, month - 1, day, hour, minute, second);
    }
    if (typeof value === "object" && value.$date) {
      return new Date(value.$date);
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const daysLeft = (scheduledDeletionAt) => {
    const target = parseDate(scheduledDeletionAt);
    if (!target) return 0;
    const diff = target - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const renderActions = (r) => {
    if (r.status !== "PENDING") return "—";
    return (
      <>
        <button
          className="del-btn del-btn--restore"
          onClick={() => handleRestore(r.id)}
          disabled={actionLoading === r.id}
        >
          Restore
        </button>
        <button
          className="del-btn del-btn--delete"
          onClick={() => handleDeleteNow(r.id)}
          disabled={actionLoading === r.id}
        >
          Delete Now
        </button>
      </>
    );
  };

  return (
    <DashboardLayout
      title="Account Deletion Requests"
      subtitle="User-submitted deletion requests"
    >
      {loading ? (
        <p>Loading…</p>
      ) : requests.length === 0 ? (
        <p className="del-empty">No deletion requests yet.</p>
      ) : (
        <>
          <div className="del-table-wrapper">
            <table className="del-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Reason</th>
                  <th>Requested On</th>
                  <th>Status</th>
                  <th>Days Left</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fullName}</td>
                    <td>{r.phone}</td>
                    <td>{r.email}</td>
                    <td className="del-reason-cell">{r.reason}</td>
                    <td>
                      {parseDate(r.requestedAt)?.toLocaleDateString("en-IN") ||
                        "—"}
                    </td>
                    <td>
                      <span className={`del-status-pill ${r.status}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === "PENDING" ? (
                        <span className="del-days-left">
                          {daysLeft(r.scheduledDeletionAt)} day(s)
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="del-actions">{renderActions(r)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="del-card-list">
            {requests.map((r) => (
              <div className="del-card" key={r.id}>
                <div className="del-card-top">
                  <div>
                    <div className="del-card-name">{r.fullName}</div>
                    <div className="del-card-sub">{r.phone}</div>
                    <div className="del-card-sub">{r.email}</div>
                  </div>
                  <span className={`del-status-pill ${r.status}`}>
                    {r.status}
                  </span>
                </div>

                <div className="del-card-row">
                  <span>Requested</span>
                  <span>
                    {parseDate(r.requestedAt)?.toLocaleDateString("en-IN") ||
                      "—"}
                  </span>
                </div>

                {r.status === "PENDING" && (
                  <div className="del-card-row">
                    <span>Days Left</span>
                    <span className="del-days-left">
                      {daysLeft(r.scheduledDeletionAt)} day(s)
                    </span>
                  </div>
                )}

                {r.reason && (
                  <div className="del-card-reason">{r.reason}</div>
                )}

                {r.status === "PENDING" && (
                  <div className="del-card-actions">
                    {renderActions(r)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminDeletionRequests;