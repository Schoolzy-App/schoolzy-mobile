import { MaterialIcons } from "@expo/vector-icons";
import React, { memo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import { Colors } from "@/constants";

import Card from "./Card";
import Text from "./Text";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionSectionProps {
  title: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionSection: React.FC<AccordionSectionProps> = memo(
  ({ title, iconName, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleOpen = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsOpen(!isOpen);
    };

    return (
      <Card style={styles.accordionContainer}>
        <TouchableOpacity onPress={toggleOpen} style={styles.accordionHeader}>
          <MaterialIcons name={iconName} size={22} color={Colors.primary} />
          <Text variant="h5" style={styles.headerText}>
            {title}
          </Text>
          <MaterialIcons
            name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={24}
            color={Colors.primary}
          />
        </TouchableOpacity>
        {isOpen && <View style={styles.accordionContent}>{children}</View>}
      </Card>
    );
  },
);

AccordionSection.displayName = "AccordionSection";

export default AccordionSection;

const styles = StyleSheet.create({
  accordionContainer: {
    padding: 0,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  headerText: {
    flex: 1,
    fontWeight: "800",
  },
  accordionContent: {
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
