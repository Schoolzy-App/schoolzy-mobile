import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import type { SvgProps } from "react-native-svg";

import {
  AccountItem,
  AccountParentCard,
} from "@/components";
import { ScreenTemplate, Text } from "@/components/ui";
import { FeatureFlags, Icons } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrentUser, useStyles } from "@/hooks";
import type { RootStackParamList } from "@/navigation/types";

type AccountAction = "logout" | "delete-account";

type AccountRow = {
  id: string;
  navigationTo?: keyof RootStackParamList;
  action?: AccountAction;
  text: string;
  icon: React.FC<SvgProps>;
  iconColor?: string;
};

/**
 * Requests is shown in exactly one place: as a bottom-bar tab, or as this row.
 * The `requestsTab` flag decides which, so the two can never both show (or both
 * hide) — see `constants/featureFlags.ts`.
 */
const REQUESTS_ROW: AccountRow = {
  id: "requests",
  text: "Requests",
  icon: Icons.ReportIcon,
  iconColor: "#4F7DCA",
  navigationTo: "Request",
};

const ACCOUNT_ITEMS: AccountRow[] = [
  {
    id: "change-password",
    text: "Change password",
    icon: Icons.LockActive,
    iconColor: "#4F7DCA",
    navigationTo: "ChangePassword",
  },
  // Only when Requests is not already a bottom-bar tab.
  ...(FeatureFlags.requestsTab ? [] : [REQUESTS_ROW]),
  {
    id: "logout",
    text: "Logout",
    icon: Icons.Logout,
    iconColor: "#CA1616",
    action: "logout",
  },
  {
    id: "delete-account",
    text: "Delete account",
    icon: Icons.DeleteAccount,
    iconColor: "#CA1616",
    action: "delete-account",
  },
];

// Below this width (covers Samsung Flip cover screen and other small foldables)
// the items grid collapses to a single column.
const NARROW_WIDTH_BREAKPOINT = 360;

export default function AccountScreen() {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const { logout } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const isNarrow = width < NARROW_WIDTH_BREAKPOINT;

  const handleItemPress = (item: AccountRow) => {
    // Both Logout and Delete account sign the user out
    if (item.action === "logout" || item.action === "delete-account") {
      logout();
      return;
    }
    if (item.navigationTo) {
      navigation.navigate(item.navigationTo as never);
    }
  };

  const { data: currentUser } = useCurrentUser();

  return (
    <ScreenTemplate
      headerContent={
        <View style={styles.headerContent}>
          <Text variant="label1" weight="medium" color={colors.buttonText}>
            Account
          </Text>
        </View>
      }
    >
      <View style={styles.container}>
        {/* "Father" / "Mother" is derived from userType + gender — the API
            returns only "Parent"/"Relative" plus a gender. */}
        <AccountParentCard
          name={currentUser?.name ?? ""}
          role={currentUser?.roleLabel ?? ""}
          gender={currentUser?.gender}
        />

        {/* No wallet card here: wallets belong to a student, not to the
            parent account. Each student's balance lives on their Finances
            screen, next to what it pays for. */}

        <View style={styles.itemsGrid}>
          {ACCOUNT_ITEMS.map((item) => (
            <View
              key={item.id}
              style={isNarrow ? styles.itemCellFull : styles.itemCell}
            >
              <AccountItem
                text={item.text}
                icon={item.icon}
                iconColor={item.iconColor}
                onPress={() => handleItemPress(item)}
              />
            </View>
          ))}
        </View>
      </View>
    </ScreenTemplate>
  );
}

const createStyles = () =>
  StyleSheet.create({
    headerContent: {
      alignItems: "center",
      justifyContent: "center",
    },
    container: {
      width: "100%",
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 16,
    },
    itemsGrid: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    itemCell: {
      width: "48.3%",
    },
    itemCellFull: {
      width: "100%",
    },
  });
