# Generic Data Table Architecture Documentation

## Overview

This document outlines the complete data table architecture for visualization tools, including data structures, search capabilities, caching strategies, and component relationships. This architecture can be applied to any tabular data including localization strings, role-action mappings, user management, and other structured datasets.

## Core Technologies

- **@tanstack/react-table**: Primary table library providing sorting, filtering, pagination, and column management
- **Fuse.js**: Fuzzy search implementation for content searching across multiple fields
- **Workbox/Service Workers**: Caching layer for API requests (optional)
- **React**: Component framework with hooks for state management
- **TypeScript**: Type safety and improved developer experience

## Generic Data Structure

### Base Data Interface

```typescript
interface BaseDataItem {
  id: string | number; // Unique identifier
  [key: string]: any; // Flexible structure for any data type
}

// Example implementations:
interface LocalizationString extends BaseDataItem {
  code: string; // Unique locale code identifier
  module: string; // Module/namespace the string belongs to
  translations: {
    en?: string; // English translation
    fr?: string; // French translation
    [key: string]: string | undefined; // Support for additional languages
  };
  status: "complete" | "missing"; // Translation completion status
}

interface RoleAction extends BaseDataItem {
  roleCode: string;
  actionCode: string;
  module: string;
  enabled: boolean;
  createdDate: string;
  lastModified: string;
}

interface RoleActionMapping extends BaseDataItem {
  tenantId: string;
  roleCode: string;
  actionCode: string;
  businessService: string;
  workflowState?: string;
}
```

## Component Architecture

### Generic DataTable Component

**Location**: `src/components/common/GenericDataTable.tsx`

#### Props Interface

```typescript
interface GenericDataTableProps<T extends BaseDataItem> {
  columns: ColumnDef<T>[]; // TanStack table column definitions
  data: T[]; // Raw data array
  searchableFields: SearchFieldConfig[]; // Configuration for searchable fields
  filterableFields: FilterFieldConfig[]; // Configuration for filterable fields
  onAddItem?: () => void; // Optional callback for adding new items
  onEditItem?: (item: T) => void; // Optional callback for editing items
  onDeleteItem?: (item: T) => void; // Optional callback for deleting items
  cacheConfig?: CacheConfig; // Optional caching configuration
}

interface SearchFieldConfig {
  key: string; // Field key to search
  weight?: number; // Search weight (0-1)
  threshold?: number; // Fuzzy search threshold
  label: string; // UI label for search input
  type: "exact" | "fuzzy"; // Search type
}

interface FilterFieldConfig {
  key: string; // Field key to filter
  label: string; // UI label for filter
  type: "select" | "multiselect" | "date" | "boolean";
  options?: Array<{ value: string; label: string }>; // For select types
}

interface CacheConfig {
  apiEndpoint: string; // API endpoint to cache
  cacheName: string; // Cache storage name
  maxEntries: number; // Maximum cache entries
  maxAgeSeconds: number; // Cache expiration time
}
```

#### Key Features

1. **Multi-layered Search System**

   - Configurable field searching (exact or fuzzy matching)
   - Multiple search inputs with independent operation
   - Combined search capability with result intersection

2. **Advanced Filtering**

   - Dynamic filter generation based on field configuration
   - Multiple filter types (select, multiselect, date, boolean)
   - Column visibility toggles

3. **Table Management**
   - Sortable columns
   - Resizable columns
   - Pagination
   - Row selection
   - Bulk operations

## Search Architecture

### Configurable Fuse.js Implementation

#### Dynamic Search Configuration

```typescript
const createSearchInstance = (data: T[], config: SearchFieldConfig) => {
  return new Fuse(data, {
    keys: [{ name: config.key, weight: config.weight || 1.0 }],
    threshold: config.threshold || (config.type === "exact" ? 0.1 : 0.4),
    includeScore: true,
    ignoreLocation: true,
  });
};

// Example configurations for different data types:
const localizationSearchFields: SearchFieldConfig[] = [
  {
    key: "code",
    type: "exact",
    threshold: 0.2,
    label: "Search locale codes...",
    weight: 1.0,
  },
  {
    key: "translations.en",
    type: "fuzzy",
    threshold: 0.4,
    label: "Search English translations...",
    weight: 0.6,
  },
  {
    key: "translations.fr",
    type: "fuzzy",
    threshold: 0.4,
    label: "Search French translations...",
    weight: 0.4,
  },
];

const roleActionSearchFields: SearchFieldConfig[] = [
  {
    key: "roleCode",
    type: "exact",
    threshold: 0.2,
    label: "Search role codes...",
    weight: 1.0,
  },
  {
    key: "actionCode",
    type: "exact",
    threshold: 0.2,
    label: "Search action codes...",
    weight: 1.0,
  },
  {
    key: "module",
    type: "fuzzy",
    threshold: 0.3,
    label: "Search modules...",
    weight: 0.8,
  },
];
```

### Search Logic Flow

