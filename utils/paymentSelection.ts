import type { PaymentCategoryOption } from "@/services/mappers";
import type { PaymentFeeKind } from "@/navigation/types";

/**
 * Splitting the category list into the School / IG streams the payment form
 * shows as tabs.
 *
 * The split is driven entirely by `requiresSubjectAccount`, which the guide
 * names as the only reliable signal — category names and ids carry no meaning
 * the client may depend on. IG categories are exactly those that need a subject
 * account chosen alongside them.
 */
export function categoriesForKind(
  categories: PaymentCategoryOption[] | undefined,
  kind: PaymentFeeKind,
): PaymentCategoryOption[] {
  const wantsSubjectAccount = kind === "ig";
  return (categories ?? []).filter(
    (c) => c.requiresSubjectAccount === wantsSubjectAccount,
  );
}

/**
 * Pre-selects a category only when the tab leaves no choice. Returns "" for an
 * empty or ambiguous list so the parent picks rather than the form guessing.
 */
export function soleCategoryId(categories: PaymentCategoryOption[]): string {
  return categories.length === 1 ? String(categories[0].id) : "";
}

/** Which tabs to show — a stream with no categories isn't offered. */
export function availableFeeKinds(
  categories: PaymentCategoryOption[] | undefined,
): PaymentFeeKind[] {
  const kinds: PaymentFeeKind[] = [];
  if (categoriesForKind(categories, "school").length) kinds.push("school");
  if (categoriesForKind(categories, "ig").length) kinds.push("ig");
  return kinds;
}
