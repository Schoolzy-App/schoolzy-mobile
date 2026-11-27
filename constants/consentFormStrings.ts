/**
 * Consent forms copy in English and Arabic.
 *
 * The app has no language setting or translation layer yet: every other
 * screen is English-only. These strings keep both languages side by side so
 * the feature switches the day the app gets one — only `APP_LANGUAGE` (and
 * an `Accept-Language` header on the API client) need to change.
 */

export type AppLanguage = "en" | "ar";

/** The language the app shows. Fixed to English until the app has a setting. */
export const APP_LANGUAGE: AppLanguage = "en";

/** The server text in the app language, falling back to the other one. */
export function pickLang(
  ar: string | null | undefined,
  en: string | null | undefined,
  language: AppLanguage = APP_LANGUAGE,
): string {
  const a = ar?.trim() ?? "";
  const e = en?.trim() ?? "";
  return language === "ar" ? a || e : e || a;
}

const en = {
  title: "Consent forms",
  menuSubtitle: "Trips, activities & school policies",
  formTitle: "Consent form",
  tabPending: "Waiting for your answer",
  tabAnswered: "Answered and closed",
  linkTrip: "Trip",
  linkClub: "Club / activity",
  linkPolicy: "School policy",
  policyPhoto: "Photo consent",
  policyDevice: "Device use",
  policyMedical: "Emergency medical treatment",
  policyOther: "School policy",
  answerBy: "Answer by",
  approved: "Approved",
  declined: "Declined",
  notAnswered: "Not answered",
  paid: "Paid",
  amount: "Amount",
  child: "Child",
  emptyPendingTitle: "No forms waiting",
  emptyPendingBody: "When the school sends a consent form for your child, it shows up here.",
  emptyAnsweredTitle: "No answered forms yet",
  emptyAnsweredBody: "Forms you have answered, and closed forms, are kept here.",
  refreshFailed: "Couldn't refresh. Showing the last loaded forms.",
  refreshFailedDetail: "Couldn't refresh. Showing the last loaded details.",
  attachment: "Attachment",
  openAttachment: "Open attachment",
  youAnswered: (decision: string) => `You answered: ${decision}`,
  signedBy: (name: string) => `Signed by ${name}`,
  canChange: "You can change your answer until the deadline.",
  closed: "This form is closed for answers.",
  questions: "Questions",
  required: "Required",
  optional: "Optional",
  yes: "Yes",
  no: "No",
  choose: "Choose an answer",
  typeHere: "Type your answer",
  phonePlaceholder: "Phone number",
  decision: "Your decision",
  approve: "I approve",
  decline: "I do not approve",
  payment: "Payment",
  payWallet: "Pay now from the wallet",
  walletBalance: (balance: string) => `Wallet balance: ${balance}`,
  notEnoughBalance: "Not enough balance",
  payOnline: "Pay online by card",
  comingSoon: "Coming soon",
  payAtSchool: "Pay later at school",
  signerName: "Your full name (signature)",
  signerPlaceholder: "Full name",
  agree: (child: string) =>
    `I am the parent / guardian of ${child}, I have read the form above, and my answers are correct.`,
  signedNote: "Your answer is saved as a signed record with the date, time and device.",
  submit: "Submit",
  sending: "Sending…",
  retry: "Retry",
  success: "Thank you, your answer was saved.",
  confirmTitle: "Send your answer?",
  confirmApprove: (child: string) => `You are approving this form for ${child}.`,
  confirmDecline: (child: string) => `You are declining this form for ${child}.`,
  confirmCharge: (amount: string) => `${amount} will be taken from the wallet.`,
  cancel: "Cancel",
  send: "Send",
  errorTitle: "Couldn't send your answer",
  errorGeneric: "Could not send your answer. Please try again.",
  errorMayHaveGone:
    "It may still have gone through, so retrying resends the same answer.",
  processing: "Your answer is still being processed. Retrying reuses the same answer.",
  errAnswerRequired: "Please answer this question.",
  errDecision: "Choose I approve or I do not approve.",
  errPayment: "Choose how to pay.",
  errName: "Write your full name (at least 3 letters).",
  errAgree: "Please tick the box to confirm.",
  fixBelow: "Please check the highlighted fields.",
  pendingCount: (n: number) =>
    n === 1 ? "1 form waiting for your answer" : `${n} forms waiting for your answer`,
  attentionTitle: (n: number) =>
    n === 1 ? "A consent form needs your answer" : `${n} consent forms need your answer`,
  attentionSubtitle: "Trips, activities or school policies",
  attentionAction: "Answer",
  noneWaiting: "Nothing waiting",
};

export type ConsentStrings = typeof en;

