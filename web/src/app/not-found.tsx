import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
      <p className="text-muted-foreground">The requested page could not be found.</p>
      <Link href="/" className="text-sm underline underline-offset-4">
        Return Home
      </Link>
    </div>
  );
}
