import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';

// Import Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Chat from './pages/Chat';
import Reports from './pages/Reports';
import Team from './pages/Team';
import JoinInvite from './pages/JoinInvite';
import VerifyAccount from './pages/VerifyAccount';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import CreateProject from './pages/CreateProject';
import CreateTask from './pages/CreateTask';
import ProjectDetails from './pages/ProjectDetails';
import TaskDetails from './pages/TaskDetails';

// New Pages
import Meetings from './pages/Meetings';
import Documents from './pages/Documents';
import Billing from './pages/Billing';
import AIAssistant from './pages/AIAssistant';
import Integrations from './pages/Integrations';
import Workspace from './pages/Workspace';
import AdminPanel from './pages/AdminPanel';

// Academic Pages
import ThesisDetail from './pages/academic/ThesisDetail';
import ResearchPapers from './pages/academic/ResearchPapers';
import Certificates from './pages/academic/Certificates';
import CertificateVerification from './pages/academic/CertificateVerification';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="stopwatch-circle stopwatch-active">
          <span className="stopwatch-time" style={{ fontSize: '1rem' }}>Loading</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppLayout = () => {
  const { user } = useAuth();

  // If user is NOT logged in — show public routes + invite route
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invite/join/:token" element={<JoinInvite />} />
        <Route path="/verify-account" element={<VerifyAccount />} />
        <Route path="/certificate/verify/:uuid" element={<CertificateVerification />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-body">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/create" element={<ProtectedRoute allowedRoles={['admin', 'project_manager']}><CreateProject /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/tasks/pending" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/tasks/create" element={<ProtectedRoute allowedRoles={['admin', 'project_manager', 'team_member', 'member']}><CreateTask /></ProtectedRoute>} />
            <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetails /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/academic/thesis" element={<ProtectedRoute><ThesisDetail /></ProtectedRoute>} />
            <Route path="/academic/research" element={<ProtectedRoute><ResearchPapers /></ProtectedRoute>} />
            <Route path="/academic/certificate" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
            <Route path="/certificate/verify/:uuid" element={<CertificateVerification />} />
            <Route path="/team" element={
              <ProtectedRoute allowedRoles={['admin', 'project_manager', 'team_member', 'client', 'member']}>
                <Team />
              </ProtectedRoute>
            } />
            {/* Invite join works for logged-in users too */}
            <Route path="/invite/join/:token" element={<JoinInvite />} />
            <Route path="/verify-account" element={<VerifyAccount />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
};

export default App;
