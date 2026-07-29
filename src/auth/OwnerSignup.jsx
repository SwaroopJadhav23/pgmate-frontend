import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { digitsOnly, isValidEmail, isValidPhone } from "../utils/formValidators";
import "./signup.css";
import Swal from "sweetalert2";

const OwnerSignup = ({ hideRedirect = false }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [idProof, setIdProof] = useState(null);
  const [photo, setPhoto] = useState(null);

  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Email",
        text: "Please enter a valid email address.",
      });
      return;
    }

    if (!isValidPhone(phone)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Phone",
        text: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    if (password.length < 5) {
      Swal.fire({
        icon: "warning",
        title: "Weak Password",
        text: "Password must be at least 5 characters",
      });
      return;
    }
    if (password.length > 10) {
      Swal.fire({
        icon: "warning",
        title: "Password Limit",
        text: "Password must not exceed 10 characters",
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password Error",
        text: "Passwords do not match",
      });
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("email", email.trim());
      fd.append("password", password);
      fd.append("phone", phone);
      fd.append("city", city.trim());
      if (idProof) fd.append("idProof", idProof);
      if (photo) fd.append("photo", photo);

      await api.post(
        hideRedirect ? "/admin/owners" : "/auth/signup/owner",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      Swal.fire({
        icon: "success",
        title: "Success",
        text: hideRedirect
          ? "Owner created successfully"
          : "Account created. Please wait for admin approval.",
      });

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setCity("");
      setIdProof(null);
      setPhoto(null);

      if (!hideRedirect) navigate("/login");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: err.response?.data?.message || "Signup failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-content px-4 py-3">
      <div className="card admin-form-card">
        <div className="card-body">
          <h5 className="mb-4 fw-semibold">Create New Owner</h5>

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value.trimStart())}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={5}
                  maxLength={10}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={5}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-control"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 10))}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">City</label>
                <input
                  className="form-control"
                  value={city}
                  onChange={(e) => setCity(e.target.value.trimStart())}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">ID Proof</label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="form-control"
                onChange={(e) => setIdProof(e.target.files[0])}
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Passport Size Photo</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={(e) => setPhoto(e.target.files[0])}
              />
            </div>

            <button className="btn btn-primary">
              {loading ? "Creating..." : "Create Owner"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OwnerSignup;
