import React from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { ShieldAlert, UserCheck, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../pages/AdminDashboard.css';

interface AppLayoutProps {
    children: React.ReactNode;
    activeTab?: 'overview' | 'audit' | 'broadcast' | 'bookings' | 'assets' | 'facilities' | 'none';
    setActiveTab?: (tab: 'overview' | 'audit' | 'broadcast' | 'bookings' | 'assets' | 'facilities') => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, activeTab, setActiveTab }) => {
    const { userRole } = useAuth();

    const getRoleBadge = () => {
        switch (userRole) {
            case 'ADMIN': return <div className="admin-badge"><ShieldAlert size={16} /> Secure Admin Area</div>;
            case 'TECHNICIAN': return <div className="admin-badge" style={{ background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}><Briefcase size={16} /> Technician Workspace</div>;
            default: return <div className="admin-badge" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}><UserCheck size={16} /> Campus Portal</div>;
        }
    };

    return (
        <div className="admin-dashboard-layout">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="admin-main">
                <header className="dashboard-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
                    <h2>Smart Campus Operations Hub</h2>
                    <div className="header-actions">
                        {getRoleBadge()}
                        <NotificationBell />
                    </div>
                </header>

                <div className="admin-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
