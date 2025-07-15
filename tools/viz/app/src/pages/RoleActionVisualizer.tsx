import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
  type ColumnFiltersState,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  type Table,
  type Column,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useRoleActionApi } from '@/lib/api/roleActionApi';
import { useEmployeeApi } from '@/lib/api/employeeApi';
import type { NewRolePayload, NewActionPayload } from '@/lib/api/roleActionApi';
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, PlusCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from "@/components/ui/skeleton"


// Types
interface Role {
  code: string;
  name: string;
  description?: string;
  employeeCount?: number; // Add employee count to Role interface
}

interface Action {
  id: number;
  name: string;
  displayName?: string;
  url: string;
  serviceCode?: string;
  enabled: boolean;
}

interface RoleAction {
  rolecode: string;
  actionid: number;
  actioncode?: string;
  tenantId?: string;
}

interface ProcessedRoleActionMapping {
  roleCode: string;
  roleName: string;
  roleDescription: string;
  actionId: number;
  actionName: string;
  actionUrl: string;
  actionDisplayName: string;
  serviceCode: string;
  enabled: boolean;
  tenantId: string;
}

const RoleActionVisualizer: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<{ roles: Role[], actions: Action[], roleActions: RoleAction[] }>({ roles: [], actions: [], roleActions: [] });
  const [isLoading, setLoading] = useState(true);
  const [isLoadingEmployeeCounts, setIsLoadingEmployeeCounts] = useState(false);
  
  // Global filter for searching across all columns
  const [globalFilter, setGlobalFilter] = useState('');
  
  const [mappingsSorting, setMappingsSorting] = useState<SortingState>([]);
  const [rolesSorting, setRolesSorting] = useState<SortingState>([]);
  const [actionsSorting, setActionsSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [actionsColumnFilters, setActionsColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rolesColumnVisibility, setRolesColumnVisibility] = useState({})
  const [actionsColumnVisibility, setActionsColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [rolesPagination, setRolesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [actionsPagination, setActionsPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Modal States
  const [isAddRoleOpen, setAddRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState<NewRolePayload>({ code: '', name: '', description: '' });

  const [isAddActionOpen, setAddActionOpen] = useState(false);
  const [newAction, setNewAction] = useState<Partial<NewActionPayload>>({ id: undefined, name: '', url: '', enabled: true });




  const { toast } = useToast();
  const api = useRoleActionApi();
  const employeeApi = useEmployeeApi();

  const loadDataFromApi = async () => {
    setLoading(true);
    try {
      const result = await api.loadApiData();
      const rolesWithoutEmployeeCounts = result.roles.map(role => ({ ...role, employeeCount: 0 }));
      
      setData({
        roles: rolesWithoutEmployeeCounts,
        actions: result.actions.map(a => ({ ...a, enabled: a.enabled ?? false })),
        roleActions: result.roleActions
      });

      // Load employee counts separately to avoid blocking the initial data load
      await loadEmployeeCounts(rolesWithoutEmployeeCounts);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeCounts = async (roles: Role[]) => {
    if (!employeeApi.isAuthenticated) {
      return; // Skip if not authenticated
    }

    setIsLoadingEmployeeCounts(true);
    try {
      const rolesWithCounts = await employeeApi.enhanceRolesWithEmployeeCounts(roles);
      setData(prevData => ({
        ...prevData,
        roles: rolesWithCounts
      }));
    } catch (error) {
      console.warn("Failed to load employee counts:", error);
      toast({
        title: "Warning",
        description: "Could not load employee counts. Role data will be shown without counts.",
        variant: "default",
      });
    } finally {
      setIsLoadingEmployeeCounts(false);
    }
  };

  useEffect(() => {
    loadDataFromApi();
  }, []);

  // Handlers for creating new entities
  const handleAddRole = async () => {
    if (!newRole.code || !newRole.name) {
      toast({ title: "Error", description: "Role Code and Name are required.", variant: "destructive" });
      return;
    }
    try {
      await api.createRole(newRole);
      toast({ title: "Success", description: "Role created successfully." });
      setAddRoleOpen(false);
      loadDataFromApi();
    } catch (error) {
      toast({ title: "Error creating role", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  const handleAddAction = async () => {
    if (!newAction.id || !newAction.name || !newAction.url) {
      toast({ title: "Error", description: "Action ID, Name, and URL are required.", variant: "destructive" });
      return;
    }
    try {
      await api.createAction(newAction as NewActionPayload);
      toast({ title: "Success", description: "Action created successfully." });
      setAddActionOpen(false);
      loadDataFromApi();
    } catch (error) {
      toast({ title: "Error creating action", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };




  // Initial data processing
  const processedData = useMemo(() => {
    return data.roleActions.map(mapping => {
      const role = data.roles.find(r => r.code === mapping.rolecode);
      const action = data.actions.find(a => a.id === mapping.actionid);
      return {
        roleCode: mapping.rolecode,
        roleName: role?.name || 'Unknown',
        roleDescription: role?.description || '',
        actionId: mapping.actionid,
        actionName: action?.name || 'Unknown',
        actionUrl: action?.url || '',
        actionDisplayName: action?.displayName || action?.name || 'Unknown',
        serviceCode: action?.serviceCode || '',
        enabled: action?.enabled ?? false,
        tenantId: mapping.tenantId || 'unknown',
      };
    });
  }, [data]);




  // Table definitions
  const columnHelper = createColumnHelper<ProcessedRoleActionMapping>();
  const roleColumnHelper = createColumnHelper<Role>();
  const actionColumnHelper = createColumnHelper<Action>();

  const columns = useMemo<ColumnDef<ProcessedRoleActionMapping, any>[]>(() => [
    columnHelper.accessor('roleCode', { header: 'Role Code', cell: (info: any) => info.getValue(), filterFn: 'arrIncludesSome' }),
    columnHelper.accessor('roleName', { header: 'Role Name', cell: (info: any) => info.getValue() }),
    columnHelper.accessor('actionId', { header: 'Action ID', cell: (info: any) => <Badge variant="secondary">{info.getValue()}</Badge> }),
    columnHelper.accessor('actionName', { header: 'Action Name', cell: (info: any) => info.getValue() }),
    columnHelper.accessor('actionUrl', { header: 'Action URL', cell: (info: any) => <code>{info.getValue()}</code> }),
    columnHelper.accessor('serviceCode', { header: 'Service Code' }),
  ], [columnHelper]);

  const roleColumns = useMemo<ColumnDef<Role, any>[]>(() => [
    roleColumnHelper.accessor('code', { header: 'Code', cell: (info: any) => info.getValue() }),
    roleColumnHelper.accessor('name', { header: 'Name', cell: (info: any) => info.getValue() }),
    roleColumnHelper.accessor('description', { header: 'Description', cell: (info: any) => info.getValue() }),
    roleColumnHelper.accessor('employeeCount', { 
      header: () => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Employee Count
          {isLoadingEmployeeCounts && <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />}
        </div>
      ), 
      cell: (info: any) => {
        const count = info.getValue();
        return (
          <div className="flex items-center gap-2">
            <Badge variant={count > 0 ? "default" : "secondary"}>
              {count || 0}
            </Badge>
          </div>
        );
      }
    }),
  ], [roleColumnHelper, isLoadingEmployeeCounts]);

  const actionColumns = useMemo<ColumnDef<Action, any>[]>(() => [
    actionColumnHelper.accessor('id', { header: 'ID', cell: (info: any) => info.getValue() }),
    actionColumnHelper.accessor('name', { header: 'Name', cell: (info: any) => info.getValue() }),
    actionColumnHelper.accessor('url', { header: 'URL', cell: (info: any) => <code>{info.getValue()}</code> }),
    actionColumnHelper.accessor('serviceCode', { 
      header: 'Service Code',
      filterFn: 'arrIncludesSome',
    }),
    actionColumnHelper.accessor('displayName', { header: 'Display Name', cell: (info: any) => info.getValue() }),
    actionColumnHelper.accessor('enabled', { header: 'Enabled', cell: (info: any) => info.getValue() ? 'Yes' : 'No' }),
  ], [actionColumnHelper]);

  const table = useReactTable({
    data: processedData, // Use processedData directly
    columns,
    state: { 
      sorting: mappingsSorting,
      columnFilters,
      columnVisibility,
      pagination,
      globalFilter,
    },
    onPaginationChange: setPagination,
    onSortingChange: setMappingsSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rolesTable = useReactTable({
    data: data.roles, // Use data.roles directly
    columns: roleColumns,
    state: { 
        sorting: rolesSorting,
        columnVisibility: rolesColumnVisibility,
        pagination: rolesPagination,
        globalFilter,
    },
    onPaginationChange: setRolesPagination,
    onSortingChange: setRolesSorting,
    onColumnVisibilityChange: setRolesColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const actionsTable = useReactTable({
    data: data.actions, // Use data.actions directly
    columns: actionColumns,
    state: {
      sorting: actionsSorting,
      columnFilters: actionsColumnFilters,
      columnVisibility: actionsColumnVisibility,
      pagination: actionsPagination,
      globalFilter,
    },
    onPaginationChange: setActionsPagination,
    onSortingChange: setActionsSorting,
    onColumnFiltersChange: setActionsColumnFilters,
    onColumnVisibilityChange: setActionsColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="flex gap-2 mb-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-40" />
        </div>
        <div className="space-y-4">
            <div className="flex items-center py-4 gap-2">
                <Skeleton className="h-10 w-full max-w-sm" />
                <Skeleton className="h-10 w-full max-w-sm" />
                <Skeleton className="h-10 w-24 ml-auto" />
            </div>
            <div className="rounded-md border">
                <div className="w-full text-sm">
                    <div className="bg-muted/50">
                        <div className="p-2 flex gap-2">
                            <Skeleton className="h-6 flex-1" />
                            <Skeleton className="h-6 flex-1" />
                            <Skeleton className="h-6 flex-1" />
                            <Skeleton className="h-6 flex-1" />
                            <Skeleton className="h-6 flex-1" />
                        </div>
                    </div>
                    <div>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="p-2 flex gap-2 border-b">
                                <Skeleton className="h-6 flex-1" />
                                <Skeleton className="h-6 flex-1" />
                                <Skeleton className="h-6 flex-1" />
                                <Skeleton className="h-6 flex-1" />
                                <Skeleton className="h-6 flex-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between px-2 py-4">
                <Skeleton className="h-6 w-32" />
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-8 w-[70px]" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                    <div className="flex items-center space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }
  
  const DataTable = ({ tableInstance, children }: { tableInstance: Table<any>, children?: React.ReactNode }) => (
    <div>
      <div className="flex items-center py-4 gap-2">
        {children}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {tableInstance.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                        {column.id}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {tableInstance.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-2 text-left text-sm font-semibold select-none cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ArrowUp className="h-4 w-4 text-primary" />,
                        desc: <ArrowDown className="h-4 w-4 text-primary" />,
                      }[header.column.getIsSorted() as string] ?? (header.column.getCanSort() ? <ChevronsUpDown className="h-4 w-4" /> : null)}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {tableInstance.getRowModel().rows?.length ? (
              tableInstance.getRowModel().rows.map((row) => (
                <tr key={row.id} data-state={row.getIsSelected() && "selected"} className="border-b">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-2 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableInstance.getAllColumns().length} className="h-24 text-center">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DataTablePagination table={tableInstance} />
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Role-Action Visualizer</h1>
        <div className="flex gap-2">
          <Dialog open={isAddRoleOpen} onOpenChange={setAddRoleOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Role</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Role</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role-code" className="text-right">Code</Label>
                        <Input id="role-code" value={newRole.code} onChange={(e) => setNewRole({...newRole, code: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role-name" className="text-right">Name</Label>
                        <Input id="role-name" value={newRole.name} onChange={(e) => setNewRole({...newRole, name: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role-description" className="text-right">Description</Label>
                        <Input id="role-description" value={newRole.description} onChange={(e) => setNewRole({...newRole, description: e.target.value})} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddRole}>Save Role</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddActionOpen} onOpenChange={setAddActionOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Action</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Action</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="action-id" className="text-right">ID</Label>
                        <Input id="action-id" type="number" value={newAction.id || ''} onChange={(e) => setNewAction({...newAction, id: parseInt(e.target.value)})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="action-name" className="text-right">Name</Label>
                        <Input id="action-name" value={newAction.name} onChange={(e) => setNewAction({...newAction, name: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="action-url" className="text-right">URL</Label>
                        <Input id="action-url" value={newAction.url} onChange={(e) => setNewAction({...newAction, url: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="action-displayName" className="text-right">Display Name</Label>
                        <Input id="action-displayName" value={newAction.displayName} onChange={(e) => setNewAction({...newAction, displayName: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="action-serviceCode" className="text-right">Service Code</Label>
                        <Input id="action-serviceCode" value={newAction.serviceCode} onChange={(e) => setNewAction({...newAction, serviceCode: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="action-enabled" className="text-right">Enabled</Label>
                        <Checkbox id="action-enabled" checked={newAction.enabled} onCheckedChange={(checked) => setNewAction({...newAction, enabled: !!checked})} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddAction}>Save Action</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={() => navigate('/role-action/create')}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Mappings
          </Button>

        </div>
      </div>
      <Tabs defaultValue="mappings" className="w-full">
        <TabsList>
          <TabsTrigger value="mappings">Role-Action Mappings ({processedData.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles ({data.roles.length})</TabsTrigger>
          <TabsTrigger value="actions">Actions ({data.actions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="mappings">
          <DataTable tableInstance={table}>
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
          </DataTable>
        </TabsContent>
        <TabsContent value="roles">
          <DataTable tableInstance={rolesTable}>
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
          </DataTable>
        </TabsContent>
        <TabsContent value="actions">
          <DataTable tableInstance={actionsTable}>
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            {actionsTable.getColumn("serviceCode") && (
              <DataTableFacetedFilter
                column={actionsTable.getColumn("serviceCode")!}
                title="Service Code"
                options={[...actionsTable.getColumn("serviceCode")!.getFacetedUniqueValues().keys()].sort().map(val => ({ value: val, label: val }))}
              />
            )}
          </DataTable>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoleActionVisualizer;


interface DataTableFacetedFilterProps<TData, TValue> {
    column: Column<TData, TValue>,
    title?: string
    options: {
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }[]
}

export function DataTableFacetedFilter<TData, TValue>({
    column,
    title,
    options,
  }: DataTableFacetedFilterProps<TData, TValue>) {
    const selectedValues = new Set(column?.getFilterValue() as string[])
  
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <PlusCircle className="mr-2 h-4 w-4" />
            {title}
            {selectedValues?.size > 0 && (
              <>
                <div className="mx-2 h-4 w-px bg-muted-foreground" />
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal lg:hidden"
                >
                  {selectedValues.size}
                </Badge>
                <div className="hidden space-x-1 lg:flex">
                  {selectedValues.size > 2 ? (
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal"
                    >
                      {selectedValues.size} selected
                    </Badge>
                  ) : (
                    options
                      .filter((option) => selectedValues.has(option.value))
                      .map((option) => (
                        <Badge
                          variant="secondary"
                          key={option.value}
                          className="rounded-sm px-1 font-normal"
                        >
                          {option.label}
                        </Badge>
                      ))
                  )}
                </div>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {options.map((option) => {
            const isSelected = selectedValues.has(option.value)
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={isSelected}
                onCheckedChange={() => {
                  if (isSelected) {
                    selectedValues.delete(option.value)
                  } else {
                    selectedValues.add(option.value)
                  }
                  const filterValues = Array.from(selectedValues)
                  column?.setFilterValue(
                    filterValues.length ? filterValues : undefined
                  )
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
}

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ArrowUp className="h-4 w-4 rotate-180" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ArrowDown className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  )
} 