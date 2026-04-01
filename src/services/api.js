// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Proxy will forward to backend
  withCredentials: true,
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;