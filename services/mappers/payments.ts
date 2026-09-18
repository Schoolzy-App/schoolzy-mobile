import type { PaymentCardData } from "@/components/PaymentCard";
import type { TimelineStep, TimelineSubItem } from "@/components/TimelineStepper";
import type {
  DuePaymentsDto,
  IgAccountOptionDto,
  IgOutstandingDto,
  PaymentCategoryDto,
  PaymentHistoryDto,
  PaymentHistoryItemDto,
  PaymentTransactionDto,
  SchoolFeeInstallmentDto,
} from "@/types/api";
import { formatCurrency, formatDate } from "@/utils/format";

/**
 * `/api/mobile/student-payments` → UI.
 *
 * Every function here is pure and defined at module scope so it can be passed
 * straight to a query's `select` without being re-created each render.
 */

// ─── §4 Due payments ─────────────────────────────────────────────────────────

/** One school-fee installment card in the horizontal strip. */
export type DueInstallmentCard = PaymentCardData & {
  installmentNumber: number;
  /** Remaining balance, in numbers, for the payment form. */
  amountValue: number;
  dueDate?: string;
  /** "EGP 6,000 of EGP 10,000 paid" — omitted when nothing has been paid. */
  paidLabel?: string;
  /** 0–1, for the progress bar on partially paid installments. */
  progress: number;
};

/** One IG account with a balance still owed. */
export interface IgOutstandingRow {
  id: string;
  accountName: string;
  subjects: string[];
  /** "Mathematics, Physics" */
  subjectsLabel: string;
  amount: string;
  amountValue: number;
}

export interface DuePaymentsSummary {
  installments: DueInstallmentCard[];
  ig: IgOutstandingRow[];
  /** Per-stream totals, so a tabbed view can show the active one. */
  schoolOutstanding: string;
  schoolOutstandingValue: number;
  igOutstanding: string;
  igOutstandingValue: number;
  totalOutstanding: string;
  totalOutstandingValue: number;
  hasOutstanding: boolean;
}

/**
 * The API returns no id for an installment, so `installmentNumber` is the key.
 * It is unique within a student season, which is the scope of this list.
 */
function toInstallmentCard(dto: SchoolFeeInstallmentDto): DueInstallmentCard {
  const paid = dto.paidAmount ?? 0;
  const total = dto.amount ?? 0;
  const partiallyPaid = paid > 0 && total > 0;

  return {
    id: `installment-${dto.installmentNumber}`,
    installmentNumber: dto.installmentNumber,
    title: `Installment ${dto.installmentNumber}`,
    amount: formatCurrency(dto.outstandingAmount),
    amountValue: dto.outstandingAmount ?? 0,
    dueDate: dto.dueDate ? `Due ${formatDate(dto.dueDate)}` : undefined,
    paidLabel: partiallyPaid
      ? `${formatCurrency(paid)} of ${formatCurrency(total)} paid`
      : undefined,
    progress: total > 0 ? Math.min(1, Math.max(0, paid / total)) : 0,
  };
}

function toIgRow(dto: IgOutstandingDto, index: number): IgOutstandingRow {
  const subjects = dto.subjects ?? [];
  return {
    // No id on the wire; the account name is the natural key and the index
    // keeps it unique if two accounts ever share a name.
    id: `ig-${index}-${dto.accountName ?? "account"}`,
    accountName: dto.accountName ?? "IG Account",
    subjects,
    subjectsLabel: subjects.join(", "),
    amount: formatCurrency(dto.outstandingAmount),
    amountValue: dto.outstandingAmount ?? 0,
  };
}

const bySum = (sum: number, n: number) => sum + n;

