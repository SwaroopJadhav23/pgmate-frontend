import React, {useState, useEffect, useRef} from "react";
import {FiRefreshCw} from "react-icons/fi";
import Swal from "sweetalert2";
import LeaseAgreementHero from "../../components/LeaseAgreement/LeaseAgreementHero";
import LeaseForm from "../../components/LeaseAgreement/LeaseForm";
import LeasePreview from "../../components/LeaseAgreement/LeasePreview";
import LeaseAgreementFeatures from "../../components/LeaseAgreement/LeaseAgreementFeatures";
import "../../components/LeaseAgreement/LeaseAgreementGenerator.css";

const DEFAULT_FORM = {
  pgName: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  tenantName: "",
  tenantPhone: "",
  tenantEmail: "",
  propertyAddress: "",
  roomBedNumber: "",
  monthlyRent: "",
  securityDeposit: "",
  startDate: "",
  endDate: "",
  curfewTimings: "",
  guestPolicy: "",
  guestPolicyPreset: "",
  customGuestPolicies: [],
  smokingDrinkingRules: "",
  smokingPreset: "",
  customSmokingRules: [],
  selectedRules: [],
  generalCustomRules: [],
  noticePeriod: "30",
  additionalTerms: "",
  rentDueDay: "5",
  showTermRent: true,
  showTermDeposit: true,
  showTermPeriod: true,
  showRuleCurfew: true,
  showRuleGuest: true,
  showRuleSmoking: true,
  showRuleNotice: true,
  showRuleGeneral: true,
  customTerms: [],
};

const LeaseAgreementGenerator = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  const formRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const validateForm = (opts = {setErrors: true}) => {
    const e = {};
    if (!formData.pgName.trim()) e.pgName = "PG name is required";
    if (!formData.ownerName.trim()) e.ownerName = "Owner name is required";
    if (!formData.ownerPhone.trim()) e.ownerPhone = "Owner phone is required";
    else if (formData.ownerPhone.replace(/\D/g, "").length < 10)
      e.ownerPhone = "Enter a valid phone number (min 10 digits)";
      
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.ownerEmail && !emailRegex.test(formData.ownerEmail.trim())) {
      e.ownerEmail = "Enter a valid email address";
    }

    if (!formData.tenantName.trim()) e.tenantName = "Tenant name is required";
    
    if (!formData.tenantPhone.trim())
      e.tenantPhone = "Tenant phone is required";
    else if (formData.tenantPhone.replace(/\D/g, "").length < 10)
      e.tenantPhone = "Enter a valid phone number (min 10 digits)";
      
    if (formData.tenantEmail && !emailRegex.test(formData.tenantEmail.trim())) {
      e.tenantEmail = "Enter a valid email address";
    }
    if (!formData.propertyAddress.trim())
      e.propertyAddress = "Property address is required";
    if (!formData.roomBedNumber.trim())
      e.roomBedNumber = "Room/Bed number is required";
    if (!formData.monthlyRent || parseFloat(formData.monthlyRent) <= 0)
      e.monthlyRent = "Valid monthly rent is required";
    if (!formData.securityDeposit || parseFloat(formData.securityDeposit) <= 0)
      e.securityDeposit = "Valid security deposit is required";
    if (!formData.startDate) e.startDate = "Start date is required";
    if (!formData.endDate) e.endDate = "End date is required";
    else if (formData.startDate && formData.endDate <= formData.startDate)
      e.endDate = "End date must be after start date";
    if (!formData.noticePeriod || parseInt(formData.noticePeriod) <= 0)
      e.noticePeriod = "Notice period must be at least 1 day";
      
    if (formData.rentDueDay) {
      const day = parseInt(formData.rentDueDay);
      if (isNaN(day) || day < 1 || day > 31) {
        e.rentDueDay = "Rent due day must be between 1 and 31";
      }
    }

    if (opts.setErrors) setErrors(e);
    return e;
  };

  const handleGenerate = () => {
    const currentErrors = validateForm();
    if (Object.keys(currentErrors).length > 0) {
      if (formRef.current) {
        const yOffset = -80;
        const element = formRef.current;
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
      return;
    }
    
    setIsGenerating(true);
    
    if (previewRef.current) {
      const yOffset = -80;
      const element = previewRef.current;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }

    setTimeout(() => setIsGenerating(false), 900);
  };

  const handleFormChange = (newData) => {
    setFormData(newData);
    const cleared = {...errors};
    Object.keys(newData).forEach((k) => {
      if (newData[k] && cleared[k]) delete cleared[k];
    });
    setErrors(cleared);
  };

  const handleReset = () => {
    Swal.fire({
      title: "Start a New Agreement?",
      text: "All current unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#dc2626",
      confirmButtonText: "Yes, start fresh"
    }).then((result) => {
      if (result.isConfirmed) {
        setFormData(DEFAULT_FORM);
        setErrors({});
      }
    });
  };

  return (
    <>
      <LeaseAgreementHero />
      <LeaseAgreementFeatures />

      <div className="lease-workspace-wrapper">
        <div className="lease-page">
          <div className="workspace-header">
            <h2>
              Lease Agreement{" "}
              <span className="workspace-title-highlight">Generator</span>
            </h2>
            <p>
              Fill in the details below. Your agreement updates in real-time as
              you type.
            </p>
          </div>

          <div className="lease-workspace" id="lease-generator-workspace">
            {/* ── Left: Form ── */}
            <section className="lease-form-section" ref={formRef}>
              <div className="lease-section-card">
                <LeaseForm
                  formData={formData}
                  onChange={handleFormChange}
                  errors={errors}
                />
                <div className="form-actions-wrapper">
                  <button
                    className="rr-primary-btn"
                    onClick={handleGenerate}
                  >
                    {isGenerating ? "Generating..." : "Generate Agreement"}
                  </button>
                  <button className="rr-secondary-btn" onClick={handleReset}>
                    <FiRefreshCw /> New Agreement
                  </button>
                </div>
              </div>
            </section>

            {/* ── Right: Preview + Download ── */}
            <section className="lease-preview-section" ref={previewRef}>
              <LeasePreview
                formData={formData}
                validateForm={validateForm}
                isGenerating={isGenerating}
              />
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeaseAgreementGenerator;
