import { useState, useRef, useContext } from "react";
import "../CSS/CreatePGForm.css"; // Import the new CSS
import api from "../api/axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import RulesClausesTable, { DEFAULT_RULES } from "./RulesClausesTable";
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
    policeFormType: owner?.defaultPoliceFormType || "WITH_RULES"
  });

  const [imageList, setImageList] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const [rulesClauses, setRulesClauses] = useState(
    DEFAULT_RULES.map((r) => ({ ...r }))
  );
  const videoInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.name.trim()) { toast.error("PG Name is required"); return false; }
      if (!formData.city) { toast.error("City is required"); return false; }
      if (formData.city === "Other" && !formData.customCity.trim()) { toast.error("Please specify the custom city"); return false; }
      if (!formData.locality.trim()) { toast.error("Locality is required"); return false; }
      if (!formData.address.trim()) { toast.error("Address is required"); return false; }
      if (!formData.aboutDescription.trim()) { toast.error("Property Description is required"); return false; }
    }
    // Steps 2 and 3 have no strict required validations that block progress,
    // although we could add them if needed later.
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      document.querySelector('.create-pg-form-body')?.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    document.querySelector('.create-pg-form-body')?.scrollTo(0, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    const newList = [...imageList];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newList.length) {
      [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
      setImageList(newList);
    }
  };



const handleSubmit = async (e) => {
  e.preventDefault();

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

    // ---- rules & clauses table ----
    fd.append("rulesClauses", JSON.stringify(rulesClauses));

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

      <form onSubmit={handleSubmit} className="create-pg-form-body">

        {/* ======================== STEP 1: BASIC DETAILS ======================== */}
        {currentStep === 1 && (
          <div className="create-pg-step-content">
            <div className="create-pg-form-row">
              <div className="create-pg-form-group">
                <label className="create-pg-form-label required">PG Name</label>
                <input
                  type="text"
                  name="name"
                  className="create-pg-form-input"
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
                  className="create-pg-form-select"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
                    placeholder="Enter your city"
                    className="create-pg-form-input mt-2"
                    value={formData.customCity}
                    onChange={(e) => setFormData({ ...formData, customCity: e.target.value })}
                    required
                  />
                )}
              </div>
            </div>

            <div className="create-pg-form-row">
              <div className="create-pg-form-group">
                <label className="create-pg-form-label">Locality</label>
                <input
                  type="text"
                  name="locality"
                  className="create-pg-form-input"
                  placeholder="e.g., Jubilee Hills"
                  value={formData.locality}
                  onChange={handleInputChange}
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
                className="create-pg-form-textarea"
                placeholder="Enter full address"
                value={formData.address}
                onChange={handleInputChange}
                required
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
                  <span className="police-form-option-title">Police Form with Rules &amp; Regulations</span>
                  <span className="police-form-option-desc">Generate a 2-page document with police verification details and rules &amp; regulations.</span>
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
                ℹ️ This will be the default preference for all police verification reports. You can change this anytime from PG Settings.
              </div>
            </div>

            {/* Rules & Regulations (only when WITH_RULES) */}
            {formData.policeFormType === "WITH_RULES" && (
              <>
                <div className="create-pg-form-group create-pg-form-row-single">
                  <h3 className="create-pg-section-title" style={{ marginTop: "18px" }}>Rules &amp; Regulations</h3>
                  <label className="create-pg-amenities-label">General Policy Settings</label>
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

                  <RulesClausesTable rules={rulesClauses} onChange={setRulesClauses} />
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
              <label className="create-pg-form-label">Property Images</label>
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
              className={`create-pg-btn-submit ${loading ? "loading" : ""}`}
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

