import type { AnnouncementData } from "@/components/AnnouncementItem";
import type {
  NewsletterDetailDto,
  NewsletterDto,
  NewsletterItemSource,
} from "@/types/api";
import { formatDate, formatTime } from "@/utils/format";

export type NewsletterKind = "announcement" | "letter";

/** Newsletter row plus the fields the viewer needs. */
export interface NewsletterListItem extends AnnouncementData {
  /** Numeric API id — only meaningful together with `source`. */
  newsletterId: number;
  /**
   * Which table the row came from: a real newsletter, or a student report
   * published to parents. Both are needed to build the file URL, and the id
   * alone is ambiguous because the two tables allocate ids independently.
   */
  source: NewsletterItemSource;
  kind: NewsletterKind;
  /** "Announcement" / "Letter" */
  kindLabel: string;
  /** "All school", "Year 4", or a child's name; may be empty. */
  audience: string;
  /** Rows with no read state (letters) count as read — nothing to clear. */
  isRead: boolean;
  hasAttachment: boolean;
  /** "24 Oct", for the right edge of a card. */
  shortDate: string;
  /** "SAT, 24 OCT", the day group the row belongs to. */
  dayLabel: string;
}

/**
 * Kind comes from the server; a response without it falls back to the same
 * rule the server uses — student reports are letters.
 */
function toKind(dto: NewsletterDto): NewsletterKind {
  if (dto.kind) return dto.kind === 2 ? "letter" : "announcement";
  return dto.source === 2 ? "letter" : "announcement";
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    .replace(",", "")
    .replace(/^(\w+)/, "$1,")
    .toUpperCase();
}

export function toNewsletterItem(dto: NewsletterDto): NewsletterListItem {
  const kind = toKind(dto);
  return {
    id: `${dto.source}-${dto.id}`,
    newsletterId: dto.id,
    title: dto.name ?? "",
    subtitle: dto.description ?? "",
    date: formatDate(dto.date),
    time: formatTime(dto.date),
    source: dto.source,
    kind,
    kindLabel: dto.kindDisplay || (kind === "letter" ? "Letter" : "Announcement"),
    audience: dto.audience?.trim() ?? "",
    isRead: dto.isRead !== false,
    hasAttachment: !!dto.hasAttachment,
    shortDate: shortDate(dto.date),
    dayLabel: dayLabel(dto.date),
  };
}

/** `select` for the newsletters query. */
export function selectNewsletters(data: NewsletterDto[]): NewsletterListItem[] {
  return data.map(toNewsletterItem);
}

export interface NewsletterDetail extends NewsletterListItem {
  body: string;
  attachment: {
    name: string;
    /** "PDF · 310 KB" */
    meta: string;
    isPdf: boolean;
  } | null;
}

/** "310 KB" / "1.2 MB"; empty when the size is unknown. */
function fileSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** `select` for the newsletter detail query. */
export function selectNewsletterDetail(dto: NewsletterDetailDto): NewsletterDetail {
  const attachment = dto.attachment;
  const isPdf =
    !!attachment &&
    (/pdf/i.test(attachment.contentType) || /\.pdf$/i.test(attachment.name));
  const type = isPdf
    ? "PDF"
    : (attachment?.name.split(".").pop() ?? "").toUpperCase();

  return {
    ...toNewsletterItem(dto),
    body: dto.body?.trim() || dto.description?.trim() || "",
    attachment: attachment
      ? {
          name: attachment.name,
          meta: [type, fileSize(attachment.size)].filter(Boolean).join(" · "),
          isPdf,
        }
      : null,
  };
}
