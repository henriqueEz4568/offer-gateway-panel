import type { ReactNode } from "react";

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
};

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "Nenhum registro encontrado.",
  getRowKey,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              {columns.map((column) => (
                <th className={`px-4 py-3 font-semibold ${column.className ?? ""}`} key={column.header}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {data.length ? (
              data.map((row, index) => (
                <tr className="align-top text-zinc-700" key={getRowKey(row, index)}>
                  {columns.map((column) => (
                    <td className={`px-4 py-3 ${column.className ?? ""}`} key={column.header}>
                      {typeof column.accessor === "function"
                        ? column.accessor(row)
                        : String(row[column.accessor] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-500" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
