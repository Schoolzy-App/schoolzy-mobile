import { appLanguage, type AppLanguage } from "@/utils/language";

/**
 * Behaviour + house points copy, English and Arabic.
 *
 * The app has no shared translation layer yet; this table is keyed the same
 * way one would be, so it can move into it unchanged. The language follows
 * `appLanguage()` (the layout direction).
 */
const en = {
  module: "Behaviour",
  titleFor: "Behaviour for",
  house: "House",
  rankOf: (rank: number, count: number) => `${rank} of ${count}`,
  housePoints: (points: number) => `${points.toLocaleString("en")} house points`,
  noHouse: "No house yet",
  merit: "Merit",
  demerit: "Demerit",
  net: "Net",
  timesCount: (n: number) => (n === 1 ? "1 time" : `${n} times`),
  nextMilestone: (name: string) => `Next: ${name}`,
  pointsToGo: (n: number) => (n === 1 ? "1 point to go" : `${n} points to go`),
  allMilestones: "Every award reached this year",
  certificates: "Certificates",
  certificatePoints: (n: number) => `${n} points`,
  certificatePending: "Being prepared",
  history: "History",
  awardedBy: (name: string) => `by ${name}`,
  loadMore: "Load more",
  emptyTitle: "No points yet",
  emptyHint: "When a teacher gives points or writes a behaviour note, it will show here.",
  certificateTitle: (name: string) => `${name} certificate`,
  // ── Notification choice (Account) ─────────────────────────────────
  notificationsTitle: "Behaviour notifications",
  notificationsHint: "Messages asking you to contact the school are always sent.",
  modeAll: "All",
  modePositive: "Positive only",
  modeNone: "None",
  saveFailed: "Couldn't save your choice. Please try again.",
};

type BehaviourStrings = typeof en;

const ar: BehaviourStrings = {
  module: "السلوك",
  titleFor: "سلوك",
  house: "البيت",
  rankOf: (rank, count) => `${rank} من ${count}`,
  housePoints: (points) => `${points.toLocaleString("ar")} نقطة للبيت`,
  noHouse: "لا يوجد بيت بعد",
  merit: "إيجابية",
  demerit: "سلبية",
  net: "الصافي",
  timesCount: (n) => (n === 1 ? "مرة واحدة" : n === 2 ? "مرتان" : `${n} مرات`),
  nextMilestone: (name) => `التالي: ${name}`,
  pointsToGo: (n) => (n === 1 ? "باقي نقطة واحدة" : `باقي ${n} نقاط`),
  allMilestones: "تم الوصول إلى كل الأوسمة هذا العام",
  certificates: "الشهادات",
  certificatePoints: (n) => `${n} نقطة`,
  certificatePending: "جارٍ التجهيز",
  history: "السجل",
  awardedBy: (name) => `بواسطة ${name}`,
  loadMore: "عرض المزيد",
  emptyTitle: "لا توجد نقاط بعد",
  emptyHint: "عندما يمنح المعلم نقاطًا أو يكتب ملاحظة سلوك، ستظهر هنا.",
  certificateTitle: (name) => `شهادة ${name}`,
  notificationsTitle: "إشعارات السلوك",
  notificationsHint: "رسائل طلب التواصل مع المدرسة تُرسل دائمًا.",
  modeAll: "الكل",
  modePositive: "الإيجابية فقط",
  modeNone: "لا شيء",
  saveFailed: "تعذّر حفظ اختيارك. حاول مرة أخرى.",
};

const TABLE: Record<AppLanguage, BehaviourStrings> = { en, ar };

export function behaviourStrings(): BehaviourStrings {
  return TABLE[appLanguage()];
}

/** Date in the UI language: "26 Nov 2026" / "٢٦ نوفمبر ٢٠٢٦". */
export function formatBehaviourDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString(appLanguage() === "ar" ? "ar-EG" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d.toDateString();
  }
}
