import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import type { SvgProps } from "react-native-svg";
import Svg, { Path } from "react-native-svg";

type Props = SvgProps & { color?: string };

const LockActiveIcon = ({ color, width = 20, height = 20, ...props }: Props) => {
  const { colors } = useTheme();
  const fillColor = color ?? colors.secondary;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M9.99994 14.4584C10.7501 14.4584 11.3583 13.8502 11.3583 13.1C11.3583 12.3498 10.7501 11.7417 9.99994 11.7417C9.24975 11.7417 8.6416 12.3498 8.6416 13.1C8.6416 13.8502 9.24975 14.4584 9.99994 14.4584Z"
        fill={fillColor}
      />
      <Path
        opacity={0.4}
        d="M13.8751 7.8667H6.12508C2.70841 7.8667 1.66675 8.90837 1.66675 12.325V13.875C1.66675 17.2917 2.70841 18.3334 6.12508 18.3334H13.8751C17.2917 18.3334 18.3334 17.2917 18.3334 13.875V12.325C18.3334 8.90837 17.2917 7.8667 13.8751 7.8667ZM10.0001 15.6167C8.60841 15.6167 7.48341 14.4834 7.48341 13.1C7.48341 11.7167 8.60841 10.5834 10.0001 10.5834C11.3917 10.5834 12.5167 11.7167 12.5167 13.1C12.5167 14.4834 11.3917 15.6167 10.0001 15.6167Z"
        fill={fillColor}
      />
      <Path
        d="M5.93327 7.87508V6.90008C5.93327 4.45841 6.62494 2.83341 9.99994 2.83341C13.3749 2.83341 14.0666 4.45841 14.0666 6.90008V7.87508C14.4916 7.88341 14.8749 7.90008 15.2333 7.95008V6.90008C15.2333 4.65008 14.6916 1.66675 9.99994 1.66675C5.30827 1.66675 4.7666 4.65008 4.7666 6.90008V7.94175C5.1166 7.90008 5.50827 7.87508 5.93327 7.87508Z"
        fill={fillColor}
      />
    </Svg>
  );
};

export default LockActiveIcon;
