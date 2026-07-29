import { } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form } from "react-bootstrap";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { digitsOnly, isValidEmail, isValidPhone } from "../../../utils/formValidators";
// import AgreementSignaturePad from "./AgreementSignaturePad";
import "./Resident.css";
import "./Agreement.css";
import "./AddResidentModal.css";   // ← contains the scroll fix

const EMPTY_FORM = {
  pgId: "",
  floorId: "",
  roomId: "",
  bedId: "",
  name: "",
  phone: "",
  email: "",
  foodPreference: "",
  emergencyContact: "",
  emergencyContactName: "",
  emergencyContactRelation: "",
  stayType: "MONTHLY_BASIC",
  monthlyRent: "",
  deposit: "",
  dailyRent: "",
  numberOfDays: "",
  onboardingPaymentMode: "",
  checkinDate: "",
  expectedCheckoutDate: "",
};

const PAYMENT_MODES = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "WALLET"];

const AddTenantPage = ({ onSuccess, prefill, apiPrefix }) => {
  const navigate = useNavigate();
  const pgEndpoint = apiPrefix === "/manager/residents" ? "/manager/pg/my" : "/owner/pgs";
  const floorEndpoint = apiPrefix === "/manager/residents" ? "/manager/floors" : "/owner/floors";
  const roomEndpoint = apiPrefix === "/manager/residents" ? "/manager/rooms" : "/owner/rooms";
  const bedEndpoint = apiPrefix === "/manager/residents" ? "/manager/beds" : "/owner/beds";
  const residentEndpoint = apiPrefix || "/owner/residents";

  const [form, setForm] = useState(EMPTY_FORM);
  const [pgs, setPgs] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [idProof, setIdProof] = useState(null);
  // eslint-disable-next-line
  {/*const [signatureDataUrl, setSignatureDataUrl] = useState(null);*/ }
  // eslint-disable-next-line
  {/*const [showAgreement, setShowAgreement] = useState(false);*/ }

  // ── pre-fill ──────────────────────────────────────────────────────
  // Reset everything when modal opens
  useEffect(() => {
    setForm({
      ...EMPTY_FORM,
      pgId: prefill?.pgId || "",
      floorId: prefill?.floorId || "",
      roomId: prefill?.roomId || "",
      bedId: prefill?.bedId || "",
    });
    setFile(null);
    setIdProof(null);
  }, [prefill]);

  // prefill effect — fix ...prev bug too
  useEffect(() => {
    if (prefill) {
      setForm({
        ...EMPTY_FORM,             // ← EMPTY_FORM not ...prev
        pgId: prefill.pgId || "",
        floorId: prefill.floorId || "",
        roomId: prefill.roomId || "",
        bedId: prefill.bedId || "",
      });
    }
  }, [prefill]);

  // ── cascading dropdowns ───────────────────────────────────────────
  useEffect(() => {
    api.get(pgEndpoint).then((res) => setPgs(res.data || []));
  }, [pgEndpoint]);

  useEffect(() => {
    if (form.pgId) {
      api.get(`${floorEndpoint}/pg/${form.pgId}`).then((res) => setFloors(res.data || []));
    } else {
      setFloors([]); setRooms([]); setBeds([]);
    }
  }, [form.pgId, floorEndpoint]);

  useEffect(() => {
    if (form.floorId) {
      api.get(`${roomEndpoint}?floorId=${form.floorId}`).then((res) => setRooms(res.data || []));
    } else {
      setRooms([]); setBeds([]);
    }
  }, [form.floorId, roomEndpoint]);

  useEffect(() => {
    if (form.roomId) {
      api.get(`${bedEndpoint}?roomId=${form.roomId}`).then((res) =>
        setBeds((res.data || []).filter((b) => b.status === "AVAILABLE"))
      );
    } else {
      setBeds([]);
    }
  }, [form.roomId, bedEndpoint]);

  // ── auto-select when only one option ────────────────────────────
  useEffect(() => {
    if (pgs.length === 1 && !form.pgId) {
      setForm((prev) => ({ ...prev, pgId: pgs[0].id }));
    }
    // eslint-disable-next-line
  }, [pgs]);

  useEffect(() => {
    if (floors.length === 1 && !form.floorId) {
      setForm((prev) => ({ ...prev, floorId: floors[0].id }));
    }
    // eslint-disable-next-line
  }, [floors]);

  useEffect(() => {
    if (rooms.length === 1 && !form.roomId) {
      const room = rooms[0];
      setForm((prev) => ({
        ...prev,
        roomId: room.id,
        monthlyRent: room.monthlyRent ?? "",
        deposit: room.deposit ?? "",
        dailyRent: room.dailyRent ?? "",
      }));
    }
    // eslint-disable-next-line
  }, [rooms]);

  useEffect(() => {
    if (beds.length === 1 && !form.bedId) {
      setForm((prev) => ({ ...prev, bedId: beds[0].id }));
    }
    // eslint-disable-next-line
  }, [beds]);

  // ── auto checkout date ────────────────────────────────────────────
  useEffect(() => {
    if (!form.checkinDate) return;
    if (form.stayType === "MONTHLY_BASIC" && !form.expectedCheckoutDate) {
      const next = new Date(form.checkinDate);
      next.setMonth(next.getMonth() + 1);
      setForm((prev) => ({ ...prev, expectedCheckoutDate: next.toISOString().split("T")[0] }));
    }
  }, [form.checkinDate, form.expectedCheckoutDate, form.stayType]);

  // ── derived ───────────────────────────────────────────────────────
  const selectedRoom = useMemo(() => rooms.find((r) => r.id === form.roomId), [rooms, form.roomId]);
  // eslint-disable-next-line
  const selectedPgName = useMemo(() => pgs.find((p) => p.id === form.pgId)?.name || prefill?.pgName || "", [pgs, form.pgId, prefill]);
  const isDaily = form.stayType === "DAILY_BASIC";
  const total = isDaily
    ? Number(form.dailyRent || 0) * Number(form.numberOfDays || 0)
    : Number(form.monthlyRent || 0) + Number(form.deposit || 0);

  // ── helpers ───────────────────────────────────────────────────────
  // eslint-disable-next-line
  const dataUrlToFile = (dataUrl, filename) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    return new File([u8], filename, { type: mime });
  };

  // ── submit ────────────────────────────────────────────────────────
  const submit = async () => {
    if (!form.pgId || !form.floorId || !form.roomId || !form.bedId) {
      toast("Please select PG, Floor, Room and Bed.", { icon: "⚠️" });
      return;
    }

    const basicIncomplete = !form.name.trim() || !form.phone || !form.onboardingPaymentMode || !form.checkinDate;
    const monthlyIncomplete = !isDaily && (!form.monthlyRent || form.deposit === "");
    const dailyIncomplete = isDaily && (!form.dailyRent || !form.numberOfDays);

    if (basicIncomplete || monthlyIncomplete || dailyIncomplete) {
      toast("Please fill all required fields.", { icon: "⚠️" });
      return;
    }
    if (form.phone.length !== 10) {
      toast("Phone must be exactly 10 digits.", { icon: "⚠️" });
      return;
    }
    if (!isValidPhone(form.phone)) {
      toast("Enter valid phone number.", { icon: "⚠️" });
      return;
    }
    if (form.email && !isValidEmail(form.email)) {
      toast("Please enter a valid email address.", { icon: "⚠️" });
      return;
    }
    // eslint-disable-next-line
    {/*
    if (!signatureDataUrl) {
      await Swal.fire({ icon: "warning", title: "Signature Required", text: "Please collect the tenant's signature on the agreement before saving.", confirmButtonColor: "#5B5BD6" });
      setShowAgreement(true);
      return;
    }
      */}

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
    if (file) fd.append("onboardingPaymentProof", file);
    fd.append("idProof", idProof);
    // eslint-disable-next-line
    {/*fd.append("agreementSignature", dataUrlToFile(signatureDataUrl, "agreement_signature.png")); */ }

    setLoading(true);
    try {
      await api.post(residentEndpoint, fd);
      toast.success("Resident Added successfully.");
      onSuccess?.();
      navigate(-1); // go back to Tenants list
    } catch {
      toast.error("Failed to add resident.");
    } finally {
      setLoading(false);
    }
  };

  // ── progress calculation ──────────────────────────────────────────
  const requiredChecks = [
    !!form.pgId,
    !!form.floorId,
    !!form.roomId,
    !!form.bedId,
    form.name.trim().length > 0,
    form.phone.length === 10,
    form.email.trim().length > 0,
    !!form.foodPreference,
    !!form.onboardingPaymentMode,
    !!form.checkinDate,
    !!form.expectedCheckoutDate,
    !!idProof,
    isDaily ? Number(form.dailyRent) > 0 : Number(form.monthlyRent) > 0,
    isDaily ? Number(form.numberOfDays) > 0 : form.deposit !== "",
  ];
  const filledCount = requiredChecks.filter(Boolean).length;
  const progressPct = Math.round((filledCount / requiredChecks.length) * 100);

  return (
    <DashboardLayout
      title="Add Tenant"
      subtitle="Add new tenant and room details"
      rightAction={
        <div className="arm-header-actions">
          <button className="arm-btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button className="arm-btn-primary" disabled={loading} onClick={submit}>
            {loading ? "Saving…" : "Save Tenant"}
          </button>
        </div>
      }
    >
      <div className="arm-page">

        {/* ── Stepper ── */}
        <div className="arm-stepper">
          <div className="arm-step">
            <div className="arm-step-circle active">1</div>
            <span className="arm-step-label active">Tenant Information</span>
          </div>

          <div className="arm-step-line">
            <div className="arm-step-line-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="arm-step">
            <div className={`arm-step-circle ${progressPct === 100 ? "active" : ""}`}>2</div>
            <span className={`arm-step-label ${progressPct === 100 ? "active" : ""}`}>Review &amp; Save</span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="arm-page-body">

          {/* Location */}
          <div className="arm-grid">
            {/* PG — own row, pairs with Floor on desktop via arm-row-4, full-width alone on mobile */}
            <div className="arm-row-4 full">
              <div className="arm-field">
                <label>PG</label>
                <Form.Select
                  value={form.pgId}
                  onChange={(e) => setForm({ ...EMPTY_FORM, pgId: e.target.value, stayType: form.stayType })}
                >
                  <option value="">Select PG</option>
                  {pgs.map((pg) => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                </Form.Select>
              </div>

              <div className="arm-field">
                <label>Floor</label>
                <Form.Select
                  value={form.floorId}
                  onChange={(e) => setForm({ ...form, floorId: e.target.value, roomId: "", bedId: "" })}
                >
                  <option value="">Select Floor</option>
                  {floors.map((f) => <option key={f.id} value={f.id}>Floor {f.floorNumber}</option>)}
                </Form.Select>
              </div>

              {/* Room / Bed — desktop: stay in same arm-row-4 grid (2x2 visual via wrap) */}
              <div className="arm-field">
                <label>Room</label>
                <Form.Select
                  value={form.roomId}
                  onChange={(e) => {
                    const room = rooms.find((r) => r.id === e.target.value);
                    setForm({ ...form, roomId: e.target.value, bedId: "", monthlyRent: room?.monthlyRent ?? "", deposit: room?.deposit ?? "", dailyRent: room?.dailyRent ?? "" });
                  }}
                >
                  <option value="">Select Room</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.roomNumber}</option>)}
                </Form.Select>
              </div>

              <div className="arm-field">
                <label>Bed</label>
                <Form.Select
                  value={form.bedId}
                  onChange={(e) => setForm({ ...form, bedId: e.target.value })}
                >
                  <option value="">Select Bed</option>
                  {beds.map((b) => <option key={b.id} value={b.id}>Bed {b.bedNumber}</option>)}
                </Form.Select>
              </div>
            </div>
            {/* Stay type — full width on desktop, pairs with Bed on mobile */}
            <div className="arm-field full arm-rent-type-field">
              <label>Rent Type</label>
              <Form.Select
                value={form.stayType}
                onChange={(e) => setForm({ ...form, stayType: e.target.value })}
              >
