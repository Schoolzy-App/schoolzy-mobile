import type {
  ChronicDiseaseDto,
  HealthProfileEditDto,
  HealthProfileOverviewDto,
  PastMedicalConditionDto,
  RegularMedicationDto,
  SaveHealthProfileRequestDto,
  SpecialMedicalRequirementDto,
  VaccinationRecordDto,
} from "@/types/api";
import type {
  AttachmentsState,
  ChronicDisease,
  DietaryRequirement,
  Medication,
  PastCondition,
  Severity,
  SpecialRequirements,
  Vaccination,
  WellnessDocument,
} from "@/types/wellness";
import {
  DEFAULT_ATTACHMENTS,
  DEFAULT_SPECIAL_REQUIREMENTS,
} from "@/types/wellness";
import { formatDate } from "@/utils/format";

/**
 * Bridges the API's health-profile payload to the existing wellness UI types.
 *
 * This file is the single place to correct if the real DTOs differ from the
 * provisional ones in `types/api/healthProfile.ts` — every screen consumes the
 * UI types below, not the DTOs.
 */

/** UI dates are "DD/MM/YYYY" strings; the API uses ISO date-times. */
const toUiDate = (value?: string | null) => formatDate(value);

/** "DD/MM/YYYY" → ISO, for the save payload. Returns null when unparseable. */
function toIsoDate(value?: string | null): string | null {
  if (!value) return null;
  const [d, m, y] = value.split("/").map(Number);
  if (!d || !m || !y) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const SEVERITIES: Severity[] = ["mild", "moderate", "severe"];
/** UI severity → the int the API expects (1 = Mild, 2 = Moderate, 3 = Severe). */
const SEVERITY_TO_WIRE: Record<Severity, number> = {
  mild: 1,
  moderate: 2,
  severe: 3,
};

/** ⚠️ Tolerates either a string ("Mild") or an int enum (1/2/3). */
function toSeverity(value: unknown): Severity {
  if (typeof value === "number") return SEVERITIES[value - 1] ?? "mild";
  const normalized = String(value ?? "").toLowerCase();
  return SEVERITIES.find((s) => normalized.includes(s)) ?? "mild";
}

/**
 * The wire format uses four independent booleans; the UI models dietary needs
 * as a list of codes, which is what the checkbox group renders.
 */
function toDietaryRequirements(
  sr: SpecialMedicalRequirementDto,
): DietaryRequirement[] {
  const out: DietaryRequirement[] = [];
  if (sr.isVegetarian) out.push("vegetarian");
  if (sr.isVegan) out.push("vegan");
  if (sr.isLactoseIntolerant) out.push("lactose_intolerant");
  if (sr.isGlutenIntolerant) out.push("gluten_intolerant");
  return out;
}

// ─── DTO → UI ────────────────────────────────────────────────────────────────

export interface HealthProfileData {
  healthProfileId: number | null;
  studentName: string;
  note: string;
  chronicDiseases: ChronicDisease[];
  pastConditions: PastCondition[];
  medications: Medication[];
  vaccinations: Vaccination[];
  specialRequirements: SpecialRequirements;
  attachments: AttachmentsState;
  /** Numeric ids kept so attachments can be deleted/downloaded. */
  attachmentIds: Record<string, number>;
}

export function selectHealthProfileEdit(
  dto: HealthProfileEditDto,
): HealthProfileData {
  const attachmentIds: Record<string, number> = {};
  const documents: WellnessDocument[] = (dto.attachments ?? []).map((a) => {
    const id = String(a.id);
    attachmentIds[id] = a.id;
    return {
      id,
      name: a.fileName ?? "Attachment",
      // The server supplies a relative path; the viewer prefixes the base URL.
      uri: a.fileUrl ?? "",
      size:
        a.fileSizeBytes != null
          ? `${Math.round(a.fileSizeBytes / 1024)} KB`
          : "",
    };
  });

  const sr = dto.specialMedicalRequirement;

  return {
    healthProfileId: dto.healthProfileId ?? null,
    studentName: dto.studentName ?? "",
    note: dto.note ?? "",
    chronicDiseases: (dto.chronicDiseases ?? []).map((c, i) => ({
      id: String(c.id ?? `chronic_${i}`),
      chronicDiseaseId: c.chronicDiseaseId ?? null,
      disease: c.chronicDiseaseName ?? "",
      sinceWhen: toUiDate(c.sinceWhen),
      severity: toSeverity(c.severity),
      treatmentPlan: c.treatmentPlan ?? "",
      schoolPrecautions: c.schoolPrecautions ?? "",
      recovered: c.isRecovered,
      recoveredDate: toUiDate(c.recoveredDate),
    })),
    pastConditions: (dto.pastMedicalConditions ?? []).map((p, i) => ({
      id: String(p.id ?? `past_${i}`),
      conditionType: p.conditionType ?? "",
      date: toUiDate(p.date),
      notes: p.notes ?? "",
      description: p.description ?? "",
    })),
    medications: (dto.regularMedications ?? []).map((m, i) => ({
      id: String(m.id ?? `med_${i}`),
      medicationName: m.medicationName ?? "",
      dosage: m.dosage ?? "",
      // "09:00:00" → "09:00"
      timeOfAdministration: (m.timeOfAdministration ?? "").slice(0, 5),
      takenAtSchool: m.takenAtSchool,
      notes: m.notes ?? "",
    })),
    vaccinations: (dto.vaccinationRecords ?? []).map((v, i) => ({
      id: String(v.id ?? `vax_${i}`),
      vaccineName: v.vaccineName ?? "",
      dateTaken: toUiDate(v.dateTaken),
      notes: v.notes ?? "",
    })),
    specialRequirements: sr
      ? {
          assistiveDevices: sr.assistiveDevices ?? "",
          assistiveDevicesNotes: sr.assistiveDevicesNotes ?? "",
          physicalLimitations: sr.physicalLimitations ?? "",
          physicalLimitationsNotes: sr.physicalLimitationsNotes ?? "",
          learningNeeds: sr.learningNeeds ?? "",
          accommodations: sr.accommodations ?? "",
          dietaryRequirements: toDietaryRequirements(sr),
          religiousDiet: sr.religiousDiet ?? "",
          otherDietInstructions: sr.otherDietInstructions ?? "",
        }
      : DEFAULT_SPECIAL_REQUIREMENTS,
    attachments: { ...DEFAULT_ATTACHMENTS, documents, notes: dto.note ?? "" },
    attachmentIds,
  };
}

// ─── UI → DTO (save payload) ─────────────────────────────────────────────────

/** Numeric id for records that came from the server; null for new ones. */
const toServerId = (id: string): number | null => {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
};

export function toSaveRequest(
  data: HealthProfileData,
): SaveHealthProfileRequestDto {
  const chronicDiseases: ChronicDiseaseDto[] = data.chronicDiseases.map((c) => ({
    id: toServerId(c.id),
    chronicDiseaseId: c.chronicDiseaseId,
    chronicDiseaseName: c.disease,
    sinceWhen: toIsoDate(c.sinceWhen),
    severity: SEVERITY_TO_WIRE[c.severity],
    treatmentPlan: c.treatmentPlan,
    schoolPrecautions: c.schoolPrecautions,
    isRecovered: c.recovered,
    recoveredDate: toIsoDate(c.recoveredDate),
  }));

  const pastMedicalConditions: PastMedicalConditionDto[] =
    data.pastConditions.map((p) => ({
      id: toServerId(p.id),
      conditionType: p.conditionType,
      date: toIsoDate(p.date),
      description: p.description,
      notes: p.notes,
    }));

  const regularMedications: RegularMedicationDto[] = data.medications.map(
    (m) => ({
      id: toServerId(m.id),
      medicationName: m.medicationName,
      dosage: m.dosage,
      // "09:00" → "09:00:00"
      timeOfAdministration: m.timeOfAdministration
        ? `${m.timeOfAdministration}:00`.slice(0, 8)
        : null,
      takenAtSchool: m.takenAtSchool,
      notes: m.notes,
    }),
  );

  const vaccinationRecords: VaccinationRecordDto[] = data.vaccinations.map(
    (v) => ({
      id: toServerId(v.id),
      vaccineName: v.vaccineName,
      dateTaken: toIsoDate(v.dateTaken),
      notes: v.notes,
    }),
  );

  const sr = data.specialRequirements;
  const specialMedicalRequirement: SpecialMedicalRequirementDto = {
    assistiveDevices: sr.assistiveDevices || null,
    assistiveDevicesNotes: sr.assistiveDevicesNotes || null,
    physicalLimitations: sr.physicalLimitations || null,
    physicalLimitationsNotes: sr.physicalLimitationsNotes || null,
    learningNeeds: sr.learningNeeds || null,
    accommodations: sr.accommodations || null,
    isVegetarian: sr.dietaryRequirements.includes("vegetarian"),
    isVegan: sr.dietaryRequirements.includes("vegan"),
    isLactoseIntolerant: sr.dietaryRequirements.includes("lactose_intolerant"),
    isGlutenIntolerant: sr.dietaryRequirements.includes("gluten_intolerant"),
    religiousDiet: sr.religiousDiet || null,
    otherDietInstructions: sr.otherDietInstructions || null,
  };

  return {
    note: data.attachments.notes || data.note || null,
    chronicDiseases,
    pastMedicalConditions,
    regularMedications,
    vaccinationRecords,
    specialMedicalRequirement,
  };
}

/** Counts shown on the read-only wellness report card. */
export interface HealthProfileSummary {
  studentName: string;
  /** "Male" / "Female" as returned by the API, or "" when unknown. */
  gender: string;
  bloodType: string;
  year: string;
  chronic: number;
  past: number;
  medications: number;
  vaccinations: number;
  specialRequirementCount: number;
  documentCount: number;
  hasNotes: boolean;
  hasAnyData: boolean;
}

/**
 * `select` for the overview query.
 *
 * The endpoint returns counts rather than records, which is exactly what the
 * wellness report card renders — no record walking needed.
 */
export function selectHealthProfileSummary(
  dto: HealthProfileOverviewDto,
): HealthProfileSummary {
  const specialRequirementCount = dto.hasSpecialMedicalRequirement ? 1 : 0;
  const documentCount = dto.attachmentsCount ?? 0;
  const hasNotes = !!dto.note;

  return {
    studentName: dto.studentName ?? "",
    gender: dto.gender ?? "",
    bloodType: dto.bloodType ?? "",
    year: [dto.gradeName, dto.className].filter(Boolean).join(" ("),
    chronic: dto.chronicDiseasesCount ?? 0,
    past: dto.pastMedicalConditionsCount ?? 0,
    medications: dto.regularMedicationsCount ?? 0,
    vaccinations: dto.vaccinationRecordsCount ?? 0,
    specialRequirementCount,
    documentCount,
    hasNotes,
    hasAnyData:
      (dto.chronicDiseasesCount ?? 0) > 0 ||
      (dto.pastMedicalConditionsCount ?? 0) > 0 ||
      (dto.regularMedicationsCount ?? 0) > 0 ||
      (dto.vaccinationRecordsCount ?? 0) > 0 ||
      specialRequirementCount > 0 ||
      documentCount > 0 ||
      hasNotes,
  };
}
