import {
  CheckCircleIcon,
  CircleIcon,
  type Icon,
  InfoIcon,
  LockSimpleIcon,
  WarningCircleIcon,
} from "phosphor-react-native";
import React from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { Text } from "@/components/ui";
import { Opacity, Palette, Radius, Size, Spacing, Type } from "@/constants/tokens";

/**
 * The form screens' building blocks (Complaints spec §3, shared with Update
 * Information and Relative Setting): label row → control → error, inputs,
 * option tiles, step progress and the notes/banners around them.
 */

// ─── Field ───────────────────────────────────────────────────────────────────

export interface FieldProps {
  label: string;
  /** Right of the label: "Optional", or a counter like "12/250". */
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={Type.fieldLabel}>{label}</Text>
        {hint ? (
          <Text style={Type.fieldHint} color={Palette.text.tertiary}>
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
      {error ? <FieldError message={error} /> : null}
    </View>
  );
}

export function FieldError({ message }: { message: string }) {
  return (
    <View style={styles.error}>
      <WarningCircleIcon weight="fill" size={14} color={Palette.form.inputError} />
      <Text style={Type.fieldError} color={Palette.form.inputError}>
        {message}
      </Text>
    </View>
  );
}

// ─── Text input ──────────────────────────────────────────────────────────────

export interface TextFieldProps extends TextInputProps {
  invalid?: boolean;
  /** Textarea: grows from 150 high, text from the top. */
  multilineArea?: boolean;
}

export function TextField({ invalid, multilineArea, style, ...props }: TextFieldProps) {
  return (
    <TextInput
      placeholderTextColor={Palette.text.tertiary}
      multiline={multilineArea}
      textAlignVertical={multilineArea ? "top" : "center"}
      {...props}
      style={[
        styles.input,
        multilineArea && styles.textarea,
        invalid && { borderColor: Palette.form.inputError },
        style,
      ]}
    />
  );
}

// ─── Option tile ─────────────────────────────────────────────────────────────

export interface OptionTileProps {
  label: string;
  Icon?: Icon;
  /** Icon weight; categories are regular, priority flags fill. */
  iconWeight?: "regular" | "fill";
  /** Icon colour when not selected. */
  iconColor?: string;
  selected: boolean;
  onPress: () => void;
  /** Selected border / icon colour; defaults to action blue. */
  accent?: string;
  invalid?: boolean;
  height?: number;
  /** Centre the content, as the contact-method tiles do. */
  centered?: boolean;
  labelStyle?: "medium" | "semibold";
}

export function OptionTile({
  label,
  Icon,
  iconWeight = "regular",
  iconColor = Palette.text.secondary,
  selected,
  onPress,
  accent = Palette.action.primary,
  invalid,
  height = Size.optionTile,
  centered,
  labelStyle = "medium",
}: OptionTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        { height },
        centered && styles.centered,
        selected && { borderColor: accent, backgroundColor: `${accent}12` },
        !selected && invalid && { borderColor: Palette.form.optionErrorBorder },
      ]}
    >
      {Icon ? (
        <Icon weight={iconWeight} size={centered ? 17 : 20} color={selected ? accent : iconColor} />
      ) : null}
      <Text
        style={[
          centered ? styles.optionLabelSmall : styles.optionLabel,
          labelStyle === "semibold" && styles.semibold,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Radio card ──────────────────────────────────────────────────────────────

/** A title-and-description choice with a radio ring (one of a set). */
export function RadioCard({
  title,
  description,
  selected,
  onPress,
  invalid,
}: {
  title: string;
  description?: string | null;
  selected: boolean;
  onPress: () => void;
  invalid?: boolean;
}) {
  const accent = Palette.action.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.radioCard,
        selected && { borderColor: accent, backgroundColor: Palette.action.tint7 },
        !selected && invalid && { borderColor: Palette.form.optionErrorBorder },
      ]}
    >
      <View style={styles.flex}>
        <Text style={Type.cardHeading}>{title}</Text>
        {description ? (
          <Text style={Type.meta} color={Palette.text.secondary}>
            {description}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <CheckCircleIcon weight="fill" size={22} color={accent} />
      ) : (
        <CircleIcon size={22} color={Palette.text.chevron} />
      )}
    </Pressable>
  );
}

// ─── Child option ────────────────────────────────────────────────────────────

