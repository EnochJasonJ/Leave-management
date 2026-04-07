import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import LeaveRequestPage from './pages/LeaveRequestPage';
import LeaveHistoryPage from './pages/LeaveHistoryPage';
import AssignmentPage from './pages/AssignmentPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import ApproveLeavesPage from './pages/ApproveLeavesPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/apply-leave" element={<LeaveRequestPage />} />
                <Route path="/leave-history" element={<LeaveHistoryPage />} />
                <Route path="/approve-leaves" element={<ApproveLeavesPage />} />
                <Route path="/assignments" element={<AssignmentPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
