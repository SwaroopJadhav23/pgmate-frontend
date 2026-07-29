import React from "react";
import "./MenuPreviewOption1.css";
import pgmateLogo from "../../assets/pgmate-withoutbg.png";
import headerImg from "../../assets/option1_heading_menucard.png";
import footerImg from "../../assets/Option1_buttom_menucard.png";
import {
  FiMapPin,
  FiSunrise,
  FiSun,
  FiCoffee,
  FiMoon,
} from "react-icons/fi";
import {FaUtensils} from "react-icons/fa";

const MenuPreviewOption1 = ({
  pgName,
  address,
  dateRange,
  days,
  mealConfigs,
  isGenerating,
  theme,
}) => {
  const renderPreviewItem = (item) => (
    <span className="opt1-food-item" key={item.id}>
      {item.name || <span className="opt1-item-empty">—</span>}
    </span>
  );

  const safeTheme = theme || "option1";
  const activeMealsCount = mealConfigs ? mealConfigs.filter(c => c.enabled).length : 4;

  return (
    <div className={`preview-board-opt1 ${safeTheme}-colors`} style={{position: "relative"}}>
      {isGenerating && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.85)",
            zIndex: 10,
          }}
        >
          <div className="spinner preview-spinner" />
          <div className="preview-loading-text">GENERATING MENU...</div>
        </div>
      )}

      <div className="printable-menu-opt1">
        {/* Header Image section (Contains "FOOD MENU" text in image) */}
        <div className="opt1-header-img-wrapper">
          <img src={headerImg} alt="Food Menu" className="opt1-header-img" />
        </div>

        {/* PG Info */}
        <div className="opt1-pg-info">
          <h2 className="opt1-pg-name">
            <FaUtensils className="opt1-utensil-icon" />
            {pgName || "Your PG Name"}
          </h2>
          {address && (
            <p className="opt1-address">
              <FiMapPin className="opt1-address-pin" /> {address}
            </p>
          )}
        </div>

        {/* Meal Timings Horizontal Bar */}
        <div className="opt1-timings-wrapper">
          <div className="opt1-timings-badge">MEAL TIMINGS</div>
          <div className="opt1-timings-container">
            {mealConfigs &&
              mealConfigs
                .filter((c) => c.enabled)
                .map((config) => (
                  <div className="opt1-timing-item" key={config.id}>
                    <div className="opt1-timing-label">
                      {config.id === "breakfast" && <FiSunrise className="opt1-meal-emoji" />}
                      {config.id === "lunch" && <FiSun className="opt1-meal-emoji" />}
                      {config.id === "snacks" && <FiCoffee className="opt1-meal-emoji" />}
                      {config.id === "dinner" && <FiMoon className="opt1-meal-emoji" />}
                      {config.name.toUpperCase()}
                    </div>
                    <div className="opt1-timing-time">{config.time}</div>
                  </div>
                ))}
          </div>
        </div>

        {/* Days Grid */}
        <div className="opt1-days-grid">
          {days.map((day) => (
            <div className={`opt1-day-card opt1-meals-count-${activeMealsCount}`} key={day.id}>
              <h3 className="opt1-day-name">{day.name.toUpperCase()}</h3>
              <div className="opt1-day-meals">
                {mealConfigs &&
                  mealConfigs
                    .filter((c) => c.enabled)
                    .map((config) => {
                      const mealItems = day.meals[config.id] || [];
                      const isNonVeg = mealItems.some(item => !item.isVeg);

                      return (
                        <div className="opt1-meal-row" key={config.id}>
                          <span className="opt1-meal-name">
                            {config.name}:
                          </span>
                        <div className="opt1-meal-items">
                          {day.activeMeals && !day.activeMeals[config.id] ? (
                            <span className="opt1-meal-not-served">Not Served</span>
                          ) : day.meals[config.id] && day.meals[config.id].length > 0 ? (
                            <>
                              <span className={`opt1-veg-square ${isNonVeg ? "non-veg" : ""}`} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'baseline', transform: 'translateY(1px)' }} />
                              {day.meals[config.id].map((item, idx) => (
                              <React.Fragment key={item.id}>
                                {renderPreviewItem(item)}
                                {idx < day.meals[config.id].length - 1 && ", "}
                              </React.Fragment>
                            ))}
                            </>
                          ) : (
                            <span className="opt1-item-empty">—</span>
                          )}
                        </div>
                        </div>
                      );
                    })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Design containing food illustrations & Legend */}
        <div className="opt1-footer">
          {/* We overlay the footer image at the bottom */}
          <img src={footerImg} alt="" className="opt1-footer-img" />
          
          <div className="opt1-footer-content">
            <div className="opt1-legend">
              <span className="opt1-legend-item">
                <span className="opt1-veg-square" /> Vegetarian
              </span>
              <span className="opt1-legend-item">
                <span className="opt1-veg-square non-veg" /> Non-Vegetarian
              </span>
            </div>
            <div className="opt1-powered-by">
              Powered by
              <img src={pgmateLogo} alt="PGMate Logo" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPreviewOption1;
