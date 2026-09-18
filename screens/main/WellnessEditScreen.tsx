import React, { useCallback, useState } from "react";
import { Alert } from "react-native";

import { Button, QueryState, ScreenTemplate, Text } from "@/components/ui";
import WellnessTabs from "@/components/wellness/WellnessTabs";
import AttachmentsTab from "@/components/wellness/tabs/AttachmentsTab";
import ChronicDiseasesTab from "@/components/wellness/tabs/ChronicDiseasesTab";
import MedicationsTab from "@/components/wellness/tabs/MedicationsTab";
import PastConditionsTab from "@/components/wellness/tabs/PastConditionsTab";
import SpecialRequirementsTab from "@/components/wellness/tabs/SpecialRequirementsTab";
import VaccinationsTab from "@/components/wellness/tabs/VaccinationsTab";
import { useTheme } from "@/contexts/ThemeContext";
import { useHealthProfileEdit, useSaveHealthProfile } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";
import type { HealthProfileData } from "@/services/mappers";
import { ApiError } from "@/types/api";
import type {
  AttachmentsState,
  ChronicDisease,
  Medication,
  PastCondition,
  SpecialRequirements,
  Vaccination,
  WellnessTabKey,
} from "@/types/wellness";

type Props = RootStackScreenProps<"WellnessEdit">;

export default function WellnessEditScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { studentName, studentSeasonId } = route.params;
  const firstName = studentName.split(" ")[0];

  const [activeTab, setActiveTab] = useState<WellnessTabKey>("chronic");

  const { data, isLoading, error, refetch } =
    useHealthProfileEdit(studentSeasonId);
  const { mutateAsync: save, isPending } = useSaveHealthProfile(studentSeasonId);

  /**
   * Local working copy. Edits must not write straight into the query cache —
   * a background refetch would otherwise discard whatever the parent is typing.
   *
   * Derived rather than seeded in an effect: until the first edit the fetched
   * data is shown directly, and from then on the local override wins.
   */
  const [edited, setEdited] = useState<HealthProfileData | null>(null);
  const draft = edited ?? data ?? null;

  const setDraft = useCallback(
    (updater: (prev: HealthProfileData) => HealthProfileData) => {
      setEdited((prev) => {
        const base = prev ?? data;
        return base ? updater(base) : prev;
      });
    },
    [data],
  );

  // ── Section updaters ─────────────────────────────────────────────────────
  const update = useCallback(
    <K extends keyof HealthProfileData>(
      key: K,
      value: HealthProfileData[K],
    ) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
    },
    [setDraft],
  );

  const addTo = useCallback(
    <K extends "chronicDiseases" | "pastConditions" | "medications" | "vaccinations">(
      key: K,
      item: HealthProfileData[K][number],
    ) => {
      setDraft((prev) => ({ ...prev, [key]: [...prev[key], item] }));
    },
    [setDraft],
  );

  const updateIn = useCallback(
    <K extends "chronicDiseases" | "pastConditions" | "medications" | "vaccinations">(
      key: K,
      id: string,
      item: HealthProfileData[K][number],
    ) => {
      setDraft((prev) => ({
        ...prev,
        [key]: prev[key].map((existing) =>
          existing.id === id ? item : existing,
        ),
      }));
    },
    [setDraft],
  );

  const deleteFrom = useCallback(
    <K extends "chronicDiseases" | "pastConditions" | "medications" | "vaccinations">(
      key: K,
      id: string,
    ) => {
      setDraft((prev) => ({
        ...prev,
        [key]: prev[key].filter((item) => item.id !== id),
      }));
    },
    [setDraft],
  );

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!draft || isPending) return;
    try {
      await save(draft);
      navigation.goBack();
    } catch (e) {
      Alert.alert(
        "Save failed",
        e instanceof ApiError
          ? e.message
          : "Could not save the wellness profile. Please try again.",
      );
    }
  }, [draft, isPending, save, navigation]);

  const renderTab = () => {
    if (!draft) return null;

    switch (activeTab) {
      case "chronic":
        return (
          <ChronicDiseasesTab
            items={draft.chronicDiseases}
            onAdd={(item: ChronicDisease) => addTo("chronicDiseases", item)}
            onUpdate={(id: string, item: ChronicDisease) =>
              updateIn("chronicDiseases", id, item)
            }
            onDelete={(id: string) => deleteFrom("chronicDiseases", id)}
          />
        );
      case "past":
        return (
          <PastConditionsTab
            items={draft.pastConditions}
            onAdd={(item: PastCondition) => addTo("pastConditions", item)}
            onUpdate={(id: string, item: PastCondition) =>
              updateIn("pastConditions", id, item)
            }
            onDelete={(id: string) => deleteFrom("pastConditions", id)}
          />
        );
      case "medications":
        return (
          <MedicationsTab
            items={draft.medications}
            onAdd={(item: Medication) => addTo("medications", item)}
            onUpdate={(id: string, item: Medication) =>
              updateIn("medications", id, item)
            }
            onDelete={(id: string) => deleteFrom("medications", id)}
          />
        );
      case "vaccinations":
        return (
          <VaccinationsTab
            items={draft.vaccinations}
            onAdd={(item: Vaccination) => addTo("vaccinations", item)}
            onUpdate={(id: string, item: Vaccination) =>
              updateIn("vaccinations", id, item)
            }
            onDelete={(id: string) => deleteFrom("vaccinations", id)}
          />
        );
      case "special":
        return (
          <SpecialRequirementsTab
            data={draft.specialRequirements}
            onSave={(value: SpecialRequirements) =>
              update("specialRequirements", value)
            }
          />
        );
      case "attachments":
        return (
          <AttachmentsTab
            data={draft.attachments}
            onSave={(value: AttachmentsState) => update("attachments", value)}
          />
        );
    }
  };

  return (
    <ScreenTemplate
      title={
        <Text variant="label1" weight="medium" color={colors.buttonText}>
          Edit Wellness{" "}
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            {firstName}
          </Text>
        </Text>
      }
      headerContent={
        <WellnessTabs activeTab={activeTab} onSelect={setActiveTab} />
      }
      bottomContent={
        <Button
          text="Save"
          onPress={handleSave}
          isLoading={isPending}
          disabled={!draft || isPending}
        />
      }
    >
      <QueryState isLoading={isLoading} error={error} onRetry={refetch}>
        {renderTab()}
      </QueryState>
    </ScreenTemplate>
  );
}
