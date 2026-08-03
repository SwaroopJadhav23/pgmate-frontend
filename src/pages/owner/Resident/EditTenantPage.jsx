import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Form } from "react-bootstrap";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { digitsOnly, isValidEmail, isValidPhone } from "../../../utils/formValidators";
import "./Resident.css";
import "./Agreement.css";
import "./AddResidentModal.css"; // ← gives arm-page / arm-page-header / arm-page-actions

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  monthlyRent: "",
  deposit: "",
  dailyRent: "",
  numberOfDays: "",
  checkinDate: "",
  expectedCheckoutDate: "",
  onboardingPaymentMode: "",
  stayType: "MONTHLY_BASIC",
  foodPreference: "",
  emergencyContactName: "",
  emergencyContact: "",
  emergencyContactRelation: "",
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

  const [resident, setResident] = useState(location.state?.resident || null);
  const [loadingResident, setLoadingResident] = useState(!location.state?.resident);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [paymentFile, setPaymentFile] = useState(null);
  const [removePaymentProof, setRemovePaymentProof] = useState(false);
  const [idProofFile, setIdProofFile] = useState(null);
  const [removeIdProof, setRemoveIdProof] = useState(false);

  // ── fetch resident if not passed via navigate() state (e.g. direct URL / refresh) ──
  useEffect(() => {
    if (resident) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingResident(true);
        const res = await api.get(residentEndpoint);
        const found = (res.data || []).find((r) => String(r.residentId) === String(residentId));
        if (!cancelled) {
          if (found) setResident(found);
          else toast.error("Tenant not found.");
        }
      } catch {
        if (!cancelled) toast.error("Failed to load tenant.");
      } finally {
        if (!cancelled) setLoadingResident(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [residentId]);

  // ── populate form once resident is available ──
  useEffect(() => {
    if (!resident) return;
    setForm({
      name: resident.name || "",
      phone: resident.phone || "",
      email: resident.email || "",
      monthlyRent: resident.monthlyRent || "",
      deposit: resident.deposit || "",
      dailyRent: resident.dailyRent || "",
      numberOfDays: resident.numberOfDays || "",
      checkinDate: formatForInput(resident.checkinDate),
      expectedCheckoutDate: formatForInput(resident.expectedCheckoutDate),
      onboardingPaymentMode: resident.onboardingPaymentMode || "",
      stayType: resident.stayType || "MONTHLY_BASIC",
      foodPreference: resident.foodPreference || "",
      emergencyContactName: resident.emergencyContactName || "",
      emergencyContact: resident.emergencyContact || "",
      emergencyContactRelation: resident.emergencyContactRelation || "",
    });
    setPaymentFile(null);
    setIdProofFile(null);
    setRemovePaymentProof(false);
    setRemoveIdProof(false);
  }, [resident]);

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
      toast("Please fill all required fields.", { icon: "⚠️" });
      return;
    }
    if (!isValidPhone(form.phone)) {
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
      fd.append("name", form.name.trim());
      fd.append("phone", form.phone);
      fd.append("email", form.email.trim());
      fd.append("stayType", form.stayType);

      if (isDaily) {
        fd.append("dailyRent", Number(form.dailyRent));
        fd.append("numberOfDays", Number(form.numberOfDays));
      } else {
        fd.append("monthlyRent", Number(form.monthlyRent));
        fd.append("deposit", Number(form.deposit));
      }

      if (form.checkinDate) {
        const f = normalizeDateForAPI(form.checkinDate);
        if (f) fd.append("checkinDate", f);
      }
      if (form.expectedCheckoutDate) {
        const f = normalizeDateForAPI(form.expectedCheckoutDate);
        if (f) fd.append("expectedCheckoutDate", f);
      }

      if (form.onboardingPaymentMode === "CASH") {
        fd.append("onboardingPaymentMode", "CASH");
        fd.append("onboardingPaymentAmount", total);
        fd.append("removeOnboardingPaymentProof", "true");
      } else if (form.onboardingPaymentMode) {
        fd.append("onboardingPaymentMode", form.onboardingPaymentMode);
        fd.append("onboardingPaymentAmount", total);
        if (removePaymentProof) fd.append("removeOnboardingPaymentProof", "true");
        if (paymentFile) fd.append("onboardingPaymentProof", paymentFile);
      }

      if (idProofFile) fd.append("idProof", idProofFile);
      if (removeIdProof) fd.append("removeIdProof", "true");
      if (form.foodPreference) fd.append("foodPreference", form.foodPreference);

      fd.append("emergencyContactName", form.emergencyContactName.trim());
      fd.append("emergencyContact", form.emergencyContact.trim());
      fd.append("emergencyContactRelation", form.emergencyContactRelation.trim());

      await api.put(`${residentEndpoint}/${residentId}`, fd);
      toast.success("Resident updated successfully.");
      navigate(-1); // back to Tenants list
    } catch {
      toast.error("Failed to update resident.");
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
          <div className="arm-page-body">Tenant not found.</div>
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
            <div className="arm-field" data-mobile-full="true">
              <label>Name</label>
              <Form.Control
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.trimStart() })}
              />
            </div>

            <div className="arm-field" data-mobile-full="true">
              <label>Phone</label>
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
              <label>Stay Type</label>
              <Form.Control value={isDaily ? "Daily Basic" : "Monthly Basic"} disabled />
            </div>

            {isDaily ? (
              <>
                <div className="arm-field">
                  <label>Daily Rent</label>
                  <Form.Control
                    type="number"
                    value={form.dailyRent}
                    onChange={(e) => setForm({ ...form, dailyRent: e.target.value })}
                  />
                </div>
                <div className="arm-field">
                  <label>Number of Days</label>
                  <Form.Control
                    type="number"
                    value={form.numberOfDays}
                    onChange={(e) => setForm({ ...form, numberOfDays: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="arm-field">
                  <label>Monthly Rent</label>
                  <Form.Control
                    type="number"
                    value={form.monthlyRent}
                    onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                  />
                </div>
                <div className="arm-field">
                  <label>Deposit</label>
                  <Form.Control
                    type="number"
                    value={form.deposit}
                    onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                  />
                </div>
              </>
            )}

            <hr className="arm-section-divider" />

            <div className="arm-field">
              <label>Check-in Date</label>
              <Form.Control
                type="date"
                value={form.checkinDate}
                onChange={(e) => setForm({ ...form, checkinDate: e.target.value })}
              />
            </div>
            <div className="arm-field">
              <label>Expected Checkout</label>
              <Form.Control
                type="date"
                value={form.expectedCheckoutDate}
                onChange={(e) => setForm({ ...form, expectedCheckoutDate: e.target.value })}
              />
            </div>
            <div className="arm-field full">
              <label>Total Payable</label>
              <Form.Control value={formatMoney(total)} disabled />
            </div>

            <div className="arm-field full">
              <label>Onboarding Payment Mode</label>
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
              <div className="arm-field">
                <label>Replace Payment Proof</label>
                <Form.Control
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    setPaymentFile(e.target.files[0]);
                    setRemovePaymentProof(false);
                  }}
                />
              </div>
            )}

            {form.onboardingPaymentMode !== "CASH" && (
              <div className="arm-field full">
                <Form.Check
                  className="edit-check"
                  label="Remove existing payment proof"
                  checked={removePaymentProof}
                  onChange={(e) => setRemovePaymentProof(e.target.checked)}
                />
              </div>
            )}

            <div className="arm-field" data-mobile-full="true">
              <label>Replace ID Proof</label>
              <Form.Control
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  setIdProofFile(e.target.files[0]);
                  setRemoveIdProof(false);
                }}
              />
            </div>
            <div className="arm-field full">
              <Form.Check
                className="edit-check"
                label="Remove existing ID proof"
                checked={removeIdProof}
                onChange={(e) => setRemoveIdProof(e.target.checked)}
              />
            </div>

            <hr className="arm-section-divider" />

            <div className="arm-field" data-mobile-full="true">
              <label>Food Preference</label>
              <Form.Select
                value={form.foodPreference}
                onChange={(e) => setForm({ ...form, foodPreference: e.target.value })}
              >
                <option value="">Select</option>
                <option value="VEG">Veg</option>
                <option value="NON_VEG">Non-Veg</option>
              </Form.Select>
            </div>

            <div className="arm-field" data-mobile-full="true">
              <label>Emergency Contact Name</label>
              <Form.Control
                placeholder="e.g. Ramesh Kumar"
                value={form.emergencyContactName}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value.trimStart() })}
              />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Emergency Contact Number</label>
              <Form.Control
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: digitsOnly(e.target.value).slice(0, 10) })}
              />
            </div>
            <div className="arm-field" data-mobile-full="true">
              <label>Relation</label>
              <Form.Select
                value={form.emergencyContactRelation}
                onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })}
              >
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
          </div>
        </div>

        <div className="arm-page-actions">
          <button className="modal-btn cancel" onClick={() => navigate(-1)}>Cancel</button>
          <button className="modal-btn success" disabled={saving} onClick={submit}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditTenantPage;