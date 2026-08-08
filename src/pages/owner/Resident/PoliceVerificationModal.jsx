import React, { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "../../../api/axios";
import toast from "react-hot-toast";

const calculateAge = (dobString) => {
  if (!dobString) return "";
  const dob = new Date(dobString);
  if (isNaN(dob)) return "";
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? String(age) : "";
};

const PoliceVerificationModal = ({ resident, apiPrefix, onClose }) => {
  const [pgData, setPgData] = useState(null);

  useEffect(() => {
    if (resident?.pgId || resident?.pgName) {
      const endpoint = apiPrefix === "/manager/residents" ? "/manager/pg/my" : "/owner/pgs";
      api.get(endpoint).then((res) => {
        const found = (res.data || []).find((p) => p.id === resident.pgId || (resident.pgName && p.name === resident.pgName));
        if (found) setPgData(found);
      }).catch(err => console.error("Failed to fetch PG data", err));
    }
  }, [resident, apiPrefix]);
  const [form, setForm] = useState(() => {
    const pgName = resident?.pgName || "PG";
    const pgPrefix = pgName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase() || "PG";
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    return {
      formNumber: `${pgPrefix}-${dateStr}-${randomNum}`,
      tenantName: resident?.name || "",
      birthDate: resident?.dob || "",
      age: calculateAge(resident?.dob),
      phone: resident?.phone || "",
      college: resident?.collegeOrCompanyName || "",
      education: resident?.education || "",
      aadhaar: resident?.aadhaarNumber || "",
      email: resident?.email || "",
      permanentAddress: resident?.permanentAddress || "",
      fathersName: resident?.guardianName || "",
      fathersPhone: resident?.guardianPhone || "",
      guardianName: resident?.localGuardianName || "",
      guardianAddress: resident?.localGuardianAddress || "",
      guardianPhone: resident?.localGuardianPhone || "",
      signature: "",
      tenantSignature: "",
      ownerSignature: "",
    };
  });

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const [errors, setErrors] = useState({});

  const handlePhoneChange = (key) => (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm({ ...form, [key]: digitsOnly });
    setErrors((prev) => ({
      ...prev,
      [key]: digitsOnly.length > 0 && digitsOnly.length < 10 ? "Enter 10 digit number" : "",
    }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, email: value });
    const isValid = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value);
    setErrors((prev) => ({
      ...prev,
      email: value.length > 0 && !isValid ? "Email must end with @gmail.com" : "",
    }));
  };

   const handleBirthDateChange = (e) => {
    const dobValue = e.target.value;
    setForm({ ...form, birthDate: dobValue, age: calculateAge(dobValue) });
  };

  const handleSave = async () => {
    try {
      const fd = new FormData();
      let hasChanges = false;
      const r = resident || {};
      
      const checkAndAppend = (key, val, orig) => {
        if (val !== (orig || "")) {
          fd.append(key, val);
          hasChanges = true;
        }
      };

      checkAndAppend("name", form.tenantName, r.name);
      
      if (form.birthDate && form.birthDate !== r.dob) {
        checkAndAppend("dob", form.birthDate, r.dob);
      }
      
      checkAndAppend("phone", form.phone, r.phone);
      checkAndAppend("collegeOrCompanyName", form.college, r.collegeOrCompanyName);
      checkAndAppend("education", form.education, r.education);
      checkAndAppend("aadhaarNumber", form.aadhaar, r.aadhaarNumber);
      checkAndAppend("email", form.email, r.email);
      checkAndAppend("permanentAddress", form.permanentAddress, r.permanentAddress);
      checkAndAppend("guardianName", form.fathersName, r.guardianName);
      checkAndAppend("guardianPhone", form.fathersPhone, r.guardianPhone);
      checkAndAppend("localGuardianName", form.guardianName, r.localGuardianName);
      checkAndAppend("localGuardianAddress", form.guardianAddress, r.localGuardianAddress);
      checkAndAppend("localGuardianPhone", form.guardianPhone, r.localGuardianPhone);

      if (hasChanges && (r.residentId || r.id)) {
        const endpoint = apiPrefix || "/owner/residents";
        await api.put(`${endpoint}/${r.residentId || r.id}`, fd);
        toast.success("Resident details saved");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save changes.");
    }
  };

const handlePrint = async () => {
    if (errors.phone || errors.email || errors.fathersPhone || errors.guardianPhone) {
      toast.error("Please fix validation errors before printing.");
      return;
    }
    await handleSave();
    const original = document.getElementById("police-verification-printable");
    const clone = original.cloneNode(true);
    clone.classList.add("pdf-export-mode");

    // Replace inputs/textareas with robust block divs to avoid baseline/text-cutoff issues
    clone.querySelectorAll("input, textarea").forEach((el) => {
      const replacement = document.createElement("div");
      replacement.className = el.className;
      
      let textVal = el.value || "";
      if (el.type === "date" && textVal) {
        const [y, m, d] = textVal.split("-");
        if (y && m && d) textVal = `${d}-${m}-${y}`;
      }
      replacement.textContent = textVal;
      
      // Use display block so that the bottom padding strictly bounds the text descenders
      replacement.style.display = "block";
      replacement.style.boxSizing = "border-box";
      const isFilled = el.value && el.value.toString().trim().length > 0;
      replacement.style.borderBottom = isFilled ? "none" : "1px solid #000";
      replacement.style.minHeight = "1.2em";
      replacement.style.height = "auto";
      replacement.style.setProperty("height", "auto", "important");
      replacement.style.lineHeight = el.nodeName.toLowerCase() === "textarea" ? "1.6" : "1.2";
      replacement.style.paddingBottom = el.nodeName.toLowerCase() === "textarea" ? "8px" : "2px";
      replacement.style.whiteSpace = "pre-wrap";
      el.replaceWith(replacement);
    });

    const pageEls = clone.querySelectorAll(".pv-page");
    pageEls.forEach((page) => {
      // Force exact A4 pixel dimensions (96 DPI)
      page.style.boxSizing = "border-box";
      page.style.width = "794px";
      page.style.height = "1123px";
      page.style.display = "flex";
      page.style.flexDirection = "column";
      page.style.overflow = "hidden";
      page.style.position = "relative";
      page.style.backgroundColor = "#ffffff";
    });

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.width = "794px";
    wrapper.style.background = "#ffffff";
    wrapper.style.zIndex = "-1";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 5; // Safe print margin
    const pdfWidth = pageWidth - margin * 2;

    for (let i = 0; i < pageEls.length; i++) {
      const canvas = await html2canvas(pageEls[i], { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, margin, pdfWidth, pdfHeight);
    }

    pdf.save(`Police_Verification_${form.tenantName || "Tenant"}.pdf`);
    document.body.removeChild(wrapper);
  };
  return (
    <div className="agreement-view-popup-overlay" onClick={onClose}>
      <div
        className="agreement-view-popup agreement-view-popup-lg pv-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="pv-popup-close pv-no-print" onClick={onClose}>×</button>

        <div className="pv-printable" id="police-verification-printable">
          {/* ===================== PAGE 1 — Police Verification Form ===================== */}
          <div className="pv-page pv-page-1">
            <div className="pv-header-row">
              <span className="pv-form-no">Form no: {form.formNumber}</span>
              <span className="pv-admission-date">
                Admission Date: {resident?.checkinDate ? new Date(resident.checkinDate).toLocaleDateString("en-GB") : "-"}
              </span>
            </div>

            <div className="pv-header-main">
              <div className="pv-header-info">
                <h4 className="pv-pg-name">{pgData?.name || resident?.pgName || "Name of the PG"}</h4>
                <p className="pv-pg-address">
                  <strong>Address:</strong> {[pgData?.address, pgData?.locality, pgData?.city].filter(Boolean).join(", ") || "-"}
                </p>
                {pgData?.ownerPhone && <p className="pv-pg-phone"><strong>Phone no:</strong> {pgData.ownerPhone}</p>}
              </div>
              
<div className="pv-photo-box">
  {resident?.profilePhotoUrl ? (
    <img
      src={resident.profilePhotoUrl}
      alt="Tenant"
      crossOrigin="anonymous"
      className="pv-photo-img"
    />
  ) : (
    ""
  )}
</div>
            </div>

            <h5 className="pv-form-title">Police Verification Form</h5>

            <div className="pv-field-list">
              <PVField label="1. Name of tenant" value={form.tenantName} onChange={update("tenantName")} />
              <div className="pv-row-2">
                <PVField label="2. Birth Date" type="date" value={form.birthDate} onChange={handleBirthDateChange} />
                <PVField label="Age" value={form.age} onChange={update("age")} short />
              </div>
              <PVField label="3. Tenant phone no" type="tel" value={form.phone} onChange={handlePhoneChange("phone")} error={errors.phone} />
              <PVField label="4. Tenant College / Company Name" value={form.college} onChange={update("college")} twoLines />
              <PVField label="5. Tenant Education" value={form.education} onChange={update("education")} />
              <PVField label="6. Tenant Aadhaar no" value={form.aadhaar} onChange={update("aadhaar")} />
              <PVField label="7. Tenant Email ID" type="email" value={form.email} onChange={handleEmailChange} error={errors.email} />
              <PVField label="8. Permanent Address" value={form.permanentAddress} onChange={update("permanentAddress")} twoLines />
              
              <PVField label="9. Fathers Full Name" value={form.fathersName} onChange={update("fathersName")} />
              <PVField label="10. Fathers Phone No" type="tel" value={form.fathersPhone} onChange={handlePhoneChange("fathersPhone")} error={errors.fathersPhone} />
              <PVField label="11. Local Guardian Name" value={form.guardianName} onChange={update("guardianName")} />
              <PVField label="12. Local Guardian Address" value={form.guardianAddress} onChange={update("guardianAddress")} twoLines />
              <PVField label="13. Local Guardian Phone no" type="tel" value={form.guardianPhone} onChange={handlePhoneChange("guardianPhone")} error={errors.guardianPhone} />
            </div>

            <p className="pv-declaration-title">DECLARATION</p>
            <p className="pv-declaration">
              AS PER THE POLICE GUIDELINES, TENANT AND OWNER VERIFICATION IS MANDATORY. I HEREBY DECLARE THAT THE
              INFORMATION PROVIDED ABOVE IS TRUE AND CORRECT TO THE BEST OF MY KNOWLEDGE AND BELIEF. IF ANY INFORMATION
              IS FOUND TO BE FALSE, INCORRECT, OR MISLEADING, I SHALL BE HELD RESPONSIBLE AND LIABLE FOR APPROPRIATE
              LEGAL ACTION AS PER THE APPLICABLE LAWS AND REGULATIONS.
            </p>
            <p className="pv-signature-line">Signature: ______________________</p>
          </div>

         {/* ===================== PAGE 2 — PG Rules and Regulations ===================== */}
         {pgData?.policeFormType !== "ONLY" && pgData?.rulesPreference !== "NONE" && (
          <div className="pv-page pv-page-2">
            <div className="pv-rules-title-wrap">
              <h4 className="pv-rules-title">PG Rules and Regulations</h4>
            </div>

            <div className="pv-rules-list">
              {pgData?.rulesClauses ? (
                (() => {
                  try {
                    const parsedRules = JSON.parse(pgData.rulesClauses);
                    return parsedRules.filter(r => r.enabled !== false).map((rule, index) => {
                      const text = typeof rule === 'string' ? rule : (rule.text || rule.description || '');
                      return (
                        <div className="pv-rules-item" key={index}>
                          <span className="pv-rules-num">{index + 1}.</span>
                          <span className="pv-rules-text">{text}</span>
                        </div>
                      );
                    });
                  } catch (e) {
                    console.error("Failed to parse rules", e);
                    return <p>Error loading rules.</p>;
                  }
                })()
              ) : (
                <>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">1.</span>
                    <span className="pv-rules-text">Residents must follow all the rules and regulations of PG. Rules can be changed from time to time. A notice of at least <span className="pv-blue-bold">3 days</span> will be given for any changes in the rules. Violating the rules may result in legal action.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">2.</span>
                    <span className="pv-rules-text">Rent should be paid between 1st to 10th of every month. A late fee of ₹10 rupees per day will be charged after the 10th. If rent is not paid by the 20th, the room may be vacated without prior notice.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">3.</span>
                    <span className="pv-rules-text">Breakfast time: 1:00 AM to 1:15 PM. Lunch time: 1:15 PM to 3:00 PM. Dinner time: 7:15 PM to 9:00 PM. Please follow the timings strictly.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">4.</span>
                    <span className="pv-rules-text">Use of electrical appliances such as heater, water heater, iron, induction, mixer, electric kettle, etc. is strictly prohibited. A fine of ₹500 will be charged for first-time violation and ₹1000 for repeated violations. Use of AC / Cooler is allowed, but the temperature must be kept between 16°C to 24°C. A fine of ₹500 will be charged for not following this rule.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">5.</span>
                    <span className="pv-rules-text">Guests are not allowed. If any guest (for 30 minutes) is found inside the PG, the membership will be <span className="pv-blue-bold">cancelled</span> and the <span className="pv-blue-bold">security deposit will be forfeited</span>.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">6.</span>
                    <span className="pv-rules-text"><span className="pv-blue-bold">Commission agents (brokers) are not allowed.</span> If anyone is found involved in brokerage activities, their membership will be <span className="pv-blue-bold">cancelled</span> and 50% of the security deposit will be deducted.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">7.</span>
                    <span className="pv-rules-text">Any type of addiction such as smoking, tobacco, gutkha, alcohol, etc. is strictly prohibited inside the PG. Those found doing so will be fined ₹1000 and membership will be cancelled.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">8.</span>
                    <span className="pv-rules-text">Keep your room, common areas, washrooms, and the entire PG premises clean. Do not throw garbage here and there. If anyone is found doing so, a fine of ₹500 will be charged.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">9.</span>
                    <span className="pv-rules-text">You are responsible for your own belongings. PG is <span className="pv-blue-bold">not responsible</span> for any loss or theft. If any loss occurs, inform the administrator immediately.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">10.</span>
                    <span className="pv-rules-text">Security deposit will be refunded within 7 to 15 working days after checkout and after adjusting any pending dues. If any damage is found, an amount of up to ₹500 may be deducted from the deposit.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">11.</span>
                    <span className="pv-rules-text">Keep locks on your room door. PGs are <span className="pv-blue-bold">not responsible</span> for any loss or theft.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">12.</span>
                    <span className="pv-rules-text">Entry is allowed till 1:30 AM. After that, <span className="pv-blue-bold">coordinator's permission</span> is mandatory. PG has full rights to deny entry.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">13.</span>
                    <span className="pv-rules-text">Please keep your mobile on <span className="pv-blue-bold">silent mode</span> in the PG. Do not make noise while talking on the phone.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">14.</span>
                    <span className="pv-rules-text">Do not spit, litter or throw waste outside the room, in corridors, near staircase, or in the parking area. It is <span className="pv-blue-bold">strictly prohibited</span>.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">15.</span>
                    <span className="pv-rules-text">Keep the water tank, washbasin, taps, fans, lights, and all PG facilities clean and in good condition. For any damage, you may be fined up to ₹500.</span>
                  </div>
                  <div className="pv-rules-item">
                    <span className="pv-rules-num">16.</span>
                    <span className="pv-rules-text">Washing machine is available for use. For coordinator / owner's clothes, washing charge is ₹50 per wash.</span>
                  </div>
                </>
              )}
            </div>

            <p className="pv-rules-notice">
              If a resident violates any of the above rules, we have the full right to take necessary action. This may include a warning, fine, cancellation of membership (membership cancellation), or legal action.
            </p>
            <p className="pv-rules-notice">
              I have read all the above rules and agree to follow them. If I violate any rule, I accept the action taken by the administration.
            </p>
            <p className="pv-rules-thanks">Thank you for your cooperation. We wish you a safe, comfortable, and pleasant stay.</p>

            <div className="pv-rules-sign-row">
              <span className="pv-sign-block">________________________<br />Tenant Signature</span>
              <span className="pv-sign-block">________________________<br />PG Owner Signature</span>
            </div>
          </div>
         )}
        </div>

        <div className="ar-modal-actions pv-no-print">
          <button className="modal-btn cancel ar-btn-text" onClick={onClose}>Close</button>
          <button className="modal-btn cancel ar-btn-text" onClick={handleSave}>Save Details</button>
          <button className="modal-btn primary ar-btn-text" onClick={handlePrint}>Download PDF</button>
        </div>
      </div>
    </div>
  );
};

const PVField = ({ label, value, onChange, type = "text", short = false, error = "", twoLines = false }) => {
  const isFilled = value && value.toString().trim().length > 0;
  
  return (
    <div className={`pv-field-container ${short ? "pv-field-container--short" : ""}`}>
      <div className="pv-field-line">
        <label className="pv-field-label">{label}:</label>
        {twoLines && isFilled ? (
          <textarea 
            className={`pv-field-input pv-field-input--area ${error ? "pv-field-input--error" : ""} pv-field-input--filled`} 
            value={value} 
            onChange={onChange}
            rows={2}
          />
        ) : (
          <input 
            className={`pv-field-input ${error ? "pv-field-input--error" : ""} ${isFilled ? "pv-field-input--filled" : ""}`} 
            type={type} 
            value={value} 
            onChange={onChange} 
          />
        )}
        {error && <span className="pv-field-error">{error}</span>}
      </div>
      {twoLines && !isFilled && <div className="pv-field-line-extra"></div>}
    </div>
  );
};

export default PoliceVerificationModal;