import {useState, useEffect, useMemo} from "react";
import {Form} from "react-bootstrap";
import api from "../../../api/axios";
import "./Resident.css";
import "./Agreement.css";
import toast from "react-hot-toast";

const formatMoney = (value) =>
  `\u20B9${Number(value || 0).toLocaleString("en-IN")}`;

const ConfirmMoveInModal = ({
  show,
  onClose,
  resident,
  onSuccess,
  apiPrefix,
}) => {
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [futureDepositRefund, setFutureDepositRefund] = useState(0);
  const [dailyRent, setDailyRent] = useState(0);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [loading, setLoading] = useState(false);

  const isDaily = resident?.stayType === "DAILY_BASIC";

  useEffect(() => {
    if (resident) {
      setMonthlyRent(resident.monthlyRent || 0);
      setDeposit(resident.deposit || 0);
      setFutureDepositRefund(resident.futureDepositRefund || 0);
      setDailyRent(resident.dailyRent || 0);
      setNumberOfDays(resident.numberOfDays || 1);
    }
  }, [resident]);

  const total = useMemo(
    () =>
      isDaily
        ? Number(dailyRent || 0) * Number(numberOfDays || 0)
        : Number(monthlyRent || 0) + Number(deposit || 0),
    [isDaily, dailyRent, numberOfDays, monthlyRent, deposit],
  );

  const submit = async () => {
    const fd = new FormData();
    if (isDaily) {
      fd.append("newDailyRent", dailyRent);
      fd.append("newNumberOfDays", numberOfDays);
    } else {
      fd.append("newMonthlyRent", monthlyRent);
      fd.append("newDeposit", deposit);
      fd.append("newFutureDepositRefund", futureDepositRefund);
    }

    setLoading(true);
    try {
      await api.put(`${apiPrefix}/${resident.residentId}/approve`, fd);
      onSuccess();
      toast.success("Reservation approved. Waiting for tenant details.");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Approval failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!resident || !show) return null;

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-box">
        <div className="modal-header-custom">
          <h4>Approve Reservation</h4>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            x
          </button>
        </div>
        <div className="modal-body">
          <p className="fw-bold mb-1">
            {resident.name} ({resident.phone})
          </p>
          <p className="text-muted small mb-3">
            {isDaily ? "Daily Basic" : "Monthly Basic"}
          </p>
          
          {isDaily ? (
            <>
              <Form.Group className="mb-2">
                <Form.Label>Daily Rent</Form.Label>
                <Form.Control
                  type="number"
                  maxLength="10"
                  value={dailyRent}
                  onChange={(e) => setDailyRent(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Number of Days</Form.Label>
                <Form.Control
                  type="number"
                  maxLength="10"
                  value={numberOfDays}
                  onChange={(e) => setNumberOfDays(e.target.value)}
                />
              </Form.Group>
            </>
          ) : (
            <>
              <Form.Group className="mb-2">
                <Form.Label>Monthly Rent</Form.Label>
                <Form.Control
                  type="number"
                  maxLength="10"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Deposit</Form.Label>
                <Form.Control
                  type="number"
                  maxLength="10"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Future Refund Amount (After checkout)</Form.Label>
                <Form.Control
                  type="number"
                  maxLength="10"
                  value={futureDepositRefund}
                  onChange={(e) => setFutureDepositRefund(e.target.value)}
                />
              </Form.Group>
            </>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Total Payable (Auto Calculated)</Form.Label>
            <Form.Control type="text" value={formatMoney(total)} disabled />
          </Form.Group>
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="modal-btn success"
            disabled={loading}
            onClick={submit}
          >
            {loading ? "Approving..." : "Approve & Request Details"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmMoveInModal;