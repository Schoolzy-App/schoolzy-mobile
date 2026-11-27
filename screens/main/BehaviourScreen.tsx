import {
  BookOpenIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ClockIcon,
  MedalIcon,
  ShieldStarIcon,
  StarIcon,
  ThumbsUpIcon,
  TrophyIcon,
  WarningCircleIcon,
  type Icon,
} from "phosphor-react-native";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  I18nManager,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import type { ColorPalette } from "@/apps";
import { directionalAlign } from "@/components/report/ReportCard";
import { ScheduleEmpty } from "@/components/schedule/ScheduleParts";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Opacity, Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useStudentBehaviour, useStyles } from "@/hooks";
import { useRefetchOnRefocus } from "@/hooks/useRefetchOnRefocus";
import { behaviourStrings, formatBehaviourDate } from "@/i18n/behaviour";
import type { RootStackScreenProps } from "@/navigation/types";
import { studentsApi } from "@/services/api";
import type {
  BehaviourCertificate,
  BehaviourEntry,
  BehaviourHouse,
  StudentBehaviour,
} from "@/services/mappers";

type Props = RootStackScreenProps<"Behaviour">;

const MERIT = Palette.status.success;
const DEMERIT = Palette.status.danger;

/** Font Awesome names from the API → Phosphor. */
function EntryGlyph({ entry, color }: { entry: BehaviourEntry; color: string }) {
  const name = (entry.icon ?? "").toLowerCase().replace(/^fa[srb]?[-\s]+/, "").trim();
  const props = { weight: "fill" as const, size: 20, color };
  switch (name) {
    case "star":
      return <StarIcon {...props} />;
    case "thumbs-up":
    case "thumbs-o-up":
      return <ThumbsUpIcon {...props} />;
    case "book":
    case "book-open":
      return <BookOpenIcon {...props} />;
    case "clock":
    case "clock-o":
      return <ClockIcon {...props} />;
    case "exclamation":
    case "exclamation-circle":
    case "exclamation-triangle":
      return <WarningCircleIcon {...props} />;
    default:
      return entry.isMerit ? <StarIcon {...props} /> : <WarningCircleIcon {...props} />;
  }
}

/**
 * Server text can be Arabic inside the English layout. In an RTL layout the
 * natural alignment already fits, and a forced "right" would be flipped.
 */
const serverAlign = (text: string) => (I18nManager.isRTL ? null : directionalAlign(text));

/** White or dark text, whichever reads on the house colour. */
function onColour(hex: string): string {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return Palette.text.onBrand;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? Palette.text.primary : Palette.text.onBrand;
}

const LOGO_IMAGE = { width: 40, height: 40 } as const;

const Chevron = I18nManager.isRTL ? CaretLeftIcon : CaretRightIcon;

