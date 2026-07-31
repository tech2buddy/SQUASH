/**
 * Art direction for the SQUASH films.
 *
 * Editorial/Swiss: a strict grid, extreme type contrast, and a deliberately
 * short palette. Three colours carry the whole film — paper, ink, and the brand
 * green. Red appears exactly once, on the failure beat, so it actually means
 * something when it shows up.
 */
import { Easing } from 'remotion';

export const colors = {
  /** Warm off-white. Cooler grays read as "default Tailwind"; this reads as paper. */
  paper: '#F2F1EE',
  paperDim: '#E4E2DD',
  paperEdge: '#D6D3CC',

  /** Near-black with a hint of warmth. Pure #000 looks cheap on video. */
  ink: '#0B0B0C',
  inkSoft: '#3A3A3D',
  inkMuted: '#75757A',
  inkFaint: '#A8A7A3',

  /** Brand green. The only accent in the film. */
  green: '#16A34A',
  greenBright: '#28C46A',

  /** Failure red. Used once, in scene 01. Never decoratively. */
  signal: '#E5484D',
} as const;

export const fonts = {
  display:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif',
  text: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
  mono: '"SF Mono", ui-monospace, "Roboto Mono", Menlo, Consolas, monospace',
} as const;

/**
 * Type scale for 1920×1080. The jumps are large on purpose — a 168px hero
 * against a 17px label is what makes a layout feel typeset rather than
 * arbitrary. Tracking tightens as size grows, which is how display type is
 * actually set.
 */
export const type = {
  hero: { fontSize: 170, fontWeight: 800, letterSpacing: '-0.048em', lineHeight: 0.92 },
  display: { fontSize: 116, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.98 },
  title: { fontSize: 74, fontWeight: 700, letterSpacing: '-0.032em', lineHeight: 1.04 },
  body: { fontSize: 31, fontWeight: 450, letterSpacing: '-0.008em', lineHeight: 1.42 },
  label: { fontSize: 17, fontWeight: 700, letterSpacing: '0.22em', lineHeight: 1 },
  micro: { fontSize: 14, fontWeight: 600, letterSpacing: '0.16em', lineHeight: 1 },
} as const;

/** Layout grid. Every scene aligns to these. */
export const grid = {
  width: 1920,
  height: 1080,
  margin: 132,
  columns: 12,
  gutter: 32,
} as const;

/** Left edge of column `n` (1-indexed), and the width of `span` columns. */
export const col = (n: number): number => {
  const usable = grid.width - grid.margin * 2;
  const colWidth = (usable - grid.gutter * (grid.columns - 1)) / grid.columns;
  return grid.margin + (n - 1) * (colWidth + grid.gutter);
};

export const span = (count: number): number => {
  const usable = grid.width - grid.margin * 2;
  const colWidth = (usable - grid.gutter * (grid.columns - 1)) / grid.columns;
  return count * colWidth + (count - 1) * grid.gutter;
};

/**
 * Easings. Using several with distinct characters is the point — when every
 * element shares one curve, the motion flattens out and reads as generated.
 */
export const ease = {
  /** Brand curve, from src/style.css. Entrances and settles. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Symmetrical. Wipes, masks, camera moves. */
  inOut: Easing.bezier(0.83, 0, 0.17, 1),
  /** Accelerating. For anything falling or slamming. */
  in: Easing.bezier(0.55, 0, 1, 0.45),
  /** Near-linear with a soft tail. Counters and long drifts. */
  linearish: Easing.bezier(0.4, 0.1, 0.3, 1),
} as const;

export const FPS = 30;
export const sec = (seconds: number) => Math.round(seconds * FPS);
