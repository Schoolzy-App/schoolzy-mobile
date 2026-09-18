import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { SvgProps } from "react-native-svg";

import type { ColorPalette } from "@/apps";
import { Card, Text } from "@/components/ui";
import { Icons } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export interface AccountItemProps {
  text: string;
  icon: React.FC<SvgProps>;
  iconColor?: string;
  onPress?: () => void;
}

const AccountItem = memo<AccountItemProps>(
  ({ text, icon: Icon, iconColor, onPress }) => {
    const styles = useStyles(createStyles);
    const { colors } = useTheme();

    return (
      <Card style={styles.card}>
        <Pressable onPress={onPress} style={styles.pressable}>
          <View style={styles.content}>
            <Icon
              width={22}
              height={22}
              color={iconColor ?? colors.secondary}
            />
            <View style={styles.bottom}>
              <Text variant="label2" weight="medium">
                {text}
              </Text>

              <Icons.Arrow width={12} height={12} style={styles.arrow} />
            </View>
          </View>
        </Pressable>
      </Card>
    );
  },
);

AccountItem.displayName = "AccountItem";
export default AccountItem;

const createStyles = (_colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      padding: 0,
      minHeight: 84,
    },
    pressable: {
      flex: 1,

      padding: 12,
    },
    content: {
      flex: 1,
      gap: 12,
    },
    bottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    arrow: {
      transform: [{ rotate: "-90deg" }],
    },
  });
