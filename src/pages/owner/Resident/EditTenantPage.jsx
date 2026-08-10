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
  const [formErrors, setFormErrors] = useState({});
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
    const loaded = {
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
    };
    setForm(loaded);

    // Immediately highlight all empty required fields on load
    const isDaily = (resident.stayType || "MONTHLY_BASIC") === "DAILY_BASIC";
    const initErrors = {};
    if (!loaded.name?.trim()) initErrors.name = true;
    if (!loaded.phone || String(loaded.phone).trim().length !== 10) initErrors.phone = true;
    if (!loaded.checkinDate) initErrors.checkinDate = true;
    if (!loaded.onboardingPaymentMode) initErrors.onboardingPaymentMode = true;
    if (isDaily) {
      if (!loaded.dailyRent || Number(loaded.dailyRent) <= 0) initErrors.dailyRent = true;
      if (!loaded.numberOfDays || Number(loaded.numberOfDays) <= 0) initErrors.numberOfDays = true;
    } else {
      if (!loaded.monthlyRent || Number(loaded.monthlyRent) <= 0) initErrors.monthlyRent = true;
      if (loaded.deposit === "" || loaded.deposit === null || loaded.deposit === undefined) initErrors.deposit = true;
    }
    // Police verification fields
    if (!loaded.dob) initErrors.dob = true;
    if (!loaded.gender) initErrors.gender = true;
    if (!loaded.aadhaarNumber || String(loaded.aadhaarNumber).trim().length < 12) initErrors.aadhaarNumber = true;
    if (!loaded.permanentAddress?.trim()) initErrors.permanentAddress = true;
    if (!loaded.permanentState) initErrors.permanentState = true;
    if (!loaded.permanentCity) initErrors.permanentCity = true;
    if (!loaded.permanentPincode || String(loaded.permanentPincode).trim().length < 6) initErrors.permanentPincode = true;
    if (!loaded.guardianName?.trim()) initErrors.guardianName = true;
    if (!loaded.guardianRelation) initErrors.guardianRelation = true;
    if (!loaded.guardianPhone || String(loaded.guardianPhone).trim().length < 10) initErrors.guardianPhone = true;
    if (!loaded.localGuardianName?.trim()) initErrors.localGuardianName = true;
    if (!loaded.localGuardianPhone || String(loaded.localGuardianPhone).trim().length < 10) initErrors.localGuardianPhone = true;
    // Additional required fields
    if (!loaded.email || !loaded.email.trim()) initErrors.email = true;
    if (!loaded.occupation) initErrors.occupation = true;
    if (!loaded.education?.trim()) initErrors.education = true;
    if (!loaded.collegeOrCompanyName?.trim()) initErrors.collegeOrCompanyName = true;
    if (!loaded.foodFacility) initErrors.foodFacility = true;
    if (!loaded.expectedCheckoutDate) initErrors.expectedCheckoutDate = true;
    if (!loaded.localGuardianRelation) initErrors.localGuardianRelation = true;
    if (!loaded.localGuardianAddress?.trim()) initErrors.localGuardianAddress = true;
    setFormErrors(initErrors);

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
  }, [form.deposit, form.futureDepositRefund]);

  const isDaily = form.stayType === "DAILY_BASIC";
  const total = useMemo(
    () =>
      isDaily
        ? Number(form.dailyRent || 0) * Number(form.numberOfDays || 0)
        : Number(form.monthlyRent || 0) + Number(form.deposit || 0),
    [isDaily, form.dailyRent, form.numberOfDays, form.monthlyRent, form.deposit]
  );

  const handleScrollToError = () => {
    setTimeout(() => {
      const firstErrorEl = document.querySelector('.error-field, .is-invalid');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorEl.focus();
      }
    }, 100);
  };

  const REQUIRED_FIELDS = ['name', 'phone', 'checkinDate', 'onboardingPaymentMode', 'monthlyRent', 'deposit', 'dailyRent', 'numberOfDays'];

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user types something valid
    if (value !== "" && value !== null && value !== undefined) {
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: false }));
      }
    } else if (REQUIRED_FIELDS.includes(field)) {
      // Immediately show error if a mandatory field is cleared
      setFormErrors(prev => ({ ...prev, [field]: true }));
    }
  };

  const submit = async () => {
    const newErrors = {};

    // Basic required fields
    if (!form.name || !form.name.trim()) newErrors.name = true;
    if (!form.phone || String(form.phone).trim().length !== 10) newErrors.phone = true;
    if (!form.checkinDate) newErrors.checkinDate = true;
    if (!form.onboardingPaymentMode) newErrors.onboardingPaymentMode = true;
    if (isDaily) {
      if (!form.dailyRent || Number(form.dailyRent) <= 0) newErrors.dailyRent = true;
      if (!form.numberOfDays || Number(form.numberOfDays) <= 0) newErrors.numberOfDays = true;
    } else {
      if (!form.monthlyRent || Number(form.monthlyRent) <= 0) newErrors.monthlyRent = true;
      if (form.deposit === "" || form.deposit === null || form.deposit === undefined) newErrors.deposit = true;
    }

    // Police verification required fields — block save if any are missing
    if (!form.dob) newErrors.dob = true;
    if (!form.gender) newErrors.gender = true;
    if (!form.aadhaarNumber || String(form.aadhaarNumber).trim().length < 12) newErrors.aadhaarNumber = true;
    if (!form.permanentAddress?.trim()) newErrors.permanentAddress = true;
    if (!form.permanentState) newErrors.permanentState = true;
    if (!form.permanentCity) newErrors.permanentCity = true;
    if (!form.permanentPincode || String(form.permanentPincode).trim().length < 6) newErrors.permanentPincode = true;
    if (!form.guardianName?.trim()) newErrors.guardianName = true;
    if (!form.guardianRelation) newErrors.guardianRelation = true;
    if (!form.guardianPhone || String(form.guardianPhone).trim().length < 10) newErrors.guardianPhone = true;
    if (!form.localGuardianName?.trim()) newErrors.localGuardianName = true;
    if (!form.localGuardianPhone || String(form.localGuardianPhone).trim().length < 10) newErrors.localGuardianPhone = true;
    // Additional required fields
    if (!form.email || !form.email.trim()) newErrors.email = true;
    if (!form.occupation) newErrors.occupation = true;
    if (!form.education?.trim()) newErrors.education = true;
    if (!form.collegeOrCompanyName?.trim()) newErrors.collegeOrCompanyName = true;
    if (!form.foodFacility) newErrors.foodFacility = true;
    if (!form.expectedCheckoutDate) newErrors.expectedCheckoutDate = true;
    if (!form.localGuardianRelation) newErrors.localGuardianRelation = true;
    if (!form.localGuardianAddress?.trim()) newErrors.localGuardianAddress = true;

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      handleScrollToError();
      toast("Please fill all required fields marked in red.", { icon: "⚠️" });
      return;
    }
    setFormErrors({});
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
            <div className="pfield">
              <label>Full Name <span className="req">*</span></label>
              <Form.Control
                type="text"
                placeholder="Enter full name"
                isInvalid={formErrors.name}
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value.replace(/[^a-zA-Z\s]/g, '').trimStart())}
              />
            </div>

            <div className="pfield">
              <label>Phone Number <span className="req">*</span></label>
              <Form.Control
                type="tel"
                placeholder="10 digit phone number"
                isInvalid={formErrors.phone}
                value={form.phone}
                onChange={(e) => handleInputChange('phone', digitsOnly(e.target.value).slice(0, 10))}
              />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Email <span className="req">*</span></label>
              <Form.Control
                type="email"
                isInvalid={formErrors.email}
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value.trim() }); if (e.target.value.trim()) setFormErrors(prev => ({ ...prev, email: false })); }}
              />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Gender <span className="req">*</span></label>
              <Form.Select isInvalid={formErrors.gender} value={form.gender} onChange={(e) => { setForm({ ...form, gender: e.target.value }); if (e.target.value) setFormErrors(prev => ({ ...prev, gender: false })); }}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Form.Select>
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Date of Birth <span className="req">*</span></label>
              <Form.Control type="date" isInvalid={formErrors.dob} value={form.dob} max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} onChange={(e) => { setForm({ ...form, dob: e.target.value }); if (e.target.value) setFormErrors(prev => ({ ...prev, dob: false })); }} />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Aadhaar Number <span className="req">*</span></label>
              <Form.Control
                type="tel"
                inputMode="numeric"
                maxLength={12}
                isInvalid={formErrors.aadhaarNumber}
                value={form.aadhaarNumber}
                onChange={(e) => { const v = digitsOnly(e.target.value).slice(0, 12); setForm({ ...form, aadhaarNumber: v }); if (v.length === 12) setFormErrors(prev => ({ ...prev, aadhaarNumber: false })); }}
              />
            </div>

            <div className="arm-field" data-mobile-full="true">
              <label>Occupation <span className="req">*</span></label>
              <Form.Select isInvalid={formErrors.occupation} value={form.occupation} onChange={(e) => { setForm({ ...form, occupation: e.target.value }); if (e.target.value) setFormErrors(prev => ({ ...prev, occupation: false })); }}>
                <option value="">Select</option>
                <option value="Student">Student</option>
                <option value="Working Professional">Working Professional</option>
                <option value="Other">Other</option>
              </Form.Select>
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Education <span className="req">*</span></label>
              <Form.Control isInvalid={formErrors.education} value={form.education} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s,.-]/g, '').trimStart(); setForm({ ...form, education: v }); if (v.trim()) setFormErrors(prev => ({ ...prev, education: false })); }} />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>College / Company <span className="req">*</span></label>
              <Form.Control isInvalid={formErrors.collegeOrCompanyName} value={form.collegeOrCompanyName} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s,.-]/g, '').trimStart(); setForm({ ...form, collegeOrCompanyName: v }); if (v.trim()) setFormErrors(prev => ({ ...prev, collegeOrCompanyName: false })); }} />
            </div>

            <hr className="arm-section-divider" />

            <h6 style={{ gridColumn: "1 / -1", marginBottom: 0 }}>Rent Details</h6>
            {isDaily ? (
              <>
                <div className="pfield">
                  <label>Daily Rent <span className="req">*</span></label>
                  <Form.Control type="number" placeholder="Daily Rent" isInvalid={formErrors.dailyRent} value={form.dailyRent} onChange={(e) => handleInputChange('dailyRent', e.target.value)} />
                </div>
                <div className="pfield">
                  <label>Number of Days <span className="req">*</span></label>
                  <Form.Control type="number" placeholder="No. of Days" isInvalid={formErrors.numberOfDays} value={form.numberOfDays} onChange={(e) => handleInputChange('numberOfDays', e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div className="pfield">
                  <label>Monthly Rent <span className="req">*</span></label>
                  <Form.Control type="number" placeholder="Rent Amount" isInvalid={formErrors.monthlyRent} value={form.monthlyRent} onChange={(e) => handleInputChange('monthlyRent', e.target.value)} />
                </div>
                <div className="pfield">
                  <label>Security Deposit <span className="req">*</span></label>
                  <Form.Control type="number" placeholder="Deposit Amount" isInvalid={formErrors.deposit} value={form.deposit} onChange={(e) => handleInputChange('deposit', e.target.value)} />
                </div>
                <div className="arm-field">
                  <label>Future Deposit Refund</label>
                  <Form.Control type="number" value={form.futureDepositRefund} onChange={(e) => setForm({ ...form, futureDepositRefund: e.target.value })} onWheel={(e) => e.target.blur()} />
                </div>
              </>
            )}

            <div className="pfield">
              <label>Check-in Date <span className="req">*</span></label>
              <Form.Control type="date" isInvalid={formErrors.checkinDate} value={form.checkinDate} onChange={(e) => handleInputChange('checkinDate', e.target.value)} />
            </div>
            <div className="arm-field">
              <label>Expected Checkout <span className="req">*</span></label>
              <Form.Control type="date" isInvalid={formErrors.expectedCheckoutDate} value={form.expectedCheckoutDate} onChange={(e) => { setForm({ ...form, expectedCheckoutDate: e.target.value }); if (e.target.value) setFormErrors(prev => ({ ...prev, expectedCheckoutDate: false })); }} />
            </div>
            <div className="arm-field full">
              <label>Total Payable</label>
              <Form.Control value={formatMoney(total)} disabled />
            </div>
            <div className="pfield">
              <label>Payment Mode <span className="req">*</span></label>
              <Form.Select isInvalid={formErrors.onboardingPaymentMode} value={form.onboardingPaymentMode} onChange={(e) => handleInputChange('onboardingPaymentMode', e.target.value)}>
                <option value="">Select Mode</option>
                {["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "WALLET"].map(m => (
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
              <label>Food Facility <span className="req">*</span></label>
              <Form.Select isInvalid={formErrors.foodFacility} value={form.foodFacility} onChange={(e) => { setForm({ ...form, foodFacility: e.target.value }); if (e.target.value) setFormErrors(prev => ({ ...prev, foodFacility: false })); }}>
                <option value="">Select</option>
                <option value="With Food">With Food</option>
                <option value="Without Food">Without Food</option>
              </Form.Select>
            </div>


            <h6 className="mt-4" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>Permanent Address</h6>
            <div className="arm-field full">
              <label>Address Line <span className="req">*</span></label>
              <Form.Control isInvalid={formErrors.permanentAddress} value={form.permanentAddress} onChange={(e) => { setForm({ ...form, permanentAddress: e.target.value }); if (e.target.value.trim()) setFormErrors(prev => ({ ...prev, permanentAddress: false })); }} />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>State <span className="req">*</span></label>
              <Form.Select isInvalid={formErrors.permanentState} value={form.permanentState} onChange={(e) => { setForm({ ...form, permanentState: e.target.value, permanentCity: "" }); if (e.target.value) setFormErrors(prev => ({ ...prev, permanentState: false })); }}>
                <option value="">Select State</option>
                {indianStates.map((s) => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
              </Form.Select>
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>City <span className="req">*</span></label>
              <Form.Select isInvalid={formErrors.permanentCity} value={form.permanentCity} onChange={(e) => { setForm({ ...form, permanentCity: e.target.value }); if (e.target.value) setFormErrors(prev => ({ ...prev, permanentCity: false })); }} disabled={!form.permanentState}>
                <option value="">Select City</option>
                {indianCities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </Form.Select>
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Pincode <span className="req">*</span></label>
              <Form.Control type="tel" inputMode="numeric" maxLength={6} isInvalid={formErrors.permanentPincode} value={form.permanentPincode} onChange={(e) => { const v = digitsOnly(e.target.value).slice(0, 6); setForm({ ...form, permanentPincode: v }); if (v.length === 6) setFormErrors(prev => ({ ...prev, permanentPincode: false })); }} />
            </div>

            <h6 className="mt-4" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>Guardian Information</h6>
            <div className="arm-field" data-mobile-full="true">
              <label>Father's / Guardian's Name <span className="req">*</span></label>
              <Form.Control isInvalid={formErrors.guardianName} value={form.guardianName} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s]/g, '').trimStart(); setForm({ ...form, guardianName: v }); if (v.trim()) setFormErrors(prev => ({ ...prev, guardianName: false })); }} />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Relation <span className="req">*</span></label>
              <Form.Select isInvalid={formErrors.guardianRelation} value={form.guardianRelation} onChange={(e) => { setForm({ ...form, guardianRelation: e.target.value }); if (e.target.value) setFormErrors(prev => ({ ...prev, guardianRelation: false })); }}>
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
              <label>Father's / Guardian's Phone <span className="req">*</span></label>
              <Form.Control type="tel" inputMode="numeric" maxLength={10} isInvalid={formErrors.guardianPhone} value={form.guardianPhone} onChange={(e) => { const v = digitsOnly(e.target.value).slice(0, 10); setForm({ ...form, guardianPhone: v }); if (v.length === 10) setFormErrors(prev => ({ ...prev, guardianPhone: false })); }} />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Local Guardian's Name <span className="req">*</span></label>
              <Form.Control isInvalid={formErrors.localGuardianName} value={form.localGuardianName} onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s]/g, '').trimStart(); setForm({ ...form, localGuardianName: v }); if (v.trim()) setFormErrors(prev => ({ ...prev, localGuardianName: false })); }} />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Local Guardian's Relation <span className="req">*</span></label>
              <Form.Select isInvalid={formErrors.localGuardianRelation} value={form.localGuardianRelation} onChange={(e) => { setForm({ ...form, localGuardianRelation: e.target.value }); if (e.target.value) setFormErrors(prev => ({ ...prev, localGuardianRelation: false })); }}>
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
              <label>Local Guardian's Phone <span className="req">*</span></label>
              <Form.Control type="tel" inputMode="numeric" maxLength={10} isInvalid={formErrors.localGuardianPhone} value={form.localGuardianPhone} onChange={(e) => { const v = digitsOnly(e.target.value).slice(0, 10); setForm({ ...form, localGuardianPhone: v }); if (v.length === 10) setFormErrors(prev => ({ ...prev, localGuardianPhone: false })); }} />
            </div>
            <div className="arm-field full">
              <label>Local Guardian's Address <span className="req">*</span></label>
              <Form.Control isInvalid={formErrors.localGuardianAddress} value={form.localGuardianAddress} onChange={(e) => { setForm({ ...form, localGuardianAddress: e.target.value }); if (e.target.value.trim()) setFormErrors(prev => ({ ...prev, localGuardianAddress: false })); }} />
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