1. **Dynamic Search Creation**: Search instances created based on field configuration
2. **Individual Searches**: Each search input operates independently
3. **Result Intersection**: When multiple searches have values, results are intersected
4. **Performance Optimization**: Searches are memoized and only re-run when data changes

## State Management

### Generic Table State

```typescript
const [sorting, setSorting] = useState<SortingState>([]);
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
const [rowSelection, setRowSelection] = useState({});
const [globalFilter, setGlobalFilter] = useState("");
```

### Dynamic Search State

```typescript
const [searchStates, setSearchStates] = useState<Record<string, string>>({});
const [filteredData, setFilteredData] = useState<T[]>(data);
```

## Column Configuration

### Dynamic Column Definition

```typescript
// Generic column helpers
const createTextColumn = <T>(
  accessorKey: keyof T,
  header: string,
  options?: Partial<ColumnDef<T>>
): ColumnDef<T> => ({
  accessorKey,
  header,
  cell: ({ getValue }) => (
    <span className="truncate">{getValue() as string}</span>
  ),
  ...options,
});

const createStatusColumn = <T>(
  accessorKey: keyof T,
  header: string,
  statusConfig: Record<string, { label: string; className: string }>
): ColumnDef<T> => ({
  accessorKey,
  header,
  cell: ({ getValue }) => {
    const status = getValue() as string;
    const config = statusConfig[status] || { label: status, className: "" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${config.className}`}>
        {config.label}
      </span>
    );
  },
});

const createActionColumn = <T>(
  onEdit?: (item: T) => void,
  onDelete?: (item: T) => void
): ColumnDef<T> => ({
  id: "actions",
  header: "Actions",
  cell: ({ row }) => (
    <div className="flex gap-2">
      {onEdit && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(row.original)}
        >
          Edit
        </Button>
      )}
      {onDelete && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(row.original)}
        >
          Delete
        </Button>
      )}
    </div>
  ),
});
```

### Resizable Columns

- **Fixed table layout** with explicit column sizing
- **Dynamic resizing** via drag handles
- **Responsive overflow** handling with proper text wrapping
- **Border styling** for visual column separation

## Performance Optimizations

### Memoization Strategy

```typescript
// Memoized search instances
const searchInstances = React.useMemo(() => {
  return searchableFields.reduce((acc, config) => {
    acc[config.key] = createSearchInstance(data, config);
    return acc;
  }, {} as Record<string, Fuse<T>>);
}, [data, searchableFields]);
```

### Search Effect Optimization

```typescript
React.useEffect(() => {
  let results = data;

  // Apply all active searches
  Object.entries(searchStates).forEach(([fieldKey, searchValue]) => {
    if (searchValue.trim() && searchInstances[fieldKey]) {
      const searchResults = searchInstances[fieldKey].search(searchValue);
      const searchResultItems = searchResults.map((result) => result.item);

      if (results === data) {
        results = searchResultItems;
      } else {
        // Intersection with previous results
        results = results.filter((item) =>
          searchResultItems.some((searchItem) => searchItem.id === item.id)
        );
      }
    }
  });

  setFilteredData(results);
}, [searchStates, searchInstances, data]);
```

## Generic Caching Strategy (Service Worker)

### Configurable Workbox Implementation

```typescript
const createCacheConfig = (config: CacheConfig) => ({
  urlPattern: ({ url }: { url: URL }) =>
    url.pathname.startsWith(config.apiEndpoint),
  handler: "StaleWhileRevalidate",
  method: "POST",
  options: {
    cacheName: config.cacheName,
    expiration: {
      maxEntries: config.maxEntries,
      maxAgeSeconds: config.maxAgeSeconds,
    },
    cacheableResponse: {
      statuses: [0, 200],
    },
    plugins: [
      (() => {
        let cacheableRequest: Request | null = null;
        return {
          requestWillFetch: async function ({ request }: { request: Request }) {
            cacheableRequest = request.clone();
            return request;
          },
          cacheKeyWillBeUsed: async function () {
            if (cacheableRequest) {
              const body = await cacheableRequest.json();
              const key = `${cacheableRequest.url}?body=${JSON.stringify(
                body
              )}`;
              cacheableRequest = null;
              return key;
            }
            return "default-cache-key";
          },
        };
      })(),
    ],
  },
});

