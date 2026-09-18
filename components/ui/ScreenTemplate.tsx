import { useNavigation } from "@react-navigation/native";
import React, { FC } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ColorPalette } from "@/apps";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

import IconContainer from "./IconContainer";
import Text from "./Text";

type ScreenTemplateProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  headerContent?: React.ReactElement;
  Top?: React.ReactElement;
  showHeader?: boolean;
  title?: string | React.ReactElement;
  onBack?: () => void;
  bottomContent?: React.ReactNode;
};

const ScreenTemplate: FC<ScreenTemplateProps> = ({
  children,
  style,
  headerContent,
  Top,
  contentStyle,
  showHeader = true,
  title,
  onBack,
  bottomContent,
}) => {
  const insets = useSafeAreaInsets();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const navigation = useNavigation();

  const handleBack = onBack ?? (() => navigation.goBack());

  const titleContent = title ? (
    <View style={styles.titleRow}>
      <Pressable onPress={handleBack} hitSlop={12}>
        <IconContainer size={40} color={colors.surface}>
          <Icons.BackIcon width={20} height={20} color={colors.textPrimary} />
        </IconContainer>
      </Pressable>
      <View style={styles.titleCenter}>
        {typeof title === "string" ? (
          <Text variant="label1" weight="medium" color={colors.buttonText}>
            {title}
          </Text>
        ) : (
          title
        )}
      </View>
      {/* Spacer to center title */}
      <View style={{ width: 40 }} />
    </View>
  ) : null;

  return (
    <View style={[styles.screen, style]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      {showHeader && (
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 12,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
        >
          {Top}
          {titleContent}
          {headerContent}
        </View>
      )}

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          // { paddingBottom: insets.bottom },
          contentStyle,
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {/* ── Sticky Bottom ──────────────────────────────────────────────── */}
      {bottomContent ? (
        <View
          style={[
            styles.bottom,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {bottomContent}
        </View>
      ) : null}
    </View>
  );
};

export default ScreenTemplate;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      width: "100%",
      minHeight: 104,
      backgroundColor: colors.primary,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      paddingHorizontal: 16,
      paddingBottom: 16,
      justifyContent: "flex-end",
    },
    content: {
      flexGrow: 1,
      alignItems: "center",
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      // marginBottom: 8,
    },
    titleCenter: {
      flex: 1,
      alignItems: "center",
    },
    bottom: {
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: colors.background,
    },
  });
