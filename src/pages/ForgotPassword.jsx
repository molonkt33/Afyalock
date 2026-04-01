import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, Shield, Check, X } from "lucide-react";
import "../styles/ForgotPassword.css";

import logo from "../assets/logos/logo.jpg";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: verification, 3: new password
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Password strength checker
  const getPasswordStrength = (password) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    Object.values(checks).forEach((check) => {
      if (check) strength++;
    });

    return { strength, checks };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#dc2626", "#f97316", "#eab308", "#64748b", "#05254d"];

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Form validation
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setNotification("Please enter your email address");
      return;
    }
    
    if (!validateEmail(email)) {
      setNotification("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setNotification("");

    // Simulate API call for sending verification code
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setNotification("Verification code sent to your email");
    }, 1500);
  };

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    
    if (!verificationCode) {
      setNotification("Please enter the verification code");
      return;
    }

    if (verificationCode.length < 4) {
      setNotification("Please enter a valid verification code");
      return;
    }

    setLoading(true);
    setNotification("");

    // Simulate API call for verification
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      setNotification("Code verified successfully");
    }, 1000);
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    
    if (!newPassword) {
      setNotification("Please enter a new password");
      return;
    }

    if (newPassword.length < 8) {
      setNotification("Password must be at least 8 characters");
      return;
    }

    if (!confirmPassword) {
      setNotification("Please confirm your password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotification("Passwords do not match");
      return;
    }

    setLoading(true);
    setNotification("");

    // Simulate API call for password reset
    setTimeout(() => {
      setLoading(false);
      alert("Password reset successfully! Please login with your new password.");
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        {/* Header */}
        <div className="brand-header">
          <img src={logo} alt="AfyaLock Logo" className="app-logo" />
          <span className="brand-name">AfyaLock</span>
        </div>

        {/* Back to Login */}
        <Link to="/login" className="back-link">
          <ArrowLeft size={18} />
          Back to Login
        </Link>

        {/* Title */}
        <h2 className="forgot-title">Recover Your Password</h2>
        <p className="forgot-subtitle">
          {step === 1 && "Enter your email address to receive a verification code"}
          {step === 2 && "Enter the verification code sent to your email"}
          {step === 3 && "Create a new password for your account"}
        </p>

        {/* Notification */}
        {notification && (
          <div className={`notification ${notification.includes("success") || notification.includes("successfully") ? "success" : "error"}`}>
            {notification}
          </div>
        )}

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label>
                <Mail size={18} />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="form-input"
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {/* Step 2: Verification Code */}
        {step === 2 && (
          <form onSubmit={handleVerificationSubmit}>
            <div className="form-group">
              <label>
                <Shield size={18} />
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="form-input"
                maxLength={6}
              />
            </div>

            <div className="resend-code">
              Didn't receive the code? 
              <button 
                type="button" 
                onClick={() => {
                  setNotification("Verification code resent to your email");
                }}
                className="resend-btn"
              >
                Resend Code
              </button>
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handlePasswordReset}>
            <div className="form-group">
              <label>
                <Lock size={18} />
                New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="form-input"
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Strength Meter */}
              {newPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                        backgroundColor: strengthColors[passwordStrength.strength - 1] || strengthColors[0]
                      }}
                    ></div>
                  </div>
                  <span className="strength-label" style={{ color: strengthColors[passwordStrength.strength - 1] || strengthColors[0] }}>
                    {passwordStrength.strength > 0 ? strengthLabels[passwordStrength.strength - 1] : "Very Weak"}
                  </span>
                </div>
              )}

              {/* Password Requirements Checklist */}
              {newPassword && (
                <div className="password-requirements">
                  <div className={`requirement ${passwordStrength.checks.length ? "met" : ""}`}>
                    {passwordStrength.checks.length ? <Check size={14} /> : <X size={14} />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`requirement ${passwordStrength.checks.uppercase ? "met" : ""}`}>
                    {passwordStrength.checks.uppercase ? <Check size={14} /> : <X size={14} />}
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`requirement ${passwordStrength.checks.lowercase ? "met" : ""}`}>
                    {passwordStrength.checks.lowercase ? <Check size={14} /> : <X size={14} />}
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`requirement ${passwordStrength.checks.number ? "met" : ""}`}>
                    {passwordStrength.checks.number ? <Check size={14} /> : <X size={14} />}
                    <span>One number</span>
                  </div>
                  <div className={`requirement ${passwordStrength.checks.special ? "met" : ""}`}>
                    {passwordStrength.checks.special ? <Check size={14} /> : <X size={14} />}
                    <span>One special character</span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                <Lock size={18} />
                Confirm Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="form-input"
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Confirm Password Match Indicator */}
              {confirmPassword && (
                <div className={`password-match ${newPassword === confirmPassword ? "matched" : "not-matched"}`}>
                  {newPassword === confirmPassword ? (
                    <>
                      <Check size={14} />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X size={14} />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Security Notice */}
        <div className="security-notice">
          <Shield size={16} />
          <span>For your security, we recommend using a strong, unique password</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

