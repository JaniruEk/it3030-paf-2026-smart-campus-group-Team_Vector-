import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
    const { currentUser, userRole, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    
    // Only allow verified ADMIN users
    if (!currentUser || userRole !== 'ADMIN') {
        // Redirect unauthorized users back to the dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
