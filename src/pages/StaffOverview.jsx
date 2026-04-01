
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoleGuard from "../components/RoleGuard";
import { getInitials } from "../utils/getInitials";
import "../styles/ActivePatients.css";

function StaffOverview() {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [showMenu, setShowMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [starredStaff, setStarredStaff] = useState([]);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  // Role-based access for Staff Overview (User Management):
  // - Admin: Full access (view, add, edit, remove, change roles)
  // - All other roles: View only
  const canViewStaff = ["admin"].includes(role);
  const canAddStaff = ["admin"].includes(role);
  const canEditStaff = ["admin"].includes(role);
  const canRemoveStaff = ["admin"].includes(role);
  const canChangeRole = ["admin"].includes(role);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    // Fetch staff/users from API
    import("../services/api").then(({ default: api }) => {
      api
        .get("/users")
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setStaff(data);
          } else if (data.data && Array.isArray(data.data)) {
            setStaff(data.data);
          } else {
            console.warn("Unexpected staff data format:", data);
            setStaff([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching staff:", err);
          setStaff([]);
        })
        .finally(() => setLoading(false));
    });
  }, [token, navigate]);

  // Access denied check - only admin can access user management
  if (!canViewStaff) {
    return (
      <div className="d-flex">
        <div className="flex-grow-1 p-5">
          <div className="dashboard-card">
            <div className="access-denied">
              <i className="fa-solid fa-lock"></i>
              <h3>Access Denied</h3>
              <p>You don't have permission to access user management.</p>
              <p className="role-info">Contact your administrator for access.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredStaff = staff.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.role?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeClass = (userRole) => {
    const role = userRole?.toLowerCase();
    if (role === "admin") return "role-admin";
    if (role === "doctor") return "role-doctor";
    if (role === "nurse") return "role-nurse";
    if (role === "lab") return "role-lab";
    if (role === "radiology") return "role-radiology";
    if (role === "reception") return "role-reception";
    if (role === "emergency") return "role-emergency";
    return "role-default";
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="status-badge active">
        <i className="fa-solid fa-circle"></i> Active
      </span>
    ) : (
      <span className="status-badge inactive">
        <i className="fa-solid fa-circle"></i> Inactive
      </span>
    );
  };

  // Handle star/favorite staff
  const handleStarStaff = (memberId) => {
    if (starredStaff.includes(memberId)) {
      setStarredStaff(starredStaff.filter(id => id !== memberId));
    } else {
      setStarredStaff([...starredStaff, memberId]);
    }
    setShowMenu(null);
  };

  // Handle direct to profile
  const handleViewProfile = (member) => {
    localStorage.setItem('tempUser', JSON.stringify(member));
    navigate('/profile');
    setShowMenu(null);
  };

  // Handle edit staff (placeholder - would open edit modal)
  const handleEditStaff = (member) => {
    setSelectedMember(member);
    setShowMenu(null);
    alert("Edit functionality would open edit modal here");
  };

  // Handle change role
  const handleChangeRole = (member) => {
    setSelectedMember(member);
    setNewRole(member.role || "");
    setShowRoleModal(true);
    setShowMenu(null);
  };

  // Handle save role change
  const handleSaveRole = async () => {
    if (!selectedMember || !newRole) return;

    try {
      const { default: api } = await import("../services/api");
      await api.put(`/users/${selectedMember.id || selectedMember._id}`, { role: newRole });
      setStaff(staff.map(m => 
        (m.id || m._id) === (selectedMember.id || selectedMember._id) 
          ? { ...m, role: newRole } 
          : m
      ));
      setShowRoleModal(false);
      alert("Role updated successfully");
    } catch (err) {
      console.error("Error updating role:", err);
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  // Handle remove staff
  const handleRemoveStaff = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) {
      setShowMenu(null);
      return;
    }

    try {
      const { default: api } = await import("../services/api");
      await api.delete(`/users/${memberId}`);
      setStaff(staff.filter(m => (m.id || m._id) !== memberId));
      alert("Staff member removed successfully");
    } catch (err) {
      console.error("Error removing staff:", err);
      alert(err.response?.data?.message || "Failed to remove staff member");
    } finally {
      setShowMenu(null);
    }
  };

  return (
    <div className="d-flex">
      <div className="flex-grow-1 p-5 staff-overview-page">
        <div className="page-header">
          <h2 className="staff-title">Staff Overview</h2>
          <p className="staff-subtitle">Manage hospital staff and their roles</p>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>All Staff Members</h2>
            <button className="primary-btn">
              <i className="fa-solid fa-plus"></i> Add Staff
            </button>
          </div>

          <div className="controls">
            <input
              className="search-bar"
              placeholder="Search staff by name, email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="card-grid">
              {filteredStaff.map((member) => (
                <div key={member._id || member.id} className="patient-card staff-card">
                  <div className="staff-avatar">
                    {member.profilePicture ? (
                      <img 
                        src={member.profilePicture} 
                        alt={member.fullName || 'Staff'} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '50%', 
                          objectFit: 'cover' 
                        }} 
                      />
                    ) : (
                      getInitials(member.fullName)
                    )}
                  </div>

                  <div className="card-content staff-content">
                    <h4>{member.fullName || "Unknown"}</h4>
                    <p className="staff-email">{member.email || "No email"}</p>
                    <div className="staff-meta">
                      <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                        {member.role || "Unknown"}
                      </span>
                      {getStatusBadge(member.isActive !== false)}
                    </div>
                  </div>

                  <div
                    className="card-menu"
                    onClick={() =>
                      setShowMenu(showMenu === (member._id || member.id) ? null : member._id || member.id)
                    }
                  >
                    ⋮
                  </div>

                  {showMenu === (member._id || member.id) && (
                    <div className="dropdown-menu staff-dropdown">
                      <div onClick={() => handleViewProfile(member)}>
                        <i className="fa-solid fa-user"></i> View Profile
                      </div>
                      <div onClick={() => handleEditStaff(member)}>
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </div>
                      <div onClick={() => handleStarStaff(member._id || member.id)}>
                        <i className="fa-solid fa-star"></i> {starredStaff.includes(member._id || member.id) ? "Unstar Staff" : "Star Staff"}
                      </div>
                      {(role === "admin") && (
                        <>
                          <div onClick={() => handleChangeRole(member)}>
                            <i className="fa-solid fa-key"></i> Change Role
                          </div>
                          <div className="danger" onClick={() => handleRemoveStaff(member._id || member.id)}>
                            <i className="fa-solid fa-trash"></i> Remove
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && filteredStaff.length === 0 && (
            <div className="empty-state">
              <i className="fa-solid fa-users-slash"></i>
              <p>No staff members found</p>
            </div>
          )}
        </div>
      </div>

      {/* View Staff Details Modal */}
      {showDetailsModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Staff Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="patient-details">
              <div className="detail-row">
                <strong>Name:</strong>
                <span>{selectedMember.fullName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{selectedMember.email || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Role:</strong>
                <span>{selectedMember.role || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span>{selectedMember.isActive !== false ? "Active" : "Inactive"}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Role</h3>
              <button className="modal-close" onClick={() => setShowRoleModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>Select New Role</label>
              <select
                className="form-control"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="lab">Lab Technician</option>
                <option value="radiology">Radiology</option>
                <option value="reception">Reception</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="primary-btn" onClick={handleSaveRole}>
                Save
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffOverview;