<option value="MONTHLY_BASIC">Monthly Basic</option>
                <option value="DAILY_BASIC" disabled={!selectedRoom?.dailyRent}>Daily Basic</option>
              </Form.Select>
            </div>

            <hr className="arm-section-divider" />

            {/* Tenant details */}
            <div className="arm-field" data-mobile-full="true">
              <label>Full Name</label>
              <Form.Control
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.trimStart() })}
              />
            </div>


            <div className="arm-field" data-mobile-full="true">
              <label>Phone</label>              <Form.Control
                placeholder="Enter phone number (10 digits)"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: digitsOnly(e.target.value).slice(0, 10) })}
              />
            </div>


            <div className="arm-field" data-mobile-full="true">
              <label>Email</label>
              <Form.Control
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
              />
            </div>


            <div className="arm-field" data-mobile-full="true">
              <label>Food Preference</label>
              <Form.Select
                value={form.foodPreference}
                onChange={(e) => setForm({ ...form, foodPreference: e.target.value })}
              >
                <option value="">Select food preference</option>
                <option value="VEG">Veg</option>
                <option value="NON_VEG">Non-Veg</option>
              </Form.Select>
            </div>

            {/* Rent */}
            {isDaily ? (
              <>
                <div className="arm-field">
                  <label>Daily Rent</label>
                  <Form.Control type="number" placeholder="Enter daily rent" value={form.dailyRent} onChange={(e) => setForm({ ...form, dailyRent: e.target.value })} />
                </div>
                <div className="arm-field">
                  <label>Number of Days</label>
                  <Form.Control type="number" placeholder="Enter number of days" value={form.numberOfDays} onChange={(e) => setForm({ ...form, numberOfDays: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                <div className="arm-field">
                  <label>Monthly Rent</label>
                  <Form.Control type="number" placeholder="Enter monthly rent" value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} />
                </div>
                <div className="arm-field">
                  <label>Security Deposit</label>
                  <Form.Control type="number" placeholder="Enter security deposit" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
                </div>
              </>
            )}

            <hr className="arm-section-divider" />

            {/* Dates & payment */}
            <div className="arm-field">
              <label>Check-in Date</label>
              <Form.Control type="date" value={form.checkinDate} onChange={(e) => setForm({ ...form, checkinDate: e.target.value })} />
            </div>

            <div className="arm-field">
              <label>Expected Checkout Date</label>
              <Form.Control type="date" value={form.expectedCheckoutDate} onChange={(e) => setForm({ ...form, expectedCheckoutDate: e.target.value })} />
            </div>

            <div className="arm-field full">
              <label>Total Payable</label>
              <Form.Control value={`Rs ${total || 0}`} disabled />
            </div>

            <div className="arm-field">
              <label>Payment Mode</label>
              <Form.Select
                value={form.onboardingPaymentMode}
                onChange={(e) => setForm({ ...form, onboardingPaymentMode: e.target.value })}
              >
                <option value="">Select payment mode</option>
                {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
              </Form.Select>
            </div>

            {form.onboardingPaymentMode && form.onboardingPaymentMode !== "CASH" && (
              <div className="arm-field">
                <label>Payment Proof</label>
                <input
                  className="form-control"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
            )}

            {/* ID Proof */}

           <div className="arm-field arm-id-proof-field" data-mobile-full="true">
              <label>ID Proof</label>
              <Form.Control type="file" accept="image/*,.pdf" onChange={(e) => setIdProof(e.target.files[0])} />
            </div>

            <hr className="arm-section-divider" />
          </div>

          {/* ── Agreement & Signature ── */}
          {/* <div className="mt-3">
            {/* Toggle banner */}
          {/* <div
              className={`arm-agreement-banner ${signatureDataUrl ? "signed" : "unsigned"} ${showAgreement ? "open" : ""}`}
              onClick={() => setShowAgreement((v) => !v)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setShowAgreement((v) => !v)}
            > */}
          {/* <div className="arm-agreement-banner-left">
                <span className="arm-agreement-banner-icon">
                  {signatureDataUrl ? <FaCheckCircle color="#22c55e" /> : <FaFileAlt />}
                </span>
                <div>
                  <div className="arm-agreement-banner-title">Rental Agreement &amp; Signature</div>
                  <div className="arm-agreement-banner-sub">
                    {signatureDataUrl
                      ? "Tenant has signed the agreement ✓"
                      : "Tenant signature required *"}
                  </div>
                </div>
              </div>
              <i className={`bi bi-chevron-down arm-agreement-banner-chevron`} />
            </div> */}

          {/* Collapsible signature pad */}
          {/* {showAgreement && (
              <AgreementSignaturePad
                residentName={form.name}
                pgName={selectedPgName}
                monthlyRent={isDaily ? form.dailyRent : form.monthlyRent}
                checkinDate={form.checkinDate}
                expectedCheckoutDate={form.expectedCheckoutDate}
                apiPrefix={apiPrefix}
                signatureDataUrl={signatureDataUrl}
                onSigned={(dataUrl) => setSignatureDataUrl(dataUrl)}
                onClear={() => setSignatureDataUrl(null)}
              />
            )}
          </div> */}

        </div>{/* end .arm-page-body */}

        {/* ── Footer (bottom save bar) ── */}
        <div className="arm-page-actions">
          <button className="modal-btn cancel" onClick={() => navigate(-1)}>Cancel</button>
          <button className="modal-btn primary" disabled={loading} onClick={submit}>
            {loading ? "Saving…" : "Add Resident"}
          </button>
        </div>

      </div>{/* end .arm-page */}
    </DashboardLayout>
  );
};

export default AddTenantPage;
