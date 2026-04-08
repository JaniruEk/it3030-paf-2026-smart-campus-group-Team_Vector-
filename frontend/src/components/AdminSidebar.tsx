import React, { useState } from 'react';
import { ShieldCheck, Database, ShieldAlert, ChevronLeft, ChevronRight, LogOut, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';

interface AdminSidebarProps {
    activeTab: 'overview' | 'audit' | 'broadcast' | 'facilities';
    setActiveTab: (tab: 'overview' | 'audit' | 'broadcast' | 'facilities') => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { currentUser, logout } = useAuth();
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);

    return (
        <div className={`admin-tabs ${isCollapsed ? 'collapsed' : ''}`}>
            <div style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-end', marginBottom: '1rem', padding: isCollapsed ? '0' : '0 0.5rem' }}>
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', transition: 'background 0.2s' }}
                    className="sidebar-toggle-btn"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', padding: '0 0.5rem' }}>
                <img 
                    src={currentUser?.photoURL || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                    alt="Avatar" 
                    className="avatar" 
                    style={{width: isCollapsed ? '40px' : '64px', height: isCollapsed ? '40px' : '64px', transition: 'all 0.3s', marginBottom: '0.5rem'}}
                />
                {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <span 
                            className="user-email" 
                            style={{ cursor: 'pointer', textDecoration: 'underline', marginBottom: '1rem', textAlign: 'center', wordBreak: 'break-all', fontSize: '0.9rem' }}
                            onClick={() => setProfileModalOpen(true)}
                            title="Click to view/edit profile"
                        >
                            {currentUser?.email}
                        </span>
                        <button onClick={logout} className="logout-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem' }}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}
            </div>

            <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} title="System Overview">
                <ShieldCheck size={20} style={{ minWidth: '20px' }}/> {!isCollapsed && <span>System Overview</span>}
            </button>
            <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')} title="Audit Logs">
                <Database size={20} style={{ minWidth: '20px' }}/> {!isCollapsed && <span>Audit Logs</span>}
            </button>
            <button className={`tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => setActiveTab('broadcast')} title="Global Broadcast">
                <ShieldAlert size={20} style={{ minWidth: '20px' }}/> {!isCollapsed && <span>Global Broadcast</span>}
            </button>
            <button className={`tab-btn ${activeTab === 'facilities' ? 'active' : ''}`} onClick={() => setActiveTab('facilities')} title="Facilities Catalogue">
                <Building size={20} style={{ minWidth: '20px' }}/> {!isCollapsed && <span>Facilities</span>}
            </button>
            
            {isProfileModalOpen && (
                <ProfileModal onClose={() => setProfileModalOpen(false)} />
            )}
        </div>
    );
};

export default AdminSidebar;
