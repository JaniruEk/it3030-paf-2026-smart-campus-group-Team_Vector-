
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const { currentUser, loading, sendVerificationEmail } = useAuth();
    
    if (loading) return <div>Loading...</div>; // Could replace with a nice spinner
    
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Require email verification (Google SSO users are automatically verified)
    if (!currentUser.emailVerified) {
        return (
            <div style={{ textAlign: 'center', marginTop: '10%' }}>
                <h2>Verify Your Email</h2>
                <p>We sent a verification link to <strong>{currentUser.email}</strong>.</p>
                <p>Please check your inbox (and spam folder) and verify your email to access the Smart Campus Dashboard.</p>
                <button 
                    onClick={() => sendVerificationEmail()} 
                    style={{ padding: '0.8rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '1rem' }}
                >
                    Resend Verification Email
                </button>
            </div>
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;
