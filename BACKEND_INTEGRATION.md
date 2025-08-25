# StudyHive Frontend-Backend Integration Guide

## 🚀 Overview

This guide explains how the StudyHive frontend has been configured to connect with the hosted backend at `https://studyhive-3gkn.onrender.com`.

## 🔧 Configuration

### Environment Variables

The frontend is configured with the following environment variables in `.env`:

```env
REACT_APP_API_URL=https://studyhive-3gkn.onrender.com/api
REACT_APP_SOCKET_URL=https://studyhive-3gkn.onrender.com
GENERATE_SOURCEMAP=false
```

### API Integration

The frontend includes comprehensive API integration:

- **API Service** (`src/services/apiService.js`): Complete API client with all backend endpoints
- **Socket Service** (`src/services/socketService.js`): Real-time WebSocket communication
- **Auth Context** (`src/contexts/AuthContext.js`): Authentication state management
- **StudyHives Context** (`src/contexts/StudyHivesContext.js`): Group management state

## 📡 Real-time Features

The frontend connects to the backend via Socket.IO for real-time features:

- ✅ **Real-time messaging** in study groups
- ✅ **Typing indicators** when users are typing
- ✅ **User presence** tracking (online/offline status)
- ✅ **Message reactions** and voting on polls
- ✅ **Live notifications** for mentions and new messages
- ✅ **Connection status** monitoring with auto-reconnect

## 🏠 Available API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile

### Study Hives (Groups)
- `GET /hives` - List all study hives
- `POST /hives` - Create new study hive
- `GET /hives/:id` - Get specific hive details
- `POST /hives/:id/join` - Join a hive
- `POST /hives/:id/leave` - Leave a hive
- `GET /hives/my-hives` - Get user's hives

### Messages (Chat)
- `GET /messages/hive/:hiveId` - Get hive messages
- `POST /messages` - Send message
- `PUT /messages/:id` - Edit message
- `DELETE /messages/:id` - Delete message
- `POST /messages/:id/reactions` - Add reaction

## 🔗 How to Start the Frontend

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Access the Application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing the Connection

The home page includes an **API Health Check** component that allows you to:

1. Test connectivity to the hosted backend
2. View response times and status
3. See current backend and socket URLs
4. Verify the backend is running properly

### Connection Status Indicator

The app includes a connection status bar that shows:
- ✅ **Green**: Connected to backend with real-time features
- ❌ **Red**: Connection lost with reconnect button

## 🎯 Key Features Working

### User Authentication
- Users can register and login using the hosted backend
- JWT tokens are automatically managed
- Profile data is synchronized with the backend

### Group Creation & Management
- Create study hives with custom settings
- Join/leave groups with proper validation
- View group members and manage roles
- Real-time member presence tracking

### Real-time Chat
- Send messages instantly via WebSocket
- See typing indicators from other users
- React to messages with emojis
- Vote on polls and see results in real-time
- Message editing and deletion
- File attachments support

### Notifications
- Mention notifications when tagged in messages
- Real-time updates for new messages
- Connection status notifications

## 🛠️ Development Features

### Error Handling
- Comprehensive error handling for API calls
- User-friendly error messages
- Automatic token refresh and auth error handling

### State Management
- React Context for global state management
- Optimistic updates for better UX
- Automatic data synchronization

### Performance
- Request interceptors for automatic token attachment
- Response caching where appropriate
- Efficient WebSocket connection management

## 📱 Usage Examples

### Creating a Study Group
```javascript
import { useStudyHives } from './contexts/StudyHivesContext';

const { createHive } = useStudyHives();

const newHive = await createHive({
  name: 'Mathematics Study Group',
  description: 'A group for studying calculus',
  subject: 'Mathematics',
  tags: ['calculus', 'math'],
  settings: {
    isPrivate: false,
    maxMembers: 20
  }
});
```

### Sending Messages
```javascript
import { messagesAPI } from './services/apiService';
import socketService from './services/socketService';

// Via API
const message = await messagesAPI.sendMessage({
  content: 'Hello everyone!',
  hiveId: 'hive123',
  messageType: 'text'
});

// Via Socket (real-time)
socketService.sendMessage({
  content: 'Hello everyone!',
  hiveId: 'hive123',
  messageType: 'text'
});
```

## 🔍 Troubleshooting

### Connection Issues
1. Check if the backend URL is accessible: `https://studyhive-3gkn.onrender.com/health`
2. Verify environment variables are loaded correctly
3. Check browser console for CORS or network errors
4. Use the health check component on the home page

### Authentication Issues
1. Clear localStorage if tokens are corrupted
2. Check if backend authentication endpoints are working
3. Verify JWT tokens are being sent with requests

### Real-time Issues
1. Check if WebSocket connection is established
2. Verify Socket.IO server is running on the backend
3. Check for firewall/proxy blocking WebSocket connections

## 🎊 Success!

The frontend is now fully integrated with the hosted backend at `https://studyhive-3gkn.onrender.com`. Users can:

- ✅ Register and login with real authentication
- ✅ Create and join study groups
- ✅ Chat in real-time with other group members
- ✅ Share files and create polls
- ✅ See live user presence and typing indicators
- ✅ Receive real-time notifications

The integration provides a complete, production-ready experience with both REST API and WebSocket functionality working seamlessly together!
