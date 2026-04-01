# Chat Feature Implementation Plan

## Information Gathered
- **Project Structure**: Full-stack MERN application with React frontend and Express/MongoDB backend
- **Authentication**: JWT-based auth with role management (admin, doctor, nurse, lab, radiology, reception, emergency)
- **Navbar**: Custom sidebar-based profile with navigation links, visible to logged-in users
- **Routing**: React Router with ProtectedRoute and RoleGuard components

## Plan: WhatsApp-style Group Chat

### Phase 1: Backend (Server-side)
1. **Create Message Model** (`server/models/Message.js`)
   - sender: reference to User
   - content: message text
   - timestamp: Date
   - isSystemMessage: boolean (for system notifications)

2. **Create Message Routes** (`server/routes/messageRoutes.js`)
   - GET /api/messages - Get all messages (with pagination)
   - POST /api/messages - Send new message
   - DELETE /api/messages/:id - Delete message (admin only)

3. **Create Message Controller** (`server/controllers/messageController.js`)
   - getMessages: Fetch messages with user details
   - sendMessage: Create new message with sender info
   - deleteMessage: Remove message (admin only)

4. **Register routes in server.js**

### Phase 2: Frontend - Navbar
5. **Update Navbar.jsx**
   - Add Message icon button in the navbar (next to profile avatar)
   - Add click handler to navigate to /chat

### Phase 3: Frontend - Chat Page
6. **Create GroupChat page** (`client/src/pages/GroupChat.jsx`)
   - Left sidebar: Group info, member list
   - Main area: Message list with WhatsApp-style bubbles
   - Input area: Text input with send button
   - Real-time feel with auto-scroll to bottom
   - Mock WhatsApp Web UI

7. **Add Chat CSS** (`client/src/styles/GroupChat.css`)
   - WhatsApp green color scheme (#075E54, #25D366)
   - Message bubbles (sent: green, received: white)
   - Proper message grouping by sender

### Phase 4: Integration
8. **Update App.jsx**
   - Import GroupChat component
   - Add route: /chat (ProtectedRoute)

### Phase 5: Testing
9. **Verify functionality**
   - Chat link visible in navbar for all logged-in users
   - Messages persist in database
   - UI matches WhatsApp Web appearance

