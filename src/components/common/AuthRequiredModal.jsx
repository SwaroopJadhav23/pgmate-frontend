import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import './AuthRequiredModal.css';

const AuthRequiredModal = ({ isOpen, onClose, featureName = "This feature", onLoginSuccess }) => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { identifier, password });
      
      // Update global auth context
      login(res.data.token, res.data.role);
      
      if (["OWNER", "SUPER_ADMIN", "PG_MANAGER"].includes(res.data.role)) {
        onClose();
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError("Only PG Owners or Admins can save and download these tools.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-content">
        <div className="auth-modal-icon">
          <FiLock />
        </div>
        <h3>Login Required</h3>
        <p className="auth-modal-desc">
          Please login as a PG Owner to generate and save your {featureName}.
        </p>

        {error && <div className="auth-modal-error">{error}</div>}

        <form onSubmit={handleLogin} className="auth-modal-form">
          <div className="auth-input-group">
            <input
              type="text"
              className="auth-modal-input"
              placeholder="Email or Phone number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div className="auth-input-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              className="auth-modal-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="auth-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          <div className="auth-modal-actions">
            <button type="button" className="auth-btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="auth-btn-login" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <p className="auth-modal-signup-text">
          Don't have an account?{" "}
          <span className="auth-modal-signup-link" onClick={() => navigate('/signup')}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthRequiredModal;
