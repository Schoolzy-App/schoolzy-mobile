// import LottieView from 'lottie-react-native';
import { memo } from "react";
import { StyleSheet } from "react-native";

export interface ErrorProps {
  message?: string;
}

const Error = memo<ErrorProps>(({ message = "error_loading_data" }) => {
  return null;
});

Error.displayName = "Error";
export default Error;

const styles = StyleSheet.create({});
