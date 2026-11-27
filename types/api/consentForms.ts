/**
 * Mobile Consent Forms API — `/api/mobile/consent-forms`.
 *
 * camelCase, enums as numbers. `deadline` is school-local time without a zone
 * suffix ("2026-12-04T23:59:00"); `*Utc` fields are ISO UTC.
 */

/** ConsentLinkType */
export const ConsentLinkType = {
  Trip: 1,
  Club: 2,
  Policy: 3,
} as const;

/** ConsentRecipientStatus */
export const ConsentStatusCode = {
  Pending: 1,
  Approved: 2,
  Declined: 3,
} as const;

/** ConsentPolicyType */
export const ConsentPolicyType = {
  PhotoConsent: 1,
  DeviceUse: 2,
  EmergencyMedical: 3,
  Other: 99,
} as const;

/** ConsentQuestionType */
export const ConsentQuestionType = {
  YesNo: 1,
  Text: 2,
  Choice: 3,
  EmergencyPhone: 4,
  HealthNotes: 5,
} as const;

/** ConsentDecision (request body) */
export const ConsentDecision = {
  Approved: 1,
  Declined: 2,
} as const;

/** ConsentPayWith (request body) */
export const ConsentPayWith = {
  None: 0,
  Wallet: 1,
  Online: 2,
  PayAtSchool: 3,
} as const;

/** `errors[0]` machine codes of the consent endpoints. */
export const ConsentErrorCode = {
  InsufficientBalance: "CONSENT_INSUFFICIENT_BALANCE",
  Closed: "CONSENT_CLOSED",
  AlreadyPaidContactSchool: "CONSENT_ALREADY_PAID_CONTACT_SCHOOL",
  CapacityFull: "CONSENT_CAPACITY_FULL",
  AnswerRequired: "CONSENT_ANSWER_REQUIRED",
  PaymentMethodRequired: "CONSENT_PAYMENT_METHOD_REQUIRED",
  SignerNameRequired: "CONSENT_SIGNER_NAME_REQUIRED",
  MustAgree: "CONSENT_MUST_AGREE",
  AnswerInvalid: "CONSENT_ANSWER_INVALID",
  OnlineNotAvailable: "CONSENT_ONLINE_NOT_AVAILABLE",
  NotFound: "CONSENT_NOT_FOUND",
} as const;

/** Item of GET /consent-forms?status= */
export interface ConsentFormListItemDto {
  /** The id used everywhere (detail, attachment, respond). */
  recipientId: number;
  formId: number;
  studentId: number;
  studentSeasonId: number;
  studentNameAr: string | null;
  studentNameEn: string | null;
  titleAr: string | null;
  titleEn: string | null;
  /** `ConsentLinkType` */
  linkType: number;
  /** School-local, no zone suffix. */
  deadline: string;
  /** `ConsentStatusCode` */
  status: number;
  respondedAtUtc: string | null;
  collectPayment: boolean;
  amount: number;
  isPaid: boolean;
  /** Open and before the deadline. */
  canRespond: boolean;
}

export interface ConsentQuestionOptionDto {
  value: string;
  textAr: string | null;
  textEn: string | null;
}

export interface ConsentQuestionDto {
  id: number;
  /** `ConsentQuestionType` */
  type: number;
  textAr: string | null;
  textEn: string | null;
  isRequired: boolean;
  options: ConsentQuestionOptionDto[] | null;
  previousValue: string | null;
}

/** GET /consent-forms/{recipientId} */
export interface ConsentFormDetailDto extends ConsentFormListItemDto {
  descriptionAr: string | null;
  descriptionEn: string | null;
  linkNameAr: string | null;
  linkNameEn: string | null;
  /** `ConsentPolicyType`, or null when not a policy form. */
  policyType: number | null;
  hasAttachment: boolean;
  attachmentName: string | null;
  lastSignerName: string | null;
  /** Only when `collectPayment`. */
  walletBalance: number | null;
  onlinePaymentAvailable: boolean;
  questions: ConsentQuestionDto[] | null;
}

/** POST /consent-forms/{recipientId}/respond */
export interface ConsentRespondInput {
  /** `ConsentDecision` */
  decision: number;
  signerName: string;
  agreed: true;
  answers: { questionId: number; value: string }[];
  /** `ConsentPayWith` */
  payWith: number;
  deviceInfo: string;
}

export interface ConsentRespondResultDto {
  responseId: number;
  status: number;
  isPaid: boolean;
  paymentMethod: number;
  amountCharged: number;
  walletBalanceAfter: number | null;
  createdAtUtc: string;
}
