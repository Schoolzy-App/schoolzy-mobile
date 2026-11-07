import React, { memo } from 'react';
import { View } from 'react-native';

import type { ChronicDisease } from '@/types/wellness';
import { CHRONIC_DISEASE_OPTIONS, SEVERITY_OPTIONS } from '@/types/wellness';
import { DefaultInput } from '@/components/ui';
import CheckboxRow from '../CheckboxRow';

interface ChronicDiseaseFormProps {
  draft: Partial<ChronicDisease>;
  onChange: (updated: Partial<ChronicDisease>) => void;
}

const ChronicDiseaseForm = memo<ChronicDiseaseFormProps>(({ draft, onChange }) => {
  const set = <K extends keyof ChronicDisease>(key: K, value: ChronicDisease[K]) =>
    onChange({ ...draft, [key]: value });

  /** Un-ticking "Recovered" drops the date with it. */
  const setRecovered = (recovered: boolean) =>
    onChange({ ...draft, recovered, ...(recovered ? {} : { recoveredDate: '' }) });

  return (
    <>
      <View style={{ zIndex: 30 }}>
        <DefaultInput
          label="Disease"
          value={draft.disease ?? ''}
          onChange={(v) => set('disease', v)}
          type="select"
          placeholder="Select disease"
          options={CHRONIC_DISEASE_OPTIONS}
        />
      </View>

      <DefaultInput
        label="Since When"
        value={draft.sinceWhen ?? ''}
        onChange={(v) => set('sinceWhen', v)}
        type="date"
        placeholder="DD/MM/YYYY"
      />

      <View style={{ zIndex: 20 }}>
        <DefaultInput
          label="Severity"
          value={draft.severity ?? ''}
          onChange={(v) => set('severity', v as ChronicDisease['severity'])}
          type="select"
          placeholder="Select severity"
          options={SEVERITY_OPTIONS}
        />
      </View>

      <DefaultInput
        label="Treatment Plan"
        value={draft.treatmentPlan ?? ''}
        onChange={(v) => set('treatmentPlan', v)}
        type="text"
        placeholder="Describe the treatment plan..."
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 14 }}
      />

      <DefaultInput
        label="School Precautions"
        value={draft.schoolPrecautions ?? ''}
        onChange={(v) => set('schoolPrecautions', v)}
        type="text"
        placeholder="List any school precautions..."
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 14 }}
      />

      <CheckboxRow
        label="Recovered"
        value={draft.recovered ?? false}
        onChange={setRecovered}
      />

      {/* Only meaningful once recovered; clearing the flag clears the date so
          a stale value can't be sent. `recoveredDate` was already in the DTO,
          the mapper and the save payload — it just had no field. */}
      {draft.recovered ? (
        <DefaultInput
          label="Recovery Date"
          value={draft.recoveredDate ?? ''}
          onChange={(v) => set('recoveredDate', v)}
          type="date"
          placeholder="DD/MM/YYYY"
        />
      ) : null}
    </>
  );
});

ChronicDiseaseForm.displayName = 'ChronicDiseaseForm';
export default ChronicDiseaseForm;
