import type React from "react";
import type { SvgProps } from "react-native-svg";

export type ChildAvatarIcon = React.FC<SvgProps>;

export interface ChildData {
  id: string;
  name: string;
  year: string;
  gender: "male" | "female";
  activeBus: boolean;
  allergies: string;
  bloodType: string;
  attendance: string;
  avatarIcon: ChildAvatarIcon;
  onPress?: () => void;
  itemWidth?: number;
}
