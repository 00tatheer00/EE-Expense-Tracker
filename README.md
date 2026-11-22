# EE Expense Tracker

Expense management for **Emerging Edge**, **Emerging Edge School of Technology (EEST)** and **STYLONE**. It's built with Next.js 15 (App Router) and Supabase (Postgres, Auth, Storage).

- Each of the three divisions has its own expense records, categories, dashboard and reports. The database enforces this: an expense can't use another division's category.
- One central dashboard shows combined totals, monthly and yearly trends, a division comparison, category analytics and recent activity.
- Every new expense triggers an **email to all authorized users**. The email says who added it, the division, location, event or purpose, amount, category, date and notes.
- Expenses can carry an optional receipt or invoice (image or PDF). Receipts are stored in a private bucket and opened through signed links that expire.
- The expense list has search, filters and pagination. You can export to CSV (opens in Excel) or print to PDF.
- Every create, edit and delete is written to an audit trail.
- Only users on the allow-list can sign in and see data. Row Level Security enforces this on every table and on the receipts bucket.

---

## Try it instantly (demo mode)

Demo mode runs the whole app on about 14 months of sample data for all three divisions. You don't need Supabase or email settings.

```bash
npm install
echo NEXT_PUBLIC_DEMO_MODE=true > .env.local
npm run dev
```

Open <http://localhost:3000> and pick one of the three users. There's no password.

Adding, editing and deleting expenses all work. So do filters, reports, CSV export and categories. Changes are kept in memory, so they reset when the server restarts. Notification emails aren't sent; after you save an expense, use **Preview the email** to see what all three users would receive.

To switch to the real system, remove `NEXT_PUBLIC_DEMO_MODE` and follow the steps below. As a safeguard, production builds (`next build` / Vercel) ignore demo mode. That way a stray environment variable can never open a sign-in that needs no password. If you deliberately want a public demo deployment, also set `NEXT_PUBLIC_ALLOW_DEMO_IN_PRODUCTION=true`, and only on a separate project.

---

## 1. Create the Supabase project

1. Create a project at <https://supabase.com>. For lowest latency, pick a region close to Pakistan, such as Mumbai or Singapore.
2. Open `supabase/schema.sql`. In section 9, **replace the three placeholder emails** with the real addresses for Tatheer Hussain, Sir Shaheen and Komal Bibi.
3. In Supabase, go to **SQL Editor → New query**, paste the whole file and click **Run**.
4. In **Authentication → Sign In / Providers**:
   - Turn **off** "Allow new users to sign up". Only the people you create can get in.
   - Keep **Email** enabled.
5. In **Authentication → Users → Add user → Create new user**, create each of the three users with their email and a temporary password. Tick **Auto Confirm User**.
   A trigger creates each user's profile automatically from the allow-list.
6. In **Authentication → URL Configuration**:
   - Set **Site URL** to the deployed app URL, for example `https://expenses.yourdomain.com`.
   - Add `https://expenses.yourdomain.com/auth/callback` and `http://localhost:3000/auth/callback` to **Redirect URLs**. The "Forgot password" flow needs these.

## 2. Configure email (SMTP)

Notifications are sent over standard SMTP, so any provider works:

| Provider | Host | Port | Notes |
|---|---|---|---|
| Gmail / Google Workspace | `smtp.gmail.com` | 465 | Turn on 2-Step Verification, then create an **App password** |
| Resend | `smtp.resend.com` | 465 | User is `resend` and password is your API key; you must verify a domain |
| Brevo | `smtp-relay.brevo.com` | 587 (`SMTP_SECURE=false`) | Has a free tier |
| Zoho Mail | `smtp.zoho.com` | 465 | |

If email fails, **the expense is still saved**. The confirmation banner then tells the user the notification wasn't sent.

## 3. Run locally

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev                  # http://localhost:3000
```

Supabase values are in **Project Settings → API** (Project URL and the `anon` public key). The anon key is safe in the browser because RLS protects the data. Never put the `service_role` key in this app.

## 4. Deploy (Vercel recommended)

1. Push the repo to GitHub and import it into Vercel.
2. Add every variable from `.env.example` in **Settings → Environment Variables**. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
3. Deploy, then update the Supabase Site URL and Redirect URLs (step 1.6).

---

## Managing users later

Adding a user means two steps: put them on the allow-list, then create their Auth account.

```sql
insert into public.allowed_users (email, full_name) values ('new.person@company.com', 'New Person');
```

Then create the user in **Authentication → Users**.

To disable someone without deleting their history:

```sql
update public.profiles set is_active = false where email = 'person@company.com';
```

Disabled users are signed out on their next request, and they stop receiving notifications.

## Adding a new division

```sql
insert into public.divisions (slug, name, short_name, description, color, sort_order)
values ('new-venture', 'New Venture', 'New Venture', 'What it does', '#7C3AED', 4);
```

Then add its categories from the **Categories** page. The dashboard, filters and reports pick up the new division automatically.

## Project structure

```
supabase/schema.sql          Tables, RLS, triggers, views, storage bucket, seed data
src/middleware.ts            Session refresh and redirect to /login
src/lib/data.ts              Server data loaders and requireMember() authorization guard
src/lib/email.ts             Notification email template and SMTP sender
src/lib/analytics.ts         Dashboard aggregations
src/lib/filters.ts           Shared search and filter logic (list, reports, CSV)
src/app/actions/expenses.ts  Server actions: create, update, delete, categories
src/app/(app)/               Signed-in pages: dashboard, divisions, expenses, reports, categories, account
src/app/api/export/route.ts  CSV export
```

## Security model

- **Authentication**: Supabase email and password, with public sign-up turned off.
- **Authorization**: `public.is_member()` is checked by every RLS policy, so a user needs an active profile, and profiles exist only for allow-listed emails. Server pages also check this through `requireMember()`.
- **Integrity**: the database sets `created_by` and `updated_by` from the session, so a user can't spoof them. Amounts must be positive. A composite foreign key stops records from mixing across divisions.
- **Audit**: a trigger writes every insert, update and delete to `expense_audit`, which clients can't modify.
- **Receipts**: kept in a private bucket, limited to 10 MB and to image or PDF types. They're served only through signed URLs that expire after one hour.
- **CSV export**: values are escaped so that a cell can't run a spreadsheet formula.
