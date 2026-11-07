import React, { memo } from 'react';

import type { Medication } from '@/types/wellness';
import { DefaultInput } from '@/components/ui';
import CheckboxRow from '@/components/wellness/CheckboxRow';

interface MedicationFormProps {
  draft: Partial<Medication>;
  onChange: (updated: Partial<Medication>) => void;
}

const MedicationForm = memo<MedicationFormProps>(({ draft, onChange }) => {
  const set = <K extends keyof Medication>(key: K, value: Medication[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <>
      <DefaultInput
        label="Medication Name"
        value={draft.medicationName ?? ''}
        onChange={(v) => set('medicationName', v)}
        type="text"
        placeholder="e.g. Amoxicillin..."
      />

      <DefaultInput
        label="Dosage"
        value={draft.dosage ?? ''}
        onChange={(v) => set('dosage', v)}
        type="text"
        placeholder="e.g. 500mg..."
      />

      <DefaultInput
        label="Time of Administration"
        value={draft.timeOfAdministration ?? ''}
        onChange={(v) => set('timeOfAdministration', v)}
        type="text"
        placeholder="e.g. 09:00"
      />

      <CheckboxRow
        label="Taken at school"
        value={draft.takenAtSchool ?? false}
        onChange={(v) => set('takenAtSchool', v)}
      />

      <DefaultInput
        label="Notes"
        value={draft.notes ?? ''}
        onChange={(v) => set('notes', v)}
        type="text"
        placeholder="Additional notes..."
      />
    </>
  );
});

MedicationForm.displayName = 'MedicationForm';
export default MedicationForm;
