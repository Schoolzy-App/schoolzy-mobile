import {
  BuildingsIcon,
  CalendarBlankIcon,
  CalendarCheckIcon,
  ChatCircleTextIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
  FileImageIcon,
  FilePdfIcon,
  HourglassMediumIcon,
  type Icon,
  PhoneIcon,
  UserCheckIcon,
  XCircleIcon,
} from "phosphor-react-native";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import {
  categoryIcon,
  PriorityChip,
  StatusChip,
} from "@/components/complaints/ComplaintParts";
import FormButton from "@/components/FormButton";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Spacing, Type } from "@/constants/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import { useComplaint, useStyles } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import { complaintsApi } from "@/services/api";
import type { ComplaintAttachment, ComplaintDetail } from "@/services/mappers";
import { ComplaintStatus } from "@/types/api";

type Props = RootStackScreenProps<"ComplaintDetails">;

/** One complaint (Complaints spec §5). */
export default function ComplaintDetailsScreen({ navigation, route }: Props) {
  const styles = useStyles(createStyles);
  const { complaintId } = route.params;

  const { data, isLoading, error, refetch } = useComplaint(complaintId);

  /**
   * Attachments are authenticated raw bytes, so the viewer gets a URL plus an
   * Authorization header rather than the file being pulled into JS memory.
   * `kind` comes from the stored file name, since the URL has no extension.
   */
  const handleOpenAttachment = useCallback(
    async (file: ComplaintAttachment) => {
      navigation.navigate("Pdf", {
        title: file.name,
        uri:
          file.source === "response"
            ? complaintsApi.getResponseAttachmentUrl(complaintId)
            : complaintsApi.getAttachmentUrl(complaintId),
        headers: await complaintsApi.getAttachmentHeaders(),
        kind: file.kind,
      });
    },
    [navigation, complaintId],
  );

  return (
    <ScreenTemplate variant="form" title="Complaint" headerStyle={styles.header}>
      <View style={styles.body}>
        <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
          {data ? <DetailBody item={data} onOpenAttachment={handleOpenAttachment} /> : null}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

function DetailBody({
  item,
  onOpenAttachment,
}: {
  item: ComplaintDetail;
  onOpenAttachment: (file: ComplaintAttachment) => void;
}) {
  const styles = useStyles(createStyles);
  const CategoryIcon = categoryIcon(item.category);
  const own = item.attachments.find((f) => f.source === "complaint");
  const school = item.attachments.find((f) => f.source === "response");

  return (
    <>
      {/* ── Summary ──────────────────────────────────────────────── */}
      <View style={[styles.card, styles.summary]}>
        <View style={styles.row}>
          <Text style={Type.reference} color={Palette.text.secondary}>
            {item.reference}
          </Text>
          <StatusChip status={item.status} label={item.statusLabel} large />
        </View>
        <Text style={Type.detailTitleComplaint}>{item.title}</Text>
        {item.submittedOn ? (
          <View style={styles.inline}>
            <CalendarBlankIcon size={14} color={Palette.text.secondary} />
            <Text style={Type.meta} color={Palette.text.secondary}>
              Submitted {item.submittedOn}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Your complaint ───────────────────────────────────────── */}
      <SectionLabel title="Your complaint" />
      <View style={[styles.card, styles.details]}>
        {item.studentName ? <KeyValue label="Child" value={item.studentName} /> : null}
        {item.categoryLabel ? (
          <KeyValue label="Category">
            <View style={styles.inline}>
              <CategoryIcon size={16} color={Palette.text.secondary} />
              <Text style={styles.value}>{item.categoryLabel}</Text>
            </View>
          </KeyValue>
        ) : null}
        {item.priorityLabel ? (
          <KeyValue label="Priority" last>
            <PriorityChip priority={item.priority} label={item.priorityLabel} large />
          </KeyValue>
        ) : null}

        {item.description ? (
          <>
            <Text style={styles.descriptionLabel} color={Palette.text.secondary}>
              Description
            </Text>
            <Text style={styles.description}>{item.description}</Text>
          </>
        ) : null}

        {own ? (
          <>
            <Text style={styles.descriptionLabel} color={Palette.text.secondary}>
              Your attachment
            </Text>
            <AttachmentRow file={own} onOpen={onOpenAttachment} />
          </>
        ) : null}
      </View>

      {/* ── How we can reach you ─────────────────────────────────── */}
      {item.contactMethodLabel || item.contactPhone || item.contactEmail || item.contactTime ? (
        <>
          <SectionLabel title="How we can reach you" />
          <View style={[styles.card, styles.contact]}>
            {[
              { Icon: UserCheckIcon, label: "Preferred", value: item.contactMethodLabel },
              { Icon: PhoneIcon, label: "Phone", value: item.contactPhone },
              { Icon: EnvelopeSimpleIcon, label: "Email", value: item.contactEmail },
              { Icon: ClockIcon, label: "Best time", value: item.contactTime },
            ]
              .filter((row) => row.value)
              .map((row, index) => (
                <ContactRow key={row.label} {...row} divided={index > 0} />
              ))}
          </View>
        </>
      ) : null}

      {/* ── School reply ─────────────────────────────────────────── */}
      <SectionLabel title="School reply" />
      {item.hasReply ? (
        <ReplyCard item={item} school={school} onOpenAttachment={onOpenAttachment} />
      ) : (
        <View style={[styles.card, styles.awaiting]}>
          <View style={styles.awaitingIcon}>
            <HourglassMediumIcon size={22} color={Palette.feedback.waiting} />
          </View>
          <Text style={[styles.bodyText, styles.flex]}>
            The school hasn't replied yet. You'll see their response here.
          </Text>
        </View>
      )}
    </>
  );
}

function ReplyCard({
  item,
  school,
  onOpenAttachment,
}: {
  item: ComplaintDetail;
  school?: ComplaintAttachment;
  onOpenAttachment: (file: ComplaintAttachment) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const resolved =
    item.status === ComplaintStatus.Resolved || item.status === ComplaintStatus.Closed;
  const rejected = item.status === ComplaintStatus.Rejected;

  return (
    <View style={[styles.card, styles.reply]}>
      {item.coordinatorName ? (
        <View style={styles.inline}>
          <View style={[styles.handlerIcon, { backgroundColor: colors.primary }]}>
            <BuildingsIcon weight="fill" size={20} color={Palette.text.onBrand} />
          </View>
          <View style={styles.flex}>
            <Text style={Type.caption} color={Palette.text.secondary}>
              Handled by
            </Text>
            <Text style={Type.cardHeading}>{item.coordinatorName}</Text>
          </View>
        </View>
      ) : null}

      {item.assignedOn || item.followUpOn ? (
        <View style={styles.metaChips}>
          {item.assignedOn ? (
            <MetaChip Icon={CalendarBlankIcon} text={`Assigned ${item.assignedOn}`} />
          ) : null}
          {item.followUpOn ? (
            <MetaChip Icon={CalendarCheckIcon} text={`Follow-up ${item.followUpOn}`} />
          ) : null}
        </View>
      ) : null}

      {item.coordinatorNotes ? (
        <View style={styles.noteBlock}>
          <View style={styles.inline}>
            <ChatCircleTextIcon size={15} color={Palette.text.secondary} />
            <Text style={Type.meta} color={Palette.text.secondary}>
              Coordinator notes
            </Text>
          </View>
          <View style={[styles.box, { backgroundColor: Palette.form.notesBox }]}>
            <Text style={styles.boxText}>{item.coordinatorNotes}</Text>
          </View>
        </View>
      ) : null}

      {resolved && item.resolution ? (
        <View style={styles.noteBlock}>
          <View style={styles.inline}>
            <CheckCircleIcon weight="fill" size={15} color={Palette.feedback.success} />
            <Text style={Type.meta} color={Palette.text.secondary}>
              Resolution
            </Text>
          </View>
          <View style={[styles.box, { backgroundColor: Palette.feedback.successBox }]}>
            <Text style={styles.boxText}>{item.resolution}</Text>
          </View>
          {item.resolvedOn ? (
            <Text style={Type.meta} color={Palette.text.secondary}>
              Resolved on {item.resolvedOn}
            </Text>
          ) : null}
        </View>
      ) : null}

      {rejected && item.rejectionReason ? (
        <View style={[styles.box, styles.rejectBox]}>
          <View style={styles.inline}>
            <XCircleIcon weight="fill" size={17} color={Palette.status.danger.solid} />
            <Text style={Type.fieldLabel}>Reason for rejection</Text>
          </View>
          <Text style={styles.boxText}>{item.rejectionReason}</Text>
        </View>
      ) : null}

      {school ? (
        <AttachmentRow file={school} onOpen={onOpenAttachment} fromSchool />
      ) : null}
    </View>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  const styles = useStyles(createStyles);
  return (
    <Text style={[Type.sectionLabelDetail, styles.sectionLabel]} color={Palette.text.body}>
      {title}
    </Text>
  );
}

function KeyValue({
  label,
  value,
  children,
  last,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  last?: boolean;
}) {
  const styles = useStyles(createStyles);
  return (
    <View style={[styles.kv, !last && styles.kvDivided]}>
      <Text style={Type.rowLabel} color={Palette.text.secondary}>
        {label}
      </Text>
      {children ?? <Text style={styles.value}>{value}</Text>}
    </View>
  );
}

function ContactRow({
  Icon,
  label,
  value,
  divided,
}: {
  Icon: Icon;
  label: string;
  value: string;
  divided: boolean;
}) {
  const styles = useStyles(createStyles);
  return (
    <View style={[styles.contactRow, divided && styles.contactDivided]}>
      <Icon size={18} color={Palette.text.secondary} />
      <Text style={[Type.rowLabel, styles.flex]} color={Palette.text.secondary}>
        {label}
      </Text>
      {/* Phone numbers and emails stay left-to-right, even in Arabic. */}
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function MetaChip({ Icon, text }: { Icon: Icon; text: string }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.metaChip}>
      <Icon size={14} color={Palette.text.secondary} />
      <Text style={Type.meta} color={Palette.text.body}>
        {text}
      </Text>
    </View>
  );
}

function AttachmentRow({
  file,
  onOpen,
  fromSchool,
}: {
  file: ComplaintAttachment;
  onOpen: (file: ComplaintAttachment) => void;
  fromSchool?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const accent = fromSchool ? colors.primary : Palette.action.primary;
  const FileIcon = file.kind === "pdf" ? FilePdfIcon : FileImageIcon;

  return (
    <View style={styles.fileRow}>
      <View style={[styles.fileTile, { backgroundColor: `${accent}14` }]}>
        <FileIcon size={20} color={accent} />
      </View>
      <View style={styles.flex}>
        <Text style={Type.itemTitle} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={Type.caption} color={Palette.text.secondary}>
          {fromSchool ? "From the school" : "You attached this"}
        </Text>
      </View>
      <View>
        <FormButton
          label="Open"
          variant="outline"
          height={36}
          color={accent}
          onPress={() => onOpen(file)}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    header: {
      paddingBottom: Spacing.form.headerPaddingBottom,
    },
    body: {
      width: "100%",
      paddingTop: Spacing.form.bodyPadding,
      paddingHorizontal: Spacing.form.bodyPadding,
      paddingBottom: 32,
      gap: Spacing.form.bodyGap.detail,
    },
    flex: {
      flex: 1,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.card,
    },
    summary: {
      padding: 16,
      gap: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    inline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionLabel: {
      marginTop: 8,
      marginHorizontal: 4,
    },
    details: {
      paddingTop: 6,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    kv: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 10,
    },
    kvDivided: {
      borderBottomWidth: 1,
      borderBottomColor: Palette.border.divider,
    },
    value: {
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 18,
    },
    descriptionLabel: {
      fontSize: 14,
      lineHeight: 17,
      marginTop: 12,
      marginBottom: 6,
    },
    description: {
      fontSize: 16,
      lineHeight: 25,
    },
    contact: {
      paddingVertical: 4,
      paddingHorizontal: 16,
    },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 11,
    },
    contactDivided: {
      borderTopWidth: 1,
      borderTopColor: Palette.border.divider,
    },
    awaiting: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 18,
      paddingHorizontal: 16,
    },
    awaitingIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Palette.feedback.waitingTint,
      alignItems: "center",
      justifyContent: "center",
    },
    bodyText: {
      fontSize: 15,
      lineHeight: 22,
      color: Palette.text.body,
    },
    reply: {
      padding: 16,
      gap: 14,
    },
    handlerIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    metaChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    metaChip: {
      height: 30,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      borderRadius: 15,
      backgroundColor: Palette.form.neutralChip,
    },
    noteBlock: {
      gap: 8,
    },
    box: {
      borderRadius: Radius.input,
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 6,
    },
    boxText: {
      fontSize: 16,
      lineHeight: 24,
    },
    rejectBox: {
      backgroundColor: Palette.form.errorBannerBg,
      borderWidth: 1,
      borderColor: Palette.form.errorBannerBorder,
    },
    fileRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: Radius.iconTile,
      borderWidth: 1,
      borderColor: Palette.border.default,
    },
    fileTile: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
  });
