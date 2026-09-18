import React, { memo } from 'react';

import type { Vaccination } from '@/types/wellness';
import { DefaultInput } from '@/components/ui';

interface VaccinationFormProps {
  draft: Partial<Vaccination>;
  onChange: (updated: Partial<Vaccination>) => void;
}

const VaccinationForm = memo<VaccinationFormProps>(({ draft, onChange }) => {
  const set = <K extends keyof Vaccination>(key: K, value: Vaccination[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <>
      <DefaultInput
        label="Vaccine Name"
        value={draft.vaccineName ?? ''}
        onChange={(v) => set('vaccineName', v)}
        type="text"
        placeholder="e.g. MMR, Hepatitis B..."
      />

      <DefaultInput
        label="Date Taken"
        value={draft.dateTaken ?? ''}
        onChange={(v) => set('dateTaken', v)}
        type="date"
        placeholder="DD/MM/YYYY"
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

VaccinationForm.displayName = 'VaccinationForm';
export default VaccinationForm;
