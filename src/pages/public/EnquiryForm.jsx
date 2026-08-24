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
      const res = await api.post("/enquiry", {
        pgId,
        pgName,
        name: form.name.trim(),
        phone: form.phone,
        email: form.email.trim(),
        adminNote: form.adminNote.trim(),
        sharingType,
        roomTypeName
      });

      const { whatsappAvailable, whatsappNumber } = res.data || {};

      onClose();

      if (whatsappAvailable && whatsappNumber) {
        const number = whatsappNumber.startsWith("91")
          ? whatsappNumber
          : `91${whatsappNumber}`;
        const userMessage = form.adminNote.trim();
        
        // Format sharing type (e.g., "DOUBLE" -> "Double Sharing")
        const formatSharing = (s) => {
          if (!s) return "";
          const str = s.toLowerCase();
          const capitalized = str.charAt(0).toUpperCase() + str.slice(1);
          return capitalized.includes("sharing") ? capitalized : `${capitalized} Sharing`;
        };

        const message =
          `Hello, I’m ${form.name.trim()}.\n\n` +
          `I found your ${pgName} on PGMate and would like to enquire about the following accommodation:\n\n` +
          `Room Type: ${formatSharing(sharingType)}\n\n` +
          (userMessage
            ? `${userMessage}\n\n`
            : "") +
          `Could you please let me know if a bed is currently available, along with the monthly rent and other details?\n\n` +
          `Thank you.\n\n` +
          `Enquiry sent via PGMate(pgmate.in)\n` +
          `App link: https://play.google.com/store/apps/details?id=com.fourise.pgmate`;
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank");
        enquiryToast.fire({
          icon: "success",
          title: "Enquiry saved! WhatsApp has opened — press Send to complete.",
        });
      } else {
        enquiryToast.fire({
          icon: "success",
          title: "Enquiry submitted! We'll get back to you shortly.",
        });
      }
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
          <button 
            onClick={onClose}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "15px",
              padding: "0 24px",
              height: "46px", // matches WA button height
              borderRadius: "12px", // matches WA button radius
              color: "#64748b",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#ef4444";
              e.currentTarget.style.borderColor = "#ef4444";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.color = "#64748b";
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            style={{
              background: "linear-gradient(180deg, #3db856 0%, #30a046 100%)",
              border: "1px solid #288f3b",
              boxShadow: "0 2px 6px rgba(48, 160, 70, 0.3), inset 0 1px 1px rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 16px 4px 6px",
              borderRadius: "12px",
              color: "#fff",
              cursor: "pointer",
              flex: 1,
              transition: "transform 0.1s, box-shadow 0.1s",
              position: "relative",
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                background: "#fff",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#30a046" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                </svg>
              </div>
              
              <div style={{ height: "24px", width: "1px", background: "rgba(255,255,255,0.3)", flexShrink: 0 }}></div>

              <span style={{ fontWeight: 600, fontSize: "16px", textShadow: "0 1px 2px rgba(0,0,0,0.1)", whiteSpace: "nowrap" }}>
                Send via WhatsApp
              </span>
            </div>

            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginLeft: "8px", flexShrink: 0 }}>
              <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnquiryForm;