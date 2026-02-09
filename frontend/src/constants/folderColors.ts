export const FOLDER_COLORS = [
  '#E8D5F5', // lavender
  '#D5E8F5', // sky blue
  '#D5F5E8', // mint
  '#F5E8D5', // peach
  '#F5D5E8', // pink
  '#E8F5D5', // lime
  '#F5F0D5', // yellow
  '#D5F5F0', // teal
  '#F5D5D5', // rose
  '#D5D5F5', // periwinkle
] as const;

export const FOLDER_COLORS_TEXT = [
  '#7C3AED', // lavender
  '#2563EB', // sky blue
  '#059669', // mint
  '#D97706', // peach
  '#DB2777', // pink
  '#65A30D', // lime
  '#CA8A04', // yellow
  '#0D9488', // teal
  '#DC2626', // rose
  '#4F46E5', // periwinkle
] as const;

export function getColorByIndex(index: number): string {
  return FOLDER_COLORS[index % FOLDER_COLORS.length];
}

export function getTextColorByIndex(index: number): string {
  return FOLDER_COLORS_TEXT[index % FOLDER_COLORS_TEXT.length];
}

export function getTextColorForBg(bgColor: string): string {
  const idx = FOLDER_COLORS.indexOf(bgColor as typeof FOLDER_COLORS[number]);
  return idx >= 0 ? FOLDER_COLORS_TEXT[idx] : '#6B7280';
}
