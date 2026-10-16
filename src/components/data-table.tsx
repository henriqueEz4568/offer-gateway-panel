import type { ReactNode } from "react";
import { Skeleton } from "./ui/skeleton";
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export type DataTableColumn<T> = {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  /** Visually hidden header (e.g. for an actions column). */
  srOnlyHeader?: boolean;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Rendered when there are no rows and nothing is loading. */
  emptyState?: ReactNode;
  getRowKey: (row: T, index: number) => string;
  loading?: boolean;
  loadingLabel?: string;
  limit?: number;
  onPaginationChange?: (pagination: { page: number; limit: number }) => void;
  page?: number;
  paginationEnabled?: boolean;
  skeletonRows?: number;
};

export function DataTable<T>({
  columns,
  data,
  emptyState = (
    <p className="py-10 text-center text-sm text-muted-foreground">
      Nenhum registro encontrado.
    </p>
  ),
  getRowKey,
  limit = 20,
  loading = false,
  loadingLabel = "Carregando...",
  onPaginationChange,
  page = 1,
  paginationEnabled = false,
  skeletonRows = 5,
}: DataTableProps<T>) {
  // The API does not return a total; a short page means it is the last one.
  const hasNextPage = data.length >= limit;
  const showPagination = paginationEnabled && (page > 1 || hasNextPage);

  function goTo(nextPage: number) {
    onPaginationChange?.({ page: nextPage, limit });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xs">
      <div className="overflow-x-auto">
        <Table aria-busy={loading}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead className={column.className} key={column.header}>
                  {column.srOnlyHeader ? (
                    <span className="sr-only">{column.header}</span>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRows }, (_, rowIndex) => (
                <TableRow className="hover:bg-transparent" key={rowIndex}>
                  {columns.map((column, columnIndex) => (
                    <TableCell key={column.header}>
                      {rowIndex === 0 && columnIndex === 0 ? (
                        <span className="sr-only">{loadingLabel}</span>
                      ) : null}
                      <Skeleton className="h-4 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length ? (
              data.map((row, index) => (
                <TableRow key={getRowKey(row, index)}>
                  {columns.map((column) => (
                    <TableCell className={column.className} key={column.header}>
                      {typeof column.accessor === "function"
                        ? column.accessor(row)
                        : String(row[column.accessor] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length}>{emptyState}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination ? (
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">Página {page}</p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={loading || page <= 1}
                  onClick={() => goTo(page - 1)}
                />
              </PaginationItem>
              {page > 1 ? (
                <PaginationItem>
                  <PaginationButton disabled={loading} onClick={() => goTo(page - 1)}>
                    {page - 1}
                  </PaginationButton>
                </PaginationItem>
              ) : null}
              <PaginationItem>
                <PaginationButton isActive>{page}</PaginationButton>
              </PaginationItem>
              {hasNextPage ? (
                <PaginationItem>
                  <PaginationButton disabled={loading} onClick={() => goTo(page + 1)}>
                    {page + 1}
                  </PaginationButton>
                </PaginationItem>
              ) : null}
              <PaginationItem>
                <PaginationNext
                  disabled={loading || !hasNextPage}
                  onClick={() => goTo(page + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
