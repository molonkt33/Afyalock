import React, { useState, useEffect } from "react";
import topImage from "../assets/ticket_design.jpg";
import technologyPhoto from "../assets/dashboard-images/virtuclear.jpg";
import culturePhoto from "../assets/dashboard-images/black-magic.jpg";
import fashionPhoto from "../assets/dashboard-images/Unknown-4.jpg";
import sportsPhoto from "../assets/dashboard-images/valentin-kremer.jpg";
import agriculturePhoto from "../assets/dashboard-images/polina-kuzovkova.jpg";
import expoPhoto from "../assets/dashboard-images/Unknown-6.jpg";
import festivalsPhoto from "../assets/dashboard-images/festivals.jpg";
import prescriptionPhoto from "../assets/dashboard-images/prescription.jpg";

import "bootstrap/dist/css/bootstrap.css";
import "../styles/Dashboard.css";
import { useNavigate, useLocation } from "react-router-dom";

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  /* ================= LOGIN PROTECTION ================= */
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

/* ================= SCROLL HANDLING ================= */
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = location.hash.slice(1); // Remove the # symbol
      if (!hash) return;

      // Delay to ensure the DOM is fully ready
      const timer = setTimeout(() => {
        const section = document.getElementById(hash);
        if (section) {
          const navbarHeight = 80; // Account for fixed navbar
          const elementPosition = section.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 300); // Increased delay for better reliability

      return () => clearTimeout(timer);
    };

    handleHashScroll();
    
    // Also listen for hash changes
    window.addEventListener("hashchange", handleHashScroll);
    return () => window.removeEventListener("hashchange", handleHashScroll);
  }, [location]);

  const sections = [
    {
      image: technologyPhoto,
      name: "ACTIVE PATIENTS",
      description: "Manage admitted patients",
      route: "/active-patients",
    },
    {
      image: culturePhoto,
      name: "PATIENT HISTORY",
      description: "View discharged patient records",
      route: "/patient-history",
    },
    {
      image: sportsPhoto,
      name: "OUTPATIENT RECORDS",
      description: "Clinic visit management",
      route: "/outpatients",
    },
    {
      image: fashionPhoto,
      name: "EMERGENCY CASES",
      description: "Critical patient handling",
      route: "/emergency",
    },
    {
      image: expoPhoto,
      name: "LAB REPORTS",
      description: "Laboratory results & diagnostics",
      route: "/lab",
    },
    {
      image: festivalsPhoto,
      name: "RADIOLOGY",
      description: "Imaging & scan reports",
      route: "/radiology",
    },
    {
      image: prescriptionPhoto,
      name: "PRESCRIPTIONS",
      description: "Medication management & payments",
      route: "/prescriptions",
    },
    {
      image: agriculturePhoto,
      name: "FINANCE",
      description: "Payment management & revenue",
      route: "/finance",
      adminOnly: false,
    },
    {
      image: agriculturePhoto,
      name: "STAFF MANAGEMENT",
      description: "Manage hospital staff & roles",
      route: "/user",
      adminOnly: true,
    },
  ];

  const handleClick = (route) => {
    console.log("Dashboard card clicked, navigating to", route);
    navigate(route);
  };

  return (
    <div id="dashboard">
      {/* ================= HERO IMAGE ================= */}
      <div className="hero-wrapper">
        <img className="top-image" src={topImage} alt="Dashboard" />
      </div>

      {/* ================= HERO CARD ================= */}
      <div className="hero-card-container">
        <div className="hero-text">
          <h1>AFYALOCK DASHBOARD</h1>
          <p className="forget-about">
            Secure hospital system for managing patients, diagnostics,
            appointments and staff operations.
          </p>
        </div>
      </div>

      {/* ================= RECORDS SECTION (HIDDEN UNTIL LOGIN) ================= */}
      {token && (
        <section className="categories-section" id="records">
          <div className="container text-center mb-5">
            <h2 className="section-heading">RECORDS</h2>
            <p className="section-subtitle">
              Access and manage all hospital medical records
            </p>
          </div>

          <div className="categories-container">
            {sections.map((section, index) => {
              if (section.adminOnly && role !== "admin") return null;

              return (
                <div
                  key={index}
                  className="category-card"
                  onClick={() => handleClick(section.route)}
                  style={{ cursor: "pointer" }}
                >
                  <img src={section.image} alt={section.name} />
                  <div className="category-content">
                    <h3>{section.name}</h3>
                    <p>{section.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= ABOUT SECTION ================= */}
      <div className="row about-section py-5" id="about">
        <div className="col-12 text-center mb-4">
          <h2 className="about-heading">ABOUT AFYALOCK</h2>
        </div>

        <div className="col-md-6 p-5 shadow-sm about-card">
          <h5>Our Story</h5>
          <p>
            AfyaLock was created to simplify hospital operations by providing a
            secure and centralized digital system for patient records,
            diagnostics, and staff management.
          </p>

          <h5>Mission</h5>
          <p>
            To enhance healthcare delivery through secure, reliable, and
            efficient digital record management systems.
          </p>

          <h5>Vision</h5>
          <p>
            To become a leading hospital management solution trusted by
            healthcare institutions worldwide.
          </p>
        </div>

        <div className="col-md-6 p-5">
          <div className="review-box p-4 mb-4">
            <p>
              <i className="fa-solid fa-quote-left me-2"></i>
              AfyaLock has transformed how we manage patient data. It is secure,
              fast and incredibly reliable.
            </p>
            <strong>- Dr Caleb Molonket</strong>
          </div>

          <div className="row text-center mt-4">
            <div className="col stat-box shadow">
              <h3>300+</h3>
              <p>Satisfied Users</p>
            </div>
            <div className="col stat-box shadow">
              <h3>50+</h3>
              <p>Medical Staff</p>
            </div>
            <div className="col stat-box shadow">
              <h3>10+</h3>
              <p>Departments</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= LOADING SPINNER ================= */}
      {loading && (
        <div className="spinner-overlay">
          <div className="spinner-grow text-light" role="status"></div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
