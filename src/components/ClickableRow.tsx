"use client";

import { useRouter } from "next/navigation";

/** A table row that opens `href` when clicked anywhere (and prefetches on hover). */
export function ClickableRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-emerald-50/40"
      onClick={(e) => {
        // Let real links / buttons inside the row behave normally (incl. ctrl/cmd-click).
        if ((e.target as HTMLElement).closest("a,button")) return;
        router.push(href);
      }}
      onMouseEnter={() => router.prefetch(href)}
    >
      {children}
    </tr>
  );
}
