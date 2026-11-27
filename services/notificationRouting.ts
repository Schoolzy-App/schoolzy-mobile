import { behaviourApi, newslettersApi, studentsApi } from "@/services/api";
import { selectStudentReports } from "@/services/mappers";
import { FeatureFlags } from "@/constants/featureFlags";
import { NotificationType } from "@/types/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("notification:route");

/** A screen to open, with its params. */
export interface NotificationDestination {
  screen: string;
  params?: object;
}

/**
 * Report notifications → the report category their report lives under, so
 * the lookup only pages through that category.
 */
const REPORT_CATEGORY: Partial<Record<number, number>> = {
  [NotificationType.ClinicReport]: 3, // Medical
  [NotificationType.AdminForm]: 6,
  [NotificationType.MonthlyExamReport]: 7,
  [NotificationType.StudentDynamicReport]: 8,
};

const BY_NAME = NotificationType as Record<string, number>;

/** The inbox sends the type as a number; a push sends its name. */
export function toNotificationType(type: number | string | null | undefined): number | null {
  if (typeof type === "number") return type;
  const text = type?.trim() ?? "";
  if (!text) return null;
  if (/^\d+$/.test(text)) return Number(text);
  return BY_NAME[text] ?? null;
}

/**
 * A report notification carries the report's id but not the student. Each
 * child's reports in that category are searched for it — the same list the
 * Reports screen shows — so the report opens with its full details.
 */
async function findReport(reportId: number, category: number) {
  const students = await studentsApi.list();
  for (const student of students) {
    const page = await studentsApi.reports(student.studentSeasonId, {
      category,
      page: 1,
      pageSize: 100,
    });
    const report = selectStudentReports({ pages: [page] }).reports.find(
      (r) => r.reportId === reportId,
    );
    if (report) return { studentSeasonId: student.studentSeasonId, report };
  }
  return null;
}

/** "/Parent/Behaviour?studentSeasonId=4521" → 4521. */
function seasonFromUrl(actionUrl?: string | null): number | null {
  const match = actionUrl?.match(/[?&]studentSeasonId=(\d+)/i);
  return match ? Number(match[1]) : null;
}

/** "/Parent/NewsletterReport/ShowReport/3301" → 3301. */
function reportFromUrl(actionUrl?: string | null): number | null {
  const match = actionUrl?.match(/\/NewsletterReport\/ShowReport\/(\d+)/i);
  return match ? Number(match[1]) : null;
}

async function reportPdf(reportId: number, studentSeasonId?: number) {
  return {
    screen: "Pdf",
    params: {
      title: "Report",
      uri:
        studentSeasonId != null
          ? studentsApi.getReportFileUrl(studentSeasonId, reportId)
          : studentsApi.getReportFileUrlById(reportId),
      headers: await studentsApi.getReportFileHeaders(),
      kind: "pdf",
    },
  } satisfies NotificationDestination;
}

/**
 * A Behaviour notification (25) is about points (referenceId = point id), a
 * certificate (the StudentReport id) or an escalation (the alert id).
 *
 * The URL names the child or the report when the server sends it. Without
 * it, each child's summary is checked: a certificate with that report id
 * opens the PDF, a recent entry with that id opens that child. A parent with
 * one child lands on that child's screen whatever the id was.
 */
async function resolveBehaviour(
  id: number | null,
  actionUrl?: string | null,
): Promise<NotificationDestination | null> {
  const reportId = reportFromUrl(actionUrl);
  if (reportId) return reportPdf(reportId);

  const fromUrl = seasonFromUrl(actionUrl);
  if (fromUrl) return { screen: "Behaviour", params: { studentSeasonId: fromUrl } };

  const students = await studentsApi.list();
  if (id !== null) {
    for (const student of students) {
      try {
        const summary = await behaviourApi.student(student.studentSeasonId);
        const certificate = summary.certificates?.find((c) => c.studentReportId === id);
        if (certificate) return reportPdf(id, student.studentSeasonId);
        if (summary.items?.some((item) => item.id === id)) {
          return {
            screen: "Behaviour",
            params: {
              studentSeasonId: student.studentSeasonId,
              studentName: student.name ?? undefined,
            },
          };
        }
      } catch {
        // Not readable for this child; try the next.
      }
    }
  }

  if (students.length === 1) {
    return {
      screen: "Behaviour",
      params: {
        studentSeasonId: students[0].studentSeasonId,
        studentName: students[0].name ?? undefined,
      },
    };
  }
  return null;
}

/**
 * Where tapping a notification should go — the specific record when the
 * notification names one, its list otherwise, or nowhere (null).
 */
export async function resolveNotification(
  type: number | string | null | undefined,
  referenceId: number | string | null | undefined,
  /** Optional web route; only Behaviour reads it today. */
  actionUrl?: string | null,
): Promise<NotificationDestination | null> {
  const kind = toNotificationType(type);
  const id = referenceId == null || referenceId === "" ? null : Number(referenceId);
  const hasId = id !== null && !Number.isNaN(id) && id > 0;

  try {
    // ── Reports: clinic, monthly, dynamic, admin forms ────────────────
    const category = kind !== null ? REPORT_CATEGORY[kind] : undefined;
    if (category !== undefined) {
      if (!hasId) return null;
      const found = await findReport(id, category);
      if (found) return { screen: "ReportDetail", params: found };
      // Not in any child's list (a relative's account, or since removed):
      // the file itself opens by report id alone.
      return reportPdf(id);
    }

    switch (kind) {
      case NotificationType.Complaint:
        return hasId
          ? { screen: "ComplaintDetails", params: { complaintId: id } }
          : { screen: "Complaints" };

      case NotificationType.DocumentRequest:
        return hasId
          ? { screen: "RequestDetails", params: { requestId: id } }
          : { screen: "Request" };

      case NotificationType.Newsletter: {
        if (!hasId) return { screen: "Newsletter" };
        // The id is a newsletter's or a published student report's, and the
        // notification doesn't say which — try announcements, then letters.
        for (const source of [1, 2] as const) {
          try {
            await newslettersApi.detail(source, id);
            return { screen: "NewsletterDetail", params: { source, id } };
          } catch {
            // Not this source; try the next.
          }
        }
        return { screen: "Newsletter" };
      }

      // Confirmed/Cancelled carry the gate request's BusHolding id. Submitted
      // is for school staff, so a parent has nowhere to go.
      case NotificationType.GateRequestConfirmed:
      case NotificationType.GateRequestCancelled:
        return hasId
          ? { screen: "GateRequestDetails", params: { requestId: id } }
          : { screen: "GateRequests" };

      case NotificationType.GateRequestSubmitted:
        return null;

      case NotificationType.Behaviour:
        if (!FeatureFlags.behaviour) return null;
        return resolveBehaviour(hasId ? id : null, actionUrl);

      // Staff-only; a parent has nowhere to go.
      case NotificationType.BehaviourAlert:
        return null;

      // Exams, homework, timetable, meetings and general notices name no
      // student, so there's no screen they can open on their own.
      default:
        return null;
    }
  } catch (error) {
    log.warn("couldn't resolve notification", { type, referenceId, error });
    return null;
  }
}
