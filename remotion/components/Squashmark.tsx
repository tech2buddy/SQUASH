import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { colors, fonts, ease } from '../theme';

/** Frame at which the wordmark lands. All other timing derives from this. */
export const IMPACT = 44;

/**
 * The wordmark taking an impact.
 *
 * Squash-and-stretch only reads if it's preceded by anticipation and followed
 * by an overshoot. The keyframes below are the whole point:
 *
 *   fall        stretches vertically while accelerating down
 *   impact      compresses hard onto the baseline, tracking opens up
 *   rebound     overshoots past rest, taller and narrower than final
 *   settle      resolves to 1
 *
 * Volume is roughly conserved — as scaleY drops, scaleX grows — which is what
 * makes it read as a solid object being compressed rather than a layer being
 * scaled. Letter-spacing widening on impact is the detail that sells it: real
 * type pushed flat has to go somewhere sideways.
 */
export const Squashmark: React.FC<{
  word?: string;
  tone?: 'paper' | 'ink';
  /** Cap size of the wordmark. Drops to ~190 in the 9:16 cut. */
  size?: number;
}> = ({ word = 'SQUASH', tone = 'paper', size = 268 }) => {
  const frame = useCurrentFrame();
  const fg = tone === 'ink' ? colors.paper : colors.ink;

  const keys = [IMPACT - 16, IMPACT - 3, IMPACT, IMPACT + 6, IMPACT + 15, IMPACT + 26];
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const scaleY = interpolate(frame, keys, [1, 1.09, 0.3, 1.13, 0.97, 1], clamp);
  const scaleX = interpolate(frame, keys, [1, 0.95, 1.25, 0.93, 1.02, 1], clamp);

  // Tracking opens as the letterforms are crushed, then recovers.
  const tracking = interpolate(
    frame,
    [IMPACT - 3, IMPACT, IMPACT + 10, IMPACT + 26],
    [-0.048, 0.006, -0.052, -0.048],
    clamp,
  );

  // Falls from above, accelerating into the impact frame. Distance scales with
  // the mark so the fall reads at the same speed at any size.
  const fallY = interpolate(frame, [0, IMPACT], [-size * 2.1, 0], {
    ...clamp,
    easing: ease.in,
  });

  // Baseline rule is driven outward by the impact.
  const ruleGrow = interpolate(frame, [IMPACT, IMPACT + 12], [0, 1], {
    ...clamp,
    easing: ease.out,
  });

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          transform: `translateY(${fallY}px)`,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: fonts.display,
            fontSize: size,
            fontWeight: 800,
            lineHeight: 0.82,
            letterSpacing: `${tracking}em`,
            color: fg,
            display: 'inline-block',
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: 'center bottom',
            // Optical correction: tight tracking pulls the last glyph's
            // sidebearing in, shifting the word off true centre.
            paddingLeft: '0.048em',
          }}
        >
          {word}
        </span>
      </div>

      {/* Baseline the mark lands on. Sits far enough below the baseline that
          only the Q's tail crosses it — which is the detail worth having. */}
      <div
        style={{
          height: 3,
          background: fg,
          transform: `scaleX(${ruleGrow})`,
          transformOrigin: 'center',
          marginTop: 22,
        }}
      />
    </div>
  );
};

/** Frames after IMPACT at which dependent elements should react. */
export const afterImpact = (offset: number) => IMPACT + offset;
