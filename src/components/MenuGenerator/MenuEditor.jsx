import React, { useState } from "react";
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp, FiHome, FiSettings, FiCalendar } from "react-icons/fi";

const MenuEditor = ({
  pgName,
  setPgName,
  address,
  setAddress,
  days,
  setDays,
  mealConfigs,
  setMealConfigs,
  theme,
  setTheme,
  pgNameRef,
  addressRef,
  ownerPGs
}) => {
  const [openDayId, setOpenDayId] = useState(1);

  const handleMealConfigToggle = (id) => {
    setMealConfigs(
      mealConfigs.map((config) =>
        config.id === id ? { ...config, enabled: !config.enabled } : config,
      ),
    );
  };

  const handleMealTimeChange = (id, newTime) => {
    setMealConfigs(
      mealConfigs.map((config) =>
        config.id === id ? { ...config, time: newTime } : config,
      ),
    );
  };

  const toggleDay = (id) => {
    setOpenDayId(openDayId === id ? null : id);
  };

  const toggleActiveMeal = (dayId, mealType) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            activeMeals: {
              ...day.activeMeals,
              [mealType]: !day.activeMeals[mealType],
            },
          };
        }
        return day;
      }),
    );
  };

  const handleItemChange = (dayId, mealType, itemId, value) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            meals: {
              ...day.meals,
              [mealType]: day.meals[mealType].map((item) =>
                item.id === itemId ? { ...item, name: value } : item,
              ),
            },
          };
        }
        return day;
      }),
    );
  };

  const toggleVeg = (dayId, mealType, itemId) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            meals: {
              ...day.meals,
              [mealType]: day.meals[mealType].map((item) =>
                item.id === itemId ? { ...item, isVeg: !item.isVeg } : item,
              ),
            },
          };
        }
        return day;
      }),
    );
  };

  const addItem = (dayId, mealType) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          const newId = Date.now();
          return {
            ...day,
            meals: {
              ...day.meals,
              [mealType]: [
                ...day.meals[mealType],
                { id: newId, name: "", isVeg: true },
              ],
            },
          };
        }
        return day;
      }),
    );
  };

  const removeItem = (dayId, mealType, itemId) => {
    setDays(
      days.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            meals: {
              ...day.meals,
              [mealType]: day.meals[mealType].filter(
                (item) => item.id !== itemId,
              ),
            },
          };
        }
        return day;
      }),
    );
  };

  const renderMealInputs = (day, mealType, label) => {
    const isServed = day.activeMeals[mealType];

    return (
      <div className="meal-input-group" style={{ opacity: isServed ? 1 : 0.6 }}>
        <h4
          className="meal-input-header"
          onClick={() => toggleActiveMeal(day.id, mealType)}
        >
          <input
            type="checkbox"
            checked={isServed}
            readOnly
            className="meal-checkbox"
          />
          {label}
        </h4>

        {isServed ? (
          <>
            {day.meals[mealType].map((item, index) => (
              <div className="menu-item-row" key={item.id}>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    handleItemChange(day.id, mealType, item.id, e.target.value)
                  }
                  placeholder="e.g. Dal Makhani"
                />
                <div
                  className={`veg-toggle ${!item.isVeg ? "non-veg" : ""}`}
                  onClick={() => toggleVeg(day.id, mealType, item.id)}
                  title={item.isVeg ? "Set as Non-Veg" : "Set as Veg"}
                >
                  <div className="veg-indicator"></div>
                </div>
                {day.meals[mealType].length > 1 && (
                  <button
                    className="btn-remove-item"
                    onClick={() => removeItem(day.id, mealType, item.id)}
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            ))}
            <button
              className="btn-add-item"
              onClick={() => addItem(day.id, mealType)}
            >
              <FiPlus /> Add Item
            </button>
          </>
        ) : (
          <div className="meal-not-served-note">Not served on this day</div>
        )}
      </div>
    );
  };

  return (
    <div className="menu-editor">


      <h3 className="form-section-title">
        <FiHome className="form-section-icon" /> PG Details
      </h3>

      {ownerPGs && ownerPGs.length > 1 && (
        <div className="form-group">
          <label>Select PG to Autofill</label>
          <select
            style={{
              width: "100%",
              padding: "12px 40px 12px 14px",
              height: "48px",
              borderRadius: "12px",
              border: "1.5px solid #e2e8f0",
              background: "#f8fafc",
              backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' stroke='%234f46e5' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              backgroundSize: "18px 18px",
              fontFamily: "inherit",
              fontSize: "0.95rem",
              color: "#1e293b",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none"
            }}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedPg = ownerPGs.find((pg) => pg.id.toString() === selectedId);
              if (selectedPg) {
                setPgName(selectedPg.name);
                setAddress(selectedPg.address);
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>Select your PG...</option>
            {ownerPGs.map((pg) => (
              <option key={pg.id} value={pg.id}>
                {pg.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label>PG / Hostel Name <span className="required">*</span></label>
        <input
          ref={pgNameRef}
          type="text"
          value={pgName}
          onChange={(e) => setPgName(e.target.value)}
          placeholder="e.g. Green Valley PG & Mess"
        />
      </div>

      <div className="form-group">
        <label>Address <span className="required">*</span></label>
        <input
          ref={addressRef}
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123, MG Road, Koramangala, Bangalore"
        />
      </div>



      <h3 className="form-section-title form-section-title-mt28">
        <FiSettings className="form-section-icon" /> Meal Configuration
      </h3>
      <div className="meal-config-section">
        {mealConfigs &&
          mealConfigs.map((config) => (
            <div key={config.id} className="meal-config-row">
              <label className="meal-config-label">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={() => handleMealConfigToggle(config.id)}
                  className="meal-config-checkbox"
                />
                {config.name}
              </label>
              <input
                type="text"
                value={config.time}
                onChange={(e) =>
                  handleMealTimeChange(config.id, e.target.value)
                }
                disabled={!config.enabled}
                placeholder="e.g. 08:00 AM - 10:00 AM"
                className="meal-config-input"
                style={{ opacity: config.enabled ? 1 : 0.5 }}
              />
            </div>
          ))}
      </div>

      <h3 className="form-section-title form-section-title-mt28">
        <FiCalendar className="form-section-icon" /> Weekly Menu Planner
      </h3>

      <div className="days-list">
        {days.map((day) => (
          <div className="day-accordion" key={day.id}>
            <div
              className="day-accordion-header"
              onClick={() => toggleDay(day.id)}
            >
              <span>{day.name}</span>
              {openDayId === day.id ? <FiChevronUp /> : <FiChevronDown />}
            </div>

            {openDayId === day.id && (
              <div className="day-accordion-body">
                {mealConfigs &&
                  mealConfigs
                    .filter((c) => c.enabled)
                    .map((config) => (
                      <React.Fragment key={config.id}>
                        {renderMealInputs(
                          day,
                          config.id,
                          `${config.name} (${config.time})`,
                        )}
                      </React.Fragment>
                    ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuEditor;
