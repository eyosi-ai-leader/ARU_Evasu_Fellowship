"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function getPages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

export default function MemberPagination({
  pagination,
  onPageChange,
}) {
  const {
    page,
    totalPages,
    total,
    limit,
  } = pagination;

  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const pages = getPages(page, totalPages);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-center text-xs font-medium text-slate-400 sm:text-left">
        Showing{" "}
        <span className="font-semibold text-slate-600">
          {start}
        </span>{" "}
        to{" "}
        <span className="font-semibold text-slate-600">
          {end}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-600">
          {total}
        </span>{" "}
        members
      </p>

      <div className="flex items-center justify-between gap-1 sm:justify-end">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Phones: one short label instead of every page number */}
        <span className="px-3 text-xs font-semibold text-slate-500 sm:hidden">
          Page {page} of {totalPages}
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((item, index) =>
            item === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-8 items-center justify-center text-xs text-slate-400"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={page === item ? "page" : undefined}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                  page === item
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}