import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, CheckCircle } from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
  const { login, loginWithEmail, signupWithEmail, resetPassword, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  // Form Validation
  const validateEmail = (emailStr: string) => /\S+@\S+\.\S+/.test(emailStr);
  const validatePassword = (passStr: string) => passStr.length >= 6;

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await login();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to log in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    try {
      setLoading(true);
      if (isLogin) {
        await loginWithEmail(email, password);
        navigate('/dashboard');
      } else {
        await signupWithEmail(email, password);
        await sendVerificationEmail();
        setMessage('Account created! Please check your email inbox to verify your account.');
        // Switch back to login view after successful signup
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first so we know where to send the reset link.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email before requesting a password reset.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage(`Password reset email sent to ${email}. Check your inbox!`);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
            <div className="logo-pulse"></div>
            <h1>Smart Campus</h1>
        </div>
        <p className="login-subtitle">
            {isLogin ? 'Sign in to access facility hubs.' : 'Create an account to get started.'}
        </p>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message-login"><CheckCircle size={16} /> {message}</div>}
        
        <form className="auth-form" onSubmit={handleEmailAuth}>
            <div className="input-group">
                <Mail size={18} className="input-icon" />
                <input 
                    type="email" 
                    placeholder="University Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="input-group">
                <Lock size={18} className="input-icon" />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            {!isLogin && (
                <div className="input-group">
                    <Lock size={18} className="input-icon" />
                    <input 
                        type="password" 
                        placeholder="Confirm Password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
            )}
            
            {isLogin && (
                <div className="forgot-password" onClick={handleForgotPassword}>
                    Forgot Password?
                </div>
            )}
            
            <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                {isLogin ? <LogIn size={18} className="btn-icon" /> : <UserPlus size={18} className="btn-icon" />}
            </button>
        </form>

        <div className="divider">
            <span>OR</span>
        </div>

        <button className="google-btn" onClick={handleGoogleLogin} type="button" disabled={loading}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="google-icon"/>
          <span>Continue with Google</span>
        </button>

        <p className="toggle-auth">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }} className="toggle-link">
                {isLogin ? 'Sign up' : 'Sign in'}
            </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
