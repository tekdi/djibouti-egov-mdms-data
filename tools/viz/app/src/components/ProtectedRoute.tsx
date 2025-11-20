import { Navigate } from 'react-router-dom';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { useAuth } from '@/lib/auth/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  toolId: string;
}

export function ProtectedRoute({ children, toolId }: ProtectedRouteProps) {
  const { hasAccess, isLoading } = useRoleAccess();
  const { user } = useAuth();

  // Show loading while checking permissions
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // After loading is complete, check access
  const canAccess = hasAccess(toolId);
  
  if (!canAccess) {
    console.log(`User does not have access to ${toolId}. Roles:`, user?.roles, 'Loading:', isLoading);
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}