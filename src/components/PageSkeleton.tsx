"use client";

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-10 bg-slate-200 rounded-2xl w-2/3 max-w-xs" />
      <div className="h-28 bg-slate-200 rounded-3xl" />
      <div className="h-14 bg-slate-200 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-slate-200 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function DeckGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-40 bg-slate-200 rounded-3xl" />
      ))}
    </div>
  );
}
