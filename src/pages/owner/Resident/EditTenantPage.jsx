import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Form } from "react-bootstrap";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { digitsOnly, isValidEmail } from "../../../utils/formValidators";
import { State, City } from "country-state-city";
import "./Resident.css";
import "./Agreement.css";
import "./AddResidentModal.css";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  monthlyRent: "",
  deposit: "",
  futureDepositRefund: "",
  dailyRent: "",
  numberOfDays: "",
  checkinDate: "",
  expectedCheckoutDate: "",
  onboardingPaymentMode: "",
  stayType: "MONTHLY_BASIC",
  foodPreference: "",
  foodFacility: "",
  emergencyContactName: "",
  emergencyContact: "",
  emergencyContactRelation: "",
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
};

const PAYMENT_MODES = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "WALLET"];

const formatMoney = (value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`;

const formatForInput = (dateArr) => {
  if (!dateArr) return "";
  if (typeof dateArr === "string") return dateArr;
  if (Array.isArray(dateArr)) {
    const [y, m, d] = dateArr;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
};

const normalizeDateForAPI = (d) => {
  if (!d) return "";
  if (typeof d === "string" && d.includes("-")) return d;
  if (Array.isArray(d)) {
    const [y, m, day] = d;
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
};

const EditTenantPage = ({ apiPrefix }) => {
  const navigate = useNavigate();
  const { residentId } = useParams();
  const location = useLocation();
  const residentEndpoint = apiPrefix || location.state?.apiPrefix || "/owner/residents";

  const [resident, setResident] = useState(null);
  const [loadingResident, setLoadingResident] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Files
  const [paymentFile, setPaymentFile] = useState(null);
  const [removePaymentProof, setRemovePaymentProof] = useState(false);
  const [idProofFile, setIdProofFile] = useState(null);
  const [removeIdProof, setRemoveIdProof] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const [securityDepositReceipt, setSecurityDepositReceipt] = useState(null);
  const [removeSecurityDepositReceipt, setRemoveSecurityDepositReceipt] = useState(false);

  // ── fetch resident (always fresh from API) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingResident(true);
        // Try single-resident endpoint first (returns all fields)
        try {
          const res = await api.get(`${residentEndpoint}/${residentId}`);
          if (!cancelled && res.data) {
            setResident(res.data);
            // Check if key fields are missing (old tenant without new data)
            const hasEmptyFields = !res.data.dob && !res.data.gender && !res.data.occupation && !res.data.aadhaarNumber;
            if (hasEmptyFields) {
              toast.error("Please fill the empty data to continue.");
            }
            return;
          }
        } catch {
          // Single endpoint not available (old backend) — fall through to list fallback
        }

        // Fallback: fetch from list and find by ID
        try {
          const listRes = await api.get(residentEndpoint);
          const found = (listRes.data?.content || listRes.data || []).find(
            (r) => String(r.residentId || r.id) === String(residentId)
          );
          if (!cancelled) {
            if (found) {
              setResident(found);
              toast.error("Please fill the empty data to continue.");
            } else {
              // Resident not found — open blank form with a message
              setResident({});
              toast.error("Please fill the empty data to continue.");
            }
          }
        } catch {
          if (!cancelled) {
            // All fetches failed — open blank form so user can still fill data
            setResident({});
            toast.error("Please fill the empty data to continue.");
          }
        }
      } finally {
        if (!cancelled) setLoadingResident(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [residentId, residentEndpoint]);

  // ── populate form ──
  useEffect(() => {
    if (!resident) return;
    setForm({
      name: resident.name || "",
      phone: resident.phone || "",
      email: resident.email || "",
      monthlyRent: resident.monthlyRent || "",
      deposit: resident.deposit || "",
      futureDepositRefund: resident.futureDepositRefund || "",
      dailyRent: resident.dailyRent || "",
      numberOfDays: resident.numberOfDays || "",
      checkinDate: formatForInput(resident.checkinDate),
      expectedCheckoutDate: formatForInput(resident.expectedCheckoutDate),
      onboardingPaymentMode: resident.onboardingPaymentMode || "",
      stayType: resident.stayType || "MONTHLY_BASIC",
      foodPreference: resident.foodPreference || "",
      foodFacility: resident.foodFacility || "",
      emergencyContactName: resident.emergencyContactName || "",
      emergencyContact: resident.emergencyContact || "",
      emergencyContactRelation: resident.emergencyContactRelation || "",
      dob: formatForInput(resident.dob),
      gender: resident.gender || "",
      occupation: resident.occupation || "",
      education: resident.education || "",
      collegeOrCompanyName: resident.collegeOrCompanyName || "",
      aadhaarNumber: resident.aadhaarNumber || "",
      permanentAddress: resident.permanentAddress || "",
      permanentCity: resident.permanentCity || "",
      permanentState: resident.permanentState || "",
      permanentPincode: resident.permanentPincode || "",
      guardianName: resident.guardianName || "",
      guardianRelation: resident.guardianRelation || "",
      guardianPhone: resident.guardianPhone || "",
      localGuardianName: resident.localGuardianName || "",
      localGuardianRelation: resident.localGuardianRelation || "",
      localGuardianPhone: resident.localGuardianPhone || "",
      localGuardianAddress: resident.localGuardianAddress || "",
    });
    setPaymentFile(null);
    setIdProofFile(null);
    setProfilePhoto(null);
    setSecurityDepositReceipt(null);
    setRemovePaymentProof(false);
    setRemoveIdProof(false);
    setRemoveProfilePhoto(false);
    setRemoveSecurityDepositReceipt(false);
  }, [resident]);

  const indianStates = useMemo(() => State.getStatesOfCountry("IN"), []);
  const selectedStateObj = useMemo(() => indianStates.find(s => s.name === form.permanentState), [indianStates, form.permanentState]);
  const indianCities = useMemo(() => selectedStateObj ? City.getCitiesOfState("IN", selectedStateObj.isoCode) : [], [selectedStateObj]);

  // Auto-calculate future deposit refund
  useEffect(() => {
    const valNum = Number(form.deposit);
    let refund = form.futureDepositRefund;
    if (valNum === 2000) refund = "1000";
    else if (valNum === 5000) refund = "2000";
    else if (valNum === 10000) refund = "4000";

    if (refund !== form.futureDepositRefund) {
      setForm((prev) => ({ ...prev, futureDepositRefund: refund }));
    }
  }, [form.deposit]);

  const isDaily = form.stayType === "DAILY_BASIC";
  const total = useMemo(
    () =>
      isDaily
        ? Number(form.dailyRent || 0) * Number(form.numberOfDays || 0)
        : Number(form.monthlyRent || 0) + Number(form.deposit || 0),
    [isDaily, form.dailyRent, form.numberOfDays, form.monthlyRent, form.deposit]
  );

  const submit = async () => {
    const baseInvalid = !form.name.trim() || !form.phone || !form.checkinDate || !form.onboardingPaymentMode;
    const monthlyInvalid = !isDaily && (!form.monthlyRent || form.deposit === "");
    const dailyInvalid = isDaily && (!form.dailyRent || !form.numberOfDays);

    if (baseInvalid || monthlyInvalid || dailyInvalid) {
      toast("Please fill all required fields (Name, Phone, Rent, Check-in, Payment Mode).", { icon: "⚠️" });
      return;
    }
    if (form.phone && form.phone.length !== 10) {
      toast("Phone must be exactly 10 digits.", { icon: "⚠️" });
      return;
    }
    if (form.email && !isValidEmail(form.email)) {
      toast("Please enter a valid email address.", { icon: "⚠️" });
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'checkinDate' || k === 'expectedCheckoutDate' || k === 'dob') {
           const norm = normalizeDateForAPI(v);
           if (norm) fd.append(k, norm);
        } else if (v !== "" && v !== null && v !== undefined) {
           fd.append(k, v);
        }
      });

      if (form.onboardingPaymentMode === "CASH") {
        fd.set("onboardingPaymentAmount", total);
        fd.append("removeOnboardingPaymentProof", "true");
      } else if (form.onboardingPaymentMode) {
        fd.set("onboardingPaymentAmount", total);
        if (removePaymentProof) fd.append("removeOnboardingPaymentProof", "true");
        if (paymentFile) fd.append("onboardingPaymentProof", paymentFile);
      }

      if (idProofFile) {
        fd.append("idProof", idProofFile); 
        fd.append("aadhaarCard", idProofFile); 
      }
      if (removeIdProof) {
        fd.append("removeIdProof", "true");
        fd.append("removeAadhaarCard", "true");
      }
      
      if (profilePhoto) fd.append("profilePhoto", profilePhoto);
      if (removeProfilePhoto) fd.append("removeProfilePhoto", "true");
      
      if (securityDepositReceipt) fd.append("securityDepositReceipt", securityDepositReceipt);
      if (removeSecurityDepositReceipt) fd.append("removeSecurityDepositReceipt", "true");

      await api.put(`${residentEndpoint}/${residentId}`, fd);
      toast.success("Resident updated successfully.");
      navigate(-1);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || "Failed to update resident.";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Failed to update resident.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingResident) {
    return (
      <DashboardLayout title="Edit Tenant" subtitle="Update tenant and room details">
        <div className="arm-page">
          <div className="arm-page-body">Loading tenant details…</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!resident) {
    return (
      <DashboardLayout title="Edit Tenant" subtitle="Update tenant and room details">
        <div className="arm-page">
          <div className="arm-page-body">Loading tenant details…</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Edit Tenant"
      subtitle="Update tenant and room details"
      rightAction={
        <div className="arm-header-actions">
          <button className="arm-btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button className="arm-btn-primary" disabled={saving} onClick={submit}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      }
    >
      <div className="arm-page">
        <div className="arm-page-body">
          <div className="arm-grid">
            
            <h6 style={{ gridColumn: "1 / -1", marginBottom: 0 }}>Allocation</h6>
            <div className="arm-field" data-mobile-full="true">
              <label>PG</label>
              <Form.Control value={resident.pgName || "-"} disabled />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Room</label>
              <Form.Control value={resident.roomNumber || "-"} disabled />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Stay Type</label>
              <Form.Control value={isDaily ? "Daily Basic" : "Monthly Basic"} disabled />
            </div>
            <div className="arm-field" data-mobile-full="true"></div>

            <hr className="arm-section-divider" />

            <h6 style={{ gridColumn: "1 / -1", marginBottom: 0 }}>Personal Details</h6>
            <div className="arm-field" data-mobile-full="true">
              <label>Name *</label>
              <Form.Control
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.replace(/[^a-zA-Z\s]/g, '').trimStart() })}
              />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Phone *</label>
              <Form.Control
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
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
              />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Gender</label>
              <Form.Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Form.Select>
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Date of Birth</label>
              <Form.Control type="date" value={form.dob} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Aadhaar Number</label>
              <Form.Control
                type="tel"
                inputMode="numeric"
                maxLength={12}
                value={form.aadhaarNumber}
                onChange={(e) => setForm({ ...form, aadhaarNumber: digitsOnly(e.target.value).slice(0, 12) })}
              />
            </div>

            <div className="arm-field" data-mobile-full="true">
              <label>Occupation</label>
              <Form.Select value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })}>
                <option value="">Select</option>
                <option value="Student">Student</option>
                <option value="Working Professional">Working Professional</option>
                <option value="Other">Other</option>
              </Form.Select>
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Education</label>
              <Form.Control value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value.replace(/[^a-zA-Z\s,.-]/g, '').trimStart() })} />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>College / Company</label>
              <Form.Control value={form.collegeOrCompanyName} onChange={(e) => setForm({ ...form, collegeOrCompanyName: e.target.value.replace(/[^a-zA-Z\s,.-]/g, '').trimStart() })} />
            </div>

            <hr className="arm-section-divider" />

            <h6 style={{ gridColumn: "1 / -1", marginBottom: 0 }}>Rent Details</h6>
            {isDaily ? (
              <>
                <div className="arm-field">
                  <label>Daily Rent</label>
                  <Form.Control type="number" value={form.dailyRent} onChange={(e) => setForm({ ...form, dailyRent: e.target.value })} onWheel={(e) => e.target.blur()} />
                </div>
                <div className="arm-field">
                  <label>Number of Days</label>
                  <Form.Control type="number" value={form.numberOfDays} onChange={(e) => setForm({ ...form, numberOfDays: e.target.value })} onWheel={(e) => e.target.blur()} />
                </div>
              </>
            ) : (
              <>
                <div className="arm-field">
                  <label>Monthly Rent</label>
                  <Form.Control type="number" value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} onWheel={(e) => e.target.blur()} />
                </div>
                <div className="arm-field">
                  <label>Deposit</label>
                  <Form.Control type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} onWheel={(e) => e.target.blur()} />
                </div>
                <div className="arm-field">
                  <label>Future Deposit Refund</label>
                  <Form.Control type="number" value={form.futureDepositRefund} onChange={(e) => setForm({ ...form, futureDepositRefund: e.target.value })} onWheel={(e) => e.target.blur()} />
                </div>
              </>
            )}

            <div className="arm-field">
              <label>Check-in Date *</label>
              <Form.Control type="date" value={form.checkinDate} onChange={(e) => setForm({ ...form, checkinDate: e.target.value })} />
            </div>
            <div className="arm-field">
              <label>Expected Checkout</label>
              <Form.Control type="date" value={form.expectedCheckoutDate} onChange={(e) => setForm({ ...form, expectedCheckoutDate: e.target.value })} />
            </div>
            <div className="arm-field full">
              <label>Total Payable</label>
              <Form.Control value={formatMoney(total)} disabled />
            </div>

            <div className="arm-field full">
              <label>Payment Mode *</label>
              <Form.Select
                value={form.onboardingPaymentMode}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm({ ...form, onboardingPaymentMode: value });
                  if (value === "CASH") {
                    setPaymentFile(null);
                    setRemovePaymentProof(true);
                  } else {
                    setRemovePaymentProof(false);
                  }
                }}
              >
                <option value="">Select</option>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>{m.replace("_", " ")}</option>
                ))}
              </Form.Select>
            </div>

            {form.onboardingPaymentMode && form.onboardingPaymentMode !== "CASH" && (
              <>
                <div className="arm-field">
                  <label>Replace Payment Proof</label>
                  <Form.Control type="file" accept="image/*,.pdf" onChange={(e) => { setPaymentFile(e.target.files[0]); setRemovePaymentProof(false); }} />
                </div>
                <div className="arm-field">
                  <label>Replace Deposit Receipt</label>
                  <Form.Control type="file" accept="image/*,.pdf" onChange={(e) => { setSecurityDepositReceipt(e.target.files[0]); setRemoveSecurityDepositReceipt(false); }} />
                </div>
              </>
            )}

            {form.onboardingPaymentMode !== "CASH" && (
              <div className="arm-field full">
                <Form.Check className="edit-check" label="Remove existing payment proof" checked={removePaymentProof} onChange={(e) => setRemovePaymentProof(e.target.checked)} />
              </div>
            )}

            <hr className="arm-section-divider" />

            <h6 style={{ gridColumn: "1 / -1", marginBottom: 0 }}>Documents</h6>
            <div className="arm-field" data-mobile-full="true">
              <label>Replace ID/Aadhaar Proof</label>
              <Form.Control type="file" accept="image/*,.pdf" onChange={(e) => { setIdProofFile(e.target.files[0]); setRemoveIdProof(false); }} />
              <Form.Check className="mt-2 edit-check" label="Remove existing ID proof" checked={removeIdProof} onChange={(e) => setRemoveIdProof(e.target.checked)} />
            </div>
            
            <div className="arm-field" data-mobile-full="true">
              <label>Replace Profile Photo</label>
              <Form.Control type="file" accept="image/*" onChange={(e) => { setProfilePhoto(e.target.files[0]); setRemoveProfilePhoto(false); }} />
              <Form.Check className="mt-2 edit-check" label="Remove existing Profile Photo" checked={removeProfilePhoto} onChange={(e) => setRemoveProfilePhoto(e.target.checked)} />
            </div>

            <hr className="arm-section-divider" />
            <h6 style={{ gridColumn: "1 / -1", marginBottom: 0 }}>Additional Details</h6>

            <div className="arm-field" data-mobile-full="true">
              <label>Food Facility</label>
              <Form.Select value={form.foodFacility} onChange={(e) => setForm({ ...form, foodFacility: e.target.value })}>
                <option value="">Select</option>
                <option value="With Food">With Food</option>
                <option value="Without Food">Without Food</option>
              </Form.Select>
            </div>
            
            <div className="arm-field" data-mobile-full="true">
              <label>Food Preference</label>
              <Form.Select value={form.foodPreference} onChange={(e) => setForm({ ...form, foodPreference: e.target.value })}>
                <option value="">Select</option>
                <option value="VEG">Veg</option>
                <option value="NON_VEG">Non-Veg</option>
              </Form.Select>
            </div>

            <h6 className="mt-4" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>Permanent Address</h6>
            <div className="arm-field full">
              <label>Address Line</label>
              <Form.Control value={form.permanentAddress} onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })} />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>State</label>
              <Form.Select value={form.permanentState} onChange={(e) => setForm({ ...form, permanentState: e.target.value, permanentCity: "" })}>
                <option value="">Select State</option>
                {indianStates.map((s) => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
              </Form.Select>
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>City</label>
              <Form.Select value={form.permanentCity} onChange={(e) => setForm({ ...form, permanentCity: e.target.value })} disabled={!form.permanentState}>
                <option value="">Select City</option>
                {indianCities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </Form.Select>
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Pincode</label>
              <Form.Control type="tel" inputMode="numeric" maxLength={6} value={form.permanentPincode} onChange={(e) => setForm({ ...form, permanentPincode: digitsOnly(e.target.value).slice(0, 6) })} />
            </div>

            <h6 className="mt-4" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>Guardian Information</h6>
            <div className="arm-field" data-mobile-full="true">
              <label>Father's / Guardian's Name *</label>
              <Form.Control value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value.replace(/[^a-zA-Z\s]/g, '').trimStart() })} />
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
              <label>Father's / Guardian's Phone *</label>
              <Form.Control type="tel" inputMode="numeric" maxLength={10} value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: digitsOnly(e.target.value).slice(0, 10) })} />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Local Guardian's Name</label>
              <Form.Control value={form.localGuardianName} onChange={(e) => setForm({ ...form, localGuardianName: e.target.value.replace(/[^a-zA-Z\s]/g, '').trimStart() })} />
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
              <Form.Control type="tel" inputMode="numeric" maxLength={10} value={form.localGuardianPhone} onChange={(e) => setForm({ ...form, localGuardianPhone: digitsOnly(e.target.value).slice(0, 10) })} />
            </div>
            <div className="arm-field full">
              <label>Local Guardian's Address</label>
              <Form.Control value={form.localGuardianAddress} onChange={(e) => setForm({ ...form, localGuardianAddress: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="arm-page-actions" style={{ justifyContent: "flex-end" }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="arm-btn-outline" onClick={() => navigate(-1)}>Cancel</button>
            <button className="arm-btn-primary" disabled={saving} onClick={submit}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditTenantPage;