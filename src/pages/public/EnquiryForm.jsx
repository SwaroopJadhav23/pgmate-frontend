import { useState, useEffect, useContext } from "react";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { digitsOnly, isValidEmail, isValidPhone } from "../../utils/formValidators";
import "../../CSS/enquiryForm.css";
import Swal from "sweetalert2";

const enquiryToast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  width: "360px",
  background: "#ffffff",
  color: "#1e1b4b",
  iconColor: "#5B5BD6",
  customClass: {
    popup: "enquiry-toast-popup",
    title: "enquiry-toast-title",
    timerProgressBar: "enquiry-toast-progress",
  },
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const EnquiryForm = ({ pgId, pgName, sharingType, roomTypeName, onClose }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    adminNote: ""
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/users/me")
      .then(res => {
        const u = res.data || {};
        setForm(f => ({
          ...f,
          name: u.name || f.name,
          phone: u.phone || f.phone,
          email: u.email || f.email,
        }));
      })
      .catch(() => {}); // silent — user just types manually
  }, [isAuthenticated]);

  const submit = async () => {
    if (!form.name.trim() || !form.phone) {
      enquiryToast.fire({
        icon: "warning",
        title: "Please enter your name and phone number.",
      });
      return;
    }

    if (!isValidPhone(form.phone)) {
      enquiryToast.fire({
        icon: "warning",
        title: "Enter a valid 10-digit mobile number.",
      });
      return;
    }

    if (form.email.trim() && !isValidEmail(form.email)) {
      enquiryToast.fire({
        icon: "warning",
        title: "Enter a valid email address.",
      });
      return;
    }

    try {
      await api.post("/enquiry", {
        pgId,
        pgName,
        name: form.name.trim(),
        phone: form.phone,
        email: form.email.trim(),
        adminNote: form.adminNote.trim(),
        sharingType,
        roomTypeName
      });

      onClose();
      enquiryToast.fire({
        icon: "success",
        title: "Enquiry submitted! We'll get back to you shortly.",
      });
    } catch (err) {
      console.error("Enquiry failed:", err.response?.data || err);
      enquiryToast.fire({
        icon: "error",
        title: "Failed to submit enquiry. Please try again.",
      });
    }
  };

  return (
    <div className="enquiry-overlay">
      <div className="enquiry-modal" style={{ position: "relative" }}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <h3>Confirm Your Details</h3>

        <input
          placeholder="Your Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value.trimStart() })}
        />

        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="Phone Number"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: digitsOnly(e.target.value).slice(0, 10) })}
        />

        <input
          type="email"
          placeholder="Email (optional)"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value.trim() })}
        />

        <textarea
          placeholder="Any message for the owner (optional)"
          rows="3"
          value={form.adminNote}
          onChange={e => setForm({ ...form, adminNote: e.target.value.trimStart() })}
        />

        <p><b>PG:</b> {pgName}</p>
        <p><b>Sharing:</b> {sharingType}</p>
        <p><b>Room:</b> {roomTypeName}</p>

        <div className="actions">
          <button onClick={onClose} className="outline">Cancel</button>
          <button onClick={submit} className="primary">Submit Enquiry</button>
        </div>
      </div>
    </div>
  );
};

export default EnquiryForm;