"use client";

/**
 * Voxy V2 — Skeleton Components
 *
 * Matches the dark design language exactly:
 *   - bg-white/[0.06] animated pulse on dark bg
 *   - Rounded corners consistent with existing cards
 *
 * Usage:
 *   <SkeletonText />                    – single line of text
 *   <SkeletonCard />                    – stat/KPI card
 *   <SkeletonTable rows={6} cols={4} /> – full table with thead + rows
 *   <SkeletonRow cols={4} />            – single table row
 */

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-white/[0.06] rounded-md ${className}`}
    />
  );
}

export function SkeletonText({ className = "" }) {
  return <Skeleton className={`h-4 ${className || "w-32"}`} />;
}

/** Matches the existing stat card shape */
export function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02]">
      <Skeleton className="size-9 rounded-lg shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/** Single table row skeleton */
export function SkeletonRow({ cols = 4 }) {
  return (
    <tr className="border-t border-white/[0.04]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className={`h-4 ${i === 0 ? "w-32" : "w-20"}`} />
        </td>
      ))}
    </tr>
  );
}

/** Full table skeleton — thead + N body rows */
export function SkeletonTable({ rows = 6, cols = 4, headers = [] }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
      <table className="w-full text-sm">
        {headers.length > 0 && (
          <thead>
            <tr className="border-b border-white/[0.06]">
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Mobile card skeleton */
export function SkeletonMobileCard() {
  return (
    <div className="p-4 border-b border-white/[0.04] space-y-2">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

/** Inline refresh indicator — silenced, no longer shown to the user */
export function RefreshIndicator({ isFetching: _ }) {
  return null;
}
