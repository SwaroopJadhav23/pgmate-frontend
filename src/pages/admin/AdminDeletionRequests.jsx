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

    // Array format: [year, month, day, hour, minute, second, nano] — month is 1-indexed
    if (Array.isArray(value)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = value;
      return new Date(year, month - 1, day, hour, minute, second);
    }

    // Mongo extended JSON: { "$date": "..." }
    if (typeof value === "object" && value.$date) {
      return new Date(value.$date);
    }

    // ISO string or timestamp number
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const daysLeft = (scheduledDeletionAt) => {
    const target = parseDate(scheduledDeletionAt);
    if (!target) return 0;
    const diff = target - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <DashboardLayout
      title="Account Deletion Requests"
      subtitle="User-submitted deletion requests"
    >
      {loading ? (
        <p>Loading…</p>
      ) : requests.length === 0 ? (
        <p style={{color: "#64748b"}}>No deletion requests yet.</p>
      ) : (
          <div className="adr-table-container">
          <table className="adr-table">
            <thead>
              <tr>
                <th className="adr-th">Name</th>
                <th className="adr-th">Phone</th>
                <th className="adr-th">Email</th>
                <th className="adr-th">Reason</th>
                <th className="adr-th">Requested On</th>
                <th className="adr-th">Status</th>
                <th className="adr-th">Days Left</th>
                <th className="adr-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="adr-tr">
                  <td data-label="Name" className="adr-td">{r.fullName}</td>
                  <td data-label="Phone" className="adr-td">{r.phone}</td>
                  <td data-label="Email" className="adr-td">{r.email}</td>
                  <td data-label="Reason" className="adr-td">
                    <span className="adr-reason">{r.reason}</span>
                  </td>
                  <td data-label="Requested On" className="adr-td">
                    {parseDate(r.requestedAt)?.toLocaleDateString("en-IN") ||
                      "—"}
                  </td>
                  <td data-label="Status" className="adr-td">
                    <span
                      className={`adr-status adr-status-${r.status.toLowerCase()}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td data-label="Days Left" className="adr-td">
                    {r.status === "PENDING"
                      ? `${daysLeft(r.scheduledDeletionAt)} day(s)`
                      : "—"}
                  </td>
                  <td data-label="Actions" className="adr-td">
                    {r.status === "PENDING" ? (
                      <div className="adr-actions">
                        <button
                          className="adr-btn adr-btn-restore"
                          onClick={() => handleRestore(r.id)}
                          disabled={actionLoading === r.id}
                        >
                          Restore
                        </button>
                        <button
                          className="adr-btn adr-btn-danger"
                          onClick={() => handleDeleteNow(r.id)}
                          disabled={actionLoading === r.id}
                        >
                          Delete Now
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDeletionRequests;
