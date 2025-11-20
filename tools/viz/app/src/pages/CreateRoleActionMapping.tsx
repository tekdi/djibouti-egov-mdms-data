import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Search } from 'lucide-react';
import { useRoleActionApi } from '@/lib/api/roleActionApi';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Fuse from 'fuse.js';
import type { Role, Action, RoleAction } from '@/types/roleAction';

interface PotentialMapping {
  roleCode: string;
  actionId: number;
  exists: boolean;
  role: Role | undefined;
  action: Action | undefined;
}

export default function CreateRoleActionMapping() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const { toast } = useToast();
  const api = useRoleActionApi();

  // Data state
  const [roles, setRoles] = useState<Role[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [existingMappings, setExistingMappings] = useState<RoleAction[]>([]);

  // Selection state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<number[]>([]);

  // Search state
  const [roleSearch, setRoleSearch] = useState('');
  const [actionSearch, setActionSearch] = useState('');

  // Form state
  const [tenantId] = useState('dj');

  // Progress tracking state
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    currentMapping: '',
    isVisible: false
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const result = await api.loadApiData();
      setRoles(result.roles);
      setActions(result.actions.map(a => ({ ...a, enabled: a.enabled ?? false })));
      setExistingMappings(result.roleActions.map(ra => ({ ...ra, tenantId: ra.tenantId ?? 'dj' })));
    } catch (error) {
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  // Create fuse instances for search
  const rolesFuse = useMemo(() => new Fuse(roles, {
    keys: ['code', 'name', 'description'],
    threshold: 0.3,
  }), [roles]);

  const actionsFuse = useMemo(() => new Fuse(actions, {
    keys: ['name', 'displayName', 'url', 'serviceCode'],
    threshold: 0.3,
  }), [actions]);

  // Filter roles and actions based on search
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    return rolesFuse.search(roleSearch).map(result => result.item);
  }, [roles, rolesFuse, roleSearch]);

  const filteredActions = useMemo(() => {
    if (!actionSearch.trim()) return actions;
    return actionsFuse.search(actionSearch).map(result => result.item);
  }, [actions, actionsFuse, actionSearch]);

  // Calculate potential mappings
  const potentialMappings = useMemo(() => {
    const mappings: PotentialMapping[] = [];
    for (const roleCode of selectedRoles) {
      for (const actionId of selectedActions) {
        // Check if mapping already exists
        const exists = existingMappings.some(
          mapping => mapping.rolecode === roleCode && mapping.actionid === actionId
        );
        mappings.push({
          roleCode,
          actionId,
          exists,
          role: roles.find(r => r.code === roleCode),
          action: actions.find(a => a.id === actionId)
        });
      }
    }
    return mappings;
  }, [selectedRoles, selectedActions, existingMappings, roles, actions]);

  const newMappingsCount = potentialMappings.filter(m => !m.exists).length;
  const existingMappingsCount = potentialMappings.filter(m => m.exists).length;
  const totalCombinations = potentialMappings.length;

  // Selection handlers
  const handleRoleToggle = (roleCode: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleCode) 
        ? prev.filter(code => code !== roleCode)
        : [...prev, roleCode]
    );
  };

  const handleActionToggle = (actionId: number) => {
    setSelectedActions(prev => 
      prev.includes(actionId) 
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const handleSelectAllRoles = () => {
    setSelectedRoles(filteredRoles.map(role => role.code));
  };

  const handleUnselectAllRoles = () => {
    setSelectedRoles([]);
  };

  const handleSelectAllActions = () => {
    setSelectedActions(filteredActions.map(action => action.id));
  };

  const handleUnselectAllActions = () => {
    setSelectedActions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRoles.length === 0 || selectedActions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one role and one action.",
        variant: "destructive",
      });
      return;
    }

    if (newMappingsCount === 0) {
      toast({
        title: "No New Mappings",
        description: "All selected combinations already exist.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create only new mappings
      const newMappings = potentialMappings
        .filter(m => !m.exists)
        .map(m => ({
          rolecode: m.roleCode,
          actionid: m.actionId,
          tenantId: tenantId
        }));

      // Initialize progress tracking
      setProgress({
        total: newMappings.length,
        completed: 0,
        failed: 0,
        currentMapping: '',
        isVisible: true
      });

      // Create all mappings with progress tracking
      const mappingPromises = newMappings.map(async (mapping) => {
        const roleName = roles.find(r => r.code === mapping.rolecode)?.name || mapping.rolecode;
        const actionName = actions.find(a => a.id === mapping.actionid)?.name || `Action ${mapping.actionid}`;
        
        setProgress(prev => ({
          ...prev,
          currentMapping: `${roleName} → ${actionName}`
        }));

        try {
          const result = await api.createRoleAction(mapping);
          setProgress(prev => ({
            ...prev,
            completed: prev.completed + 1
          }));
          return { status: 'fulfilled', value: result };
        } catch (error) {
          setProgress(prev => ({
            ...prev,
            failed: prev.failed + 1
          }));
          return { status: 'rejected', reason: error };
        }
      });

      const results = await Promise.all(mappingPromises);
      
      // Process results
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      // Hide progress tracker
      setProgress(prev => ({ ...prev, isVisible: false }));

      if (failed === 0) {
        toast({ 
          title: "Success", 
          description: `All ${successful} role-action mappings created successfully.` 
        });
        navigate('/role-action');
      } else if (successful > 0) {
        toast({ 
          title: "Partial Success", 
          description: `${successful} mappings created successfully, ${failed} failed.`,
          variant: "default"
        });
      } else {
        toast({ 
          title: "Error", 
          description: `All ${failed} mappings failed to create.`,
          variant: "destructive" 
        });
      }

    } catch (error) {
      setProgress(prev => ({ ...prev, isVisible: false }));
      toast({ 
        title: "Error creating mappings", 
        description: error instanceof Error ? error.message : "Unknown error", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading roles and actions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 p-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2 flex-1 min-h-0">
          {/* Roles Selection */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0 p-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Select Roles ({selectedRoles.length} selected)</span>
                <div className="flex gap-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAllRoles}
                    disabled={filteredRoles.length === 0}
                    className="text-xs h-6 px-2"
                  >
                    All
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleUnselectAllRoles}
                    disabled={selectedRoles.length === 0}
                    className="text-xs h-6 px-2"
                  >
                    None
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="text-xs">
                Search and select roles to create mappings for
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 min-h-0 space-y-2 p-2">
              <div className="relative flex-shrink-0">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  placeholder="Search roles..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1 border rounded p-2 min-h-0">
                {filteredRoles.length === 0 ? (
                  <p className="text-gray-500 text-center py-2 text-xs">
                    {roleSearch ? 'No roles match' : 'No roles available'}
                  </p>
                ) : (
                  filteredRoles.map(role => (
                    <div key={role.code} className="flex items-start space-x-2 p-2 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 rounded-md shadow-sm transition-colors text-xs">
                      <Checkbox 
                        id={`role-${role.code}`}
                        checked={selectedRoles.includes(role.code)}
                        onCheckedChange={() => handleRoleToggle(role.code)}
                        className="mt-1 h-3 w-3 flex-shrink-0"
                      />
                      <Label 
                        htmlFor={`role-${role.code}`} 
                        className="flex-1 cursor-pointer min-w-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-gray-900 mb-0.5">{role.name}</div>
                            <div className="text-xs text-blue-600 font-mono bg-blue-50 px-1 py-0.5 rounded inline-block mb-1">{role.code}</div>
                            {role.description && (
                              <div className="text-xs text-gray-600 leading-tight mt-1">{role.description}</div>
                            )}
                          </div>
                          {selectedRoles.includes(role.code) && (
                            <div className="flex-shrink-0">
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>

              {selectedRoles.length > 0 && (
                <div className="text-xs text-gray-600 flex-shrink-0 p-1 bg-blue-50 rounded">
                  <strong>Selected ({selectedRoles.length}):</strong> {selectedRoles.slice(0, 3).join(', ')}{selectedRoles.length > 3 && '...'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Selection */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0 p-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Select Actions ({selectedActions.length} selected)</span>
                <div className="flex gap-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAllActions}
                    disabled={filteredActions.length === 0}
                    className="text-xs h-6 px-2"
                  >
                    All
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleUnselectAllActions}
                    disabled={selectedActions.length === 0}
                    className="text-xs h-6 px-2"
                  >
                    None
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="text-xs">
                Search and select actions to create mappings for
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 min-h-0 space-y-2 p-2">
              <div className="relative flex-shrink-0">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  placeholder="Search actions..."
                  value={actionSearch}
                  onChange={(e) => setActionSearch(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1 border rounded p-2 min-h-0">
                {filteredActions.length === 0 ? (
                  <p className="text-gray-500 text-center py-2 text-xs">
                    {actionSearch ? 'No actions match' : 'No actions available'}
                  </p>
                ) : (
                  filteredActions.map(action => (
                    <div key={action.id} className="flex items-start space-x-2 p-2 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 rounded-md shadow-sm transition-colors text-xs">
                      <Checkbox 
                        id={`action-${action.id}`}
                        checked={selectedActions.includes(action.id)}
                        onCheckedChange={() => handleActionToggle(action.id)}
                        className="mt-1 h-3 w-3 flex-shrink-0"
                      />
                      <Label 
                        htmlFor={`action-${action.id}`} 
                        className="flex-1 cursor-pointer min-w-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-gray-900 mb-0.5">{action.displayName || action.name}</div>
                            <div className="text-xs text-gray-600 font-mono bg-gray-50 px-1 py-0.5 rounded inline-block mb-1">
                              ID: {action.id}
                            </div>
                            <div className="text-xs text-gray-600 truncate mb-1">
                              {action.url}
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex flex-col items-end gap-1">
                            {selectedActions.includes(action.id) && (
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            )}
                            {action.serviceCode && (
                              <Badge 
                                variant={action.enabled ? "default" : "secondary"}
                                className="text-xs px-1 py-0"
                              >
                                {action.serviceCode}
                              </Badge>
                            )}
                            <div className="text-xs text-gray-500">
                              {action.enabled ? 'On' : 'Off'}
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))
                )}
              </div>

              {selectedActions.length > 0 && (
                <div className="text-xs text-gray-600 flex-shrink-0 p-1 bg-green-50 rounded">
                  <strong>Selected ({selectedActions.length}):</strong> {selectedActions.slice(0, 2).map(id => 
                    actions.find(a => a.id === id)?.displayName || actions.find(a => a.id === id)?.name || id
                  ).join(', ')}{selectedActions.length > 2 && '...'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Tracker */}
        {progress.isVisible && (
          <Card className="mb-2 flex-shrink-0">
            <CardHeader className="p-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                Creating Mappings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{progress.completed + progress.failed} of {progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                      style={{ width: `${(progress.completed + progress.failed) / progress.total * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {progress.currentMapping && (
                  <div className="text-xs text-gray-600 truncate">
                    <strong>Processing:</strong> {progress.currentMapping}
                  </div>
                )}
                
                <div className="flex gap-4 text-xs">
                  <span className="text-green-600">
                    ✓ {progress.completed}
                  </span>
                  <span className="text-red-600">
                    ✗ {progress.failed}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {totalCombinations > 0 && (
          <div className="flex-shrink-0 text-xs text-gray-600 text-center p-1 bg-gray-50 rounded mb-2">
            <strong>{selectedRoles.length} roles × {selectedActions.length} actions = {totalCombinations} combinations</strong>
            {existingMappingsCount > 0 && (
              <span className="ml-2">({newMappingsCount} new, {existingMappingsCount} exist)</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center gap-2 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/role-action')}
            disabled={loading}
            className="text-xs h-7 px-2"
          >
            ← Back
          </Button>
          <Button 
            type="submit" 
            disabled={loading || newMappingsCount === 0}
            className="text-xs h-7 px-3"
          >
            {loading ? (
              <div className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Creating...
              </div>
            ) : (
              `Create ${newMappingsCount} Mapping${newMappingsCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 