import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { isValidEmail, PHONE_REGEX } from "../utils/formValidators";
import HomeLayout from "../layouts/HomeLayouts";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import "./signup.css";

const PublicSignup = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState("USER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referredByCode, setReferredByCode] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);

  const startCooldown = (seconds = 30) => {
    setOtpCooldown(seconds);
    const iv = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const clearAll = () => {
    setName(""); setEmail(""); setCity(""); setPhone("");
    setPassword(""); setConfirmPassword(""); setOtp("");
    setOtpSent(false); setOtpCooldown(0); setReferredByCode("");
  };

  const switchRole = (newRole) => {
    if (newRole === role) return;
    setRole(newRole);
    clearAll();
  };

  const resetPhone = () => {
    setPhone(""); setOtp(""); setOtpSent(false); setOtpCooldown(0);
  };

  const handlePhoneChange = (val) => {
    const digits = val.replace(/\D/g, "");
    setPhone(digits);
    if (otpSent) { setOtpSent(false); setOtp(""); setOtpCooldown(0); }
  };

  const sendOtp = async () => {
    if (!PHONE_REGEX.test(phone)) {
      toast("Enter a valid 10-digit mobile number.", { icon: "⚠️" });
      return;
    }
    if (otpCooldown > 0) return;

    try {
      const otpPurpose = role === "OWNER" ? "owner-signup" : "user-signup";
      await api.post("/auth/otp/send", null, { params: { phone, purpose: otpPurpose } });
      setOtpSent(true);
      startCooldown(30);
      toast.success(`A 6-digit OTP was sent to +91 ${phone}.`);
    } catch (err) {
      const msg = err.response?.data?.message || "Please try again.";
      const alreadyRegistered = msg.toLowerCase().includes("already registered");
      if (alreadyRegistered) {
        Swal.fire({
          imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
              <circle cx="32" cy="32" r="30" fill="#EEF0FF" stroke="#5B5BD6" stroke-width="2"/>
              <circle cx="32" cy="24" r="10" fill="#5B5BD6"/>
              <path d="M14 52c2-12 12-18 18-18s16 6 18 18" fill="#5B5BD6"/>
            </svg>
          `),
          imageWidth: 64,
          imageHeight: 64,
          title: "Account Already Exists",
          text: msg,
          confirmButtonText: "Go to Login",
          confirmButtonColor: "#5B5BD6",
          showCancelButton: true,
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) navigate("/login");
        });
      } else {
        toast.error(msg);
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    const nameRegex = /^[A-Za-z\s]{1,50}$/;
    if (!name.trim() || !nameRegex.test(name.trim())) {
      toast("Full Name must be up to 50 characters and contain only letters and spaces.", { icon: "⚠️" });
      return;
    }

    if (role === "OWNER") {
      if (!isValidEmail(email)) {
        toast("Please enter a valid email address.", { icon: "⚠️" });
        return;
      }
      if (!city.trim()) {
        toast("Please enter your city.", { icon: "⚠️" });
        return;
      }
    }

    if (!otpSent) {
      toast("Send and enter the OTP before continuing.", { icon: "⚠️" });
      return;
    }
    if (!otp.trim()) {
      toast("Please enter the OTP sent to your phone.", { icon: "⚠️" });
      return;
    }
    if (password !== confirmPassword) {
      toast("Re-enter your password carefully.", { icon: "❌" });
      return;
    }
    if (password.length < 6) {
      toast("Password must be at least 6 characters.", { icon: "⚠️" });
      return;
    }

    setLoading(true);
    try {
      if (role === "OWNER") {
        const fd = new FormData();
        fd.append("name", name.trim());
        fd.append("email", email.trim());
        fd.append("phone", phone);
        fd.append("city", city.trim());
        fd.append("password", password);
        fd.append("otp", otp);
        if (referredByCode) fd.append("referredByCode", referredByCode);
        await api.post("/auth/signup/owner", fd);
      } else {
        await api.post("/auth/signup/user", {
          name: name.trim(), phone, password, otp,
          referredByCode: referredByCode || null,
        });
      }

      toast.success("Your account is ready. Redirecting to login...");
      navigate("/login");

    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <HomeLayout noFooterMargin>
      <div className="signup-page">
        <div className="signup-box">
          <button type="button" className="signup-back" onClick={() => navigate("/login")}>
            Back to Login
          </button>

          <h4>Create Account</h4>

          <div className="role-toggle">
            <button type="button" className={role === "USER" ? "active" : ""} onClick={() => switchRole("USER")}>
              User
            </button>
            <button type="button" className={role === "OWNER" ? "active" : ""} onClick={() => switchRole("OWNER")}>
              PG Owner
            </button>
          </div>

          <form onSubmit={submit}>
            <input className="form-control" placeholder="Full Name" maxLength={50}
              value={name} onChange={(e) => setName(e.target.value.replace(/[^A-Za-z\s]/g, '').trimStart())} required />

            {role === "OWNER" && (
              <>
                <input className="form-control" type="email" placeholder="Email Address"
                  autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value.trim())} required />
                <input className="form-control" placeholder="City"
                  autoComplete="address-level2"
                  value={city} onChange={(e) => setCity(e.target.value.trimStart())} required />
              </>
            )}

            <input className="form-control" placeholder="Referral Code (optional)"
              value={referredByCode}
              onChange={(e) => setReferredByCode(e.target.value.toUpperCase().trim())} />

            {!otpSent ? (
              <>
                <input className="form-control" placeholder="Phone Number"
                  type="tel"
                  inputMode="numeric"
                  value={phone} maxLength={10}
                  onChange={(e) => handlePhoneChange(e.target.value)} required />
                <button type="button" className="btn-otp"
                  onClick={sendOtp}
                  disabled={!PHONE_REGEX.test(phone) || otpCooldown > 0}>
                  {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Send OTP"}
                </button>
              </>
            ) : (
              <div className="phone-verified-row">
                <span className="phone-verified-text"> +91 {phone} verified</span>
                <button type="button" className="phone-change-btn" onClick={resetPhone}>Change</button>
              </div>
            )}

            {otpSent && (
              <div className="otp-section">
                <input className="form-control" placeholder="Enter 6-digit OTP"
                  value={otp} maxLength={6}
                  inputMode="numeric"
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required />

                <div className="password-wrapper">
                  <input className="form-control"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (min. 6 characters)"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>

                <div className="password-wrapper">
                  <input className="form-control"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading || !otpSent}>
              {loading ? "Creating Account..." : "Verify & Continue"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "rgba(255,255,255,0.38)" }}>
            Already have an account?{" "}
            <span style={{ color: "#818cf8", fontWeight: 500, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
              onClick={() => navigate("/login")}>
              Login
            </span>
          </p>
        </div>
      </div>
    </HomeLayout>
  );
};

export default PublicSignup;