import React from "react";
import {useNavigate} from "react-router-dom";
import "../MenuGenerator/ComingSoon.css";

// Shown when a logged-in Tenant/User tries to access the Owner-only Free Tools.
const OwnerToolsRestricted = () => {
  const navigate = useNavigate();

  return (
    <div className="coming-page">
      <div className="coming-icon">🔒</div>
      <h1>Owners Only</h1>
      <p>These tools are available only for PG Owners.</p>
      <button
        type="button"
        className="coming-badge"
        style={{cursor: "pointer", border: "none"}}
        onClick={() => navigate("/")}
      >
        Go to Home
      </button>
    </div>
  );
};

export default OwnerToolsRestricted;
