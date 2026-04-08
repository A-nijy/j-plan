/**
 * Preset colors for schedules and routines (Pastel Palette)
 */
export const PRESET_COLORS = [
  '#FFADAD', // Red
  '#FFD6A5', // Orange
  '#FDFFB6', // Yellow
  '#CAFFBF', // Green
  '#9BF6FF', // Sky Blue
  '#A0C4FF', // Blue
  '#BDB2FF', // Purple
  '#FFC6FF', // Pink
  '#95D5B2', // Mint/Sage
  '#9D8189', // Muted Brown
  '#BEE1E6', // Steel Blue
  '#E9ECEF', // Neutral Gray
];

/**
 * Common color utility functions or additional semantic colors can be added here
 */
export const getColorWithOpacity = (hex: string, opacity: number) => {
  const op = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hex}${op}`;
};
