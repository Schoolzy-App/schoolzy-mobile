import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChildAvatarIcon } from '@/types/child';

// ─── Auth Stack ──────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  /** Step 2 carries the address the code was sent to. */
  VerifyOtp: { email: string };
  /** Step 3 carries the token returned by /auth/otp/verify. */
  ResetPassword: { email: string; resetToken: string };
};

export type AuthStackNavigationProp<T extends keyof AuthStackParamList> =
  NativeStackNavigationProp<AuthStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

// ─── Main Tab Stack ──────────────────────────────────────────────────────────

export type MainTabParamList = {
  Home: undefined;
  Chatting: undefined;
  /**
   * Placeholder route for the Requests tab. Pressing it navigates to the root
   * `Request` screen rather than rendering here — same pattern as `Chatting`.
   */
  Requests: undefined;
  Account: undefined;
  Add: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

// ─── Root Stack ──────────────────────────────────────────────────────────────

export type StudentProfileParams = {
  id: string;
  /** Numeric API id — required by every /api/mobile/students/* call. */
  studentSeasonId: number;
  name: string;
  year: string;
  activeBus?: boolean;
  allergies?: string;
  bloodType?: string;
  attendance?: string;
  avatarIcon?: ChildAvatarIcon;
};

export type ReportsParams = {
  studentName: string;
  studentSeasonId?: number;
};

export type WellnessParams = {
  studentName: string;
  studentSeasonId?: number;
  year?: string;
  activeBus?: boolean;
  allergies?: string;
  bloodType?: string;
  attendance?: string;
  avatarIcon?: ChildAvatarIcon;
};

export type WellnessEditParams = WellnessParams;

export type AgendaParams = {
  studentName: string;
  /** Required to load the agenda; optional only so older links still type-check. */
  studentSeasonId?: number;
};

export type TimesheetParams = {
  studentName: string;
  studentSeasonId?: number;
};

export type MealsParams = {
  studentName: string;
  studentSeasonId?: number;
};

export type FinancesParams = {
  studentName: string;
  studentSeasonId?: number;
};

/** The two fee streams a payment can belong to. */
export type PaymentFeeKind = "school" | "ig";

/**
 * What the parent tapped on the Finances screen — a shortcut that pre-fills the
 * payment form. It never decides the category or the IG account: those are
 * separate server-side lists the parent picks from explicitly.
 */
export type PaymentPrefill = {
  kind: PaymentFeeKind;
  /** Header label: "Installment 2", or the IG account name. */
  label: string;
  amountValue: number;
  /** Installments only. */
  dueDate?: string;
  /** IG only, for context on the header card. */
  subjects?: string[];
};

export type PaymentDetailsParams = {
  studentName: string;
  studentSeasonId?: number;
  /** Absent when the parent started a free-form payment. */
  prefill?: PaymentPrefill;
};

export type ConfirmDepositParams = {
  studentName: string;
  studentSeasonId?: number;
  /** The numeric amount actually submitted to the API. */
  amountValue: number;
  /** Chosen in PaymentDetails — the online endpoint requires both. */
  categoryId: number;
  subjectAccountId?: number | null;
  categoryName?: string;
  /** What is being paid, for the confirmation header. */
  payingFor?: string;
};

export type RequestDetailsParams = {
  requestId: number;
  /** Shown in the header until the request loads. */
  title?: string;
};

export type PdfParams = {
  title: string;
  /** Absolute URL of the document to render. Falls back to the bundled sample. */
  uri?: string;
  /** Auth headers for protected file endpoints. */
  headers?: Record<string, string>;
  /**
   * What the file actually is. Health-profile attachments are photos, not PDFs,
   * and a PDF renderer shows nothing for them. Omit it and the viewer guesses
   * from the URL, then falls back to the other renderer if that guess fails.
   */
  kind?: "pdf" | "image";
};

export type NotificationParams = undefined;
export type RequestParams = undefined;
export type AddRequestParams = undefined;
export type NewsletterParams = undefined;

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ChangePassword: undefined;
  ChatWithSchool: undefined;
  Request: RequestParams;
  RequestDetails: RequestDetailsParams;
  AddRequest: AddRequestParams;
  StudentProfile: StudentProfileParams;
  Reports: ReportsParams;
  Wellness: WellnessParams;
  WellnessEdit: WellnessEditParams;
  Agenda: AgendaParams;
  Timesheet: TimesheetParams;
  Meals: MealsParams;
  Finances: FinancesParams;
  PaymentDetails: PaymentDetailsParams;
  ConfirmDeposit: ConfirmDepositParams;
  Pdf: PdfParams;
  Notification: NotificationParams;
  Newsletter: NewsletterParams;
};

export type RootStackNavigationProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
