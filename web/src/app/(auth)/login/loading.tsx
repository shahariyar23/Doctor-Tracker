export default function LoginLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
        <p className="text-xs font-medium text-slate-500">
          Loading authentication workspace...
        </p>
      </div>
    </div>
  );
}

