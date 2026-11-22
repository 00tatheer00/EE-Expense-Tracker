"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, FileText, Loader2, Mail, UploadCloud, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createExpense, discardUpload, updateExpense, type ExpenseInput } from "@/app/actions/expenses";
import { MAX_RECEIPT_BYTES, PAYMENT_METHODS, RECEIPT_ACCEPT, RECEIPT_BUCKET } from "@/lib/constants";
import type { Category, Division, Expense } from "@/lib/types";
import { cn, todayPK } from "@/lib/utils";

type Props = {
  divisions: Division[];
  categories: Category[];
  expense?: Expense;
  defaultDivisionId?: string;
};

function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="ml-0.5 text-accent-500">*</span>}
      </label>
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1 text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  );
}

export function ExpenseForm({ divisions, categories, expense, defaultDivisionId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(expense);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState({
    division_id: expense?.division_id ?? defaultDivisionId ?? "",
    category_id: expense?.category_id ?? "",
    title: expense?.title ?? "",
    amount: expense ? String(expense.amount) : "",
    expense_date: expense?.expense_date ?? todayPK(),
    paid_to: expense?.paid_to ?? "",
    location: expense?.location ?? "",
    purpose: expense?.purpose ?? "",
    payment_method: expense?.payment_method ?? "",
    description: expense?.description ?? "",
    notes: expense?.notes ?? "",
  });
  const [existingReceipt, setExistingReceipt] = useState<{ path: string; name: string } | null>(
    expense?.receipt_path ? { path: expense.receipt_path, name: expense.receipt_name ?? "Receipt" } : null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "saving">("idle");

  const division = divisions.find((d) => d.id === values.division_id);
  const divisionCats = useMemo(
    () =>
      categories.filter(
        (c) => c.division_id === values.division_id && (c.is_active || c.id === expense?.category_id),
      ),
    [categories, values.division_id, expense?.category_id],
  );

  function set<K extends keyof typeof values>(key: K, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function pickFile(f: File | undefined | null) {
    if (!f) return;
    if (f.size > MAX_RECEIPT_BYTES) {
      setErrors((e) => ({ ...e, receipt: "File is larger than 10 MB." }));
      return;
    }
    if (!RECEIPT_ACCEPT.split(",").includes(f.type)) {
      setErrors((e) => ({ ...e, receipt: "Use a JPG, PNG, WEBP, HEIC image or a PDF." }));
      return;
    }
    setErrors((e) => ({ ...e, receipt: "" }));
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const local: Record<string, string> = {};
    if (!values.division_id) local.division_id = "Choose a business division";
    if (!values.category_id) local.category_id = "Choose a category";
    if (!values.title.trim()) local.title = "Enter a title";
    if (!(Number(values.amount) > 0)) local.amount = "Enter an amount greater than zero";
    if (!values.paid_to.trim()) local.paid_to = "Enter who was paid";
    if (!values.payment_method) local.payment_method = "Choose a payment method";
    if (Object.keys(local).length) {
      setErrors(local);
      setFormError("Please fill in the required fields.");
      return;
    }

    let receipt_path = existingReceipt?.path ?? null;
    let receipt_name = existingReceipt?.name ?? null;
    let uploadedPath: string | null = null;

    try {
      if (file) {
        setStatus("uploading");
        const supabase = createClient();
        const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${division?.slug ?? "general"}/${values.expense_date.slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(RECEIPT_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(`Receipt upload failed: ${error.message}`);
        uploadedPath = path;
        receipt_path = path;
        receipt_name = file.name.slice(0, 255);
      }

      setStatus("saving");
      const payload: ExpenseInput = {
        ...values,
        amount: Number(values.amount),
        payment_method: values.payment_method as ExpenseInput["payment_method"],
        receipt_path,
        receipt_name,
      };
      const res = isEdit ? await updateExpense(expense!.id, payload) : await createExpense(payload);

      if (!res.ok) {
        if (uploadedPath) await discardUpload(uploadedPath);
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        setStatus("idle");
        return;
      }

      const emailState = res.emailSent ? "sent" : res.emailError === "demo" ? "demo" : "failed";
      const reason = !res.emailSent && res.emailError && res.emailError !== "demo" ? `&reason=${encodeURIComponent(res.emailError.slice(0, 300))}` : "";
      const qs = isEdit ? "?updated=1" : `?created=1&email=${emailState}${reason}`;
      router.push(`/expenses/${res.id}${qs}`);
      router.refresh();
    } catch (err) {
      if (uploadedPath) await discardUpload(uploadedPath).catch(() => {});
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("idle");
    }
  }

  const busy = status !== "idle";

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/* Division */}
      <section className="card card-pad">
        <div className="card-title">Business division</div>
        <div className="card-sub">Each division keeps its own independent records and categories.</div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {divisions.map((d) => {
            const active = d.id === values.division_id;
            return (
              <button
                type="button"
                key={d.id}
                onClick={() => {
                  if (d.id !== values.division_id) setValues((s) => ({ ...s, division_id: d.id, category_id: "" }));
                  setErrors((e) => ({ ...e, division_id: "", category_id: "" }));
                }}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-xl border px-2 py-3.5 text-center transition active:scale-[0.97] sm:flex-row sm:items-start sm:gap-3 sm:p-4 sm:text-left",
                  active ? "border-transparent ring-2" : "border-line hover:border-slate-300 hover:bg-slate-50",
                )}
                style={active ? ({ ["--tw-ring-color" as string]: d.color, background: `${d.color}0D` } as React.CSSProperties) : undefined}
                aria-pressed={active}
              >
                <span className="h-3 w-3 shrink-0 rounded-full sm:mt-1 sm:h-2.5 sm:w-2.5" style={{ background: d.color }} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-tight text-navy-900 sm:text-sm">{d.short_name}</span>
                  <span className="mt-0.5 hidden text-xs text-ink-subtle sm:block">{d.description}</span>
                </span>
                {active && (
                  <span
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white sm:right-3 sm:top-3"
                    style={{ background: d.color }}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {errors.division_id && <p className="field-error">{errors.division_id}</p>}
      </section>

      {/* Details */}
      <section className="card card-pad">
        <div className="card-title">Expense details</div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Amount (PKR)" htmlFor="amount" required error={errors.amount}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-ink-subtle sm:left-3 sm:text-sm sm:font-medium">
                Rs
              </span>
              <input
                id="amount"
                inputMode="decimal"
                className={cn(
                  "input h-14 pl-12 text-2xl font-semibold tabular-nums sm:h-10 sm:pl-9 sm:text-sm sm:font-normal",
                  errors.amount && "input-error",
                )}
                autoComplete="off"
                value={values.amount}
                onChange={(e) => set("amount", e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0"
              />
            </div>
          </Field>

          <Field label="Date" htmlFor="expense_date" required error={errors.expense_date}>
            <input
              id="expense_date"
              type="date"
              className={cn("input", errors.expense_date && "input-error")}
              value={values.expense_date}
              onChange={(e) => set("expense_date", e.target.value)}
            />
          </Field>

          <Field label="Expense title" htmlFor="title" required error={errors.title} className="sm:col-span-2">
            <input
              id="title"
              className={cn("input", errors.title && "input-error")}
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Facebook ads campaign – Winter collection"
              maxLength={160}
            />
          </Field>

          <Field
            label="Category"
            htmlFor="category_id"
            required
            error={errors.category_id}
            hint={!values.division_id ? "Choose a division first" : undefined}
          >
            <select
              id="category_id"
              className={cn("input", errors.category_id && "input-error")}
              value={values.category_id}
              onChange={(e) => set("category_id", e.target.value)}
              disabled={!values.division_id}
            >
              <option value="">Select category…</option>
              {divisionCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Payment method" htmlFor="payment_method" required error={errors.payment_method}>
            <select
              id="payment_method"
              className={cn("input", errors.payment_method && "input-error")}
              value={values.payment_method}
              onChange={(e) => set("payment_method", e.target.value)}
            >
              <option value="">Select method…</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>

          <Field label="Paid to / Recipient" htmlFor="paid_to" required error={errors.paid_to}>
            <input
              id="paid_to"
              className={cn("input", errors.paid_to && "input-error")}
              value={values.paid_to}
              onChange={(e) => set("paid_to", e.target.value)}
              placeholder="Vendor, person or company"
              maxLength={160}
            />
          </Field>

          <Field label="Where (location)" htmlFor="location" error={errors.location}>
            <input
              id="location"
              className="input"
              value={values.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Lahore office, online, Karachi warehouse"
              maxLength={200}
            />
          </Field>

          <Field label="Event or purpose" htmlFor="purpose" error={errors.purpose} className="sm:col-span-2">
            <input
              id="purpose"
              className="input"
              value={values.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              placeholder="e.g. Annual bootcamp 2026, Eid sale campaign, monthly operations"
              maxLength={200}
            />
          </Field>

          <Field label="Description" htmlFor="description" error={errors.description} className="sm:col-span-2">
            <textarea
              id="description"
              rows={3}
              className="input"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What was purchased or paid for?"
              maxLength={2000}
            />
          </Field>

          <Field label="Additional notes" htmlFor="notes" error={errors.notes} className="sm:col-span-2">
            <textarea
              id="notes"
              rows={2}
              className="input"
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything the team should know (included in the email notification)"
              maxLength={2000}
            />
          </Field>
        </div>
      </section>

      {/* Receipt */}
      <section className="card card-pad">
        <div className="card-title">Receipt or invoice</div>
        <div className="card-sub">Optional · JPG, PNG, WEBP, HEIC or PDF up to 10 MB</div>

        <input
          ref={fileRef}
          type="file"
          accept={RECEIPT_ACCEPT}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        {/* Opens the camera directly on phones */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />

        {file || existingReceipt ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-navy-500 shadow-card">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{file ? file.name : existingReceipt!.name}</div>
              <div className="text-xs text-ink-subtle">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ready to upload` : "Currently attached"}
              </div>
            </div>
            <button type="button" className="btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
              Replace
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-ink-subtle hover:bg-white hover:text-red-600"
              onClick={() => {
                setFile(null);
                setExistingReceipt(null);
                if (fileRef.current) fileRef.current.value = "";
                if (cameraRef.current) cameraRef.current.value = "";
              }}
              aria-label="Remove receipt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-navy-900 px-3 py-5 text-sm font-medium text-white active:scale-[0.98]"
            >
              <Camera className="h-6 w-6" /> Take photo
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line px-3 py-5 text-sm font-medium text-navy-900 active:bg-slate-50"
            >
              <UploadCloud className="h-6 w-6 text-navy-500" /> Choose file
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "mt-4 hidden w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition sm:flex",
              dragging ? "border-emerald-500 bg-emerald-50" : "border-line hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <UploadCloud className="h-7 w-7 text-navy-500" />
            <span className="mt-2 text-sm font-medium text-navy-900">Click to upload or drag & drop</span>
            <span className="mt-0.5 text-xs text-ink-subtle">Images or PDF</span>
          </button>
          </>
        )}
        {errors.receipt && <p className="field-error">{errors.receipt}</p>}
      </section>

      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
      )}

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-col-reverse gap-2 border-t border-line bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:p-0">
        {!isEdit ? (
          <p className="flex items-center justify-center gap-2 text-[11px] text-ink-subtle sm:justify-start sm:text-xs">
            <Mail className="h-3.5 w-3.5 text-emerald-600" />
            All authorized users will be notified by email when you save.
          </p>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary h-12 flex-1 sm:h-10 sm:flex-none" disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-success h-12 flex-[2] text-[15px] sm:h-10 sm:flex-none sm:min-w-[160px] sm:text-sm" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === "uploading" ? "Uploading receipt…" : status === "saving" ? "Saving…" : isEdit ? "Save changes" : "Save expense"}
          </button>
        </div>
      </div>
    </form>
  );
}
