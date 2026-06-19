import { Button } from "./ui/button";

type PaginationProps = {
  page: number;
  limit: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

const limitOptions = [10, 20, 50, 100];

export function Pagination({
  page,
  limit,
  disabled = false,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-600">
        Pagina <span className="font-semibold text-zinc-950">{page}</span>
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          Limite
          <select
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition-colors focus:border-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-400"
            disabled={disabled}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            value={limit}
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <Button
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          variant="secondary"
        >
          Anterior
        </Button>
        <Button
          disabled={disabled}
          onClick={() => onPageChange(page + 1)}
          variant="secondary"
        >
          Proxima
        </Button>
      </div>
    </div>
  );
}
