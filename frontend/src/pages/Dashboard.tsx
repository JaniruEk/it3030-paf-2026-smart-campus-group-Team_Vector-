import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import ProfileModal from '../components/ProfileModal';
import apiClient from '../api/apiClient';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { currentUser, userRole, logout } = useAuth();
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const navigate = useNavigate();

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
                    
                    {userRole === 'ADMIN' && (
                        <button 
                            onClick={() => navigate('/admin')}
                            style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#8b5cf6', color: 'white', padding: '0.8rem 1.2rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            <ShieldCheck size={18} /> Enter Admin Console to Manage Roles
                        </button>
                    )}
                </div>
            </main>

            {isProfileModalOpen && (
                <ProfileModal onClose={() => setProfileModalOpen(false)} />
            )}
        </div>
    );
};

export default Dashboard;
