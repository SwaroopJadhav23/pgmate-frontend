import React, {useState} from "react";
import {
  FiHome,
  FiUser,
  FiCalendar,
  FiAlertCircle,
  FiList,
  FiClock,
  FiUsers,
  FiXCircle,
  FiFileText,
  FiCheckSquare,
} from "react-icons/fi";
import {BiRupee} from "react-icons/bi";
import toast from "react-hot-toast";

/**
 * LeaseForm — Input form with floating labels, grouped into logical sections.
 */

const GUEST_POLICY_OPTIONS = [
  "Overnight guests are not allowed. Visitors are allowed only in the common area between 8:00 AM to 10:00 PM with prior notice.",
  "No visitors or guests are allowed inside the premises at any time.",
  "Guests are allowed during daytime only (9:00 AM to 8:00 PM). No overnight stays permitted.",
  "Visitors must register at the entrance and are allowed only in designated common areas.",
  "Family members are allowed to visit during daytime hours with prior intimation to the owner.",
  "No guests allowed after 9:00 PM. Violators may be asked to vacate.",
];

const SMOKING_OPTIONS = [
  "Smoking and drinking alcohol are strictly prohibited inside the premises. Violation may lead to immediate termination.",
  "Smoking is strictly prohibited anywhere on the premises including balconies and common areas.",
  "Alcohol consumption is not permitted inside the PG premises at any time.",
  "Smoking is allowed only in the designated outdoor area. Alcohol is strictly prohibited.",
  "Both smoking and alcohol are strictly prohibited. Any violation will result in immediate eviction.",
];

const GENERAL_RULES = [
  "Government ID mandatory",
  "Maintain cleanliness and hygiene in your room and common areas.",
  "Do not cause any damage to the property. Any damages will be charged.",
  "Use of electrical appliances with prior permission only.",
  "Follow all safety and security guidelines.",
  "Parking as per allotment only",
];

