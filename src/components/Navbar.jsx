import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    setIsLoggedIn(!!token);
  }, [token]);

  const handleClick = (route) => {
    setLoading(true);
    setTimeout(() => {
      navigate(route);
      setLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setLoading(true);

    localStorage.clear();

    setTimeout(() => {
      setIsLoggedIn(false);
      navigate("/login");
      setLoading(false);
    }, 800);
  };

  const path = location.pathname;

  return (
    <>
      <nav className="navbar bg-light">
        <div className="container-fluid navbar-ground p-4 mx-md-5 mt-md-3 d-flex justify-content-between align-items-center">

          {/* LEFT SIDE */}
          <div className="d-flex align-items-center">
            <div className="logo me-5" onClick={() => handleClick("/dashboard")}>
              <h1 className="med">MED</h1>
              <h1 className="vault shadow">VAULT</h1>
            </div>

            {isLoggedIn && (
              <div className="page-name d-flex gap-5 mx-5 align-items-center">

                <li
                  onClick={() => handleClick("/dashboard")}
                  className={path === "/dashboard" ? "active" : ""}
                >
                  DASHBOARD
                </li>

                {(role === "doctor" || role === "admin") && (
                  <li
                    onClick={() => handleClick("/active-patients")}
                    className={path === "/active-patients" ? "active" : ""}
                  >
                    ACTIVE PATIENTS
                  </li>
                )}

                {(role === "doctor" || role === "nurse" || role === "admin") && (
                  <li
                    onClick={() => handleClick("/patient-history")}
                    className={path === "/patient-history" ? "active" : ""}
                  >
                    PATIENT HISTORY
                  </li>
                )}

                {role === "admin" && (
                  <li
                    onClick={() => handleClick("/user")}
                    className={path === "/user" ? "active" : ""}
                  >
                    USER MANAGEMENT
                  </li>
                )}

              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="buttons">
            {isLoggedIn ? (
              <div>
                <button
                  className="btn btn-secondary"
                  type="button"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#userSidebar"
                >
                  <i className="fa-regular fa-user"></i>
                </button>

                <div
                  className="offcanvas offcanvas-end"
                  data-bs-scroll="true"
                  tabIndex="-1"
                  id="userSidebar"
                >
                  <div className="offcanvas-header sidebar-header">
                    <h5 className="offcanvas-title">
                      MedVault Hospital System
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="offcanvas"
                    ></button>
                  </div>

                  <div className="offcanvas-body sidebar d-flex flex-column align-items-center">

                    <div className="dash-item p-2 px-5 my-2">
                      Logged in as: <strong>{role}</strong>
                    </div>

                    <div className="line"></div>

                    <div
                      data-bs-dismiss="offcanvas"
                      className="dash-item p-2 px-5 my-2"
                      onClick={() => handleClick("/user")}
                    >
                      My Profile
                    </div>

                    <div className="line"></div>

                    <div
                      data-bs-dismiss="offcanvas"
                      className="dash-item p-2 px-5 my-2 logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </div>

                    <div className="line"></div>

                  </div>
                </div>
              </div>
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

                {location.pathname !== "/register" && (
                  <button
                    onClick={() => handleClick("/register")}
                    className="btn rounded-pill px-3"
                  >
                    Register
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {loading && (
          <div className="spinner-overlay">
            <div className="spinner-grow" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default Navbar;
