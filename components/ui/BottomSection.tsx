import React, { FC } from "react";
import { StyleSheet, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";
import { useStyles } from "@/hooks";

import Text from "./Text";

type BottomSectionProps = {
  title: string;
  children: React.ReactNode;
  /** Optional node rendered on the right side of the title row (e.g. a "See all" button). */
  headerAction?: React.ReactNode;
  /**
   * Extra space under the content, inside the sheet — so the white runs to
   * the screen bottom behind a floating tab bar instead of ending above it.
   */
  bottomInset?: number;
};

const BottomSection: FC<BottomSectionProps> = ({
  title,
  children,
  headerAction,
  bottomInset = 0,
}) => {
  const styles = useStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.handleRow}>
        <View style={styles.handle} />
      </View>

      <View style={styles.titleRow}>
        <Text style={[Type.sectionTitle, styles.title]} numberOfLines={1}>
          {title}
        </Text>
        {headerAction ? <View style={styles.action}>{headerAction}</View> : null}
      </View>

      <View style={[styles.content, { paddingBottom: 40 + bottomInset }]}>
        {children}
      </View>
    </View>
  );
};

export default BottomSection;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    // The "Latest" sheet from the Student Dashboard spec §8.
    container: {
      flex: 1,
      width: "100%",
      minHeight: 300,
      backgroundColor: colors.surface,
      borderTopLeftRadius: Radius.sheet,
      borderTopRightRadius: Radius.sheet,
      paddingTop: 10,
    },
    handleRow: {
      alignItems: "center",
      marginBottom: 16,
    },
    handle: {
      width: Size.sheetHandle.width,
      height: Size.sheetHandle.height,
      borderRadius: 4,
      backgroundColor: Palette.surface.sheetHandle,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.screenX,
      paddingBottom: 11,
    },
    title: {
      flex: 1,
    },
    action: {
      paddingLeft: 12,
    },
    content: {
      paddingHorizontal: Spacing.screenX,
      gap: 11,
      paddingBottom: 40,
    },
  });
