import React, { useEffect } from "react";
import "./Footer.css";
import footerimage from "../assets/footer.jpg";

function Footer() {

  useEffect(() => {
    const reveal = document.querySelector(".footer-content");
    if (!reveal) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal.classList.add("show-footer");
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(reveal);

    return () => observer.disconnect();
  }, []);

  return (
    <footer className="footer">

      {/* Top Image */}
      <div className="footer-image-wrapper">
          <img
          className="imgfooter"
          src={footerimage}
          alt="AfyaLock Footer"
        />
      </div>

      {/* Content */}
      <div className="footer-content container py-5">

        <div className="row gy-5">

          {/* Brand Section */}
          <div className="col-lg-4">
            <h2 className="footer-brand">AFYALOCK</h2>

            <p className="footer-description">
              Secure hospital record management system for patient data,
              medical history, and staff administration.
            </p>

            <div className="footer-contact">
              <p><i className="fa-solid fa-phone me-2"></i>+254 757 358 409</p>
              <p><i className="fa-solid fa-envelope me-2"></i>support@afyalock.com</p>
            </div>
          </div>

          <div className="col-lg-2"></div>

          {/* System Links */}
          <div className="col-lg-4">
            <h5 className="footer-heading">System Access</h5>

            <ul className="footer-links">
              <li>
                <a href="#">
                  <i className="fa-solid fa-shield-halved me-2"></i>
                  Secure Records
                </a>
              </li>

              <li>
                <a href="#">
                  <i className="fa-solid fa-user-doctor me-2"></i>
                  Medical Staff Portal
                </a>
              </li>

              <li>
                <a href="#">
                  <i className="fa-solid fa-hospital me-2"></i>
                  Hospital Management
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom text-center mt-5">
          <p>© {new Date().getFullYear()} AfyaLock. All Rights Reserved.</p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;