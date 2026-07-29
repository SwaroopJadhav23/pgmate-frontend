import React from "react";
import rentReceiptStepsImg from "../../assets/rent_receipt_steps.png";

const RentReceiptFeatures = () => {
  return (
    <div className="seo-features-wrapper">
      <div className="seo-content-section seo-features-section">
        {/* How it Works Section */}
        <div className="seo-block">
          <h2 className="seo-title">How to Generate a Rent Receipt?</h2>
          <p className="seo-subtitle">
            Create valid rent receipts for HRA claims in 3 simple steps.
          </p>
          <div className="seo-image-wrapper" style={{ marginTop: '30px' }}>
            <img src={rentReceiptStepsImg} alt="Rent Receipt Steps" style={{ width: '100%', height: 'auto' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentReceiptFeatures;
