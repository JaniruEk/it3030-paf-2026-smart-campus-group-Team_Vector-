import { useAuth } from '../context/AuthContext';
import { Outlet } from 'react-router-dom';

const AdminRoute = () => {
    const { loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    // Temporarily allow access to admin routes for testing
    // if (!currentUser || userRole !== 'ADMIN') {
    //     // Redirect unauthorized users back to the dashboard
    //     return <Navigate to="/dashboard" replace />;
    // }

    return <Outlet />;
};

export default AdminRoute;
