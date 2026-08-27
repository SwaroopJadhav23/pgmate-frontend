import { useState, useRef, useContext } from "react";
import "../CSS/CreatePGForm.css"; // Import the new CSS
import api from "../api/axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import RulesClausesTable, { DEFAULT_RULES, resolveRuleDescription } from "./RulesClausesTable";
import { AuthContext } from "../context/AuthContext";
const AMENITIES_LIST = [
  "Parking", "Wifi", "Refrigerator", "Almirah", "Bed Sheet",
  "CCTV", "House Keeping", "Pillow", "Drinking Water",
  "Reception", "Bathroom", "Wash",
  "AC", "Laundry", "Balcony", "Attached Bathroom", "Kitchen",
  "Security", "Gym", "Study Area", "Common Room", "Hot Water",
];
const HOUSE_RULES_LIST = [
  "Entry before 10:00 PM",
  "Government ID mandatory",
  "No Smoking",
  "No Alcohol Consumption",
  "No Loud Music After 9 PM",
  "Visitors Allowed (Day Time Only)",
  "No Overnight Guests",
  "Maintain Cleanliness",
  "Electricity Usage As Per Policy",
  "Damage Charges Applicable",
  "Security Deposit Mandatory",
  "Outside Food Allowed",
  "Management Rules Must Be Followed",
  "Respect Other Residents"
];

const GENERALIZED_RULES = [
  "Residents must follow all the rules and regulations of the PG. The management reserves the right to modify the rules whenever necessary. Residents will be informed about any important changes, and continued stay in the PG implies acceptance of the updated rules.",
  "Rent must be paid on or before the due date agreed with the PG management. Late payment charges, if applicable, will be as per the PG policy. Continuous delay in rent payment may result in further action as per the accommodation agreement.",
  "Residents must maintain cleanliness in their rooms as well as in all common areas. Please use dustbins, dispose of waste properly, and help maintain a hygienic and healthy living environment.",
  "Residents are responsible for their personal belongings. The PG management will not be responsible for any loss, theft, or damage to personal items. Residents are advised to keep their rooms locked when leaving.",
  "Visitors and guests must follow the PG's guest policy. Unauthorized visitors or overnight stays are not permitted unless approved by the management. Residents are responsible for the conduct of their visitors.",
  "Smoking, alcohol, drugs, gambling, and any illegal activities are strictly prohibited inside the PG premises. Any violation may lead to disciplinary action, cancellation of accommodation, or legal action as applicable.",
  "Residents must respect fellow residents and staff. Loud music, unnecessary noise, abusive language, harassment, or any behavior causing inconvenience or disturbance to others is not allowed.",
  "Use electrical appliances responsibly. Only appliances permitted by the PG management may be used. Unauthorized or high-power appliances that may pose a safety risk are not allowed without prior permission.",
  "Any damage to PG property caused intentionally or due to negligence will be the responsibility of the resident. The resident may be required to bear the repair or replacement cost.",
  "Residents must follow the entry and exit timings and other security guidelines prescribed by the PG management. Residents should cooperate with security checks whenever required.",
  "Common facilities should be used responsibly. Please keep shared areas clean after use and report any maintenance or safety issues immediately to the PG management.",
  "Residents must conserve electricity and water by switching off lights, fans, ACs, and taps when not in use. Misuse or wastage of utilities should be avoided.",
  "Residents are expected to maintain proper behavior and respect the privacy, comfort, and rights of other residents. Any form of discrimination, violence, or misconduct will not be tolerated.",
  "Before vacating the PG, all pending dues must be cleared, and the room should be returned in clean and good condition. The security deposit, if applicable, will be refunded as per the agreed policy after necessary adjustments.",
  "Violation of any PG rule may result in a warning, fine, suspension of facilities, cancellation of accommodation, or legal action depending on the nature and seriousness of the violation."
];

