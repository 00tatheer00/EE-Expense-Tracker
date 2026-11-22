"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";

export function YearSelect({ years, value }: { years: number[]; value: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="relative inline-flex items-center">
      <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-ink-subtle" />
      <span className="sr-only">Year</span>
      <select
        className="input h-10 w-[120px] pl-9"
        value={value}
        onChange={(e) => {
          const p = new URLSearchParams(params.toString());
          p.set("year", e.target.value);
          router.push(`${pathname}?${p.toString()}`);
        }}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}
