import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
// Using the same CSS file as Login to ensure the UI is identical
import "../styles/LoginPage.css"; 

const RegisterPage = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { name: "", email: "", password: "" },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      email: Yup.string().email("Invalid email").required("Required"),
      password: Yup.string()
        .min(6, "Min 6 characters")
        .required("Required"),
    }),
    onSubmit: async (values) => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (res.ok) {
          alert("Registration successful!");
          navigate("/login");
        } else {
          const data = await res.json();
          alert(data.message || "Registration failed");
        }
      } catch (error) {
        alert("Server error, please try again!");
      }
    },
  });

  return (
    /* Shared classes from LoginPage.css to ensure perfect centering */
    <div className="login-page"> 
      <div className="login-card">
        <div className="login-form">
          <h2>Create Account</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
            Join MedVault today
          </p>

          <form onSubmit={formik.handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              {...formik.getFieldProps("name")}
            />
            {formik.touched.name && formik.errors.name && (
              <div className="error">{formik.errors.name}</div>
            )}

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
            //   name="password"
              {...formik.getFieldProps("password")}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="error">{formik.errors.password}</div>
            )}

            <button type="submit" className="login-button">
              Register
            </button>
          </form>

          <div className="login-links">
            Already have an account?{" "}
            <Link to="/login" className="register-link">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
