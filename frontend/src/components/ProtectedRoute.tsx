import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const { currentUser, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>; // Could replace with a nice spinner
    
    return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
