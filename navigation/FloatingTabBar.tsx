import { CommonActions, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ChatCircleTextIcon,
  ClipboardTextIcon,
  GearSixIcon,
  DoorIcon,
  DotsThreeOutlineIcon,
  HouseIcon,
  NewspaperIcon,
  UsersThreeIcon,
  type Icon,
  type IconWeight,
} from "phosphor-react-native";
import React, { useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui";
import { FeatureFlags } from "@/constants";
import { IconSize, Palette, Radius, Shadow, Size, Spacing } from "@/constants/tokens";
import { useGateEligibility } from "@/hooks/queries/useGateRequests";

import type { MainTabParamList, RootStackParamList } from "./types";

/**
 * The floating bottom bar (Parent Dashboard spec §9), as a plain view.
 *
 * It lives outside `TabNavigator` so stack screens that sit "under" a tab —
 * Student Profile under Home — can show the same bar. Importing it from the
 * navigator would pull every tab screen in and make an import cycle.
 */

/** Root routes whose params are optional — the only ones a tab may push. */
type ParamlessRootRoute = {
  [K in keyof RootStackParamList]: undefined extends RootStackParamList[K]
    ? K
    : never;
}[keyof RootStackParamList];

export type TabName = Exclude<keyof MainTabParamList, "Add">;

type TabEntry = {
  /** A tab route, or a key for entries that only push a root screen. */
  name: TabName | "Newsletters" | "Relatives" | "Complaints";
  label: string;
  Icon: Icon;
  /** Inactive weight; the active pill always uses fill. */
  weight: IconWeight;
  /**
   * Root screen to push instead of switching tabs. Tabs with this set are never
   * highlighted, since the app navigates away from the tab stack.
   */
  pushesRoute?: ParamlessRootRoute;
  /** Listed under the bar's "More" button instead of on the bar itself. */
  more?: boolean;
};

/**
 * Bottom-bar entries, filtered by feature flag. `Home` and `Account` are always
 * present; Chat, Requests and Gate are opt-in — see `constants/featureFlags.ts`.
 */
export const TABS: TabEntry[] = [
  { name: "Home", label: "Home", Icon: HouseIcon, weight: "fill" },
  {
    name: "Newsletters",
    label: "Newsletters",
    Icon: NewspaperIcon,
    weight: "fill",
    pushesRoute: "Newsletter",
  },
  ...(FeatureFlags.chatTab
    ? [
        {
          name: "Chatting" as const,
          label: "Chat",
          Icon: ChatCircleTextIcon,
          weight: "fill" as const,
          pushesRoute: "ChatWithSchool" as const,
          more: true,
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
          more: true,
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
          more: true,
        },
      ]
    : []),
  {
    name: "Relatives",
    label: "Relatives",
    Icon: UsersThreeIcon,
    weight: "fill",
    pushesRoute: "Relatives",
    more: true,
  },
  {
    name: "Complaints",
    label: "Complaints",
    Icon: ChatCircleTextIcon,
    weight: "fill",
    pushesRoute: "Complaints",
    more: true,
  },
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

  // The flag only offers the Gate tab: parents /eligibility rejects never see
  // it. No request at all while the flag is off.
  const { data: gateEligibility } = useGateEligibility({
    enabled: FeatureFlags.gateRequestsTab,
  });
  const tabs = gateEligibility?.canUse
    ? TABS
    : TABS.filter((tab) => tab.name !== "GateRequests");
  // Home, Newsletters and Account stay on the bar; the rest sit under "More".
  const barTabs = tabs.filter((tab) => !tab.more);
  const moreTabs = tabs.filter((tab) => tab.more);
  const [moreOpen, setMoreOpen] = useState(false);
  const bottom = Spacing.bottomInset.navFromBottom + (insets.bottom || 0);

  const openTab = (tab: TabEntry) => {
    setMoreOpen(false);
    if (tab.pushesRoute) {
      rootNavigation.navigate(tab.pushesRoute);
      return;
    }
    onSelect(tab.name as TabName);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outer,
        { bottom },
      ]}
    >
      <View style={[styles.bar, Shadow.bottomNav]}>
        {barTabs.map((tab) => {
          const isActive = !tab.pushesRoute && tab.name === active;
          const onPress = () => openTab(tab);

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
        {moreTabs.length ? (
          <TabButton isActive={false} onPress={() => setMoreOpen(true)}>
            <View
              style={styles.inactive}
              accessible
              accessibilityRole="button"
              accessibilityLabel="More"
            >
              <DotsThreeOutlineIcon
                weight="fill"
                size={IconSize.nav}
                color={Palette.text.onBrand}
              />
            </View>
          </TabButton>
        ) : null}
      </View>

      <Modal
        visible={moreOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMoreOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMoreOpen(false)}>
          <View
            style={[
              styles.moreMenu,
              Shadow.bottomNav,
              { bottom: bottom + Size.navItem.height + 26 },
            ]}
          >
            {moreTabs.map((tab, index) => (
              <Pressable
                key={tab.name}
                onPress={() => openTab(tab)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.moreItem,
                  index > 0 && styles.moreDivider,
                  pressed && styles.morePressed,
                ]}
              >
                <tab.Icon weight="fill" size={IconSize.nav} color={Palette.text.onBrand} />
                <Text style={styles.moreLabel} color={Palette.text.onBrand}>
                  {tab.label === "Gate" ? "Gate Requests" : tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  backdrop: {
    flex: 1,
  },
  moreMenu: {
    position: "absolute",
    right: Spacing.screenX,
    minWidth: 200,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Palette.surface.bottomNav,
  },
  moreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  moreDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  morePressed: {
    opacity: 0.6,
  },
  moreLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
});
