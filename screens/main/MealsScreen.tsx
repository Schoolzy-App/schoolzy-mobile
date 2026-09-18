import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { FoodItemRow, ScreenshotUpload, WeekCalendar } from "@/components";
import type { PickedImage } from "@/components/ScreenshotUpload";
import {
  Card,
  DefaultInput,
  QueryState,
  ScreenTemplate,
  SegmentedTabs,
  Text,
} from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useCafeteriaCheckout,
  useCafeteriaPaymentOptions,
  useMealItems,
  useMealOrders,
  useMeals,
  useStyles,
} from "@/hooks";
import type { CheckoutPayment, MealCart } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { MenuItemCard } from "@/services/mappers";
import type { PaymentProofFile } from "@/services/api/payments";
import { ApiError } from "@/types/api";
import { formatCurrency } from "@/utils/format";

/**
 * ⚠️ Checkout has NO date field: `POST /checkout/wallet` and `/checkout/insta`
 * take only studentSeasonId + mealId + items, and `/meal-orders` reads "orders
 * created during the selected calendar day". So an order always lands on today
 * and there is no way to order ahead. The calendar browses history; selection
 * is only enabled on today.
 */
const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const isToday = (d: Date) =>
  startOfDay(d).getTime() === startOfDay(new Date()).getTime();

const formatLongDate = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

/** Keeps a tap inside the sheet from dismissing it via the backdrop. */
const stopPropagation = () => {};

/** Selected item ids, keyed by meal. Quantity is 1 per selected item. */
type Selection = Record<number, Set<number>>;

const countSelected = (selection: Selection) =>
  Object.values(selection).reduce((sum, set) => sum + set.size, 0);

type Props = RootStackScreenProps<"Meals">;

