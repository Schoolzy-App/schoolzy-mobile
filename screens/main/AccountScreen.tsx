import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowUUpLeftIcon,
  BellSimpleIcon,
  CaretRightIcon,
  ChatCircleTextIcon,
  ClipboardTextIcon,
  DoorOpenIcon,
  FingerprintIcon,
  IdentificationCardIcon,
  LockSimpleIcon,
  PlusIcon,
  SignOutIcon,
  UserMinusIcon,
  UsersThreeIcon,
} from "phosphor-react-native";
import React, { useCallback } from "react";
import { Alert, Pressable, StyleSheet, Switch, View } from "react-native";

import type { ColorPalette } from "@/apps";
import { ScreenTemplate, Text } from "@/components/ui";
import { Palette, Radius, Spacing, Type } from "@/constants/tokens";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useBiometricSetting,
  useComplaints,
  useCurrentUser,
  useDocumentRequests,
  useGateEligibility,
  useGuardianStudentsRaw,
  useParentInfo,
  useRelatives,
  useStudents,
  useStyles,
} from "@/hooks";
import type { RootStackParamList } from "@/navigation/types";

/** Avatar colours, in order, for people without one of their own. */
const PEOPLE = ["#4E7FD0", "#B0627E", "#5BA3A0", "#C07A12"];
const RELATIVE_COLORS = ["#5BA3A0", "#C07A12"];

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/**
 * The parent's Account (Settings) hub — Account-Handoff/01-SPEC.md.
 *
 * Built from endpoints that exist today; the handoff's single
 * `account-summary` call doesn't. "Changed {time}" under Change password and
 * "reply waiting" on complaints have no source and are left out. The
 * notifications switch shows on and read-only, and Delete account signs out,
 * until their endpoints exist (docs/api-notes.md).
 */
