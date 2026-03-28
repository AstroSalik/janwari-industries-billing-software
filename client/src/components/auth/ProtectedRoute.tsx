import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'CASHIER';
}

/**
 * Protects routes that require authentication.
 * Redirects to /login if not authenticated.
 * Optionally checks for a specific role.
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'ADMIN') {
    // ADMIN can access everything; other roles are checked
    return (
      <div className="min-h-screen bg-ji-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-playfair font-bold text-red-400 mb-2">
            Access Denied
          </h1>
          <p className="text-slate-400 font-ibm text-sm">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
