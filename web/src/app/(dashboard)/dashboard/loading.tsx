export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 w-full max-w-md rounded-xl bg-muted/60" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 sm:h-28 rounded-xl border border-border/60 bg-muted/50 p-4"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 h-72 sm:h-80 rounded-xl border border-border/60 bg-muted/50" />
        <div className="lg:col-span-4 h-72 sm:h-80 rounded-xl border border-border/60 bg-muted/50" />
        <div className="lg:col-span-3 h-72 sm:h-80 rounded-xl border border-border/60 bg-muted/50" />
      </div>
    </div>
  );
}

