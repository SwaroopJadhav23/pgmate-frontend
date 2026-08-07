import React, { useState, useEffect, useContext } from "react";
import Swal from "sweetalert2";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "../pages/owner/PoliceFormUpdateModal.css";

const GlobalPoliceFormModal = () => {
  const { owner, role, isAuthenticated } = useContext(AuthContext);
  const [selectedType, setSelectedType] = useState("WITH_RULES");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && role === "OWNER" && owner) {
      // ONLY show this special "Update" modal if the owner has completed EVERYTHING ELSE
      // but is just missing the new defaultPoliceFormType feature.
      const hasAllOtherFields = 
        owner.name && 
        owner.email && 
        owner.city && 
        owner.photoUrl && 
        owner.idProofUrl;
        
      const isMissingPoliceForm = !owner.defaultPoliceFormType;

      if (hasAllOtherFields && isMissingPoliceForm) {
        setShowModal(true);
      }
    }
  }, [owner, role, isAuthenticated]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showModal]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", owner.name);
      fd.append("email", owner.email);
      fd.append("city", owner.city);
      fd.append("defaultPoliceFormType", selectedType);

      await api.put("/owner/profile", fd);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Police Verification preferences updated.",
        timer: 2000,
        showConfirmButton: false,
      });

      setShowModal(false);
      setTimeout(() => {
        window.location.href = "/owner/dashboard";
      }, 1000);
      
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update Police Verification preferences.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="police-update-modal-overlay" style={{ zIndex: 9999 }}>
      <div className="police-update-modal">
        <div className="police-update-modal-header">
          <h2>Update Police Verification Settings</h2>
          <p>
            We've introduced Police Verification forms! Since you are an existing
            owner, please select how you want the Police Verification document to
            be generated for your existing and future properties.
          </p>
        </div>

        <div className="police-update-modal-body">
          <label className="police-update-label">
            Choose your preferred format:
          </label>
          <div className="police-form-option-grid">
            <label
              className={`police-form-option ${
                selectedType === "WITH_RULES" ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                name="globalPoliceFormType"
                value="WITH_RULES"
                checked={selectedType === "WITH_RULES"}
                onChange={(e) => setSelectedType(e.target.value)}
              />
              <span className="police-form-radio-dot" />
              <div className="police-form-icon" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <i className="bi bi-shield-check" style={{ color: '#4f46e5' }}></i>
                <i className="bi bi-file-earmark-text" style={{ color: '#6b7280' }}></i>
              </div>
              <span className="police-form-option-title">
                Police Form with Rules & Regulations
              </span>
              <span className="police-form-option-desc">
                Generate a 2-page document with police verification details and
                rules & regulations.
              </span>
            </label>

            <label
              className={`police-form-option ${
                selectedType === "ONLY" ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                name="globalPoliceFormType"
                value="ONLY"
                checked={selectedType === "ONLY"}
                onChange={(e) => setSelectedType(e.target.value)}
              />
              <span className="police-form-radio-dot" />
              <div className="police-form-icon" style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <i className="bi bi-shield-check" style={{ color: '#4f46e5' }}></i>
              </div>
              <span className="police-form-option-title">
                Police Form Only
              </span>
              <span className="police-form-option-desc">
                Generate a 1-page document with only police verification details.
              </span>
            </label>
          </div>
        </div>

        <div className="police-update-modal-footer">
          <button
            className="police-update-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Updating..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalPoliceFormModal;