// Example cache configurations
const cacheConfigs = {
  localization: {
    apiEndpoint: "/api/localization/messages/v1/_search",
    cacheName: "localization-api-cache",
    maxEntries: 50,
    maxAgeSeconds: 300,
  },
  roleActions: {
    apiEndpoint: "/api/access/actions/v1/_search",
    cacheName: "role-actions-cache",
    maxEntries: 100,
    maxAgeSeconds: 600,
  },
  roleActionMappings: {
    apiEndpoint: "/api/access/roleactions/v1/_search",
    cacheName: "role-action-mappings-cache",
    maxEntries: 200,
    maxAgeSeconds: 600,
  },
};
```

## UI Components

### Dynamic Search Controls

```typescript
const SearchControls = <T>({
  searchFields,
  searchStates,
  onSearchChange,
}: {
  searchFields: SearchFieldConfig[];
  searchStates: Record<string, string>;
  onSearchChange: (field: string, value: string) => void;
}) => (
  <div className="flex items-center gap-4">
    {searchFields.map((field) => (
      <Input
        key={field.key}
        placeholder={field.label}
        value={searchStates[field.key] || ""}
        onChange={(e) => onSearchChange(field.key, e.target.value)}
        className="max-w-xs"
      />
    ))}
  </div>
);
```

### Dynamic Filter Controls

```typescript
const FilterControls = <T>({
  filterFields,
  table,
  data,
}: {
  filterFields: FilterFieldConfig[];
  table: Table<T>;
  data: T[];
}) => (
  <div className="flex items-center gap-4">
    {filterFields.map((filter) => {
      if (filter.type === "select") {
        const options = filter.options || getUniqueValues(data, filter.key);
        return (
          <Select
            key={filter.key}
            value={
              (table.getColumn(filter.key)?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table
                .getColumn(filter.key)
                ?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      // Add other filter types as needed
      return null;
    })}
  </div>
);
```

## Data Flow

### Generic Input to Output Pipeline

1. **Raw Data**: `T[]` from props
2. **Search Filtering**: Applied via configurable Fuse.js instances
3. **Table Filtering**: Dynamic filters based on field configuration
4. **Sorting**: Column-based sorting via TanStack
5. **Pagination**: Chunked display via TanStack
6. **Rendering**: Final table output with all transformations applied

### State Synchronization

- **Search State** → **Filtered Data** → **Table Data**
- **Filter State** → **Column Filters** → **Visible Data**
- **Column State** → **Visibility** → **Rendered Columns**
- **Selection State** → **Row Highlighting** → **Action Availability**

## Usage Examples

### Localization Table Implementation

```typescript
const LocalizationTable = () => {
  const columns = [
    createTextColumn("code", "Code"),
    createTextColumn("module", "Module"),
    createTextColumn("translations.en", "English"),
    createTextColumn("translations.fr", "French"),
    createStatusColumn("status", "Status", {
      complete: { label: "Complete", className: "bg-green-100 text-green-800" },
      missing: { label: "Missing", className: "bg-red-100 text-red-800" },
    }),
    createActionColumn(handleEdit, handleDelete),
  ];

  return (
    <GenericDataTable
      data={localizationData}
      columns={columns}
      searchableFields={localizationSearchFields}
      filterableFields={localizationFilterFields}
      cacheConfig={cacheConfigs.localization}
      onAddItem={handleAdd}
    />
  );
};
```

### Role-Action Table Implementation

```typescript
const RoleActionTable = () => {
  const columns = [
    createTextColumn("roleCode", "Role Code"),
    createTextColumn("actionCode", "Action Code"),
    createTextColumn("module", "Module"),
    createStatusColumn("enabled", "Status", {
      true: { label: "Enabled", className: "bg-green-100 text-green-800" },
      false: { label: "Disabled", className: "bg-gray-100 text-gray-800" },
    }),
    createTextColumn("createdDate", "Created"),
    createActionColumn(handleEdit, handleDelete),
  ];

  return (
    <GenericDataTable
      data={roleActionData}
      columns={columns}
      searchableFields={roleActionSearchFields}
      filterableFields={roleActionFilterFields}
      cacheConfig={cacheConfigs.roleActions}
      onAddItem={handleAdd}
    />
  );
};
```

## Development Guidelines

### Adding New Table Types

1. Define data interface extending `BaseDataItem`
2. Configure search fields with appropriate types and weights
3. Configure filter fields based on data structure
4. Define columns using generic column helpers
5. Set up caching configuration if needed
6. Implement CRUD callbacks as required

### Extending Search Functionality

1. Add new `SearchFieldConfig` entries to configuration
2. Update search state management to include new fields
3. Test search combination behavior with existing fields
4. Consider performance impact of additional search instances

### Performance Considerations

1. Memoize expensive computations using `React.useMemo`
2. Use appropriate search thresholds for different field types
3. Debounce search inputs for better UX
4. Consider data virtualization for large datasets
5. Implement progressive loading for server-side pagination

## Testing Strategy

### Unit Testing Focus Areas

- Generic search logic with various field configurations
- Column filtering and sorting behavior across different data types
- State management and effect dependencies
- Error boundary conditions for malformed data

### Integration Testing

- Full search workflow from input to results across different table types
- Column interaction and table state management
- Data loading and error handling scenarios
- Cache behavior with different API endpoints

### Performance Testing

- Large dataset handling (1000+ rows) across different data structures
- Search performance with complex queries and multiple fields
- Memory usage during extended table interactions
- Cache effectiveness and invalidation behavior
