import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, UserCog, User } from 'lucide-react';
import './AdminDashboard.css';

interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
}

const AdminDashboard: React.FC = () => {
    const { userRole } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

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

    useEffect(() => {
        if(userRole === 'ADMIN') {
            fetchUsers();
        }
    }, [userRole]);

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        try {
            setUpdatingId(userId);
            await apiClient.put(`/users/${userId}/role`, { role: newRole });
            
            // Update local state without full refetch
            setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole.toUpperCase() } : u));
        } catch(e) {
            console.error("Failed to update user role", e);
            alert("Failed to update user role. Check console.");
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
        <div className="admin-dashboard">
            <div className="admin-header">
                <h2>Role Management Console</h2>
                <div className="admin-badge">
                    <ShieldAlert size={16} /> Secure Admin Area
                </div>
            </div>

            <div className="admin-content">
                <div className="admin-card">
                    <div className="card-header">
                        <h3>Registered Users</h3>
                        <p>Manage access levels and permissions for all campus personnel.</p>
                    </div>
                    
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
                                        <th>Change Permission Level</th>
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
                                                        disabled={updatingId === user.uid}
                                                        className={updatingId === user.uid ? 'updating' : ''}
                                                    >
                                                        <option value="USER">User (Standard)</option>
                                                        <option value="TECHNICIAN">Technician</option>
                                                        <option value="ADMIN">Administrator</option>
                                                    </select>
                                                </div>
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
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
