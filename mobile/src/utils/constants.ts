export const COLORS = {
  primary: '#FF6B35',
  secondary: '#1E3A8A',
  accent: '#00BFA6',
  background: '#F3F4F6',
  surface: '#FFFFFF',
  text: '#1F2933',
  error: '#EF4444',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONT_SIZES = {
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 24,
};

/**
 * Exercise categories with display labels and icons
 * Used for consistent UI rendering across the app
 */
export const EXERCISE_CATEGORIES = [
  { key: 'chest', label: 'Chest', icon: 'arm-flex' },
  { key: 'back', label: 'Back', icon: 'weight-lifter' },
  { key: 'legs', label: 'Legs', icon: 'run' },
  { key: 'shoulders', label: 'Shoulders', icon: 'arm-flex-outline' },
  { key: 'arms', label: 'Arms', icon: 'arm-flex' },
  { key: 'core', label: 'Core', icon: 'yoga' },
  { key: 'cardio', label: 'Cardio', icon: 'run-fast' },
];

/** Default timer durations (seconds) */
export const TIMERS = {
  DEFAULT_REST_DURATION: 90,
  DEFAULT_WORKOUT_DURATION: 300,
  MIN_TIMER_DURATION: 10,
  MAX_TIMER_DURATION: 600,
} as const;

/** Socket event names mirrored with backend constants */
export const SOCKET_EVENTS = {
  SESSION_JOIN: 'session:join',
  SESSION_LEAVE: 'session:leave',
  SESSION_START: 'session:start',
  SESSION_UPDATE: 'session:update',
  SET_COMPLETE: 'set:complete',
  WEIGHT_UPDATE: 'weight:update',
  TURN_CHANGE: 'turn:change',
  EXERCISE_CHANGE: 'exercise:change',
  SESSION_END: 'session:end',
  TIMER_START: 'timer:start',
  TIMER_SYNC: 'timer:sync',
  TIMER_STOP: 'timer:stop',
  AVATAR_EVOLUTION: 'avatar:evolution',
  ERROR: 'server:error',
} as const;

/** Avatar level and muscle group limits */
export const AVATAR_LEVELS = {
  MAX_LEVEL: 50,
  MIN_LEVEL: 1,
  MAX_MUSCLE_LEVEL: 10,
  MIN_MUSCLE_LEVEL: 1,
} as const;

/** Avatar colors for different muscle group levels */
export const AVATAR_COLORS = {
  // Light colors for levels 1-3
  level1: '#FEE2E2',
  level2: '#FECACA',
  level3: '#FCA5A5',
  // Medium colors for levels 4-6
  level4: '#F87171',
  level5: '#EF4444',
  level6: '#DC2626',
  // Dark/intense colors for levels 7-10
  level7: '#B91C1C',
  level8: '#991B1B',
  level9: '#7F1D1D',
  level10: '#450A0A',
} as const;

/** Muscle group display labels */
export const MUSCLE_GROUP_LABELS = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
} as const;
