import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/contexts/ThemeContext";

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  withBottomInset?: boolean;
}

const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  withBottomInset,
}) => {
  const { bottom } = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        style,
        withBottomInset && { paddingBottom: bottom },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Screen;
