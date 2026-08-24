import { useState, useRef, useEffect } from "react";
import { Form } from "react-bootstrap";
import { FaUser, FaBriefcase, FaHome, FaUserTie, FaMapMarkerAlt, FaIdCard, FaAmbulance, FaCreditCard } from "react-icons/fa";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { isValidEmail, isValidPhone } from "../../utils/formValidators";

const PAYMENT_MODES = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "WALLET",
];

const SectionCard = ({ title, icon: Icon, children }) => (
  <div style={{
    backgroundColor: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
  }}>
    <h6 style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      color: "#2b3445",
      borderBottom: "1px solid #e9ecef",
      paddingBottom: "12px",
      marginBottom: "20px",
      fontWeight: "bold",
      fontSize: "1.1rem"
    }}>
      <Icon style={{ color: "#4e73df", fontSize: "1.2rem" }} />
      {title}
    </h6>
    {children}
  </div>
);

const FilePreview = ({ file }) => {
  const [showPreview, setShowPreview] = useState(false);
  
  if (!file) return null;
  const isImage = file.type.startsWith('image/');
  const fileUrl = URL.createObjectURL(file);

  return (
    <div className="mt-1">
      {isImage ? (
        <>
          <span 
            onClick={() => setShowPreview(true)}
            style={{ fontSize: '14px', color: '#4e73df', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '500' }}
          >
            View Photo ↗
          </span>
          {showPreview && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 100000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }} onClick={() => setShowPreview(false)}>
              <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                <img src={fileUrl} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
                <button 
                  onClick={() => setShowPreview(false)}
                  style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#fff', color: '#333', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <span style={{ fontSize: '14px', color: '#555', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          📄 {file.name}
        </span>
      )}
    </div>
  );
};

