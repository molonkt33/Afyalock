// src/services/authService.js
import api from "./api";

export const registerUser = async (fullName, email, password) => {
  const { data } = await api.post("/auth/register", {
    fullName,
    email,
    password,
  });

  // Save auth info - store all user data including activity info
  if (data.accessToken) {
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("role", data.role);
    localStorage.setItem("user", JSON.stringify({
      _id: data._id,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      profilePicture: data.profilePicture || "",
      loginCount: data.loginCount || 0,
      lastLogin: data.lastLogin || null,
      loginHistory: data.loginHistory || [],
      activityLog: data.activityLog || [],
      createdAt: data.createdAt || null,
    }));
  }

  return data;
};

export const loginUser = async (email, password) => {
  const { data } = await api.post("/auth/login", {
    email,
    password,
  });

  // Save auth info - store all user data including activity info
  localStorage.setItem("token", data.accessToken);
  localStorage.setItem("role", data.role);
  localStorage.setItem("user", JSON.stringify({
    _id: data._id,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    department: data.department || "",
    phone: data.phone || "",
    profilePicture: data.profilePicture || "",
    mustChangePassword: data.mustChangePassword || false,
    isActive: data.isActive,
    loginCount: data.loginCount || 0,
    lastLogin: data.lastLogin || null,
    loginHistory: data.loginHistory || [],
    activityLog: data.activityLog || [],
    createdAt: data.createdAt || null,
  }));

  return data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
};

// Google OAuth Login - Redirects to Google OAuth consent screen
export const loginWithGoogle = () => {
  // Use Google OAuth 2.0 redirect-based flow
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;
  
  const scope = 'email profile';
  const responseType = 'code';
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&access_type=offline`;
  
  window.location.href = googleAuthUrl;
};

// Handle Google OAuth callback with authorization code
export const handleGoogleCallback = async (code) => {
  const { data } = await api.post("/auth/google/callback", { code });
  
  if (data.accessToken) {
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("role", data.role);
    localStorage.setItem("user", JSON.stringify({
      _id: data._id,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      profilePicture: data.profilePicture || "",
      loginCount: data.loginCount || 0,
      lastLogin: data.lastLogin || null,
      loginHistory: data.loginHistory || [],
      activityLog: data.activityLog || [],
      createdAt: data.createdAt || null,
    }));
  }
  
  return data;
};
