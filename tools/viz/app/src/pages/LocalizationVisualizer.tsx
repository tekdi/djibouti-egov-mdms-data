import { useState, useEffect, useMemo, useCallback } from 'react';
import {
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
} from '@tanstack/react-table';
import { Globe, ChevronDown, PlusCircle } from 'lucide-react';
import { useLocalizationApi } from '@/lib/api/localization';
import type { LocalizationString, SupportedLanguage } from '@/types/localization';
import { SUPPORTED_LANGUAGES } from '@/types/localization';
import { useToast } from '@/components/ui/use-toast';
import { AddStringDialog } from '@/components/localization/AddStringDialog';
import { getColumns } from '@/components/localization/columns';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTablePagination } from '@/components/DataTablePagination';
import { DataTableFacetedFilter } from "@/components/DataTableFacetedFilter";


export function LocalizationVisualizer() {
  const [data, setData] = useState<LocalizationString[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddStringDialogOpen, setIsAddStringDialogOpen] = useState(false);
  
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [globalFilter, setGlobalFilter] = useState('');

  const { toast } = useToast();
  const { searchLocalizationStrings, upsertLocalizationString } = useLocalizationApi();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetches = SUPPORTED_LANGUAGES.map(lang => 
        searchLocalizationStrings(lang)
      );
      const allLangData = await Promise.all(fetches);
      const messagesByCodeModule: Record<string, LocalizationString> = {};
      allLangData.forEach(({ messages }, langIndex) => {
        const lang = SUPPORTED_LANGUAGES[langIndex];
        messages.forEach(msg => {
          const key = `${msg.code}|${msg.module}`;
          if (!messagesByCodeModule[key]) {
            messagesByCodeModule[key] = {
              code: msg.code,
              module: msg.module,
              translations: {},
            };
          }
          messagesByCodeModule[key].translations[lang] = msg.message;
        });
      });
      setData(Object.values(messagesByCodeModule).sort((a, b) => a.code.localeCompare(b.code)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchLocalizationStrings, toast]);
  
  useEffect(() => {
    async function loadModules() {
      try {
        const res = await fetch('/data/dj/common-masters/StateInfo.json');
        if (!res.ok) throw new Error('Failed to fetch modules');
        const stateInfo = await res.json();
        const fetchedModules = (stateInfo.StateInfo && stateInfo.StateInfo[0] && stateInfo.StateInfo[0].localizationModules)
          ? stateInfo.StateInfo[0].localizationModules.map((m: { value: string }) => m.value)
          : [];
        setModules(fetchedModules);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load modules from StateInfo.json',
          variant: 'destructive',
        });
      }
    }
    loadModules();
    fetchData();
  }, [toast, fetchData]);

  const handleUpdateString = useCallback(async (code: string, module: string, lang: SupportedLanguage, value: string) => {
    try {
      await upsertLocalizationString(code, value, module, lang);
      toast({
        title: 'Success',
        description: `Updated "${code}" (${lang}).`,
      });
      // Optimistically update UI
      setData(prevData => prevData.map(row => {
        if (row.code === code && row.module === module) {
          return {
            ...row,
            translations: {
              ...row.translations,
              [lang]: value
            }
          };
        }
        return row;
      }));
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update string',
        variant: 'destructive',
      });
    }
  }, [upsertLocalizationString, toast]);

  const handleAddStringSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const columns = useMemo(() => getColumns(handleUpdateString), [handleUpdateString]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Globe className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">Localization Visualizer</h1>
        </div>
        <div className="space-y-4">
            <div className="flex items-center py-4 gap-2">
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

  if (error) {
    return <p className="text-red-500 text-center p-8">{error}</p>
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <Globe className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-slate-900">Localization Visualizer</h1>
      </div>
      
      <Tabs defaultValue="localization" className="flex-1 flex flex-col min-h-0">
        {/* <TabsList>
          <TabsTrigger value="localization">Localization Strings</TabsTrigger>
        </TabsList> */}
        <TabsContent value="localization" className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter all columns..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
            {table.getColumn("module") && (
              <DataTableFacetedFilter
                column={table.getColumn("module")}
                title="Module"
                options={modules.map(module => ({ label: module, value: module }))}
              />
            )}
            {table.getColumn("status") && (
                <DataTableFacetedFilter
                    column={table.getColumn("status")}
                    title="Status (FR)"
                    options={[
                        { label: 'Complete', value: 'complete' },
                        { label: 'Missing', value: 'missing' }
                    ]}
                />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  View <ChevronDown className="ml-2 h-4 w-4" />
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
            <Button onClick={() => setIsAddStringDialogOpen(true)} className="ml-4">
              <PlusCircle className="mr-2 h-4 w-4"/> Add String
            </Button>
          </div>
          <div className="rounded-md border flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/50 z-10">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="p-2 text-left font-medium">
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
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="border-b">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-2 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DataTablePagination table={table} />
        </TabsContent>
      </Tabs>


      <AddStringDialog 
        open={isAddStringDialogOpen}
        onOpenChange={setIsAddStringDialogOpen}
        modules={modules}
        onSuccess={handleAddStringSuccess}
      />
    </div>
  );
} 