import { z } from "zod";
import { toCents, calcChange } from "../utils/pricing";

export const LIMITS = {
  guestsMin: 1,
  guestsMax: 50,
  customerName: 100,
  note: 120,
  pwdName: 100,
  pwdId: 50,
  maxCash: 9999999.99,
};

const SAFE_TEXT = /^[^\u0000-\u001F\u007F<>]*$/;
const ID_TEXT = /^[A-Za-z0-9][A-Za-z0-9\-/ ]*$/;
const optionalText = (label, max) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .regex(SAFE_TEXT, `${label} has characters that aren't allowed`)
    .transform((v) => v || undefined);

export const customerNameSchema = optionalText("Customer name", LIMITS.customerName);
export const noteSchema = optionalText("Note", LIMITS.note);
export const pwdNameSchema = optionalText("PWD name", LIMITS.pwdName);
export const pwdIdSchema = z
  .string()
  .trim()
  .max(LIMITS.pwdId, `PWD ID number must be ${LIMITS.pwdId} characters or fewer`)
  .refine((v) => v === "" || ID_TEXT.test(v), "PWD ID number may only have letters, numbers, dashes, slashes and spaces")
  .transform((v) => v || undefined);

export const guestsSchema = z
  .string()
  .trim()
  .min(1, "Enter the number of guests")
  .regex(/^\d+$/, "Use whole numbers only")
  .transform(Number)
  .refine((n) => n >= LIMITS.guestsMin, "At least 1 guest")
  .refine((n) => n <= LIMITS.guestsMax, `No more than ${LIMITS.guestsMax} guests`);

export function check(schema, input) {
  const r = schema.safeParse(input);
  return r.success ? { value: r.data } : { error: r.error.issues[0]?.message ?? "Invalid value" };
}

export const cleanMoneyInput = (s) => String(s ?? "").replace(/[₱,\s]/g, "");

export function sanitizeMoneyTyping(raw) {
  let s = String(raw ?? "").replace(/[^\d.]/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  return s.slice(0, 11); // 9,999,999.99
}

export function validateCash(input, total) {
  const s = cleanMoneyInput(input);
  if (s === "") return { empty: true };
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(s) && !/^\d{1,7}\.$/.test(s)) return { error: "Enter an amount like 1000 or 1000.50" };
  const amount = Number(s);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Cash received must be more than ₱0" };
  if (amount > LIMITS.maxCash) return { error: "That amount is too large" };
  if (toCents(amount) < toCents(total)) return { amount, short: calcChange(total, amount) };
  return { amount, change: calcChange(amount, total) };
}

export function isPaymentReady(method, cashInput, total) {
  if (!(Number(total) > 0)) return false;
  if (method === "gcash") return true;
  if (method !== "cash") return false;
  const r = validateCash(cashInput, total);
  return r.change !== undefined;
}

export function buildPaymentBody(method, cashInput, total) {
  if (method !== "cash") return { payment_method: method };
  const r = validateCash(cashInput, total);
  return { payment_method: "cash", amount_tendered: r.amount };
}

const formSchema = z
  .object({
    lineCount: z.number().min(1, "Add at least one item"),
    customerName: customerNameSchema,
    pwdEnabled: z.boolean(),
    pwdLines: z.number(),
    pwdName: pwdNameSchema,
    pwdId: pwdIdSchema,
  })
  .superRefine((v, ctx) => {
    if (v.pwdEnabled && v.pwdLines < 1) {
      ctx.addIssue({ code: "custom", path: ["pwdItems"], message: "Tick at least one item for the PWD, or turn the discount off" });
    }
  });

export function validateOrderForm({ lines, customerName, pwd }) {
  const r = formSchema.safeParse({
    lineCount: lines.length,
    customerName: customerName ?? "",
    pwdEnabled: !!pwd.enabled,
    pwdLines: lines.filter((l) => l.pwd).length,
    pwdName: pwd.enabled ? pwd.name ?? "" : "",
    pwdId: pwd.enabled ? pwd.id ?? "" : "",
  });
  if (r.success) return { ok: true, values: r.data, errors: {} };
  const errors = {};
  for (const issue of r.error.issues) errors[issue.path[0] ?? "form"] ??= issue.message;
  return { ok: false, errors };
}