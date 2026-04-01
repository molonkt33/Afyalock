import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";

// ================= TOKEN GENERATORS =================

const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "15m", // short-lived access token
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d", // long-lived refresh token
  });
};

// ================= REGISTER USER =================
export const registerUser = asyncHandler(async (req, res) => {
  console.log("registerUser handler invoked", { body: req.body });

  const { fullName, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture || "",
    loginCount: user.loginCount || 0,
    lastLogin: user.lastLogin,
    loginHistory: user.loginHistory || [],
    activityLog: user.activityLog || [],
    createdAt: user.createdAt,
    accessToken,
    refreshToken,
  });
});

// ================= LOGIN USER =================
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log("loginUser called with", { email });

  try {
    const user = await User.findOne({ email }).select("+password +refreshToken +loginAttempts +lockUntil");
    console.log("user lookup result", Boolean(user));

    // Check if user exists
    if (!user) {
      console.log("user not found for", email);
      res.status(401);
      throw new Error("Invalid credentials");
    }

    // Check if account is active
    if (!user.isActive) {
      console.log("inactive account for", email);
      res.status(403);
      throw new Error("Account is inactive. Please contact administrator.");
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / 1000 / 60);
      console.log("locked account for", email, "remaining minutes:", remainingMinutes);
      res.status(403).json({
        locked: true,
        lockDuration: remainingMinutes,
        message: `Account locked. Try again in ${remainingMinutes} minutes.`,
      });
      return;
    }

if (user && (await user.matchPassword(password))) {
      // Reset login attempts on successful login
      user.loginAttempts = 0;
      user.lockUntil = undefined;

      // Track login activity
      const now = new Date();
      user.lastLogin = now;
      user.loginCount = (user.loginCount || 0) + 1;
      
      // Add to login history (keep last 20)
      user.loginHistory = user.loginHistory || [];
      user.loginHistory.unshift({
        loginAt: now,
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
      });
      
      // Keep only last 20 login records
      if (user.loginHistory.length > 20) {
        user.loginHistory = user.loginHistory.slice(0, 20);
      }

      // Add to activity log (keep last 50)
      user.activityLog = user.activityLog || [];
      user.activityLog.unshift({
        action: 'LOGIN',
        description: 'User logged in successfully',
        performedAt: now,
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
      });
      
      // Keep only last 50 activity records
      if (user.activityLog.length > 50) {
        user.activityLog = user.activityLog.slice(0, 50);
      }

      // Generate new tokens
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token to DB (rotate on every login)
      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department || "",
        phone: user.phone || "",
        profilePicture: user.profilePicture || "",
        mustChangePassword: user.mustChangePassword || false,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        loginHistory: user.loginHistory,
        activityLog: user.activityLog,
        createdAt: user.createdAt,
        accessToken,
        refreshToken,
      });
    } else {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await user.save();
        console.log("account locked for", email, "due to failed attempts");
        res.status(403).json({
          locked: true,
          lockDuration: 5,
          message: "Too many failed attempts. Account locked for 5 minutes.",
        });
        return;
      }
      
      await user.save();
      console.log("failed login for", email, "attempts:", user.loginAttempts);
      res.status(401);
      throw new Error("Invalid credentials");
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
});

// ================= GOOGLE OAUTH CALLBACK (Authorization Code Flow) =================
export const googleCallback = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    res.status(400);
    throw new Error("No authorization code provided");
  }

  // Exchange authorization code for tokens
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenResponse.json();

  if (!tokens.access_token) {
    res.status(400);
    throw new Error("Failed to exchange authorization code");
  }

  // Get user info from Google
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  const payload = await userInfoResponse.json();
  const email = payload.email;
  const fullName = payload.name || payload.email.split("@")[0];

  // Find existing user or create one
  let user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user) {
    // create a random password for users created via Google
    const randomPassword = Math.random().toString(36).slice(-12);
    user = await User.create({ fullName, email, password: randomPassword });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture || "",
    loginCount: user.loginCount || 0,
    lastLogin: user.lastLogin,
    loginHistory: user.loginHistory || [],
    activityLog: user.activityLog || [],
    createdAt: user.createdAt,
    accessToken,
    refreshToken,
  });
});

// ================= GOOGLE SIGN-IN (ID TOKEN - Alternative) =================
export const googleSignIn = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error("No idToken provided");
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();

  const email = payload.email;
  const fullName = payload.name || payload.email.split("@")[0];

  // Find existing user or create one
  let user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user) {
    // create a random password for users created via Google
    const randomPassword = Math.random().toString(36).slice(-12);
    user = await User.create({ fullName, email, password: randomPassword });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture || "",
    loginCount: user.loginCount || 0,
    lastLogin: user.lastLogin,
    loginHistory: user.loginHistory || [],
    activityLog: user.activityLog || [],
    createdAt: user.createdAt,
    accessToken,
    refreshToken,
  });
});

// ================= REFRESH TOKEN =================
export const refreshTokenHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401);
    throw new Error("No refresh token provided");
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      res.status(403);
      throw new Error("Invalid refresh token");
    }

    // 🔄 Rotate tokens
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch {
    res.status(403);
    throw new Error("Token expired or invalid");
  }
});