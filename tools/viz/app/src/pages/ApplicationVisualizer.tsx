import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, ExternalLink, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { 
  fetchApplications, 
  setupPublicServicePortForward,
  getPublicServiceWhitelist,
  type Application,
  type ApplicationResponse 
} from '@/lib/api/applicationApi';
import { useRefresh } from '@/lib/contexts/RefreshContext';
import { toast } from '@/components/ui/use-toast';

interface ApplicationVisualizerState {
  applications: Application[];
  isLoading: boolean;
  error: string | null;
  portForwardInfo: any;
  whitelist: any;
  isSettingUpProxy: boolean;
}

export function ApplicationVisualizer() {
  const { triggerRefresh, isRefreshing } = useRefresh();
  const [state, setState] = useState<ApplicationVisualizerState>({
    applications: [],
    isLoading: false,
    error: null,
    portForwardInfo: null,
    whitelist: null,
    isSettingUpProxy: false,
  });

  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp || timestamp === 0) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Get workflow status badge variant
  const getWorkflowStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'applied':
        return 'outline';
      case 'awaiting_citizen_payment':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Setup port forwarding for public service
  const setupPortForwarding = async () => {
    setState(prev => ({ ...prev, isSettingUpProxy: true, error: null }));
    
    try {
      console.log('🔄 Setting up port forwarding for public-service...');
      const portInfo = await setupPublicServicePortForward();
      
      setState(prev => ({ 
        ...prev, 
        portForwardInfo: portInfo,
        isSettingUpProxy: false 
      }));

      toast({
        title: "Port Forwarding Setup",
        description: `Public service available on port ${portInfo.localPort}`,
      });

      console.log('✅ Port forwarding setup complete:', portInfo);
    } catch (error) {
      console.error('❌ Failed to setup port forwarding:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to setup port forwarding: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isSettingUpProxy: false 
      }));

      toast({
        title: "Setup Failed",
        description: "Failed to setup port forwarding for public service",
        variant: "destructive",
      });
    }
  };

  // Fetch whitelist information
  const fetchWhitelist = async () => {
    try {
      const whitelistInfo = await getPublicServiceWhitelist();
      setState(prev => ({ ...prev, whitelist: whitelistInfo }));
      console.log('📋 Whitelist fetched:', whitelistInfo);
    } catch (error) {
      console.error('❌ Failed to fetch whitelist:', error);
    }
  };

  // Load applications data
  const loadApplications = async (tenantId: string = 'dj') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('📋 Loading applications...');
      const response: ApplicationResponse = await fetchApplications(tenantId);
      
      setState(prev => ({ 
        ...prev, 
        applications: response.Application || [],
        isLoading: false 
      }));

      toast({
        title: "Applications Loaded",
        description: `Found ${response.Application?.length || 0} applications`,
      });

      console.log('✅ Applications loaded:', response.Application?.length || 0);
    } catch (error) {
      console.error('❌ Failed to load applications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({ 
        ...prev, 
        error: `Failed to load applications: ${errorMessage}`,
        isLoading: false 
      }));

      toast({
        title: "Load Failed",
        description: "Failed to load applications from public service",
        variant: "destructive",
      });
    }
  };

  // Initial data load
  useEffect(() => {
    fetchWhitelist();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    triggerRefresh();
    await loadApplications();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Application Visualizer</h1>
          <p className="text-muted-foreground">
            View and manage applications from the public service
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing || state.isLoading}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${(isRefreshing || state.isLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Setup Instructions */}
      {!state.portForwardInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Setup Required
            </CardTitle>
            <CardDescription>
              Port forwarding must be set up before accessing applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm font-medium mb-2">Step 1: Setup Port Forwarding</p>
              <p className="text-sm text-muted-foreground mb-3">
                This will establish a secure connection to the public-service in your Kubernetes cluster.
              </p>
              <Button 
                onClick={setupPortForwarding}
                disabled={state.isSettingUpProxy}
                className="w-full sm:w-auto"
              >
                {state.isSettingUpProxy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Setup Port Forwarding
                  </>
                )}
              </Button>
            </div>
            
            {state.whitelist && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm font-medium mb-2">Whitelisted APIs</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {state.whitelist.whitelistedPaths?.map((path: string, index: number) => (
                    <li key={index} className="font-mono">{path}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Port Forward Info */}
      {state.portForwardInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Port Forwarding Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Service</p>
                <p className="text-sm text-muted-foreground">{state.portForwardInfo.service}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Local Port</p>
                <p className="text-sm text-muted-foreground">{state.portForwardInfo.localPort}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant="default">Connected</Badge>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={() => loadApplications()}>
                Load Applications
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {state.isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Loading applications...</span>
          </CardContent>
        </Card>
      )}

      {/* Applications Table */}
      {state.applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Applications ({state.applications.length})</CardTitle>
            <CardDescription>
              Public service applications from tenant: dj
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Application Number</TableHead>
                    <TableHead>Service Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workflow Status</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Applicant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs">
                        {app.id?.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium">
                        {app.applicationNumber || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {app.serviceCode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(app.status)}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getWorkflowStatusBadgeVariant(app.workflowStatus)}>
                          {app.workflowStatus?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.channel}</TableCell>
                      <TableCell className="text-sm">
                        {formatTimestamp(app.auditDetails?.createdTime)}
                      </TableCell>
                      <TableCell>
                        {app.serviceDetails?.identity?.[0]?.firstName && app.serviceDetails?.identity?.[0]?.lastName
                          ? `${app.serviceDetails.identity[0].firstName} ${app.serviceDetails.identity[0].lastName}`
                          : app.serviceDetails?.identity?.[0]?.name || 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!state.isLoading && state.applications.length === 0 && state.portForwardInfo && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Applications Found</h3>
            <p className="text-muted-foreground text-center">
              There are no applications available for the current tenant.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 