export default function MealsScreen({ route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { studentName, studentSeasonId } = route.params;
  const firstName = studentName.split(" ")[0];

  const [selectedDate, setSelectedDate] = useState(new Date());
  const canOrder = isToday(selectedDate);

  /** Which meal's menu is showing. Null until the meal list arrives. */
  const [activeMealId, setActiveMealId] = useState<number | null>(null);
  const [selection, setSelection] = useState<Selection>({});
  /** Display prices, so the cart total doesn't need the menu queries. */
  const [prices, setPrices] = useState<Record<number, number>>({});
  const [payOpen, setPayOpen] = useState(false);

  // ── Menu ────────────────────────────────────────────────────────────────
  const {
    data: meals,
    isLoading: mealsLoading,
    error: mealsError,
    refetch: refetchMeals,
  } = useMeals();

  // ── What the student already has ordered for the selected day ───────────
  const {
    data: orders,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    error: ordersError,
    refetch: refetchOrders,
  } = useMealOrders(studentSeasonId, selectedDate);

  const dayTotal = useMemo(
    () => (orders ?? []).reduce((sum, o) => sum + (o.total || 0), 0),
    [orders],
  );

  // Falls back to the first meal, so the tab stays valid while the list loads
  // or changes underneath it. Derived, so no effect and no extra render.
  const activeMeal =
    meals?.find((m) => m.id === activeMealId) ?? meals?.[0] ?? null;

  const mealTabs = useMemo(
    () => (meals ?? []).map((m) => ({ value: String(m.id), label: m.name })),
    [meals],
  );

  // Only the visible meal's menu is fetched — the previous layout ran one
  // query per meal on mount.
  const {
    data: menu,
    isLoading: menuLoading,
    error: menuError,
    refetch: refetchMenu,
  } = useMealItems(activeMeal?.id);

  const checkout = useCafeteriaCheckout(studentSeasonId);
  const startNewAttempt = checkout.startNewAttempt;

  const handleSelectMeal = useCallback(
    (value: string) => setActiveMealId(Number(value)),
    [],
  );

  /** Selections persist per meal, so switching tabs keeps the rest of the cart. */
  const activeSelection = activeMeal ? selection[activeMeal.id] : undefined;

  const handleSelectDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      // Browsing to another day abandons the cart built for this one.
      setSelection({});
      setPrices({});
      startNewAttempt();
    },
    [startNewAttempt],
  );

  /**
   * Toggling an item changes the order, so any retained idempotency key is
   * dropped — §19 is explicit that a changed cart is a new business attempt.
   */
  const handleToggleItem = useCallback(
    (mealId: number, item: MenuItemCard) => {
      setSelection((current) => {
        const next: Selection = { ...current };
        const set = new Set(next[mealId] ?? []);
        if (set.has(item.itemId)) set.delete(item.itemId);
        else set.add(item.itemId);
        next[mealId] = set;
        return next;
      });
      setPrices((current) => ({ ...current, [item.itemId]: item.price }));
      startNewAttempt();
    },
    [startNewAttempt],
  );

  // ── Cart ────────────────────────────────────────────────────────────────
  const selectedCount = countSelected(selection);

  /**
   * One cart per meal: the API creates one order per meal, so choosing from
   * both Breakfast and Lunch is two orders.
   */
  const carts = useMemo<MealCart[]>(() => {
    if (!meals) return [];
    return meals
      .map((meal) => ({
        mealId: meal.id,
        mealName: meal.name,
        items: [...(selection[meal.id] ?? [])].map((itemId) => ({
          itemId,
          quantity: 1,
        })),
      }))
      .filter((cart) => cart.items.length > 0);
  }, [meals, selection]);

  /**
   * Display only. The guide is explicit that the backend recalculates from
   * current database prices and that `totalAmount` in the response is
   * authoritative.
   */
  const displayTotal = useMemo(
    () =>
      carts.reduce(
        (sum, cart) =>
          sum + cart.items.reduce((s, i) => s + (prices[i.itemId] ?? 0), 0),
        0,
      ),
    [carts, prices],
  );

  const handleOpenPayment = useCallback(() => setPayOpen(true), []);

  /**
   * Dismissing mid-submit would hide the outcome of an order that is already
   * on its way, so the sheet stays put until the request settles.
   */
  const checkoutPending = checkout.isPending;
  const handleClosePayment = useCallback(() => {
    if (checkoutPending) return;
    setPayOpen(false);
  }, [checkoutPending]);

  const handleDone = useCallback(() => {
    setPayOpen(false);
    setSelection({});
    setPrices({});
    startNewAttempt();
    refetchOrders();
  }, [startNewAttempt, refetchOrders]);

  return (
    <ScreenTemplate
      title={
        <Text variant="label1" weight="medium" color={colors.buttonText}>
          Meals for{" "}
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            {firstName}
          </Text>
        </Text>
      }
      bottomContent={
        /* No "repeat for 7 days" control: checkout takes no date or repeat
           field, so one call creates one order for today and there is nothing
           for such a toggle to do. */
        <Pressable
          style={[
            styles.buyButton,
            { backgroundColor: colors.primary },
            (!canOrder || !selectedCount) && styles.buyButtonDisabled,
          ]}
          onPress={handleOpenPayment}
          disabled={!canOrder || !selectedCount}
        >
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            {!canOrder
              ? "Ordering is for today only"
              : selectedCount
                ? `Buy Now · ${formatCurrency(displayTotal)}`
                : "Select items to order"}
          </Text>
        </Pressable>
      }
    >
      {/* ── Calendar ─────────────────────────────────────────────── */}
      <View style={styles.calendarCard}>
        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          anchorToSelected
        />
      </View>

      {/* ── Ordered meals for the selected day ───────────────────── */}
      <View style={styles.section}>
        <Text variant="label1" weight="semiBold" style={styles.sectionTitle}>
          Order for {formatLongDate(selectedDate)}
        </Text>

        <View style={styles.orderColumn}>
          <QueryState
            // placeholderData keeps the previous day on screen while loading.
            isLoading={ordersLoading && ordersFetching}
            error={ordersError}
            isEmpty={!orders?.length}
            emptyMessage="Nothing ordered for this day"
            onRetry={refetchOrders}
          >
            {orders?.map((order) => (
              <Card key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text variant="label2" weight="semiBold">
                    {order.mealName}
                  </Text>
                  <Text variant="label3" weight="semiBold" color={colors.primary}>
                    {formatCurrency(order.total)}
                  </Text>
                </View>
                {order.status ? (
                  <Text
                    variant="label3"
                    weight="regular"
                    color={colors.textSecondary}
                  >
                    {order.status}
                  </Text>
                ) : null}
                <View style={styles.orderItems}>
                  {order.items.map((item) => (
                    <View key={item.id} style={styles.orderItemRow}>
                      <Text variant="label3" weight="regular">
                        {item.qty > 1 ? `${item.qty} × ` : ""}
                        {item.name}
                      </Text>
                      <Text
                        variant="label3"
                        weight="medium"
                        color={colors.textSecondary}
                      >
                        {formatCurrency(item.lineTotal)}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))}

            {dayTotal > 0 ? (
              <View style={styles.dayTotalRow}>
                <Text variant="label2" weight="medium">
                  Day total
                </Text>
                <Text variant="label2" weight="bold" color={colors.primary}>
                  {formatCurrency(dayTotal)}
                </Text>
              </View>
            ) : null}
          </QueryState>
        </View>
      </View>

      {/* ── Menu: meal tabs, then a vertical list per group ──────── */}
      <QueryState
        isLoading={mealsLoading}
        error={mealsError}
        isEmpty={!meals?.length}
        emptyMessage="No menu published"
        onRetry={refetchMeals}
      >
        <View style={styles.section}>
          {mealTabs.length > 1 && activeMeal ? (
            <View style={styles.sectionTitle}>
              <SegmentedTabs
                tabs={mealTabs}
                value={String(activeMeal.id)}
                onChange={handleSelectMeal}
              />
            </View>
          ) : null}

          {activeMeal ? (
            <>
              <View style={styles.mealHeader}>
                <Text variant="label1" weight="semiBold">
                  {activeMeal.name}
                </Text>
                {activeMeal.timeWindow ? (
                  <Text
                    variant="caption1"
                    weight="regular"
                    color={colors.textSecondary}
                  >
                    {activeMeal.timeWindow}
                  </Text>
                ) : null}
              </View>

              <View style={styles.menuColumn}>
                <QueryState
                  isLoading={menuLoading}
                  error={menuError}
                  isEmpty={!menu?.groups.length}
                  emptyMessage="No items available"
                  onRetry={refetchMenu}
                >
                  {menu?.groups.map((group) => (
                    <View key={group.id} style={styles.group}>
                      <Text
                        variant="label3"
                        weight="semiBold"
                        color={colors.textSecondary}
                      >
                        {group.name}
                      </Text>
                      {group.items.map((item) => (
                        <FoodItemRow
                          key={item.id}
                          id={item.id}
                          name={item.title}
                          price={item.price}
                          selected={activeSelection?.has(item.itemId)}
                          disabled={!canOrder}
                          onPress={() => handleToggleItem(activeMeal.id, item)}
                        />
                      ))}
                    </View>
                  ))}
                </QueryState>
              </View>
            </>
          ) : null}
        </View>
      </QueryState>

      {/* ── Payment sheet ────────────────────────────────────────── */}
      <Modal
        visible={payOpen}
        transparent
        animationType="slide"
        onRequestClose={handleClosePayment}
      >
        {/* Tapping the dimmed area closes the sheet — without this there is
            no dismiss gesture at all on iOS, where onRequestClose never
            fires and a transparent modal has no swipe-down. */}
        <Pressable style={styles.modalOverlay} onPress={handleClosePayment}>
          {/* Absorbs taps so they don't reach the backdrop above. */}
          <Pressable style={styles.sheet} onPress={stopPropagation}>
            <View style={styles.handle} />
            <CheckoutSheet
              studentSeasonId={studentSeasonId}
              carts={carts}
              displayTotal={displayTotal}
              checkout={checkout}
              onDone={handleDone}
              onClose={handleClosePayment}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenTemplate>
  );
}

// ─── Payment method + submission ─────────────────────────────────────────────

interface CheckoutSheetProps {
  studentSeasonId?: number;
  carts: MealCart[];
  displayTotal: number;
  checkout: ReturnType<typeof useCafeteriaCheckout>;
  onDone: () => void;
  onClose: () => void;
}

function CheckoutSheet({
  studentSeasonId,
  carts,
  displayTotal,
  checkout,
  onDone,
  onClose,
}: CheckoutSheetProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const { data: options, isLoading, error, refetch } =
    useCafeteriaPaymentOptions(studentSeasonId);

  const [methodValue, setMethodValue] = useState<number | null>(null);
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [proof, setProof] = useState<PickedImage | null>(null);

  const method = options?.methods.find((m) => m.value === methodValue) ?? null;
  const needsProof = !!method?.needsProof;

  const startNewAttempt = checkout.startNewAttempt;
  const edit = useCallback(
    <T,>(setter: (value: T) => void) =>
      (value: T) => {
        setter(value);
        // Changing the method or payer details is a different attempt (§19).
        startNewAttempt();
      },
    [startNewAttempt],
  );

  const validationError = useMemo(() => {
    if (!method) return "Choose a payment method.";
    if (needsProof && !proof) return "Payment proof is required.";
    return null;
  }, [method, needsProof, proof]);

  /**
   * A warning, NOT a blocker. The wallet API returns negative balances as a
   * valid state, so the school allows a wallet to go below zero — refusing the
   * order here would reject a payment the backend would have accepted. The
   * backend is the authority on whether the order can go through.
   */
  const lowBalance =
    !!method?.isWallet && !!options && options.walletBalance < displayTotal;

  const handleSubmit = useCallback(() => {
    if (!method || checkout.isPending) return;

    const payment: CheckoutPayment = method.isWallet
      ? { kind: "wallet" }
      : {
          kind: "insta",
          payerName: payerName.trim(),
          payerPhoneNumber: payerPhone.trim(),
          files: proof ? [toProofFile(proof)] : [],
        };

    checkout.submit(carts, payment);
  }, [method, checkout, carts, payerName, payerPhone, proof]);

  // ── Result ──────────────────────────────────────────────────────────────
  if (checkout.outcomes.length && !checkout.isPending) {
    return (
      <CheckoutResult checkout={checkout} onDone={onDone} onClose={onClose} />
    );
  }

  return (
    <View style={styles.sheetBody}>
      <View style={styles.sheetHeader}>
        <Text variant="h5" weight="bold">
          Payment
        </Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text variant="label2" weight="medium" color={colors.textSecondary}>
            Cancel
          </Text>
        </Pressable>
      </View>

      {/* Display total only — the backend recalculates from current prices. */}
      <View style={styles.orderItemRow}>
        <Text variant="label3" weight="regular" color={colors.textSecondary}>
          {carts.length > 1
            ? `${carts.length} orders · estimated total`
            : "Estimated total"}
        </Text>
        <Text variant="label2" weight="bold">
          {formatCurrency(displayTotal)}
        </Text>
      </View>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={!options?.methods.length}
        emptyMessage="No payment methods available"
        onRetry={refetch}
      >
        {options?.methods.map((m) => (
          <Pressable
            key={m.value}
            style={[
              styles.methodRow,
              { borderColor: colors.border },
              methodValue === m.value && { borderColor: colors.primary },
            ]}
            onPress={() => edit(setMethodValue)(m.value)}
          >
            <Text variant="label2" weight="medium">
              {m.name}
            </Text>
            <Text variant="caption1" weight="regular" color={colors.textSecondary}>
              {m.isWallet
                ? `Balance ${options.walletBalanceLabel}`
                : "Payment proof required"}
            </Text>
          </Pressable>
        ))}
      </QueryState>

      {needsProof ? (
        <View style={styles.proofBlock}>
          <ScreenshotUpload
            image={proof}
            onChange={edit(setProof)}
            title="Add Payment Screenshot"
            subtitle="Supported files: JPEG, PNG"
          />
          <DefaultInput
            label="Payer Name"
            value={payerName}
            onChange={edit(setPayerName)}
            placeholder="Name on the transfer"
            type="text"
          />
          <DefaultInput
            label="Payer Phone Number"
            value={payerPhone}
            onChange={edit(setPayerPhone)}
            placeholder="01012345678"
            keyboardType="phone-pad"
            type="text"
          />
        </View>
      ) : null}

      {lowBalance ? (
        <Text variant="caption1" weight="regular" color={colors.textSecondary}>
          This is more than the wallet balance of{" "}
          {options?.walletBalanceLabel}. You can still order — the school will
          settle the difference.
        </Text>
      ) : null}

      {validationError ? (
        <Text variant="caption1" weight="regular" color={colors.textSecondary}>
          {validationError}
        </Text>
      ) : null}

      <Pressable
        style={[
          styles.buyButton,
          { backgroundColor: colors.primary },
          (!!validationError || checkout.isPending) && styles.buyButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!!validationError || checkout.isPending}
      >
        <Text variant="label1" weight="bold" color={colors.buttonText}>
          {checkout.isPending ? "Placing order…" : "Confirm Order"}
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Outcome of a checkout. Because one order is created per meal, a submission
 * can partly succeed — the orders that went through must be named so nobody
 * re-orders them.
 */
function CheckoutResult({
  checkout,
  onDone,
  onClose,
}: {
  checkout: ReturnType<typeof useCafeteriaCheckout>;
  onDone: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.sheetBody}>
      <Text variant="h5" weight="bold">
        {checkout.isComplete
          ? "Order Submitted"
          : checkout.isPartial
            ? "Partly Submitted"
            : "Order Failed"}
      </Text>

      {checkout.succeeded.map((o) => (
        <View key={o.mealId} style={styles.orderItemRow}>
          <Text variant="label3" weight="regular">
            {o.mealName} · order #{o.result?.orderId}
          </Text>
          <Text variant="label3" weight="bold" color={colors.primary}>
            {formatCurrency(o.result?.totalAmount ?? 0)}
          </Text>
        </View>
      ))}

      {checkout.succeeded.length ? (
        <Text variant="caption1" weight="regular" color={colors.textSecondary}>
          Charged {formatCurrency(checkout.totalCharged)} — this is the final
          amount calculated by the school, which may differ from the estimate.
        </Text>
      ) : null}

      {checkout.failed.map((o) => (
        <Text key={o.mealId} variant="label3" weight="regular" color={colors.errorText}>
          {o.mealName}:{" "}
          {o.error instanceof ApiError
            ? o.error.message
            : "Something went wrong."}
        </Text>
      ))}

      {checkout.isProcessing ? (
        <Text variant="caption1" weight="regular" color={colors.textSecondary}>
          Still being processed. Check your orders in a moment — don&apos;t order
          again.
        </Text>
      ) : checkout.canRetry ? (
        <>
          <Text variant="caption1" weight="regular" color={colors.textSecondary}>
            We couldn&apos;t confirm these. Retrying is safe — it won&apos;t
            order twice, and anything already placed is skipped.
          </Text>
          <Pressable onPress={checkout.retry} hitSlop={8}>
            <Text variant="label3" weight="semiBold" color={colors.primary}>
              Retry
            </Text>
          </Pressable>
        </>
      ) : null}

      <Pressable
        style={[styles.buyButton, { backgroundColor: colors.primary }]}
        onPress={checkout.succeeded.length ? onDone : onClose}
      >
        <Text variant="label1" weight="bold" color={colors.buttonText}>
          {checkout.succeeded.length ? "Done" : "Close"}
        </Text>
      </Pressable>
    </View>
  );
}

/** Derives the multipart file part from a picked image. */
function toProofFile(image: PickedImage): PaymentProofFile {
  const extension = image.uri.split(".").pop()?.toLowerCase();
  return {
    uri: image.uri,
    name: image.fileName ?? `payment-proof.${extension ?? "jpg"}`,
    type: image.mimeType ?? (extension === "png" ? "image/png" : "image/jpeg"),
    size: image.size,
  };
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    // ── Calendar ─────────────────────────────────────────────
    calendarCard: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginTop: 16,
      marginHorizontal: 16,
      alignSelf: "center",
    },

    // ── Sections ─────────────────────────────────────────────
    section: {
      width: "100%",
      marginTop: 16,
      gap: 8,
    },
    sectionTitle: {
      paddingHorizontal: 16,
    },
    mealHeader: {
      paddingHorizontal: 16,
      gap: 2,
    },
    menuColumn: {
      paddingHorizontal: 16,
      gap: 14,
      paddingBottom: 8,
    },
    group: {
      gap: 8,
    },

    // ── Order summary ────────────────────────────────────────
    orderColumn: {
      paddingHorizontal: 16,
      gap: 10,
    },
    orderCard: {
      gap: 8,
    },
    orderHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    orderItems: {
      gap: 6,
    },
    orderItemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    dayTotalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      paddingTop: 4,
    },

    // ── Bottom bar ───────────────────────────────────────────
    buyButton: {
      borderRadius: 32,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    buyButtonDisabled: {
      opacity: 0.5,
    },

    // ── Payment sheet ────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 32,
      gap: 16,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
    },
    sheetBody: {
      gap: 14,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    methodRow: {
      borderWidth: 1.5,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 2,
    },
    proofBlock: {
      gap: 14,
    },
  });
