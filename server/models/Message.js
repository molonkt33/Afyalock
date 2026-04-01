import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    lastEdited: {
      type: Date,
    },
    isSystemMessage: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for formatted time
messageSchema.virtual("formattedTime").get(function () {
  return this.createdAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Ensure virtuals are included in JSON
messageSchema.set("toJSON", { virtuals: true });
messageSchema.set("toObject", { virtuals: true });

export default mongoose.model("Message", messageSchema);

