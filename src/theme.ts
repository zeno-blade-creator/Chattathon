/**
 * Design tokens. One source of truth so the plan reads as one deliberate
 * document rather than a pile of screens.
 */

export const colors = {
  // Surfaces
  bg: '#FBF9F5',
  surface: '#FFFFFF',
  surfaceSunken: '#F3EFE7',

  // Ink
  ink: '#16150F',
  inkMuted: '#5E5A4E',
  inkFaint: '#8E8878',

  // Lines
  line: '#E3DCCD',
  lineStrong: '#CFC5AF',

  // Accent
  accent: '#B3541E',
  accentSoft: '#FBEDE2',

  // Bucket identity — each bucket keeps one hue everywhere it appears
  event: '#1F5F4B',
  eventSoft: '#E4F0EA',
  person: '#2B4C8C',
  personSoft: '#E5EBF7',
  channel: '#7A3E86',
  channelSoft: '#F2E7F4',

  // Status
  done: '#1F5F4B',
  skipped: '#8E8878',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const type = {
  // Display — the one big statement per view
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.6 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  small: { fontSize: 13, lineHeight: 19, fontWeight: '400' as const },
  smallStrong: { fontSize: 13, lineHeight: 19, fontWeight: '600' as const },
  // Label — all-caps section and meta labels
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
    letterSpacing: 1.1,
  },
  mono: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
} as const;

/** Soft card lift. Kept subtle — the content should carry the page. */
export const shadow = {
  shadowColor: '#2B2415',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;
