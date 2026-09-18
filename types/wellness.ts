// ─── Shared types ────────────────────────────────────────────────────────────

export type Severity = 'mild' | 'moderate' | 'severe';
export type MedicationFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'as_needed'
  | 'weekly';
export type DietaryRequirement =
  | 'vegetarian'
  | 'vegan'
  | 'lactose_intolerant'
  | 'gluten_intolerant';

// ─── Tab key ─────────────────────────────────────────────────────────────────

export type WellnessTabKey =
  | 'chronic'
  | 'past'
  | 'medications'
  | 'vaccinations'
  | 'special'
  | 'attachments';

// ─── Entity interfaces ────────────────────────────────────────────────────────

export interface ChronicDisease {
  id: string;
  /**
   * FK into the school's disease catalogue. Null for a locally added record —
   * ⚠️ there is no endpoint to list the catalogue, so new entries cannot set it.
   */
  chronicDiseaseId: number | null;
  /** Display name, e.g. "Asthma". */
  disease: string;
  sinceWhen: string; // "DD/MM/YYYY"
  severity: Severity;
  treatmentPlan: string;
  schoolPrecautions: string;
  recovered: boolean;
  recoveredDate: string; // "DD/MM/YYYY"
}

export interface PastCondition {
  id: string;
  conditionType: string;
  date: string; // "DD/MM/YYYY"
  notes: string;
  description: string;
}

export interface Medication {
  id: string;
  medicationName: string;
  dosage: string;
  /** Time of day, "HH:mm" — the API has no frequency/start/end fields. */
  timeOfAdministration: string;
  /** Whether school staff administer it during the day. */
  takenAtSchool: boolean;
  notes: string;
}

export interface Vaccination {
  id: string;
  vaccineName: string;
  dateTaken: string; // "DD/MM/YYYY"
  notes: string;
}

export interface SpecialRequirements {
  assistiveDevices: string;
  assistiveDevicesNotes: string;
  physicalLimitations: string;
  physicalLimitationsNotes: string;
  learningNeeds: string;
  accommodations: string;
  dietaryRequirements: DietaryRequirement[];
  religiousDiet: string;
  otherDietInstructions: string;
}

export interface WellnessDocument {
  id: string;
  name: string;
  uri: string;
  size: string;
}

export interface AttachmentsState {
  documents: WellnessDocument[];
  replaceAll: boolean;
  notes: string;
}

// ─── Dropdown option constants ────────────────────────────────────────────────

export const CHRONIC_DISEASE_OPTIONS = [
  { label: 'Asthma', value: 'asthma' },
  { label: 'Diabetes Type 1', value: 'diabetes_type_1' },
  { label: 'Diabetes Type 2', value: 'diabetes_type_2' },
  { label: 'Epilepsy', value: 'epilepsy' },
  { label: 'Hypertension', value: 'hypertension' },
  { label: 'Heart Disease', value: 'heart_disease' },
  { label: 'Sickle Cell Disease', value: 'sickle_cell' },
  { label: 'Cerebral Palsy', value: 'cerebral_palsy' },
  { label: 'Down Syndrome', value: 'down_syndrome' },
  { label: 'Autism Spectrum Disorder', value: 'autism' },
  { label: 'ADHD', value: 'adhd' },
  { label: 'Other', value: 'other' },
];

export const SEVERITY_OPTIONS = [
  { label: 'Mild', value: 'mild' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Severe', value: 'severe' },
];

export const FREQUENCY_OPTIONS = [
  { label: 'Once Daily', value: 'once_daily' },
  { label: 'Twice Daily', value: 'twice_daily' },
  { label: 'Three Times Daily', value: 'three_times_daily' },
  { label: 'As Needed', value: 'as_needed' },
  { label: 'Weekly', value: 'weekly' },
];

// ─── Default values ───────────────────────────────────────────────────────────

export const DEFAULT_SPECIAL_REQUIREMENTS: SpecialRequirements = {
  assistiveDevices: '',
  assistiveDevicesNotes: '',
  physicalLimitations: '',
  physicalLimitationsNotes: '',
  learningNeeds: '',
  accommodations: '',
  dietaryRequirements: [],
  religiousDiet: '',
  otherDietInstructions: '',
};

export const DEFAULT_ATTACHMENTS: AttachmentsState = {
  documents: [],
  replaceAll: false,
  notes: '',
};
