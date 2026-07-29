import {useState} from "react";
import Swal from "sweetalert2";
import api from "../../../api/axios";
import {digitsOnly, isValidPhone} from "../../../utils/formValidators";
import "./ListPropertyModal.css";

const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{verticalAlign: "middle", marginRight: 5}}
  >
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const ListPropertyModal = ({show, setShow}) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    pgName: "",
  });
  const [loading, setLoading] = useState(false);

  const handleClose = () => setShow(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Name Required",
        text: "Please enter the owner name.",
      });
      return;
    }
    if (!isValidPhone(form.phone)) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid Phone",
        text: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }
    if (!form.pgName.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "PG Name Required",
        text: "Please enter the PG name.",
      });
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone,
      pgName: form.pgName.trim(),
    };

    try {
      setLoading(true);
      await api.post("/public/owner-enquiry", payload);
      await Swal.fire({
        icon: "success",
        title: "Enquiry Submitted!",
        text: "We'll contact you within 24 hours.",
      });
      setForm({name: "", phone: "", pgName: ""});
      setShow(false);
    } catch (err) {
      console.error(err.response?.data || err.message);
      await Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="lpm-overlay"
      onClick={(e) =>
        e.target.classList.contains("lpm-overlay") && handleClose()
      }
    >
      <div className="lpm-card">
        {/* IMAGE PANEL FIRST in DOM → top on mobile, right on desktop via order */}
        <div className="lpm-image-panel">
          <button className="lpm-close" onClick={handleClose}>
            ✕
          </button>
          <img src="/listyourpgImage.jpeg" alt="List your PG" />
        </div>

        {/* FORM PANEL SECOND in DOM → bottom on mobile, left on desktop via order */}
        <div className="lpm-form-panel">
          <div className="lpm-header">
            <div className="lpm-badge">
              <HomeIcon />
              List Your PG
            </div>
            <h2>Partner with PGMate</h2>
            <p>Fill in your details — we'll reach out within 24 hrs</p>
          </div>
          <form onSubmit={submit} className="lpm-form">
            <div className="lpm-field">
              <label>Owner name *</label>
              <input
                placeholder="e.g. Rahul Sharma"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({...form, name: e.target.value.trimStart()})
                }
              />
            </div>
            <div className="lpm-field">
              <label>Phone number *</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="e.g. 9876543210"
                required
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: digitsOnly(e.target.value).slice(0, 10),
                  })
                }
              />
            </div>
            <div className="lpm-field">
              <label>PG Name *</label>
              <input
                placeholder="e.g. Sunshine PG"
                required
                value={form.pgName}
                onChange={(e) =>
                  setForm({...form, pgName: e.target.value.trimStart()})
                }
              />
            </div>
            <button type="submit" className="lpm-submit" disabled={loading}>
              {loading ? "Submitting..." : "Book Demo"}
            </button>
            <button type="button" className="lpm-skip" onClick={handleClose}>
              Maybe later
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ListPropertyModal;