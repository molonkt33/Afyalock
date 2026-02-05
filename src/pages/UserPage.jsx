
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import RoleGuard from "../components/RoleGuard";
import "../styles/User.css";

function UserPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  if (!user) return <div className="p-5 text-center">Loading...</div>;

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-5">
        <h2 className="mb-4">Staff Profile</h2>
        <div className="card shadow-sm p-4">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <RoleGuard allowedRoles={["admin"]}>
            <button className="btn btn-warning mt-3">Edit Role</button>
          </RoleGuard>
        </div>
      </div>
    </div>
  );
}

export default UserPage;
