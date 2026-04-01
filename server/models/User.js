

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    // Profile picture (URL or base64)
    profilePicture: {
      type: String,
      default: "",
    },

    // Hospital roles - only admins can assign these
    role: {
      type: String,
      enum: ["admin", "doctor", "nurse", "lab", "radiology", "reception", "emergency"],
      default: "nurse",
    },

    // Force password change on first login
    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,

    refreshToken: {
      type: String,
      select: false,
    },

    // Staff details
    department: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    // Activity tracking
    lastLogin: {
      type: Date,
      default: null,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    loginHistory: [{
      loginAt: {
        type: Date,
        default: Date.now,
      },
      ipAddress: String,
      userAgent: String,
    }],

    // Activity log - stores various user activities
    activityLog: [{
      action: {
        type: String,
        required: true,
      },
      description: String,
      performedAt: {
        type: Date,
        default: Date.now,
      },
      ipAddress: String,
      userAgent: String,
      metadata: mongoose.Schema.Types.Mixed,
    }],
  },
  { timestamps: true }
);

// Hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
