import { type Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown, ChevronDown } from "lucide-react";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  compact?: boolean;
}

export function DataTablePagination<TData>({
  table,
  compact = false,
}: DataTablePaginationProps<TData>) {
  return (
    <div
      className={`flex items-center justify-between px-2 ${
        compact ? "py-2" : "py-4"
      }`}
    >
      <div
        className={`${
          compact ? "text-xs" : "text-sm"
        } flex-1 text-muted-foreground`}
      >
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div
        className={`flex items-center ${
          compact ? "space-x-4" : "space-x-6"
        } lg:space-x-8`}
      >
        <div className="flex items-center space-x-2">
          <p className={`${compact ? "text-xs" : "text-sm"} font-medium`}>
            Rows per page
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger
              className={`${compact ? "h-7 w-[64px]" : "h-8 w-[70px]"}`}
            >
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
        <div
          className={`flex ${
            compact ? "w-[90px] text-xs" : "w-[100px] text-sm"
          } items-center justify-center font-medium`}
        >
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className={`hidden ${compact ? "h-7 w-7" : "h-8 w-8"} p-0 lg:flex`}
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ArrowUp className="h-4 w-4 rotate-180" />
          </Button>
          <Button
            variant="outline"
            className={`${compact ? "h-7 w-7" : "h-8 w-8"} p-0`}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <Button
            variant="outline"
            className={`${compact ? "h-7 w-7" : "h-8 w-8"} p-0`}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
          <Button
            variant="outline"
            className={`hidden ${compact ? "h-7 w-7" : "h-8 w-8"} p-0 lg:flex`}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ArrowDown className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