const CITY_OPTIONS = [
  "Hyderabad",
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Noida",
  "Pune",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Indore",
  "Bhopal",
  "Lucknow",
  "Chandigarh",
  "Coimbatore",
  "Mysore",
  "Dehradun",
  "Kanpur",
  "Mangalore",
  "Other"
];


const CreatePGForm = ({ onSuccess, onCancel }) => {
  const { owner } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    customCity: "",
    locality: "",
    address: "",
    aboutDescription: "",
    genderType: "MALE",
    totalFloors: 1,
    amenities: [],
    houseRules: [],
    customHouseRules: [],
    customRuleInput: "",

    // Rules & Regulations Settings
    rentDueDate: "",
    lateFeeAmount: "",
    curfewTime: "",
    noticePeriodDays: "",
    depositRefundDays: "",
    damageCharges: "",
    washingMachineCharges: "",
    foodFacility: "",
    visitorPolicy: "",
    overnightGuestAllowed: "",
    electricityUsage: "",
    breakfastTime: "",
    lunchTime: "",
    dinnerTime: "",
    firstTimeFine: "",
    repeatedFine: "",
    addictionFine: "",
    cleanlinessFine: "",
    acTempMin: "",
    acTempMax: "",
    otherCustomFine: "",
    rulesCustomNote: "",
    policeFormType: owner?.defaultPoliceFormType || "WITH_RULES",
    rulesPreference: "GENERAL"
  });

  const [generalRulesList, setGeneralRulesList] = useState([...GENERALIZED_RULES]);


  const [imageList, setImageList] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const [rulesClauses, setRulesClauses] = useState(
    DEFAULT_RULES.map((r) => ({ ...r }))
  );
  const videoInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [lastStepChange, setLastStepChange] = useState(Date.now());
  const [formErrors, setFormErrors] = useState({});
  const totalSteps = 4;

  const handleScrollToError = () => {
    setTimeout(() => {
      const firstError = document.querySelector('.error-field');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
    }, 100);
  };

  const validateStep = (step) => {
    if (step === 1) {
      const newErrors = {};
      if (!formData.name.trim()) newErrors.name = true;
      if (!formData.city) newErrors.city = true;
      if (formData.city === "Other" && !formData.customCity.trim()) newErrors.customCity = true;
      if (!formData.locality.trim()) newErrors.locality = true;
      if (!formData.address.trim()) newErrors.address = true;
      
      if (Object.keys(newErrors).length > 0) {
        setFormErrors(newErrors);
        handleScrollToError();
        toast.error("Please fill in all the required fields marked in red");
        return false;
      }
    }
    setFormErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setLastStepChange(Date.now());
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      document.querySelector('.create-pg-form-body')?.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    setLastStepChange(Date.now());
    setCurrentStep(prev => Math.max(prev - 1, 1));
    document.querySelector('.create-pg-form-body')?.scrollTo(0, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "totalFloors" && value !== "") {
      const val = parseInt(value, 10);
      if (val > 100 || val < 1) return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Check total limit
    if (imageList.length + files.length > 5) {
      Swal.fire({
        icon: "warning",
        title: "Limit Exceeded",
        text: "You can only upload up to 5 images.",
      });
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageList(prev => [...prev, { src: event.target.result, file }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageList(prev => prev.filter((_, i) => i !== index));
  };
  const handleVideoUpload = (e) => {
  const files = Array.from(e.target.files);

  if (videoList.length + files.length > 5) {
    Swal.fire({
  icon: "warning",
  title: "Limit Exceeded",
  text: "Maximum 5 videos allowed",
});
    return;
  }

  files.forEach((file) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);

      if (video.duration > 30) {
       Swal.fire({
        icon: "warning",
        title: "Invalid Video",
        text: "Video must be under 30 seconds",
      });
        return;
      }

      setVideoList((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          file,
          src: URL.createObjectURL(file),
        },
      ]);
    };

    video.src = URL.createObjectURL(file);
  });
  
  // Clear input
  if (videoInputRef.current) {
    videoInputRef.current.value = "";
  }
};
const removeVideo = (targetId) => {
  setVideoList((prev) => {
    const removed = prev.find((v) => v.id === targetId);
    if (removed?.src) URL.revokeObjectURL(removed.src);
    return prev.filter((v) => v.id !== targetId);
  });
  if (videoInputRef.current) videoInputRef.current.value = "";
};

  const moveImage = (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === imageList.length - 1)
    ) {
      return;
    }
    const newList = [...imageList];
    const newIndex = index + direction;
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    setImageList(newList);
  };



