import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, 
    Database, 
    ShieldAlert, 
    ChevronLeft, 
    ChevronRight, 
    LogOut, 
    ClipboardList,
    Home
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';

interface SidebarProps {
    activeTab?: 'overview' | 'audit' | 'broadcast' | 'none';
    setActiveTab?: (tab: 'overview' | 'audit' | 'broadcast') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });
    const { currentUser, userProfile, userRole, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);

    const isTicketsActive = location.pathname === '/admin/tickets' || location.pathname === '/tickets' || location.pathname === '/technician/tickets';
    const isDashboardActive = location.pathname === '/dashboard';

    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', isCollapsed.toString());
    }, [isCollapsed]);

    const handleTabClick = (tab: 'overview' | 'audit' | 'broadcast') => {
        if (location.pathname !== '/admin') {
            navigate(`/admin?tab=${tab}`);
        } else {
            setActiveTab?.(tab);
        }
    };

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
                    src={userProfile?.photoURL || currentUser?.photoURL || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
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
                            {currentUser?.displayName || currentUser?.email}
                        </span>
                        <div className="role-badge" style={{ marginBottom: '1rem' }}>{userRole}</div>
                        <button onClick={logout} className="logout-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem' }}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}
            </div>

            {/* SHARED: Dashboard/Home */}
            {(userRole === 'USER' || userRole === 'TECHNICIAN') && (
                <Link className={`tab-btn ${isDashboardActive ? 'active' : ''}`} to="/dashboard" title="Dashboard">
                    <Home size={20} style={{ minWidth: '20px' }}/> {!isCollapsed && <span>Home</span>}
                </Link>
            )}

            {/* ADMIN SPECIFIC TABS */}
            {userRole === 'ADMIN' && (
                <>
                    <button className={`tab-btn ${activeTab === 'overview' && !isTicketsActive ? 'active' : ''}`} onClick={() => handleTabClick('overview')} title="System Overview">
                        <ShieldCheck size={20} style={{ minWidth: '20px' }}/> {!isCollapsed && <span>System Overview</span>}
                    </button>
                    <button className={`tab-btn ${activeTab === 'audit' && !isTicketsActive ? 'active' : ''}`} onClick={() => handleTabClick('audit')} title="Audit Logs">
                        <Database size={20} style={{ minWidth: '20px' }}/> {!isCollapsed && <span>Audit Logs</span>}
                    </button>
                    <button className={`tab-btn ${activeTab === 'broadcast' && !isTicketsActive ? 'active' : ''}`} onClick={() => handleTabClick('broadcast')} title="Global Broadcast">
                        <ShieldAlert size={20} style={{ minWidth: '20px' }}/> {!isCollapsed && <span>Global Broadcast</span>}
                    </button>
                    <Link className={`tab-btn ${isTicketsActive ? 'active' : ''}`} to="/admin/tickets" title="Manage Tickets">
                        <ClipboardList size={20} style={{ minWidth: '20px' }}/> {!isCollapsed && <span>Manage Tickets</span>}
                    </Link>
                </>
            )}

            {/* TECHNICIAN SPECIFIC TABS */}
            {userRole === 'TECHNICIAN' && (
                <Link className={`tab-btn ${isTicketsActive ? 'active' : ''}`} to="/technician/tickets" title="Assigned Tickets">
                    <ClipboardList size={20} style={{ minWidth: '20px' }}/> {!isCollapsed && <span>Assigned Tickets</span>}
                </Link>
            )}

            {/* USER SPECIFIC TABS */}
            {userRole === 'USER' && (
                <Link className={`tab-btn ${isTicketsActive ? 'active' : ''}`} to="/tickets" title="My Tickets">
                    <ClipboardList size={20} style={{ minWidth: '20px' }}/> {!isCollapsed && <span>My Tickets</span>}
                </Link>
            )}

            
            {isProfileModalOpen && (
                <ProfileModal onClose={() => setProfileModalOpen(false)} />
            )}
        </div>
    );
};

export default Sidebar;
