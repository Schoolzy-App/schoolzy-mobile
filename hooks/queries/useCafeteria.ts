import { useQuery } from "@tanstack/react-query";

import { cafeteriaApi } from "@/services/api";
import {
  selectMealItems,
  selectMealOrders,
  selectMeals,
  selectPaymentOptions,
} from "@/services/mappers";
import type {
  CafeteriaPaymentOptions,
  MealCategory,
  MealMenu,
  OrderedMeal,
} from "@/services/mappers";
import type {
  CafeteriaPaymentOptionsDto,
  MealDto,
  MealItemsDto,
  MealOrdersDto,
} from "@/types/api";
import { toApiDate } from "@/utils/format";

import { queryKeys } from "./queryKeys";

/** GET /api/mobile/cafeteriaa/meals — the menu's meal categories. */
export function useMeals(enabled = true) {
  return useQuery<MealDto[], Error, MealCategory[]>({
    queryKey: queryKeys.cafeteria.meals(),
    queryFn: () => cafeteriaApi.meals(),
    select: selectMeals,
    // The menu rarely changes within a session.
    staleTime: 5 * 60_000,
    enabled,
  });
}

/** GET /api/mobile/cafeteriaa/meals/{mealId}/items */
export function useMealItems(mealId?: number) {
  return useQuery<MealItemsDto, Error, MealMenu>({
    queryKey: queryKeys.cafeteria.mealItems(mealId ?? 0),
    queryFn: () => cafeteriaApi.mealItems(mealId as number),
    select: selectMealItems,
    staleTime: 5 * 60_000,
    enabled: typeof mealId === "number",
  });
}

/**
 * GET /api/mobile/cafeteriaa/meal-orders?studentSeasonId=&date=
 * Cached per (student, day); the previous day stays visible while the next
 * loads so the summary doesn't flash empty when scrubbing the calendar.
 */
export function useMealOrders(studentSeasonId?: number, date?: Date) {
  return useQuery<MealOrdersDto, Error, OrderedMeal[]>({
    queryKey: queryKeys.cafeteria.orders(studentSeasonId ?? 0, toApiDate(date)),
    queryFn: () =>
      cafeteriaApi.mealOrders({
        studentSeasonId: studentSeasonId as number,
        date,
      }),
    select: selectMealOrders,
    placeholderData: (previous) => previous,
    enabled: typeof studentSeasonId === "number",
  });
}

/**
 * GET /api/mobile/cafeteriaa/payment-options?studentSeasonId=
 *
 * Carries the wallet balance, so it is NOT cached aggressively — a balance
 * shown next to a Pay button has to be current.
 */
export function useCafeteriaPaymentOptions(
  studentSeasonId?: number,
  enabled = true,
) {
  return useQuery<CafeteriaPaymentOptionsDto, Error, CafeteriaPaymentOptions>({
    queryKey: queryKeys.cafeteria.paymentOptions(studentSeasonId ?? 0),
    queryFn: () => cafeteriaApi.paymentOptions(studentSeasonId as number),
    select: selectPaymentOptions,
    staleTime: 0,
    enabled: enabled && typeof studentSeasonId === "number",
  });
}