const handleSubmit = async (e) => {
  e.preventDefault();

  // Prevent accidental double-click submissions when arriving at step 4
  if (Date.now() - lastStepChange < 500) {
    return;
  }

  // If user hits Enter on an input before the final step, just go to the next step
  if (currentStep < totalSteps) {
    handleNextStep();
    return;
  }

  setLoading(true);

  try {
   const fd = new FormData();

   if (formData.city === "Other" && !formData.customCity.trim()) {
     Swal.fire({
       icon: "warning",
       title: "City Required",
       text: "Please enter your city",
     });
     setLoading(false);
     return;
   }

   if (imageList.length === 0) {
     Swal.fire({
       icon: "warning",
       title: "Images Required",
       text: "Please upload at least one image of the PG.",
     });
     setLoading(false);
     return;
   }


/* ===============================
   HANDLE CITY FIRST
================================ */

let finalCity = formData.city;

if (formData.city === "Other") {
  finalCity = formData.customCity;
}

fd.append("city", finalCity);


/* ===============================
   APPEND OTHER FIELDS
================================ */

Object.entries(formData).forEach(([k, v]) => {

  // 🚫 Skip city & customCity (already handled)
  if (k === "city" || k === "customCity") return;

  if (k === "houseRules") {
    const combinedRules = [
      ...formData.houseRules,
      ...formData.customHouseRules
    ];
    fd.append("houseRules", combinedRules.join(","));
  } 
  else if (Array.isArray(v)) {
    fd.append(k, v.join(","));
  } 
  else if (k === "totalFloors") {
    fd.append(k, Number(v));
  } 
  else {
    fd.append(k, v);
  }
});

    // ---- rules & clauses table or general list ----
    if (formData.rulesPreference === "GENERAL") {
      fd.append("rulesClauses", JSON.stringify(generalRulesList.map((r, i) => ({
        id: `gen-rule-${i}`,
        title: `Rule ${i + 1}`,
        description: r,
        enabled: true
      }))));
    } else {
      const resolvedRules = rulesClauses.map(r => ({
        ...r,
        description: resolveRuleDescription(r.description, formData)
      }));
      fd.append("rulesClauses", JSON.stringify(resolvedRules));
    }

    // ---- append images directly ----
    imageList.forEach((img) => {
      fd.append("images", img.file);
    });

    videoList.forEach((video) => {
  fd.append("videos", video.file);
  });

    // ✅ CORRECT ENDPOINT
    await api.post("/owner/pg", fd, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    Swal.fire({
    icon: "success",
    title: "PG Created",
    text: "Your PG has been created successfully 🎉",
    timer: 2000,
    showConfirmButton: false,
  });

    onSuccess?.();

  } catch (error) {
    console.error("Error creating PG:", error);
    Swal.fire({
    icon: "error",
    title: "Failed",
    text: "Failed to create PG",
  });
  } finally {
    setLoading(false);
  }
};

const addCustomRule = () => {
  if (!formData.customRuleInput.trim()) return;

  setFormData(prev => ({
    ...prev,
    customHouseRules: [
      ...prev.customHouseRules,
      prev.customRuleInput.trim()
    ],
    customRuleInput: ""
  }));
};

const removeCustomRule = (index) => {
  setFormData(prev => ({
    ...prev,
    customHouseRules: prev.customHouseRules.filter((_, i) => i !== index)
  }));
};

  return (
    <div className="create-pg-form-container">
      {/* --- STEPPER UI --- */}
      <div className="create-pg-stepper">
        {['Basic Details', 'Amenities', 'Rules & Policies', 'Media'].map((label, index) => {
          const stepNum = index + 1;
          const isActive = currentStep === stepNum;
          const isCompleted = currentStep > stepNum;
          return (
            <div key={label} className={`create-pg-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              <div className="create-pg-step-circle">
                {isCompleted ? <i className="bi bi-check" style={{ fontSize: '1.2rem', lineHeight: 1 }}></i> : stepNum}
              </div>
              <span className="create-pg-step-label">{label}</span>
              {stepNum < totalSteps && <div className="create-pg-step-line" />}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} noValidate className="create-pg-form-body">

        {/* ======================== STEP 1: BASIC DETAILS ======================== */}
        {currentStep === 1 && (
          <div className="create-pg-step-content">
            <div className="create-pg-form-row">
              <div className="create-pg-form-group">
                <label className="create-pg-form-label required">PG Name</label>
                <input
                  type="text"
                  name="name"
                  className={`create-pg-form-input ${formErrors.name ? "error-field" : ""}`}
                  placeholder="Enter PG name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="create-pg-form-group">
                <label className="create-pg-form-label required">City</label>
                <select
                  name="city"
                  className={`create-pg-form-select ${formErrors.city ? "error-field" : ""}`}
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    setFormErrors(prev => ({ ...prev, city: false }));
                  }}
                  required
                >
                  <option value="">Select City</option>
                  {CITY_OPTIONS.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {formData.city === "Other" && (
                  <input
                    type="text"
                    name="customCity"
                    placeholder="Enter your city"
                    className={`create-pg-form-input mt-2 ${formErrors.customCity ? "error-field" : ""}`}
                    value={formData.customCity}
                    onChange={(e) => {
                      setFormData({ ...formData, customCity: e.target.value });
                      setFormErrors(prev => ({ ...prev, customCity: false }));
                    }}
                    required
                  />
                )}
              </div>
            </div>

            <div className="create-pg-form-row">
              <div className="create-pg-form-group">
                <label className="create-pg-form-label required">Locality</label>
                <input
                  type="text"
                  name="locality"
                  className={`create-pg-form-input ${formErrors.locality ? "error-field" : ""}`}
                  placeholder="e.g., Jubilee Hills"
                  value={formData.locality}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="create-pg-form-group">
                <label className="create-pg-form-label required">Gender Type</label>
                <select
                  name="genderType"
                  className="create-pg-form-select"
                  value={formData.genderType}
                  onChange={handleInputChange}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="UNISEX">Unisex</option>
                </select>
              </div>
            </div>

            <div className="create-pg-form-group create-pg-form-row-single">
              <label className="create-pg-form-label required">Address</label>
              <textarea
                name="address"
                className={`create-pg-form-textarea ${formErrors.address ? "error-field" : ""}`}
                placeholder="Enter full address"
                value={formData.address}
                onChange={handleInputChange}
                required
                maxLength={250}
              />
            </div>

            <div className="create-pg-form-group create-pg-form-row-single">
              <label className="create-pg-form-label">About the Property</label>
              <textarea
                name="aboutDescription"
                className="create-pg-form-textarea"
                placeholder="Describe your PG, rules, environment, nearby areas..."
                value={formData.aboutDescription}
                onChange={handleInputChange}
                rows={4}
                maxLength={1000}
              />
            </div>

            <div className="create-pg-form-row">
              <div className="create-pg-form-group">
                <label className="create-pg-form-label required">Total Floors</label>
                <input
                  type="number"
                  name="totalFloors"
                  className="create-pg-form-input"
                  min="1"
                  value={formData.totalFloors}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================== STEP 2: AMENITIES ======================== */}
        {currentStep === 2 && (
          <div className="create-pg-step-content">
            <div className="create-pg-form-group create-pg-form-row-single">
              <label className="create-pg-amenities-label">Amenities</label>
              <div className="create-pg-amenities-grid">
                {AMENITIES_LIST.map(amenity => (
                  <label key={amenity} className="create-pg-amenity-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                    />
                    <span className="create-pg-amenity-label">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================== STEP 3: RULES & POLICIES ======================== */}
        {currentStep === 3 && (
          <div className="create-pg-step-content">
            {/* Police Verification Form Settings */}
            <div className="create-pg-form-group create-pg-form-row-single">
              <h3 className="create-pg-section-title">Police Verification Form Settings</h3>
              <p className="create-pg-section-subtitle">
                Choose how you want the Police Verification document to be generated for your tenants.
              </p>
              <label className="create-pg-form-label">Include in Police Verification Form</label>
              <div className="police-form-option-grid">
                <label className={`police-form-option ${formData.policeFormType === "WITH_RULES" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="policeFormType"
                    value="WITH_RULES"
                    checked={formData.policeFormType === "WITH_RULES"}
                    onChange={handleInputChange}
                  />
                  <span className="police-form-radio-dot" />
                  <div className="police-form-icon" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <i className="bi bi-shield-check" style={{ color: '#4f46e5' }}></i>
                    <i className="bi bi-file-earmark-text" style={{ color: '#6b7280' }}></i>
                  </div>
                  <span className="police-form-option-title">Police Form with PG Rules &amp; Regulations</span>
                  <span className="police-form-option-desc">Generate a 2-page document with police verification details and PG rules &amp; regulations.</span>
                </label>

                <label className={`police-form-option ${formData.policeFormType === "ONLY" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="policeFormType"
                    value="ONLY"
                    checked={formData.policeFormType === "ONLY"}
                    onChange={handleInputChange}
                  />
                  <span className="police-form-radio-dot" />
                  <div className="police-form-icon" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <i className="bi bi-shield-check" style={{ color: '#4f46e5' }}></i>
                  </div>
                  <span className="police-form-option-title">Police Form Only</span>
                  <span className="police-form-option-desc">Generate a 1-page document with only police verification details.</span>
                </label>
              </div>
              <div className="police-form-info-banner">
                <i className="bi bi-info-circle-fill" style={{ fontSize: '18px', color: '#3b82f6' }}></i> 
                <span>This will be the default preference for all police verification reports. You can change this anytime from the Edit PG form page.</span>
              </div>
            </div>

            {/* Rules & Regulations (only when WITH_RULES) */}
            {formData.policeFormType === "WITH_RULES" && (
              <>
                <div className="create-pg-form-group create-pg-form-row-single">
                  <h3 className="create-pg-section-title" style={{ marginTop: "18px" }}>PG Rules &amp; Regulations</h3>
                  <label className="create-pg-amenities-label">Choose Rules Preference</label>

                  <div className="police-form-option-grid" style={{ marginBottom: '20px' }}>
                    <label className={`police-form-option ${formData.rulesPreference === "GENERAL" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="rulesPreference"
                        value="GENERAL"
                        checked={formData.rulesPreference === "GENERAL"}
                        onChange={handleInputChange}
                      />
                      <span className="police-form-radio-dot" />
                      <div className="police-form-icon" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <i className="bi bi-list-check" style={{ color: '#4f46e5' }}></i>
                      </div>
                      <span className="police-form-option-title">Use Generalised Rules</span>
                      <span className="police-form-option-desc">Use a predefined set of rules. You can delete rules that don't apply.</span>
                    </label>

                    <label className={`police-form-option ${formData.rulesPreference === "CUSTOM" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="rulesPreference"
                        value="CUSTOM"
                        checked={formData.rulesPreference === "CUSTOM"}
                        onChange={handleInputChange}
                      />
                      <span className="police-form-radio-dot" />
                      <div className="police-form-icon" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <i className="bi bi-pencil-square" style={{ color: '#4f46e5' }}></i>
                      </div>
                      <span className="police-form-option-title">Create Custom Rules</span>
                      <span className="police-form-option-desc">Manually define rent dates, late fees, and specific policies.</span>
                    </label>
                  </div>

                  {formData.rulesPreference === "GENERAL" ? (
                    <div className="general-rules-container">
                      <label className="create-pg-amenities-label">General Rules List</label>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {generalRulesList.map((rule, index) => (
                          <li key={index} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            marginBottom: '10px',
                            gap: '12px'
                          }}>
                            <span style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                              {rule}
                            </span>
                            <button
                              type="button"
                              onClick={() => setGeneralRulesList(prev => prev.filter((_, i) => i !== index))}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: '0.2s'
                              }}
                              title="Delete Rule"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                      {generalRulesList.length === 0 && (
                        <p style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>
                          You have deleted all general rules.
                        </p>
                      )}
                      <button 
                        type="button" 
                        onClick={() => setGeneralRulesList([...GENERALIZED_RULES])}
                        style={{
                          background: 'transparent',
                          border: '1px solid #4f46e5',
                          color: '#4f46e5',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          marginTop: '8px'
                        }}
                      >
                        <i className="bi bi-arrow-counterclockwise" style={{ marginRight: '6px' }}></i>
                        Restore Default Rules
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="create-pg-amenities-label">Other Custom Policies (Fines)</label>
                  <div className="create-pg-form-row create-pg-form-row-3">
                    <div>
                      <label className="create-pg-form-label required">Rent Due Date</label>
                      <select name="rentDueDate" className="create-pg-form-select" value={formData.rentDueDate} onChange={handleInputChange}>
                        <option value="">Select Date (1st - 31st)</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Late Fee Amount (₹)</label>
                      <input type="number" name="lateFeeAmount" className="create-pg-form-input" placeholder="Enter amount" value={formData.lateFeeAmount} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Curfew Time / Entry Time</label>
                      <input type="time" name="curfewTime" className="create-pg-form-input" value={formData.curfewTime} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Notice Period (Days)</label>
                      <input type="number" name="noticePeriodDays" className="create-pg-form-input" placeholder="Enter days" value={formData.noticePeriodDays} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Security Deposit Refund (Days)</label>
                      <input type="number" name="depositRefundDays" className="create-pg-form-input" placeholder="Enter days" value={formData.depositRefundDays} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="create-pg-form-label">Damage Charges (₹)</label>
                      <input type="number" name="damageCharges" className="create-pg-form-input" placeholder="Enter amount" value={formData.damageCharges} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="create-pg-form-label">Washing Machine Charges (₹)</label>
                      <input type="number" name="washingMachineCharges" className="create-pg-form-input" placeholder="Enter amount" value={formData.washingMachineCharges} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Food Facility</label>
                      <select name="foodFacility" className="create-pg-form-select" value={formData.foodFacility} onChange={handleInputChange}>
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Visitor Policy</label>
                      <select name="visitorPolicy" className="create-pg-form-select" value={formData.visitorPolicy} onChange={handleInputChange}>
                        <option value="">Select Option</option>
                        <option value="Not Allowed">Not Allowed</option>
                        <option value="Day Time Only">Day Time Only</option>
                        <option value="Allowed with Permission">Allowed with Permission</option>
                      </select>
                    </div>
                    <div>
                      <label className="create-pg-form-label required">Overnight Guest Allowed</label>
                      <select name="overnightGuestAllowed" className="create-pg-form-select" value={formData.overnightGuestAllowed} onChange={handleInputChange}>
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="create-pg-form-label">Electricity Usage</label>
                      <select name="electricityUsage" className="create-pg-form-select" value={formData.electricityUsage} onChange={handleInputChange}>
                        <option value="">Select Option</option>
                        <option value="Included in Rent">Included in Rent</option>
                        <option value="Billed Separately">Billed Separately</option>
                      </select>
                    </div>
                  </div>

                  {formData.foodFacility === "Yes" && (
                    <>
                      <label className="create-pg-amenities-label">Meal Timings</label>
                      <div className="create-pg-form-row create-pg-form-row-3">
                        <div>
                          <label className="create-pg-form-label">Breakfast Time</label>
                          <input type="time" name="breakfastTime" className="create-pg-form-input" value={formData.breakfastTime} onChange={handleInputChange} />
                        </div>
                        <div>
                          <label className="create-pg-form-label">Lunch Time</label>
                          <input type="time" name="lunchTime" className="create-pg-form-input" value={formData.lunchTime} onChange={handleInputChange} />
                        </div>
                        <div>
                          <label className="create-pg-form-label">Dinner Time</label>
                          <input type="time" name="dinnerTime" className="create-pg-form-input" value={formData.dinnerTime} onChange={handleInputChange} />
                        </div>
                      </div>
                    </>
                  )}

                  <label className="create-pg-amenities-label">Penalty &amp; Fine Settings</label>
                  <div className="create-pg-form-row create-pg-form-row-3">
                    <div>
                      <label className="create-pg-form-label">First Time Rule Violation Fine (₹)</label>
                      <input type="number" name="firstTimeFine" className="create-pg-form-input" placeholder="Enter amount" value={formData.firstTimeFine} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="create-pg-form-label">Repeated Violation Fine (₹)</label>
                      <input type="number" name="repeatedFine" className="create-pg-form-input" placeholder="Enter amount" value={formData.repeatedFine} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="create-pg-form-label">Addiction / Smoking / Alcohol Fine (₹)</label>
                      <input type="number" name="addictionFine" className="create-pg-form-input" placeholder="Enter amount" value={formData.addictionFine} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="create-pg-form-label">Cleanliness / Garbage Fine (₹)</label>
                      <input type="number" name="cleanlinessFine" className="create-pg-form-input" placeholder="Enter amount" value={formData.cleanlinessFine} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="create-pg-form-label">AC / Cooler Temperature Range (°C)</label>
                      <div className="create-pg-range-row">
                        <input type="number" name="acTempMin" className="create-pg-form-input" placeholder="16" value={formData.acTempMin} onChange={handleInputChange} />
                        <span>to</span>
                        <input type="number" name="acTempMax" className="create-pg-form-input" placeholder="24" value={formData.acTempMax} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div>
                      <label className="create-pg-form-label">Other Custom Fine (₹) (Optional)</label>
                      <input type="number" name="otherCustomFine" className="create-pg-form-input" placeholder="Enter amount" value={formData.otherCustomFine} onChange={handleInputChange} />
                    </div>
                  </div>
                  <RulesClausesTable rules={rulesClauses} onChange={setRulesClauses} formData={formData} />
                  </>
                  )}
                </div>

                <hr className="create-pg-section-divider" />

                {/* House Rules */}
                <div className="create-pg-form-group create-pg-form-row-single">
                  <label className="create-pg-amenities-label">House Rules</label>
                  <div className="create-pg-amenities-grid">
                    {HOUSE_RULES_LIST.map(rule => (
                      <label key={rule} className="create-pg-amenity-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.houseRules.includes(rule)}
                          onChange={() => {
                            const updated = formData.houseRules.includes(rule)
                              ? formData.houseRules.filter(r => r !== rule)
                              : [...formData.houseRules, rule];
                            setFormData({ ...formData, houseRules: updated });
                          }}
                        />
                        <span>{rule}</span>
                      </label>
                    ))}
                  </div>

                  <div className="custom-rule-section">
                    <div className="custom-rule-input-row">
                      <input
                        type="text"
                        placeholder="Add custom house rule..."
                        className="create-pg-form-input custom-rule-input"
                        value={formData.customRuleInput}
                        onChange={(e) => setFormData({ ...formData, customRuleInput: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomRule(); } }}
                      />
                      <button type="button" className="add-rule-btn-modern" onClick={addCustomRule}>+ Add Rule</button>
                    </div>

                    {formData.customHouseRules.length > 0 && (
                      <div className="custom-rule-list">
                        {formData.customHouseRules.map((rule, i) => (
                          <div key={i} className="custom-rule-chip-modern">
                            <span>{rule}</span>
                            <button type="button" className="remove-rule-btn" onClick={() => removeCustomRule(i)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="create-pg-form-label" style={{ marginTop: "10px", display: "block" }}>
                      Custom Note for Rules (Optional)
                    </label>
                    <textarea
                      name="rulesCustomNote"
                      className="create-pg-form-input create-pg-form-textarea"
                      placeholder="Enter any additional note or instructions for the rules..."
                      value={formData.rulesCustomNote}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ======================== STEP 4: MEDIA ======================== */}
        {currentStep === 4 && (
          <div className="create-pg-step-content">
            {/* Image Upload */}
            <div className="create-pg-form-group create-pg-form-row-single">
              <label className="create-pg-form-label">
                Property Images
                <span style={{ color: '#ef4444', fontSize: '13px', marginLeft: '10px', fontWeight: '500' }}>
                  * Required: Please upload at least one image of the PG.
                </span>
              </label>
              <label className="create-pg-file-upload-label">
                <span>📸 Click to upload images</span>
                <input type="file" multiple accept="image/*" className="create-pg-file-input" onChange={handleImageUpload} />
              </label>
            </div>

            {imageList.length > 0 && (
              <div className="create-pg-form-group create-pg-form-row-single">
                <div className="create-pg-image-preview-grid">
                  {imageList.map((img, i) => (
                    <div key={i} className="create-pg-image-item">
                      <img src={img.src} alt={`preview-${i}`} />
                      <span className="create-pg-image-badge">{i + 1}</span>
                      <button type="button" className="create-pg-image-remove-btn" onClick={() => removeImage(i)}>×</button>
                      <div className="create-pg-image-controls">
                        <button type="button" className="create-pg-image-move-btn" onClick={() => moveImage(i, -1)} disabled={i === 0}>↑</button>
                        <button type="button" className="create-pg-image-move-btn" onClick={() => moveImage(i, 1)} disabled={i === imageList.length - 1}>↓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Upload */}
            <div className="create-pg-form-group create-pg-form-row-single">
              <label className="create-pg-form-label">Property Videos (Max 5 | 30 sec each)</label>
              <label className="create-pg-file-upload-label">
                <span>🎥 Click to upload videos</span>
                <input type="file" multiple accept="video/*" className="create-pg-file-input" ref={videoInputRef} onChange={handleVideoUpload} />
              </label>
            </div>

            {videoList.length > 0 && (
              <div className="create-pg-form-group create-pg-form-row-single">
                <div className="create-pg-image-preview-grid">
                  {videoList.map((video, i) => (
                    <div key={video.id} className="create-pg-image-item">
                      <video src={video.src} controls />
                      <span className="create-pg-image-badge">{i + 1}</span>
                      <button type="button" className="create-pg-image-remove-btn" onClick={() => removeVideo(video.id)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================== STICKY FOOTER ======================== */}
        <div className="create-pg-form-actions-sticky">
          <button
            type="button"
            className="create-pg-btn-cancel"
            onClick={currentStep === 1 ? onCancel : handlePrevStep}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < totalSteps ? (
            <button type="button" className="create-pg-btn-submit" onClick={handleNextStep}>
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              className="create-pg-btn-submit"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.85 : 1 }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: "15px", height: "15px",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "cpg-spin 0.7s linear infinite",
                    flexShrink: 0,
                  }} />
                  Creating...
                </>
              ) : "Create PG"}
              <style>{`@keyframes cpg-spin { to { transform: rotate(360deg); } }`}</style>
            </button>
          )}
        </div>

      </form>
    </div>
  );
};

export default CreatePGForm;

