import type { AgendaDto, AgendaItemDto } from "@/types/api";
import type { DynamicStateData } from "@/components/DynamicStateItem";
import { formatDate, formatTime } from "@/utils/format";

/** Attendance percentage rendered by the CircularProgress ring. */
export interface AgendaSummary {
  studentName: string;
  attendanceStatus: string;
  attendancePercentage: number;
  items: DynamicStateData[];
  /** Marked days for the calendar strip — absences, when the API reports one. */
  isAbsent: boolean;
}

/** The API sends a loose string discriminator; normalize it once here. */
function toStateType(item: AgendaItemDto): DynamicStateData["type"] {
  const type = item.type?.toLowerCase() ?? "";
  if (type.includes("exam")) return "medical";
  if (type.includes("homework")) return "homework";
  return "homework";
}

function toSubtitle(item: AgendaItemDto): string {
  // Completion is the most useful thing to a parent, so it wins over the date.
  if (item.isCompleted) return "Completed";
  if (item.endDate) return `Due ${formatDate(item.endDate)}`;
  if (item.startDate) return formatTime(item.startDate);
  return item.examStatus ?? item.homeworkSource ?? "";
}

export function selectAgenda(dto: AgendaDto): AgendaSummary {
  const items = (dto.items ?? []).map<DynamicStateData>((item) => ({
    id: String(item.id),
    type: toStateType(item),
    title: item.subjectName
      ? `${item.title ?? ""} · ${item.subjectName}`.trim()
      : (item.title ?? ""),
    subtitle: toSubtitle(item),
  }));

  const status = dto.attendance?.status ?? "";

  return {
    studentName: dto.studentName ?? "",
    attendanceStatus: status,
    attendancePercentage: Math.round(
      dto.attendance?.yearAttendancePercentage ?? 0,
    ),
    items,
    isAbsent: status.toLowerCase().includes("absent"),
  };
}
