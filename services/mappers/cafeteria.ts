import type { MealData } from "@/components/MealItem";
import type {
  CafeteriaPaymentOptionsDto,
  MealDto,
  MealItemsDto,
  MealOrdersDto,
} from "@/types/api";
import { formatCurrency } from "@/utils/format";

/** "08:00" from "08:00:00"; "" when the API sends nothing. */
const shortTime = (value?: string | null) => (value ?? "").slice(0, 5);

/** A sitting (Breakfast, Lunch…) as shown in the section headers. */
export interface MealCategory {
  id: number;
  name: string;
  /** "08:00 – 10:00", or "" when the meal has no configured window. */
  timeWindow: string;
}

/** Returned already ordered by start time; the order is preserved. */
export function selectMeals(data: MealDto[]): MealCategory[] {
  return (data ?? []).map((m) => {
    const from = shortTime(m.startTime);
    const to = shortTime(m.endTime);
    return {
      id: m.id,
      name: m.name ?? "",
      timeWindow: from && to ? `${from} – ${to}` : from || to || "",
    };
  });
}

/**
 * The menu arrives grouped by category ("Sandwiches", "Juice", …), which is
 * how the cafeteria actually organises it — so the grouping is preserved and
 * used for the section headers.
 */
export interface MealItemGroup {
  id: number;
  name: string;
  items: MenuItemCard[];
}

/**
 * One orderable item.
 *
 * No image: the API exposes no artwork for items, so rows render text-only
 * rather than showing a stand-in picture.
 */
export interface MenuItemCard extends MealData {
  /** Numeric id sent at checkout — `id` is the string form the list keys on. */
  itemId: number;
  groupId: number;
  groupName: string;
}

export interface MealMenu {
  mealId: number;
  mealName: string;
  /** Kept for a grouped layout; the card strip uses `items`. */
  groups: MealItemGroup[];
  /** Every item across every group, in group order. */
  items: MenuItemCard[];
}

export function selectMealItems(data: MealItemsDto): MealMenu {
  // Built once and shared, so a card in `groups` and the same card in `items`
  // are the same object — the list can key on identity without re-mapping.
  const groups: MealItemGroup[] = (data.groups ?? []).map((group) => {
    const groupName = group.groupName ?? "";
    return {
      id: group.groupId,
      name: groupName,
      items: (group.items ?? []).map((item) => ({
        id: String(item.id),
        itemId: item.id,
        title: item.name ?? "",
        // The API has no item description; the group it belongs to is the
        // closest real data there is.
        description: groupName,
        price: item.price,
        groupId: group.groupId,
        groupName,
      })),
    };
  });

  return {
    mealId: data.mealId,
    mealName: data.mealName ?? "",
    groups,
    items: groups.flatMap((g) => g.items),
  };
}

/** A placed order, grouped for the "ordered for this day" summary. */
export interface OrderedMeal {
  id: number;
  mealName: string;
  status: string;
  isAccepted: boolean;
  total: number;
  items: OrderedMealItem[];
}

/** Order lines carry a quantity, unlike menu items. */
export interface OrderedMealItem {
  /** Order-item id, not the cafeteria item id. */
  id: string;
  name: string;
  /** Unit price as stored with the order. */
  price: number;
  qty: number;
  lineTotal: number;
}

export function selectMealOrders(data: MealOrdersDto): OrderedMeal[] {
  return (data.orders ?? []).map((order) => {
    const items: OrderedMealItem[] = (order.items ?? []).map((i) => ({
      id: String(i.id),
      name: i.itemName ?? "",
      price: i.price,
      qty: i.qty,
      lineTotal: i.price * (i.qty || 1),
    }));

    return {
      id: order.orderId,
      mealName: order.mealName ?? "Order",
      status: order.status ?? "",
      isAccepted: order.isAccepted,
      total:
        order.totalPrice ?? items.reduce((sum, i) => sum + i.lineTotal, 0),
      items,
    };
  });
}

// ─── §6 Payment options ──────────────────────────────────────────────────────

export interface CafeteriaPaymentMethod {
  /** Server-side enum value — passed through, never hardcoded. */
  value: number;
  name: string;
  /** True for the wallet method, so the screen can show the balance on it. */
  isWallet: boolean;
  /** True for the method that needs payment proof. */
  needsProof: boolean;
}

export interface CafeteriaPaymentOptions {
  walletBalance: number;
  /** "EGP 1,250" */
  walletBalanceLabel: string;
  methods: CafeteriaPaymentMethod[];
}

/**
 * Only `name` distinguishes the methods — the guide forbids relying on `value`,
 * which is a server-side enum the client must pass through untouched.
 */
export function selectPaymentOptions(
  dto: CafeteriaPaymentOptionsDto,
): CafeteriaPaymentOptions {
  const balance = dto.walletBalance ?? 0;

  return {
    walletBalance: balance,
    walletBalanceLabel: formatCurrency(balance),
    methods: (dto.paymentMethods ?? []).map((m) => {
      const name = m.name ?? "";
      const isWallet = /wallet/i.test(name);
      return {
        value: m.value,
        name,
        isWallet,
        // Everything that isn't the wallet settles out of band and needs a
        // receipt — Insta today, and anything added later behaves the same.
        needsProof: !isWallet,
      };
    }),
  };
}
