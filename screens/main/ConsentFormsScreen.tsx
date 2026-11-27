import {
  CalendarBlankIcon,
  CheckCircleIcon,
  CoinsIcon,
  FileTextIcon,
  UserIcon,
} from "phosphor-react-native";
import React, { memo, useCallback, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";

import { ConsentStatusChip, ConsentTypeChip, ToneChip } from "@/components/consentForms/ConsentChips";
import { InfoHint } from "@/components/form/FormParts";
import SegmentedControl from "@/components/SegmentedControl";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { consentStrings } from "@/constants/consentFormStrings";
import { Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import { useConsentForms } from "@/hooks";
import { useRefetchOnRefocus } from "@/hooks/useRefetchOnRefocus";
import type { RootStackScreenProps } from "@/navigation/types";
import type { ConsentListFilter } from "@/services/api/consentForms";
import { consentStatusLabel, type ConsentForm } from "@/services/mappers";
import { formatCurrency, formatDateTime } from "@/utils/format";

type Props = RootStackScreenProps<"ConsentForms">;

/** Consent forms: waiting for an answer, and answered / closed. */
export default function ConsentFormsScreen({ navigation }: Props) {
  const s = consentStrings();
  const [tab, setTab] = useState<ConsentListFilter>("pending");
  const { data, isLoading, error, refetch, isRefetching } = useConsentForms(tab);

  // Back from answering a form: the list (and its tab) has changed.
  useRefetchOnRefocus(refetch);

  // Only a pull shows the spinner, not a background refocus refetch.
  const [pulling, setPulling] = useState(false);
  const onPull = useCallback(async () => {
    setPulling(true);
    try {
      await refetch();
    } finally {
      setPulling(false);
    }
  }, [refetch]);

  const handleOpen = useCallback(
    (form: ConsentForm) => navigation.navigate("ConsentFormDetails", { recipientId: form.id }),
    [navigation],
  );

  const items = data ?? [];
  const blockingError = data ? null : error;
  const isEmpty = !isLoading && !!data && items.length === 0;

  return (
    <ScreenTemplate
      variant="form"
      title={s.title}
      headerStyle={styles.header}
      refreshControl={
        <RefreshControl refreshing={pulling && isRefetching} onRefresh={onPull} />
      }
    >
      <View style={styles.body}>
        <SegmentedControl
          options={[
            { value: "pending", label: s.tabPending },
            { value: "answered", label: s.tabAnswered },
          ]}
          value={tab}
          onChange={setTab}
        />
        <QueryState isLoading={isLoading} error={blockingError} onRetry={refetch}>
          {error && data ? <InfoHint text={s.refreshFailed} /> : null}
          {isEmpty ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                {tab === "pending" ? (
                  <CheckCircleIcon size={30} color={Palette.action.primary} />
                ) : (
                  <FileTextIcon size={30} color={Palette.action.primary} />
                )}
              </View>
              <Text style={Type.emptyTitle}>
                {tab === "pending" ? s.emptyPendingTitle : s.emptyAnsweredTitle}
              </Text>
              <Text style={styles.emptyBody} color={Palette.text.secondary}>
                {tab === "pending" ? s.emptyPendingBody : s.emptyAnsweredBody}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {items.map((form) => (
                <ConsentFormCard key={form.id} form={form} onSelect={handleOpen} />
              ))}
            </View>
          )}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

const ConsentFormCard = memo(function ConsentFormCard({
  form,
  onSelect,
}: {
  form: ConsentForm;
  onSelect: (form: ConsentForm) => void;
}) {
  const s = consentStrings();
  const deadline = form.deadlineText ? formatDateTime(form.deadlineText) : "";
  return (
    <Pressable
      onPress={() => onSelect(form)}
      accessibilityRole="button"
      accessibilityLabel={[form.title, form.studentName, consentStatusLabel(form.status)]
        .filter(Boolean)
        .join(", ")}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        <Text style={[Type.cardTitle, styles.flex]} numberOfLines={2}>
          {form.title}
        </Text>
        <ConsentStatusChip status={form.status} />
      </View>

      <View style={styles.chips}>
        <ConsentTypeChip kind={form.linkKind} />
        {form.isPaid ? (
          <ToneChip label={s.paid} tone={Palette.status.success} dot={false} />
        ) : null}
      </View>

      <View style={styles.meta}>
        {form.studentName ? (
          <View style={styles.metaItem}>
            <UserIcon size={15} color={Palette.text.secondary} />
            <Text style={Type.meta} color={Palette.text.secondary} numberOfLines={1}>
              {form.studentName}
            </Text>
          </View>
        ) : null}
        {deadline ? (
          <View style={styles.metaItem}>
            <CalendarBlankIcon size={15} color={Palette.text.secondary} />
            <Text style={Type.meta} color={Palette.text.secondary}>
              {s.answerBy} {deadline}
            </Text>
          </View>
        ) : null}
        {form.collectPayment && form.amount > 0 ? (
          <View style={styles.metaItem}>
            <CoinsIcon size={15} color={Palette.text.secondary} />
            <Text style={Type.meta} color={Palette.text.secondary}>
              {formatCurrency(form.amount)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingBottom: Spacing.form.headerPaddingBottom,
  },
  body: {
    width: "100%",
    padding: Spacing.form.bodyPadding,
    gap: Spacing.form.bodyGap.form,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: Palette.surface.card,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 9,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: Palette.surface.pressedRow,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 4,
    columnGap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  emptyCard: {
    alignItems: "center",
    gap: 12,
    backgroundColor: Palette.surface.card,
    borderRadius: Radius.card,
    paddingVertical: 40,
    paddingHorizontal: 22,
  },
  emptyIcon: {
    width: Size.emptyIconCircle,
    height: Size.emptyIconCircle,
    borderRadius: Size.emptyIconCircle / 2,
    backgroundColor: Palette.action.tint8,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
