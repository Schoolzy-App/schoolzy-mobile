import type { AnnouncementData } from "@/components/AnnouncementItem";
import type { NewsletterDto } from "@/types/api";
import { formatTime } from "@/utils/format";

/** Newsletter row plus the fields the PDF viewer needs. */
export interface NewsletterListItem extends AnnouncementData {
  /** Numeric API id — used to build the file URL. */
  newsletterId: number;
  /** Direct URL when the API supplies one; otherwise fall back to the file endpoint. */
  fileUrl: string | null;
}

export function toNewsletterItem(dto: NewsletterDto): NewsletterListItem {
  return {
    id: String(dto.id),
    newsletterId: dto.id,
    title: dto.name ?? "",
    subtitle: dto.description ?? "",
    time: formatTime(dto.date),
    fileUrl: dto.fileUrl,
  };
}

/** `select` for the newsletters query. */
export function selectNewsletters(data: NewsletterDto[]): NewsletterListItem[] {
  return data.map(toNewsletterItem);
}