export function selectDuePayments(dto: DuePaymentsDto): DuePaymentsSummary {
  // Only outstanding rows are returned, but the order is not guaranteed and
  // the strip should read earliest-first.
  const installments = (dto.schoolFees ?? [])
    .map(toInstallmentCard)
    .sort((a, b) => a.installmentNumber - b.installmentNumber);

  const ig = (dto.ig ?? []).map(toIgRow);

  const schoolOutstandingValue = installments
    .map((i) => i.amountValue)
    .reduce(bySum, 0);
  const igOutstandingValue = ig.map((i) => i.amountValue).reduce(bySum, 0);
  const totalOutstandingValue = schoolOutstandingValue + igOutstandingValue;

  return {
    installments,
    ig,
    schoolOutstanding: formatCurrency(schoolOutstandingValue),
    schoolOutstandingValue,
    igOutstanding: formatCurrency(igOutstandingValue),
    igOutstandingValue,
    totalOutstanding: formatCurrency(totalOutstandingValue),
    totalOutstandingValue,
    hasOutstanding: totalOutstandingValue > 0,
  };
}

// ─── §3 Payment history ──────────────────────────────────────────────────────

/** Label for a ledger row: the category when present, else the raw type. */
const entryLabel = (dto: PaymentTransactionDto) =>
  dto.category?.trim() || dto.transactionType || "Payment";

/**
 * Refunds and adjustments are children of the payment they came from. Rendering
 * them as their own timeline rows would read as extra payments and double the
 * apparent total, which the integration guide calls out explicitly.
 */
function toSubItem(dto: PaymentTransactionDto): TimelineSubItem {
  const isRefund = dto.transactionType?.toLowerCase().includes("refund");
  return {
    id: String(dto.id),
    label: dto.transactionType || "Adjustment",
    // A refund moves money back out of the payment, so it reads as negative
    // against the parent even though the API sends a positive amount.
    amount: `${isRefund ? "−" : ""}${formatCurrency(dto.amount)}`,
    date: formatDate(dto.date),
    negative: isRefund,
  };
}

function toHistoryStep(dto: PaymentHistoryItemDto): TimelineStep {
  const children = (dto.transactions ?? []).map(toSubItem);

  return {
    id: String(dto.id),
    title: `${entryLabel(dto)} of ${formatCurrency(dto.amount)}`,
    // IG payments are the only ones carrying an account; showing it is what
    // distinguishes two otherwise identical rows.
    subtitle: [formatDate(dto.date), dto.accountName].filter(Boolean).join(" · "),
    // Every row in history is a settled ledger entry, not a pending one.
    status: "done",
    badge: dto.type ?? undefined,
    children: children.length ? children : undefined,
  };
}

/** `select` for a single page of history. */
export function selectPaymentHistory(dto: PaymentHistoryDto): TimelineStep[] {
  return (dto.items ?? []).map(toHistoryStep);
}

/** `select` for the paginated history — flattens every loaded page. */
export function selectPaymentHistoryPages(data: {
  pages: PaymentHistoryDto[];
}): TimelineStep[] {
  return data.pages.flatMap((page) => (page.items ?? []).map(toHistoryStep));
}

// ─── §5 Categories / §6 IG account options ───────────────────────────────────

export interface PaymentCategoryOption {
  id: number;
  name: string;
  /** Branch on this, never on the name or id — the guide is explicit. */
  requiresSubjectAccount: boolean;
}

export interface IgAccountOption {
  subjectAccountId: number;
  name: string;
  code: string;
}

/** Nulls collapsed to strings so the pickers never render "null". */
export function selectPaymentCategories(
  dtos: PaymentCategoryDto[],
): PaymentCategoryOption[] {
  return (dtos ?? []).map((c) => ({
    id: c.id,
    name: c.name?.trim() || `Category ${c.id}`,
    requiresSubjectAccount: !!c.requiresSubjectAccount,
  }));
}

export function selectIgAccountOptions(
  dtos: IgAccountOptionDto[],
): IgAccountOption[] {
  return (dtos ?? []).map((a) => ({
    subjectAccountId: a.subjectAccountId,
    name: a.name?.trim() || a.code?.trim() || `Account ${a.subjectAccountId}`,
    code: a.code?.trim() ?? "",
  }));
}
