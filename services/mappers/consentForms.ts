import { consentStrings, pickLang } from "@/constants/consentFormStrings";
import type {
  ConsentFormDetailDto,
  ConsentFormListItemDto,
  ConsentQuestionDto,
} from "@/types/api";
import {
  ConsentLinkType,
  ConsentPolicyType,
  ConsentQuestionType,
  ConsentStatusCode,
} from "@/types/api";

export type ConsentStatus = "pending" | "approved" | "declined";
export type ConsentLinkKind = "trip" | "club" | "policy";
export type ConsentQuestionKind = "yesNo" | "text" | "choice" | "phone" | "healthNotes";

export interface ConsentForm {
  /** The recipient id — used for detail, attachment and respond. */
  id: number;
  formId: number;
  studentSeasonId: number;
  studentName: string;
  title: string;
  linkKind: ConsentLinkKind;
  /** School-local wall-clock time, parsed as device-local for display. */
  deadline: Date | null;
  /** The raw deadline string, for formatting. */
  deadlineText: string;
  status: ConsentStatus;
  respondedAt: Date | null;
  collectPayment: boolean;
  amount: number;
  isPaid: boolean;
  canRespond: boolean;
}

export interface ConsentQuestionOption {
  value: string;
  label: string;
}

export interface ConsentQuestion {
  id: number;
  kind: ConsentQuestionKind;
  text: string;
  isRequired: boolean;
  options: ConsentQuestionOption[];
  previousValue: string;
}

export interface ConsentFormDetail extends ConsentForm {
  description: string;
  /** Trip / club name, or the policy type's label for policy forms. */
  linkName: string;
  hasAttachment: boolean;
  attachmentName: string | null;
  lastSignerName: string | null;
  walletBalance: number | null;
  onlinePaymentAvailable: boolean;
  questions: ConsentQuestion[];
  /** Approving needs a payment choice. */
  needsPayment: boolean;
}

function toStatus(code: number): ConsentStatus {
  if (code === ConsentStatusCode.Approved) return "approved";
  if (code === ConsentStatusCode.Declined) return "declined";
  return "pending";
}

function toLinkKind(code: number): ConsentLinkKind {
  if (code === ConsentLinkType.Trip) return "trip";
  if (code === ConsentLinkType.Club) return "club";
  return "policy";
}

function toQuestionKind(code: number): ConsentQuestionKind {
  switch (code) {
    case ConsentQuestionType.YesNo:
      return "yesNo";
    case ConsentQuestionType.Choice:
      return "choice";
    case ConsentQuestionType.EmergencyPhone:
      return "phone";
    case ConsentQuestionType.HealthNotes:
      return "healthNotes";
    default:
      return "text";
  }
}

export function consentLinkLabel(kind: ConsentLinkKind): string {
  const s = consentStrings();
  if (kind === "trip") return s.linkTrip;
  if (kind === "club") return s.linkClub;
  return s.linkPolicy;
}

export function consentStatusLabel(status: ConsentStatus): string {
  const s = consentStrings();
  if (status === "approved") return s.approved;
  if (status === "declined") return s.declined;
  return s.notAnswered;
}

export function consentPolicyLabel(code: number | null | undefined): string {
  const s = consentStrings();
  switch (code) {
    case ConsentPolicyType.PhotoConsent:
      return s.policyPhoto;
    case ConsentPolicyType.DeviceUse:
      return s.policyDevice;
    case ConsentPolicyType.EmergencyMedical:
      return s.policyMedical;
    case ConsentPolicyType.Other:
      return s.policyOther;
    default:
      return "";
  }
}

/** "2026-12-04T23:59:00" has no zone, so it reads as device-local wall time. */
function parseLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseUtc(value: string | null | undefined): Date | null {
  if (!value) return null;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const d = new Date(hasZone ? value : `${value}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toConsentForm(dto: ConsentFormListItemDto): ConsentForm {
  return {
    id: dto.recipientId,
    formId: dto.formId,
    studentSeasonId: dto.studentSeasonId,
    studentName: pickLang(dto.studentNameAr, dto.studentNameEn),
    title: pickLang(dto.titleAr, dto.titleEn),
    linkKind: toLinkKind(dto.linkType),
    deadline: parseLocal(dto.deadline),
    deadlineText: dto.deadline ?? "",
    status: toStatus(dto.status),
    respondedAt: parseUtc(dto.respondedAtUtc),
    collectPayment: !!dto.collectPayment,
    amount: dto.amount ?? 0,
    isPaid: !!dto.isPaid,
    canRespond: !!dto.canRespond,
  };
}

function toQuestion(dto: ConsentQuestionDto): ConsentQuestion {
  return {
    id: dto.id,
    kind: toQuestionKind(dto.type),
    text: pickLang(dto.textAr, dto.textEn),
    isRequired: !!dto.isRequired,
    options: (dto.options ?? []).map((o) => ({
      value: o.value,
      label: pickLang(o.textAr, o.textEn) || o.value,
    })),
    previousValue: dto.previousValue ?? "",
  };
}

export function selectConsentFormDetail(dto: ConsentFormDetailDto): ConsentFormDetail {
  const base = toConsentForm(dto);
  const linkName =
    base.linkKind === "policy"
      ? pickLang(dto.linkNameAr, dto.linkNameEn) || consentPolicyLabel(dto.policyType)
      : pickLang(dto.linkNameAr, dto.linkNameEn);
  return {
    ...base,
    description: pickLang(dto.descriptionAr, dto.descriptionEn),
    linkName,
    hasAttachment: !!dto.hasAttachment,
    attachmentName: dto.attachmentName ?? null,
    lastSignerName: dto.lastSignerName?.trim() || null,
    walletBalance: dto.walletBalance ?? null,
    onlinePaymentAvailable: !!dto.onlinePaymentAvailable,
    questions: (dto.questions ?? []).map(toQuestion),
    needsPayment: base.collectPayment && base.amount > 0 && !base.isPaid,
  };
}

export function selectConsentForms(dtos: ConsentFormListItemDto[]): ConsentForm[] {
  return (dtos ?? []).map(toConsentForm);
}
