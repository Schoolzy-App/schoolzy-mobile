import React, { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import RNModal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ColorPalette } from '@/apps';
import { useTheme } from '@/contexts/ThemeContext';
import { useStyles } from '@/hooks';

type ModalProps = {
  isVisible?: boolean;
  children: React.ReactNode;
  closeModal(): void;
};

const Modal: FC<ModalProps> = ({ isVisible, closeModal, children }) => {
  const insets = useSafeAreaInsets();
  const styles = useStyles(createStyles);
  const { colors } = useTheme();

  const panGesture = Gesture.Pan().onEnd((event) => {
    if (event.translationY > 100) {
      closeModal();
    }
  });

  return (
    <RNModal
      isVisible={isVisible}
      backdropColor={colors.backgroundInverted}
      swipeDirection={['down']}
      backdropOpacity={0.5}
      propagateSwipe
      onBackdropPress={closeModal}
      onSwipeComplete={closeModal}
      style={styles.modal}
    >
      <GestureHandlerRootView
        style={[styles.modalContainer, { paddingBottom: insets.bottom + 16 }]}
      >
        <GestureDetector gesture={panGesture}>
          <View style={styles.swipeIndicator} />
        </GestureDetector>
        {children}
      </GestureHandlerRootView>
    </RNModal>
  );
};

Modal.displayName = 'Modal';
export default Modal;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    modalContainer: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopStartRadius: 40,
      borderTopEndRadius: 40,
      backgroundColor: colors.surface,
      maxHeight: '90%',
      gap: 16,
    },
    modal: {
      margin: 0,
      justifyContent: 'flex-end',
    },
    swipeIndicator: {
      width: 48,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
  });