const ar: ConsentStrings = {
  title: "نماذج الموافقة",
  menuSubtitle: "الرحلات والأنشطة والسياسات المدرسية",
  formTitle: "نموذج موافقة",
  tabPending: "بانتظار ردك",
  tabAnswered: "تم الرد عليها / مغلقة",
  linkTrip: "رحلة",
  linkClub: "نادي / نشاط",
  linkPolicy: "سياسة مدرسية",
  policyPhoto: "الموافقة على التصوير",
  policyDevice: "استخدام الأجهزة",
  policyMedical: "العلاج الطبي الطارئ",
  policyOther: "سياسة مدرسية",
  answerBy: "الرد قبل",
  approved: "موافق",
  declined: "رافض",
  notAnswered: "لم يتم الرد",
  paid: "مدفوع",
  amount: "المبلغ",
  child: "الطالب",
  emptyPendingTitle: "لا توجد نماذج بانتظار ردك",
  emptyPendingBody: "عندما ترسل المدرسة نموذج موافقة لطفلك سيظهر هنا.",
  emptyAnsweredTitle: "لا توجد نماذج تم الرد عليها",
  emptyAnsweredBody: "النماذج التي رددت عليها والنماذج المغلقة تُحفظ هنا.",
  refreshFailed: "تعذر التحديث. يتم عرض آخر نماذج تم تحميلها.",
  refreshFailedDetail: "تعذر التحديث. يتم عرض آخر تفاصيل تم تحميلها.",
  attachment: "المرفق",
  openAttachment: "فتح المرفق",
  youAnswered: (decision: string) => `ردك: ${decision}`,
  signedBy: (name: string) => `بتوقيع ${name}`,
  canChange: "يمكنك تغيير ردك حتى الموعد النهائي.",
  closed: "هذا النموذج مغلق ولا يقبل ردودًا.",
  questions: "الأسئلة",
  required: "مطلوب",
  optional: "اختياري",
  yes: "نعم",
  no: "لا",
  choose: "اختر إجابة",
  typeHere: "اكتب إجابتك",
  phonePlaceholder: "رقم الهاتف",
  decision: "قرارك",
  approve: "أوافق",
  decline: "لا أوافق",
  payment: "الدفع",
  payWallet: "الدفع الآن من المحفظة",
  walletBalance: (balance: string) => `رصيد المحفظة: ${balance}`,
  notEnoughBalance: "الرصيد غير كافٍ",
  payOnline: "الدفع بالبطاقة أونلاين",
  comingSoon: "قريبًا",
  payAtSchool: "الدفع لاحقًا في المدرسة",
  signerName: "اسمك الكامل (توقيع)",
  signerPlaceholder: "الاسم الكامل",
  agree: (child: string) =>
    `أقرّ بأنني ولي أمر ${child}، وأنني قرأت النموذج أعلاه، وأن إجاباتي صحيحة.`,
  signedNote: "يُحفظ ردك كسجل موقّع مع التاريخ والوقت والجهاز.",
  submit: "إرسال",
  sending: "جارٍ الإرسال…",
  retry: "إعادة المحاولة",
  success: "شكرًا، تم حفظ ردك.",
  confirmTitle: "إرسال ردك؟",
  confirmApprove: (child: string) => `أنت توافق على هذا النموذج لـ ${child}.`,
  confirmDecline: (child: string) => `أنت ترفض هذا النموذج لـ ${child}.`,
  confirmCharge: (amount: string) => `سيتم خصم ${amount} من المحفظة.`,
  cancel: "إلغاء",
  send: "إرسال",
  errorTitle: "تعذر إرسال ردك",
  errorGeneric: "تعذر إرسال ردك. حاول مرة أخرى.",
  errorMayHaveGone: "ربما تم الإرسال بالفعل، لذا تعيد المحاولة إرسال نفس الرد.",
  processing: "ما زال ردك قيد المعالجة. إعادة المحاولة تستخدم نفس الرد.",
  errAnswerRequired: "يرجى الإجابة على هذا السؤال.",
  errDecision: "اختر أوافق أو لا أوافق.",
  errPayment: "اختر طريقة الدفع.",
  errName: "اكتب اسمك الكامل (3 أحرف على الأقل).",
  errAgree: "يرجى وضع علامة للتأكيد.",
  fixBelow: "يرجى مراجعة الحقول المحددة.",
  pendingCount: (n: number) =>
    n === 1 ? "نموذج واحد بانتظار ردك" : `${n} نماذج بانتظار ردك`,
  attentionTitle: (n: number) =>
    n === 1 ? "نموذج موافقة بانتظار ردك" : `${n} نماذج موافقة بانتظار ردك`,
  attentionSubtitle: "رحلات أو أنشطة أو سياسات مدرسية",
  attentionAction: "الرد",
  noneWaiting: "لا يوجد شيء بانتظارك",
};

const STRINGS: Record<AppLanguage, ConsentStrings> = { en, ar };

/** The consent forms copy in the app language. */
export const consentStrings = (language: AppLanguage = APP_LANGUAGE): ConsentStrings =>
  STRINGS[language];
