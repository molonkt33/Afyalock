import Message from "../models/Message.js";
import User from "../models/User.js";

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private (all authenticated users)
export const getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ isSystemMessage: false })
      .populate("sender", "fullName profilePicture role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ isSystemMessage: false });

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    res.status(200).json({
      success: true,
      count: reversedMessages.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: reversedMessages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
};

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private (all authenticated users)
export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const message = await Message.create({
      sender: req.user._id,
      content: content.trim(),
      isSystemMessage: false,
    });

    // Populate sender details
    await message.populate("sender", "fullName profilePicture role");

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private (Admin only)
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting message",
      error: error.message,
    });
  }
};

// @desc    Get all users for chat sidebar
// @route   GET /api/messages/users
// @access  Private
export const getChatUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select("fullName profilePicture role department")
      .sort({ fullName: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching chat users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// @desc    Edit a message
// @route   PATCH /api/messages/:id
// @access  Private (sender or admin only)
export const editMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id).populate("sender", "fullName profilePicture role");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isSender = req.user._id.toString() === message.sender._id.toString();

    if (!isAdmin && !isSender) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this message",
      });
    }

    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be empty",
      });
    }

    message.content = content.trim();
    message.edited = true;
    message.lastEdited = new Date();
    await message.save();

    await message.populate("sender", "fullName profilePicture role"); // Re-populate

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({
      success: false,
      message: "Error editing message",
      error: error.message,
    });
  }
};