export default function AccountScreen() {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const { logout } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const biometric = useBiometricSetting();

  // Enrollment can change while Account is in the stack behind another screen
  // (a password change clears it), so re-read it whenever Account is shown.
  const { refresh: refreshBiometric } = biometric;
  useFocusEffect(
    useCallback(() => {
      void refreshBiometric();
    }, [refreshBiometric]),
  );

  const { data: currentUser } = useCurrentUser();
  const { data: info } = useParentInfo();
  const { data: students } = useStudents();
  const { data: guardians } = useGuardianStudentsRaw();
  const { data: relatives } = useRelatives();
  const { data: complaints } = useComplaints();
  const { data: requests } = useDocumentRequests();
  const { data: gateEligibility } = useGateEligibility();

  // ── Header ────────────────────────────────────────────────────────────
  const name = info?.name || currentUser?.name || "";
  const role = info?.role || currentUser?.roleLabel || "";
  const phone = info?.mobile || info?.phone || "";

  // ── My Information: the parent, and the other parent when on record ──
  // The guardians list names each child's father and mother; the one who
  // isn't this account is the spouse.
  const family = guardians?.[0];
  const isFather = /father/i.test(role);
  const spouseRecord = isFather ? family?.mother : family?.father;
  const spouse =
    spouseRecord?.name && spouseRecord.name.trim() !== name.trim()
      ? { name: spouseRecord.name, role: isFather ? "Mother" : "Father" }
      : null;

  // ── Tiles ─────────────────────────────────────────────────────────────
  const relativeList = relatives ?? [];
  const pickupCount = relativeList.filter((r) => r.canPickUp).length;
  const openComplaints = complaints?.summary
    ? complaints.summary.pending + complaints.summary.inProgress
    : 0;
  const pendingRequests = requests?.pending.length ?? 0;

  const goHome = useCallback(
    () => navigation.navigate("Main", { screen: "Home" } as never),
    [navigation],
  );

  const confirmLogout = useCallback(() => {
    Alert.alert("Log out?", "You'll need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
  }, [logout]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      "Delete account?",
      "This permanently removes your account and access for all children.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => logout() },
      ],
    );
  }, [logout]);

  return (
    <ScreenTemplate
      scrollHeader
      headerStyle={styles.header}
      headerContent={
        <View style={styles.headerInner}>
          <View style={styles.profileRow}>
            <Pressable onPress={goHome} hitSlop={8} style={styles.backButton}>
              <ArrowUUpLeftIcon weight="bold" size={18} color={Palette.text.primary} />
            </Pressable>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerInitials} color={colors.primary}>
                {initialsOf(name)}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={Type.cardTitle} color={Palette.text.onBrand} numberOfLines={1}>
                {name}
              </Text>
              {role || phone ? (
                <Text style={[Type.caption, styles.dim]} color={Palette.text.onBrand} numberOfLines={1}>
                  {[role, phone].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
            </View>
          </View>

          {students?.length ? (
            <View style={styles.chips}>
              {students.map((child, index) => (
                <View key={child.id} style={styles.chip}>
                  <View style={[styles.chipAvatar, { backgroundColor: PEOPLE[index % PEOPLE.length] }]}>
                    <Text style={styles.chipInitial} color={Palette.text.onBrand}>
                      {child.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={Type.caption} color={Palette.text.onBrand} numberOfLines={1}>
                    {firstNameOf(child.name)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      }
    >
      <View style={styles.grid}>
        {/* ── My Information ────────────────────────────────────────── */}
        <Tile
          style={styles.info}
          onPress={() => navigation.navigate("EditParentInfo")}
        >
          <View style={styles.rowBetween}>
            <View style={styles.kicker}>
              <IdentificationCardIcon weight="fill" size={18} color={Palette.action.primary} />
              <Text style={Type.chipSmall} color={Palette.action.primary}>
                My Information
              </Text>
            </View>
            <CaretRightIcon weight="bold" size={14} color={Palette.text.chevron} />
          </View>
          <View style={styles.people}>
            <Person name={name} role={role ? `${role} · You` : "You"} color={PEOPLE[0]} />
            {spouse ? <Person name={spouse.name} role={spouse.role} color={PEOPLE[1]} /> : null}
          </View>
        </Tile>

        <View style={styles.row}>
          {/* ── Relatives (two rows tall) ───────────────────────────── */}
          <Tile
            style={[styles.half, styles.relatives]}
            onPress={() => navigation.navigate("Relatives")}
          >
            <View style={[styles.iconTile, { backgroundColor: "#5BA3A01F" }]}>
              <UsersThreeIcon weight="fill" size={22} color="#3F8784" />
            </View>
            <View style={styles.relativesBottom}>
              <View style={styles.stack}>
                {relativeList.slice(0, 2).map((relative, index) => (
                  <View
                    key={relative.id}
                    style={[
                      styles.stackAvatar,
                      index > 0 && styles.stackOverlap,
                      { backgroundColor: RELATIVE_COLORS[index] },
                    ]}
                  >
                    <Text style={styles.stackInitials} color={Palette.text.onBrand}>
                      {relative.initials}
                    </Text>
                  </View>
                ))}
                <View style={[styles.stackAvatar, styles.stackAdd, relativeList.length > 0 && styles.stackOverlap]}>
                  <PlusIcon weight="bold" size={16} color={Palette.text.secondary} />
                </View>
              </View>
              <View style={styles.titleBlock}>
                <Text style={styles.tileTitle} numberOfLines={1}>
                  Relatives
                </Text>
                <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
                  {relativeList.length
                    ? `${pickupCount} with pickup access`
                    : "Add a relative"}
                </Text>
              </View>
            </View>
          </Tile>

          <View style={[styles.half, styles.column]}>
            {/* ── My Complaints ─────────────────────────────────────── */}
            <Tile
              style={[styles.small, { backgroundColor: colors.primary }]}
              pressedOpacity={0.85}
              onPress={() => navigation.navigate("Complaints")}
            >
              <View style={styles.rowBetween}>
                <ChatCircleTextIcon weight="fill" size={22} color={Palette.text.onBrand} />
                {openComplaints > 0 ? (
                  <Text style={styles.count} color={Palette.text.onBrand}>
                    {openComplaints}
                  </Text>
                ) : null}
              </View>
              <View style={styles.titleBlock}>
                <Text style={styles.tileTitle} color={Palette.text.onBrand} numberOfLines={1}>
                  My Complaints
                </Text>
                <Text style={[Type.caption, styles.dim]} color={Palette.text.onBrand} numberOfLines={1}>
                  {openComplaints > 0 ? "Open" : "No open complaints"}
                </Text>
              </View>
            </Tile>

            {/* ── Notifications ─────────────────────────────────────
                Read-only for now: there is no settings endpoint to store a
                choice (docs/api-notes.md), so it shows on and can't be
                switched off until there is. */}
            <View style={[styles.tile, styles.small]}>
              <View style={styles.rowBetween}>
                <BellSimpleIcon weight="fill" size={22} color="#C07A12" />
                <View style={styles.switchTrack}>
                  <View style={styles.switchKnob} />
                </View>
              </View>
              <View style={styles.titleBlock}>
                <Text style={styles.tileTitle} numberOfLines={1}>
                  Notifications
                </Text>
                <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
                  On · all children
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Gate Requests ─────────────────────────────────────────
            Only for parents the server says may use it (mandate for at
            least one active student); hidden while loading or on error. */}
        {gateEligibility?.canUse ? (
          <Tile
            style={styles.gate}
            onPress={() => navigation.navigate("GateRequests")}
          >
            <View style={[styles.iconTile, { backgroundColor: Palette.status.warning.tint }]}>
              <DoorOpenIcon weight="fill" size={22} color={Palette.status.warning.fg} />
            </View>
            <View style={[styles.flex, styles.titleBlock]}>
              <Text style={styles.tileTitle} numberOfLines={1}>
                Gate Requests
              </Text>
              <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
                Early pickup & who collects
              </Text>
            </View>
            <CaretRightIcon weight="bold" size={14} color={Palette.text.chevron} />
          </Tile>
        ) : null}

        <View style={styles.row}>
          <RequestsTile
            pending={pendingRequests}
            onPress={() => navigation.navigate("Request")}
            style={styles.half}
          />
          <ChangePasswordTile
            onPress={() => navigation.navigate("ChangePassword")}
            style={styles.half}
          />
        </View>

        <View style={styles.row}>
          {/* ── Log out ─────────────────────────────────────────── */}
          <Pressable
            onPress={confirmLogout}
            style={({ pressed }) => [
              styles.half,
              styles.logout,
              pressed && { backgroundColor: "#E06C751A" },
            ]}
          >
            <SignOutIcon weight="bold" size={20} color="#D04552" />
            <Text style={Type.cardHeading} color="#D04552" numberOfLines={1}>
              Log out
            </Text>
          </Pressable>

          {/* ── Delete account ──────────────────────────────────────
              No delete endpoint yet, so for now it signs out, as it did
              before (docs/api-notes.md). */}
          <Pressable
            onPress={confirmDelete}
            style={({ pressed }) => [
              styles.half,
              styles.logout,
              pressed && { backgroundColor: "#E06C751A" },
            ]}
          >
            <UserMinusIcon size={20} color={Palette.text.tertiary} />
            <Text style={styles.deleteText} color={Palette.text.tertiary} numberOfLines={1}>
              Delete account
            </Text>
          </Pressable>
        </View>

        {/* Biometric sign-in — an existing app setting the design doesn't
            show. Hidden when the device has no enrolled biometric. */}
        {biometric.ready && biometric.available ? (
          <View style={styles.biometric}>
            <View style={[styles.iconTile, { backgroundColor: "#6E97D61F" }]}>
              <FingerprintIcon weight="fill" size={22} color={Palette.nav.active} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.tileTitle} numberOfLines={1}>
                Sign in with {biometric.label}
              </Text>
              <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
                {biometric.enabled ? "On" : "Off"}
              </Text>
            </View>
            <Switch
              value={biometric.enabled}
              onValueChange={biometric.toggle}
              // Enrolling waits on the network and a scan; a second flip
              // mid-way would race it.
              disabled={biometric.busy}
              trackColor={{ true: "#34C759", false: "#E1E1E5" }}
              thumbColor="#FFFFFF"
            />
          </View>
        ) : null}
      </View>
    </ScreenTemplate>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function Tile({
  children,
  style,
  onPress,
  pressedOpacity = 0.8,
}: {
  children: React.ReactNode;
  style?: object | object[];
  onPress: () => void;
  pressedOpacity?: number;
}) {
  const styles = useStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, style, pressed && { opacity: pressedOpacity }]}
    >
      {children}
    </Pressable>
  );
}

function Person({ name, role, color }: { name: string; role: string; color: string }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.person}>
      <View style={[styles.personAvatar, { backgroundColor: color }]}>
        <Text style={styles.personInitials} color={Palette.text.onBrand}>
          {initialsOf(name)}
        </Text>
      </View>
      <View style={styles.flex}>
        <Text style={Type.itemTitle} numberOfLines={1}>
          {firstNameOf(name)}
        </Text>
        <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
          {role}
        </Text>
      </View>
    </View>
  );
}

function RequestsTile({
  pending,
  onPress,
  style,
}: {
  pending: number;
  onPress: () => void;
  style?: object;
}) {
  const styles = useStyles(createStyles);
  return (
    <Tile style={[styles.small, style ?? {}]} onPress={onPress}>
      <View style={styles.rowBetween}>
        <View style={[styles.iconTile, { backgroundColor: Palette.status.info.tint }]}>
          <ClipboardTextIcon weight="fill" size={22} color={Palette.nav.active} />
        </View>
        {pending > 0 ? (
          <View style={styles.pendingPill}>
            <Text style={styles.pendingText} color={Palette.status.info.fg} numberOfLines={1}>
              {pending} pending
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.tileTitle} numberOfLines={1}>
          My Requests
        </Text>
        <Text style={Type.caption} color={Palette.text.tertiary} numberOfLines={1}>
          Documents from the school
        </Text>
      </View>
    </Tile>
  );
}

/** The API has no password-changed date, so there's no "Changed …" line. */
function ChangePasswordTile({ onPress, style }: { onPress: () => void; style?: object }) {
  const styles = useStyles(createStyles);
  return (
    <Tile style={[styles.small, style ?? {}]} onPress={onPress} pressedOpacity={0.7}>
      <View style={[styles.iconTile, { backgroundColor: "#6E97D61F" }]}>
        <LockSimpleIcon weight="fill" size={22} color={Palette.nav.active} />
      </View>
      <Text style={styles.tileTitle} numberOfLines={1}>
        Change password
      </Text>
    </Tile>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    dim: {
      opacity: 0.85,
    },
    header: {
      borderBottomLeftRadius: Radius.formHeader,
      borderBottomRightRadius: Radius.formHeader,
      paddingBottom: 16,
    },
    headerInner: {
      width: "100%",
      gap: 12,
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: Spacing.screenX,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    headerAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    headerInitials: {
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 19,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingLeft: 67,
      paddingRight: Spacing.screenX,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 14,
      paddingVertical: 3,
      paddingLeft: 3,
      paddingRight: 10,
      backgroundColor: "rgba(255,255,255,0.16)",
    },
    chipAvatar: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    chipInitial: {
      fontSize: 10,
      fontWeight: "600",
      lineHeight: 12,
    },

    grid: {
      width: "100%",
      padding: Spacing.screenX,
      gap: 12,
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    half: {
      flex: 1,
    },
    column: {
      gap: 12,
    },
    tile: {
      borderRadius: Radius.financeCard,
      backgroundColor: colors.surface,
    },
    small: {
      padding: 14,
      gap: 12,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    titleBlock: {
      gap: 3,
    },
    // No colour here: <Text>'s style wins over its `color` prop, and the
    // complaints tile sets white.
    tileTitle: {
      fontSize: 15,
      fontWeight: "600",
      lineHeight: 18,
    },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: Radius.iconTile,
      alignItems: "center",
      justifyContent: "center",
    },

    info: {
      padding: 16,
      gap: 16,
    },
    kicker: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    people: {
      flexDirection: "row",
      gap: 10,
    },
    person: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    personAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },
    personInitials: {
      fontSize: 15,
      fontWeight: "600",
      lineHeight: 18,
    },

    relatives: {
      paddingVertical: 16,
      paddingHorizontal: 14,
      justifyContent: "space-between",
      gap: 16,
    },
    relativesBottom: {
      gap: 10,
    },
    stack: {
      flexDirection: "row",
    },
    stackAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    stackOverlap: {
      marginLeft: -8,
    },
    stackAdd: {
      backgroundColor: Palette.border.divider,
    },
    stackInitials: {
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 14,
    },

    count: {
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 26,
    },
    pendingPill: {
      borderRadius: Radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: Palette.status.info.tint,
    },
    pendingText: {
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 14,
    },

    deleteText: {
      fontSize: 15,
      fontWeight: "500",
      lineHeight: 18,
      flexShrink: 1,
    },
    // The design's switch, fixed in the on position.
    switchTrack: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: "#34C759",
    },
    switchKnob: {
      position: "absolute",
      top: 3,
      left: 21,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    logout: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: Radius.financeCard,
      borderWidth: 1.5,
      borderColor: Palette.border.default,
    },
    gate: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
    },
    biometric: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: Radius.financeCard,
      backgroundColor: colors.surface,
    },
  });
