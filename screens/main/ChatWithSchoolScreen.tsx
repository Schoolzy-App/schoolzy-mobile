import React from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { ScreenTemplate, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export default function ChatWithSchoolScreen() {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();

  return (
    <ScreenTemplate
      title={
        <Text variant="label1" weight="medium" color={colors.buttonText}>
          Chat with{" "}
          <Text variant="label1" weight="bold" color={colors.buttonText}>
            School
          </Text>
        </Text>
      }
    >
      <View style={styles.container} />
    </ScreenTemplate>
  );
}

const createStyles = (_colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      width: "100%",
      flex: 1,
    },
  });