/** Points, house, certificates and history for one child. */
export default function BehaviourScreen({ navigation, route }: Props) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = behaviourStrings();
  const { studentSeasonId, studentName } = route.params;

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStudentBehaviour(studentSeasonId);

  useRefetchOnRefocus(refetch);

  const firstName = (data?.studentName || studentName || "").split(" ")[0];

  const openCertificate = useCallback(
    async (certificate: BehaviourCertificate) => {
      if (certificate.studentReportId == null) return;
      navigation.navigate("Pdf", {
        title: t.certificateTitle(certificate.name),
        uri: studentsApi.getReportFileUrl(studentSeasonId, certificate.studentReportId),
        headers: await studentsApi.getReportFileHeaders(),
        kind: "pdf",
      });
    },
    [navigation, studentSeasonId, t],
  );

  const hasPoints = !!data && (data.entries.length > 0 || data.meritCount + data.demeritCount > 0);

  return (
    <ScreenTemplate
      scrollHeader
      headerStyle={styles.header}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      title={
        <Text style={Type.headerTitleModule} color={Palette.text.onBrand} numberOfLines={1}>
          {firstName ? `${t.titleFor} ` : t.module}
          {firstName ? (
            <Text style={[Type.headerTitleModule, Type.bold]} color={Palette.text.onBrand}>
              {firstName}
            </Text>
          ) : null}
        </Text>
      }
    >
      <View style={styles.body}>
        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          {data ? (
            <>
              <HouseCard data={data} />

              {hasPoints ? <Totals data={data} /> : null}

              <Milestone data={data} />

              {data.certificates.length ? (
                <View style={styles.section}>
                  <Text style={Type.financeSection}>{t.certificates}</Text>
                  <View style={styles.list}>
                    {data.certificates.map((certificate) => (
                      <CertificateRow
                        key={certificate.id}
                        certificate={certificate}
                        onPress={openCertificate}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {hasPoints ? (
                <View style={styles.section}>
                  <Text style={Type.financeSection}>{t.history}</Text>
                  <View style={styles.list}>
                    {data.entries.map((entry) => (
                      <EntryRow key={entry.id} entry={entry} />
                    ))}
                  </View>

                  {hasNextPage ? (
                    <Pressable
                      style={({ pressed }) => [styles.loadMore, pressed && styles.pressed]}
                      onPress={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={Type.link} color={colors.primary}>
                          {t.loadMore}
                        </Text>
                      )}
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <ScheduleEmpty Icon={StarIcon} title={t.emptyTitle} hint={t.emptyHint} />
              )}
            </>
          ) : null}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

// ─── House header ────────────────────────────────────────────────────────────

function HouseCard({ data }: { data: StudentBehaviour }) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const t = behaviourStrings();
  const house: BehaviourHouse | null = data.house;

  const background = house?.colour ?? colors.primary;
  const fg = onColour(background);
  const subtitle = [data.studentName, data.className].filter(Boolean).join(" · ");

  return (
    <View style={[styles.houseCard, { backgroundColor: background }]}>
      <View style={styles.houseRow}>
        <View style={styles.houseLogo}>
          {house?.logoUri ? (
            <Image source={{ uri: house.logoUri }} style={LOGO_IMAGE} resizeMode="contain" />
          ) : (
            <ShieldStarIcon weight="fill" size={26} color={background} />
          )}
        </View>

        <View style={styles.flex}>
          <Text style={[Type.caption, styles.dim]} color={fg} numberOfLines={1}>
            {house ? t.house : subtitle}
          </Text>
          <Text style={[Type.summaryValue, house ? serverAlign(house.name) : null]} color={fg} numberOfLines={1}>
            {house ? house.name : t.noHouse}
          </Text>
        </View>

        {house?.rank != null && house.houseCount ? (
          <View style={[styles.rankPill, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
            <TrophyIcon weight="fill" size={14} color={fg} />
            <Text style={Type.statusChipText} color={fg} numberOfLines={1}>
              {t.rankOf(house.rank, house.houseCount)}
            </Text>
          </View>
        ) : null}
      </View>

      {house ? (
        <View style={styles.houseFooter}>
          <Text style={Type.cardHeading} color={fg} numberOfLines={1}>
            {t.housePoints(house.points)}
          </Text>
          {subtitle ? (
            <Text style={[Type.caption, styles.dim, styles.flexShrink]} color={fg} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ─── Merit / demerit totals ──────────────────────────────────────────────────

function Totals({ data }: { data: StudentBehaviour }) {
  const styles = useStyles(createStyles);
  const t = behaviourStrings();
  return (
    <View style={styles.totals}>
      <TotalTile
        label={t.merit}
        value={`+${data.meritPoints}`}
        hint={t.timesCount(data.meritCount)}
        tone={MERIT}
        Icon={StarIcon}
      />
      <TotalTile
        label={t.demerit}
        value={`-${data.demeritPoints}`}
        hint={t.timesCount(data.demeritCount)}
        tone={DEMERIT}
        Icon={WarningCircleIcon}
      />
    </View>
  );
}

function TotalTile({
  label,
  value,
  hint,
  tone,
  Icon: TileIcon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: { fg: string; solid: string; tint: string };
  Icon: Icon;
}) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.totalTile}>
      <View style={styles.totalHead}>
        <View style={[styles.iconTile, { backgroundColor: tone.tint }]}>
          <TileIcon weight="fill" size={20} color={tone.solid} />
        </View>
        <Text style={Type.chipSmall} color={Palette.text.secondary} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[Type.amountLarge, styles.ltr]} color={tone.fg}>
        {value}
      </Text>
      <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
}

// ─── Progress to the next milestone ──────────────────────────────────────────

function Milestone({ data }: { data: StudentBehaviour }) {
  const styles = useStyles(createStyles);
  const t = behaviourStrings();
  const next = data.nextMilestone;

  if (!next) {
    // No milestone left: worth saying only when some were reached.
    if (!data.certificates.length) return null;
    return (
      <View style={[styles.card, styles.milestoneDone]}>
        <MedalIcon weight="fill" size={22} color={Palette.module.behaviour.solid} />
        <Text style={[Type.cardHeading, styles.flex]}>{t.allMilestones}</Text>
      </View>
    );
  }

  const threshold = Math.max(next.threshold, 1);
  const done = Math.min(Math.max(threshold - next.remaining, 0), threshold);
  const percent = Math.round((done / threshold) * 100);

  return (
    <View style={[styles.card, styles.milestone]}>
      <View style={styles.rowBetween}>
        <View style={styles.inline}>
          <MedalIcon weight="fill" size={18} color={Palette.module.behaviour.solid} />
          <Text style={Type.cardHeading} numberOfLines={1}>
            {t.nextMilestone(next.name ?? "")}
          </Text>
        </View>
        <Text style={[Type.chipSmall, styles.ltr]} color={Palette.text.secondary}>
          {done} / {next.threshold}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${percent}%`, backgroundColor: Palette.module.behaviour.solid },
          ]}
        />
      </View>
      <Text style={Type.caption} color={Palette.text.tertiary}>
        {t.pointsToGo(next.remaining)}
      </Text>
    </View>
  );
}

// ─── Rows ────────────────────────────────────────────────────────────────────

function CertificateRow({
  certificate,
  onPress,
}: {
  certificate: BehaviourCertificate;
  onPress: (certificate: BehaviourCertificate) => void;
}) {
  const styles = useStyles(createStyles);
  const t = behaviourStrings();
  const colour = certificate.colour ?? Palette.module.behaviour.solid;
  const ready = certificate.studentReportId != null;
  const meta = [t.certificatePoints(certificate.threshold), formatBehaviourDate(certificate.awardedAt)]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={() => onPress(certificate)}
      disabled={!ready}
      style={({ pressed }) => [styles.card, styles.row, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.iconTile,
          { backgroundColor: colour.length >= 7 ? `${colour.slice(0, 7)}1F` : Palette.module.behaviour.tint },
        ]}
      >
        <MedalIcon weight="fill" size={22} color={colour} />
      </View>
      <View style={styles.flex}>
        <Text style={[Type.itemTitle, serverAlign(certificate.name)]} numberOfLines={1}>
          {certificate.name}
        </Text>
        <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
          {ready ? meta : t.certificatePending}
        </Text>
      </View>
      {ready ? <Chevron weight="bold" size={14} color={Palette.text.chevron} /> : null}
    </Pressable>
  );
}

function EntryRow({ entry }: { entry: BehaviourEntry }) {
  const styles = useStyles(createStyles);
  const t = behaviourStrings();
  const tone = entry.isMerit ? MERIT : DEMERIT;
  const meta = [entry.category, formatBehaviourDate(entry.date)].filter(Boolean).join(" · ");

  return (
    <View style={[styles.card, styles.entry]}>
      <View style={[styles.iconTile, { backgroundColor: tone.tint }]}>
        <EntryGlyph entry={entry} color={tone.solid} />
      </View>

      <View style={[styles.flex, styles.entryText]}>
        <Text style={[Type.itemTitle, serverAlign(entry.reason)]} numberOfLines={2}>
          {entry.reason}
        </Text>
        {meta ? (
          <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {entry.note ? (
          <Text style={[Type.meta, styles.note, serverAlign(entry.note)]} color={Palette.text.body}>
            {entry.note}
          </Text>
        ) : null}
        {entry.awardedBy ? (
          <Text style={Type.caption} color={Palette.text.secondary} numberOfLines={1}>
            {t.awardedBy(entry.awardedBy)}
          </Text>
        ) : null}
      </View>

      <View style={[styles.pointsChip, { backgroundColor: tone.tint }]}>
        <Text style={[Type.statusChipText, styles.ltr]} color={tone.fg}>
          {entry.pointsLabel}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    header: {
      borderBottomLeftRadius: Radius.header,
      borderBottomRightRadius: Radius.header,
    },
    body: {
      width: "100%",
      paddingHorizontal: Spacing.screenX,
      paddingTop: Spacing.contentTop.modules,
      paddingBottom: Spacing.bottomInset.modulesScroll,
      gap: 15,
    },
    flex: {
      flex: 1,
    },
    flexShrink: {
      flexShrink: 1,
    },
    dim: {
      opacity: 0.85,
    },
    /** Keeps "+2" / "-1" in order inside RTL text. */
    ltr: {
      writingDirection: "ltr",
    },
    pressed: {
      opacity: Opacity.pressedCard,
    },
    section: {
      gap: Spacing.sectionTitleToContent,
    },
    list: {
      gap: 10,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    inline: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.iconTextGap.inline,
      flexShrink: 1,
    },
    iconTile: {
      width: Size.iconTile,
      height: Size.iconTile,
      borderRadius: Radius.iconTile,
      alignItems: "center",
      justifyContent: "center",
    },

    // ── House ─────────────────────────────────────────────
    houseCard: {
      borderRadius: Radius.financeCard,
      padding: 16,
      gap: 14,
    },
    houseRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    houseLogo: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    rankPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: Radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    houseFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },

    // ── Totals ────────────────────────────────────────────
    totals: {
      flexDirection: "row",
      gap: 12,
    },
    totalTile: {
      flex: 1,
      gap: 6,
      padding: 14,
      borderRadius: Radius.financeCard,
      backgroundColor: colors.surface,
    },
    totalHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 4,
    },

    // ── Milestone ─────────────────────────────────────────
    milestone: {
      padding: 14,
      gap: 10,
    },
    milestoneDone: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
    },
    progressTrack: {
      height: Size.progressBar,
      borderRadius: Radius.progress,
      backgroundColor: Palette.border.divider,
      flexDirection: "row",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: Radius.progress,
    },

    // ── History ───────────────────────────────────────────
    entry: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      padding: 14,
    },
    entryText: {
      gap: 3,
    },
    note: {
      fontStyle: "italic",
      marginTop: 2,
    },
    pointsChip: {
      minWidth: 44,
      height: Size.statusChip,
      borderRadius: Radius.statusChip,
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    loadMore: {
      alignSelf: "center",
      minWidth: 140,
      marginTop: 4,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: Palette.border.default,
      backgroundColor: Palette.surface.card,
      alignItems: "center",
      justifyContent: "center",
    },
  });
