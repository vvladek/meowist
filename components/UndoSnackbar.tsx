import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTheme, Animation } from '@/constants/app-theme';
import { useTasks } from '@/context/TaskContext';

export function UndoSnackbar() {
  const insets = useSafeAreaInsets();
  const { pendingUndo, undoDelete, dismissUndo } = useTasks();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (pendingUndo) {
      translateY.value = withTiming(0, { duration: Animation.timing.enter });
      opacity.value = withTiming(1, { duration: Animation.timing.enter });
    } else {
      translateY.value = withTiming(100, { duration: Animation.timing.exit });
      opacity.value = withTiming(0, { duration: Animation.timing.exit });
    }
  }, [pendingUndo, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!pendingUndo) return null;

  return (
    <Animated.View
      style={[styles.container, { bottom: insets.bottom + 16 }, animatedStyle]}
      pointerEvents="box-none">
      <View style={styles.snackbar}>
        <Ionicons name="trash-outline" size={18} color={AppTheme.textSecondary} />
        <Text style={styles.message} numberOfLines={1}>
          Task deleted
        </Text>
        <Pressable
          onPress={undoDelete}
          style={({ pressed }) => [styles.undoButton, pressed && styles.undoPressed]}
          hitSlop={8}>
          <Text style={styles.undoText}>Undo</Text>
        </Pressable>
        <Pressable onPress={dismissUndo} hitSlop={8} style={styles.dismissButton}>
          <Ionicons name="close" size={18} color={AppTheme.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: AppTheme.spacing.md,
    right: AppTheme.spacing.md,
    zIndex: 100,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppTheme.text,
    borderRadius: AppTheme.radius,
    paddingVertical: 14,
    paddingHorizontal: AppTheme.spacing.md,
    gap: AppTheme.spacing.sm,
    shadowColor: AppTheme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  undoButton: {
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: 4,
  },
  undoPressed: {
    opacity: 0.7,
  },
  undoText: {
    color: AppTheme.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  dismissButton: {
    padding: 2,
  },
});
