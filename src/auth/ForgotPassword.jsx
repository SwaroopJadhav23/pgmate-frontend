import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import HomeLayout from "../layouts/HomeLayouts";
import { Eye, EyeOff } from "lucide-react";
import "./Login.css";
import Swal from "sweetalert2";
const ForgotPassword = () => {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    try {
      await api.post("/auth/otp/send", null, {
        params: { phone, purpose: "forgot" },
      });
      setOtpSent(true);
      Swal.fire({
        icon: "success",
        title: "OTP Sent",
        text: "OTP sent to your phone",
        timer: 2000,
        showConfirmButton: false,
      });
    }catch (err) {
    Swal.fire({
      icon: "error",
      title: "OTP Failed",
      text: err.response?.data?.message || "Failed to send OTP",
    });
  }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
     Swal.fire({
        icon: "error",
        title: "Password Error",
        text: "Passwords do not match",
      });
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        phone,
        otp,
        newPassword,
      });

      Swal.fire({
      icon: "success",
      title: "Password Reset",
      text: "Password reset successful",
    });
      navigate("/login");
    }catch (err) {
  Swal.fire({
    icon: "error",
    title: "Reset Failed",
    text: err.response?.data?.message || "Reset failed",
  });
} finally {
      setLoading(false);
    }
  };

  return (
    <HomeLayout noFooterMargin>
      <div className="login-page">
        <div className="login-box">
          <button
            type="button"
            className="login-back"
            onClick={() => navigate("/login")}
          >
            ← Back to Login
          </button>

          <h2>Forgot Password</h2>
          <p className="login-text">Reset your password securely</p>

          <form onSubmit={resetPassword}>
            <input
              className="login-input"
              placeholder="Phone number"
              maxLength="10"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

{!otpSent && (
  <button
    type="button"
    className="login-ghost-btn"
    onClick={sendOtp}
    disabled={!/^[6-9]\d{9}$/.test(phone)}
  >
    Send OTP
  </button>
)}


            {otpSent && (
              <>
                <input
                  className="login-input"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />

                <div className="password-wrapper">
                  <input
                    className="login-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <span
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>

                <div className="password-wrapper">
                  <input
                    className="login-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <span
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>

                <button className="login-button" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </HomeLayout>
  );
};

export default ForgotPassword;