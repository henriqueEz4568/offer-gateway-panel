import type { ReactNode } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
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
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  getRowKey: (row: T, index: number) => string;
  loading?: boolean;
  loadingMessage?: string;
  limit?: number;
  onPaginationChange?: (pagination: { page: number; limit: number }) => void;
  page?: number;
  pagiantionEnabled?: boolean;
  paginationEnabled?: boolean;
  setPage?: (page: number) => void;
};

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "Nenhum registro encontrado.",
  getRowKey,
  limit = 20,
  loading = false,
  loadingMessage = "Carregando...",
  onPaginationChange,
  page = 1,
  pagiantionEnabled = false,
  paginationEnabled = false,
  setPage,
}: DataTableProps<T>) {
  const shouldShowPagination = paginationEnabled || pagiantionEnabled;

  function handlePageChange(nextPage: number) {
    setPage?.(nextPage);
    onPaginationChange?.({ page: nextPage, limit });
  }

  function handlePaginationClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead className={column.className ?? ""} key={column.header}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="py-8 text-center text-zinc-500" colSpan={columns.length}>
                  {loadingMessage}
                </TableCell>
              </TableRow>
            ) : data.length ? (
              data.map((row, index) => (
                <TableRow key={getRowKey(row, index)}>
                  {columns.map((column) => (
                    <TableCell className={column.className ?? ""} key={column.header}>
                      {typeof column.accessor === "function"
                        ? column.accessor(row)
                        : String(row[column.accessor] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="py-8 text-center text-zinc-500" colSpan={columns.length}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {shouldShowPagination ? (
        <div className="border-t border-zinc-200 px-4 py-3">
          <Pagination className="justify-start sm:justify-center">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-disabled={loading || page <= 1}
                  className={loading || page <= 1 ? "pointer-events-none opacity-50" : ""}
                  href="#"
                  onClick={(event) => {
                    handlePaginationClick(event);
                    if (!loading && page > 1) {
                      handlePageChange(page - 1);
                    }
                  }}
                />
              </PaginationItem>
              {page > 2 ? (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(event) => {
                      handlePaginationClick(event);
                      if (!loading) {
                        handlePageChange(1);
                      }
                    }}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
              ) : null}
              {page > 3 ? (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : null}
              {page > 1 ? (
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={(event) => {
                      handlePaginationClick(event);
                      if (!loading) {
                        handlePageChange(page - 1);
                      }
                    }}
                  >
                    {page - 1}
                  </PaginationLink>
                </PaginationItem>
              ) : null}
              <PaginationItem>
                <PaginationLink href="#" isActive onClick={handlePaginationClick}>
                  {page}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  className={loading ? "pointer-events-none opacity-50" : ""}
                  href="#"
                  onClick={(event) => {
                    handlePaginationClick(event);
                    if (!loading) {
                      handlePageChange(page + 1);
                    }
                  }}
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  aria-disabled={loading}
                  className={loading ? "pointer-events-none opacity-50" : ""}
                  href="#"
                  onClick={(event) => {
                    handlePaginationClick(event);
                    if (!loading) {
                      handlePageChange(page + 1);
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