const TenantOnboardingForm = ({ show, onClose, onSuccess, residentId, prefill }) => {
  // Calculate max date of birth: 5 years ago from today
  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 5);
  const maxDobString = maxDob.toISOString().split("T")[0];

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("");
  const [file, setFile] = useState(null);
  const [depositFile, setDepositFile] = useState(null);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  const [formData, setFormData] = useState({
    name: prefill?.name || "",
    phone: prefill?.phone || "",
    email: prefill?.email || "",
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
    localGuardianAddress: ""
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [aadhaarCard, setAadhaarCard] = useState(null);
  const [agreementSignature, setAgreementSignature] = useState(null);

  useEffect(() => {
    if (show) {
      api.get("/users/me").then(res => {
        const u = res.data;
        setFormData(prev => ({
          ...prev,
          name: prev.name || u.name || "",
          phone: prev.phone || u.phone || "",
          email: prev.email || u.email || "",
          permanentCity: prev.permanentCity || u.city || "",
        }));
      }).catch(() => {});
    }
  }, [show]);

  const LETTER_ONLY_FIELDS = [
    "name",
    "occupation",
    "permanentState",
    "permanentCity",
    "guardianName",
    "guardianRelation",
    "localGuardianName",
    "localGuardianRelation",
    "emergencyContactName",
    "emergencyContactRelation"
  ];

  const NUMBER_ONLY_FIELDS = [
    "aadhaarNumber",
    "emergencyContact"
  ];

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (LETTER_ONLY_FIELDS.includes(name)) {
      value = value.replace(/\d/g, ""); // Remove any digits
    } else if (NUMBER_ONLY_FIELDS.includes(name)) {
      value = value.replace(/\D/g, ""); // Remove any non-digits
    }
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};

    const requiredFields = [
      "name", "phone", "email", "dob", "gender", "occupation", "education",
      "collegeOrCompanyName", "permanentAddress", "permanentState", "permanentCity",
      "permanentPincode", "guardianName", "guardianRelation", "guardianPhone",
      "localGuardianName", "localGuardianRelation", "localGuardianPhone", "localGuardianAddress",
      "aadhaarNumber", "emergencyContactName", "emergencyContact", "emergencyContactRelation",
      "foodFacility"
    ];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    if (formData.phone && !isValidPhone(formData.phone)) newErrors.phone = "Enter a valid 10-digit phone number";
    if (formData.email && !isValidEmail(formData.email)) newErrors.email = "Enter a valid email address";
    
    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 15);
      if (dobDate > minAgeDate) newErrors.dob = "Must be at least 15 years old";
    }

    if (formData.aadhaarNumber && formData.aadhaarNumber.length !== 12) {
      newErrors.aadhaarNumber = "Aadhaar must be exactly 12 digits";
    }

    if (formData.permanentPincode && formData.permanentPincode.length !== 6) {
      newErrors.permanentPincode = "Pincode must be exactly 6 digits";
    }

    if (formData.guardianPhone && !isValidPhone(formData.guardianPhone)) {
      newErrors.guardianPhone = "Enter a valid 10-digit phone number";
    }

    if (formData.localGuardianPhone && !isValidPhone(formData.localGuardianPhone)) {
      newErrors.localGuardianPhone = "Enter a valid 10-digit phone number";
    }

    if (formData.emergencyContact && !isValidPhone(formData.emergencyContact)) {
      newErrors.emergencyContact = "Enter a valid 10-digit phone number";
    }

    if (!mode) {
      newErrors.mode = "Payment mode is required";
    } else if (mode !== "CASH" && !file) {
      newErrors.file = "Payment proof is required for non-cash payments";
    }

    if (!aadhaarCard) {
      newErrors.aadhaarCard = "Aadhaar image is required";
    }

    if (!profilePhoto) {
      newErrors.profilePhoto = "Profile photo is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all the mandatory fields.");
      setTimeout(() => {
        const firstErrorEl = document.querySelector(".is-invalid");
        if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return false;
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const fd = new FormData();
    if (mode) {
      fd.append("onboardingPaymentMode", mode);
      if (mode !== "CASH" && file) fd.append("onboardingPaymentProof", file);
    }
    
    Object.keys(formData).forEach((key) => {
      if (formData[key]) fd.append(key, formData[key]);
    });

    if (profilePhoto) fd.append("profilePhoto", profilePhoto);
    if (aadhaarCard) fd.append("aadhaarCard", aadhaarCard);
    if (agreementSignature) fd.append("agreementSignature", agreementSignature);
    if (depositFile) fd.append("depositProof", depositFile);

    setLoading(true);
    try {
      await api.put(`/residents/${residentId}/complete-onboarding`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Details submitted successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop-custom" style={{ zIndex: 9999 }}>
      <div className="modal-box" style={{ width: "min(600px, 95vw)", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="modal-header-custom">
          <h4>Complete Onboarding Details</h4>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>
        <div className="modal-body" style={{ padding: "20px" }}>
          <form onSubmit={submit}>
            <SectionCard title="Personal Details" icon={FaUser}>
            <div className="row">
              <div className="col-md-12 mb-2">
                <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} isInvalid={!!errors.name} />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </div>
              <div className="col-md-6 mb-2">
                <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                <Form.Control type="tel" maxLength="10" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} isInvalid={!!errors.phone} />
                <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
              </div>
              <div className="col-md-6 mb-2">
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} isInvalid={!!errors.email} />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </div>
              <div className="col-md-6 mb-2">
                <Form.Label>Date of Birth <span className="text-danger">*</span></Form.Label>
                <Form.Control type="date" name="dob" max={maxDobString} value={formData.dob} onChange={handleChange} isInvalid={!!errors.dob} />
                <Form.Control.Feedback type="invalid">{errors.dob}</Form.Control.Feedback>
              </div>
              <div className="col-md-6 mb-2">
                <Form.Label>Gender <span className="text-danger">*</span></Form.Label>
                <Form.Select name="gender" value={formData.gender} onChange={handleChange} isInvalid={!!errors.gender}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.gender}</Form.Control.Feedback>
              </div>

              <div className="col-md-6 mb-2">
                <Form.Label>Food Facility <span className="text-danger">*</span></Form.Label>
                <Form.Select name="foodFacility" value={formData.foodFacility} onChange={handleChange} isInvalid={!!errors.foodFacility}>
                  <option value="">Select</option>
                  <option value="With Food">With Food</option>
                  <option value="Without Food">Without Food</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.foodFacility}</Form.Control.Feedback>
              </div>
            </div>
            </SectionCard>

            <SectionCard title="Professional / Education" icon={FaBriefcase}>
            <div className="row">
              <div className="col-12 mb-2">
                <Form.Label>Occupation <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="occupation" value={formData.occupation} onChange={handleChange} isInvalid={!!errors.occupation} />
                <Form.Control.Feedback type="invalid">{errors.occupation}</Form.Control.Feedback>
              </div>
              <div className="col-12 mb-2">
                <Form.Label>Education <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="education" value={formData.education} onChange={handleChange} isInvalid={!!errors.education} />
                <Form.Control.Feedback type="invalid">{errors.education}</Form.Control.Feedback>
              </div>
              <div className="col-12 mb-2">
                <Form.Label>Company / College <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="collegeOrCompanyName" value={formData.collegeOrCompanyName} onChange={handleChange} isInvalid={!!errors.collegeOrCompanyName} />
                <Form.Control.Feedback type="invalid">{errors.collegeOrCompanyName}</Form.Control.Feedback>
              </div>
            </div>
            </SectionCard>

            <SectionCard title="Permanent Address" icon={FaHome}>
            <div className="row">
              <div className="col-md-12 mb-2">
                <Form.Label>Address Line <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} isInvalid={!!errors.permanentAddress} />
                <Form.Control.Feedback type="invalid">{errors.permanentAddress}</Form.Control.Feedback>
              </div>
              <div className="col-md-4 mb-2">
                <Form.Label>State <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="permanentState" value={formData.permanentState} onChange={handleChange} isInvalid={!!errors.permanentState} />
                <Form.Control.Feedback type="invalid">{errors.permanentState}</Form.Control.Feedback>
              </div>
              <div className="col-md-4 mb-2">
                <Form.Label>City <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="permanentCity" value={formData.permanentCity} onChange={handleChange} isInvalid={!!errors.permanentCity} />
                <Form.Control.Feedback type="invalid">{errors.permanentCity}</Form.Control.Feedback>
              </div>
              <div className="col-md-4 mb-2">
                <Form.Label>Pincode <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" maxLength="6" name="permanentPincode" value={formData.permanentPincode} onChange={(e) => setFormData({ ...formData, permanentPincode: e.target.value.replace(/\D/g, '') })} isInvalid={!!errors.permanentPincode} />
                <Form.Control.Feedback type="invalid">{errors.permanentPincode}</Form.Control.Feedback>
              </div>
            </div>
            </SectionCard>

            <SectionCard title="Guardian Information" icon={FaUserTie}>
            <div className="row">
              <div className="col-md-4 mb-2">
                <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} isInvalid={!!errors.guardianName} />
                <Form.Control.Feedback type="invalid">{errors.guardianName}</Form.Control.Feedback>
              </div>
              <div className="col-md-4 mb-2">
                <Form.Label>Relation <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="guardianRelation" value={formData.guardianRelation} onChange={handleChange} isInvalid={!!errors.guardianRelation} />
                <Form.Control.Feedback type="invalid">{errors.guardianRelation}</Form.Control.Feedback>
              </div>
              <div className="col-md-4 mb-2">
                <Form.Label>Phone <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" maxLength="10" name="guardianPhone" value={formData.guardianPhone} onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value.replace(/\D/g, '') })} isInvalid={!!errors.guardianPhone} />
                <Form.Control.Feedback type="invalid">{errors.guardianPhone}</Form.Control.Feedback>
              </div>
            </div>
            </SectionCard>

            <SectionCard title="Local Guardian Information" icon={FaMapMarkerAlt}>
            <div className="row">
              <div className="col-md-4 mb-2">
                <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="localGuardianName" value={formData.localGuardianName} onChange={handleChange} isInvalid={!!errors.localGuardianName} />
                <Form.Control.Feedback type="invalid">{errors.localGuardianName}</Form.Control.Feedback>
              </div>
              <div className="col-md-4 mb-2">
                <Form.Label>Relation <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="localGuardianRelation" value={formData.localGuardianRelation} onChange={handleChange} isInvalid={!!errors.localGuardianRelation} />
                <Form.Control.Feedback type="invalid">{errors.localGuardianRelation}</Form.Control.Feedback>
              </div>
              <div className="col-md-4 mb-2">
                <Form.Label>Phone <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" maxLength="10" name="localGuardianPhone" value={formData.localGuardianPhone} onChange={(e) => setFormData({ ...formData, localGuardianPhone: e.target.value.replace(/\D/g, '') })} isInvalid={!!errors.localGuardianPhone} />
                <Form.Control.Feedback type="invalid">{errors.localGuardianPhone}</Form.Control.Feedback>
              </div>
              <div className="col-md-12 mb-2">
                <Form.Label>Address <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="localGuardianAddress" value={formData.localGuardianAddress} onChange={handleChange} isInvalid={!!errors.localGuardianAddress} />
                <Form.Control.Feedback type="invalid">{errors.localGuardianAddress}</Form.Control.Feedback>
              </div>
            </div>
            </SectionCard>

            <SectionCard title="KYC & Documents" icon={FaIdCard}>
            <div className="row">
              <div className="col-md-6 mb-2">
                <Form.Label>Aadhaar Number <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="aadhaarNumber" maxLength="12" value={formData.aadhaarNumber} onChange={handleChange} isInvalid={!!errors.aadhaarNumber} />
                <Form.Control.Feedback type="invalid">{errors.aadhaarNumber}</Form.Control.Feedback>
              </div>
              <div className="col-md-6 mb-2">
                <Form.Label>Aadhaar Image <span className="text-danger">*</span></Form.Label>
                <Form.Control type="file" accept="image/*,.pdf" onChange={(e) => setAadhaarCard(e.target.files[0])} isInvalid={!!errors.aadhaarCard} />
                <Form.Control.Feedback type="invalid">{errors.aadhaarCard}</Form.Control.Feedback>
                <FilePreview file={aadhaarCard} />
              </div>
              <div className="col-md-6 mb-2">
                <Form.Label>Profile Photo <span className="text-danger">*</span></Form.Label>
                <Form.Control type="file" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files[0])} isInvalid={!!errors.profilePhoto} />
                <Form.Control.Feedback type="invalid">{errors.profilePhoto}</Form.Control.Feedback>
                <FilePreview file={profilePhoto} />
              </div>
              <div className="col-md-6 mb-2">
                <Form.Label>Agreement Signature</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={(e) => setAgreementSignature(e.target.files[0])} isInvalid={!!errors.agreementSignature} />
                <Form.Control.Feedback type="invalid">{errors.agreementSignature}</Form.Control.Feedback>
                <FilePreview file={agreementSignature} />
              </div>
            </div>
            </SectionCard>

            <SectionCard title="Emergency Contact" icon={FaAmbulance}>
            <div className="row">
              <div className="col-md-6 mb-2">
                <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} isInvalid={!!errors.emergencyContactName} />
                <Form.Control.Feedback type="invalid">{errors.emergencyContactName}</Form.Control.Feedback>
              </div>
              <div className="col-md-6 mb-2">
                <Form.Label>Phone <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="emergencyContact" maxLength="10" value={formData.emergencyContact} onChange={handleChange} isInvalid={!!errors.emergencyContact} />
                <Form.Control.Feedback type="invalid">{errors.emergencyContact}</Form.Control.Feedback>
              </div>
              <div className="col-md-6 mb-2">
                <Form.Label>Relation <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} isInvalid={!!errors.emergencyContactRelation} />
                <Form.Control.Feedback type="invalid">{errors.emergencyContactRelation}</Form.Control.Feedback>
              </div>
            </div>
            </SectionCard>

            <SectionCard title="Payment Info" icon={FaCreditCard}>
            <div className="row">
              <div className="col-md-6 mb-2">
                <Form.Label>Payment Mode <span className="text-danger">*</span></Form.Label>
                <Form.Select value={mode} onChange={(e) => setMode(e.target.value)} isInvalid={!!errors.mode}>
                  <option value="">Select</option>
                  {PAYMENT_MODES.map((m) => (
                    <option key={m} value={m}>{m.replace("_", " ")}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.mode}</Form.Control.Feedback>
              </div>
              
              {mode && mode !== "CASH" && (
                <>
                  <div className="col-md-6 mb-2">
                    <Form.Label>Payment Proof <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      ref={fileRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFile(e.target.files[0])}
                      isInvalid={!!errors.file}
                    />
                    <Form.Control.Feedback type="invalid">{errors.file}</Form.Control.Feedback>
                    <FilePreview file={file} />
                  </div>

                  <div className="col-md-6 mb-2">
                    <Form.Label>Deposit Proof (Optional)</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setDepositFile(e.target.files[0])}
                    />
                    <FilePreview file={depositFile} />
                  </div>
                </>
              )}
            </div>
            </SectionCard>

            <div className="mt-4" style={{ display: "flex", gap: "10px", justifyContent: "flex-end", padding: "10px 0" }}>
              <button type="button" className="modal-btn cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="modal-btn success" disabled={loading}>
                {loading ? "Submitting..." : "Submit Details"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TenantOnboardingForm;
