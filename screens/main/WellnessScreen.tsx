import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { StudentCard } from "@/components";
import type { StudentStat } from "@/components/StudentCard";
import { QueryState, ScreenTemplate, Text } from "@/components/ui";
import WellnessReport from "@/components/wellness/WellnessReport";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useHealthProfile, useStyles } from "@/hooks";
import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"Wellness">;

export default function WellnessScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const {
    studentName,
    studentSeasonId,
    year = "",
    activeBus = false,
    allergies = "N/A",
    bloodType = "N/A",
    attendance = "N/A",
    avatarIcon = Icons.GirlAvatar,
  } = route.params;

  const { data, isLoading, error, refetch } = useHealthProfile(studentSeasonId);

  const summary = data;

  // ── Wellness-driven third stat (replaces "Attendance") ─────────────────
  const wellnessStat: StudentStat = useMemo(() => {
    if (!summary) return { label: "Status", value: "—" };
    if (summary.chronic > 0) {
      return {
        label: "Chronic",
        value: String(summary.chronic),
        color: colors.warning,
      };
    }
    if (summary.vaccinations > 0) {
      return {
        label: "Vaccines",
        value: String(summary.vaccinations),
        color: colors.success,
      };
    }
    return {
      label: "Status",
      value: summary.hasAnyData ? "On file" : "Healthy",
      color: colors.success,
    };
  }, [summary, colors]);

  const handleEdit = useCallback(() => {
    navigation.navigate("WellnessEdit", route.params);
  }, [navigation, route.params]);

  return (
    <ScreenTemplate
      title={
        <Text variant="label1" weight="medium" color={colors.buttonText}>
          Wellness for{" "}
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            {(summary?.studentName || studentName).split(" ")[0]}
          </Text>
        </Text>
      }
    >
      <StudentCard
        name={summary?.studentName || studentName}
        year={summary?.year || year}
        activeBus={activeBus}
        allergies={allergies}
        // The health profile is the only endpoint that returns blood type.
        bloodType={summary?.bloodType || bloodType}
        attendance={attendance}
        avatarIcon={
          summary?.gender
            ? summary.gender.toLowerCase() === "male"
              ? Icons.BoyAvatar
              : Icons.GirlAvatar
            : avatarIcon
        }
        showStats
        thirdStat={wellnessStat}
        trailingElement={
          <Pressable onPress={handleEdit} hitSlop={8}>
            <MaterialIcons name="edit" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      <View style={styles.sections}>
        <QueryState
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        >
          {summary ? <WellnessReport defaultOpen summary={summary} /> : null}
        </QueryState>
      </View>
    </ScreenTemplate>
  );
}

const createStyles = () =>
  StyleSheet.create({
    sections: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 12,
    },
    reportsList: {
      width: "100%",
      gap: 12,
    },
  });
