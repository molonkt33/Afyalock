import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
/* LogOut import removed */
import { getInitials } from "../utils/getInitials";
import "../styles/ActivePatients.css";

function UserPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("card");
  const [showMenu, setShowMenu] = useState(null);
  const [starredUsers, setStarredUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "doctor",
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  // handleLogout removed - use Navbar logout

  // Role-based access for User Management:
  // - Admin: Full access (view, add, edit, remove)
  // - Others: View only
  const canViewUsers = role === "admin";
  const canAddUser = role === "admin";
  const canEditUser = role === "admin";
  const canRemoveUser = role === "admin";

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (role !== "admin") {
      setLoading(false);
      return;
    }

    setLoading(true);
    import("../services/api").then(({ default: api }) => {
      api
        .get("/users")
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setUsers(data);
          } else if (data.data && Array.isArray(data.data)) {
            setUsers(data.data);
          } else {
            console.warn("API response is not an array:", data);
            setUsers([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching users:", err);
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("user");
            navigate("/login");
          }
          setUsers([]);
        })
        .finally(() => setLoading(false));
    });
  }, [token, navigate, role]);

  // Fetch users after any action
  const fetchUsers = () => {
    import("../services/api").then(({ default: api }) => {
      api
        .get("/users")
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setUsers(data);
          } else if (data.data && Array.isArray(data.data)) {
            setUsers(data.data);
          } else {
            setUsers([]);
          }
        })
        .catch((err) => console.error("Error fetching users:", err));
    });
  };

  // Access denied check
  if (!canViewUsers) {
    return (
      <div className="d-flex">
        <div className="flex-grow-1 p-5">
          <div className="dashboard-card">
            <div className="access-denied">
              <i className="fa-solid fa-lock"></i>
              <h3>Access Denied</h3>
              <p>You don't have permission to view user management.</p>
              <p className="role-info">Contact your administrator for access.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filtered = users.filter((u) =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );



  // Get role badge class
  const getRoleBadgeClass = (userRole) => {
    const roleClasses = {
      admin: "role-admin",
      doctor: "role-doctor",
      nurse: "role-nurse",
      lab: "role-lab",
      radiology: "role-radiology",
      reception: "role-reception",
      emergency: "role-emergency",
    };
    return roleClasses[userRole] || "role-default";
  };

  // Handle Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError("");

    try {
      const { default: api } = await import("../services/api");
      await api.post("/users", formData);
      setShowAddModal(false);
      setFormData({ fullName: "", email: "", password: "", role: "doctor" });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Edit User
  const handleEditUser = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError("");

    try {
      const { default: api } = await import("../services/api");
      await api.put(`/users/${selectedUser._id}`, {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
      });
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ fullName: "", email: "", password: "", role: "doctor" });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      setModalLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setModalLoading(false);
      return;
    }

    try {
      const { default: api } = await import("../services/api");
      await api.put(`/users/${selectedUser._id}/reset-password`, {
        newPassword: passwordData.newPassword,
      });
      setShowPasswordModal(false);
      setSelectedUser(null);
      setPasswordData({ newPassword: "", confirmPassword: "" });
      alert("Password reset successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Deactivate/Activate User
  const handleToggleUserStatus = async (user) => {
    const action = user.isActive ? "deactivate" : "activate";
    const confirmMessage = user.isActive 
      ? `Are you sure you want to deactivate ${user.fullName}?` 
      : `Are you sure you want to activate ${user.fullName}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const { default: api } = await import("../services/api");
      await api.put(`/users/${user._id}/${action}`);
      fetchUsers();
      setShowMenu(null);
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  // Direct to profile
  const handleViewProfile = (user) => {
    localStorage.setItem('tempUser', JSON.stringify(user));
    navigate('/profile');
    setShowMenu(null);
  };

  // Open Password Reset Modal
  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordData({ newPassword: "", confirmPassword: "" });
    setError("");
    setShowPasswordModal(true);
  };

  return (
    <div className="d-flex">
      <div className="flex-grow-1 p-5">
        {/* USER OVERVIEW */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>User Management</h2>

            <div className="controls">
              <input
                className="search-bar"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="view-toggle">
                <button 
                  className={`view-toggle-btn ${view === "card" ? "active" : ""}`}
                  onClick={() => setView("card")}
                >
                  <i className="fa-solid fa-grid-2"></i> Card
                </button>
                <button 
                  className={`view-toggle-btn ${view === "list" ? "active" : ""}`}
                  onClick={() => setView("list")}
                >
                  <i className="fa-solid fa-list"></i> List
                </button>
              </div>

              {canAddUser && (
                <button className="primary-btn" onClick={() => setShowAddModal(true)}>
                  <i className="fa-solid fa-plus"></i> Add Staff
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : view === "list" ? (
            <div className="table-view">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id || user._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="staff-avatar" style={{ width: "32px", height: "32px" }}>
                            {user.profilePicture ? (
                              <img 
                                src={user.profilePicture} 
                                alt={user.fullName || 'User'} 
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  borderRadius: '50%', 
                                  objectFit: 'cover' 
                                }} 
                              />
                            ) : (
                              getInitials(user.fullName)
                            )}
                          </div>
                          <strong>{user.fullName || "Unknown"}</strong>
                        </div>
                      </td>
                      <td>{user.email || "N/A"}</td>
                      <td>
                        <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                          {user.role || "user"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isActive !== false ? "active" : "inactive"}`}>
                          {user.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="action-btn" 
                            title="Menu"
                            onClick={() => setShowMenu(showMenu === (user.id || user._id) ? null : user.id || user._id)}
                          >
                            <i className="fa-solid fa-ellipsis-v"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card-grid">
              {filtered.map((user) => (
                <div key={user.id || user._id} className="patient-card staff-card">
                  <div className="staff-avatar">
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={user.fullName || 'User'} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '50%', 
                          objectFit: 'cover' 
                        }} 
                      />
                    ) : (
                      getInitials(user.fullName)
                    )}
                  </div>

                  <div className="card-content staff-content">
                    <h4>{user.fullName || "Unknown"}</h4>
                    <p className="staff-email">{user.email || "No email"}</p>
                    <p>
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role || "user"}
                      </span>
                    </p>
                    <p>
                      Status: 
                      <span className={`status-badge ${user.isActive !== false ? "active" : "inactive"}`}>
                        {user.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>

                  <div
                    className="card-menu"
                    onClick={() =>
                      setShowMenu(showMenu === (user.id || user._id) ? null : user.id || user._id)
                    }
                  >
                    ⋮
                  </div>

                  {showMenu === (user.id || user._id) && (
                    <div className="dropdown-menu staff-dropdown">
                      <div onClick={() => handleViewProfile(user)}>
                        <i className="fa-solid fa-user"></i> View Profile
                      </div>

                      <div onClick={() => { openPasswordModal(user); setShowMenu(null); }}>
                        <i className="fa-solid fa-key"></i> Reset Password
                      </div>

                      <div onClick={() => {
                        const starredUsersCopy = new Set(starredUsers);
                        const userId = user._id || user.id;
                        if (starredUsersCopy.has(userId)) {
                          starredUsersCopy.delete(userId);
                        } else {
                          starredUsersCopy.add(userId);
                        }
                        setStarredUsers(starredUsersCopy);
                        console.log(`Toggled star for ${user.fullName}`);
                        setShowMenu(null);
                      }}>
                        <i className={`fa-solid fa-star ${starredUsers.has(user._id || user.id) ? 'text-warning' : ''}`}></i> 
                        {starredUsers.has(user._id || user.id) ? ' Unstar' : ' Star'}
                      </div>

                      {canRemoveUser && (
                        <div className="danger" onClick={() => {
                          if (window.confirm(`Permanently delete ${user.fullName}? This cannot be undone.`)) {
                            import("../services/api").then(({ default: api }) => {
                              api.delete(`/users/${user._id}`).then(() => {
                                fetchUsers();
                              }).catch((err) => {
                                alert('Delete failed: ' + (err.response?.data?.message || err.message));
                              });
                            });
                          }
                          setShowMenu(null);
                        }}>
                          <i className="fa-solid fa-user-xmark text-danger"></i> Remove User
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <i className="fa-solid fa-users"></i>
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Staff</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddUser}>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="form-group">
                <label>Full Name</label>
                <input
                  name="fullName"
                  type="text"
                  className="form-control"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  name="password"
                  type="password"
                  className="form-control"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="reception">Reception</option>
                  <option value="lab">Lab</option>
                  <option value="radiology">Radiology</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary-btn" disabled={modalLoading}>
                  {modalLoading ? "Creating..." : "Create User"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditUser}>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="form-group">
                <label>Full Name</label>
                <input
                  name="fullName"
                  type="text"
                  className="form-control"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="reception">Reception</option>
                  <option value="lab">Lab</option>
                  <option value="radiology">Radiology</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary-btn" disabled={modalLoading}>
                  {modalLoading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password - {selectedUser?.fullName}</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <form onSubmit={handleResetPassword}>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="form-group">
                <label>New Password</label>
                <input
                  name="newPassword"
                  type="password"
                  className="form-control"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  className="form-control"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary-btn" disabled={modalLoading}>
                  {modalLoading ? "Resetting..." : "Reset Password"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
.modal-header h3 {
          margin: 0;
          color: #000000;
          font-family: var(--base-font-family-default-latin);
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #64748b;
          line-height: 1;
        }
.modal-close:hover {
          color: #000000;
        }
        .form-group {
          margin-bottom: 15px;
        }
.form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #000000;
        }
        .form-control {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: 0.2s ease;
        }
.form-control:focus {
          outline: none;
          border-color: #000000;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .modal-actions .btn {
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          border: none;
        }
        .modal-actions .btn-secondary {
          background: #e2e8f0;
          color: #475569;
        }
        .modal-actions .btn-secondary:hover {
          background: #cbd5e1;
        }
        .alert {
          padding: 10px 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        .alert-danger {
          background: #fee2e2;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}

export default UserPage;
