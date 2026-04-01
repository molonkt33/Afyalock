import express from "express";
import { registerUser, loginUser, googleSignIn, googleCallback } from "../controllers/authController.js";

const router = express.Router();

// REGISTER
router.post("/register", registerUser);

// GOOGLE SIGN-IN (idToken)
router.post("/google", googleSignIn);

// GOOGLE OAUTH CALLBACK (for redirect flow)
router.post("/google/callback", googleCallback);

// LOGIN
router.post("/login", loginUser);

export default router;
