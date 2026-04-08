import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import ProfileModal from '../components/ProfileModal';
import { Building, Zap } from 'lucide-react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { currentUser, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);

    // If user is Admin, go directly to the admin area instead of showing the user dashboard
    if (userRole === 'ADMIN') {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className="dashboard-layout">
            <header className="dashboard-header">
                <h2>Smart Campus Operations Hub</h2>
                <div className="header-actions">
                    <NotificationBell />
                    <div className="user-profile">
                        <img src={currentUser?.photoURL || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="Avatar" className="avatar"/>
                        <span 
                            className="user-email" 
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => setProfileModalOpen(true)}
                            title="Click to view/edit profile"
                        >
                            {currentUser?.email}
                        </span>
                        <button onClick={logout} className="logout-btn">Logout</button>
                    </div>
                </div>
            </header>
            <main className="dashboard-content">
                <div className="welcome-card">
                    <h1>Welcome back!</h1>
                    <p>You have successfully logged in using Firebase Auth. Your current assigned role is: <strong>{userRole || 'USER'}</strong></p>
                </div>

                <div className="modules-grid">
                    <div className="module-card" onClick={() => navigate('/facilities')}>
                        <div className="module-icon facilities-icon">
                            <Building size={32} />
                        </div>
                        <h3>Facilities & Assets</h3>
                        <p>Browse and manage campus resources including lecture halls, labs, meeting rooms, and equipment.</p>
                        <button className="module-btn">View Facilities →</button>
                    </div>

                    <div className="module-card coming-soon">
                        <div className="module-icon future-icon">
                            <Zap size={32} />
                        </div>
                        <h3>Resource Booking</h3>
                        <p>Book facilities and resources for your events and classes.</p>
                        <button className="module-btn" disabled>Coming Soon</button>
                    </div>
                </div>
            </main>

            {isProfileModalOpen && (
                <ProfileModal onClose={() => setProfileModalOpen(false)} />
            )}
        </div>
    );
};

export default Dashboard;

