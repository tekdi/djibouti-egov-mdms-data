import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { Globe, ChevronDown, PlusCircle, RefreshCw } from 'lucide-react';
import { useLocalizationApi } from '@/lib/api/localization';
import type { LocalizationString, SupportedLanguage } from '@/types/localization';
import { SUPPORTED_LANGUAGES } from '@/types/localization';
import { useToast } from '@/components/ui/use-toast';
import { AddStringDialog } from '@/components/localization/AddStringDialog';
import { getColumns } from '@/components/localization/columns';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';
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

  // Refs to prevent duplicate calls in React StrictMode
  const hasInitialized = useRef(false);
  const isFetching = useRef(false);

  const { toast } = useToast();
  const { searchLocalizationStrings, upsertLocalizationString } = useLocalizationApi();

  const fetchData = useCallback(async (force: boolean = false) => {
    // Prevent overlapping requests (helps with React StrictMode)
    if (isFetching.current && !force) {
      console.log('⏳ Fetch already in progress, skipping duplicate call');
      return;
    }
    
    isFetching.current = true;
    setIsLoading(true);
    setError(null);
    
    console.log(`🔄 Fetching localization data${force ? ' (forced refresh)' : ''}...`);
    
    try {
      // Clear any previous data to ensure fresh fetch
      if (force) {
        setData([]);
      }
      
      const fetches = SUPPORTED_LANGUAGES.map(lang => 
        searchLocalizationStrings(lang)
      );
      const allLangData = await Promise.all(fetches);
      const messagesByCodeModule: Record<string, LocalizationString> = {};
      
      allLangData.forEach(({ messages }, langIndex) => {
        const lang = SUPPORTED_LANGUAGES[langIndex];
        console.log(`📡 Loaded ${messages.length} ${lang} localization strings`);
        
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
      
      const sortedData = Object.values(messagesByCodeModule).sort((a, b) => a.code.localeCompare(b.code));
      setData(sortedData);
      console.log(`✅ Processed ${sortedData.length} unique localization entries`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Localization API Error',
        description: `Failed to fetch localization strings: ${errorMessage}`,
        variant: 'destructive',
      });
      console.error('❌ Localization fetch error:', err);
    } finally {
      isFetching.current = false;
      setIsLoading(false);
    }
  }, [searchLocalizationStrings, toast]);
  
  useEffect(() => {
    // Prevent duplicate initialization in React StrictMode
    if (hasInitialized.current) {
      console.log('⚠️ LocalizationVisualizer already initialized, skipping...');
      return;
    }
    
    hasInitialized.current = true;
    let isMounted = true;
    
    async function loadModules() {
      try {
        const res = await fetch('/data/dj/common-masters/StateInfo.json');
        if (!res.ok) throw new Error('Failed to fetch modules');
        const stateInfo = await res.json();
        const fetchedModules = (stateInfo.StateInfo && stateInfo.StateInfo[0] && stateInfo.StateInfo[0].localizationModules)
          ? stateInfo.StateInfo[0].localizationModules.map((m: { value: string }) => m.value)
          : [];
        
        if (isMounted) {
          setModules(fetchedModules);
          console.log(`📂 Loaded ${fetchedModules.length} localization modules`);
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        toast({
          title: 'Module Load Error',
          description: `Failed to load modules from StateInfo.json: ${errorMsg}`,
          variant: 'destructive',
        });
        console.error('❌ Failed to load modules:', err);
      }
    }
    
    console.log('🚀 LocalizationVisualizer initializing... (StrictMode-safe)');
    loadModules();
    fetchData(true);
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, []); // ✅ Empty dependency array to prevent loops

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
    console.log('🔄 Refreshing data after string addition...');
    fetchData(true); // Force fresh fetch after adding new string
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
            <Button 
              variant="outline" 
              onClick={() => fetchData(true)} 
              className="ml-4"
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={() => setIsAddStringDialogOpen(true)} className="ml-2">
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