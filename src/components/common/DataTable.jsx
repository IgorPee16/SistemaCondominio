import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function DataTable({
  columns,
  data,
  isLoading,
  searchable = true,
  searchPlaceholder = "Buscar...",
  onSearch,
  searchValue,
  pagination,
  onPageChange,
  emptyMessage = "Nenhum registro encontrado",
  actions
}) {
  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)] overflow-hidden">
      {(searchable || actions) && (
        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-3 justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearch?.(e.target.value)}
                className="pl-9 bg-transparent border-[var(--border)]"
              />
            </div>
          )}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--border)] hover:bg-transparent">
              {columns.map((column, index) => (
                <TableHead 
                  key={index}
                  className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-[var(--text-muted)]">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow 
                  key={row.id || rowIndex} 
                  className="border-[var(--border)] hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className="text-sm text-[var(--text-main)]">
                      {column.cell ? column.cell(row) : row[column.accessor]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Mostrando {pagination.from} - {pagination.to} de {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="border-[var(--border)]"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="border-[var(--border)]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}