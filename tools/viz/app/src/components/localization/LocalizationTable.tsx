import { memo, useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { LocalizationString, SupportedLanguage } from '@/types/localization';
import { SUPPORTED_LANGUAGES } from '@/types/localization';

interface LocalizationTableProps {
  data: LocalizationString[];
  modules: string[];
  onUpdateString: (code: string, module: string, lang: SupportedLanguage, value: string) => void;
  onUpdateModule: (code: string, oldModule: string, newModule: string) => void;
}

const DEBOUNCE_DELAY = 600;

const EditableCell = memo(({
  value,
  onSave,
}: {
  value: string;
  onSave: (newValue: string) => void;
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleChange = (e: React.FormEvent<HTMLTableCellElement>) => {
    const newValue = e.currentTarget.textContent || '';
    setCurrentValue(newValue);

    if (timer) {
      clearTimeout(timer);
    }
    const newTimer = setTimeout(() => {
      onSave(newValue);
    }, DEBOUNCE_DELAY);
    setTimer(newTimer);
  };

  return (
    <TableCell
      contentEditable
      suppressContentEditableWarning
      onInput={handleChange}
      className="focus:outline-none focus:bg-blue-50"
    >
      {currentValue}
    </TableCell>
  );
});

export function LocalizationTable({
  data,
  modules,
  onUpdateString,
  onUpdateModule,
}: LocalizationTableProps) {
  return (
    <div className="bg-white overflow-hidden flex-1">
      <div className="h-full overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead className="w-[25%]">Locale Code</TableHead>
              <TableHead className="w-[15%]">Module</TableHead>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TableHead key={lang} className="w-[25%]">
                  {lang.toUpperCase()}
                </TableHead>
              ))}
              <TableHead className="w-[10%]">Status (fr)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={`${item.code}-${item.module}`}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell>
                  <Select
                    value={item.module}
                    onValueChange={(newModule) =>
                      onUpdateModule(item.code, item.module, newModule)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <EditableCell
                    key={lang}
                    value={item.translations[lang] || ''}
                    onSave={(newValue) =>
                      onUpdateString(item.code, item.module, lang, newValue)
                    }
                  />
                ))}
                <TableCell>
                  {item.translations.fr && item.translations.fr.trim() ? (
                    <Badge variant="default" className="bg-green-600">Complete</Badge>
                  ) : (
                    <Badge variant="destructive">Missing</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 