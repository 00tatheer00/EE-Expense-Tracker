import "server-only";
import nodemailer from "nodemailer";
import { escapeHtml, formatDate, formatPKR } from "@/lib/utils";
import { DEMO } from "@/lib/demo/config";

export type ExpenseEmailPayload = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  expense_date: string;
  paid_to: string;
  location: string | null;
  purpose: string | null;
  payment_method: string;
  notes: string | null;
  hasReceipt: boolean;
  divisionName: string;
  divisionColor: string;
  categoryName: string;
  addedBy: string;
};

let transporter: nodemailer.Transporter | null = null;

function smtpSettings() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  let pass = process.env.SMTP_PASS?.trim();
  // Gmail shows App passwords as "abcd efgh ijkl mnop" — accept them pasted with spaces.
  if (pass && host?.includes("gmail")) pass = pass.replace(/\s+/g, "");
  const port = Number(process.env.SMTP_PORT?.trim() || 465);
  const secure = (process.env.SMTP_SECURE?.trim() || (port === 465 ? "true" : "false")) === "true";
  const from = process.env.EMAIL_FROM?.trim().replace(/^["']|["']$/g, "") || user;
  return { host, user, pass, port, secure, from };
}

/** Non-secret summary of the email configuration, for the Account page. */
export function emailConfigStatus() {
  const s = smtpSettings();
  return {
    demo: DEMO,
    configured: Boolean(s.host && s.user && s.pass),
    host: s.host ?? null,
    user: s.user ?? null,
    from: s.from ?? null,
    port: s.port,
    hasPassword: Boolean(s.pass),
  };
}

function getTransporter() {
  if (transporter) return transporter;
  const s = smtpSettings();
  if (!s.host || !s.user || !s.pass) return null;
  transporter = nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    auth: { user: s.user, pass: s.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

/** Turns common SMTP failures into plain-language guidance. */
export function explainEmailError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("535") || m.includes("badcredentials") || m.includes("username and password not accepted"))
    return "Gmail rejected the login. Make sure SMTP_USER is the full Gmail address and SMTP_PASS is the 16-letter App password (not the normal Gmail password), then redeploy.";
  if (m.includes("534") || m.includes("application-specific password"))
    return "Gmail requires an App password. Turn on 2-Step Verification and create one at myaccount.google.com/apppasswords.";
  if (m.includes("timeout") || m.includes("econnrefused") || m.includes("enotfound"))
    return "Could not reach the mail server. Check SMTP_HOST=smtp.gmail.com and SMTP_PORT=465.";
  if (m.includes("not configured"))
    return "Email settings are missing. Add SMTP_HOST, SMTP_USER, SMTP_PASS and EMAIL_FROM in Vercel, then redeploy.";
  return message;
}

function row(label: string, value: string | null | undefined) {
  const v = value && value.trim() ? escapeHtml(value) : '<span style="color:#94A3B8">—</span>';
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #EEF1F6;color:#64748B;font-size:13px;width:38%;vertical-align:top">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #EEF1F6;color:#0F172A;font-size:14px;font-weight:500;vertical-align:top;white-space:pre-line">${v}</td>
  </tr>`;
}

export function renderExpenseEmail(e: ExpenseEmailPayload) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const link = site ? `${site}/expenses/${e.id}` : "";
  const amount = formatPKR(e.amount, true);
  const date = formatDate(e.expense_date, {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const subject = `New expense · ${e.divisionName} · ${amount} — ${e.title}`;

  const html = `<!doctype html>
<html><body style="margin:0;background:#F4F6FA;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FA;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #E6E9F0">
        <tr><td style="background:#0B1A3A;padding:20px 28px">
          <div style="color:#FFFFFF;font-size:15px;font-weight:600;letter-spacing:.2px">Emerging Edge · Expense Tracker</div>
          <div style="color:#9FB0D3;font-size:12px;margin-top:2px">New expense notification</div>
        </td></tr>
        <tr><td style="padding:24px 28px 8px">
          <div style="display:inline-block;padding:4px 10px;border-radius:999px;background:${e.divisionColor}1A;color:${e.divisionColor};font-size:12px;font-weight:600">${escapeHtml(e.divisionName)}</div>
          <div style="font-size:30px;font-weight:700;color:#0B1A3A;margin:14px 0 4px">${amount}</div>
          <div style="font-size:16px;color:#0F172A;font-weight:600">${escapeHtml(e.title)}</div>
          <div style="font-size:13px;color:#64748B;margin-top:6px">Added by <strong style="color:#0F172A">${escapeHtml(e.addedBy)}</strong></div>
        </td></tr>
        <tr><td style="padding:8px 28px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${row("Added by", e.addedBy)}
            ${row("Business division", e.divisionName)}
            ${row("Category", e.categoryName)}
            ${row("Amount", amount)}
            ${row("Date", date)}
            ${row("Where (location)", e.location)}
            ${row("Event / purpose", e.purpose)}
            ${row("Paid to", e.paid_to)}
            ${row("Payment method", e.payment_method)}
            ${row("Description", e.description)}
            ${row("Additional notes", e.notes)}
            ${row("Receipt attached", e.hasReceipt ? "Yes" : "No")}
          </table>
        </td></tr>
        ${
          link
            ? `<tr><td style="padding:20px 28px 8px"><a href="${link}" style="display:inline-block;background:#0E9F6E;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:9px">View expense</a></td></tr>`
            : ""
        }
        <tr><td style="padding:16px 28px 24px;color:#94A3B8;font-size:12px;border-top:1px solid #EEF1F6">
          You receive this because you are an authorized user of the Emerging Edge expense system.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `New expense added by ${e.addedBy}`,
    ``,
    `Division: ${e.divisionName}`,
    `Title: ${e.title}`,
    `Amount: ${amount}`,
    `Category: ${e.categoryName}`,
    `Date: ${date}`,
    `Where: ${e.location ?? "-"}`,
    `Event / purpose: ${e.purpose ?? "-"}`,
    `Paid to: ${e.paid_to}`,
    `Payment method: ${e.payment_method}`,
    `Description: ${e.description ?? "-"}`,
    `Notes: ${e.notes ?? "-"}`,
    `Receipt attached: ${e.hasReceipt ? "Yes" : "No"}`,
    link ? `\nView: ${link}` : "",
  ].join("\n");

  return { subject, html, text };
}

