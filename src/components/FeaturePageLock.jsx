import { Lock } from "lucide-react";
import "./FeaturePageLock.css";
const FeaturePageLock = ({ feature, onUnlock }) => {

  return (
    <div className="feature-lock-overlay">

      <div className="feature-lock-box">

        <div className="feature-lock-icon">
          <Lock size={40} strokeWidth={2} />
        </div>

        <h3>{feature} Locked</h3>

        <p>
          This feature is locked for your current plan.
          Unlock it to continue using this page.
        </p>

        <button
          className="btn btn-success unlock-feature-btn"
          onClick={onUnlock}
        >
          Unlock Feature
        </button>

      </div>

    </div>
  );

};

export default FeaturePageLock;