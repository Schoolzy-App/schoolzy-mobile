import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "@/contexts/ThemeContext";
import { Text } from "@/components/ui";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  /** 0–100 */
  percentage: number;
  /** Outer size in px */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color of the progress arc */
  color?: string;
  /** Label below the circle */
  label: string;
  /** Animation duration in ms */
  duration?: number;
}

const CircularProgress = memo<CircularProgressProps>(
  ({
    percentage,
    size = 64,
    strokeWidth = 5,
    color,
    label,
    duration = 1000,
  }) => {
    const { colors } = useTheme();
    const progressColor = color ?? colors.primary;

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, [percentage, duration, animatedValue]);

    const strokeDashoffset = animatedValue.interpolate({
      inputRange: [0, 100],
      outputRange: [circumference, 0],
      extrapolate: "clamp",
    });

    // For the text counter animation
    const displayValue = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      displayValue.setValue(0);
      Animated.timing(displayValue, {
        toValue: percentage,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, [percentage, duration, displayValue]);

    const [displayText, setDisplayText] = React.useState("0");
    useEffect(() => {
      const listener = displayValue.addListener(({ value }) => {
        setDisplayText(Math.round(value).toString());
      });
      return () => displayValue.removeListener(listener);
    }, [displayValue]);

    return (
      <View style={styles.wrapper}>
        <View style={[styles.circleContainer, { width: size, height: size }]}>
          <Svg width={size} height={size}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.border}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Animated progress circle */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={progressColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          {/* Percentage text inside */}
          <View style={styles.textOverlay}>
            <Text variant="label2" weight="bold">
              {displayText}
              <Text variant="caption1" weight="bold">
                %
              </Text>
            </Text>
          </View>
        </View>
        <Text variant="label3" weight="medium" color={colors.textSecondary}>
          {label}
        </Text>
      </View>
    );
  },
);

CircularProgress.displayName = "CircularProgress";
export default CircularProgress;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 8,
  },
  circleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  textOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
