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
import Upgrade from './pages/Upgrade/Upgrade';
import JoinGroup from './pages/JoinGroup/JoinGroup';
import PaymentCallback from './pages/PaymentCallback/PaymentCallback';
import { AuthProvider } from './pages/contexts/AuthContext';
import { StudyHivesProvider } from './pages/contexts/StudyHivesContext';
import { ThemeProvider } from './pages/contexts/ThemeContext';
import { TimerProvider } from './pages/contexts/TimerContext';
import { NotificationProvider } from './pages/contexts/NotificationContext';
import ConnectionStatus from './components/Common/ConnectionStatus';
import NotificationContainer from './components/Common/NotificationContainer';
import StudyTimer from './pages/StudyTimer/StudyTimer';
import Notifications from './pages/Notifications/Notifications';
import './styles/theme.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StudyHivesProvider>
          <TimerProvider>
            <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
              <Navbar />
              <ConnectionStatus />
              <NotificationContainer />
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
                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/study-timer" element={<StudyTimer />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/join/:linkId" element={<JoinGroup />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/payment/callback" element={<PaymentCallback />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </main>
            </div>
          </Router>
            </NotificationProvider>
          </TimerProvider>
        </StudyHivesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
