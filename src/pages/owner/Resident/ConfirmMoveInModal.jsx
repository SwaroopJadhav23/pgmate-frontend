import {  } from "react-icons/fa";
import {useState, useRef, useEffect, useMemo} from "react";
import {Form} from "react-bootstrap";
import api from "../../../api/axios";
import "./Resident.css";
import "./Agreement.css";
import toast from "react-hot-toast";
// eslint-disable-next-line
import AgreementSignaturePad from "./AgreementSignaturePad";

const PAYMENT_MODES = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "WALLET",
];
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
  const [dailyRent, setDailyRent] = useState(0);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [mode, setMode] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  // Agreement / Signature state
  // eslint-disable-next-line
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  // eslint-disable-next-line
  const [showAgreement, setShowAgreement] = useState(false);
  const [foodPreference, setFoodPreference] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("");
  const isDaily = resident?.stayType === "DAILY_BASIC";

  useEffect(() => {
    if (resident) {
      setMonthlyRent(resident.monthlyRent || 0);
      setDeposit(resident.deposit || 0);
      setDailyRent(resident.dailyRent || 0);
      setNumberOfDays(resident.numberOfDays || 1);
      setFoodPreference(resident.foodPreference || "");
      setEmergencyContactName(resident.emergencyContactName || "");
      setEmergencyContact(resident.emergencyContact || "");
      setEmergencyContactRelation(resident.emergencyContactRelation || "");
      setSignatureDataUrl(null);
      setShowAgreement(false);
    }
  }, [resident]);

  useEffect(() => {
    if (mode === "CASH") {
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [mode]);

  const total = useMemo(
    () =>
      isDaily
        ? Number(dailyRent || 0) * Number(numberOfDays || 0)
        : Number(monthlyRent || 0) + Number(deposit || 0),
    [isDaily, dailyRent, numberOfDays, monthlyRent, deposit],
  );
 // eslint-disable-next-line
  const dataUrlToFile = (dataUrl, filename) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, {type: mime});
  };

  const submit = async () => {
    if (!mode) {
      toast("Please select a payment mode.", { icon: "⚠️" });
      return;
    }
    if (mode !== "CASH" && !file) {
      toast("Payment proof is required for non-cash payments.", { icon: "⚠️" });
      return;
    }
    // if (!signatureDataUrl) {
    //   await Swal.fire({
    //     icon: "warning",
    //     title: "Signature Required",
    //     text: "Please collect the tenant's signature on the agreement before confirming move-in.",
    //     confirmButtonColor: "#5B5BD6",
    //   });
    //   setShowAgreement(true);
    //   return;
    // }

    const fd = new FormData();
    if (isDaily) {
      fd.append("newDailyRent", dailyRent);
      fd.append("newNumberOfDays", numberOfDays);
    } else {
      fd.append("newMonthlyRent", monthlyRent);
      fd.append("newDeposit", deposit);
    }
    fd.append("onboardingPaymentMode", mode);
    if (mode !== "CASH") fd.append("onboardingPaymentProof", file);
    if (foodPreference) fd.append("foodPreference", foodPreference);
    if (emergencyContactName)
      fd.append("emergencyContactName", emergencyContactName);
    if (emergencyContact) fd.append("emergencyContact", emergencyContact);
    if (emergencyContactRelation)
      fd.append("emergencyContactRelation", emergencyContactRelation);
    // Attach signature
    // const sigFile = dataUrlToFile(signatureDataUrl, "agreement_signature.png");
    // fd.append("agreementSignature", sigFile);

    setLoading(true);
    try {
      await api.put(`${apiPrefix}/${resident.residentId}/confirm`, fd);
      onSuccess();
      toast.success("Resident successfully checked in.");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Move-in confirmation failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!resident || !show) return null;

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-box">
        <div className="modal-header-custom">
          <h4>Confirm Move-in</h4>
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
          <Form.Group className="mb-3">
            <Form.Label>Food Preference</Form.Label>
            <Form.Select
              value={foodPreference}
              onChange={(e) => setFoodPreference(e.target.value)}
            >
              <option value="">Select</option>
              <option value="VEG">Veg</option>
              <option value="NON_VEG">Non-Veg</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Emergency Contact Name</Form.Label>
            <Form.Control
              placeholder="Enter name"
              value={emergencyContactName}
              onChange={(e) =>
                setEmergencyContactName(e.target.value.trimStart())
              }
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Emergency Contact Number</Form.Label>
            <Form.Control
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10 digit number"
              value={emergencyContact}
              onChange={(e) =>
                setEmergencyContact(
                  e.target.value.replace(/\D/g, "").slice(0, 10),
                )
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Relation</Form.Label>
            <Form.Select
              value={emergencyContactRelation}
              onChange={(e) => setEmergencyContactRelation(e.target.value)}
            >
              <option value="">Select Relation</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Brother">Brother</option>
              <option value="Sister">Sister</option>
              <option value="Spouse">Spouse</option>
              <option value="Son">Son</option>
              <option value="Daughter">Daughter</option>
              <option value="Friend">Friend</option>
              <option value="Relative">Relative</option>
              <option value="Other">Other</option>
            </Form.Select>
          </Form.Group>
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
            </>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Total Payable (Auto Calculated)</Form.Label>
            <Form.Control type="text" value={formatMoney(total)} disabled />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Payment Mode</Form.Label>
            <Form.Select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="">Select</option>
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>
                  {m.replace("_", " ")}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Payment Proof</Form.Label>
            <Form.Control
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              disabled={mode === "CASH"}
              onChange={(e) => setFile(e.target.files[0])}
            />
            {mode === "CASH" && (
              <small className="text-muted">
                Payment proof not required for cash
              </small>
            )}
          </Form.Group>

          {/* ─── Agreement + Signature ─── */}
          {/* <div className="mt-2">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: signatureDataUrl ? "#d1fae5" : "#eff6ff",
                border: `1px solid ${signatureDataUrl ? "#a7f3d0" : "#bfdbfe"}`,
                borderRadius: 8,
                padding: "10px 14px",
                cursor: "pointer",
              }}
              onClick={() => setShowAgreement(!showAgreement)}
            >
              <div style={{display: "flex", alignItems: "center", gap: 8}}>
                <span style={{fontSize: 18}}>
                  {signatureDataUrl ? <FaCheckCircle color="#22c55e" /> : <FaFileAlt />}
                </span>
                <div>
                  <div
                    style={{fontWeight: 600, fontSize: 13, color: "#1e3a5f"}}
                  >
                    Rental Agreement & Signature
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: signatureDataUrl ? "#065f46" : "#6b7280",
                    }}
                  >
                    {signatureDataUrl
                      ? "Tenant has signed the agreement ✓"
                      : "Tenant signature required *"}
                  </div>
                </div>
              </div>
              <span style={{fontSize: 18, color: "#6b7280"}}>
                {showAgreement ? "▲" : "▼"}
              </span>
            </div>

            {showAgreement && (
              <AgreementSignaturePad
                residentName={resident.name}
                pgName={resident.pgName}
                monthlyRent={isDaily ? dailyRent : monthlyRent}
                checkinDate={resident.checkinDate}
                signatureDataUrl={signatureDataUrl}
                onSigned={(url) => setSignatureDataUrl(url)}
                onClear={() => setSignatureDataUrl(null)}
              />
            )}
          </div> */}
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
            {loading ? "Confirming..." : "Confirm Move-in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmMoveInModal;