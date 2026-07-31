/**
 * Vertical (9:16) layout constants for 1080×1920.
 *
 * `SAFE_TOP` / `SAFE_BOTTOM` bound the band that Reels and TikTok leave
 * uncovered. Anything the viewer must read — headlines, figures, the error
 * state, the CTA — belongs inside it. Below `SAFE_BOTTOM` the platform draws
 * the caption box and action rail, so only bleed and cropped artwork goes there.
 */
export const V = {
  width: 1080,
  height: 1920,
  margin: 76,
  /** Usable measure between the margins. */
  measure: 1080 - 76 * 2,
  safeTop: 200,
  safeBottom: 1600,
} as const;
