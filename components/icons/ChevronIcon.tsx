import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import type { SvgProps } from "react-native-svg";
import Svg, { Path } from "react-native-svg";

type Props = SvgProps & { color?: string };

const ChevronIcon = ({ color, width = 20, height = 20, ...props }: Props) => {
  const { colors } = useTheme();
  const fillColor = color ?? colors.secondary;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M12.1057 15L10.9324 13.8215L13.9069 10.8338L2.91677 10.8339V9.16721L13.9073 9.16716L10.9323 6.17852L12.1056 5L17.0834 10.0003L12.1057 15Z"
        fill={fillColor}
      />
    </Svg>
  );
};

export default ChevronIcon;
