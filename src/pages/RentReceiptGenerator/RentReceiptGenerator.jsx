import React, {useState, useEffect, useRef} from "react";
import {FiRefreshCw} from "react-icons/fi";
import Swal from "sweetalert2";
import ReceiptForm from "../../components/RentReceipts/ReceiptForm";
import ReceiptPreview from "../../components/RentReceipts/ReceiptPreview";
import RentReceiptHero from "../../components/RentReceipts/RentReceiptHero";
import RentReceiptFeatures from "../../components/RentReceipts/RentReceiptFeatures";
import "../../components/RentReceipts/RentReceiptGenerator.css";

const DEFAULT_FORM = {
  pgName: "",
  pgAddress: "",
  landlordName: "",
  tenantName: "",
  phoneNo: "",
  rentAmount: "",
  electricityCharges: "",
  waterCharges: "",
  wifiCharges: "",
  securityDeposit: "",
  paymentMode: "",
  fromMonth: "",
  toMonth: "",
  receiptDate: new Date().toISOString().split("T")[0],
};

const RentReceiptGenerator = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [savedReceipt, setSavedReceipt] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const formRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    // Scroll to the very top of the page on load
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const handleGenerate = () => {
    const currentErrors = validateForm();
    if (Object.keys(currentErrors).length > 0) {
      if (formRef.current) {
        // scroll back up to the form so user can see errors
        const yOffset = -80; // Offset for navbar
        const element = formRef.current;
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
      return;
    }

    setIsGenerating(true);
    
    if (previewRef.current) {
      // scroll down to preview
      const yOffset = -80; 
      const element = previewRef.current;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }

    setTimeout(() => {
      setIsGenerating(false);
    }, 1000);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.pgName.trim()) newErrors.pgName = "PG name is required";
    if (!formData.pgAddress.trim())
      newErrors.pgAddress = "PG address is required";
    if (!formData.landlordName.trim())
      newErrors.landlordName = "Owner name is required";
      
    if (!formData.phoneNo.trim()) {
      newErrors.phoneNo = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNo.trim())) {
      newErrors.phoneNo = "Valid 10-digit phone number is required";
    }
      
    if (!formData.tenantName.trim())
      newErrors.tenantName = "Tenant name is required";
    if (!formData.rentAmount || parseFloat(formData.rentAmount) <= 0)
      newErrors.rentAmount = "Valid rent amount is required";
    if (!formData.paymentMode)
      newErrors.paymentMode = "Payment mode is required";
      
    if (formData.electricityCharges && parseFloat(formData.electricityCharges) < 0)
      newErrors.electricityCharges = "Must be a non-negative number";
    if (formData.waterCharges && parseFloat(formData.waterCharges) < 0)
      newErrors.waterCharges = "Must be a non-negative number";
    if (formData.wifiCharges && parseFloat(formData.wifiCharges) < 0)
      newErrors.wifiCharges = "Must be a non-negative number";
    if (formData.securityDeposit && parseFloat(formData.securityDeposit) < 0)
      newErrors.securityDeposit = "Must be a non-negative number";
      
    if (!formData.fromMonth) newErrors.fromMonth = "From month is required";
    if (!formData.toMonth) newErrors.toMonth = "To month is required";
    if (formData.fromMonth && formData.toMonth && formData.fromMonth > formData.toMonth) {
      newErrors.toMonth = "'Rent To' month cannot be earlier than 'Rent From'";
    }

    if (!formData.receiptDate) {
      newErrors.receiptDate = "Date is required";
    } else if (new Date(formData.receiptDate) > new Date()) {
      newErrors.receiptDate = "Future dates are not allowed";
    }
    
    setErrors(newErrors);
    return newErrors;
  };

  const handleFormChange = (newData) => {
    setFormData(newData);
    const clearedErrors = {...errors};
    Object.keys(newData).forEach((key) => {
      if (newData[key] && clearedErrors[key]) delete clearedErrors[key];
    });
    setErrors(clearedErrors);
  };

  const handleReset = () => {
    Swal.fire({
      title: "Start a New Receipt?",
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
        setSavedReceipt(null);
      }
    });
  };

  return (
    <>
      <RentReceiptHero />
      <RentReceiptFeatures />

      <div className="rr-workspace-wrapper" id="generator-workspace">
        <div className="rr-page">
          <div className="workspace-header">
            <h2>
              Rent Receipt{" "}
              <span className="workspace-title-highlight">Generator</span>
            </h2>
            <p>
              Create professional, accurate and printable rent receipts
              instantly.
            </p>
          </div>

          <div className="rr-workspace">
            {/* ── Left: Form ── */}
            <section className="rr-editor-section" ref={formRef}>
              <div className="section-card rr-form-card-aligned">
                <ReceiptForm
                  formData={formData}
                  onChange={handleFormChange}
                  errors={errors}
                />
                <div className="form-actions-wrapper">
                  <button className="rr-primary-btn" onClick={handleGenerate}>
                    {isGenerating ? "Generating..." : "Generate Receipt"}
                  </button>
                  <button className="rr-secondary-btn" onClick={handleReset}>
                    <FiRefreshCw /> New Receipt
                  </button>
                </div>
              </div>
            </section>

            {/* ── Right: Preview + Download buttons ── */}
            <section className="rr-preview-section" ref={previewRef}>
              <div className="rr-preview-wrapper">
                <h2 className="preview-title">
                  <span className="rr-btn-icon-wrapper">
                    <svg
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      height="1em"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>{" "}
                    Live Preview
                  </span>
                </h2>

                <ReceiptPreview
                  formData={formData}
                  receiptNumber={savedReceipt?.receiptNumber}
                  savedReceipt={savedReceipt}
                  onReceiptSaved={setSavedReceipt}
                  validateForm={validateForm}
                  isGenerating={isGenerating}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default RentReceiptGenerator;
