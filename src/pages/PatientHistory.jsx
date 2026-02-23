import React, { useState, useEffect } from "react";
import "../styles/EventHistory.css";

function PatientHistory() {
  const [history, setHistory] = useState([]);
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/patients/history",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch patient history");
        }

        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();
  }, [token]);

  return (
    <div className="profile-container p-4">
      <h1 className="profile-title">Patient History</h1>
      <hr className="my-4" />

      <div className="row">
        {history.map((patient) => (
          <div key={patient.id} className="col-md-6 mb-4">
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

                <p className="card-text">
                  Discharge Date: {patient.dischargeDate}
                </p>

                {/* Optional: Only Admin can permanently delete records */}
                {role === "admin" && (
                  <button className="btn btn-outline-danger mt-2">
                    <i className="fa-solid fa-trash"></i> Remove Record
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatientHistory;
