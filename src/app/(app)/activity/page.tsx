import Link from "next/link";
import { getActivity, type ActivityAction } from "@/lib/activity";
import { cn } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/ui";
import { ActivityList } from "@/components/ActivityList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activity" };

const TABS: { key: "" | ActivityAction; label: string }[] = [
  { key: "", label: "All" },
  { key: "created", label: "Added" },
  { key: "updated", label: "Edited" },
  { key: "deleted", label: "Deleted" },
];

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const sp = await searchParams;
  const type = (["created", "updated", "deleted"] as const).find((t) => t === sp.type);
  const items = await getActivity({ action: type, limit: 200 });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Activity"
        description="Every expense added, edited or deleted — and who did it."
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => {
          const active = (type ?? "") === t.key;
          return (
            <Link
              key={t.label}
              href={t.key ? `/activity?type=${t.key}` : "/activity"}
              className={cn(
                "flex h-9 shrink-0 items-center rounded-full border px-4 text-[13px] font-medium transition active:scale-95",
                active
                  ? t.key === "deleted"
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-navy-900 bg-navy-900 text-white"
                  : "border-line bg-white text-ink-muted",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        {items.length ? (
          <ActivityList items={items} />
        ) : (
          <EmptyState
            title={type === "deleted" ? "No deleted expenses" : "No activity yet"}
            description={
              type === "deleted"
                ? "When someone deletes an expense, it will appear here with their name."
                : "Activity appears here as the team adds, edits and deletes expenses."
            }
          />
        )}
      </div>
    </div>
  );
}
