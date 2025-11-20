import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldOff, Home, User, Key } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { Badge } from '@/components/ui/badge';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allowedTools } = useRoleAccess();

  // Extract user roles
  const userRoles = user?.roles || [];
  const roleNames = userRoles.map(role => 
    typeof role === 'string' ? role : role.code
  );

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldOff className="h-8 w-8 text-destructive" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </div>
          <CardDescription className="mt-2">
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This page requires specific role permissions that your account doesn't have. 
            If you believe you should have access, please contact your system administrator.
          </p>
          
          {/* Debug Information */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                <span className="font-semibold text-sm">Your Username:</span>
              </div>
              <p className="text-sm pl-6">{user?.userName || 'Not logged in'}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4" />
                <span className="font-semibold text-sm">Your Roles:</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {roleNames.length > 0 ? (
                  roleNames.map(role => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldOff className="h-4 w-4" />
                <span className="font-semibold text-sm">Tools You Can Access:</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {allowedTools.length > 0 ? (
                  allowedTools.map(tool => (
                    <Badge key={tool} variant="outline">{tool}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tools accessible</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go to Home
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}