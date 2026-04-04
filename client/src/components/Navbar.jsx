import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, User, LogOut } from "lucide-react";
import "../styles/Navbar.css";

// Helper function to get user from localStorage
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    if (stored && stored !== "undefined") {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Error parsing user:", e);
  }
  return null;
};

// Helper function to get initials
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

function Navbar() {
  const [loading, setLoading] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Read fresh from localStorage each render
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userObj = getStoredUser();
  
  const getRoleDisplayName = (roleValue) => {
    const roleNames = {
      admin: "Administrator",
      doctor: "Doctor",
      nurse: "Nurse",
      lab: "Lab Technician",
      radiology: "Radiology Technician",
      reception: "Receptionist",
      emergency: "Emergency Staff",
    };
    return roleNames[roleValue] || "Staff";
  };

  // Get user data
  const profilePicture = userObj?.profilePicture || "";
  const initials = getInitials(userObj?.fullName);
  const roleDisplay = getRoleDisplayName(role);

  const isLoggedIn = !!token;
  const path = location.pathname;

  /* ================= NAVIGATION ================= */

  const handleClick = (route) => {
    if (path === route) return;

    setLoading(true);
    setShowProfileSidebar(false);
    setTimeout(() => {
      navigate(route);
      setLoading(false);
    }, 400);
  };

  const toggleProfileSidebar = () => {
    setShowProfileSidebar((prev) => !prev);
  };

  const handleScroll = (id) => {
    // Always navigate to dashboard with the hash when clicking About from any page
    if (location.pathname !== "/dashboard") {
      // Navigate to dashboard with hash, let Dashboard.jsx handle the scroll
      navigate(`/dashboard#${id}`);
    } else {
      // Already on dashboard, scroll to the section
      const targetElement = document.getElementById(id);
      if (!targetElement) return;

      const navbarHeight = 80; // Account for fixed navbar
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const handleLogout = () => {
    setLoading(true);
    localStorage.clear();
    setShowProfileSidebar(false);
    setTimeout(() => {
      navigate("/login");
      setLoading(false);
    }, 400);
  };

  // ESCAPE KEY HANDLER removed - no longer needed for dropdown

  return (
    <>
      <nav className="navbar bg-light">
        <div className="container-fluid navbar-ground p-4 mx-md-5 mt-md-3 d-flex justify-content-between align-items-center">

          {/* ================= LEFT SIDE ================= */}
          <div className="d-flex align-items-center">

            {/* LOGO */}
            <div
              className="logo me-5"
              style={{ cursor: "pointer" }}
              onClick={() => handleClick("/dashboard")}
            >
              <h1 className="med">AFYA</h1>
              <h1 className="vault shadow">LOCK</h1>
            </div>

            {/* NAV LINKS (ONLY IF LOGGED IN) */}
            {isLoggedIn && (
              <ul className="page-name d-flex gap-5 mx-5 align-items-center list-unstyled m-0">

                {/* DASHBOARD */}
                <li
                  onClick={() => handleClick("/dashboard")}
                  className={path === "/dashboard" ? "active" : ""}
                  style={{ cursor: "pointer" }}
                >
                  DASHBOARD
                </li>

                {/* RECORDS */}
                <li
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick("/records");
                  }}
                  className={path === "/records" ? "active" : ""}
                  style={{ cursor: "pointer" }}
                >
                  RECORDS
                </li>

                {/* ABOUT */}
                <li
                  onClick={() => handleScroll("about")}
                  className={location.hash === "#about" ? "active" : ""}
                  style={{ cursor: "pointer" }}
                >
                  ABOUT
                </li>

                {/* ADMIN ONLY */}
                {role === "admin" && (
                  <li
                    onClick={() => handleClick("/user")}
                    className={path === "/user" ? "active" : ""}
                    style={{ cursor: "pointer" }}
                  >
                    USER MANAGEMENT
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="buttons">

            {isLoggedIn ? (
              <>
                {/* Chat Button */}
                <button
                  className="chat-nav-btn me-3"
                  type="button"
                  onClick={() => handleClick("/chat")}
                  title="Group Chat"
                >
                  <MessageCircle size={20} />
                </button>

                {/* Profile Avatar - open profile sidebar */}
                <div className="profile-dropdown-container">
                  <button
                    className="navbar-avatar-btn"
                    type="button"
                    title="Profile"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProfileSidebar();
                    }}
                  >
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt="Profile" 
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          borderRadius: "50%", 
                          objectFit: "cover" 
                        }} 
                      />
                    ) : (
                      <span className="avatar-initials">{initials}</span>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {location.pathname !== "/login" && (
                  <button
                    className="btn rounded-pill me-3 px-4"
                    onClick={() => handleClick("/login")}
                  >
                    Login
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* LOADING SPINNER */}
        {loading && (
          <div className="spinner-overlay">
            <div className="spinner-grow" role="status"></div>
          </div>
        )}
      </nav>

      {/* ================= PROFILE SIDEBAR ================= */}
      {isLoggedIn && (
        <div
          className={`profile-sidebar-overlay ${showProfileSidebar ? "active" : ""}`}
          onClick={() => setShowProfileSidebar(false)}
        >
          <div
            className={`profile-sidebar ${showProfileSidebar ? "open" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sidebar-header-custom">
              <div>
                <h3>Profile Menu</h3>
                <p>{roleDisplay || "Staff"}</p>
              </div>
              <button className="close-sidebar-btn" onClick={() => setShowProfileSidebar(false)}>
                ×
              </button>
            </div>

            <div className="sidebar-content-custom">
              <div className="sidebar-user-card">
                <div className="sidebar-user-avatar">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile avatar" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="sidebar-user-info">
                  <h4>{userObj?.fullName || "Your Profile"}</h4>
                  <p>{roleDisplay || "Staff Member"}</p>
                </div>
              </div>

              <div className="sidebar-divider" />

              <button type="button" className="sidebar-link" onClick={() => handleClick('/dashboard')}>
                Dashboard
              </button>
              <button type="button" className="sidebar-link" onClick={() => handleClick('/records')}>
                Medical Records
              </button>
              <button type="button" className="sidebar-link" onClick={() => handleClick('/chat')}>
                Group Chat
              </button>
              <button type="button" className="sidebar-link" onClick={() => handleClick('/profile')}>
                Account Settings
              </button>
              {role === 'admin' && (
                <button type="button" className="sidebar-link" onClick={() => handleClick('/user')}>
                  User Management
                </button>
              )}
              <button type="button" className="sidebar-link" onClick={() => handleClick('/calendar')}>
                Calendar
              </button>
              <button type="button" className="sidebar-link" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
