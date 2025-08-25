import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import './App.css';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import StudyGroups from './pages/StudyGroups/StudyGroups';
import StudyGroupDetail from './pages/StudyGroups/StudyGroupDetail';
import Profile from './pages/Profile/Profile';
import Gamification from './pages/Gamification/Gamification';
import AITutor from './pages/AITutor/AITutor';
import { AuthProvider } from './contexts/AuthContext';
import { StudyHivesProvider } from './contexts/StudyHivesContext';
import ConnectionStatus from './components/Common/ConnectionStatus';

function App() {
  return (
    <AuthProvider>
      <StudyHivesProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <ConnectionStatus />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/study-groups" element={<StudyGroups />} />
                <Route path="/study-groups/:groupId" element={<StudyGroupDetail />} />
                <Route path="/gamification" element={<Gamification />} />
                <Route path="/ai-tutor" element={<AITutor />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </StudyHivesProvider>
    </AuthProvider>
  );
}

export default App;
