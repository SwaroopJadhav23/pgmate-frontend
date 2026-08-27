import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import HomeLayout from "../layouts/HomeLayouts";
import "./Login.css";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;
  // console.log("Login location.state:", location.state);
  // console.log("From value:", from);

  const handleIdentifierChange = (val) => {
    // if user is typing a phone number (digits only), cap at 10 digits
    if (/^\d*$/.test(val)) {
      setIdentifier(val.slice(0, 10));
    } else {
      setIdentifier(val);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { identifier, password });
      login(res.data.token, res.data.role);

      if (res.data.role === "USER") {
        try {
          const profileRes = await api.get("/users/me");
          console.log("profileCompleted:", profileRes.data.profileCompleted); // ← ADD
          if (!profileRes.data.profileCompleted) {
            setSuccess(true);
            sessionStorage.setItem("justLoggedIn", "true");
            navigate(from || "/", { replace: true });
            return;
          }
        } catch (err) {
          console.error("Profile check failed", err);
        }
        // ✅ Profile is compaleted → go back to PG page
        setSuccess(true);
        sessionStorage.setItem("justLoggedIn", "true");
        navigate(from || "/", { replace: true });
        return;
      }
      if (res.data.role === "OWNER") {
        setSuccess(true);
        navigate(from || "/owner/dashboard", { replace: true });
      } else if (res.data.role === "PG_MANAGER") {
        setSuccess(true);
        navigate("/manager/dashboard");
      } else if (res.data.role === "SUPER_ADMIN") {
        setSuccess(true);
        navigate("/admin/dashboard");
      } else if (res.data.role === "SUB_ADMIN") {
        setSuccess(true);
        navigate("/subadmin/dashboard");
      } else {
        setSuccess(true);
        console.log("Final redirect to:", from || "/");
        navigate(from || "/", { replace: true });
      }
    } catch (err) {
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HomeLayout noFooterMargin>
      <div className="login-page">
        <div className="login-box">
          <h2>Login</h2>
          <p className="login-text">Access your account securely</p>
          <form onSubmit={submit}>
            <input
              type="text"
              className="login-input"
              placeholder="Email or Phone number"
              value={identifier}
              onChange={(e) => handleIdentifierChange(e.target.value)}
              maxLength={identifier.length > 0 && /^\d*$/.test(identifier) ? 10 : undefined}
              required
            />
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="login-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            <p className="forgot-text">
              <span
                className="forgot-link"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </span>
            </p>
            <button
              className={`login-button ${success ? "success" : ""}`}
              disabled={loading}
            >
              {success ? "Success ✓" : loading ? "Logging in..." : "Login"}
            </button>
            <p className="mt-3 text-center signup-text">
              Don't have an account?{" "}
              <span className="signup-link" onClick={() => navigate("/signup")}>
                Sign Up
              </span>
            </p>
          </form>
        </div>
      </div>
    </HomeLayout>
  );
};

export default Login;