const LeaseForm = ({formData, onChange, errors = {}}) => {
  const handleChange = (e) => {
    let {name, value} = e.target;
    if (name === "ownerPhone" || name === "tenantPhone") {
      value = value.replace(/\D/g, "");
      if (value.length > 10) value = value.slice(0, 10);
    }
    onChange({...formData, [name]: value});
  };

  const handleRuleToggle = (rule) => {
    const selected = formData.selectedRules || [];
    if (selected.includes(rule)) {
      onChange({
        ...formData,
        selectedRules: selected.filter((r) => r !== rule),
      });
    } else {
      if (selected.length >= 4) {
        toast.error("You can only select up to 4 general rules.");
        return;
      }
      onChange({...formData, selectedRules: [...selected, rule]});
    }
  };

  const [newCustomTerm, setNewCustomTerm] = useState("");

  const handleAddCustomTerm = () => {
    const trimmed = newCustomTerm.trim();
    if (!trimmed) return;
    const existing = formData.customTerms || [];
    onChange({...formData, customTerms: [...existing, trimmed]});
    setNewCustomTerm("");
  };

  const handleRemoveCustomTerm = (index) => {
    const existing = formData.customTerms || [];
    onChange({
      ...formData,
      customTerms: existing.filter((_, i) => i !== index),
    });
  };
  const [newGeneralCustomRule, setNewGeneralCustomRule] = useState("");

  const handleAddGeneralCustomRule = () => {
    const trimmed = newGeneralCustomRule.trim();
    if (!trimmed) return;
    const existing = formData.generalCustomRules || [];
    onChange({...formData, generalCustomRules: [...existing, trimmed]});
    setNewGeneralCustomRule("");
  };

  const handleRemoveGeneralCustomRule = (index) => {
    const existing = formData.generalCustomRules || [];
    onChange({
      ...formData,
      generalCustomRules: existing.filter((_, i) => i !== index),
    });
  };

  const [newCustomSmokingRule, setNewCustomSmokingRule] = useState("");

  const handleAddCustomSmokingRule = () => {
    const trimmed = newCustomSmokingRule.trim();
    if (!trimmed) return;
    const existing = formData.customSmokingRules || [];
    onChange({...formData, customSmokingRules: [...existing, trimmed]});
    setNewCustomSmokingRule("");
  };

  const handleRemoveCustomSmokingRule = (index) => {
    const existing = formData.customSmokingRules || [];
    onChange({
      ...formData,
      customSmokingRules: existing.filter((_, i) => i !== index),
    });
  };

  const [newCustomGuestPolicy, setNewCustomGuestPolicy] = useState("");

  const handleAddCustomGuestPolicy = () => {
    const trimmed = newCustomGuestPolicy.trim();
    if (!trimmed) return;
    const existing = formData.customGuestPolicies || [];
    onChange({...formData, customGuestPolicies: [...existing, trimmed]});
    setNewCustomGuestPolicy("");
  };

  const handleRemoveCustomGuestPolicy = (index) => {
    const existing = formData.customGuestPolicies || [];
    onChange({
      ...formData,
      customGuestPolicies: existing.filter((_, i) => i !== index),
    });
  };

  /* Shared styles */
  const selectStyle = {
    width: "100%",
    padding: "14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "0.95rem",
    background: "#f8fafc",
    color: "#1e293b",
    outline: "none",
    cursor: "pointer",
    appearance: "menulist",
  };

  // eslint-disable-next-line
  const subLabelStyle = {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#64748b",
    marginBottom: "6px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };

  // eslint-disable-next-line
  const subGroupStyle = {
    marginBottom: "18px",
  };

  return (
    <div className="lease-form">
      {/* ── Section 1: PG & Property Details ── */}
      <h3 className="lease-form-section-title">
        <FiHome className="lease-form-section-icon" /> PG &amp; Property Details
      </h3>

      <div className="lease-floating-group">
        <input
          id="pgName"
          type="text"
          name="pgName"
          value={formData.pgName}
          onChange={handleChange}
          placeholder=" "
          className={errors.pgName ? "input-error" : ""}
        />
        <label htmlFor="pgName">
          PG / Property Name <span className="required">*</span>
        </label>
        {errors.pgName && <span className="field-error">{errors.pgName}</span>}
      </div>

      <div className="lease-floating-group">
        <input
          id="ownerName"
          type="text"
          name="ownerName"
          value={formData.ownerName}
          onChange={handleChange}
          placeholder=" "
          className={errors.ownerName ? "input-error" : ""}
        />
        <label htmlFor="ownerName">
          Owner Name <span className="required">*</span>
        </label>
        {errors.ownerName && (
          <span className="field-error">{errors.ownerName}</span>
        )}
      </div>

      <div className="lease-form-row">
        <div className="lease-floating-group">
          <input
            id="ownerPhone"
            type="text"
            name="ownerPhone"
            value={formData.ownerPhone}
            onChange={handleChange}
            placeholder=" "
            className={errors.ownerPhone ? "input-error" : ""}
          />
          <label htmlFor="ownerPhone">
            Owner Phone <span className="required">*</span>
          </label>
          {errors.ownerPhone && (
            <span className="field-error">{errors.ownerPhone}</span>
          )}
        </div>
        <div className="lease-floating-group">
          <input
            id="ownerEmail"
            type="email"
            name="ownerEmail"
            value={formData.ownerEmail}
            onChange={handleChange}
            placeholder=" "
          />
          <label htmlFor="ownerEmail">Owner Email</label>
        </div>
      </div>

      <div className="lease-floating-group">
        <input
          id="propertyAddress"
          type="text"
          name="propertyAddress"
          value={formData.propertyAddress}
          onChange={handleChange}
          placeholder=" "
          className={errors.propertyAddress ? "input-error" : ""}
        />
        <label htmlFor="propertyAddress">
          Property Address <span className="required">*</span>
        </label>
        {errors.propertyAddress && (
          <span className="field-error">{errors.propertyAddress}</span>
        )}
      </div>

      <div className="lease-floating-group">
        <input
          id="roomBedNumber"
          type="text"
          name="roomBedNumber"
          value={formData.roomBedNumber}
          onChange={handleChange}
          placeholder=" "
          className={errors.roomBedNumber ? "input-error" : ""}
        />
        <label htmlFor="roomBedNumber">
          Room / Bed Number <span className="required">*</span>
        </label>
        {errors.roomBedNumber && (
          <span className="field-error">{errors.roomBedNumber}</span>
        )}
      </div>

      {/* ── Section 2: Tenant Details ── */}
      <h3 className="lease-form-section-title lease-section-gap">
        <FiUser className="lease-form-section-icon" /> Tenant Details
      </h3>

      <div className="lease-floating-group">
        <input
          id="tenantName"
          type="text"
          name="tenantName"
          value={formData.tenantName}
          onChange={handleChange}
          placeholder=" "
          className={errors.tenantName ? "input-error" : ""}
        />
        <label htmlFor="tenantName">
          Tenant Name <span className="required">*</span>
        </label>
        {errors.tenantName && (
          <span className="field-error">{errors.tenantName}</span>
        )}
      </div>

      <div className="lease-form-row">
        <div className="lease-floating-group">
          <input
            id="tenantPhone"
            type="text"
            name="tenantPhone"
            value={formData.tenantPhone}
            onChange={handleChange}
            placeholder=" "
            className={errors.tenantPhone ? "input-error" : ""}
          />
          <label htmlFor="tenantPhone">
            Tenant Phone <span className="required">*</span>
          </label>
          {errors.tenantPhone && (
            <span className="field-error">{errors.tenantPhone}</span>
          )}
        </div>
        <div className="lease-floating-group">
          <input
            id="tenantEmail"
            type="email"
            name="tenantEmail"
            value={formData.tenantEmail}
            onChange={handleChange}
            placeholder=" "
          />
          <label htmlFor="tenantEmail">Tenant Email</label>
        </div>
      </div>

      {/* ── Section 3: Financial Terms ── */}
      <h3 className="lease-form-section-title lease-section-gap">
        <BiRupee className="lease-form-section-icon" /> Financial Terms
      </h3>

      <div className="lease-form-row">
        <div className="lease-floating-group">
          <input
            id="monthlyRent"
            type="number"
            name="monthlyRent"
            value={formData.monthlyRent}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            placeholder=" "
            min="0"
            className={errors.monthlyRent ? "input-error" : ""}
          />
          <label htmlFor="monthlyRent">
            Monthly Rent (₹) <span className="required">*</span>
          </label>
          {errors.monthlyRent && (
            <span className="field-error">{errors.monthlyRent}</span>
          )}
        </div>
        <div className="lease-floating-group">
          <input
            id="securityDeposit"
            type="number"
            name="securityDeposit"
            value={formData.securityDeposit}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            placeholder=" "
            min="0"
            className={errors.securityDeposit ? "input-error" : ""}
          />
          <label htmlFor="securityDeposit">
            Security Deposit (₹) <span className="required">*</span>
          </label>
          {errors.securityDeposit && (
            <span className="field-error">{errors.securityDeposit}</span>
          )}
        </div>
      </div>

      {/* ── Section 4: Agreement Period ── */}
      <h3 className="lease-form-section-title lease-section-gap">
        <FiCalendar className="lease-form-section-icon" /> Agreement Period
      </h3>

      <div className="lease-form-row">
        <div className="lease-floating-group">
          <input
            id="startDate"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            placeholder=" "
            className={errors.startDate ? "input-error" : ""}
          />
          <label htmlFor="startDate">
            Start Date <span className="required">*</span>
          </label>
          {errors.startDate && (
            <span className="field-error">{errors.startDate}</span>
          )}
        </div>
        <div className="lease-floating-group">
          <input
            id="endDate"
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            placeholder=" "
            className={errors.endDate ? "input-error" : ""}
          />
          <label htmlFor="endDate">
            End Date <span className="required">*</span>
          </label>
          {errors.endDate && (
            <span className="field-error">{errors.endDate}</span>
          )}
        </div>
      </div>

      {/* ── Section 5: House Rules & Policies ── */}
      <h3 className="lease-form-section-title lease-section-gap">
        <FiAlertCircle className="lease-form-section-icon" /> House Rules &amp;
        Policies
      </h3>

      {/* Curfew Timings */}
      <div className="lease-sub-group">
        <label
          htmlFor="curfewTimings"
          className="lease-sub-label lease-toggle-header"
        >
          <input
            type="checkbox"
            checked={!!formData.showRuleCurfew}
            onChange={(e) =>
              onChange({...formData, showRuleCurfew: e.target.checked})
            }
            className="lease-checkbox"
          />
          <FiClock className="lease-toggle-icon" /> Curfew Timings
        </label>
        {formData.showRuleCurfew && (
          <div className="lease-floating-group no-margin">
            <input
              id="curfewTimings"
              type="time"
              name="curfewTimings"
              value={formData.curfewTimings || ""}
              onChange={handleChange}
              placeholder=" "
            />
            <label htmlFor="curfewTimings">Curfew Time (e.g. 10:30 PM)</label>
          </div>
        )}
      </div>

      {/* Guest Policy */}
      <div className="lease-sub-group">
        <label className="lease-sub-label lease-toggle-header">
          <input
            type="checkbox"
            checked={!!formData.showRuleGuest}
            onChange={(e) =>
              onChange({...formData, showRuleGuest: e.target.checked})
            }
            className="lease-checkbox"
          />
          <FiUsers className="lease-toggle-icon" /> Guest Policy
        </label>
        {formData.showRuleGuest && (
          <>
            <div className="lease-floating-group compact">
              <select
                id="guestPolicySelect"
                value={formData.guestPolicyPreset || ""}
                onChange={(e) =>
                  onChange({
                    ...formData,
                    guestPolicyPreset: e.target.value,
                    guestPolicy: e.target.value,
                  })
                }
                style={selectStyle}
              >
                <option value="">— Select a preset —</option>
                {GUEST_POLICY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            {/* Custom Guest Policies Adder */}
            <div className="form-section-mt">
              <label className="lease-sub-label">+ Add your Guest Policy</label>
              <div className="lease-custom-input-group">
                <input
                  type="text"
                  value={newCustomGuestPolicy}
                  onChange={(e) => setNewCustomGuestPolicy(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddCustomGuestPolicy()
                  }
                  placeholder="e.g. No guests allowed after 10PM"
                  className="lease-custom-input"
                />
                <button
                  type="button"
                  onClick={handleAddCustomGuestPolicy}
                  className="lease-custom-add-btn"
                >
                  + Add
                </button>
              </div>

              {/* Render added custom guest policies */}
              {(formData.customGuestPolicies || []).length > 0 && (
                <div className="lease-custom-list">
                  {(formData.customGuestPolicies || []).map((policy, i) => (
                    <div key={i} className="lease-custom-item">
                      <span className="lease-custom-item-text">{policy}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomGuestPolicy(i)}
                        className="lease-custom-item-remove"
                        title="Remove this policy"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Smoking / Drinking */}
      <div className="lease-sub-group">
        <label className="lease-sub-label lease-toggle-header">
          <input
            type="checkbox"
            checked={!!formData.showRuleSmoking}
            onChange={(e) =>
              onChange({...formData, showRuleSmoking: e.target.checked})
            }
            className="lease-checkbox"
          />
          <FiXCircle className="lease-toggle-icon" /> Smoking / Drinking
        </label>
        {formData.showRuleSmoking && (
          <>
            <div className="lease-floating-group compact">
              <select
                id="smokingSelect"
                value={formData.smokingPreset || ""}
                onChange={(e) =>
                  onChange({
                    ...formData,
                    smokingPreset: e.target.value,
                    smokingDrinkingRules: e.target.value,
                  })
                }
                style={selectStyle}
              >
                <option value="">— Select a preset —</option>
                {SMOKING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            {/* Custom Smoking Rules Adder */}
            <div className="form-section-mt">
              <label className="lease-sub-label">
                + Add your Smoking / Drinking Policy
              </label>
              <div className="lease-custom-input-group">
                <input
                  type="text"
                  value={newCustomSmokingRule}
                  onChange={(e) => setNewCustomSmokingRule(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddCustomSmokingRule()
                  }
                  placeholder="e.g. No alcohol in common areas"
                  className="lease-custom-input"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSmokingRule}
                  className="lease-custom-add-btn"
                >
                  + Add
                </button>
              </div>

              {/* Render added custom smoking rules */}
              {(formData.customSmokingRules || []).length > 0 && (
                <div className="lease-custom-list">
                  {(formData.customSmokingRules || []).map((rule, i) => (
                    <div key={i} className="lease-custom-item">
                      <span className="lease-custom-item-text">{rule}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSmokingRule(i)}
                        className="lease-custom-item-remove"
                        title="Remove this rule"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Notice Period */}
      <div className="lease-sub-group">
        <label
          htmlFor="noticePeriod"
          className="lease-sub-label lease-toggle-header"
        >
          <input
            type="checkbox"
            checked={!!formData.showRuleNotice}
            onChange={(e) =>
              onChange({...formData, showRuleNotice: e.target.checked})
            }
            className="lease-checkbox"
          />
          <FiFileText className="lease-toggle-icon" /> Notice Period
        </label>
        {formData.showRuleNotice && (
          <div className="lease-floating-group no-margin">
            <input
              id="noticePeriod"
              type="number"
              name="noticePeriod"
              value={formData.noticePeriod || ""}
              onChange={handleChange}
              onWheel={(e) => e.target.blur()}
              placeholder=" "
              min="0"
              className={errors.noticePeriod ? "input-error" : ""}
            />
            <label htmlFor="noticePeriod">
              Notice Period (days) <span className="required">*</span>
            </label>
            {errors.noticePeriod && (
              <span className="field-error">{errors.noticePeriod}</span>
            )}
          </div>
        )}
      </div>

      {/* General Rules */}
      <div className="lease-sub-group">
        <label className="lease-sub-label lease-toggle-header">
          <input
            type="checkbox"
            checked={!!formData.showRuleGeneral}
            onChange={(e) =>
              onChange({...formData, showRuleGeneral: e.target.checked})
            }
            className="lease-checkbox"
          />
          <FiCheckSquare className="lease-toggle-icon" /> General Rules
        </label>
        {formData.showRuleGeneral && (
          <>
            <div className="lease-floating-group compact">
              <select
                id="generalRuleSelect"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) handleRuleToggle(val);
                }}
                style={selectStyle}
              >
                <option value="">— Select rules to add —</option>
                {GENERAL_RULES.map((rule) => (
                  <option key={rule} value={rule}>
                    {rule}
                  </option>
                ))}
              </select>
            </div>

            {formData.selectedRules && formData.selectedRules.length > 0 && (
              <div className="lease-selected-rules">
                {formData.selectedRules.map((rule) => (
                  <div key={rule} className="lease-rule-badge">
                    {rule}
                    <button
                      type="button"
                      onClick={() => handleRuleToggle(rule)}
                      className="lease-rule-remove-btn"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Custom General Rules Adder */}
            <div className="form-section-mt-mb">
              <label className="lease-sub-label">
                + Add your General Policy
              </label>
              <div className="lease-custom-input-group">
                <input
                  type="text"
                  value={newGeneralCustomRule}
                  onChange={(e) => setNewGeneralCustomRule(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddGeneralCustomRule()
                  }
                  placeholder="e.g. Turn off lights when leaving…"
                  className="lease-custom-input"
                />
                <button
                  type="button"
                  onClick={handleAddGeneralCustomRule}
                  className="lease-custom-add-btn"
                >
                  + Add
                </button>
              </div>

              {/* Render added general custom rules */}
              {(formData.generalCustomRules || []).length > 0 && (
                <div className="lease-custom-list">
                  {(formData.generalCustomRules || []).map((rule, i) => (
                    <div key={i} className="lease-custom-item">
                      <span className="lease-custom-item-text">{rule}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGeneralCustomRule(i)}
                        className="lease-custom-item-remove"
                        title="Remove this rule"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Section 6: Terms & Conditions ── */}
      <h3 className="lease-form-section-title lease-section-gap">
        <FiList className="lease-form-section-icon" /> Terms &amp; Conditions
      </h3>
      <p className="lease-term-desc">
        Toggle which clauses to include in the agreement.
      </p>

      {/* Term 1: Rent */}
      <div className="lease-term-box">
        <input
          type="checkbox"
          id="showTermRent"
          checked={!!formData.showTermRent}
          onChange={(e) =>
            onChange({...formData, showTermRent: e.target.checked})
          }
          className="lease-term-checkbox"
        />
        <div className="lease-term-content">
          <label htmlFor="showTermRent" className="lease-term-label">
            Monthly Rent Payment
          </label>
          <p className="lease-term-subtext">
            The tenant agrees to pay{" "}
            <strong>₹{formData.monthlyRent || "—"}</strong> on or before the{" "}
            <strong>
              {formData.rentDueDay || "5"}
              {["st", "nd", "rd"][((formData.rentDueDay || 5) - 1) % 10] &&
              ((formData.rentDueDay || 5) < 11 ||
                (formData.rentDueDay || 5) > 13)
                ? ["st", "nd", "rd"][((formData.rentDueDay || 5) - 1) % 10]
                : "th"}
            </strong>{" "}
            of every month.
          </p>
          {formData.showTermRent && (
            <div className="form-section-mt">
              <label className="lease-sub-label lease-sub-label-spaced">
                Rent Due Day (1–28)
              </label>
              <select
                value={formData.rentDueDay || "5"}
                onChange={(e) =>
                  onChange({...formData, rentDueDay: e.target.value})
                }
                className="lease-term-select"
              >
                {Array.from({length: 28}, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                    {d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"} of
                    every month
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Term 2: Security Deposit */}
      <div className="lease-term-box">
        <input
          type="checkbox"
          id="showTermDeposit"
          checked={!!formData.showTermDeposit}
          onChange={(e) =>
            onChange({...formData, showTermDeposit: e.target.checked})
          }
          className="lease-term-checkbox"
        />
        <div className="lease-term-content">
          <label htmlFor="showTermDeposit" className="lease-term-label">
            Security Deposit Refund
          </label>
          <p className="lease-term-subtext">
            A security deposit of{" "}
            <strong>₹{formData.securityDeposit || "—"}</strong> is held,
            refundable on vacating subject to deductions.
          </p>
        </div>
      </div>

      {/* Term 3: Agreement Period */}
      <div className="lease-term-box">
        <input
          type="checkbox"
          id="showTermPeriod"
          checked={!!formData.showTermPeriod}
          onChange={(e) =>
            onChange({...formData, showTermPeriod: e.target.checked})
          }
          className="lease-term-checkbox"
        />
        <div className="lease-term-content">
          <label htmlFor="showTermPeriod" className="lease-term-label">
            Agreement Validity Period
          </label>
          <p className="lease-term-subtext">
            This agreement is valid from{" "}
            <strong>{formData.startDate || "—"}</strong> to{" "}
            <strong>{formData.endDate || "—"}</strong>, unless mutually extended
            or terminated earlier.
          </p>
        </div>
      </div>

      {/* Custom Terms Adder */}
      <div className="form-section-mt-mb">
        <label className="lease-sub-label">➕ Add Custom Term</label>
        <div className="lease-custom-input-group">
          <input
            type="text"
            value={newCustomTerm}
            onChange={(e) => setNewCustomTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustomTerm()}
            placeholder="e.g. Electricity charges to be paid separately…"
            className="lease-custom-input"
          />
          <button
            type="button"
            onClick={handleAddCustomTerm}
            className="lease-custom-add-btn"
          >
            + Add
          </button>
        </div>

        {/* Render added custom terms */}
        {(formData.customTerms || []).length > 0 && (
          <div className="lease-custom-list">
            {(formData.customTerms || []).map((term, i) => (
              <div key={i} className="lease-custom-item">
                <span className="lease-custom-item-text">
                  <strong>{i + 5}.</strong> {term}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomTerm(i)}
                  className="lease-custom-item-remove"
                  title="Remove this term"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaseForm;
