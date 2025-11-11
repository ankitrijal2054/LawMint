/**
 * Main App Component
 * Root component with routing setup
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';

// Pages
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { Templates } from '@/pages/Templates';

// Components
import { CreateFirmForm } from '@/components/CreateFirmForm';
import { JoinFirmForm } from '@/components/JoinFirmForm';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/create-firm" element={<CreateFirmForm />} />
          <Route path="/join-firm" element={<JoinFirmForm />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Toast Notifications */}
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

