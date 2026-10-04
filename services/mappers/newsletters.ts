import type { AnnouncementData } from "@/components/AnnouncementItem";
import type { NewsletterDto, NewsletterItemSource } from "@/types/api";
import { formatDate, formatTime } from "@/utils/format";

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
}

export function toNewsletterItem(dto: NewsletterDto): NewsletterListItem {
  return {
    id: String(dto.id),
    newsletterId: dto.id,
    title: dto.name ?? "",
    subtitle: dto.description ?? "",
    date: formatDate(dto.date),
    time: formatTime(dto.date),
    source: dto.source,
  };
}

/** `select` for the newsletters query. */
export function selectNewsletters(data: NewsletterDto[]): NewsletterListItem[] {
  return data.map(toNewsletterItem);
}
