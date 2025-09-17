import { useState, useEffect, useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { DataTablePagination } from "@/components/DataTablePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Save, 
  Trash2,
  Loader2,
  RefreshCw,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { defaultRoleToolMappingData } from "@/data/roleToolMapping";
import { fetchAllRoles, saveRoleToolMapping, loadRoleToolMapping } from "@/lib/api/roleToolMappingApi";

interface Tool {
  id: string;
  name: string;
  path: string;
  description: string;
}

interface RoleMapping {
  role: string;
  tools: string[];
}

interface MappingData {
  mappings: RoleMapping[];
  tools: Tool[];
}

interface RoleMappingRow extends RoleMapping {
  [key: string]: any; // Allow dynamic tool properties
}

const columnHelper = createColumnHelper<RoleMappingRow>();

export default function RoleToolMapping() {
  const [data, setData] = useState<MappingData>(defaultRoleToolMappingData);
  const [newRole, setNewRole] = useState<string>("");
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Fetch roles and sync with existing mapping on mount
  useEffect(() => {
    syncRolesWithMapping();
  }, []);

  const syncRolesWithMapping = async () => {
    setIsLoading(true);
    setIsSyncing(true);
    try {
      // Load existing mapping
      const existingData = await loadRoleToolMapping();
      
      // Fetch all roles from API
      const allRoles = await fetchAllRoles();
      
      // Find new roles not in the mapping
      const existingRoleCodes = new Set(existingData.mappings.map(m => m.role));
      const newRoles = allRoles.filter(role => !existingRoleCodes.has(role.code));
      
      // Add new roles with default localization access only
      if (newRoles.length > 0) {
        const updatedMappings = [
          ...existingData.mappings,
          ...newRoles.map(role => ({
            role: role.code,
            tools: ['localization'] // Default access to localization only
          }))
        ];
        
        const updatedData = {
          ...existingData,
          mappings: updatedMappings
        };
        
        setData(updatedData);
        setHasChanges(true);
        
        toast({
          title: "New Roles Detected",
          description: `Added ${newRoles.length} new role(s) with default localization access`,
        });
      } else {
        setData(existingData);
      }
    } catch (error) {
      console.error('Error syncing roles:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync roles from the system. Using local configuration.",
        variant: "destructive",
      });
      // Fall back to local data
      setData(defaultRoleToolMappingData);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Transform data for table
  const tableData = useMemo(() => {
    return data.mappings.map(mapping => {
      const row: RoleMappingRow = {
        role: mapping.role,
        tools: mapping.tools,
      };
      // Add each tool as a boolean property
      data.tools.forEach(tool => {
        row[tool.id] = mapping.tools.includes(tool.id);
      });
      return row;
    });
  }, [data]);

  // Create columns dynamically
  const columns = useMemo(() => {
    const cols = [
      columnHelper.accessor("role", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Role
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: info => <span className="font-medium">{info.getValue()}</span>,
        enableSorting: true,
      }),
      ...data.tools.map(tool =>
        columnHelper.accessor(tool.id, {
          header: () => (
            <div className="text-center">
              <div className="font-medium text-sm">{tool.name}</div>
            </div>
          ),
          cell: ({ row }) => {
            const role = row.original.role;
            const isChecked = row.original.tools.includes(tool.id);
            const isDisabled = role === "STUDIO_ADMIN" && tool.id === "role-tool-mapping";
            
            return (
              <div className="text-center">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleToolToggle(role, tool.id)}
                  disabled={isDisabled}
                />
              </div>
            );
          },
          enableSorting: false,
        })
      ),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteRole(row.original.role)}
              disabled={row.original.role === "STUDIO_ADMIN"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      }),
    ];
    return cols;
  }, [data.tools]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });


  const handleToolToggle = async (role: string, toolId: string) => {
    // Find the tool name for the toast message
    const tool = data.tools.find(t => t.id === toolId);
    const mapping = data.mappings.find(m => m.role === role);
    const isRemoving = mapping?.tools.includes(toolId);
    
    setData(prevData => {
      const newMappings = prevData.mappings.map(mapping => {
        if (mapping.role === role) {
          const tools = mapping.tools.includes(toolId)
            ? mapping.tools.filter(t => t !== toolId)
            : [...mapping.tools, toolId];
          return { ...mapping, tools };
        }
        return mapping;
      });
      return { ...prevData, mappings: newMappings };
    });
    
    // Auto-save the change
    try {
      const updatedData = {
        ...data,
        mappings: data.mappings.map(mapping => {
          if (mapping.role === role) {
            const tools = mapping.tools.includes(toolId)
              ? mapping.tools.filter(t => t !== toolId)
              : [...mapping.tools, toolId];
            return { ...mapping, tools };
          }
          return mapping;
        })
      };
      
      await saveRoleToolMapping(updatedData);
      
      toast({
        title: "Changes Saved",
        description: `${isRemoving ? 'Removed' : 'Added'} ${tool?.name || 'tool'} access for ${role}`,
      });
    } catch (error) {
      console.error('Error auto-saving:', error);
      setHasChanges(true); // Mark as having changes if save failed
      toast({
        title: "Save Failed",
        description: "Changes saved locally but failed to sync to server. Please try saving manually.",
        variant: "destructive",
      });
    }
  };

  const handleAddRole = async () => {
    if (!newRole.trim()) {
      toast({
        title: "Error",
        description: "Please enter a role name",
        variant: "destructive",
      });
      return;
    }

    const roleExists = data.mappings.some(
      m => m.role.toUpperCase() === newRole.trim().toUpperCase()
    );

    if (roleExists) {
      toast({
        title: "Error",
        description: "This role already exists",
        variant: "destructive",
      });
      return;
    }

    const formattedRole = newRole.trim().toUpperCase().replace(/\s+/g, "_");
    const updatedData = {
      ...data,
      mappings: [
        ...data.mappings,
        {
          role: formattedRole,
          tools: ["localization"],
        },
      ],
    };

    setData(updatedData);
    setNewRole("");
    setIsAddingRole(false);
    
    // Auto-save the new role
    try {
      await saveRoleToolMapping(updatedData);
      toast({
        title: "Role Added & Saved",
        description: `Role "${formattedRole}" has been added with default localization access`,
      });
    } catch (error) {
      console.error('Error saving new role:', error);
      setHasChanges(true);
      toast({
        title: "Role Added Locally",
        description: `Role "${formattedRole}" added but failed to save to server. Please try saving manually.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (role: string) => {
    const updatedData = {
      ...data,
      mappings: data.mappings.filter(m => m.role !== role),
    };
    
    setData(updatedData);
    
    // Auto-save the deletion
    try {
      await saveRoleToolMapping(updatedData);
      toast({
        title: "Role Deleted & Saved",
        description: `Role "${role}" has been permanently deleted`,
      });
    } catch (error) {
      console.error('Error saving deletion:', error);
      setHasChanges(true);
      toast({
        title: "Role Deleted Locally",
        description: `Role "${role}" deleted but failed to save to server. Please try saving manually.`,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      // Save to backend
      await saveRoleToolMapping(data);
      
      // Also create a download for backup
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "role-tool-mapping.json";
      a.click();
      URL.revokeObjectURL(url);
      
      setHasChanges(false);
      
      toast({
        title: "Configuration Saved",
        description: "The role-tool mapping configuration has been saved to the server and downloaded for backup.",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Save Error",
        description: "Failed to save configuration to server. Downloaded local backup instead.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading roles and configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search roles..."
                      value={globalFilter}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      onClick={syncRolesWithMapping} 
                      variant="outline"
                      size="sm"
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Sync Roles
                    </Button>
                    <Button onClick={() => setIsAddingRole(true)} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Role
                    </Button>
                    {hasChanges && (
                      <Button onClick={handleSave} size="sm">
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table
                          .getAllColumns()
                          .filter((column) => column.getCanHide())
                          .map((column) => {
                            return (
                              <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) =>
                                  column.toggleVisibility(!!value)
                                }
                              >
                                {column.id}
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="border rounded-md">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id} className="text-center">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="h-24 text-center"
                            >
                              No results.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <DataTablePagination table={table} />
              </div>
            </CardContent>
          </Card>

      <Dialog open={isAddingRole} onOpenChange={setIsAddingRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Enter the name of the new role. It will be converted to uppercase with underscores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g., Content Manager"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              />
              {newRole && (
                <p className="text-sm text-muted-foreground">
                  Will be saved as: {newRole.trim().toUpperCase().replace(/\s+/g, "_")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingRole(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole}>
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}