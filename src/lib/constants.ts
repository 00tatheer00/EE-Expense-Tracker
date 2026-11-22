export const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Cheque",
  "Credit/Debit Card",
  "JazzCash",
  "Easypaisa",
  "Online Payment",
  "Other",
] as const;

export const RECEIPT_BUCKET = "receipts";
export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
export const RECEIPT_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,application/pdf";
export const PAGE_SIZE = 25;
