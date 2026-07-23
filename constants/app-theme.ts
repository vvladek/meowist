export const AppTheme = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#3E9FB7',
  primaryLight: '#EDF3F5',
  text: '#1A1D26',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  shadow: '#000000',
  radius: 12,
  radiusSm: 8,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;

export const cardShadow = {
  shadowColor: AppTheme.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

/** Halved durations / snappier springs for 2x animation speed */
export const Animation = {
  timing: {
    enter: 125,
    exit: 100,
  },
  stackDuration: 150,
  longPressDelay: 150,
  dragSpring: {
    damping: 28,
    mass: 0.1,
    stiffness: 200,
    overshootClamping: true,
    restSpeedThreshold: 0.4,
    restDisplacementThreshold: 0.4,
  },
} as const;

export const listItemSpacing = AppTheme.spacing.sm;
