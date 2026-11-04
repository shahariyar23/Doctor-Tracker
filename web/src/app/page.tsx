import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Doctor Tracker</h1>
      <p className="text-muted-foreground">Frontend application initialized successfully.</p>
      <div className="flex gap-4">
        <Link href="/login" className="text-sm underline underline-offset-4">
          Login
        </Link>
        <Link href="/dashboard" className="text-sm underline underline-offset-4">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