/** A child to file against: initial avatar, name, radio (Complaints §3). */
export function ChildOption({
  name,
  index,
  selected,
  onPress,
  invalid,
  disabled,
  hint,
}: {
  name: string;
  /** Position in the list — picks the avatar colour. */
  index: number;
  selected: boolean;
  onPress: () => void;
  invalid?: boolean;
  /** Greyed out and not selectable (e.g. already has a gate request today). */
  disabled?: boolean;
  /** A line under the name, e.g. why the row is disabled. */
  hint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityLabel={hint ? `${name}, ${hint}` : name}
      accessibilityState={{ checked: selected, selected, disabled: !!disabled }}
      style={[
        styles.child,
        selected && { borderColor: Palette.action.primary },
        !selected && invalid && { borderColor: Palette.form.optionErrorBorder },
        disabled && styles.childDisabled,
      ]}
    >
      <View
        style={[
          styles.childAvatar,
          { backgroundColor: Palette.avatar.children[index % Palette.avatar.children.length] },
        ]}
      >
        <Text style={styles.childInitial} color={Palette.text.onBrand}>
          {name.trim().charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.flex}>
        <Text style={Type.cardTitle} numberOfLines={1}>
          {name}
        </Text>
        {hint ? (
          <Text style={Type.meta} color={Palette.text.secondary}>
            {hint}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <CheckCircleIcon weight="fill" size={22} color={Palette.action.primary} />
      ) : (
        <CircleIcon size={22} color={Palette.text.chevron} />
      )}
    </Pressable>
  );
}

// ─── Step progress ───────────────────────────────────────────────────────────

export function StepProgress({
  step,
  total,
  name,
}: {
  /** 1-based */
  step: number;
  total: number;
  name: string;
}) {
  return (
    <View style={styles.steps}>
      <View style={styles.stepRow}>
        <Text style={styles.stepCount} color={Palette.action.primary}>
          Step {step} of {total}
        </Text>
        <Text style={Type.meta} color={Palette.text.secondary}>
          {name}
        </Text>
      </View>
      <View style={styles.bars}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor:
                  i < step ? Palette.action.primary : Palette.action.progressTrack,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Notes and banners ───────────────────────────────────────────────────────

/** Grey-blue note with a lock — the confidentiality line. */
export function LockNote({ text }: { text: string }) {
  return (
    <View style={styles.lockNote}>
      <LockSimpleIcon size={18} color={Palette.action.primary} />
      <Text style={[styles.noteText, styles.flex]}>{text}</Text>
    </View>
  );
}

/** The same grey-blue note with an info icon and an optional bold title. */
export function InfoNote({ title, text }: { title?: string; text: string }) {
  return (
    <View style={styles.lockNote}>
      <InfoIcon weight="fill" size={18} color={Palette.action.primary} />
      <View style={styles.flex}>
        {title ? <Text style={[styles.noteText, styles.semibold]}>{title}</Text> : null}
        <Text style={styles.noteText}>{text}</Text>
      </View>
    </View>
  );
}

/** Plain hint line with an info icon, under a field. */
export function InfoHint({ text }: { text: string }) {
  return (
    <View style={styles.infoHint}>
      <InfoIcon size={17} color={Palette.text.secondary} />
      <Text style={[styles.hintText, styles.flex]}>{text}</Text>
    </View>
  );
}

export function ErrorBanner({
  title,
  message,
  items,
  onRetry,
}: {
  title: string;
  message?: string;
  /** Bullet list — the field errors (Update Information §5). */
  items?: string[];
  /** "Retry" link, for server errors only. */
  onRetry?: () => void;
}) {
  return (
    <View style={styles.banner}>
      <WarningCircleIcon weight="fill" size={20} color={Palette.form.inputError} />
      <View style={[styles.flex, styles.bannerBody]}>
        <Text style={Type.cardHeading}>{title}</Text>
        {message ? <Text style={styles.hintText}>{message}</Text> : null}
        {items?.map((item) => (
          <Text key={item} style={styles.hintText}>
            •  {item}
          </Text>
        ))}
        {onRetry ? (
          <Pressable onPress={onRetry} hitSlop={8} style={styles.retry}>
            <Text style={styles.retryText} color={Palette.action.primary}>
              Retry
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  field: {
    gap: Spacing.form.fieldGap,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  input: {
    height: Size.input,
    borderRadius: Radius.input,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
    paddingHorizontal: 14,
    fontSize: 16,
    color: Palette.text.primary,
  },
  textarea: {
    height: undefined,
    minHeight: Size.textareaMin,
    paddingTop: 12,
    paddingBottom: 12,
    lineHeight: 23,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.option,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
  },
  centered: {
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 6,
  },
  optionLabel: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 18,
  },
  optionLabelSmall: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 17,
  },
  semibold: {
    fontWeight: "600",
  },
  radioCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: Radius.option,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
  },
  child: {
    minHeight: Size.childOption,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.option,
    borderWidth: Size.inputBorderWidth,
    borderColor: Palette.form.inputBorder,
    backgroundColor: Palette.surface.card,
  },
  childDisabled: {
    opacity: Opacity.disabled,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  childInitial: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 19,
  },
  steps: {
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepCount: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
  },
  bars: {
    flexDirection: "row",
    gap: 6,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  lockNote: {
    flexDirection: "row",
    gap: 10,
    borderRadius: Radius.input,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Palette.action.infoNote,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.text.body,
  },
  infoHint: {
    flexDirection: "row",
    gap: 8,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.text.body,
  },
  banner: {
    flexDirection: "row",
    gap: 10,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.form.errorBannerBorder,
    backgroundColor: Palette.form.errorBannerBg,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bannerBody: {
    gap: 4,
  },
  retry: {
    alignSelf: "flex-start",
    marginTop: 2,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
});
