import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Auth from './components/Auth';
import FacultyDashboard from './components/FacultyDashboard';
import StudentDashboard from './components/StudentDashboard';

function App() {
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        <Routes>
          <Route 
            path="/" 
            element={
              !user ? (
                <Auth />
              ) : user.role === 'faculty' ? (
                <Navigate to="/faculty" replace />
              ) : (
                <Navigate to="/student" replace />
              )
            } 
          />
          
          <Route
            path="/faculty"
            element={
              user && user.role === 'faculty' ? (
                <FacultyDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          
          <Route
            path="/student"
            element={
              user && user.role === 'student' ? (
                <StudentDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;