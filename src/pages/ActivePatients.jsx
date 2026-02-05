import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import RoleGuard from "../components/RoleGuard";
import "../styles/ActiveEvent.css";

function ActivePatients() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    // fetch active patients here
  }, []);

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-5">
        <h2 className="mb-4">Active Patients</h2>
        {patients.length === 0 ? (
          <p>No active patients.</p>
        ) : (
          <div className="row">
            {patients.map((p) => (
              <div key={p.id} className="col-md-6 mb-4">
                <div className="card shadow-sm p-4">
                  <h5>{p.name}</h5>
                  <p>{p.condition}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivePatients;