/** Sends the notification. Never throws — returns a status the UI can show. */
export async function sendExpenseNotification(
  e: ExpenseEmailPayload,
  recipients: string[],
): Promise<{ sent: boolean; error?: string }> {
  if (DEMO) return { sent: false, error: "demo" };
  const t = getTransporter();
  if (!t) return { sent: false, error: "SMTP is not configured" };
  if (!recipients.length) return { sent: false, error: "No recipients" };
  try {
    const { subject, html, text } = renderExpenseEmail(e);
    await t.sendMail({
      from: smtpSettings().from,
      to: recipients.join(", "),
      subject,
      html,
      text,
    });
    console.log(`[email] expense notification sent to ${recipients.length} recipients`);
    return { sent: true };
  } catch (err) {
    console.error("[email] failed to send expense notification", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** Sends a short test email to one address. Returns a human-readable error on failure. */
export async function sendTestEmail(to: string, name: string): Promise<{ sent: boolean; error?: string }> {
  if (DEMO) return { sent: false, error: "Email sending is disabled in demo mode." };
  const t = getTransporter();
  if (!t) return { sent: false, error: explainEmailError("not configured") };
  try {
    await t.sendMail({
      from: smtpSettings().from,
      to,
      subject: "Test email · EE Expense Tracker",
      text: `Hi ${name},\n\nEmail notifications are working. You will receive an email like this whenever a new expense is added.\n\n— EE Expense Tracker`,
      html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:24px auto;padding:24px;border:1px solid #E6E9F0;border-radius:14px">
        <div style="font-size:18px;font-weight:700;color:#0B1A3A">Email notifications are working ✅</div>
        <p style="font-size:14px;color:#475569;line-height:1.6">Hi ${escapeHtml(name)}, this is a test from EE Expense Tracker. Every time someone adds a new expense, all authorized users will receive a notification from this address.</p>
      </div>`,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] test email failed", err);
    return { sent: false, error: explainEmailError(err instanceof Error ? err.message : String(err)) };
  }
}
