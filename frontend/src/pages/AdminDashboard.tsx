import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, UserCog, User, Users, Database, Cpu, MemoryStick, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';
import AdminSidebar from '../components/AdminSidebar';
import './AdminDashboard.css';
import './Dashboard.css';

interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
  disabled: boolean;
}

const AdminDashboard: React.FC = () => {
    const { userRole } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [healthData, setHealthData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [healthLoading, setHealthLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [isHealthExpanded, setIsHealthExpanded] = useState(true);
    const [isUsersExpanded, setIsUsersExpanded] = useState(true);
    
    // New States
    const [activeTab, setActiveTab] = useState<'overview'|'audit'|'broadcast'>('overview');
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loadingAudit, setLoadingAudit] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastRole, setBroadcastRole] = useState('ALL');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/users');
            setUsers(res.data);
        } catch(e) {
            console.error("Failed to fetch users", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchHealthData = async () => {
        try {
            setHealthLoading(true);
            const res = await apiClient.get('/admin/system-health');
            setHealthData(res.data);
        } catch(e) {
            console.error("Failed to fetch system health", e);
        } finally {
            setHealthLoading(false);
        }
    };

    useEffect(() => {
        if(userRole === 'ADMIN') {
            if (activeTab === 'overview') {
                fetchUsers();
                fetchHealthData();
            } else if (activeTab === 'audit') {
                fetchAuditLogs();
            }
        }
    }, [userRole, activeTab]);

    const fetchAuditLogs = async () => {
        try {
            setLoadingAudit(true);
            const res = await apiClient.get('/audit-logs');
            setAuditLogs(res.data);
        } catch(e) {
            console.error("Failed to fetch audit logs", e);
        } finally {
            setLoadingAudit(false);
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!broadcastMsg.trim()) return;
        setIsBroadcasting(true);
        try {
            await apiClient.post('/notifications/broadcast', { message: broadcastMsg, role: broadcastRole });
            toast.success("Broadcast sent successfully!", { position: 'top-right' });
            setBroadcastMsg('');
            setActiveTab('overview');
        } catch(e: any) {
            toast.error("Failed to send broadcast: " + (e.response?.data || e.message), { position: 'top-right' });
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        try {
            setUpdatingId(userId);
            await apiClient.put(`/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole.toUpperCase() } : u));
        } catch(e) {
            console.error("Failed to update user role", e);
            alert("Failed to update user role. Check console.");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleStatusUpdate = async (userId: string, currentStatus: boolean | undefined) => {
        try {
            const isCurrentlyDisabled = currentStatus === true;
            setUpdatingId(userId);
            await apiClient.put(`/users/${userId}/status`, { disabled: !isCurrentlyDisabled });
            setUsers(users.map(u => u.uid === userId ? { ...u, disabled: !isCurrentlyDisabled } : u));
        } catch(e) {
            console.error("Failed to update user status", e);
            alert("Failed to toggle status.");
        } finally {
            setUpdatingId(null);
        }
    };

    const getRoleIcon = (role: string) => {
        switch(role) {
            case 'ADMIN': return <ShieldCheck size={18} className="role-icon admin-icon" />;
            case 'TECHNICIAN': return <UserCog size={18} className="role-icon tech-icon" />;
            default: return <User size={18} className="role-icon user-icon" />;
        }
    };

    return (
        <div className="admin-dashboard-layout">
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="admin-main">
                <header className="dashboard-header" style={{ margin: '-2rem -2rem 2rem -2rem' }}>
                    <h2>Smart Campus Operations Hub</h2>
                    <div className="header-actions">
                        <div className="admin-badge" style={{ marginRight: '1rem' }}>
                            <ShieldAlert size={16} /> Secure Admin Area
                        </div>
                        <NotificationBell />
                    </div>
                </header>

                <div className="admin-content">
                    {activeTab === 'overview' && (
                    <>
                        <div className="admin-card">
                    <div 
                        className="card-header" 
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setIsHealthExpanded(!isHealthExpanded)}
                    >
                        <div>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Secure System Health</h3>
                            <p style={{ margin: 0, marginTop: '4px' }}>Real-time telemetry and monitoring data. ADMIN ONLY.</p>
                        </div>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                            {isHealthExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    </div>
                    {isHealthExpanded && (
                        <>
                            {healthLoading ? (
                                 <div className="loading-state">Accessing secure health telemetry...</div>
                            ) : healthData ? (
                                <div className="health-dashboard">
                                    <div className="health-stat-card">
                                        <span className="health-stat-title">System Status</span>
                                        <span className={`health-stat-value ${healthData.status?.includes('Online') ? 'ok' : 'warning'}`}>
                                            {healthData.status}
                                        </span>
                                    </div>
                            <div className="health-stat-card">
                                <span className="health-stat-title"><Cpu size={16} style={{display:'inline', marginBottom:'-2px'}}/> CPU Usage</span>
                                <span className="health-stat-value">{healthData.cpuUsage}</span>
                            </div>
                            <div className="health-stat-card">
                                <span className="health-stat-title"><MemoryStick size={16} style={{display:'inline', marginBottom:'-2px'}}/> RAM Usage</span>
                                <span className="health-stat-value">{healthData.memoryUsage}</span>
                            </div>
                            <div className="health-stat-card">
                                <span className="health-stat-title"><Users size={16} style={{display:'inline', marginBottom:'-2px'}}/> Total Active Users</span>
                                <span className="health-stat-value">{healthData.activeUsers || 0}</span>
                            </div>
                            <div className="health-stat-card">
                                <span className="health-stat-title"><Database size={16} style={{display:'inline', marginBottom:'-2px'}}/> Total Resources</span>
                                <span className="health-stat-value">{healthData.totalResources !== undefined ? healthData.totalResources : 'N/A'}</span>
                            </div>
                            <div className="health-stat-card">
                                <span className="health-stat-title"><UserCheck size={16} style={{display:'inline', marginBottom:'-2px', color:'#10b981'}}/> Online Now</span>
                                <span className="health-stat-value ok">{healthData.onlineUsers || 0}</span>
                            </div>
                            <div className="health-stat-card">
                                <span className="health-stat-title"><Database size={16} style={{display:'inline', marginBottom:'-2px'}}/> Database</span>
                                <span className="health-stat-value ok">{healthData.databaseStatus}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">Failed to load secure health data. Check permissions.</div>
                    )}
                        </>
                    )}
                </div>

                <div className="admin-card" style={{ marginTop: '2rem' }}>
                    <div 
                        className="card-header"
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setIsUsersExpanded(!isUsersExpanded)}
                    >
                        <div>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Registered Users</h3>
                            <p style={{ margin: 0, marginTop: '4px' }}>Manage access levels and permissions for all campus personnel.</p>
                        </div>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                            {isUsersExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    </div>
                    
                    {isUsersExpanded && (
                        <>
                            {loading ? (
                                <div className="loading-state">Loading users securely...</div>
                            ) : (
                        <div className="table-responsive">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>User ID</th>
                                        <th>Email</th>
                                        <th>Current Role</th>
                                        <th>Manage Access</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.uid}>
                                            <td className="mono">{user.uid.substring(0,8)}...</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <div className="role-badge">
                                                    {getRoleIcon(user.role)}
                                                    {user.role || 'USER'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="role-selector">
                                                    <select 
                                                        value={user.role || 'USER'} 
                                                        onChange={(e) => handleRoleUpdate(user.uid, e.target.value)}
                                                        disabled={updatingId === user.uid || user.disabled}
                                                        className={updatingId === user.uid ? 'updating' : ''}
                                                    >
                                                        <option value="USER">User (Standard)</option>
                                                        <option value="TECHNICIAN">Technician</option>
                                                        <option value="ADMIN">Administrator</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <button 
                                                    style={{ 
                                                        padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600,
                                                        background: user.disabled ? '#10b981' : '#ef4444', color: 'white'
                                                    }}
                                                    onClick={() => handleStatusUpdate(user.uid, user.disabled)}
                                                    disabled={updatingId === user.uid}
                                                >
                                                    {user.disabled ? 'Enable' : 'Suspend'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="empty-state">No users found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                            )}
                        </>
                    )}
                </div>
                </>
                )}

                {activeTab === 'audit' && (
                    <div className="admin-card">
                        <div className="card-header">
                            <h3>System Audit Logs</h3>
                            <p>Immutable record of critical administrative actions.</p>
                        </div>
                        {loadingAudit ? (
                            <div className="loading-state">Fetching secure logs...</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Action Performed</th>
                                            <th>Performed By</th>
                                            <th>Target Reference</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td className="mono">{new Date(log.timestamp).toLocaleString()}</td>
                                                <td style={{ fontWeight: 600 }}>{log.action}</td>
                                                <td>{log.performedBy}</td>
                                                <td className="mono" style={{ fontSize: '0.8rem' }}>{log.targetUser}</td>
                                                <td style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>{log.details || '-'}</td>
                                            </tr>
                                        ))}
                                        {auditLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="empty-state">No audit logs recorded yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'broadcast' && (
                    <div className="admin-card">
                        <div className="card-header">
                            <h3>Global Broadcast</h3>
                            <p>Send a real-time WebSocket push notification to personnel.</p>
                        </div>
                        <div style={{ padding: '2rem' }}>
                            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Target Audience</label>
                                    <select 
                                        value={broadcastRole} 
                                        onChange={(e) => setBroadcastRole(e.target.value)}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    >
                                        <option value="ALL">All Registered Users</option>
                                        <option value="ADMIN">Administrators Only</option>
                                        <option value="TECHNICIAN">Technicians Only</option>
                                        <option value="USER">Standard Users Only</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Broadcast Message</label>
                                    <textarea 
                                        value={broadcastMsg}
                                        onChange={(e) => setBroadcastMsg(e.target.value)}
                                        rows={4}
                                        placeholder="Enter the critical announcement here..."
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isBroadcasting}
                                    style={{ 
                                        background: '#3b82f6', color: 'white', padding: '0.8rem', borderRadius: '6px', 
                                        border: 'none', fontWeight: 600, cursor: isBroadcasting ? 'wait' : 'pointer'
                                    }}
                                >
                                    {isBroadcasting ? 'Broadcasting...' : 'SEND BROADCAST NOW'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
