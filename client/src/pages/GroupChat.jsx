import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, User, MoreVertical, Phone, Video, Search, Check, CheckCheck } from "lucide-react";
import { getInitials } from "../utils/getInitials";
import api from "../services/api";
import "../styles/GroupChat.css";

function GroupChat() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenuId, setShowMenuId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = userObj._id;

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Fetch messages and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch messages
        const messagesRes = await api.get("/messages");
        if (messagesRes.data.success) {
          setMessages(messagesRes.data.data);
        }

        // Fetch users
        const usersRes = await api.get("/messages/users");
        if (usersRes.data.success) {
          setUsers(usersRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching chat data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const res = await api.post("/messages", { content: newMessage.trim() });
      
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setNewMessage("");
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Format time
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Check if message is from same sender as previous
  const isConsecutive = (index) => {
    if (index === 0) return false;
    return messages[index].sender._id === messages[index - 1].sender._id;
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: "#dc2626",
      doctor: "#2563eb",
      nurse: "#16a34a",
      lab: "#9333ea",
      radiology: "#ea580c",
      reception: "#0891b2",
      emergency: "#dc2626",
    };
    return colors[role] || "#6b7280";
  };

  // Toggle message menu
  const toggleMenu = (id) => {
    setShowMenuId(showMenuId === id ? null : id);
  };

  // Start editing message
  const startEdit = (message) => {
    setEditingMsgId(message._id);
    setEditContent(message.content);
    setShowMenuId(null);
  };

  // Save edited message
  const saveEdit = async (messageId) => {
    if (!editContent.trim()) return;

    try {
      const res = await api.patch(`/messages/${messageId}`, { content: editContent.trim() });
      const updatedMsg = res.data.data;

      setMessages(prev => prev.map(msg => msg._id === messageId ? updatedMsg : msg));
      setEditingMsgId(null);
      setEditContent("");
    } catch (error) {
      console.error("Edit failed:", error);
      alert("Failed to edit message");
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      await api.delete(`/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      setShowMenuId(null);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete message");
    }
  };

  // Toggle emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Insert emoji
  const insertEmoji = (emoji) => {
    const cursorPos = inputRef.current.selectionStart;
    const start = newMessage.slice(0, cursorPos);
    const end = newMessage.slice(cursorPos);
    setNewMessage(start + emoji + end);
    inputRef.current.focus();
    inputRef.current.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    setShowEmojiPicker(false);
  };

  const emojis = [
    '😀', '😂', '🤔', '👍', '❤️', '🔥', '✨', '🙌', '👏', '🤝',
    '😊', '🥰', '😢', '😡', '😴', '🤐', '🤷', '🙈', '💯', '⭐',
  ];

  if (loading) {
    return (
      <div className="whatsapp-loading">
        <div className="whatsapp-loader"></div>
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="whatsapp-container">
      {/* Left Sidebar - Chat List / Group Info */}
      <div className="whatsapp-sidebar">
        {/* Sidebar Header */}
        <div className="whatsapp-sidebar-header">
          <div className="sidebar-title">
            <h2>AfyaLock Group</h2>
            <span className="member-count">{users.length} members</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="whatsapp-search">
          <Search size={18} />
          <input type="text" placeholder="Search conversations..." />
        </div>

        {/* Members List */}
        <div className="whatsapp-members-list">
          <div className="members-header">
            <span>Group Members</span>
          </div>
          {users.map((user) => (
            <div key={user._id} className="member-item">
              <div className="member-avatar">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.fullName} />
                ) : (
                  <span>{getInitials(user.fullName)}</span>
                )}
              </div>
              <div className="member-info">
                <span className="member-name">{user.fullName}</span>
                <span 
                  className="member-role" 
                  style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                >
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="whatsapp-main">
        {/* Chat Header */}
        <div className="whatsapp-chat-header">
          <div className="chat-header-info">
            <div className="chat-group-avatar">
              <span>AG</span>
            </div>
            <div className="chat-header-details">
              <h3>AfyaLock Hospital Group</h3>
              <span>{users.length} members • All staff</span>
            </div>
          </div>
          <div className="chat-header-actions">
            {userObj.role === 'admin' && (
              <>
                <button title="Voice Call" onClick={async () => {
                  try {
                    const res = await api.post('/calls/voice');
                    window.open(res.data.meetUrl, '_blank');
                  } catch (error) {
                    alert('Failed to start voice call');
                  }
                }}>
                  <Phone size={20} />
                </button>
                <button title="Video Call" onClick={async () => {
                  try {
                    const res = await api.post('/calls/video');
                    window.open(res.data.meetUrl, '_blank');
                  } catch (error) {
                    alert('Failed to start video call');
                  }
                }}>
                  <Video size={20} />
                </button>
              </>
            )}
            <button title="More"><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="whatsapp-messages">
          {/* Welcome Message */}
          <div className="chat-welcome">
            <div className="welcome-icon">💬</div>
            <h3>Welcome to AfyaLock Group Chat!</h3>
            <p>Connect with your colleagues, share updates, and make inquiries.</p>
            <span className="message-count">{messages.length} messages</span>
          </div>

          {/* Messages List */}
          {messages.map((message, index) => {
            const isMyMessage = message.sender._id === currentUserId;
            const consecutive = isConsecutive(index);

            return (
              <div
                key={message._id}
                className={`whatsapp-message ${isMyMessage ? "sent" : "received"} ${consecutive ? "consecutive" : ""}`}
              >
                {!consecutive && !isMyMessage && (
                  <div className="message-sender">
                    {message.sender.profilePicture ? (
                      <img 
                        src={message.sender.profilePicture} 
                        alt={message.sender.fullName}
                        className="sender-avatar"
                      />
                    ) : (
                      <div className="sender-avatar initials">
                        {getInitials(message.sender.fullName)}
                      </div>
                    )}
                    <span className="sender-name">{message.sender.fullName}</span>
                    <span 
                      className="sender-role"
                      style={{ backgroundColor: getRoleBadgeColor(message.sender.role) }}
                    >
                      {message.sender.role}
                    </span>
                  </div>
                )}
                
                <div className="message-bubble">
                  {editingMsgId === message._id ? (
                    <div className="edit-container">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onBlur={() => saveEdit(message._id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            e.preventDefault();
                            saveEdit(message._id);
                          }
                        }}
                        autoFocus
                        className="edit-textarea"
                        rows="1"
                        style={{ resize: 'none', width: '100%' }}
                      />
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  <div className="message-meta">
                    <span className="message-time">
                      {formatTime(message.createdAt)}
                      {message.edited && (
                        <span className="edited-badge">(edited)</span>
                      )}
                    </span>
{isMyMessage && !editingMsgId && (
                      <div 
                        className="more-dots"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(message._id);
                        }}
                        title="More options"
                      >
                        <span></span><span></span><span></span>
                      </div>
                    )}
                    {isMyMessage && (
                      <span className="message-status">
                        <CheckCheck size={14} />
                      </span>
                    )}
                  </div>
                </div>
                {showMenuId === message._id && (
                  <div className="message-menu">
                    <button onClick={() => startEdit(message)}>Edit</button>
                    <button className="danger" onClick={() => deleteMessage(message._id)}>Delete</button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form className="whatsapp-input-area" onSubmit={handleSendMessage}>
          <button type="button" className="emoji-btn" onClick={toggleEmojiPicker}>
            😊
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <button 
            type="submit" 
            className="send-btn"
            disabled={!newMessage.trim() || sending}
          >
            <Send size={20} />
          </button>
        </form>
        {showEmojiPicker && (
          <div className="emoji-picker">
            {emojis.map((emoji, idx) => (
              <span 
                key={idx} 
                className="emoji-item" 
                onClick={() => insertEmoji(emoji)}
                role="img"
                aria-label={emoji}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupChat;

