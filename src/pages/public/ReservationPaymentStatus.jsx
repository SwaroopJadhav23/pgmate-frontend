import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

const ReservationPaymentStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const merchantOrderId = searchParams.get("merchantOrderId");
  const paymentToken = searchParams.get("paymentToken");
  const [status, setStatus] = useState("LOADING");
  const [message, setMessage] = useState("Checking reservation status...");
  const [details, setDetails] = useState(null);
  const pollRef = useRef(null);
  const authToken = localStorage.getItem("token");

  useEffect(() => {
    const clearPoll = () => {
      if (pollRef.current) {
        clearTimeout(pollRef.current);
        pollRef.current = null;
      }
    };

    const loadStatus = async () => {
      if (!merchantOrderId || !paymentToken) {
        setStatus("ERROR");
        setMessage("The reservation redirect link is incomplete. Please retry the reservation flow.");
        return;
      }

      try {
        const res = await api.get("/public/reservation/payment-status", {
          params: { merchantOrderId, paymentToken },
        });

        const data = res.data || {};
        const nextStatus = data.status || "ERROR";
        setDetails(data);
        setStatus(nextStatus);
        setMessage(data.message || "Reservation payment status updated.");

        if (nextStatus === "COMPLETED" && data.reservationCreated) {
          if (authToken) {
            navigate("/my-pg?tab=PENDING", { replace: true });
            return;
          }
        }

        if (nextStatus === "PENDING" || nextStatus === "REDIRECT_REQUIRED") {
          clearPoll();
          pollRef.current = setTimeout(loadStatus, 4000);
        }
      } catch (err) {
        setStatus("ERROR");
        setMessage(err.response?.data?.message || "Could not verify reservation status.");
      }
    };

    loadStatus();
    return clearPoll;
  }, [authToken, merchantOrderId, navigate, paymentToken]);

  const title =
    status === "COMPLETED"
      ? "Reservation Confirmed"
      : status === "FAILED" || status === "EXPIRED"
      ? "Reservation Not Completed"
      : status === "PENDING" || status === "REDIRECT_REQUIRED"
      ? "Reservation Payment In Progress"
      : "Reservation Status";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="mb-3">
          <h2 style={{ marginBottom: 8 }}>{title}</h2>
          <p style={{ color: "#475569" }}>{message}</p>
        </div>

        <div className="card p-4" style={{ background: "#fff", borderRadius: 18, boxShadow: "0 18px 50px rgba(15,23,42,0.08)" }}>
          <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
            <div><strong>Order ID:</strong> {merchantOrderId || "N/A"}</div>
            <div><strong>Gateway State:</strong> {details?.gatewayState || "-"}</div>
            <div><strong>Reservation Amount:</strong> Rs {details?.reservationAmount ?? 0}</div>
            <div><strong>Stay Type:</strong> {details?.stayType || "-"}</div>
            <div><strong>Check-in Date:</strong> {details?.checkinDate || "-"}</div>
            <div><strong>Reservation Created:</strong> {details?.reservationCreated ? "Yes" : "No"}</div>
          </div>

          {details?.reservationCreated && (
            <div style={{ padding: 14, borderRadius: 14, background: "#ecfdf5", color: "#166534", fontWeight: 700, marginBottom: 18 }}>
              Your reservation is confirmed. Log in to view your booking details.
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link to="/" className="btn btn-primary">
              Back to Home
            </Link>
            <Link to="/login" className="btn btn-outline-secondary">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPaymentStatus;
