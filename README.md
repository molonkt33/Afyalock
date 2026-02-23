
# 🏥 MedVault

MedVault is a role-based medical records management system designed to securely store, manage, and access patient and clinical data. It provides controlled access for different healthcare staff while maintaining data privacy and accountability.

---

## 📌 Overview

MedVault helps healthcare facilities digitize and organize patient information in a secure and efficient way. The system uses authentication, authorization, and role-based access control to ensure that users only see and perform actions allowed by their role.

---

## 👥 User Roles

The system supports multiple user roles, each with specific permissions:

### 🔑 Admin

* Manage users and roles
* View all system data
* Access administrative dashboards
* Assign or update staff permissions

### 🧑‍⚕️ Medical Staff (Doctors / Nurses)

* View assigned patient records
* Add and update medical events
* Access patient history
* Perform clinical actions based on permissions

### 👤 Staff / Users

* View their profile
* Access allowed modules
* Limited system interaction based on role

---

## ⚙️ How the System Works

1. **Authentication**

   * Users log in using email and password
   * JWT tokens are issued upon successful login
   * Tokens are stored in the browser for session management

2. **Authorization**

   * Routes are protected using `ProtectedRoute`
   * UI components are controlled using `RoleGuard`
   * Unauthorized access is blocked automatically

3. **Frontend**

   * Built with **React + Vite**
   * Component-based architecture
   * Role-aware sidebar navigation
   * Modern UI styled to match medical dashboard mockups

4. **Backend**

   * Node.js + Express
   * RESTful API
   * JWT-based authentication
   * Role validation on protected endpoints

---

## 🧱 Project Structure (Client)

```bash
client/
├── src/
│   ├── assets/        # Images
│   ├── components/    # Reusable components (Sidebar, RoleGuard, ProtectedRoute)
│   ├── pages/         # App pages (Login, Register, Dashboard, User, etc.)
│   ├── styles/        # CSS files
│   ├── App.jsx
│   └── main.jsx
```

---

## 🖥️ Key Features

* 🔐 Secure login & registration
* 🧭 Role-based navigation
* 📊 Dashboard with controlled access
* 👤 User profile management
* 🧾 Patient history & active records
* 🎨 Modern, clean UI inspired by medical dashboards

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+ recommended)
* npm

### Install & Run (Client)

```bash
cd client
npm install
npm run dev
```

The app will be available at:
👉 `http://localhost:5173`

---

## 🔒 Security Notes

* JWT tokens are used for authentication
* Role checks are enforced both in UI and backend
* Sensitive routes and actions are protected

---

## 📸 UI Design

The UI is inspired by modern healthcare dashboards:

* Centered authentication cards
* Clean typography
* Role-based sidebar navigation
* Responsive layout

---

## 🛠️ Future Improvements

* Forgot password & email verification
* Audit logs
* Advanced patient analytics
* Dark/light theme toggle
* File uploads (medical documents)

---

## 📄 License

This project is for educational and personal development purposes.

