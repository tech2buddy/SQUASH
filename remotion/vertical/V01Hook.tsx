import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Frame, Kicker } from '../components/Frame';
import { Display, Body } from '../components/Display';
import { Device } from '../components/Device';
import { colors, ease, fonts, type } from '../theme';
import { ACTS, HOOK } from '../content';
import { V } from './layout';

const FAIL_AT = 96;

/**
 * Act 01, vertical.
 *
 * The handset is cropped rather than shown whole. At a size where a full phone
 * fits the frame, the checkout type is too small to read on a phone screen —
 * and the failure message would land below the safe area where TikTok draws its
 * caption box. Cropping into the bottom of the screen solves both, and reads as
 * a deliberate detail shot instead of a shrunken mockup.
 */
export const V01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const push = interpolate(frame, [0, 180], [1, 1.03], { ...clamp, easing: ease.linearish });
  const deviceIn = interpolate(frame, [12, 52], [0, 1], { ...clamp, easing: ease.out });
  const failed = frame >= FAIL_AT;
  const jolt = interpolate(frame, [FAIL_AT, FAIL_AT + 2, FAIL_AT + 9], [0, 1, 0], clamp);
  const sweep = interpolate(frame, [FAIL_AT, FAIL_AT + 22], [0, 1], {
    ...clamp,
    easing: ease.inOut,
  });

  return (
    <Frame tone="paper" label={ACTS.hook} index="01 / 06">
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: '50% 42%' }}>
        <div style={{ position: 'absolute', left: V.margin, top: 262 }}>
          <Kicker delay={10}>{HOOK.kicker}</Kicker>
        </div>

        <div style={{ position: 'absolute', left: V.margin, top: 312, width: V.measure }}>
          <Display delay={22} stagger={8} scale="display" style={{ fontSize: 94 }}>
            {HOOK.headline}
          </Display>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 646,
            height: 2,
            background: colors.signal,
            transform: `scaleX(${sweep})`,
            transformOrigin: 'left center',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: V.margin,
            top: 664,
            ...type.micro,
            fontFamily: fonts.mono,
            textTransform: 'uppercase',
            color: colors.signal,
            opacity: interpolate(frame, [FAIL_AT + 10, FAIL_AT + 24], [0, 1], clamp),
          }}
        >
          {HOOK.error}
        </div>

        <div style={{ position: 'absolute', left: V.margin, top: 722, width: 840 }}>
          <Body delay={FAIL_AT + 8}>{HOOK.body}</Body>
        </div>

        {/* Cropped detail of the failing checkout. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 928,
            // Tall enough that the handset's bottom edge falls inside the
            // window with paper below it. At 560 the crop boundary landed
            // exactly on that edge, which read as a clipping artefact.
            height: 610,
            overflow: 'hidden',
            opacity: deviceIn,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              // Frames the line items through to the failed button. Cropping
              // lower ran past the end of the content and exposed the handset's
              // bottom bezel floating in empty white.
              top: -340 + (1 - deviceIn) * 90,
              transform: `translateX(-50%) translateX(${jolt * 7}px)`,
            }}
          >
            <Device width={600} failed={failed} />
          </div>
        </div>
      </AbsoluteFill>
    </Frame>
  );
};
