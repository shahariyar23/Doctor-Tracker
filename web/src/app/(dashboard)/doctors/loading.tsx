export default function DoctorsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="h-10 w-48 rounded-lg bg-muted/60" />
        <div className="h-10 w-36 rounded-lg bg-muted/60" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl border border-border/60 bg-muted/40" />
        ))}
      </div>
      <div className="h-96 rounded-xl border border-border/60 bg-muted/30" />
    </div>
  );
}

