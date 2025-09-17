import { useAuth } from '@/lib/auth/auth';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DebugInfo() {
  const { user, isAuthenticated } = useAuth();
  const { hasAccess, allowedTools, isLoading } = useRoleAccess();
  const [isExpanded, setIsExpanded] = useState(false);
  const [roleMapping, setRoleMapping] = useState<any>(null);

  // Load role mapping to show what's configured
  useEffect(() => {
    const loadMapping = async () => {
      try {
        const response = await fetch('/api-local/role-tool-mapping');
        if (response.ok) {
          const data = await response.json();
          setRoleMapping(data);
          console.log('DEBUG: Loaded role mapping from server:', data);
        }
      } catch (error) {
        console.error('DEBUG: Error loading role mapping:', error);
      }
    };
    loadMapping();
  }, []);

  // Log everything on mount and changes
  useEffect(() => {
    console.group('🔍 DEBUG INFO - Auth & Roles');
    console.log('1. Is Authenticated:', isAuthenticated);
    console.log('2. User object:', user);
    console.log('3. User roles:', user?.roles);
    console.log('4. Allowed tools:', allowedTools);
    console.log('5. Is Loading:', isLoading);
    console.log('6. Local Storage - Token:', localStorage.getItem('egov_token') ? 'EXISTS' : 'NOT FOUND');
    console.log('7. Local Storage - User:', localStorage.getItem('egov_userInfo'));
    
    if (user?.roles) {
      console.log('8. Role Details:');
      const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
      userRoles.forEach((role: any) => {
        const roleCode = typeof role === 'string' ? role : role?.code;
        console.log(`   - Role: ${roleCode}`);
        console.log(`     Can access dashboard: ${hasAccess('dashboard')}`);
        console.log(`     Can access localization: ${hasAccess('localization')}`);
        console.log(`     Can access workflow: ${hasAccess('workflow')}`);
      });
    }
    
    if (roleMapping) {
      console.log('9. Role Mapping Configuration:');
      roleMapping.mappings?.forEach((mapping: any) => {
        console.log(`   - ${mapping.role}: ${mapping.tools.join(', ')}`);
      });
    }
    
    console.groupEnd();
  }, [user, isAuthenticated, allowedTools, isLoading, hasAccess, roleMapping]);

  // Extract role information
  const userRoles = user?.roles || [];
  const roleNames = Array.isArray(userRoles) 
    ? userRoles.map((role: any) => typeof role === 'string' ? role : role?.code || 'UNKNOWN')
    : [typeof userRoles === 'string' ? userRoles : (userRoles as any)?.code || 'UNKNOWN'];

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          size="sm"
          variant="secondary"
          className="shadow-lg"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug Info
          <ChevronUp className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug Information
            </CardTitle>
            <Button
              onClick={() => setIsExpanded(false)}
              size="sm"
              variant="ghost"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="space-y-1">
            <div className="font-semibold">Authentication:</div>
            <div>Status: <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </Badge></div>
            <div>Loading: <Badge variant={isLoading ? "secondary" : "outline"}>
              {isLoading ? 'Loading...' : 'Ready'}
            </Badge></div>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">User:</div>
            <div>Username: {user?.userName || 'N/A'}</div>
            <div>User ID: {(user as any)?.uuid || (user as any)?.id || 'N/A'}</div>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">Roles:</div>
            <div className="flex flex-wrap gap-1">
              {roleNames.length > 0 ? (
                roleNames.map((role: string) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">No roles</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">Allowed Tools:</div>
            <div className="flex flex-wrap gap-1">
              {allowedTools.length > 0 ? (
                allowedTools.map(tool => (
                  <Badge key={tool} variant="outline" className="text-xs">
                    {tool}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">No tools accessible</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">Access Tests:</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>Dashboard: {hasAccess('dashboard') ? '✅' : '❌'}</div>
              <div>Workflow: {hasAccess('workflow') ? '✅' : '❌'}</div>
              <div>Localization: {hasAccess('localization') ? '✅' : '❌'}</div>
              <div>Applications: {hasAccess('applications') ? '✅' : '❌'}</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">Raw User Roles Data:</div>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(user?.roles, null, 2)}
            </pre>
          </div>

          <div className="pt-2 border-t text-xs text-muted-foreground">
            Check browser console for detailed logs
          </div>
        </CardContent>
      </Card>
    </div>
  );
}