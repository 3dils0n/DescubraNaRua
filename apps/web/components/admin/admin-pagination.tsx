"use client";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
};

export function AdminPagination({ page, pageSize, total, onPageChange }: Props) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-[#888]">
      <span>
        {from}–{to} de {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-[#E0E0E0] hover:border-[#D4AF37]/40 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <span className="px-2 py-1.5 text-[#666]">
          {page} / {last}
        </span>
        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-[#E0E0E0] hover:border-[#D4AF37]/40 disabled:opacity-40"
          disabled={page >= last}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
