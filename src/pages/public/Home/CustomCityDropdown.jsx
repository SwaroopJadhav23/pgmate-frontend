import { useEffect, useRef, useState } from "react";
import "./CustomCityDropdown.css";

const CustomCityDropdown = ({ value, onChange, options = [] }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="city-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="city-dropdown-trigger"
        onClick={() => setOpen(!open)}
      >
        <span>{value || "All Cities"}</span>
        <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"}`} />
      </button>

      {open && (
        <ul className="city-dropdown-menu">
          {/* All Cities */}
          <li
            className={!value ? "active" : ""}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            All Cities
          </li>

          {/* City options from PG data */}
          {options.map((city) => (
            <li
              key={city}
              className={value === city ? "active" : ""}
              onClick={() => {
                onChange(city);
                setOpen(false);
              }}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomCityDropdown;
