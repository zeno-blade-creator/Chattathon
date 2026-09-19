import { Platform } from 'react-native';

/**
 * Design tokens. One source of truth so the plan reads as one deliberate
 * document rather than a pile of screens.
 *
 * Palette is the supplied green/amber system. Values marked DERIVED are not in
 * the supplied palette — they fill tiers it doesn't specify (a faint text step,
 * an on-white moss that actually passes contrast, tints and hairlines). They
 * are all mixes of supplied colours, so swapping them out is safe.
 */

export const colors = {
  // Surfaces
  bg: '#F7F6F1',
  surface: '#FFFFFF',
  surfaceSunken: '#EFF1EB',
  /** The drab "tab" chips and footnote bands. */
  surfaceMuted: '#E7E9E3',

  // Ink
  ink: '#1C2521',
  inkMuted: '#6B7A72',
  /** DERIVED — a third, lighter text step the palette doesn't define. */
  inkFaint: '#96A29B',

  // Lines
  line: '#DDE2D9',
  lineStrong: '#D2D7CE',

  // Greens
  deepGreen: '#14342B',
  midGreen: '#2C5F4A',
  moss: '#97BC62',
  /**
   * DERIVED — moss at #97BC62 sits at roughly 2.2:1 on white, so it is not
   * usable as text on a light surface. This is the same hue darkened to pass.
   */
  mossDeep: '#5C7A3F',

  // Amber. One element per view — see ACCENT_POLICY below.
  accent: '#E8B04B',
  /** DERIVED — amber tint for the out-of-area panel. */
  accentSoft: '#FAF0DC',
  /** DERIVED — amber hairline for that panel. */
  accentLine: '#EFDCB4',

  // On dark (deep-green surfaces)
  onDark: '#D8E3DB',
  /** DERIVED — secondary text on deep green. */
  onDarkMuted: '#8FA398',
  /** DERIVED — hairlines and rings on deep green. */
  onDarkLine: '#2E5144',

  /**
   * Bucket identity. The supplied palette is a single green family plus amber,
   * so the three buckets separate by depth within that family rather than by
   * hue — amber is reserved and must not be spent on a category colour.
   */
  event: '#14342B',
  eventSoft: '#E4EBE6',
  person: '#2C5F4A',
  personSoft: '#E7EFE9',
  channel: '#5C7A3F',
  channelSoft: '#EAF0E0',

  // Status
  done: '#2C5F4A',
  skipped: '#6B7A72',
} as const;

/**
 * Where the single amber element goes on each view. Written down because the
 * rule is easy to erode one "just this once" at a time.
 *   Intake  — the numbered field indices (one repeated system), and the
 *             waitlist button when the out-of-area panel is showing.
 *   Loading — the active step marker.
 *   Plan    — the Copy plan button on the dark Week One card.
 * Everything else that used to be amber is now mid green or muted ink.
 */
export const ACCENT_POLICY = 'amber: one element per view' as const;

/**
 * Serif stack. Platform fonts rather than a loaded webfont: no async load, no
 * splash-screen gate, nothing to fail on stage. Android maps `serif` to Noto
 * Serif, iOS and desktop browsers both have Georgia.
 */
export const serif =
  Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia, "Times New Roman", Times, serif',
  }) ?? 'serif';

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
  display: {
    fontFamily: serif,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: serif,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  heading: {
    fontFamily: serif,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  body: { fontFamily: serif, fontSize: 15, lineHeight: 23, fontWeight: '400' as const },
  bodyStrong: { fontFamily: serif, fontSize: 15, lineHeight: 23, fontWeight: '600' as const },
  small: { fontFamily: serif, fontSize: 13, lineHeight: 20, fontWeight: '400' as const },
  smallStrong: { fontFamily: serif, fontSize: 13, lineHeight: 20, fontWeight: '600' as const },
  /**
   * All-caps section and meta labels. Slightly wider tracking than before —
   * small caps in a serif need more air than in a grotesque to stay legible.
   */
  label: {
    fontFamily: serif,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700' as const,
    letterSpacing: 1.3,
  },
  mono: { fontFamily: serif, fontSize: 13, lineHeight: 20, fontWeight: '400' as const },
} as const;

/** Soft card lift. Kept subtle — the content should carry the page. */
export const shadow = {
  shadowColor: '#14342B',
  shadowOpacity: 0.07,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;
