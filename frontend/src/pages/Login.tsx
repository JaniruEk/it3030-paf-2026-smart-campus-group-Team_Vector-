import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      await login();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to log in with Google. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
            <div className="logo-pulse"></div>
            <h1>Smart Campus</h1>
        </div>
        <p className="login-subtitle">Sign in to access facility bookings and maintenance hubs.</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <button className="google-btn" onClick={handleLogin}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="google-icon"/>
          <span>Sign in with Google</span>
          <LogIn size={20} className="login-icon" />
        </button>

        <p className="login-footer">Protected by university credentials.</p>
      </div>
    </div>
  );
};

export default Login;
