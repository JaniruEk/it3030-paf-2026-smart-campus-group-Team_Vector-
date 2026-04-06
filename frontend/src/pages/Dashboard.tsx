import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import ProfileModal from '../components/ProfileModal';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { currentUser, userRole, logout } = useAuth();
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
                    <div className="dashboard-actions">
                        <Link to="/tickets" className="dashboard-action-link">Manage My Tickets</Link>
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
