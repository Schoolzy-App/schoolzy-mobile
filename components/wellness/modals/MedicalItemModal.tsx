import React, { FC } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import type { ColorPalette } from "@/apps";
import { Button, Text } from "@/components/ui";
import ModalSheet from "@/components/ui/Modal";
import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";

interface MedicalItemModalProps {
  isVisible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  isSaveDisabled?: boolean;
  children: React.ReactNode;
}

const MedicalItemModal: FC<MedicalItemModalProps> = ({
  isVisible,
  title,
  onClose,
  onSave,
  isSaveDisabled = false,
  children,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <ModalSheet isVisible={isVisible} closeModal={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Text variant="h5" weight="semiBold" color={colors.textPrimary}>
            {title}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        <View style={styles.footer}>
          <Button text="Save" onPress={onSave} disabled={isSaveDisabled} />
        </View>
      </KeyboardAvoidingView>
    </ModalSheet>
  );
};

MedicalItemModal.displayName = "MedicalItemModal";
export default MedicalItemModal;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    flex: {
      width: "100%",
      maxHeight: "95%",
    },
    header: {
      width: "100%",
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    scroll: {
      width: "100%",
    },
    scrollContent: {
      gap: 16,
      paddingVertical: 16,
    },
    footer: {
      width: "100%",
      paddingTop: 12,
    },
  });
