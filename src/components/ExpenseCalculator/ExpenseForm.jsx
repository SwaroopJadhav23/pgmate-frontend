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

const ExpenseForm = ({formData, onChange, errors = {}}) => {
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
