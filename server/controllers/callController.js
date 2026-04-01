import Message from "../models/Message.js";
import User from "../models/User.js";


const generateMeetId = () => {
  return 'afyalock-' + Math.random().toString(36).substr(2, 9);
};

// @desc    Create voice call meeting
export const createVoiceCall = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('fullName');
    
    const meetId = generateMeetId();
    const meetUrl = `https://meet.google.com/${meetId}`;
    
    const now = new Date();
    const endTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 min
    
    // Generate simple Meet link (no Calendar needed)
    // const event = await createCalendarEvent({
    //   summary: `${user.fullName} started Voice Call`,
    //   description: `Join voice call: ${meetUrl}`,
    //   startDateTime: now.toISOString(),
    //   endDateTime: endTime.toISOString(),
    // });
    
    // Send system message to all
    const systemMsg = await Message.create({
      sender: null, // System
      content: `📞 **${user.fullName}** started a **Voice Call**! Join: ${meetUrl} (ends ${endTime.toLocaleTimeString()})`,
      isSystemMessage: true,
    });
    
    res.status(201).json({
      success: true,
      meetUrl,
      message: systemMsg._id,
    });
  } catch (error) {
    console.error("Voice call error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create voice call",
    });
  }
};

// @desc    Create video call meeting
export const createVideoCall = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('fullName');
    
    const meetId = generateMeetId();
    const meetUrl = `https://meet.google.com/${meetId}`;
    
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 60 min
    
    // Generate simple Meet link (no Calendar needed)
    // const event = await createCalendarEvent({
    //   summary: `${user.fullName} started Video Call`,
    //   description: `Join video call: ${meetUrl}`,
    //   startDateTime: now.toISOString(),
    //   endDateTime: endTime.toISOString(),
    // });
    
    // Send system message to all
    const systemMsg = await Message.create({
      sender: null,
      content: `📹 **${user.fullName}** started a **Video Call**! Join: ${meetUrl} (ends ${endTime.toLocaleTimeString()})`,
      isSystemMessage: true,
    });
    
    res.status(201).json({
      success: true,
      meetUrl,
      message: systemMsg._id,
    });
  } catch (error) {
    console.error("Video call error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create video call",
    });
  }
};

