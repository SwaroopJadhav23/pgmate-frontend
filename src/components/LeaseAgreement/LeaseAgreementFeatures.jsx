import React from "react";
import leaseAgreementStepsImg from "../../assets/lease_agreement_steps.png";

const LeaseAgreementFeatures = () => {
  return (
    <div className="seo-features-wrapper">
      <div className="seo-content-section seo-features-section">
        <div className="seo-block">
          <h2 className="seo-title">How to Generate a Lease Agreement?</h2>
          <p className="seo-subtitle">
            Create a legally binding rental agreement in 3 simple steps.
          </p>
          <div className="seo-image-wrapper" style={{ marginTop: '30px' }}>
            <img src={leaseAgreementStepsImg} alt="Lease Agreement Steps" style={{ width: '100%', height: 'auto' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaseAgreementFeatures;
