import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import ProfileModal from '../components/ProfileModal';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);

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
                    <p>You have successfully logged in using Firebase Auth.</p>
                </div>
            </main>

            {isProfileModalOpen && (
                <ProfileModal onClose={() => setProfileModalOpen(false)} />
            )}
        </div>
    );
};

export default Dashboard;
