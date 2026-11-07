import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

import ParentAvatar from "@/components/ParentAvatar";
import { Card, IconContainer, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

export interface AccountParentCardProps {
  name: string;
  role: string;
  /** Drives the avatar illustration. From /home/current-user. */
  gender?: string;
}

const AccountParentCard = memo<AccountParentCardProps>(({ name, role, gender }) => {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <IconContainer size={44} color={colors.secondary}>
          <ParentAvatar gender={gender} size={24} />
        </IconContainer>

        <View style={styles.textGroup}>
          <Text variant="label2" weight="semiBold" color={colors.textPrimary}>
            {name}
          </Text>
          <Text variant="label3" weight="regular" color={colors.textSecondary}>
            {role}
          </Text>
        </View>
      </View>
    </Card>
  );
});

AccountParentCard.displayName = "AccountParentCard";
export default AccountParentCard;

const createStyles = () =>
  StyleSheet.create({
    card: {
      paddingVertical: 18,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    textGroup: {
      gap: 2,
    },
  });
