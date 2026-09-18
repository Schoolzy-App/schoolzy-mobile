import React, { memo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { useStyles } from "@/hooks";
import { ApiError } from "@/types/api";

import Text from "./Text";

interface QueryStateProps {
  isLoading: boolean;
  error?: unknown;
  /** Rendered when the request succeeded but returned nothing. */
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.isNetworkError
      ? "No connection. Check your network and try again."
      : error.message;
  }
  return "Something went wrong. Please try again.";
}

/**
 * Renders loading / error / empty branches around content so screens stay
 * declarative. Memoized because it sits above list content that would
 * otherwise re-render whenever the parent screen re-renders.
 */
const QueryState = memo<QueryStateProps>(
  ({ isLoading, error, isEmpty, emptyMessage, onRetry, children }) => {
    const { colors } = useTheme();
    const styles = useStyles(createStyles);

    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text
            variant="label3"
            weight="regular"
            color={colors.textSecondary}
            style={styles.message}
          >
            {errorMessage(error)}
          </Text>
          {onRetry ? (
            <Pressable onPress={onRetry} hitSlop={8} style={styles.retry}>
              <Text variant="label3" weight="semiBold" color={colors.primary}>
                Try again
              </Text>
            </Pressable>
          ) : null}
        </View>
      );
    }

    if (isEmpty) {
      return (
        <View style={styles.center}>
          <Text variant="label3" weight="regular" color={colors.textSecondary}>
            {emptyMessage ?? "Nothing to show yet"}
          </Text>
        </View>
      );
    }

    return <>{children}</>;
  },
);

QueryState.displayName = "QueryState";
export default QueryState;

const createStyles = () =>
  StyleSheet.create({
    center: {
      width: "100%",
      paddingVertical: 32,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    message: {
      textAlign: "center",
      paddingHorizontal: 24,
    },
    retry: {
      paddingVertical: 4,
      paddingHorizontal: 12,
    },
  });
