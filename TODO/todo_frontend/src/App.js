import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import { getMotivationalTip } from './utils/aiHelpers';
import './App.css'; // Import the CSS file

const MotivationalTip = ({ tip }) => (
  <div className="motivational-tip">
    <p>💡 {tip}</p>
  </div>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [motivationalTip, setMotivationalTip] = useState('');

  // Check authentication status on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Fetch motivational tip when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchTip = async () => {
        try {
          const response = await getMotivationalTip();
          setMotivationalTip(response);
        } catch (error) {
          console.error("Failed to fetch motivational tip:", error);
          setMotivationalTip("Stay motivated! You've got this!");
        }
      };
      fetchTip();
    }
  }, [isAuthenticated]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <>
                <Home onLogout={handleLogout} />
                <MotivationalTip tip={motivationalTip} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login setAuthenticated={setIsAuthenticated} />
            )
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Signup setAuthenticated={setIsAuthenticated} />
            )
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;
