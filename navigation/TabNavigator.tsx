import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import React from "react";

import { FeatureFlags } from "@/constants";

import AddScreen from "@/screens/main/AddScreen";
import ChattingScreen from "@/screens/main/ChattingScreen";
import HomeScreen from "@/screens/main/HomeScreen";
import RequestScreen from "@/screens/main/RequestScreen";
import AccountScreen from "../screens/main/AccountScreen";

import { FloatingTabBar, type TabName } from "./FloatingTabBar";
import type { MainTabParamList } from "./types";

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const current = state.routes[state.index];

  return (
    <FloatingTabBar
      active={current.name as TabName}
      onSelect={(name) => {
        const route = state.routes.find((r) => r.name === name);
        if (!route) return;

        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (current.name !== name && !event.defaultPrevented) {
          navigation.navigate(name);
        }
      }}
    />
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
      {FeatureFlags.gateRequestsTab ? (
        // Placeholder like Requests: pressing it pushes the root GateRequests
        // screen, so this component is never actually shown.
        <Tab.Screen name="GateRequests" component={RequestScreen} />
      ) : null}
      <Tab.Screen name="Account" component={AccountScreen} />
      <Tab.Screen name="Add" component={AddScreen} />
    </Tab.Navigator>
  );
}
