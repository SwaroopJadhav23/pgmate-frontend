import React from "react";
import {FiHome, FiTrendingUp, FiTrendingDown} from "react-icons/fi";

/**
 * ExpenseForm — comprehensive income and expense input form with floating labels.
 */
const Field = ({
  id,
  label,
  type = "number",
  required = false,
  min = "0",
  formData,
  onChange,
  errors = {},
}) => {
  const handleChange = (e) => {
    const {name, value} = e.target;
    onChange({...formData, [name]: value});
  };
  return (
    <div className="exp-floating-group">
      <input
        id={id}
        type={type}
        name={id}
        value={formData[id] || ""}
        onChange={handleChange}
        onWheel={type === "number" ? (e) => e.target.blur() : undefined}
        placeholder=" "
        min={min}
        className={errors[id] ? "input-error" : ""}
      />
      <label htmlFor={id}>
        {label} {required && <span className="required">*</span>}
      </label>
      {errors[id] && <span className="field-error">{errors[id]}</span>}
    </div>
  );
};

const ExpenseForm = ({formData, onChange, errors = {}, ownerPGs, pgStats}) => {
  const handleChange = (e) => {
    const {name, value} = e.target;
    onChange({...formData, [name]: value});
  };

  return (
    <div className="exp-form">
      {/* ── PG Info ── */}
      <h3 className="exp-form-section-title">
        <FiHome className="exp-form-section-icon" /> PG Information
      </h3>

      {ownerPGs && ownerPGs.length > 1 && (
        <div className="exp-floating-group">
          <select
            id="pgSelect"
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedPg = ownerPGs.find(pg => pg.id.toString() === selectedId);
              const stats = pgStats.find(s => s.pgId === selectedId) || {};
              if (selectedPg) {
                onChange({
                  ...formData,
                  pgName: selectedPg.name,
                  numRooms: stats.totalRooms?.toString() || formData.numRooms,
                  totalBeds: stats.totalBeds?.toString() || formData.totalBeds,
                  occupiedBeds: stats.occupiedBeds?.toString() || formData.occupiedBeds
                });
              }
            }}
            defaultValue=""
            style={{ 
              appearance: "none", 
              backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236f7af0%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              backgroundSize: "18px"
            }}
          >
            <option value="" disabled hidden></option>
            {ownerPGs.map((pg) => (
              <option key={pg.id} value={pg.id}>{pg.name}</option>
            ))}
          </select>
          <label htmlFor="pgSelect" style={{ transform: "translateY(-10px) scale(0.75)", fontWeight: 700, color: "#64748b" }}>
            Select PG to Autofill
          </label>
        </div>
      )}

      <div className="exp-floating-group">
        <input
          id="pgName"
          type="text"
          name="pgName"
          value={formData.pgName || ""}
          onChange={handleChange}
          placeholder=" "
          className={errors.pgName ? "input-error" : ""}
        />
        <label htmlFor="pgName">
          PG Name <span className="required">*</span>
        </label>
        {errors.pgName && <span className="field-error">{errors.pgName}</span>}
      </div>

      <div className="exp-floating-group">
        <input
          id="reportMonth"
          type="month"
          name="reportMonth"
          value={formData.reportMonth || ""}
          onChange={handleChange}
          placeholder=" "
          className={errors.reportMonth ? "input-error" : ""}
        />
        <label htmlFor="reportMonth">
          Report Month <span className="required">*</span>
        </label>
        {errors.reportMonth && (
          <span className="field-error">{errors.reportMonth}</span>
        )}
      </div>

      <div className="exp-form-row">
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="numRooms"
          label="Number of Rooms"
          required
        />
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="totalBeds"
          label="Total Beds"
          required
        />
      </div>
      <div className="exp-form-row">
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="occupiedBeds"
          label="Occupied Beds"
          required
        />
      </div>

      {/* ── Income ── */}
      <h3 className="exp-form-section-title exp-section-gap">
        <FiTrendingUp className="exp-form-section-icon income" /> Income Details
      </h3>

      <div className="exp-form-row">
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="rentCollected"
          label="Rent Collected (₹)"
          required
        />
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="securityReceived"
          label="Security Deposits Rec. (₹)"
        />
      </div>
      <div className="exp-form-row">
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="parkingCharges"
          label="Parking Charges (₹)"
        />
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="laundryCharges"
          label="Laundry Charges (₹)"
        />
      </div>
      <div className="exp-floating-group">
        <input
          id="otherIncome"
          type="number"
          name="otherIncome"
          value={formData.otherIncome || ""}
          onChange={handleChange}
          onWheel={(e) => e.target.blur()}
          placeholder=" "
          min="0"
        />
        <label htmlFor="otherIncome">Other Income (₹)</label>
      </div>

      {/* ── Expenses ── */}
      <h3 className="exp-form-section-title exp-section-gap">
        <FiTrendingDown className="exp-form-section-icon expense" /> Expense
        Details
      </h3>

      <div className="exp-form-row">
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="foodKitchen"
          label="Food & Kitchen (₹)"
        />
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="staffSalary"
          label="Staff Salaries (₹)"
        />
      </div>
      <div className="exp-form-row">
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="utilities"
          label="Utilities (₹)"
        />
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="maintenance"
          label="Maintenance (₹)"
        />
      </div>
      <div className="exp-form-row">
        <Field
          formData={formData}
          onChange={onChange}
          errors={errors}
          id="miscExpenses"
          label="Miscellaneous (₹)"
        />
      </div>
    </div>
  );
};

export default ExpenseForm;
