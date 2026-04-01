import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleGoogleCallback } from "../services/authService";

function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get("code");
    
    if (code) {
      handleGoogleCallback(code)
        .then((data) => {
          navigate("/dashboard", { replace: true });
        })
        .catch((err) => {
          console.error("Google callback error:", err);
          setError("Failed to complete Google sign in. Please try again.");
        });
    } else {
      setError("No authorization code received");
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="google-callback-error">
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/login")}>Back to Login</button>
      </div>
    );
  }

  return (
    <div className="google-callback-loading">
      <div className="spinner"></div>
      <p>Completing Google sign in...</p>
    </div>
  );
}

export default GoogleCallback;

