// import LottieView from 'lottie-react-native';
import { memo } from "react";
import { StyleSheet } from "react-native";

export interface EmptyProps {
  text: string;
  buttonText?: string;
  onPress?: () => void;
}

const Empty = memo<EmptyProps>(({ buttonText, onPress, text }) => {
  return null;
});

Empty.displayName = "Empty";
export default Empty;

const styles = StyleSheet.create({});
