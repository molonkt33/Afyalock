import React, { useState, useEffect } from "react";
import "../styles/ActiveEvent.css";

function ActivePatients() {
  const [patients, setPatients] = useState([]);
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/patients/active",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch patients");
        }

        const data = await response.json();
        setPatients(data);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
  }, [token]);

  const handleDischarge = async (patientId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/patients/discharge/${patientId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unauthorized or failed request");
      }

      // Refresh patient list
      setPatients((prev) =>
        prev.filter((patient) => patient.id !== patientId)
      );
    } catch (error) {
      console.error("Error discharging patient:", error);
    }
  };

  return (
    <div className="profile-container p-4">
      <h1 className="profile-title">Active Patients</h1>
      <hr className="my-4" />

      <div className="row">
        {patients.map((patient) => (
          <div key={patient.id} className="col-md-4 mb-4">
            <div className="card naming-containers">
              <div className="card-body">
                <h2 className="card-title">{patient.fullName}</h2>
                <p className="card-text">
                  Diagnosis: {patient.diagnosis}
                </p>
                <p className="card-text">
                  Ward: {patient.ward}
                </p>
                <p className="card-text">
                  Admission Date: {patient.admissionDate}
                </p>

                <div className="d-flex justify-content-between">
                  
                  {/* Doctors and Admin can edit */}
                  {(role === "doctor" || role === "admin") && (
                    <button className="btn btn-outline-primary edit">
                      <i className="fa-solid fa-edit"></i> Edit
                    </button>
                  )}

                  {/* Only Doctor or Admin can discharge */}
                  {(role === "doctor" || role === "admin") && (
                    <button
                      className="btn btn-outline-danger delete-container"
                      onClick={() => handleDischarge(patient.id)}
                    >
                      <i className="fa-solid fa-bed"></i> Discharge
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivePatients;
