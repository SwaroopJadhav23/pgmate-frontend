import React from "react";
import pgmateLogo from "../../assets/pgmate-withoutbg.png";
import { FiMapPin } from "react-icons/fi";
import { FaUtensils } from "react-icons/fa";
import "./MenuPreviewOption2.css";

const MenuPreviewOption2 = ({
  pgName,
  address,
  days,
  mealConfigs,
  isGenerating,
}) => {
  const renderPreviewItem = (item) => (
    <div className="opt2-food-item" key={item.id}>
      <span className={`opt2-veg-icon ${!item.isVeg ? "non-veg" : ""}`} />
      <span>
        {item.name || <span className="opt2-item-empty">—</span>}
      </span>
    </div>
  );

  const getShortDayName = (name) => {
    const map = {
      Sunday: "SUN",
      Monday: "MON",
      Tuesday: "TUES",
      Wednesday: "WED",
      Thursday: "THURS",
      Friday: "FRI",
      Saturday: "SAT"
    };
    return map[name] || name.toUpperCase().substring(0, 3);
  };

  return (
    <div className="preview-board-opt2">
      {/* Spinner overlaid on top during generate animation */}
      {isGenerating && (
        <div className="opt2-spinner-overlay">
          <div className="spinner preview-spinner" />
          <div className="preview-loading-text">GENERATING MENU...</div>
        </div>
      )}

      {/* ── Brand Header ── */}
      <div className="opt2-header">
        <h1 className="opt2-title">
          <FaUtensils style={{ fontSize: '2.0rem' }} /> FOOD MENU
        </h1>
        <h2 className="opt2-pg-name">{pgName || "Your PG Name"}</h2>
        {address && (
          <p className="opt2-address">
            <FiMapPin style={{ strokeWidth: '2.5' }} /> {address}
          </p>
        )}
      </div>

      {/* ── Grid Layout (Days + Notes) ── */}
      <div className="opt2-grid">
        {days.map((day) => (
          <div className="opt2-day-card" key={day.id}>
            <div className="opt2-day-label">{getShortDayName(day.name)}</div>
            {mealConfigs &&
              mealConfigs
                .filter((c) => c.enabled)
                .map((config) => (
                  <div className="opt2-meal-row" key={config.id}>
                    <div className="opt2-meal-name">{config.name}</div>
                    <div className="opt2-meal-items">
                      {day.activeMeals && !day.activeMeals[config.id] ? (
                        <span className="opt2-item-empty">Not Served</span>
                      ) : day.meals[config.id] && day.meals[config.id].length > 0 ? (
                        day.meals[config.id].map(renderPreviewItem)
                      ) : (
                        <span className="opt2-item-empty">—</span>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        ))}

        {/* ── Notes Card ── */}
        <div className="opt2-day-card">
          <div className="opt2-day-label">NOTES</div>
          {mealConfigs &&
            mealConfigs
              .filter((c) => c.enabled)
              .map((config) => (
                <div className="opt2-meal-row" key={`note-${config.id}`}>
                  <div className="opt2-meal-name">{config.name}</div>
                  <div className="opt2-meal-items" style={{ justifyContent: 'center', fontWeight: '500', fontFamily: 'Poppins, sans-serif', color: '#2B2B2B', fontSize: '0.85rem' }}>
                    {config.time}
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="opt2-footer">
        <div className="opt2-legend">
          <div className="opt2-legend-item">
            <span className="opt2-veg-icon" /> Vegetarian
          </div>
          <div className="opt2-legend-item">
            <span className="opt2-veg-icon non-veg" /> Non-Vegetarian
          </div>
        </div>
        <div className="opt2-powered-by">
          Powered by
          <img src={pgmateLogo} alt="PGMate Logo" />
        </div>
      </div>
    </div>
  );
};

export default MenuPreviewOption2;
