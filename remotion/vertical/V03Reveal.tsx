import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Frame } from '../components/Frame';
import { Squashmark, IMPACT } from '../components/Squashmark';
import { colors, ease, fonts, type } from '../theme';
import { ACTS, MARK } from '../content';

/**
 * Act 03, vertical. Centred, like the wide cut — a lockup is the one thing that
 * earns the middle of the frame in either ratio. The tone still flips from ink
 * to paper on the exact impact frame.
 *
 * Centred on the safe band (200–1600) rather than the true frame centre, so the
 * mark sits optically centred to a viewer whose bottom third is covered by
 * platform UI.
 */
export const V03Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const landed = frame >= IMPACT;
  const tone = landed ? 'paper' : 'ink';

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
    <Frame tone={tone} label={ACTS.mark} index="03 / 06">
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          // Shift up so the lockup centres on the safe band, not the frame.
          paddingBottom: 320,
        }}
      >
        <Squashmark tone={tone} size={190} />

        <div style={{ marginTop: 40 + shove, overflow: 'hidden', paddingBottom: '0.14em' }}>
          <div
            style={{
              transform: `translateY(${(1 - taglineIn) * 110}%)`,
              fontFamily: fonts.display,
              fontSize: 42,
              fontWeight: 620,
              letterSpacing: '-0.028em',
              color: landed ? colors.inkSoft : colors.paper,
            }}
          >
            {MARK.tagline}
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
          {MARK.meta}
        </div>
      </AbsoluteFill>
    </Frame>
  );
};
