// src/components/ui/data-table.tsx
'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from './date-range-picker';
import { DateRange } from 'react-day-picker';
import { Download, EyeOff, Loader2, FileUp, FileText } from 'lucide-react'; // <-- Impor ikon baru
import Papa from 'papaparse';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumnPlaceholder: string;
  dateFilterColumnId: string;
  onDelete?: (selectedIds: number[]) => Promise<void>;
  meta?: any;
  exportButtonLabel?: string;
  toolbarActions?: React.ReactNode;
  // --- TAMBAHKAN PROPERTI BARU ---
  showItemReportButton?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumnPlaceholder,
  dateFilterColumnId,
  onDelete,
  meta,
  exportButtonLabel = 'Export',
  toolbarActions,
  // --- GUNAKAN PROPERTI BARU ---
  showItemReportButton = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 25,
  });

  const [isExporting, setIsExporting] = React.useState(false);
  const [isExportingCsv, setIsExportingCsv] = React.useState(false);
  // --- STATE BARU UNTUK LAPORAN ITEM ---
  const [isExportingItemReport, setIsExportingItemReport] =
    React.useState(false);

  const table = useReactTable({
    data,
    columns,
    meta,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
      columnVisibility,
      globalFilter,
    },
  });

  // --- FUNGSI BARU UNTUK LAPORAN PER ITEM ---
  const handleExportItemsReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      alert('Please select a date range to generate the report.');
      return;
    }
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => (row.original as any).id);

    if (selectedIds.length === 0) {
      alert('Please select items to include in the report.');
      return;
    }

    setIsExportingItemReport(true);
    try {
      const response = await fetch('/api/report/by-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: selectedIds,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate item report');
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'Laporan_per_Item.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Item Report Export failed:', error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setIsExportingItemReport(false);
    }
  };

  const handleExportSelected = () => {
    setIsExportingCsv(true);
    try {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original as any);

      if (selectedRows.length === 0) {
        alert('Please select rows to export.');
        return;
      }

      const formattedData = selectedRows.map((row) => ({
        date: new Date(row.date).toLocaleDateString('en-CA'),
        itemName: row.item?.name || '',
        payee: row.payee,
        amount: row.amount,
        balanceSheetName: row.balanceSheet?.name || '',
      }));

      const csv = Papa.unparse(formattedData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'export_for_import.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('CSV Export failed:', error);
      alert('An error occurred during the CSV export.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      alert('Please select a date range to export the report.');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'Laporan_Triwulan.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('An error occurred while generating the report.');
    } finally {
      setIsExporting(false);
    }
  };

  React.useEffect(() => {
    const dateColumn = table.getColumn(dateFilterColumnId);
    if (dateColumn) {
      if (dateRange?.from && dateRange?.to) {
        dateColumn.setFilterValue([dateRange.from, dateRange.to]);
      } else {
        dateColumn.setFilterValue(undefined);
      }
    }
  }, [dateRange, table, dateFilterColumnId]);

  return (
    <div>
      <div className="flex items-center py-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder={`Filter ${filterColumnPlaceholder}...`}
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </div>

        <div className="ml-auto flex items-center space-x-2">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <>
              {/* --- TOMBOL BARU DITAMPILKAN SECARA KONDISIONAL --- */}
              {showItemReportButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportItemsReport}
                  disabled={isExportingItemReport}
                >
                  {isExportingItemReport ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Report Laporan (
                  {table.getFilteredSelectedRowModel().rows.length})
                </Button>
              )}
              {!showItemReportButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSelected}
                  disabled={isExportingCsv}
                >
                  {isExportingCsv ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileUp className="mr-2 h-4 w-4" />
                  )}
                  Export CSV ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (!onDelete) return;
                  const selectedIds = table
                    .getFilteredSelectedRowModel()
                    .rows.map((row) => (row.original as any).id);
                  await onDelete(selectedIds);
                  table.resetRowSelection();
                }}
                disabled={!onDelete}
              >
                Delete ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            </>
          )}
          {toolbarActions}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? 'Exporting...' : exportButtonLabel}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <EyeOff className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
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
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
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
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
