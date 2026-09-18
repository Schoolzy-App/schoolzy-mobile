import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";
import type { RootStackParamList } from "./types";

import { useAuth } from "@/contexts/AuthContext";
import AddRequestScreen from "@/screens/main/AddRequestScreen";
import AgendaScreen from "@/screens/main/AgendaScreen";
import ChangePasswordScreen from "@/screens/main/ChangePasswordScreen";
import ConfirmDepositScreen from "@/screens/main/ConfirmDepositScreen";
import FinancesScreen from "@/screens/main/FinancesScreen";
import MealsScreen from "@/screens/main/MealsScreen";
import NewsletterScreen from "@/screens/main/NewsletterScreen";
import PaymentDetailsScreen from "@/screens/main/PaymentDetailsScreen";
import ReportsScreen from "@/screens/main/ReportsScreen";
import StudentProfileScreen from "@/screens/main/StudentProfileScreen";
import TimesheetScreen from "@/screens/main/TimesheetScreen";
import WellnessEditScreen from "@/screens/main/WellnessEditScreen";
import WellnessScreen from "@/screens/main/WellnessScreen";
import ChatWithSchoolScreen from "../screens/main/ChatWithSchoolScreen";
import NotificationScreen from "../screens/main/NotificationScreen";
import PdfScreen from "../screens/main/PdfScreen";
import RequestScreen from "../screens/main/RequestScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { authenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {authenticated ? (
        // ─── Authenticated: main app + every nested screen ─────────────────
        <Stack.Group>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="ChatWithSchool" component={ChatWithSchoolScreen} />
          <Stack.Screen name="Request" component={RequestScreen} />
          <Stack.Screen name="AddRequest" component={AddRequestScreen} />
          <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Wellness" component={WellnessScreen} />
          <Stack.Screen name="WellnessEdit" component={WellnessEditScreen} />
          <Stack.Screen name="Agenda" component={AgendaScreen} />
          <Stack.Screen name="Timesheet" component={TimesheetScreen} />
          <Stack.Screen name="Meals" component={MealsScreen} />
          <Stack.Screen name="Finances" component={FinancesScreen} />
          <Stack.Screen name="PaymentDetails" component={PaymentDetailsScreen} />
          <Stack.Screen name="ConfirmDeposit" component={ConfirmDepositScreen} />
          <Stack.Screen name="Pdf" component={PdfScreen} />
          <Stack.Screen name="Notification" component={NotificationScreen} />
          <Stack.Screen name="Newsletter" component={NewsletterScreen} />
        </Stack.Group>
      ) : (
        // ─── Unauthenticated: only the auth stack is reachable ─────────────
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
