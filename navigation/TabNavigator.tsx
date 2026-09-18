import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import React from "react";
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ColorPalette } from "@/apps";
import { Text } from "@/components/ui";
import { bottomTabIcons, FeatureFlags } from "@/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

import AddScreen from "@/screens/main/AddScreen";
import ChattingScreen from "@/screens/main/ChattingScreen";
import HomeScreen from "@/screens/main/HomeScreen";
import RequestScreen from "@/screens/main/RequestScreen";
import AccountScreen from "../screens/main/AccountScreen";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "./types";

// ─── Tab config ──────────────────────────────────────────────────────────────
/** Root routes that take no params — the only ones a tab may push. */
type ParamlessRootRoute = {
  [K in keyof RootStackParamList]: RootStackParamList[K] extends undefined
    ? K
    : never;
}[keyof RootStackParamList];

type TabEntry = {
  name: keyof MainTabParamList;
  label: string;
  /**
   * Root screen to push instead of switching tabs. Tabs with this set are never
   * highlighted, since the app navigates away from the tab stack.
   */
  pushesRoute?: ParamlessRootRoute;
};

/**
 * Bottom-bar entries, filtered by feature flag. `Home` and `Account` are always
 * present; Chat and Requests are opt-in — see `constants/featureFlags.ts`.
 */
const TABS: TabEntry[] = [
  { name: "Home", label: "Home" },
  ...(FeatureFlags.chatTab
    ? [
        {
          name: "Chatting" as const,
          label: "Chat",
          pushesRoute: "ChatWithSchool" as const,
        },
      ]
    : []),
  ...(FeatureFlags.requestsTab
    ? [
        {
          name: "Requests" as const,
          label: "Requests",
          pushesRoute: "Request" as const,
        },
      ]
    : []),
  { name: "Account", label: "Account" },
];

type TabButtonProps = {
  children: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

function TabButton({ children, isActive, onPress, style }: TabButtonProps) {
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
    <Animated.View
      style={[style, { transform: [{ scale }], overflow: "hidden" }]}
    >
      <Pressable onPress={onPress}>{children}</Pressable>
    </Animated.View>
  );
}

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const AddIcon = bottomTabIcons.Add.active;

  return (
    <View
      style={[styles.barOuter, { paddingBottom: (insets.bottom || 0) + 12 }]}
    >
      <View style={styles.bar}>
        <View style={styles.barTabs}>
          {/* Regular tabs */}
          {state.routes
            .filter((r) => r.name !== "Add")
            .map((route) => {
              const tabIndex = state.routes.indexOf(route);
              const config = TABS.find((t) => t.name === route.name);
              // Routes filtered out by a feature flag render nothing.
              if (!config) return null;

              // Tabs that push a root screen never own the selection state.
              const isActive = config.pushesRoute
                ? false
                : state.index === tabIndex;

              const icons =
                bottomTabIcons[route.name as keyof typeof bottomTabIcons];
              const Icon = isActive ? icons.active : icons.inactive;

              const onPress = () => {
                if (config.pushesRoute) {
                  rootNavigation.navigate(config.pushesRoute);
                  return;
                }

                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isActive && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <TabButton
                  key={route.key}
                  isActive={isActive}
                  onPress={onPress}
                  style={[styles.tab, isActive && styles.tabActive]}
                >
                  <View style={styles.tabInner}>
                    {/* The bundled bar assets bake in their own white/grey and
                        ignore `color`; the shared icon components (e.g. the
                        Requests icon) default to the primary colour, so the
                        active/inactive shade is passed explicitly to keep every
                        tab consistent. */}
                    <Icon
                      width={24}
                      height={24}
                      color={
                        isActive
                          ? colors.textPrimaryInverted
                          : colors.textSecondaryInverted
                      }
                    />
                    {isActive && (
                      <Text
                        variant="label2"
                        weight="medium"
                        color={colors.textPrimaryInverted}
                      >
                        {config.label}
                      </Text>
                    )}
                  </View>
                </TabButton>
              );
            })}
        </View>
        {/* Add button */}
        {/* <Pressable
          onPress={() => navigation.navigate("Add")}
          style={styles.addButton}
        >
          <AddIcon width={33} height={33} />
        </Pressable> */}
      </View>
    </View>
  );
}

// ─── Navigator ───────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      {FeatureFlags.chatTab ? (
        <Tab.Screen name="Chatting" component={ChattingScreen} />
      ) : null}
      {FeatureFlags.requestsTab ? (
        // Registered so the bar has a route to render; pressing it pushes the
        // root Request screen, so this component is never actually shown.
        <Tab.Screen name="Requests" component={RequestScreen} />
      ) : null}
      <Tab.Screen name="Account" component={AccountScreen} />
      <Tab.Screen name="Add" component={AddScreen} />
    </Tab.Navigator>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    barOuter: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      paddingTop: 8,
    },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: 60,
    },
    barTabs: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.backgroundInverted,
      borderRadius: 40,
      padding: 8,
      gap: 12,
    },
    tab: {
      borderRadius: 30,
    },
    tabActive: {
      backgroundColor: colors.secondary,
    },
    tabInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 6,
    },
    addButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.backgroundInverted,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
    },
  });
