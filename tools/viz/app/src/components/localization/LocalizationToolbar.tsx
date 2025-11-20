import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';

interface LocalizationToolbarProps {
  onAddString: () => void;
  modules: string[];
  filters: {
    locale: string;
    translation: string;
    module: string;
    status: string;
  };
  onFilterChange: (filters: Partial<LocalizationToolbarProps['filters']>) => void;
}

export function LocalizationToolbar({
  onAddString,
  modules,
  filters,
  onFilterChange,
}: LocalizationToolbarProps) {
  return (
    <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-4 flex-wrap">
      <Button onClick={onAddString}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add New String
      </Button>

      <Input
        placeholder="Filter by Locale Code..."
        value={filters.locale}
        onChange={(e) => onFilterChange({ locale: e.target.value })}
        className="max-w-xs"
      />
      <Input
        placeholder="Filter by Translation..."
        value={filters.translation}
        onChange={(e) => onFilterChange({ translation: e.target.value })}
        className="max-w-xs"
      />
      <Select
        value={filters.module}
        onValueChange={(value) => onFilterChange({ module: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Modules" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Modules</SelectItem>
          {modules.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.status}
        onValueChange={(value) => onFilterChange({ status: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Statuses</SelectItem>
          <SelectItem value="missing">Missing Translations</SelectItem>
          <SelectItem value="complete">Complete</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 