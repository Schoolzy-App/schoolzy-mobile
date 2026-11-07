import type { IsoDateTime, UploadFile } from "./common";

/**
 * Health-profile DTOs — `/api/mobile/health-profile/*`.
 *
 * Shapes confirmed against real dev responses (2026-09-14) for the overview
 * and `/edit`. The only remaining unknown is `pastMedicalConditions`, which
 * came back as an empty array — those field names are still inferred.
 */

/** `severity` is an int enum on the wire. 2 = "Moderate" in the sample. */
export const ChronicSeverity = {
  Mild: 1,
  Moderate: 2,
  Severe: 3,
} as const;

export type ChronicSeverity =
  (typeof ChronicSeverity)[keyof typeof ChronicSeverity];

// ─── Nested records ──────────────────────────────────────────────────────────

export interface ChronicDiseaseDto {
  /** Row id; null for a record being created. */
  id: number | null;
  /** FK into the school's disease catalogue. */
  chronicDiseaseId: number | null;
  /** Display name for that catalogue entry, e.g. "Asthma". */
  chronicDiseaseName: string | null;
  sinceWhen: IsoDateTime | null;
  severity: ChronicSeverity | number | null;
  treatmentPlan: string | null;
  schoolPrecautions: string | null;
  isRecovered: boolean;
  recoveredDate: IsoDateTime | null;
}

export interface PastMedicalConditionDto {
  id: number | null;
  conditionType: string | null;
  date: IsoDateTime | null;
  description: string | null;
  notes: string | null;
}

export interface RegularMedicationDto {
  id: number | null;
  medicationName: string | null;
  dosage: string | null;
  /** Time of day as "HH:mm:ss" — there is no frequency/start/end on the wire. */
  timeOfAdministration: string | null;
  /** Whether school staff administer it during the day. */
  takenAtSchool: boolean;
  notes: string | null;
}

export interface VaccinationRecordDto {
  id: number | null;
  vaccineName: string | null;
  dateTaken: IsoDateTime | null;
  notes: string | null;
}

export interface SpecialMedicalRequirementDto {
  id?: number | null;
  assistiveDevices: string | null;
  assistiveDevicesNotes: string | null;
  physicalLimitations: string | null;
  physicalLimitationsNotes: string | null;
  learningNeeds: string | null;
  accommodations: string | null;
  // Dietary needs are individual booleans on the wire, not an array.
  isVegetarian: boolean;
  isVegan: boolean;
  isLactoseIntolerant: boolean;
  isGlutenIntolerant: boolean;
  religiousDiet: string | null;
  otherDietInstructions: string | null;
}

export interface HealthAttachmentDto {
  id: number;
  fileName: string | null;
  contentType: string | null;
  fileSizeBytes: number | null;
  /** Server-provided relative path, e.g. "/api/mobile/health-profile/…/file". */
  fileUrl: string | null;
}

// ─── Responses ───────────────────────────────────────────────────────────────

/**
 * GET /api/mobile/health-profile/{studentSeasonId}
 *
 * Confirmed against dev (2026-09-14): the overview returns **counts**, not the
 * records themselves — the full lists only come from the `/edit` endpoint.
 * It also carries the student's gender and blood type, which the student
 * profile endpoint does not.
 */
export interface HealthProfileOverviewDto {
  studentSeasonId: number;
  studentName: string | null;
  gender: string | null;
  bloodType: string | null;
  stageName: string | null;
  gradeName: string | null;
  className: string | null;
  healthProfileId: number | null;
  hasHealthProfile: boolean;
  note: string | null;
  chronicDiseasesCount: number;
  pastMedicalConditionsCount: number;
  regularMedicationsCount: number;
  vaccinationRecordsCount: number;
  hasSpecialMedicalRequirement: boolean;
  attachmentsCount: number;
}

/**
 * GET /api/mobile/health-profile/{studentSeasonId}/edit
 *
 * Returns the full records, unlike the overview which returns counts.
 * Confirmed on dev (2026-09-14) — note there is no `updatedAt` here, and the
 * server does not send dropdown option lists, so the UI keeps using its local
 * constants in `types/wellness.ts`.
 */
export interface HealthProfileEditDto {
  studentSeasonId: number;
  studentName: string | null;
  healthProfileId: number | null;
  note: string | null;
  chronicDiseases: ChronicDiseaseDto[] | null;
  pastMedicalConditions: PastMedicalConditionDto[] | null;
  regularMedications: RegularMedicationDto[] | null;
  vaccinationRecords: VaccinationRecordDto[] | null;
  specialMedicalRequirement: SpecialMedicalRequirementDto | null;
  attachments: HealthAttachmentDto[] | null;
}

// ─── Requests ────────────────────────────────────────────────────────────────

/**
 * PUT /api/mobile/health-profile/{studentSeasonId}
 * CONFIRMED shape — copied from the Postman collection's request body.
 */
export interface SaveHealthProfileRequestDto {
  note: string | null;
  chronicDiseases: ChronicDiseaseDto[];
  pastMedicalConditions: PastMedicalConditionDto[];
  regularMedications: RegularMedicationDto[];
  vaccinationRecords: VaccinationRecordDto[];
  specialMedicalRequirement: SpecialMedicalRequirementDto | null;
}

/** POST /api/mobile/health-profile/{studentSeasonId}/attachments (multipart) */
export interface UploadHealthAttachmentInput {
  studentSeasonId: number;
  /** Field name is `Files` per the collection; multiple files are supported. */
  files: UploadFile[];
}

/** DELETE /api/mobile/health-profile/{studentSeasonId}/attachments/{id} */
export interface DeleteHealthAttachmentInput {
  studentSeasonId: number;
  attachmentId: number;
}
