import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const TechnicianRoute = () => {
    const { currentUser, userRole, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    
    // Allow TECHNICIAN or ADMIN users to access tech workspace
    if (!currentUser || (userRole !== 'TECHNICIAN' && userRole !== 'ADMIN')) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default TechnicianRoute;
