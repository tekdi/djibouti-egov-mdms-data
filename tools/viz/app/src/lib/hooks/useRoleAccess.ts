import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth';
import { loadRoleToolMapping, saveRoleToolMapping } from '@/lib/api/roleToolMappingApi';
import type { RoleMappingData } from '@/lib/api/roleToolMappingApi';
import { useToast } from '@/components/ui/use-toast';

interface RoleAccess {
  hasAccess: (toolId: string) => boolean;
  allowedTools: string[];
  isLoading: boolean;
}

export function useRoleAccess(): RoleAccess {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roleMapping, setRoleMapping] = useState<RoleMappingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoleMapping = async () => {
      setIsLoading(true);
      try {
        const data = await loadRoleToolMapping();
        console.log('Loaded role mapping:', data);
        console.log('Current user:', user);
        console.log('User roles:', user?.roles);
        
        // Check if user has any roles not in the mapping
        if (user?.roles) {
          const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
          const newRoles: string[] = [];
          
          userRoles.forEach(role => {
            const roleCode = typeof role === 'string' ? role : role.code;
            const mapping = data.mappings.find(m => m.role === roleCode);
            
            if (!mapping && roleCode) {
              console.log(`New role detected: ${roleCode}`);
              newRoles.push(roleCode);
            } else if (mapping) {
              console.log(`Role ${roleCode} has access to:`, mapping.tools);
            }
          });
          
          // If new roles were found, add them to the configuration
          if (newRoles.length > 0) {
            console.log('Adding new roles to configuration:', newRoles);
            
            // Create updated mapping with new roles
            const updatedMappings = [
              ...data.mappings,
              ...newRoles.map(role => ({
                role,
                tools: ['localization'] // Default access for new roles
              }))
            ];
            
            const updatedData = {
              ...data,
              mappings: updatedMappings
            };
            
            // Save the updated configuration
            try {
              await saveRoleToolMapping(updatedData);
              console.log('Successfully saved new roles to configuration');
              setRoleMapping(updatedData);
              
              // Show toast notification
              toast({
                title: "New Roles Detected",
                description: `Added ${newRoles.length} new role(s) with default localization access: ${newRoles.join(', ')}`,
              });
            } catch (saveError) {
              console.error('Error saving new roles:', saveError);
              // Still use the updated data locally even if save fails
              setRoleMapping(updatedData);
              
              toast({
                title: "New Roles Detected",
                description: `Detected new roles but couldn't save to server. Using local configuration.`,
                variant: "destructive",
              });
            }
          } else {
            setRoleMapping(data);
          }
        } else {
          setRoleMapping(data);
        }
      } catch (error) {
        console.error('Error loading role mapping:', error);
        // Load from default if API fails
        try {
          const { defaultRoleToolMappingData } = await import('@/data/roleToolMapping');
          setRoleMapping(defaultRoleToolMappingData as RoleMappingData);
          console.log('Loaded default mapping:', defaultRoleToolMappingData);
        } catch (importError) {
          console.error('Error loading default mapping:', importError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchRoleMapping();
    } else {
      console.log('No user available yet');
      setIsLoading(false);
    }
  }, [user, toast]);

  const hasAccess = useMemo(() => (toolId: string): boolean => {
    if (!user || !roleMapping) return false;
    
    // Get user's roles from the user object
    // The roles might be in different formats, so let's handle both
    const userRoles = user.roles || [];
    
    // Special case: Always allow access to home page
    if (toolId === 'home') return true;
    
    // Check if any of the user's roles have access to this tool
    let hasRoleAccess = false;
    let hasUnmappedRole = false;
    
    console.log(`[ACCESS CHECK] Checking access for tool: ${toolId}`);
    console.log(`[ACCESS CHECK] User roles:`, userRoles);
    
    userRoles.forEach(role => {
      // Role can be either an object with 'code' property or a string
      const roleCode = typeof role === 'string' ? role : role.code;
      const mapping = roleMapping.mappings.find(m => m.role === roleCode);
      
      console.log(`[ACCESS CHECK] Role ${roleCode}: mapping =`, mapping);
      
      if (mapping) {
        // Role has explicit mapping
        if (mapping.tools.includes(toolId)) {
          hasRoleAccess = true;
          console.log(`[ACCESS CHECK] ✅ Role ${roleCode} has access to ${toolId}`);
        } else {
          console.log(`[ACCESS CHECK] ❌ Role ${roleCode} does NOT have access to ${toolId}`);
        }
      } else {
        // Role not in mapping - mark as unmapped
        hasUnmappedRole = true;
        console.log(`[ACCESS CHECK] ⚠️ Role ${roleCode} not found in mapping - will grant default localization access`);
      }
    });
    
    // If user has unmapped roles and no explicit access, grant localization by default
    if (!hasRoleAccess && hasUnmappedRole && toolId === 'localization') {
      console.log('[ACCESS CHECK] ✅ Granting default localization access for unmapped role');
      return true;
    }
    
    console.log(`[ACCESS CHECK] Final result for ${toolId}: ${hasRoleAccess}`);
    return hasRoleAccess;
  }, [user, roleMapping]);

  const allowedTools = useMemo((): string[] => {
    if (!user || !roleMapping) return [];
    
    const userRoles = user.roles || [];
    const allowedToolsSet = new Set<string>();
    
    userRoles.forEach(role => {
      // Role can be either an object with 'code' property or a string
      const roleCode = typeof role === 'string' ? role : role.code;
      const mapping = roleMapping.mappings.find(m => m.role === roleCode);
      if (mapping) {
        mapping.tools.forEach(tool => allowedToolsSet.add(tool));
      } else {
        // Role not found in mapping - grant default localization access
        allowedToolsSet.add('localization');
        console.log(`Role ${roleCode} not mapped - adding default localization access`);
      }
    });
    
    console.log('Allowed tools:', Array.from(allowedToolsSet));
    return Array.from(allowedToolsSet);
  }, [user, roleMapping]);

  return {
    hasAccess,
    allowedTools,
    isLoading
  };
}