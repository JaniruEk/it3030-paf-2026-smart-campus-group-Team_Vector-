import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import './Dashboard.css';
import './AdminDashboard.css';

const Dashboard: React.FC = () => {
    const { currentUser, userRole } = useAuth();
    const isProfileModalOpen = false;

    const ticketActionPath = userRole === 'TECHNICIAN' ? '/technician/tickets' : '/tickets';
    const ticketActionLabel = userRole === 'TECHNICIAN' ? 'Manage Assigned Tickets' : 'Manage My Tickets';

    // If user is Admin, go directly to the admin area instead of showing the user dashboard
    if (userRole === 'ADMIN') {
        return <Navigate to="/admin" replace />;
    }

    return (
        <AppLayout activeTab="none">
            <div className="admin-card">
                <div className="card-header">
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Welcome back, {currentUser?.displayName || currentUser?.email}!
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: '#64748b' }}>
                        You are currently logged into the Smart Campus Operations Hub as a <strong>{userRole}</strong>.
                    </p>
                </div>
                
                <div style={{ padding: '2.5rem' }}>
                    <div className="welcome-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ color: '#0f172a', marginBottom: '1rem' }}>Get Started</h2>
                                <p style={{ color: '#475569', marginBottom: '2rem', lineHeight: '1.6' }}>
                                    Access your personalized workspace to manage maintenance requests, view system notifications, and interact with the campus support team. Your dashboard provides real-time updates on all your active interests.
                                </p>
                                <div className="dashboard-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <Link to={ticketActionPath} className="dashboard-action-link" style={{ padding: '1rem 2rem', fontSize: '1.1rem', textAlign: 'center' }}>
                                        {ticketActionLabel}
                                    </Link>
                                    {userRole !== 'TECHNICIAN' && (
                                        <Link to="/Booking_Form" className="dashboard-action-link" style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', textAlign: 'center' }}>
                                            Book a Campus Facility
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <div style={{ width: '300px', display: isProfileModalOpen ? 'none' : 'block' }}>
                                <img 
                                    src="https://img.freepik.com/free-vector/modern-campus-concept-illustration_114360-12496.jpg" 
                                    alt="Campus" 
                                    style={{ width: '100%', borderRadius: '12px' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Dashboard;
