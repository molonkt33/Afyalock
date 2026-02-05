import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import RoleGuard from "../components/RoleGuard";
import "../styles/EventHistory.css";

function PatientHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // fetch history
  }, []);

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-5">
        <h2 className="mb-4">Patient History</h2>
        {history.length === 0 ? (
          <p>No history available.</p>
        ) : (
          <div className="row">
            {history.map((record) => (
              <div key={record.id} className="col-md-6 mb-4">
                <div className="card shadow-sm p-4">
                  <h5>{record.name}</h5>
                  <p>{record.summary}</p>
                  <p>Discharged: {new Date(record.dischargeDate).toLocaleDateString()}</p>
                  <RoleGuard allowedRoles={["admin", "doctor"]}>
                    <button className="btn btn-warning mt-2">Edit Record</button>
                  </RoleGuard>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientHistory;
