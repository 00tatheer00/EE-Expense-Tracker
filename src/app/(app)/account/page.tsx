import { getProfiles, requireMember } from "@/lib/data";
import { initials } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const { profile } = await requireMember();
  const team = await getProfiles();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Account" description="Your profile, password and the authorized team." />

      <div className="space-y-6">
        <section className="card card-pad flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-lg font-semibold text-white">
            {initials(profile.full_name)}
          </div>
          <div>
            <div className="text-base font-semibold text-navy-900">{profile.full_name}</div>
            <div className="text-sm text-ink-subtle">{profile.email}</div>
          </div>
        </section>

        <section className="card card-pad">
          <div className="card-title">Change password</div>
          <div className="card-sub">Use at least 8 characters.</div>
          <PasswordForm />
        </section>

        <section className="card overflow-hidden">
          <div className="px-5 pb-3 pt-5 sm:px-6">
            <div className="card-title">Authorized users</div>
            <div className="card-sub">Everyone here can view and manage all divisions and receives new-expense emails.</div>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            {team.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                  {initials(u.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">
                    {u.full_name} {u.id === profile.id && <span className="text-xs text-ink-subtle">(you)</span>}
                  </div>
                  <div className="truncate text-xs text-ink-subtle">{u.email}</div>
                </div>
                <span
                  className={`badge ${u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-ink-subtle"}`}
                >
                  {u.is_active ? "Active" : "Disabled"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
