import { requireMember, getDivisions } from "@/lib/data";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireMember();
  const divisions = await getDivisions();

  return (
    <AppShell
      user={{ name: profile.full_name, email: profile.email }}
      divisions={divisions.map((d) => ({ slug: d.slug, name: d.short_name, color: d.color }))}
    >
      {children}
    </AppShell>
  );
}
