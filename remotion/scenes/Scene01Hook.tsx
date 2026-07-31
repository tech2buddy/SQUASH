import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Frame, Kicker } from '../components/Frame';
import { Display, Body } from '../components/Display';
import { Device } from '../components/Device';
import { colors, col, span, ease, fonts, type } from '../theme';

const FAIL_AT = 96;

/**
 * Act 01 — the blind spot.
 *
 * Composition is deliberately off-balance: type on columns 1–7, the handset
 * pushed to the right edge and cropped by the bottom of the frame. Cropping an
 * object at the frame edge is what stops a layout reading as a centred slide —
 * it implies the world continues past the composition.
 *
 * Vertical positions are set explicitly rather than stacked in flow, because
 * the red rule has to land in the gap between the headline and the body copy.
 * Letting that rule fall wherever the flow put it ran it straight through the
 * word "machine".
 */
export const Scene01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  // Slow push-in. Barely perceptible, but it keeps the frame from feeling
  // locked off.
  const push = interpolate(frame, [0, 180], [1, 1.035], { ...clamp, easing: ease.linearish });

  const deviceIn = interpolate(frame, [12, 52], [0, 1], { ...clamp, easing: ease.out });
  const failed = frame >= FAIL_AT;

  // Single-frame jolt as the request times out.
  const jolt = interpolate(frame, [FAIL_AT, FAIL_AT + 2, FAIL_AT + 9], [0, 1, 0], clamp);

  const sweep = interpolate(frame, [FAIL_AT, FAIL_AT + 22], [0, 1], {
    ...clamp,
    easing: ease.inOut,
  });

  return (
    <Frame tone="paper" label="Act 01 · The blind spot" index="01 / 06">
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: '30% 55%' }}>
        <div style={{ position: 'absolute', left: col(1), top: 258 }}>
          <Kicker delay={10}>Ships green</Kicker>
        </div>

        <div style={{ position: 'absolute', left: col(1), top: 306, width: span(7) }}>
          <Display delay={22} stagger={8} scale="display">
            {'It worked\non your\nmachine.'}
          </Display>
        </div>

        {/* Failure rule, full-bleed, seated in the gap below the headline. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 726,
            height: 2,
            background: colors.signal,
            transform: `scaleX(${sweep})`,
            transformOrigin: 'left center',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: col(1),
            top: 744,
            ...type.micro,
            fontFamily: fonts.mono,
            textTransform: 'uppercase',
            color: colors.signal,
            opacity: interpolate(frame, [FAIL_AT + 10, FAIL_AT + 24], [0, 1], clamp),
          }}
        >
          Gateway timeout · 30 000 ms
        </div>

        <div style={{ position: 'absolute', left: col(1), top: 806, width: span(4) }}>
          <Body delay={FAIL_AT + 8}>
            Every test passed. Then someone tried to pay on a throttled
            connection, and the gateway went quiet.
          </Body>
        </div>

        {/* Handset: right edge, cropped by the bottom of the frame. */}
        <div
          style={{
            position: 'absolute',
            right: 96,
            bottom: -258,
            transform: `translateY(${(1 - deviceIn) * 220}px) translateX(${
              jolt * 7
            }px) rotate(${-1.4 + jolt * 0.5}deg)`,
            opacity: deviceIn,
          }}
        >
          <Device width={444} failed={failed} />
        </div>
      </AbsoluteFill>
    </Frame>
  );
};
