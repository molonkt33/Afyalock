import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import "../styles/LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState("");

  // 🔐 Validate JWT expiration
  const isTokenValid = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!payload.exp) return false;

      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  };

  // 🔐 Check existing session safely
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token && isTokenValid(token)) {
      navigate("/dashboard");
    } else {
      // Clear invalid session data
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
    }
  }, [navigate]);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Required"),
      password: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = await res.json();

        if (res.ok && data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.role);
          localStorage.setItem("user", JSON.stringify(data.user));

          navigate("/dashboard");
        } else {
          setNotification(
            data.message || "Invalid credentials, please try again!"
          );
        }
      } catch {
        setNotification("Server error, please try again!");
      }
    },
  });

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-form">
          <h2>Welcome to MedVault</h2>

          {notification && (
            <div className="login-notification">{notification}</div>
          )}

          <form onSubmit={formik.handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              {...formik.getFieldProps("email")}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="error">{formik.errors.email}</div>
            )}

            <input
              type="password"
              name="password"
              placeholder="Password"
              {...formik.getFieldProps("password")}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="error">{formik.errors.password}</div>
            )}

            <button type="submit" className="login-button">
              Login
            </button>
          </form>

          <div className="login-links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <br />
            Don’t have an account?{" "}
            <Link to="/register" className="register-link">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
