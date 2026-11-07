import type { DynamicStateData } from "@/components/DynamicStateItem";
import type { StudentLatestUpdatesDto } from "@/types/api";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format";

/**
 * Turns `StudentProfileDto.latest` into the DynamicState rows the profile and
 * home screens render.
 *
 * The API returns the four sections as objects that may be entirely empty, so
 * each is only emitted when it carries real content. `onPress` is deliberately
 * NOT attached here — screens supply a single stable handler instead, which
 * keeps the row components memo-stable.
 */
export function selectLatestStates(
  latest: StudentLatestUpdatesDto | undefined,
  studentId?: string,
): DynamicStateData[] {
  if (!latest) return [];

  const states: DynamicStateData[] = [];

  if (latest.clinic?.diagnosis) {
    states.push({
      id: "clinic",
      type: "medical",
      title: latest.clinic.diagnosis,
      subtitle: formatDateTime(latest.clinic.date),
      studentId,
    });
  }

  if (latest.homework?.title) {
    const subject = latest.homework.subjectName;
    states.push({
      id: "homework",
      type: "homework",
      title: subject
        ? `${latest.homework.title} · ${subject}`
        : latest.homework.title,
      subtitle: latest.homework.endDate
        ? `Due ${formatDate(latest.homework.endDate)}`
        : formatDateTime(latest.homework.createdAt),
      studentId,
    });
  }

  if (latest.payment?.outstandingAmount) {
    const { outstandingAmount, dueDate, isOverdue, installmentNumber } =
      latest.payment;
    states.push({
      id: "payment",
      type: "payment",
      title: `Installment ${installmentNumber} · ${formatCurrency(outstandingAmount)}`,
      subtitle: `${isOverdue ? "Overdue" : "Due"} ${formatDate(dueDate)}`,
      studentId,
    });
  }

  if (latest.health?.updatedAt) {
    states.push({
      id: "health",
      type: "medical",
      title: "Health profile updated",
      subtitle: formatDateTime(latest.health.updatedAt),
      studentId,
    });
  }

  // Nothing outstanding — mirror the existing "all clear" affordance.
  if (states.length === 0) {
    states.push({
      id: "ok",
      type: "success",
      title: "Everything looks good!",
      subtitle: "No action needed right now",
    });
  }

  return states;
}
