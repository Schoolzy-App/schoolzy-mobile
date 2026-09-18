import React, { FC, memo } from "react";
import {
  ImagePropsBase,
  Pressable,
  Image as RNImage,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

type ImageProps = ImagePropsBase & {
  size?: number;
  style?: StyleProp<ViewStyle>;
  onPress?(): void;
};

const Image: FC<ImageProps> = memo(
  ({ size = 20, style, onPress, ...props }) => {
    return (
      <Pressable onPress={onPress}>
        <RNImage
          {...props}
          style={[{ width: size, height: size }, styles.image, style]}
        />
      </Pressable>
    );
  }
);

export default Image;
Image.displayName = "Image";

const styles = StyleSheet.create({
  image: {},
});
