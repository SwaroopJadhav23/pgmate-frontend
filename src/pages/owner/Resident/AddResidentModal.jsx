import { } from "react-icons/fa";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form } from "react-bootstrap";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { digitsOnly } from "../../../utils/formValidators";
// import AgreementSignaturePad from "./AgreementSignaturePad";
import "./Resident.css";
import "./Agreement.css";
import "./AddResidentModal.css";   // ← contains the scroll fix
import { State, City } from "country-state-city";

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
  futureDepositRefund: "",
  dailyRent: "",
  numberOfDays: "",
  onboardingPaymentMode: "",
  checkinDate: "",
  expectedCheckoutDate: "",
  dob: "",
  gender: "",
  occupation: "",
  education: "",
  collegeOrCompanyName: "",
  aadhaarNumber: "",
  permanentAddress: "",
  permanentCity: "",
  permanentState: "",
  permanentPincode: "",
  guardianName: "",
  guardianRelation: "",
  guardianPhone: "",
  localGuardianName: "",
  localGuardianRelation: "",
  localGuardianPhone: "",
  localGuardianAddress: "",
  foodFacility: "",
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
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [aadhaarCard, setAadhaarCard] = useState(null);
  const [securityDepositReceipt, setSecurityDepositReceipt] = useState(null);
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
    setProfilePhoto(null);
    setAadhaarCard(null);
    setSecurityDepositReceipt(null);
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

  const indianStates = useMemo(() => State.getStatesOfCountry("IN"), []);
  const selectedStateObj = useMemo(() => indianStates.find(s => s.name === form.permanentState), [indianStates, form.permanentState]);
  const indianCities = useMemo(() => selectedStateObj ? City.getCitiesOfState("IN", selectedStateObj.isoCode) : [], [selectedStateObj]);

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
      api.get(`${bedEndpoint}?roomId=${form.roomId}`).then((res) => {
        const availableBeds = (res.data || []).filter((b) => b.status === "AVAILABLE");
        if (availableBeds.length > 0) {
          setBeds(availableBeds);
        } else {
          // Fallback: generate synthetic bed options from room's totalBeds
          // This handles rooms whose sharing type was updated but beds weren't synced yet
          const selectedRoom = rooms.find((r) => r.id === form.roomId);
          const totalBeds = selectedRoom?.totalBeds || 0;
          const syntheticBeds = Array.from({ length: totalBeds }, (_, i) => ({
            id: `synthetic-bed-${i + 1}`,
            bedNumber: i + 1,
            status: "AVAILABLE",
            roomId: form.roomId,
            _synthetic: true,
          }));
          setBeds(syntheticBeds);
        }
      });
    } else {
      setBeds([]);
    }
  }, [form.roomId, bedEndpoint, rooms]);

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

  useEffect(() => {
    const valNum = Number(form.deposit);
    let refund = form.futureDepositRefund;
    if (valNum === 2000) refund = "1000";
    else if (valNum === 5000) refund = "2000";
    else if (valNum === 10000) refund = "4000";

    if (refund !== form.futureDepositRefund) {
      setForm((prev) => ({ ...prev, futureDepositRefund: refund }));
    }
  }, [form.deposit, form.futureDepositRefund]); // Only run when deposit changes

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

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!form.pgId) newErrors.pgId = true;
      if (!form.floorId) newErrors.floorId = true;
      if (!form.roomId) newErrors.roomId = true;
      if (!form.bedId) newErrors.bedId = true;
    } else if (step === 2) {
      if (!form.name.trim()) newErrors.name = true;
      if (form.phone.length !== 10) newErrors.phone = true;
      if (!form.email.trim()) newErrors.email = true;
      if (!form.dob) newErrors.dob = true;
      if (!form.foodFacility) newErrors.foodFacility = true;
    } else if (step === 3) {
      if (!form.guardianName.trim()) newErrors.guardianName = true;
      if (form.guardianPhone.length !== 10) newErrors.guardianPhone = true;
    } else if (step === 4) {
      if (!form.onboardingPaymentMode) newErrors.onboardingPaymentMode = true;
      if (!form.checkinDate) newErrors.checkinDate = true;
      if (!form.expectedCheckoutDate) newErrors.expectedCheckoutDate = true;
      if (!form.aadhaarNumber) newErrors.aadhaarNumber = true;
      if (!aadhaarCard) newErrors.aadhaarCard = true;
      if (isDaily && !form.dailyRent) newErrors.dailyRent = true;
      if (isDaily && !form.numberOfDays) newErrors.numberOfDays = true;
      if (!isDaily && !form.monthlyRent) newErrors.monthlyRent = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      toast("Please fill all required fields in this step.", { icon: "⚠️" });
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.is-invalid');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorEl.focus();
        }
      }, 100);
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── submit ────────────────────────────────────────────────────────
  const submit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      let resolvedBedId = form.bedId;

      // If user selected a synthetic bed (DB not yet synced), trigger a bed sync first
      if (form.bedId?.startsWith("synthetic-bed-")) {
        const bedNum = parseInt(form.bedId.split("-").pop(), 10);
        // Call the room sync endpoint to force-create missing beds
        try {
          await api.post(`${bedEndpoint.replace("/beds", "/rooms")}/${form.roomId}/sync-beds`);
        } catch (e) {
          // sync endpoint may not exist — ignore and try to find the bed directly
        }
        // Re-fetch beds after sync
        const freshRes = await api.get(`${bedEndpoint}?roomId=${form.roomId}`);
        const freshBeds = (freshRes.data || []).filter((b) => b.status === "AVAILABLE");
        const match = freshBeds.find((b) => b.bedNumber === bedNum);
        if (match) {
          resolvedBedId = match.id;
        } else {
          toast.error("Bed not found on server. Please edit the room again to re-sync beds.");
          setLoading(false);
          return;
        }
      }

      const fd = new FormData();
      Object.entries({ ...form, bedId: resolvedBedId }).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
      if (file) fd.append("onboardingPaymentProof", file);
      if (profilePhoto) fd.append("profilePhoto", profilePhoto);
      if (aadhaarCard) fd.append("aadhaarCard", aadhaarCard);
      if (securityDepositReceipt) fd.append("securityDepositReceipt", securityDepositReceipt);

      await api.post(residentEndpoint, fd);
      toast.success("Resident Added successfully.");
      onSuccess?.();
      navigate(-1); // go back to Tenants list
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || "Failed to add resident.";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Failed to add resident.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Add Tenant"
      subtitle="Add new tenant and room details"
      rightAction={
        <div className="arm-header-actions">
          <button className="arm-btn-outline" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      }
    >
      <div className="arm-page">

        {/* ── Stepper ── */}
        <div className="arm-stepper" style={{ marginBottom: '24px' }}>
          {[
            { num: 1, label: "Allocation" },
            { num: 2, label: "Personal Info" },
            { num: 3, label: "Guardian" },
            { num: 4, label: "Payment & Docs" }
          ].map((step, idx, arr) => (
            <React.Fragment key={step.num}>
              <div className="arm-step">
                <div className={`arm-step-circle ${currentStep >= step.num ? "active" : ""}`}>{step.num}</div>
                <span className={`arm-step-label ${currentStep >= step.num ? "active" : ""}`}>{step.label}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className="arm-step-line">
                  <div className="arm-step-line-fill" style={{ width: currentStep > step.num ? "100%" : "0%" }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {/* ── Body ── */}
        <div className="arm-page-body">

          {currentStep === 1 && (
          <>
          {/* Location */}
          <div className="arm-grid">
            {/* PG — own row, pairs with Floor on desktop via arm-row-4, full-width alone on mobile */}
            <div className="arm-row-4 full">
              <div className="arm-field">
                <label>PG<span className="req">*</span></label>
                <Form.Select isInvalid={errors.pgId} value={form.pgId}
                  onChange={(e) => setForm({ ...EMPTY_FORM, pgId: e.target.value, stayType: form.stayType })}
                >
                  <option value="">Select PG</option>
                  {pgs.map((pg) => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                </Form.Select>
              </div>

              <div className="arm-field">
                <label>Floor<span className="req">*</span></label>
                <Form.Select isInvalid={errors.floorId} value={form.floorId}
                  onChange={(e) => setForm({ ...form, floorId: e.target.value, roomId: "", bedId: "" })}
                >
                  <option value="">Select Floor</option>
                  {floors.map((f) => <option key={f.id} value={f.id}>Floor {f.floorNumber}</option>)}
                </Form.Select>
              </div>

              {/* Room / Bed — desktop: stay in same arm-row-4 grid (2x2 visual via wrap) */}
              <div className="arm-field">
                <label>Room<span className="req">*</span></label>
                <Form.Select isInvalid={errors.roomId} value={form.roomId}
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
                <label>Bed<span className="req">*</span></label>
                <Form.Select isInvalid={errors.bedId} value={form.bedId}
                  onChange={(e) => setForm({ ...form, bedId: e.target.value })}
                >
                  <option value="">Select Bed</option>
                  {beds.map((b) => <option key={b.id} value={b.id}>Bed {b.bedNumber}</option>)}
                </Form.Select>
              </div>
            </div>
            {/* Stay type — full width on desktop, pairs with Bed on mobile */}
            <div className="arm-field full arm-rent-type-field">
              <label>Rent Type<span className="req">*</span></label>
              <Form.Select isInvalid={errors.stayType} value={form.stayType}
                onChange={(e) => setForm({ ...form, stayType: e.target.value })}
              >
                <option value="MONTHLY_BASIC">Monthly Basic</option>
                <option value="DAILY_BASIC">Daily Basic</option>
              </Form.Select>
            </div>
            </div>
          </>
          )}
          {currentStep === 2 && (
          <>
          <div className="arm-grid">
          {/* Tenant details */}
            <div className="arm-field" data-mobile-full="true">
              <label>Full Name<span className="req">*</span></label>
              <Form.Control
                placeholder="Enter full name" isInvalid={errors.name} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.replace(/[^a-zA-Z\s]/g, '').trimStart() })}
              />
            </div>


            <div className="arm-field" data-mobile-full="true">
              <label>Phone<span className="req">*</span></label>              <Form.Control
                placeholder="Enter phone number (10 digits)"
                type="tel"
                inputMode="numeric"
                maxLength={10} isInvalid={errors.phone} value={form.phone}
                onChange={(e) => setForm({ ...form, phone: digitsOnly(e.target.value).slice(0, 10) })}
              />
            </div>


            <div className="arm-field" data-mobile-full="true">
              <label>Email<span className="req">*</span></label>
              <Form.Control
                type="email"
                placeholder="Enter email address" isInvalid={errors.email} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
              />
            </div>


            <div className="arm-field" data-mobile-full="true">
              <label>Gender</label>
              <Form.Select isInvalid={errors.gender} value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Form.Select>
            </div>

            <div className="arm-field" data-mobile-full="true">
              <label>Date of Birth<span className="req">*</span></label>
              <Form.Control
                type="date"
                max={new Date(Date.now() - 86400000).toISOString().split("T")[0]}
                isInvalid={errors.dob} value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </div>

            <div className="arm-field" data-mobile-full="true">
              <label>Occupation</label>
              <Form.Select isInvalid={errors.occupation} value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
              >
                <option value="">Select occupation</option>
                <option value="Student">Student</option>
                <option value="Working Professional">Working Professional</option>
                <option value="Other">Other</option>
              </Form.Select>
            </div>

            <div className="arm-field" data-mobile-full="true">
              <label>Education</label>
              <Form.Control
                placeholder="Highest qualification / Current course" isInvalid={errors.education} value={form.education}
                onChange={(e) => setForm({ ...form, education: e.target.value.replace(/[^a-zA-Z\s,.-]/g, '').trimStart() })}
              />
            </div>

            <div className="arm-field" data-mobile-full="true">
              <label>College / Company Name</label>
              <Form.Control
                placeholder="Enter college or company name" isInvalid={errors.collegeOrCompanyName} value={form.collegeOrCompanyName}
                onChange={(e) => setForm({ ...form, collegeOrCompanyName: e.target.value.replace(/[^a-zA-Z\s,.-]/g, '').trimStart() })}
              />
            </div>

            <div className="arm-field" data-mobile-full="true">
              <label>Food Facility<span className="req">*</span></label>
              <Form.Select isInvalid={errors.foodFacility} value={form.foodFacility}
                onChange={(e) => setForm({ ...form, foodFacility: e.target.value })}
              >
                <option value="">Select food facility</option>
                <option value="With Food">With Food</option>
                <option value="Without Food">Without Food</option>
              </Form.Select>
            </div>
          </div>
          </>
          )}
          {currentStep === 3 && (
          <>
          <div className="arm-grid">
          {/* Address Details */}
            <h6 className="mt-3" style={{ gridColumn: "1 / -1" }}>Permanent Address</h6>
            <div className="arm-field full">
              <label>Address Line</label>
              <Form.Control
                placeholder="Enter address" isInvalid={errors.permanentAddress} value={form.permanentAddress}
                onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
              />
            </div>
            <div className="arm-field">
              <label>State</label>
              <Form.Select isInvalid={errors.permanentState} value={form.permanentState}
                onChange={(e) => setForm({ ...form, permanentState: e.target.value, permanentCity: "" })}
              >
                <option value="">Select State</option>
                {indianStates.map((s) => (
                  <option key={s.isoCode} value={s.name}>{s.name}</option>
                ))}
              </Form.Select>
            </div>
            <div className="arm-field">
              <label>City</label>
              <Form.Select isInvalid={errors.permanentCity} value={form.permanentCity}
                onChange={(e) => setForm({ ...form, permanentCity: e.target.value })}
                disabled={!form.permanentState}
              >
                <option value="">Select City</option>
                {indianCities.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </Form.Select>
            </div>
            <div className="arm-field">
              <label>Pincode</label>
              <Form.Control
                placeholder="Pincode"
                type="tel"
                inputMode="numeric"
                maxLength={6} isInvalid={errors.permanentPincode} value={form.permanentPincode}
                onChange={(e) => setForm({ ...form, permanentPincode: digitsOnly(e.target.value).slice(0, 6) })}
              />
            </div>

            <hr className="arm-section-divider" />

            {/* Guardian Information */}
            <h6 className="mt-3" style={{ gridColumn: "1 / -1" }}>Guardian Information</h6>
            <div className="arm-field" data-mobile-full="true">
              <label>Father's / Guardian's Name<span className="req">*</span></label>
              <Form.Control
                placeholder="Guardian Name" isInvalid={errors.guardianName} value={form.guardianName}
                onChange={(e) => setForm({ ...form, guardianName: e.target.value.replace(/[^a-zA-Z\s]/g, '').trimStart() })}
              />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Relation</label>
              <Form.Select value={form.guardianRelation} onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })}>
                <option value="">Select</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Spouse">Spouse</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </Form.Select>
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Father's / Guardian's Phone<span className="req">*</span></label>
              <Form.Control
                placeholder="Guardian Phone"
                type="tel"
                inputMode="numeric"
                maxLength={10} isInvalid={errors.guardianPhone} value={form.guardianPhone}
                onChange={(e) => setForm({ ...form, guardianPhone: digitsOnly(e.target.value).slice(0, 10) })}
              />
            </div>
            
            <div className="arm-field" data-mobile-full="true">
              <label>Local Guardian's Name</label>
              <Form.Control
                placeholder="Local Guardian Name" isInvalid={errors.localGuardianName} value={form.localGuardianName}
                onChange={(e) => setForm({ ...form, localGuardianName: e.target.value.replace(/[^a-zA-Z\s]/g, '').trimStart() })}
              />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Local Guardian's Relation</label>
              <Form.Select value={form.localGuardianRelation} onChange={(e) => setForm({ ...form, localGuardianRelation: e.target.value })}>
                <option value="">Select</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Spouse">Spouse</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </Form.Select>
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Local Guardian's Phone</label>
              <Form.Control
                placeholder="Local Guardian Phone"
                type="tel"
                inputMode="numeric"
                maxLength={10} isInvalid={errors.localGuardianPhone} value={form.localGuardianPhone}
                onChange={(e) => setForm({ ...form, localGuardianPhone: digitsOnly(e.target.value).slice(0, 10) })}
              />
            </div>
            <div className="arm-field full">
              <label>Local Guardian's Address</label>
              <Form.Control
                placeholder="Local Guardian Address" isInvalid={errors.localGuardianAddress} value={form.localGuardianAddress}
                onChange={(e) => setForm({ ...form, localGuardianAddress: e.target.value })}
              />
            </div>

            <hr className="arm-section-divider" />
            
            {/* Emergency Contact */}
            <h6 className="mt-3" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>Emergency Contact</h6>
            <div className="arm-field" data-mobile-full="true">
              <label>Name</label>
              <Form.Control
                placeholder="Emergency Contact Name" value={form.emergencyContactName}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value.replace(/[^a-zA-Z\s]/g, '').trimStart() })}
              />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Relation</label>
              <Form.Select value={form.emergencyContactRelation} onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })}>
                <option value="">Select</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Spouse">Spouse</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </Form.Select>
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Phone</label>
              <Form.Control
                placeholder="Emergency Contact Phone"
                type="tel"
                inputMode="numeric"
                maxLength={10} value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: digitsOnly(e.target.value).slice(0, 10) })}
              />
            </div>
          </div>
          </>
          )}
          {currentStep === 4 && (
          <>
          <div className="arm-grid">
          {/* Rent */}
            {isDaily ? (
              <>
                <div className="arm-field">
                  <label>Daily Rent<span className="req">*</span></label>
                  <Form.Control type="number" placeholder="Enter daily rent" isInvalid={errors.dailyRent} value={form.dailyRent} onChange={(e) => setForm({ ...form, dailyRent: e.target.value })} onWheel={(e) => e.target.blur()} />
                </div>
                <div className="arm-field">
                  <label>Number of Days<span className="req">*</span></label>
                  <Form.Control type="number" placeholder="Enter number of days" isInvalid={errors.numberOfDays} value={form.numberOfDays} onChange={(e) => setForm({ ...form, numberOfDays: e.target.value })} onWheel={(e) => e.target.blur()} />
                </div>
              </>
            ) : (
              <>
                <div className="arm-field">
                  <label>Monthly Rent<span className="req">*</span></label>
                  <Form.Control type="number" placeholder="Enter monthly rent" isInvalid={errors.monthlyRent} value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} onWheel={(e) => e.target.blur()} />
                </div>
                <div className="arm-field">
                  <label>Security Deposit</label>
                  <Form.Control 
                    type="number" 
                    placeholder="Enter security deposit" isInvalid={errors.deposit} value={form.deposit} 
                    onChange={(e) => setForm({ ...form, deposit: e.target.value })} 
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
                <div className="arm-field">
                  <label>Future Deposit Refund</label>
                  <Form.Control type="number" placeholder="Enter future deposit refund" isInvalid={errors.futureDepositRefund} value={form.futureDepositRefund} onChange={(e) => setForm({ ...form, futureDepositRefund: e.target.value })} onWheel={(e) => e.target.blur()} />
                </div>
              </>
            )}

            <hr className="arm-section-divider" />

            {/* Dates & payment */}
            <div className="arm-field">
              <label>Check-in Date<span className="req">*</span></label>
              <Form.Control type="date" isInvalid={errors.checkinDate} value={form.checkinDate} onChange={(e) => setForm({ ...form, checkinDate: e.target.value })} />
            </div>

            <div className="arm-field">
              <label>Expected Checkout Date<span className="req">*</span></label>
              <Form.Control type="date" min={form.checkinDate || undefined} isInvalid={errors.expectedCheckoutDate} value={form.expectedCheckoutDate} onChange={(e) => setForm({ ...form, expectedCheckoutDate: e.target.value })} />
            </div>

            <div className="arm-field full">
              <label>Total Payable</label>
              <Form.Control value={`Rs ${total || 0}`} disabled />
            </div>

            <div className="arm-field">
              <label>Payment Mode<span className="req">*</span></label>
              <Form.Select isInvalid={errors.onboardingPaymentMode} value={form.onboardingPaymentMode}
                onChange={(e) => setForm({ ...form, onboardingPaymentMode: e.target.value })}
              >
                <option value="">Select payment mode</option>
                {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
              </Form.Select>
            </div>

            {form.onboardingPaymentMode && form.onboardingPaymentMode !== "CASH" && (
              <>
                <div className="arm-field">
                  <label>Payment Proof</label>
                  <input
                    className="form-control"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </div>
                <div className="arm-field">
                  <label>Security Deposit Receipt</label>
                  <Form.Control type="file" accept="image/*,.pdf" onChange={(e) => setSecurityDepositReceipt(e.target.files[0])} />
                </div>
              </>
            )}

            <hr className="arm-section-divider" />

            {/* Documents */}
            <h6 className="mt-3" style={{ gridColumn: "1 / -1" }}>Documents</h6>
            <div className="arm-field full">
              <label>Aadhaar Card Number<span className="req">*</span></label>
              <Form.Control
                placeholder="12 digit Aadhaar Number"
                type="tel"
                inputMode="numeric"
                maxLength={12} isInvalid={errors.aadhaarNumber} value={form.aadhaarNumber}
                onChange={(e) => setForm({ ...form, aadhaarNumber: digitsOnly(e.target.value).slice(0, 12) })}
              />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Profile Photo</label>
              <Form.Control type="file" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files[0])} />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Aadhaar Card Upload<span className="req">*</span></label>
              <Form.Control type="file" accept="image/*,.pdf" isInvalid={errors.aadhaarCard} onChange={(e) => { setAadhaarCard(e.target.files[0]); setErrors(prev => ({ ...prev, aadhaarCard: false })); }} />
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

          </>
          )}
        </div>{/* end .arm-page-body */}

        {/* ── Footer (bottom save bar) ── */}
        <div className="arm-page-actions" style={{ justifyContent: currentStep > 1 ? "space-between" : "flex-end" }}>
          {currentStep > 1 && (
            <button className="arm-btn-outline" onClick={prevStep}>Previous</button>
          )}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="arm-btn-outline" onClick={() => navigate(-1)}>Cancel</button>
            {currentStep < 4 ? (
              <button className="arm-btn-primary" onClick={nextStep}>Next</button>
            ) : (
              <button className="arm-btn-primary" disabled={loading} onClick={submit}>
                {loading ? "Saving…" : "Add Resident"}
              </button>
            )}
          </div>
        </div>

      </div>{/* end .arm-page */}
    </DashboardLayout>
  );
};

export default AddTenantPage;
