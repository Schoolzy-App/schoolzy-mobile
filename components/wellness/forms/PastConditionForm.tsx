import React, { memo } from 'react';

import type { PastCondition } from '@/types/wellness';
import { DefaultInput } from '@/components/ui';

interface PastConditionFormProps {
  draft: Partial<PastCondition>;
  onChange: (updated: Partial<PastCondition>) => void;
}

const PastConditionForm = memo<PastConditionFormProps>(({ draft, onChange }) => {
  const set = <K extends keyof PastCondition>(key: K, value: PastCondition[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <>
      <DefaultInput
        label="Condition Type"
        value={draft.conditionType ?? ''}
        onChange={(v) => set('conditionType', v)}
        type="text"
        placeholder="e.g. Fracture, Infection..."
      />

      <DefaultInput
        label="Date"
        value={draft.date ?? ''}
        onChange={(v) => set('date', v)}
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

      <DefaultInput
        label="Description"
        value={draft.description ?? ''}
        onChange={(v) => set('description', v)}
        type="text"
        placeholder="Describe the condition..."
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top', paddingTop: 14 }}
      />
    </>
  );
});

PastConditionForm.displayName = 'PastConditionForm';
export default PastConditionForm;
