nom ru# 🐝 StudyHive

**StudyHive** is a web platform that connects students with similar academic goals into "study hives" — focused groups where they can share resources, ask questions, and study together in real time.

## 🌟 Features

### ✅ Core Features (Implemented)
- **User Authentication** - JWT-based registration and login
- **User Profiles** - Detailed profiles with preferences and gamification
- **Study Hives** - Create and join study groups
- **Real-time Chat** - Socket.IO powered messaging (framework ready)
- **Resource Sharing** - Upload and share study materials
- **Q&A System** - Ask questions and provide answers
- **Gamification** - Points, badges, levels, and streaks

### 🚧 Upcoming Features
- **AI-Powered Matching** - Smart study group recommendations
- **Video Calling** - Integrated video sessions (Twilio/Jitsi)
- **Live Whiteboard** - Collaborative drawing and note-taking
- **Study Sessions** - Scheduled group study times
- **Premium Features** - Advanced tools and storage

## 🏗 Architecture

### Backend (Node.js + Express)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for live chat and notifications
- **File Upload**: Multer for resource sharing
- **API**: RESTful endpoints with proper error handling

### Frontend (React.js) - *Coming Soon*
- **Component-based** architecture
- **Real-time updates** with Socket.IO client
- **Modern UI** with responsive design
- **State management** for user sessions

### Database Models
1. **User** - Authentication, profile, preferences, gamification
2. **StudyHive** - Group information, members, settings, statistics
3. **Message** - Real-time chat with reactions and replies
4. **Resource** - File sharing with ratings and comments
5. **Question** - Q&A system with voting and answers

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd StudyHive
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=30d
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```

5. **Test the API**
   ```bash
   node test-api.js
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "institution": "University XYZ",
  "studyYear": "Junior",
  "major": "Computer Science",
  "studySubjects": ["Math", "Programming"],
  "studyGoals": ["Exam Prep", "Project Help"]
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "login": "johndoe", // username or email
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "bio": "Computer Science student passionate about AI"
}
```

### Health Check
```http
GET /health
```

### Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }, // or "user", "hive", etc.
  "token": "jwt_token" // for auth endpoints
}
```

## 🎮 Gamification System

StudyHive includes a comprehensive gamification system to encourage engagement:

### Points System
- **Register**: 50 points + Welcome badge
- **Ask Question**: 5 points
- **Share Resource**: 10 points
- **Answer Question**: 15 points
- **Daily Activity**: Streak bonuses

### Badges
- **Welcome** - First time joining StudyHive
- **First Question** - Asked your first question
- **Helper** - Answered 10 questions
- **Resource Sharer** - Shared 5 resources
- **Study Buddy** - Active in 3 different hives

### Levels
Calculated using: `level = floor(sqrt(points / 100)) + 1`

## 🔗 Socket.IO Events

### Client → Server
- `join-hive` - Join a study hive room
- `leave-hive` - Leave a study hive room
- `send-message` - Send a chat message
- `typing-start` - User started typing
- `typing-stop` - User stopped typing

### Server → Client
- `user-joined` - Someone joined the hive
- `user-left` - Someone left the hive
- `new-message` - New chat message received
- `user-typing` - Someone is typing
- `user-stop-typing` - Someone stopped typing

## 📁 Project Structure

```
StudyHive/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   └── authController.js    # Authentication logic
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── StudyHive.js         # Study group schema
│   │   ├── Message.js           # Chat message schema
│   │   ├── Resource.js          # File sharing schema
│   │   └── Question.js          # Q&A schema
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── users.js             # User routes
│   │   ├── hives.js             # Study hive routes
│   │   ├── resources.js         # Resource routes
│   │   ├── questions.js         # Question routes
│   │   └── messages.js          # Message routes
│   ├── uploads/                 # File storage
│   ├── .env                     # Environment variables
│   ├── .env.example             # Environment template
│   ├── package.json             # Dependencies
│   ├── server.js                # Main server file
│   └── test-api.js              # API testing script
├── frontend/                    # React app (coming soon)
└── README.md                    # Project documentation
```

## 🌐 Deployment

### Backend Deployment (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables in Render dashboard

### Database (MongoDB Atlas)
1. Create a cluster on MongoDB Atlas
2. Create a database user
3. Whitelist your IP addresses
4. Get the connection string
5. Add to MONGODB_URI in environment variables

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 Development Roadmap

### Phase 1: Foundation ✅
- [x] Project setup and architecture
- [x] User authentication and authorization
- [x] Database models and relationships
- [x] Basic API endpoints
- [x] Real-time chat infrastructure

### Phase 2: Core Features 🚧
- [ ] Study hive management (create, join, moderate)
- [ ] Resource sharing with file uploads
- [ ] Q&A system with voting
- [ ] Real-time chat implementation
- [ ] User dashboard and profiles

### Phase 3: Frontend 📋
- [ ] React application setup
- [ ] Authentication UI components
- [ ] Study hive browsing and management
- [ ] Chat interface
- [ ] Resource sharing interface
- [ ] Q&A interface

### Phase 4: Advanced Features 📋
- [ ] AI-powered study group matching
- [ ] Video calling integration
- [ ] Live whiteboard collaboration
- [ ] Study session scheduling
- [ ] Premium subscription features

### Phase 5: Optimization 📋
- [ ] Performance optimizations
- [ ] Mobile app development
- [ ] Advanced analytics
- [ ] Scale testing and improvements

## 📊 Current Status

- **Backend API**: 80% Complete
  - ✅ Authentication system
  - ✅ Database models
  - ✅ Socket.IO setup
  - ⏳ Full CRUD operations
  - ⏳ File upload system

- **Frontend**: 0% Complete
  - ⏳ React application setup
  - ⏳ UI components
  - ⏳ API integration

## 📞 Support

For support, email support@studyhive.app or join our Discord community.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for students, by students.**

*StudyHive - Where learning becomes collaborative!*
