import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Loader2, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { loginUser, loginWithGoogle } from "../services/authService";
import "../styles/LoginPage.css";

import med1 from "../assets/med1.jpg";
import med2 from "../assets/med2.jpg";
import med3 from "../assets/med3.jpg";
import med4 from "../assets/med4.jpg";
import med5 from "../assets/med5.jpg";
import med6 from "../assets/med6.jpg";
import logo from "../assets/logos/logo.jpg";

/* ================= ROLE-BASED ROUTES ================= */
const getDefaultRouteForRole = (role) => {
  const roleRoutes = {
    admin: "/dashboard",
    doctor: "/dashboard",
    nurse: "/dashboard",
    lab: "/lab",
    radiology: "/radiology",
    reception: "/dashboard",
    emergency: "/emergency",
  };
  return roleRoutes[role] || "/dashboard";
};

/* ================= ROLE DISPLAY NAMES ================= */
const getRoleDisplayName = (role) => {
  const roleNames = {
    admin: "Administrator",
    doctor: "Doctor",
    nurse: "Nurse",
    lab: "Lab Technician",
    radiology: "Radiology Technician",
    reception: "Receptionist",
    emergency: "Emergency Staff",
  };
  return roleNames[role] || "Staff";
};

/* ================= SCROLLING IMAGE GRID ================= */
const ScrollingImageGrid = () => {
  const images = [
    { src: med1, h: "200px" },
    { src: med2, h: "280px" },
    { src: med3, h: "180px" },
    { src: med4, h: "320px" },
    { src: med5, h: "240px" },
    { src: med6, h: "210px" },
  ];

  return (
    <div className="pinterest-grid-container">
      <div className="pinterest-grid-scroll">
        {images.map((img, index) => (
          <div key={index} className="grid-item">
            <img src={img.src} alt="Medical Visual" style={{ height: img.h }} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ================= LOGIN PAGE ================= */
const LoginPage = () => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);

  // Check for stored credentials on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("rememberedEmail");
    const storedPassword = localStorage.getItem("rememberedPassword");
    
    if (storedEmail && storedPassword) {
      formik.setValues({ email: storedEmail, password: storedPassword });
      setRememberMe(true);
    }

    // Check if already logged in
    const token = localStorage.getItem("token");
    if (token) {
      const role = localStorage.getItem("role");
      navigate(getDefaultRouteForRole(role));
    }
  }, [navigate]);

  // Clear lockout after time expires
  useEffect(() => {
    if (lockoutUntil && new Date() > lockoutUntil) {
      setLockoutUntil(null);
      setLoginAttempts(0);
      setNotification({ type: "", message: "" });
    }
  }, [lockoutUntil]);

  // Formik form handling
  const formik = useFormik({
    initialValues: { email: "", password: "" },

    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    }),

    onSubmit: async (values) => {
      // Check for lockout
      if (lockoutUntil && new Date() < lockoutUntil) {
        const remainingMinutes = Math.ceil((lockoutUntil - new Date()) / 1000 / 60);
        setNotification({
          type: "warning",
          message: `Account temporarily locked. Try again in ${remainingMinutes} minute(s).`,
        });
        return;
      }

      setIsLoading(true);
      setNotification({ type: "", message: "" });

      try {
        const data = await loginUser(values.email, values.password);

        if (data.accessToken) {
          // Handle "Remember Me" functionality
          if (rememberMe) {
            localStorage.setItem("rememberedEmail", values.email);
            localStorage.setItem("rememberedPassword", values.password);
          } else {
            localStorage.removeItem("rememberedEmail");
            localStorage.removeItem("rememberedPassword");
          }

          // Store authentication data
          localStorage.setItem("token", data.accessToken);
          localStorage.setItem("role", data.role);

          // Store full user information
          localStorage.setItem(
            "user",
            JSON.stringify({
              _id: data._id,
              fullName: data.fullName,
              email: data.email,
              role: data.role,
              department: data.department || "",
              phone: data.phone || "",
              profilePicture: data.profilePicture || "",
              mustChangePassword: data.mustChangePassword || false,
            })
          );

          // Show success and user info briefly
          setNotification({
            type: "success",
            message: `Welcome back, ${data.fullName}!`,
          });
          setShowUserInfo(true);

          // Redirect based on role or handle password change
          setTimeout(() => {
            if (data.mustChangePassword) {
              navigate("/change-password");
            } else {
              navigate(getDefaultRouteForRole(data.role), { replace: true });
            }
          }, 1000);
        } else {
          handleFailedLogin();
        }
      } catch (error) {
        handleLoginError(error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Handle failed login attempts
  const handleFailedLogin = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= 5) {
      // Lock out for 5 minutes after 5 failed attempts
      const lockUntil = new Date(Date.now() + 5 * 60 * 1000);
      setLockoutUntil(lockUntil);
      setNotification({
        type: "warning",
        message: "Too many failed attempts. Account locked for 5 minutes.",
      });
    } else {
      const attemptsLeft = 5 - newAttempts;
      setNotification({
        type: "error",
        message: `Invalid credentials. ${attemptsLeft} attempt(s) remaining.`,
      });
    }
  };

  // Handle login errors
  const handleLoginError = (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      handleFailedLogin();
    } else if (status === 403) {
      if (data?.locked) {
        const lockUntil = new Date(Date.now() + (data.lockDuration || 5) * 60 * 1000);
        setLockoutUntil(lockUntil);
        setNotification({
          type: "warning",
          message: `Account locked. Try again in ${data.lockDuration || 5} minutes.`,
        });
      } else if (data?.inactive) {
        setNotification({
          type: "error",
          message: "Account is inactive. Please contact administrator.",
        });
      } else if (data?.mustChangePassword) {
        // Store temp token and redirect
        localStorage.setItem("tempToken", data.accessToken);
        navigate("/change-password");
      } else {
        setNotification({
          type: "error",
          message: data?.message || "Invalid credentials",
        });
      }
    } else if (status === 0 || !status) {
      setNotification({
        type: "error",
        message: "Server offline. Please check your connection.",
      });
    } else {
      setNotification({
        type: "error",
        message: data?.message || "An error occurred. Please try again.",
      });
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setNotification({ type: "", message: "" });
    try {
      await loginWithGoogle();
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to initiate Google login. Please try again.",
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Login Form Section */}
        <div className="login-form">
          <div className="brand-header">
            <img src={logo} alt="AfyaLock Logo" className="app-logo" />
            <span className="brand-name">AfyaLock</span>
          </div>

          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to access your dashboard</p>

          {/* Notification Area */}
          {notification.message && (
            <div className={`login-notification ${notification.type}`}>
              {notification.type === "success" && <CheckCircle size={18} />}
              {notification.type === "warning" && <Shield size={18} />}
              {notification.type === "error" && <AlertCircle size={18} />}
              <span>{notification.message}</span>
            </div>
          )}

          {/* User Info Display (after successful login) */}
          {showUserInfo && (
            <div className="user-info-card">
              <div className="user-avatar">
                {JSON.parse(localStorage.getItem("user") || "{}").fullName?.charAt(0) || "U"}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {JSON.parse(localStorage.getItem("user") || "{}").fullName}
                </span>
                <span className="user-role">
                  {getRoleDisplayName(
                    JSON.parse(localStorage.getItem("user") || "{}").role
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={formik.handleSubmit}>
            {/* Email Field */}
            <label>
              <Mail size={16} />
              Email Address
            </label>
            <input
              type="email"
              {...formik.getFieldProps("email")}
              placeholder="Enter your email"
              className={formik.touched.email && formik.errors.email ? "error" : ""}
              disabled={isLoading || (lockoutUntil && new Date() < lockoutUntil)}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="error-message">{formik.errors.email}</div>
            )}

            {/* Password Field */}
            <label>
              <Lock size={16} />
              Password
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                {...formik.getFieldProps("password")}
                placeholder="Enter your password"
                className={formik.touched.password && formik.errors.password ? "error" : ""}
                disabled={isLoading || (lockoutUntil && new Date() < lockoutUntil)}
              />
              <button
                type="button"
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <div className="error-message">{formik.errors.password}</div>
            )}

            {/* Remember Me & Forgot Password Row */}
            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkbox-custom"></span>
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            {/* Password Requirements Hint */}
            <div className="password-hint">
              <span>Password must be at least 6 characters</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`login-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading || (lockoutUntil && new Date() < lockoutUntil)}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Signing in...
                </>
              ) : lockoutUntil && new Date() < lockoutUntil ? (
                "Account Locked"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span>or continue with</span>
          </div>

          {/* Google Login Button */}
          <div className="google-login-container">
            <button
              type="button"
              className="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Security Notice */}
          <div className="security-notice">
            <Shield size={14} />
            <span>Your data is protected with enterprise-grade security</span>
          </div>
        </div>

        {/* Visual Side - Image Grid */}
        <div className="ticket-preview-container">
          <div className="overlay-text">
            <h1>Bring your medical data to life</h1>
            <p>Securely access your health records anytime, anywhere</p>
          </div>
          <ScrollingImageGrid />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

