import React from "react";
import {FiHome, FiUser, FiCreditCard} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PAYMENT_MODES = ["Cash", "Online Transfer", "Cheque", "UPI"];

/**
 * ReceiptForm — Left panel with input fields.
 * Uses PGMate brand styling (labels above inputs).
 */
const ReceiptForm = ({formData, onChange, errors = {}, ownerPGs, ownerResidents, owner}) => {
  const handleChange = (e) => {
    let {name, value} = e.target;
    if (name === "phoneNo") {
      value = value.replace(/\D/g, "");
      if (value.length > 10) value = value.slice(0, 10);
    }
    onChange({...formData, [name]: value});
  };

  const parseMonthToDate = (monthStr) => {
    if (!monthStr) return null;
    const [year, month] = monthStr.split('-');
    return new Date(year, month - 1);
  };

  const handleDateChange = (name, date) => {
    if (!date) {
      onChange({ ...formData, [name]: "" });
      return;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    onChange({ ...formData, [name]: `${year}-${month}` });
  };

  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  const nextYear = new Date();
  nextYear.setFullYear(today.getFullYear() + 1);

  const availableTenants = ownerResidents && formData.pgName 
    ? ownerResidents.filter(r => r.pgName === formData.pgName) 
    : [];

  return (
    <div className="rr-editor">
      <h3 className="form-section-title">
        <FiHome className="form-section-icon" /> PG Details
      </h3>

      {ownerPGs && ownerPGs.length > 1 && (
        <div className="form-group">
          <label htmlFor="pgSelect">Select PG to Autofill</label>
          <select
            id="pgSelect"
            className="rr-select"
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedPg = ownerPGs.find((pg) => pg.id.toString() === selectedId);
              if (selectedPg) {
                onChange({
                  ...formData,
                  pgName: selectedPg.name,
                  pgAddress: selectedPg.address,
                  landlordName: owner?.name || formData.landlordName,
                  phoneNo: owner?.phone || formData.phoneNo
                });
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
        <label htmlFor="pgName">
          PG / Hostel Name <span className="required">*</span>
        </label>
        <input
          id="pgName"
          type="text"
          name="pgName"
          value={formData.pgName}
          onChange={handleChange}
          className={errors.pgName ? "input-error" : ""}
        />
        {errors.pgName && <span className="field-error">{errors.pgName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="pgAddress">
          Property Address <span className="required">*</span>
        </label>
        <input
          id="pgAddress"
          type="text"
          name="pgAddress"
          value={formData.pgAddress}
          onChange={handleChange}
          className={errors.pgAddress ? "input-error" : ""}
        />
        {errors.pgAddress && (
          <span className="field-error">{errors.pgAddress}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="landlordName">
            Owner Name <span className="required">*</span>
          </label>
          <input
            id="landlordName"
            type="text"
            name="landlordName"
            value={formData.landlordName}
            onChange={handleChange}
            className={errors.landlordName ? "input-error" : ""}
          />
          {errors.landlordName && (
            <span className="field-error">{errors.landlordName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phoneNo">
            Phone Number <span className="required">*</span>
          </label>
          <input
            id="phoneNo"
            type="tel"
            name="phoneNo"
            value={formData.phoneNo}
            onChange={handleChange}
            className={errors.phoneNo ? "input-error" : ""}
          />
          {errors.phoneNo && (
            <span className="field-error">{errors.phoneNo}</span>
          )}
        </div>
      </div>

      <h3 className="form-section-title form-section-title-mt28">
        <FiUser className="form-section-icon" /> Tenant Details
      </h3>

      {availableTenants.length > 0 && (
        <div className="form-group">
          <label htmlFor="tenantSelect">Select Tenant to Autofill</label>
          <select
            id="tenantSelect"
            className="rr-select"
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedResident = availableTenants.find((r) => r.residentId.toString() === selectedId);
              if (selectedResident) {
                const matchedMode = PAYMENT_MODES.find(m => m.toLowerCase() === (selectedResident.onboardingPaymentMode || "").toLowerCase());
                onChange({
                  ...formData,
                  tenantName: selectedResident.name || formData.tenantName,
                  rentAmount: selectedResident.monthlyRent || formData.rentAmount,
                  securityDeposit: selectedResident.deposit || formData.securityDeposit,
                  paymentMode: matchedMode || formData.paymentMode
                });
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>Select a tenant...</option>
            {availableTenants.map((r) => (
              <option key={r.residentId} value={r.residentId}>
                {r.name} {r.roomNumber ? `(Room ${r.roomNumber})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="tenantName">
          Tenant Name <span className="required">*</span>
        </label>
        <input
          id="tenantName"
          type="text"
          name="tenantName"
          value={formData.tenantName}
          onChange={handleChange}
          className={errors.tenantName ? "input-error" : ""}
        />
        {errors.tenantName && (
          <span className="field-error">{errors.tenantName}</span>
        )}
      </div>

      <h3 className="form-section-title form-section-title-mt28">
        <FiCreditCard className="form-section-icon" /> Payment Details
      </h3>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="receiptDate">
            Receipt Date <span className="required">*</span>
          </label>
          <input
            id="receiptDate"
            type="date"
            name="receiptDate"
            value={formData.receiptDate}
            onChange={handleChange}
            min="2000-01-01"
            max={todayString}
            className={errors.receiptDate ? "input-error" : ""}
          />
          {errors.receiptDate && (
            <span className="field-error">{errors.receiptDate}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="paymentMode">
            Payment Mode <span className="required">*</span>
          </label>
          <select
            id="paymentMode"
            name="paymentMode"
            value={formData.paymentMode}
            onChange={handleChange}
            className={`rr-select ${errors.paymentMode ? "input-error" : ""}`}
            required
          >
            <option value="" disabled hidden></option>
            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
          {errors.paymentMode && (
            <span className="field-error">{errors.paymentMode}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="fromMonth">
            From Month <span className="required">*</span>
          </label>
          <div className="rr-datepicker-wrapper">
            <DatePicker
              selected={parseMonthToDate(formData.fromMonth)}
              onChange={(date) => handleDateChange("fromMonth", date)}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              className={errors.fromMonth ? "input-error" : ""}
              placeholderText="MM/YYYY"
              id="fromMonth"
            />
          </div>
          {errors.fromMonth && (
            <span className="field-error">{errors.fromMonth}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="toMonth">
            To Month <span className="required">*</span>
          </label>
          <div className="rr-datepicker-wrapper">
            <DatePicker
              selected={parseMonthToDate(formData.toMonth)}
              onChange={(date) => handleDateChange("toMonth", date)}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              maxDate={nextYear}
              className={errors.toMonth ? "input-error" : ""}
              placeholderText="MM/YYYY"
              id="toMonth"
            />
          </div>
          {errors.toMonth && (
            <span className="field-error">{errors.toMonth}</span>
          )}
        </div>
      </div>

      <h3 className="form-section-title form-section-title-mt28-sm">
        Amount Breakdown
      </h3>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="rentAmount">
            Rent & Maint. (₹) <span className="required">*</span>
          </label>
          <input
            id="rentAmount"
            type="number"
            name="rentAmount"
            value={formData.rentAmount}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            min="0"
            className={errors.rentAmount ? "input-error" : ""}
          />
          {errors.rentAmount && (
            <span className="field-error">{errors.rentAmount}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="electricityCharges">Electricity (₹)</label>
          <input
            id="electricityCharges"
            type="number"
            name="electricityCharges"
            value={formData.electricityCharges}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            min="0"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="waterCharges">Water (₹)</label>
          <input
            id="waterCharges"
            type="number"
            name="waterCharges"
            value={formData.waterCharges}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="wifiCharges">Wi-Fi (₹)</label>
          <input
            id="wifiCharges"
            type="number"
            name="wifiCharges"
            value={formData.wifiCharges}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            min="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="securityDeposit">Security Deposit (₹)</label>
        <input
          id="securityDeposit"
          type="number"
          name="securityDeposit"
          value={formData.securityDeposit}
          onChange={handleChange}
          onWheel={(e) => e.target.blur()}
          min="0"
        />
      </div>
    </div>
  );
};

export default ReceiptForm;
