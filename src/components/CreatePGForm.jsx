import { useState, useRef } from "react";
import "../CSS/CreatePGForm.css"; // Import the new CSS
import api from "../api/axios";
import Swal from "sweetalert2";
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
    customRuleInput: ""
  });

  const [imageList, setImageList] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const videoInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

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
      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
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
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              required
             >
            <option value="">Select City</option>

            {CITY_OPTIONS.map((city) => (
            <option key={city} value={city}>
            {city}
            </option>
          ))}
        </select>

          {formData.city === "Other" && (
          <input
            type="text"
            placeholder="Enter your city"
            className="create-pg-form-input mt-2"
            value={formData.customCity}
            onChange={(e) =>
            setFormData({
                ...formData,
            customCity: e.target.value
            })
           }
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

        {/* Address */}
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

        {/* About Description */}
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

{/* Total Floors  */}
        <div className="create-pg-form-row">
          <div className="create-pg-form-group">
            <label className="create-pg-form-label required">Total Floors</label>
            <input
              type="number"
              name="totalFloors"
              className="create-pg-form-input"
              maxLength="10"
              min="1"
              value={formData.totalFloors}
              onChange={handleInputChange}
              required
            />
          </div>
         
        </div>

        <hr className="create-pg-section-divider" />

        {/* Amenities */}
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

        <hr className="create-pg-section-divider" />

        {/* ================= HOUSE RULES ================= */}
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
            onChange={(e) =>
            setFormData({ ...formData, customRuleInput: e.target.value })
            }
            onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomRule();
           }
          }}
        />

            <button
            type="button"
            className="add-rule-btn-modern"
            onClick={addCustomRule}
             >
              + Add Rule
          </button>
         </div>

          {formData.customHouseRules.length > 0 && (
          <div className="custom-rule-list">
            {formData.customHouseRules.map((rule, i) => (
              <div key={i} className="custom-rule-chip-modern">
              <span>{rule}</span>
               <button
               type="button"
               className="remove-rule-btn"
                onClick={() => removeCustomRule(i)}
               >
                ✕
              </button>
            </div>
         ))}
        </div>
        )}
      </div>
</div>

        <hr className="create-pg-section-divider" />

        {/* Image Upload */}
        <div className="create-pg-form-group create-pg-form-row-single">
          <label className="create-pg-form-label">Property Images</label>
          <label className="create-pg-file-upload-label">
            <span>📸 Click to upload images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="create-pg-file-input"
              onChange={handleImageUpload}
            />
          </label>
        </div>

        {/* Image Preview */}
        {imageList.length > 0 && (
          <div className="create-pg-form-group create-pg-form-row-single">
            <div className="create-pg-image-preview-grid">
              {imageList.map((img, i) => (
                <div key={i} className="create-pg-image-item">
                  <img src={img.src} alt={`preview-${i}`} />
                  <span className="create-pg-image-badge">{i + 1}</span>
                  <button
                    type="button"
                    className="create-pg-image-remove-btn"
                    onClick={() => removeImage(i)}
                  >
                    ×
                  </button>
                  <div className="create-pg-image-controls">
                    <button
                      type="button"
                      className="create-pg-image-move-btn"
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="create-pg-image-move-btn"
                      onClick={() => moveImage(i, 1)}
                      disabled={i === imageList.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ================= VIDEOS ================= */}
        <div className="create-pg-form-group create-pg-form-row-single">
        <label className="create-pg-form-label">
          Property Videos (Max 5 | 30 sec each)
        </label>

      <label className="create-pg-file-upload-label">
    <span>🎥 Click to upload videos</span>
    <input
      type="file"
      multiple
      accept="video/*"
      className="create-pg-file-input"
      ref={videoInputRef}
      onChange={handleVideoUpload}
      />
      </label>
    </div>

    {/* VIDEO PREVIEW */}
    {videoList.length > 0 && (
    <div className="create-pg-form-group create-pg-form-row-single">
    <div className="create-pg-image-preview-grid">
      {videoList.map((video, i) => (
        <div key={video.id} className="create-pg-image-item">
          <video src={video.src} controls />
          <span className="create-pg-image-badge">{i + 1}</span>

          <button
            type="button"
            className="create-pg-image-remove-btn"
            onClick={() => removeVideo(video.id)}
          >
            ×
          </button>
        </div>
         ))}
      </div>
      </div>
    )}

        {/* Actions */}
        <div className="create-pg-form-actions">
          <button
            type="button"
            className="create-pg-btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`create-pg-btn-submit ${loading ? "loading" : ""}`}
            disabled={loading}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", opacity: loading ? 0.85 : 1 }}
          >
            {loading ? (
              <>
                <span style={{
                  width:"15px", height:"15px",
                  border:"2px solid rgba(255,255,255,0.4)",
                  borderTopColor:"#fff",
                  borderRadius:"50%",
                  display:"inline-block",
                  animation:"cpg-spin 0.7s linear infinite",
                  flexShrink:0,
                }}/>
                Creating...
              </>
            ) : "Create PG"}
            <style>{`@keyframes cpg-spin { to { transform: rotate(360deg); } }`}</style>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePGForm;