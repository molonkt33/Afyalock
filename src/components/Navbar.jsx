import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, User, Settings, LogOut, X } from "lucide-react";
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
  
  // Get user data
  const profilePicture = userObj?.profilePicture || "";
  const initials = getInitials(userObj?.fullName);
  const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

  const isLoggedIn = !!token;
  const path = location.pathname;

  /* ================= NAVIGATION ================= */

  const handleClick = (route) => {
    if (path === route) return;

    setLoading(true);
    setShowProfileSidebar(false); // Close sidebar on navigation
    setTimeout(() => {
      navigate(route);
      setLoading(false);
    }, 400);
  };

  const toggleProfileSidebar = () => {
    setShowProfileSidebar(!showProfileSidebar);
  };

  const closeProfileSidebar = () => {
    setShowProfileSidebar(false);
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

  /* ================= ESCAPE KEY HANDLER ================= */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeProfileSidebar();
      }
    };

    if (showProfileSidebar) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent body scroll
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showProfileSidebar]);

  /* ================= ROLE DISPLAY ================= */
  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: "Administrator",
      doctor: "Doctor",
      nurse: "Nurse",
      lab: "Lab Technician",
      radiology: "Radiology Technician",
      reception: "Receptionist",
      emergency: "Emergency Staff",
    };
    return roleNames[role] || "Staff";
  };

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

                {/* Profile Avatar - Now toggles sidebar */}
                <button
                  className="navbar-avatar-btn"
                  type="button"
                  onClick={toggleProfileSidebar}
                  title="Profile Menu"
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
        <>
          {/* Overlay */}
          <div 
            className={`sidebar-overlay ${showProfileSidebar ? 'active' : ''}`} 
            onClick={closeProfileSidebar}
          />

          {/* Sidebar */}
          <div className={`profile-sidebar ${showProfileSidebar ? 'open' : ''}`}>
            {/* Header */}
            <div className="sidebar-header-custom">
              <div className="header-content">
                <div className="user-avatar-large">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="user-info">
                  <p className="user-name">{userObj?.fullName || 'User'}</p>
                  <span className="user-role-badge">
                    <span style={{ fontSize: '10px' }}>{roleDisplay}</span>
                  </span>
                </div>
              </div>
              <button className="close-sidebar-btn" onClick={closeProfileSidebar} title="Close">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="sidebar-content-custom">
              {/* User Details */}
              <div className="user-details-section">
                <div className="detail-item">
                  <User size={16} />
                  <span>ID: {userObj?._id?.slice(-6) || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 .9-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6v2l8 5 8-5V6l-8 3z"/>
                  </svg>
                  <span>{userObj?.email || 'email@example.com'}</span>
                </div>
              </div>

              <div className="sidebar-divider" />

              {/* Menu */}
              <div className="sidebar-menu">
                <div className="menu-item" onClick={() => handleClick("/profile")}>
                  <User size={18} />
                  <span>View Profile</span>
                </div>
                <div className="menu-item" onClick={() => { closeProfileSidebar(); /* Settings placeholder */ }}>
                  <Settings size={18} />
                  <span>Settings</span>
                </div>
                <div className="sidebar-divider" />
                <div className="menu-item logout" onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>Logout</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="security-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 1L3 5v6c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V5l-9-4z"/>
                </svg>
                <span>Your sessions are protected</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;
