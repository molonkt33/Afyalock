
// src/components/Footer.jsx
import React from "react";
import "./Footer.css";
import footerimage from "../assets/wetransfer_3-jpg_2024-11-08_0922/Screenshot 2024-11-12 at 10.31.57 PM.png";
import { useLocation } from "react-router-dom";

function Footer() {
  const location = useLocation();

  return (
    <>
      <footer className="footer">
        <img
          className="mb-5 img-fluid imgfooter"
          src={footerimage}
          alt="MedVault Footer"
        />

        <div className="container-fluid">
          <div className="row">
            <div className="col">
              <div className="pb-5 mx-5 container-fluid">
                <div className="row">
                  {/* System Information */}
                  <div className="footer-logo col-md-4 mb-3">
                    <h1 className="mb-3">MEDVAULT</h1>

                    <p
                      style={{ fontSize: "20px" }}
                      className="mb-4 inquiries-paragraph"
                    >
                      Secure hospital record management system for patient
                      data, medical history, and staff administration.
                    </p>

                    <p>
                      <i className="me-3 fa-solid fa-mobile"></i>
                      +254 712 345 678
                    </p>

                    <p>
                      support@medvault.com
                    </p>
                  </div>

                  <div className="col-md-4"></div>

                  {/* System Links / Social */}
                  <div className="col-md-4 mb-3">
                    <h5 style={{ color: "white" }}>System Access</h5>

                    <div className="d-flex flex-column social-icons">
                      <a href="#" className="footer-icon">
                        <i className="mx-2 fa-solid fa-shield-halved"></i>
                        Secure Records
                      </a>

                      <a href="#" className="footer-icon">
                        <i className="mx-2 fa-solid fa-user-doctor"></i>
                        Medical Staff Portal
                      </a>

                      <a href="#" className="footer-icon">
                        <i className="mx-2 fa-solid fa-hospital"></i>
                        Hospital Management
                      </a>
                    </div>
                  </div>
                  {/* End Right Section */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;