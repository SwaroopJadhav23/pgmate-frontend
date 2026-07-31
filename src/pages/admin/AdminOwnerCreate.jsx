import { useState } from "react";
import api from "../../api/axios";
import "./AdminOwnerCreate.css";
import Swal from "sweetalert2";
import { FaUser, FaEnvelope, FaPhone, FaCity, FaTicketAlt, FaUserPlus } from "react-icons/fa";
const AdminOwnerCreate = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });

  const [idProof, setIdProof] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // ADDED: phone validation state
  const [phoneError, setPhoneError] = useState("");

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();

    // UPDATED: phone validation (minimum 10 digits)
    if (form.phone.length < 10) {
      setPhoneError("Phone number must be at least 10 digits");
      return;
    }

    if (form.password !== form.confirmPassword) {
     if (form.password !== form.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password Error",
        text: "Passwords do not match",
      });
      return;
    }
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("city", form.city);
      fd.append("password", form.password);

      if (form.referralCode.trim() !== "") {
        fd.append("referralCode", form.referralCode.trim());
      }

      if (idProof) fd.append("idProof", idProof);
      if (photo) fd.append("photo", photo);

      
const role = localStorage.getItem("role");

const endpoint =
  role === "SUB_ADMIN"
    ? "/subadmin/owners"
    : "/admin/owners";

await api.post(endpoint, fd);

      Swal.fire({
        icon: "success",
        title: "Owner Created!",
        text: "The new PG owner account has been created successfully.",
        confirmButtonColor: "#6366f1",
        timer: 3000,
        timerProgressBar: true,
      });

      setForm({
        name: "",
        email: "",
        phone: "",
        city: "",
        password: "",
        confirmPassword: "",
        referralCode: "",
      });

      setPhoneError(""); 
      setIdProof(null);
      setPhoto(null);

    } catch (err) {
     Swal.fire({
      icon: "error",
      title: "Creation Failed",
      text: err.response?.data?.message || "Failed to create owner",
    });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-content px-4 py-3">
      <div className="card admin-form-card">
        <div className="card-body">

          <div className="owner-form-header">
            <div className="owner-form-header-icon"><FaUserPlus /></div>
            <div>
              <h4>Create New Owner</h4>
              <p>Fill in the details to add a PG owner account</p>
            </div>
          </div>

          <form onSubmit={submit}>
            <div className="owner-form-grid">
              <div className="input-icon-wrap">
                <FaUser className="input-icon" />
                <input
                  className="form-control mb-3"
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="input-icon-wrap">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  className="form-control mb-3"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            <div className="owner-form-grid">
              <div>
                {/* PHONE FIELD WITH VALIDATION */}
                <div className="input-icon-wrap">
                  <FaPhone className="input-icon" />
                  <input
                    className="form-control mb-3"
                    name="phone"
                    placeholder="Phone Number"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ""); // numbers only
                      setForm({ ...form, phone: value });

                      // UPDATED: live validation (min 10 digits)
                      if (value.length < 10) {
                        setPhoneError("Phone number must be at least 10 digits");
                      } else {
                        setPhoneError("");
                      }
                    }}
                    required
                  />
                </div>

                {/* ERROR MESSAGE */}
                {phoneError && (
                  <small className="text-danger d-block mb-3">
                    {phoneError}
                  </small>
                )}
              </div>

              {/* CITY FIELD */}
              <div className="input-icon-wrap">
                <FaCity className="input-icon" />
                <input
                  className="form-control mb-3"
                  name="city"
                  placeholder="City"
                  value={form.city}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            <div className="input-icon-wrap">
              <FaTicketAlt className="input-icon" />
              <input
                className="form-control mb-3"
                name="referralCode"
                placeholder="Referral Code (Optional)"
                value={form.referralCode}
                onChange={onChange}
              />
            </div>

            {/* PASSWORD FIELD */}
            <div className="position-relative mb-3">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control pe-5"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={onChange}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#6c757d"
                }}
              >
                <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
              </button>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="position-relative mb-3">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-control pe-5"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={onChange}
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#6c757d"
                }}
              >
                <i className={showConfirmPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
              </button>
            </div>

            <label className="form-label">ID Proof (optional)</label>
            <input
              type="file"
              className="form-control mb-3"
              onChange={(e) => setIdProof(e.target.files[0])}
            />

            <label className="form-label">Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              className="form-control mb-4"
              onChange={(e) => setPhoto(e.target.files[0])}
            />

            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Creating..." : "Create Owner"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminOwnerCreate;