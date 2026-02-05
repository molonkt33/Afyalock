import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/Register.css";
import registerPicture from "../assets/register.jpg";

const RegisterPage = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { name: "", email: "", password: "" },
    validationSchema: Yup.object({
      name: Yup.string().required("Name required"),
      email: Yup.string().email("Invalid email").required("Email required"),
      password: Yup.string().min(6, "Min 6 characters").required("Password required"),
    }),
    onSubmit: (values) => {
      alert(`Registering ${values.name}`);
      navigate("/login");
    },
  });

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <div className="register-card shadow-sm row">
          <div className="col-md-6 p-4">
            <h3 className="mb-3">Register Staff</h3>
            <form onSubmit={formik.handleSubmit}>
              <input
                className="form-control mb-2"
                name="name"
                placeholder="Full Name"
                {...formik.getFieldProps("name")}
              />
              {formik.touched.name && formik.errors.name && (
                <small className="text-danger">{formik.errors.name}</small>
              )}

              <input
                className="form-control mt-3 mb-2"
                name="email"
                placeholder="Email"
                {...formik.getFieldProps("email")}
              />
              {formik.touched.email && formik.errors.email && (
                <small className="text-danger">{formik.errors.email}</small>
              )}

              <input
                className="form-control mt-3 mb-2"
                type="password"
                name="password"
                placeholder="Password"
                {...formik.getFieldProps("password")}
              />
              {formik.touched.password && formik.errors.password && (
                <small className="text-danger">{formik.errors.password}</small>
              )}

              <button className="btn btn-success w-100 mt-4" type="submit">
                Register
              </button>
            </form>
          </div>
          <div className="col-md-6">
            <img src={registerPicture} alt="register" className="img-fluid rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
