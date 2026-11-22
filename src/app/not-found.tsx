import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <LogoMark className="h-12 w-12" />
      <h1 className="mt-6 text-2xl font-semibold text-navy-900">Page not found</h1>
      <p className="mt-2 text-sm text-ink-subtle">The page or expense you’re looking for doesn’t exist.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}
