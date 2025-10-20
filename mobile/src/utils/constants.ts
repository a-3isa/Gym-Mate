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

/**
 * Avatar customization constants providing preset options for avatar customization UI
 */

/** Avatar body type options affecting base proportions */
export const AVATAR_BODY_TYPES = [
  { key: 'slim', label: 'Slim', description: 'Lean build' },
  { key: 'athletic', label: 'Athletic', description: 'Balanced proportions' },
  { key: 'muscular', label: 'Muscular', description: 'Broad build' },
  { key: 'heavy', label: 'Heavy', description: 'Larger frame' },
] as const;

/** Avatar skin tone preset colors */
export const AVATAR_SKIN_TONES = [
  { key: 'light', label: 'Light', color: '#FFE0BD' },
  { key: 'fair', label: 'Fair', color: '#FFCD94' },
  { key: 'medium', label: 'Medium', color: '#E0AC69' },
  { key: 'olive', label: 'Olive', color: '#C68642' },
  { key: 'tan', label: 'Tan', color: '#8D5524' },
  { key: 'brown', label: 'Brown', color: '#6B4423' },
  { key: 'dark', label: 'Dark', color: '#4A2C2A' },
] as const;

/** Avatar hair style options */
export const AVATAR_HAIR_STYLES = [
  { key: 'bald', label: 'Bald', icon: 'head' },
  { key: 'short', label: 'Short', icon: 'hair-dryer' },
  { key: 'medium', label: 'Medium', icon: 'hair-dryer-outline' },
  { key: 'long', label: 'Long', icon: 'hair-dryer' },
  { key: 'curly', label: 'Curly', icon: 'hair-dryer' },
  { key: 'buzz', label: 'Buzz Cut', icon: 'head-outline' },
] as const;

/** Avatar hair color preset colors */
export const AVATAR_HAIR_COLORS = [
  { key: 'black', label: 'Black', color: '#1A1A1A' },
  { key: 'brown', label: 'Brown', color: '#4A3728' },
  { key: 'blonde', label: 'Blonde', color: '#F5E6C8' },
  { key: 'red', label: 'Red', color: '#A52A2A' },
  { key: 'gray', label: 'Gray', color: '#808080' },
  { key: 'white', label: 'White', color: '#F0F0F0' },
] as const;

/** Avatar clothing style options */
export const AVATAR_CLOTHING_STYLES = [
  { key: 'tank', label: 'Tank Top', icon: 'tshirt-crew' },
  { key: 'tshirt', label: 'T-Shirt', icon: 'tshirt-crew-outline' },
  { key: 'hoodie', label: 'Hoodie', icon: 'hanger' },
  { key: 'sports-bra', label: 'Sports Bra', icon: 'tshirt-crew' },
  { key: 'compression', label: 'Compression', icon: 'tshirt-crew-outline' },
] as const;

/** Avatar clothing color preset colors */
export const AVATAR_CLOTHING_COLORS = [
  { key: 'black', label: 'Black', color: '#000000' },
  { key: 'white', label: 'White', color: '#FFFFFF' },
  { key: 'red', label: 'Red', color: '#EF4444' },
  { key: 'blue', label: 'Blue', color: '#3B82F6' },
  { key: 'green', label: 'Green', color: '#10B981' },
  { key: 'yellow', label: 'Yellow', color: '#F59E0B' },
  { key: 'purple', label: 'Purple', color: '#8B5CF6' },
  { key: 'gray', label: 'Gray', color: '#6B7280' },
] as const;

/**
 * 3D rendering constants controlling 3D avatar behavior and performance monitoring
 */
export const AVATAR_3D = {
  /** Default quality setting for 3D rendering */
  DEFAULT_QUALITY: 'medium' as const,
  /** Minimum acceptable FPS for 3D rendering */
  FPS_THRESHOLD: 25,
  /** How often to check FPS in milliseconds */
  PERFORMANCE_CHECK_INTERVAL: 5000,
  /** Number of consecutive low FPS readings before auto-downgrade */
  AUTO_DOWNGRADE_THRESHOLD: 5,
  /** Minimum RAM in GB required for 3D on Android */
  MIN_RAM_GB: 3,
  /** How long to cache capability detection in days */
  CACHE_DURATION_DAYS: 7,
} as const;
