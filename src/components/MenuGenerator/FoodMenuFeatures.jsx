import React from "react";
import {FiCheckCircle, FiShield, FiFileText} from "react-icons/fi";

const FoodMenuFeatures = () => {
  return (
    <>
      <div className="seo-content-section seo-features-section">
        {/* How it Works Section */}
        <div className="seo-block">
          <h2 className="seo-title">How to Generate a Food Menu?</h2>
          <p className="seo-subtitle">
            Create structured weekly food menus in 3 simple steps.
          </p>
          <div className="seo-steps-grid">
            <div className="seo-step-card">
              <div className="step-icon">
                <FiFileText />
              </div>
              <h3>1. Enter Details</h3>
              <p>
                Add your PG name, address, and the dates for the upcoming week.
              </p>
            </div>
            <div className="seo-step-card">
              <div className="step-icon">
                <FiShield />
              </div>
              <h3>2. Plan Meals</h3>
              <p>
                Input breakfast, lunch, snacks, and dinner for each day. Mark
                items as Veg or Non-Veg.
              </p>
            </div>
            <div className="seo-step-card">
              <div className="step-icon">
                <FiCheckCircle />
              </div>
              <h3>3. Download & Share</h3>
              <p>
                Click download to save as an Image or PDF and share it with your
                residents via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FoodMenuFeatures;
