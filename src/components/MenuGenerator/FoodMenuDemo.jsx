import React from "react";
import MenuPreview from "./MenuPreview";
import {mockMenuData, mockMealConfigs} from "./FoodMenuHero";
import {FiEdit2, FiDownload} from "react-icons/fi";
import {FaWhatsapp} from "react-icons/fa";
import {MdOutlineVerifiedUser} from "react-icons/md";

import "./FoodMenuGenerator.css";

const FoodMenuDemo = ({ selectedTheme = "option1", setSelectedTheme }) => {
  const [zoom, setZoom] = React.useState(0.35);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth <= 360) {
        setZoom(0.28);
      } else if (window.innerWidth <= 480) {
        setZoom(0.30);
      } else if (window.innerWidth <= 768) {
        setZoom(0.32);
      } else {
        setZoom(0.36); // Fits perfectly with extra breathing room
      }
    }
  }, []);



  return (
    <div className="fm-demo-section" id="view-demo">
      <div className="fm-demo-container">
        <div className="fm-demo-main-title">
          <h2>
            Food Menu <span className="fm-demo-highlight">Demo</span>
          </h2>
        </div>

        <div className="fm-demo-content-row">
          <div className="fm-demo-features">
            <div className="fm-demo-feature">
              <div className="fm-demo-icon">
                <FiEdit2 />
              </div>
              <div className="fm-demo-text">
                <strong>1. Customize Easily</strong>
                <span>Add, edit, or remove meals in seconds.</span>
              </div>
            </div>

            <div className="fm-demo-feature">
              <div className="fm-demo-icon">
                <MdOutlineVerifiedUser />
              </div>
              <div className="fm-demo-text">
                <strong>2. Professional Design</strong>
                <span>Clean, modern layouts that build trust.</span>
              </div>
            </div>

            <div className="fm-demo-feature">
              <div className="fm-demo-icon">
                <FiDownload />
              </div>
              <div className="fm-demo-text">
                <strong>3. Export & Share</strong>
                <span>Download as PDF or image for printing or sharing.</span>
              </div>
            </div>

            <div className="fm-demo-feature">
              <div className="fm-demo-icon">
                <FaWhatsapp />
              </div>
              <div className="fm-demo-text">
                <strong>4. WhatsApp Ready</strong>
                <span>Share beautifully formatted menus on WhatsApp.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fm-demo-theme-selector">
          <h3>Choose your menu design:</h3>
          <div className="theme-toggle-buttons">
            <button 
              className={`theme-btn ${selectedTheme === "option1" ? "active" : ""}`}
              onClick={() => setSelectedTheme && setSelectedTheme("option1")}
            >
              Option 1
            </button>
            <button 
              className={`theme-btn ${selectedTheme === "option2" ? "active" : ""}`}
              onClick={() => setSelectedTheme && setSelectedTheme("option2")}
            >
              Option 2
            </button>
          </div>
        </div>

        <div className="fm-demo-preview-container">
          <div 
            className="fm-demo-preview-card"
            style={{ 
              height: '500px',
              width: '100%',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div 
                className="menu-scale-wrapper"
                style={{ 
                  width: '794px',
                  height: '1123px',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center'
                }}
              >
                <MenuPreview
                  id="demo-printable-menu-area"
                  pgName={mockMenuData.pgName}
                  address={mockMenuData.address}
                  days={mockMenuData.days}
                  mealConfigs={mockMealConfigs}
                  theme={selectedTheme}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodMenuDemo;
