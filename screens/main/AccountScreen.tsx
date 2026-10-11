import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Platform,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
} from "react-native";
import type { SvgProps } from "react-native-svg";

import type { ColorPalette } from "@/apps";
import {
  AccountItem,
  AccountParentCard,
} from "@/components";
import { ScreenTemplate, Text } from "@/components/ui";
import { FeatureFlags, Icons } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBiometricSetting, useCurrentUser, useStyles } from "@/hooks";
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
    id: "complaints",
    text: "Complaints",
    icon: Icons.EmergencyRoundIcon,
    iconColor: "#E8A923",
    navigationTo: "Complaints",
  },
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
  const biometric = useBiometricSetting();

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

        {/* Biometric sign-in.
            Hidden entirely when the device has no enrolled biometric — a
            switch that cannot do anything is worse than no switch. */}
        {biometric.ready && biometric.available ? (
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Icons.LockActive width={22} height={22} color="#4F7DCA" />
              <View style={styles.settingText}>
                <Text variant="label2" weight="medium">
                  Sign in with {biometric.label}
                </Text>
                <Text
                  variant="caption1"
                  weight="regular"
                  color={colors.textSecondary}
                >
                  {biometric.enabled
                    ? `Skip typing your password — ${biometric.label} unlocks your saved session.`
                    : `You'll sign in with your email and password.`}
                </Text>
              </View>
              <Switch
                value={biometric.enabled}
                onValueChange={biometric.toggle}
                trackColor={{ true: colors.primary }}
              />
            </View>
          </View>
        ) : null}
      </View>
    </ScreenTemplate>
  );
}

const createStyles = (colors: ColorPalette) =>
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
    /**
     * A plain View with card styling rather than <Card>: Card renders a
     * Pressable, and this row isn't pressable as a whole — only the switch is.
     */
    settingCard: {
      width: "100%",
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.card,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        android: { elevation: 3 },
      }),
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    settingText: {
      flex: 1,
      gap: 2,
    },
  });
