import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import "../styles/LoginPage.css"; // Make sure this file exists
import loginPicture from "../assets/login.jpg"; // Your doctor image

const LoginPage = () => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
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
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.role);
          localStorage.setItem("user", JSON.stringify(data.user));
          setNotification("");
          navigate("/dashboard");
        } else {
          setNotification("Invalid credentials, please try again!");
        }
      } catch (error) {
        setNotification("Server error, please try again!");
      }
    },
  });

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Left: form */}
        <div className="login-form">
          <h2>Welcome to MedVault</h2>
          {notification && <div className="login-notification">{notification}</div>}
          <form onSubmit={formik.handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              {...formik.getFieldProps("email")}
            />
            {formik.touched.email && formik.errors.email && (
              <small className="error">{formik.errors.email}</small>
            )}
            <input
              type="password"
              name="password"
              placeholder="Password"
              {...formik.getFieldProps("password")}
            />
            {formik.touched.password && formik.errors.password && (
              <small className="error">{formik.errors.password}</small>
            )}
            <button type="submit" className="login-button">
              Login
            </button>
          </form>
          <div className="login-links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <span> | </span>
            <Link to="/register" className="register-link">
              Register
            </Link>
          </div>
        </div>

        {/* Right: image */}
        <div className="login-image">
          <img src={loginPicture} alt="Doctor" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
