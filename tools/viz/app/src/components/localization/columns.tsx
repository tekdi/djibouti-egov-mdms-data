"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  LocalizationString,
  SupportedLanguage,
} from "@/types/localization";
import { SUPPORTED_LANGUAGES } from "@/types/localization";
import { EditableCell } from "./EditableCell";

export const getColumns = (
  onUpdateString: (
    code: string,
    module: string,
    lang: SupportedLanguage,
    value: string
  ) => void
): ColumnDef<LocalizationString>[] => [
  {
    accessorKey: "code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2 text-left justify-start"
        >
          Locale Code
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    size: 200,
    minSize: 150,
    maxSize: 250,
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return (
        <div
          className="text-sm font-medium break-all"
          style={{
            wordWrap: "break-word",
            overflowWrap: "break-word",
            wordBreak: "break-all",
          }}
        >
          {value}
        </div>
      );
    },
  },
  {
    accessorKey: "module",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2 text-left justify-start"
        >
          Module
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    size: 150,
    minSize: 120,
    maxSize: 200,
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return (
        <div
          className="text-sm max-w-[200px] truncate whitespace-nowrap overflow-hidden text-ellipsis"
          title={value}
        >
          {value}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableColumnFilter: true,
  },
  ...SUPPORTED_LANGUAGES.map(
    (lang): ColumnDef<LocalizationString> => ({
      accessorKey: `translations.${lang}`,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-2 text-left justify-start"
          >
            {lang.toUpperCase()}
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      size: lang === "en" ? 250 : 200, // Give English column a bit more space as it's the base
      minSize: 180,
      maxSize: 300,
      cell: ({ row }) => {
        const value =
          (row.original.translations && row.original.translations[lang]) || "";
        return (
          <EditableCell
            value={value}
            onSave={(newValue) =>
              onUpdateString(
                row.original.code,
                row.original.module,
                lang,
                newValue
              )
            }
          />
        );
      },
    })
  ),
  {
    id: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2 text-left justify-start"
        >
          Status (FR)
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    size: 120,
    minSize: 100,
    maxSize: 150,
    cell: ({ row }) => {
      const isComplete =
        row.original.translations?.fr &&
        row.original.translations.fr.trim() !== "";
      return (
        <div className="flex justify-center">
          {isComplete ? (
            <Badge variant="default" className="bg-green-600 text-xs">
              Complete
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              Missing
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const isComplete =
        row.original.translations?.fr &&
        row.original.translations.fr.trim() !== "";
      const status = isComplete ? "complete" : "missing";
      return value.includes(status);
    },
    sortingFn: (rowA, rowB) => {
      const isCompleteA = !!rowA.original.translations?.fr?.trim();
      const isCompleteB = !!rowB.original.translations?.fr?.trim();
      if (isCompleteA === isCompleteB) return 0;
      return isCompleteA ? -1 : 1;
    },
    enableColumnFilter: true,
  },
];
