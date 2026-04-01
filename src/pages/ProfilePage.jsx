import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import RoleGuard from "../components/RoleGuard";
import "../styles/Profile.css";

function ProfilePage() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || "");
  const [uploadingPic, setUploadingPic] = useState(false);
  const [formState, setFormState] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Fetch latest user data including activity info on mount
  useEffect(() => {
    const fetchLatestUserData = async () => {
      if (!user?.accessToken) return;
      
      try {
        const { default: api } = await import("../services/api");
        const response = await api.get("/users/me");
        
        // Update local state with latest data
        const updatedUser = { ...user, ...response.data };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Update profile picture if available
        if (response.data.profilePicture) {
          setProfilePicture(response.data.profilePicture);
        }
      } catch (err) {
        console.error("Failed to fetch latest user data:", err);
      }
    };

    fetchLatestUserData();
  }, []);

  // Get derived stats from user data - using real data
  const loginCount = user?.loginCount || 0;
  const lastLogin = user?.lastLogin ? new Date(user.lastLogin) : null;
  const memberSinceDate = user?.createdAt ? new Date(user.createdAt) : null;
  const loginHistory = user?.loginHistory || [];
  const activityLog = user?.activityLog || [];

  // Calculate uptime based on actual login patterns
  const calculateUptime = () => {
    if (loginCount === 0) return 95; // Default for new users
    
    // Calculate days since first login
    const firstLogin = loginHistory.length > 0 
      ? new Date(loginHistory[loginHistory.length - 1].loginAt) 
      : new Date(memberSinceDate || Date.now());
    
    const now = new Date();
    const daysSinceFirstLogin = Math.max(1, Math.floor((now - firstLogin) / (1000 * 60 * 60 * 24)));
    const activeDays = loginCount;
    
    // Uptime = (active days / total days since first login) * 100
    const uptime = Math.min(99, Math.floor((activeDays / daysSinceFirstLogin) * 100));
    
    return uptime;
  };

  const uptimePercentage = calculateUptime();

  // Format member since date - uses actual createdAt
  const formatMemberSince = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric'
    });
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Format time for activity
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Format date for activity
  const formatActivityDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today, ${formatTime(d)}`;
    } else if (isYesterday) {
      return `Yesterday, ${formatTime(d)}`;
    } else {
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }) + ', ' + formatTime(d);
    }
  };

  // Get activity icon based on action type
  const getActivityIcon = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'fa-sign-in-alt';
      case 'LOGOUT':
        return 'fa-sign-out-alt';
      case 'PROFILE_PICTURE_UPDATE':
        return 'fa-camera';
      case 'PASSWORD_CHANGE':
        return 'fa-key';
      case 'PROFILE_UPDATE':
        return 'fa-user-edit';
      default:
        return 'fa-circle';
    }
  };

  // Get activity title based on action
  const getActivityTitle = (action, description) => {
    switch (action) {
      case 'LOGIN':
        return 'Logged In';
      case 'LOGOUT':
        return 'Logged Out';
      case 'PROFILE_PICTURE_UPDATE':
        return 'Profile Picture Updated';
      case 'PASSWORD_CHANGE':
        return 'Password Changed';
      case 'PROFILE_UPDATE':
        return 'Profile Updated';
      default:
        return description || 'Activity';
    }
  };

  // Combine and sort activities from both loginHistory and activityLog
  const getRecentActivities = () => {
    const activities = [];
    
    // Add login history entries
    loginHistory.forEach((login) => {
      activities.push({
        type: 'LOGIN',
        action: 'LOGIN',
        title: 'Logged In',
        date: login.loginAt,
        icon: 'fa-sign-in-alt'
      });
    });
    
    // Add activity log entries
    activityLog.forEach((activity) => {
      activities.push({
        type: 'ACTIVITY',
        action: activity.action,
        title: getActivityTitle(activity.action, activity.description),
        date: activity.performedAt,
        icon: getActivityIcon(activity.action)
      });
    });
    
    // Sort by date descending and take top 10
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    return activities.slice(0, 10);
  };

  const recentActivities = getRecentActivities();

  // Removed auto-redirect - keep loading if needed

  // Load profile picture on mount
  useEffect(() => {
    if (user?.profilePicture) {
      setProfilePicture(user.profilePicture);
    }
  }, [user]);

  if (!user) return <div className="p-5 text-center">Loading...</div>;

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      const { default: api } = await import("../services/api");
      await api.put(`/users/${user._id}`, {
        fullName: formState.fullName,
        email: formState.email,
      });
      
      // Log profile update activity
      await api.post("/users/activity", {
        action: 'PROFILE_UPDATE',
        description: 'User updated profile information',
      });
      
      const updated = { ...user, ...formState };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      setEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be less than 2MB");
      return;
    }

    setUploadingPic(true);
    setError("");

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        
        // Save to backend (which will also log the activity)
        const { default: api } = await import("../services/api");
        await api.put("/users/profile-picture", {
          profilePicture: base64String,
        });

        // Update local state
        setProfilePicture(base64String);
        
        // Update localStorage
        const updatedUser = { ...user, profilePicture: base64String };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Dispatch event to notify Navbar
        const event = new CustomEvent("profilePictureUpdated", { detail: { profilePicture: base64String } });
        window.dispatchEvent(event);
        
        setSuccess("Profile picture updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
        setUploadingPic(false);
      };
      reader.onerror = () => {
        setError("Failed to read image file");
        setUploadingPic(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload profile picture");
      setUploadingPic(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { default: api } = await import("../services/api");
      await api.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess("Password changed successfully!");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("");

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Format last login for display
  const formatLastLogin = () => {
    if (!lastLogin) return 'N/A';
    return formatActivityDate(lastLogin);
  };

  return (
    <div className="d-flex profile-page">
      <div className="flex-grow-1">
        {/* Hero Section */}
        <div className="profile-hero">
          <div className="profile-hero-content">
            <div className="profile-avatar-container">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt="Profile" 
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar">{initials}</div>
              )}
              <label className="profile-picture-upload-btn" title="Change profile picture">
                {uploadingPic ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-camera"></i>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleProfilePictureChange}
                  style={{ display: "none" }}
                  disabled={uploadingPic}
                />
              </label>
            </div>
            <div className="profile-hero-text">
              <p className="profile-greeting">{getGreeting()}</p>
              <h1 className="profile-name">{user.fullName}</h1>
              <span className="profile-role-pill">
                <i className="fa-solid fa-user-shield"></i>
                {user.role}
              </span>
              <div className="profile-hero-stats">
                <div className="profile-stat">
                  <span className="profile-stat-value">{loginCount}</span>
                  <span className="profile-stat-label">Sessions</span>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-value">{uptimePercentage}%</span>
                  <span className="profile-stat-label">Uptime</span>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-value">{formatMemberSince(memberSinceDate)}</span>
                  <span className="profile-stat-label">Member Since</span>
                </div>
              </div>
            </div>
          </div>
        </div>

{/* Alerts */}
        {success && (
          <div className="profile-alert profile-alert-success">
            <i className="fa-solid fa-check-circle"></i>
            {success}
          </div>
        )}

        {error && (
          <div className="profile-alert profile-alert-error">
            <i className="fa-solid fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {/* Main Grid */}
        <div className="profile-grid">
          {/* Main Content */}
          <div className="profile-main-content">
            {/* Top Row: Personal Info + Activity */}
            <div className="profile-main-top">
{/* Personal Information Card */}
              <div className="premium-card">
                <div className="premium-card-header">
                  <h3 className="premium-card-title">
                    <i className="fa-solid fa-user"></i>
                    Personal Information
                  </h3>
                </div>

                {!editing ? (
                  <>
                    <div className="profile-info-grid">
                      <div className="profile-info-item">
                        <div className="profile-info-left">
                          <div className="profile-info-icon">
                            <i className="fa-solid fa-user"></i>
                          </div>
                          <span className="profile-value">{user.fullName}</span>
                        </div>
                      </div>
                      <div className="profile-info-item">
                        <div className="profile-info-left">
                          <div className="profile-info-icon">
                            <i className="fa-solid fa-envelope"></i>
                          </div>
                          <span className="profile-value">{user.email}</span>
                        </div>
                      </div>
                      <div className="profile-info-item">
                        <div className="profile-info-left">
                          <div className="profile-info-icon">
                            <i className="fa-solid fa-briefcase"></i>
                          </div>
                          <span className="profile-value" style={{ textTransform: 'capitalize' }}>{user.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="profile-actions">
                      <button
                        className="premium-btn premium-btn-primary"
                        onClick={() => setEditing(true)}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                        Edit Profile
                      </button>
                      <button 
                        className="premium-btn premium-btn-secondary"
                        onClick={() => setShowPasswordModal(true)}
                      >
                        <i className="fa-solid fa-lock"></i>
                        Change Password
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="profile-form-group">
                      <label className="profile-form-label">Full Name</label>
                      <input
                        className="profile-input"
                        name="fullName"
                        value={formState.fullName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="profile-form-group">
                      <label className="profile-form-label">Email Address</label>
                      <input
                        className="profile-input"
                        name="email"
                        value={formState.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="profile-form-actions">
                      <button className="premium-btn premium-btn-success" onClick={saveProfile}>
                        <i className="fa-solid fa-check"></i>
                        Save Changes
                      </button>
                      <button
                        className="premium-btn premium-btn-secondary"
                        onClick={() => setEditing(false)}
                      >
                        <i className="fa-solid fa-xmark"></i>
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Activity Card */}
              <div className="premium-card">
                <div className="premium-card-header">
                  <h3 className="premium-card-title">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                    Recent Activity
                  </h3>
                </div>
                <div className="activity-timeline">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div className="activity-item" key={index}>
                        <div className="activity-dot"></div>
                        <div className="activity-content">
                          <p className="activity-title">
                            <i className={`fa-solid ${activity.icon}`} style={{ marginRight: '8px', fontSize: '12px' }}></i>
                            {activity.title}
                          </p>
                          <p className="activity-time">{formatActivityDate(new Date(activity.date))}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="activity-item">
                      <div className="activity-dot"></div>
                      <div className="activity-content">
                        <p className="activity-title">No recent activity</p>
                        <p className="activity-time">Start using the app to see activity</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Access - Below Personal Information */}
            <RoleGuard allowedRoles={["admin"]}>
              <div className="premium-card">
                <div className="premium-card-header">
                  <h3 className="premium-card-title">
                    <i className="fa-solid fa-shield-halved"></i>
                    Admin Access
                  </h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
                  <i className="fa-solid fa-check-circle" style={{ color: '#22c55e', marginRight: '8px' }}></i>
                  You have full administrative access to manage all staff members, view system analytics, and configure hospital settings.
                </p>
                <div className="profile-actions">
                  <button className="premium-btn premium-btn-primary">
                    <i className="fa-solid fa-gear"></i>
                    Admin Dashboard
                  </button>
                </div>
              </div>
            </RoleGuard>

            {/* Sidebar Cards - Now in the same grid */}
            <div className="profile-sidebar">
              {/* Security Card */}
              <div className="premium-card security-card">
                <div className="premium-card-header">
                  <h3 className="premium-card-title">
                    <i className="fa-solid fa-shield-check"></i>
                    Security Status
                  </h3>
                </div>
                <div className="security-item">
                  <span>Account Security</span>
                  <span className="security-status secure">
                    <i className="fa-solid fa-check-circle"></i>
                    Protected
                  </span>
                </div>
                <div className="security-item">
                  <span>Two-Factor Auth</span>
                  <span className="security-status warning">
                    <i className="fa-solid fa-exclamation-circle"></i>
                    Not Enabled
                  </span>
                </div>
                <div className="security-item">
                  <span>Last Password Change</span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Yesterday</span>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="premium-card">
                <div className="premium-card-header">
                  <h3 className="premium-card-title">
                    <i className="fa-solid fa-bolt"></i>
                    Quick Actions
                  </h3>
                </div>
                <div className="profile-info-grid">
                  <div className="profile-info-item" style={{ cursor: 'pointer' }} onClick={() => setShowPasswordModal(true)}>
                    <div className="profile-info-left">
                      <div className="profile-info-icon">
                        <i className="fa-solid fa-key"></i>
                      </div>
                      <span className="profile-value">Change Password</span>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
                  </div>
                  <div className="profile-info-item" style={{ cursor: 'pointer' }}>
                    <div className="profile-info-left">
                      <div className="profile-info-icon">
                        <i className="fa-solid fa-bell"></i>
                      </div>
                      <span className="profile-value">Notifications</span>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
                  </div>
                  <div className="profile-info-item" style={{ cursor: 'pointer' }}>
                    <div className="profile-info-left">
                      <div className="profile-info-icon">
                        <i className="fa-solid fa-circle-question"></i>
                      </div>
                      <span className="profile-value">Help & Support</span>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
                  </div>

                  <div className="profile-info-item" style={{ cursor: 'pointer' }} onClick={handleLogout}>
                    <div className="profile-info-left">
                      <div className="profile-info-icon">
                        <LogOut size={16} />
                      </div>
                      <span className="profile-value">Logout</span>
                    </div>
                    <i className="fa-solid fa-sign-out-alt" style={{ color: '#ef4444', fontSize: '12px' }}></i>
                  </div>
                </div>
              </div>

              {/* Account Info Card */}
              <div className="premium-card">
                <div className="premium-card-header">
                  <h3 className="premium-card-title">
                    <i className="fa-solid fa-circle-info"></i>
                    Account Info
                  </h3>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.8' }}>
                  <p><strong style={{ color: '#05254d' }}>User ID:</strong> {user._id || 'N/A'}</p>
                  <p><strong style={{ color: '#05254d' }}>Account Status:</strong> <span style={{ color: '#22c55e', fontWeight: '600' }}>Active</span></p>
                  <p><strong style={{ color: '#05254d' }}>Last Login:</strong> {formatLastLogin()}</p>
                  <p><strong style={{ color: '#05254d' }}>Total Sessions:</strong> {loginCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <form onSubmit={handleChangePassword} className="modal-body">
              {error && (
                <div className="profile-alert profile-alert-error">
                  <i className="fa-solid fa-exclamation-circle"></i>
                  {error}
                </div>
              )}
              {success && (
                <div className="profile-alert profile-alert-success">
                  <i className="fa-solid fa-check-circle"></i>
                  {success}
                </div>
              )}
              <div className="modal-form-group">
                <label className="modal-form-label">Current Password</label>
                <input
                  type="password"
                  className="modal-input"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="modal-form-group">
                <label className="modal-form-label">New Password</label>
                <input
                  type="password"
                  className="modal-input"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="modal-form-group">
                <label className="modal-form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="modal-input"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="modal-btn modal-btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      Changing...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-key"></i>
                      Change Password
                    </>
                  )}
                </button>
                <button type="button" className="modal-btn modal-btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;

