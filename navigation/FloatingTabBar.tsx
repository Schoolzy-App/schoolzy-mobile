import { CommonActions, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ChatCircleTextIcon,
  ClipboardTextIcon,
  GearSixIcon,
  DoorIcon,
  HouseIcon,
  type Icon,
  type IconWeight,
} from "phosphor-react-native";
import React from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui";
import { FeatureFlags } from "@/constants";
import { IconSize, Palette, Radius, Shadow, Size, Spacing } from "@/constants/tokens";

import type { MainTabParamList, RootStackParamList } from "./types";

/**
 * The floating bottom bar (Parent Dashboard spec §9), as a plain view.
 *
 * It lives outside `TabNavigator` so stack screens that sit "under" a tab —
 * Student Profile under Home — can show the same bar. Importing it from the
 * navigator would pull every tab screen in and make an import cycle.
 */

/** Root routes that take no params — the only ones a tab may push. */
type ParamlessRootRoute = {
  [K in keyof RootStackParamList]: RootStackParamList[K] extends undefined
    ? K
    : never;
}[keyof RootStackParamList];

export type TabName = Exclude<keyof MainTabParamList, "Add">;

type TabEntry = {
  name: TabName;
  label: string;
  Icon: Icon;
  /** Inactive weight; the active pill always uses fill. */
  weight: IconWeight;
  /**
   * Root screen to push instead of switching tabs. Tabs with this set are never
   * highlighted, since the app navigates away from the tab stack.
   */
  pushesRoute?: ParamlessRootRoute;
};

/**
 * Bottom-bar entries, filtered by feature flag. `Home` and `Account` are always
 * present; Chat, Requests and Gate are opt-in — see `constants/featureFlags.ts`.
 */
export const TABS: TabEntry[] = [
  { name: "Home", label: "Home", Icon: HouseIcon, weight: "fill" },
  ...(FeatureFlags.chatTab
    ? [
        {
          name: "Chatting" as const,
          label: "Chat",
          Icon: ChatCircleTextIcon,
          weight: "fill" as const,
          pushesRoute: "ChatWithSchool" as const,
        },
      ]
    : []),
  ...(FeatureFlags.requestsTab
    ? [
        {
          name: "Requests" as const,
          label: "Requests",
          Icon: ClipboardTextIcon,
          weight: "fill" as const,
          pushesRoute: "Request" as const,
        },
      ]
    : []),
  ...(FeatureFlags.gateRequestsTab
    ? [
        {
          name: "GateRequests" as const,
          label: "Gate",
          Icon: DoorIcon,
          weight: "fill" as const,
          pushesRoute: "GateRequests" as const,
        },
      ]
    : []),
  { name: "Account", label: "Account", Icon: GearSixIcon, weight: "regular" },
];

export interface FloatingTabBarProps {
  /** The highlighted tab. */
  active: TabName;
  /** Called for tabs that switch rather than push. */
  onSelect: (name: TabName) => void;
}

export function FloatingTabBar({ active, onSelect }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outer,
        { bottom: Spacing.bottomInset.navFromBottom + (insets.bottom || 0) },
      ]}
    >
      <View style={[styles.bar, Shadow.bottomNav]}>
        {TABS.map((tab) => {
          const isActive = !tab.pushesRoute && tab.name === active;
          const onPress = () => {
            if (tab.pushesRoute) {
              rootNavigation.navigate(tab.pushesRoute);
              return;
            }
            onSelect(tab.name);
          };

          return (
            <TabButton key={tab.name} isActive={isActive} onPress={onPress}>
              {isActive ? (
                <View style={styles.activePill}>
                  <tab.Icon
                    weight="fill"
                    size={IconSize.navActive}
                    color={Palette.text.onBrand}
                  />
                  <Text style={styles.activeLabel} color={Palette.text.onBrand}>
                    {tab.label}
                  </Text>
                </View>
              ) : (
                <View style={styles.inactive}>
                  <tab.Icon
                    weight={tab.weight}
                    size={IconSize.nav}
                    color={Palette.text.onBrand}
                  />
                </View>
              )}
            </TabButton>
          );
        })}
      </View>
    </View>
  );
}

/**
 * The bar for a root stack screen. Home goes back to the tabs; other tabs
 * open on the tab navigator, which the stack already holds.
 */
export function StackTabBar({ active = "Home" }: { active?: TabName }) {
  const navigation = useNavigation();
  return (
    <FloatingTabBar
      active={active}
      onSelect={(name) =>
        // `Main` is typed without params, so the nested-screen target goes
        // through a plain action rather than the typed navigate().
        navigation.dispatch(
          CommonActions.navigate({ name: "Main", params: { screen: name } }),
        )
      }
    />
  );
}

function TabButton({
  children,
  isActive,
  onPress,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
}) {
  const [scale] = React.useState(() => new Animated.Value(isActive ? 1 : 0.96));

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: isActive ? 1 : 0.96,
      useNativeDriver: true,
      friction: 7,
      tension: 90,
    }).start();
  }, [isActive, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} hitSlop={6}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    padding: 7,
    borderRadius: Radius.bottomNav,
    backgroundColor: Palette.surface.bottomNav,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: Size.navItem.height,
    paddingHorizontal: Size.navItem.paddingX,
    borderRadius: Radius.navItem,
    backgroundColor: Palette.nav.active,
  },
  activeLabel: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 18,
  },
  inactive: {
    height: Size.navItem.height,
    justifyContent: "center",
    paddingRight: 16,
  },
});
