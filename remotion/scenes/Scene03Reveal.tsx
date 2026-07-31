import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Frame } from '../components/Frame';
import { Squashmark, IMPACT } from '../components/Squashmark';
import { colors, ease, fonts, type } from '../theme';

/**
 * Act 03 — the mark lands.
 *
 * The only centred composition in the film; a lockup is the one thing that
 * earns the middle of the frame.
 *
 * The tone flips from ink to paper on the exact impact frame, so the darkness
 * of act 02 is what the mark displaces. Cutting value on the downbeat is worth
 * more than any transition effect.
 */
export const Scene03Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const landed = frame >= IMPACT;
  const tone = landed ? 'paper' : 'ink';

  // Secondary motion: the tagline is driven down by the impact, then recovers.
  // Dependent elements reacting a beat late is what makes the hit feel physical.
  const shove = interpolate(
    frame,
    [IMPACT, IMPACT + 5, IMPACT + 18, IMPACT + 32],
    [0, 26, -4, 0],
    clamp,
  );
  const taglineIn = interpolate(frame, [IMPACT + 6, IMPACT + 26], [0, 1], {
    ...clamp,
    easing: ease.out,
  });

  const metaIn = interpolate(frame, [IMPACT + 30, IMPACT + 50], [0, 1], {
    ...clamp,
    easing: ease.out,
  });

  return (
    <Frame tone={tone} label="Act 03 · The mark" index="03 / 06">
      <AbsoluteFill
        style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}
      >
        <Squashmark tone={tone} />

        <div
          style={{
            marginTop: 40 + shove,
            overflow: 'hidden',
            paddingBottom: '0.14em',
          }}
        >
          <div
            style={{
              transform: `translateY(${(1 - taglineIn) * 110}%)`,
              fontFamily: fonts.display,
              fontSize: 46,
              fontWeight: 620,
              letterSpacing: '-0.028em',
              color: landed ? colors.inkSoft : colors.paper,
            }}
          >
            Real-user QA, before you launch.
          </div>
        </div>

        <div
          style={{
            marginTop: 30,
            ...type.micro,
            fontFamily: fonts.mono,
            textTransform: 'uppercase',
            color: colors.inkFaint,
            opacity: metaIn,
            letterSpacing: '0.3em',
          }}
        >
          South Africa and Beyond
        </div>
      </AbsoluteFill>
    </Frame>
  );
};
