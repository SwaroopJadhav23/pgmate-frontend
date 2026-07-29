import {useEffect, useState} from "react";
import api from "../../api/axios";
import DashboardLayout from "../../layouts/DashboardLayout";

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

  const statusColor = (status) =>
    status === "PENDING"
      ? "#f59e0b"
      : status === "COMPLETED"
        ? "#dc2626"
        : "#64748b";

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
        <div style={{overflowX: "auto"}}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
            }}
          >
            <thead>
              <tr
                style={{textAlign: "left", borderBottom: "2px solid #e5e7eb"}}
              >
                <th style={{padding: "10px"}}>Name</th>
                <th style={{padding: "10px"}}>Phone</th>
                <th style={{padding: "10px"}}>Email</th>
                <th style={{padding: "10px"}}>Reason</th>
                <th style={{padding: "10px"}}>Requested On</th>
                <th style={{padding: "10px"}}>Status</th>
                <th style={{padding: "10px"}}>Days Left</th>
                <th style={{padding: "10px"}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{borderBottom: "1px solid #f1f5f9"}}>
                  <td style={{padding: "10px"}}>{r.fullName}</td>
                  <td style={{padding: "10px"}}>{r.phone}</td>
                  <td style={{padding: "10px"}}>{r.email}</td>
                  <td style={{padding: "10px", maxWidth: "260px"}}>
                    {r.reason}
                  </td>
                  <td style={{padding: "10px"}}>
                    {parseDate(r.requestedAt)?.toLocaleDateString("en-IN") ||
                      "—"}
                  </td>
                  <td style={{padding: "10px"}}>
                    <span
                      style={{color: statusColor(r.status), fontWeight: 600}}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{padding: "10px"}}>
                    {r.status === "PENDING"
                      ? `${daysLeft(r.scheduledDeletionAt)} day(s)`
                      : "—"}
                  </td>
                  <td style={{padding: "10px"}}>
                    {r.status === "PENDING" ? (
                      <div style={{display: "flex", gap: "8px"}}>
                        <button
                          onClick={() => handleRestore(r.id)}
                          disabled={actionLoading === r.id}
                          style={{
                            background: "#16a34a",
                            color: "#fff",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDeleteNow(r.id)}
                          disabled={actionLoading === r.id}
                          style={{
                            background: "#dc2626",
                            color: "#fff",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
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
