import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import RNModal from 'react-native-modal';
import { scheduleOnRN } from 'react-native-worklets';
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

  /**
   * Held in a ref so the gesture below never has to be rebuilt when a caller
   * passes a fresh `closeModal` each render — which is the common case, since
   * most callers declare it inline.
   */
  const closeRef = useRef(closeModal);
  useEffect(() => {
    closeRef.current = closeModal;
  }, [closeModal]);

  /** Stable identity, so the memoized gesture below has a constant dependency. */
  const close = useCallback(() => closeRef.current(), []);

  /**
   * Gesture callbacks run as worklets on the UI thread, so an ordinary JS
   * function cannot be called directly from here — doing so threw "[Worklets]
   * Tried to synchronously call a non-worklet function on the UI thread" and
   * crashed the app on every swipe-to-dismiss. `scheduleOnRN` hops back first
   * (it replaced the now-deprecated `runOnJS`, and invokes rather than
   * returning a function to call).
   *
   * Memoized because rebuilding the gesture makes GestureDetector re-attach the
   * handler, which can drop an in-flight interaction.
   */
  const panGesture = useMemo(
    () =>
      Gesture.Pan().onEnd((event) => {
        'worklet';
        if (event.translationY > 100) {
          scheduleOnRN(close);
        }
      }),
    [close],
  );

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
