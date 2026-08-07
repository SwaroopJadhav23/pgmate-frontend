import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../../api/axios";
import "./PoliceFormUpdateModal.css";

const PoliceFormUpdateModal = ({ pgsNeedingUpdate, onSuccess }) => {
  const [selectedType, setSelectedType] = useState("WITH_RULES");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Disable scrolling when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Update all PGs that need it
      const promises = pgsNeedingUpdate.map((pg) =>
        api.put(`/owner/pg/${pg.id}/police-form-type`, {
          policeFormType: selectedType,
        })
      );
      await Promise.all(promises);
      
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Police Verification preferences updated.",
        timer: 2000,
        showConfirmButton: false,
      });
      onSuccess();
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

  return (
    <div className="police-update-modal-overlay">
      <div className="police-update-modal">
        <div className="police-update-modal-header">
          <h2>Update Police Verification Settings</h2>
          <p>
            We've introduced Police Verification forms! Since you are an existing
            owner, please select how you want the Police Verification document to
            be generated for your existing properties.
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
                name="updatePoliceFormType"
                value="WITH_RULES"
                checked={selectedType === "WITH_RULES"}
                onChange={(e) => setSelectedType(e.target.value)}
              />
              <span className="police-form-radio-dot" />
              <span className="police-form-icon">🛡️📄</span>
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
                name="updatePoliceFormType"
                value="ONLY"
                checked={selectedType === "ONLY"}
                onChange={(e) => setSelectedType(e.target.value)}
              />
              <span className="police-form-radio-dot" />
              <span className="police-form-icon">📄</span>
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

export default PoliceFormUpdateModal;
