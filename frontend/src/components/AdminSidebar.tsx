import React from 'react';
import { ShieldCheck, Database, ShieldAlert } from 'lucide-react';

interface AdminSidebarProps {
    activeTab: 'overview' | 'audit' | 'broadcast';
    setActiveTab: (tab: 'overview' | 'audit' | 'broadcast') => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="admin-tabs">
            <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <ShieldCheck size={18} /> System Overview
            </button>
            <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
                <Database size={18} /> Audit Logs
            </button>
            <button className={`tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => setActiveTab('broadcast')}>
                <ShieldAlert size={18} /> Global Broadcast
            </button>
        </div>
    );
};

export default AdminSidebar;
