import { useState, useRef, useEffect } from "react";

const CustomSelect = ({ options = [], value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ Find selected label
  const selectedOption = options.find((opt) => {
    const val = opt.value ?? opt;
    return val === value;
  });

  const displayLabel = selectedOption
    ? selectedOption.label ?? selectedOption
    : placeholder;

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className="custom-select__trigger"
        onClick={() => setOpen(!open)}
      >
        {displayLabel}
        <span className={`arrow ${open ? "open" : ""}`}>⌄</span>
      </button>

      {open && (
        <div className="custom-select__dropdown">

          {/* ✅ Default / Reset option */}
          <div
            className={`custom-select__option ${!value ? "active" : ""}`}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            {placeholder}
          </div>

          {options.map((opt) => {
            const val = opt.value ?? opt;
            const label = opt.label ?? opt;

            return (
              <div
                key={val}
                className={`custom-select__option ${value === val ? "active" : ""}`}
                onClick={() => {
                  onChange(val);
                  setOpen(false);
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;