import React, { FC } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { useStyles } from "@/hooks";

import Text from "./Text";

type BottomSectionProps = {
  title: string;
  children: React.ReactNode;
  /** Optional node rendered on the right side of the title row (e.g. a "See all" button). */
  headerAction?: React.ReactNode;
};

const BottomSection: FC<BottomSectionProps> = ({
  title,
  children,
  headerAction,
}) => {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.handleRow}>
        <View style={styles.handle} />
      </View>

      <View style={styles.titleRow}>
        <Text variant="label2" weight="medium" style={styles.title}>
          {title}
        </Text>
        {headerAction ? <View style={styles.action}>{headerAction}</View> : null}
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
};

export default BottomSection;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 4,
    },
    handleRow: {
      alignItems: "center",
      paddingVertical: 8,
    },
    handle: {
      width: 100,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    title: {
      flex: 1,
    },
    action: {
      paddingLeft: 12,
    },
    content: {
      paddingHorizontal: 16,
      gap: 12,
      paddingBottom: 24,
    },
  });
