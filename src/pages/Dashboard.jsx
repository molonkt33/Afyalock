import React, { useState } from "react";
import topImage from "../assets/ticket_design.jpg";
import technologyPhoto from "../assets/dashboard-images/virtuclear.jpg";
import culturePhoto from "../assets/dashboard-images/black-magic.jpg";
import fashionPhoto from "../assets/dashboard-images/Unknown-4.jpg";
import sportsPhoto from "../assets/dashboard-images/valentin-kremer.jpg"; 
import agriculturePhoto from "../assets/dashboard-images/polina-kuzovkova.jpg";
import expoPhoto from "../assets/dashboard-images/Unknown-6.jpg";
import festivalsPhoto from "../assets/dashboard-images/festivals.jpg";
import "bootstrap/dist/css/bootstrap.css";
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

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
      route: "/active-patients",
    },
    {
      image: fashionPhoto,
      name: "EMERGENCY CASES",
      description: "Critical patient handling",
      route: "/active-patients",
    },
    {
      image: expoPhoto,
      name: "LAB REPORTS",
      description: "Laboratory results",
      route: "/patient-history",
    },
    {
      image: festivalsPhoto,
      name: "RADIOLOGY",
      description: "Imaging & scan reports",
      route: "/patient-history",
    },
    {
      image: agriculturePhoto,
      name: "STAFF MANAGEMENT",
      description: "Register & manage hospital staff",
      route: "/register",
      adminOnly: true,
    },
  ];

  const handleClick = (route) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate(route);
    }, 800);
  };

  return (
    <div id="dashboard" className="container-fluid">
      {/* Hero Section */}
      <div className="row text-center my-3">
        <div className="col">
          <img className="top-image img-fluid" src={topImage} alt="Dashboard" />
        </div>
      </div>

      <div className="row d-flex justify-content-center">
        <div className="col-10 col-md-4 hero-text text-center px-5">
          <h1 className="fs-1 pt-3">MEDVAULT DASHBOARD</h1>
          <p className="forget-about">
            Secure hospital system for managing patients, records and staff.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="row categories p-5">
        <div className="container">
          <div className="row py-5 d-flex category-body">
            {sections.map((section, index) => {
              if (section.adminOnly && role !== "admin") return null;

              return (
                <div
                  key={index}
                  onClick={() => handleClick(section.route)}
                  className="col-12 card the-card p-4 shadow"
                >
                  <img
                    className="img-fluid"
                    src={section.image}
                    alt={section.name}
                  />
                  <h3 className="category-name m-0 mt-2">{section.name}</h3>
                  <p className="category-description m-0">
                    {section.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="spinner-overlay">
          <div className="spinner-grow" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;