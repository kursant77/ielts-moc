import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

import OwnerLayout from '../layouts/OwnerLayout';
import AdminLayout from '../layouts/AdminLayout';

import Login from '../pages/Login';

import OwnerLogin from '../pages/owner/OwnerLogin';
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import AdminManagement from '../pages/owner/AdminManagement';
import AdminDetail from '../pages/owner/AdminDetail';
import OwnerStudents from '../pages/owner/OwnerStudents';
import OwnerTests from '../pages/owner/OwnerTests';
import OwnerSettings from '../pages/owner/OwnerSettings';

import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminTests from '../pages/admin/AdminTests';
import CreateTest from '../pages/admin/CreateTest';
import TestDetail from '../pages/admin/TestDetail';
import GenerateKey from '../pages/admin/GenerateKey';
import AdminStudents from '../pages/admin/AdminStudents';
import AdminResults from '../pages/admin/AdminResults';
import AdminSettings from '../pages/admin/AdminSettings';

import ExamAccess from '../pages/student/ExamAccess';
import ExamPage from '../pages/student/ExamPage';
import ReadingSection from '../pages/student/ReadingSection';
import ListeningSection from '../pages/student/ListeningSection';
import WritingSection from '../pages/student/WritingSection';
import ReadingAnswerSheet from '../pages/student/ReadingAnswerSheet';
import ListeningAnswerSheet from '../pages/student/ListeningAnswerSheet';
import AnswerSheet from '../pages/student/AnswerSheet';
import Finish from '../pages/student/Finish';
import StudentLayout from '../layouts/StudentLayout';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfile from '../pages/student/StudentProfile';
import StudentTests from '../pages/student/StudentTests';
import StudentHistory from '../pages/student/StudentHistory';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  useProtectedRoute(requiredRole);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'owner') {
      return <Navigate to="/owner/dashboard" replace />;
    }
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children, redirectIfAuth }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If user is authenticated and redirectIfAuth is true, redirect to appropriate dashboard
  if (user && redirectIfAuth) {
    if (user.role === 'owner') {
      return <Navigate to="/owner/dashboard" replace />;
    }
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute redirectIfAuth>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/owner/login"
        element={
          <PublicRoute redirectIfAuth>
            <OwnerLogin />
          </PublicRoute>
        }
      />
      <Route
        path="/owner"
        element={
          <ProtectedRoute requiredRole="owner">
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="admins" element={<AdminManagement />} />
        <Route path="admins/:id" element={<AdminDetail />} />
        <Route path="students" element={<OwnerStudents />} />
        <Route path="tests" element={<OwnerTests />} />
        <Route path="settings" element={<OwnerSettings />} />
      </Route>

      <Route
        path="/admin/login"
        element={
          <PublicRoute redirectIfAuth>
            <AdminLogin />
          </PublicRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="tests" element={<AdminTests />} />
        <Route path="tests/create" element={<CreateTest />} />
        <Route path="tests/:id" element={<TestDetail />} />
        <Route path="generate-key" element={<GenerateKey />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="results" element={<AdminResults />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="/exam-access"
        element={
          <PublicRoute redirectIfAuth>
            <ExamAccess />
          </PublicRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="tests" element={<StudentTests />} />
        <Route path="history" element={<StudentHistory />} />
        <Route path="settings" element={<StudentProfile />} />
      </Route>
      <Route
        path="/exam/:key"
        element={
          <ProtectedRoute requiredRole="student">
            <ExamPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="reading" replace />} />
        <Route path="reading" element={<ReadingSection />} />
        <Route path="reading-answer-sheet" element={<ReadingAnswerSheet />} />
        <Route path="listening" element={<ListeningSection />} />
        <Route path="listening-answer-sheet" element={<ListeningAnswerSheet />} />
        <Route path="writing" element={<WritingSection />} />
        <Route path="answer-sheet" element={<AnswerSheet />} />
        <Route path="finish" element={<Finish />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
