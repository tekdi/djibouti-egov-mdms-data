import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  type Column,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, ChevronsUpDown, Users, PlusCircle, ChevronDown, UserPlus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { ProcessedEmployee } from '@/types/employee';
import { useEmployeeApi } from '@/lib/api/employeeApi';
import { useRefresh } from '@/lib/contexts/RefreshContext';
import { DataTablePagination } from '@/components/DataTablePagination';
import { useNavigate } from 'react-router-dom';

const columnHelper = createColumnHelper<ProcessedEmployee>();

// Faceted Filter Component
interface DataTableFacetedFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
  }[];
}

function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues = new Set(column?.getFilterValue() as string[]);

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
                        className="rounded-sm px-1 font-normal text-xs h-4"
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
      <DropdownMenuContent className="w-[200px]" align="start">
        {options.map((option) => {
          const isSelected = selectedValues.has(option.value);
          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={isSelected}
              onCheckedChange={() => {
                if (isSelected) {
                  selectedValues.delete(option.value);
                } else {
                  selectedValues.add(option.value);
                }
                const filterValues = Array.from(selectedValues);
                column?.setFilterValue(
                  filterValues.length ? filterValues : undefined
                );
              }}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<ProcessedEmployee[]>([]);
  const [isLoading, setLoading] = useState(false);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({
    roles: true, // Ensure roles column is visible by default
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');

  const { toast } = useToast();
  const navigate = useNavigate();
  const employeeApi = useEmployeeApi();
  const { setRefreshHandler, setRefreshingState } = useRefresh();

  // Core loading function - avoid including individual API methods as dependencies
  const fetchEmployees = useCallback(async (): Promise<ProcessedEmployee[]> => {
    if (!employeeApi.isAuthenticated) {
      throw new Error("Authentication required");
    }
    return await employeeApi.searchAllEmployees();
  }, [employeeApi]);

  // Load employees with loading state management
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setRefreshingState(true);
    try {
      const result = await fetchEmployees();
      setEmployees(result);
      toast({
        title: "Success",
        description: `Loaded ${result.length} employee(s)`,
      });
    } catch (error) {
      toast({
        title: "Error loading employees",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setEmployees([]);
    } finally {
      setLoading(false);
      setRefreshingState(false);
    }
  }, [fetchEmployees, toast, setRefreshingState]);

  // Auto-load employees on component mount - run once only
  useEffect(() => {
    let mounted = true;
    
    const initialLoad = async () => {
      if (!mounted) return;
      await loadEmployees();
    };
    
    initialLoad();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty deps array - run only once

  // Register refresh handler with Layout
  useEffect(() => {
    setRefreshHandler(loadEmployees);
    return () => setRefreshHandler(undefined);
  }, [setRefreshHandler, loadEmployees]);

  // Generate filter options from employee data
  const filterOptions = useMemo(() => {
    const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
    const designations = [...new Set(employees.map(emp => emp.designation).filter(Boolean))];
    const statuses = [...new Set(employees.map(emp => emp.employeeStatus).filter(Boolean))];
    const roles = [...new Set(
      employees.flatMap(emp => emp.roles.split(', ').map(role => role.trim())).filter(Boolean)
    )];

    return {
      department: departments.map(dept => ({ label: dept, value: dept })),
      designation: designations.map(desg => ({ label: desg, value: desg })),
      employeeStatus: statuses.map(status => ({ label: status, value: status })),
      roles: roles.map(role => ({ label: role, value: role })),
    };
  }, [employees]);

  // Define table columns with filter capabilities
  const columns = [
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-6 px-2 text-xs font-medium"
        >
          Name
          {column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-1 h-3 w-3" />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-1 h-3 w-3" />
          ) : (
            <ChevronsUpDown className="ml-1 h-3 w-3" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-xs">{row.getValue("name")}</div>
      ),
      filterFn: "includesString",
    }),
    columnHelper.accessor('userName', {
      header: 'Username',
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.getValue("userName")}</div>
      ),
      filterFn: "includesString",
    }),
    columnHelper.accessor('emailId', {
      header: 'Email',
      cell: ({ row }) => (
        <div className="text-xs">{row.getValue("emailId")}</div>
      ),
      filterFn: "includesString",
    }),
    columnHelper.accessor('mobileNumber', {
      header: 'Mobile',
      cell: ({ row }) => (
        <div className="text-xs">{row.getValue("mobileNumber")}</div>
      ),
      filterFn: "includesString",
    }),
    columnHelper.accessor('roles', {
      header: 'Roles',
      cell: ({ row }) => {
        const roles = row.getValue("roles") as string;
        const roleList = roles.split(", ");
        return (
          <div className="flex flex-wrap gap-1">
            {roleList.map((role, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-1 py-0 h-4">
                {role}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const roles = row.getValue(id) as string;
        return value.some((filterValue: string) => roles.includes(filterValue));
      },
    }),
    columnHelper.accessor('department', {
      header: 'Department',
      cell: ({ row }) => (
        <div className="text-xs">{row.getValue("department")}</div>
      ),
      filterFn: "arrIncludesSome",
    }),
    columnHelper.accessor('designation', {
      header: 'Designation',
      cell: ({ row }) => (
        <div className="text-xs">{row.getValue("designation")}</div>
      ),
      filterFn: "arrIncludesSome",
    }),
    columnHelper.accessor('employeeStatus', {
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue("employeeStatus") as string;
        return (
          <Badge variant={status === "EMPLOYED" ? "default" : "secondary"} className="text-xs px-1 py-0 h-4">
            {status}
          </Badge>
        );
      },
      filterFn: "arrIncludesSome",
    }),
    columnHelper.accessor('isActive', {
      header: 'Active',
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"} className="text-xs px-1 py-0 h-4">
            {isActive ? "Yes" : "No"}
          </Badge>
        );
      },
      filterFn: "auto",
    }),
  ];

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
      globalFilter,
    },
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 p-4 md:p-6 border-b bg-background">

        {/* Search and Filter Controls */}
        <div className="flex items-center py-4 space-x-2">
          <Input
            placeholder="Search employees..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="max-w-sm"
          />
          
          {/* Faceted Filters */}
          {table.getColumn("department") && (
            <DataTableFacetedFilter
              column={table.getColumn("department")!}
              title="Department"
              options={filterOptions.department}
            />
          )}
          {table.getColumn("designation") && (
            <DataTableFacetedFilter
              column={table.getColumn("designation")!}
              title="Designation"
              options={filterOptions.designation}
            />
          )}
          {table.getColumn("employeeStatus") && (
            <DataTableFacetedFilter
              column={table.getColumn("employeeStatus")!}
              title="Status"
              options={filterOptions.employeeStatus}
            />
          )}
          {table.getColumn("roles") && (
            <DataTableFacetedFilter
              column={table.getColumn("roles")!}
              title="Roles"
              options={filterOptions.roles}
            />
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <ChevronDown className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {isLoading 
                ? "Loading employees..." 
                : `${table.getFilteredRowModel().rows.length} of ${employees.length} employee(s)`
              }
            </span>
          </div>
          <Button
            onClick={() => navigate('/employees/create')}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Create Employee
          </Button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="border-b border-l border-r">
            <table className="w-full text-xs">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="h-8 px-2 text-left align-middle font-medium text-muted-foreground text-xs">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-2 py-2 align-middle text-xs">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="h-16 text-center text-xs">
                      {employees.length === 0
                        ? "No employees found. Click Refresh to reload."
                        : "No employees match your current filters."
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination - Fixed at bottom */}
      {!isLoading && employees.length > 0 && (
        <div className="flex-shrink-0 border-t bg-background">
          <DataTablePagination table={table} />
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement; 