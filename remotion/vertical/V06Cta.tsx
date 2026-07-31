import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Frame, Kicker } from '../components/Frame';
import { Display } from '../components/Display';
import { colors, ease, fonts, type } from '../theme';
import { ACTS, CTA } from '../content';
import { V } from './layout';

/**
 * Act 06, vertical.
 *
 * Actions stack instead of sitting side by side, keeping the weighting — solid
 * ink block for the primary, ruled text for the secondary. The closing mark goes
 * left-aligned rather than bottom-right: in 9:16 the bottom-right corner is
 * under the platform's action rail.
 */
export const V06Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const primary = interpolate(frame, [58, 84], [0, 1], { ...clamp, easing: ease.out });
  const secondaryRule = interpolate(frame, [80, 104], [0, 1], {
    ...clamp,
    easing: ease.inOut,
  });
  const markIn = interpolate(frame, [100, 130], [0, 1], { ...clamp, easing: ease.out });
  const ruleIn = interpolate(frame, [114, 142], [0, 1], { ...clamp, easing: ease.inOut });

  return (
    <Frame tone="paper" label={ACTS.start} index="06 / 06">
      <AbsoluteFill>
        <div style={{ position: 'absolute', left: V.margin, top: 274 }}>
          <Kicker delay={8} accent>
            {CTA.kicker}
          </Kicker>
        </div>

        <div style={{ position: 'absolute', left: V.margin, top: 330, width: V.measure }}>
          <Display delay={20} stagger={8} scale="hero" style={{ fontSize: 104 }}>
            {CTA.headline}
          </Display>
        </div>

        <div style={{ position: 'absolute', left: V.margin, top: 660 }}>
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                transform: `translateY(${(1 - primary) * 105}%)`,
                background: colors.ink,
                color: colors.paper,
                padding: '30px 54px',
                fontFamily: fonts.text,
                fontSize: 34,
                fontWeight: 660,
                letterSpacing: '-0.014em',
                display: 'inline-block',
              }}
            >
              {CTA.primary}
            </div>
          </div>

          <div style={{ marginTop: 42, display: 'inline-block' }}>
            <div
              style={{
                fontFamily: fonts.text,
                fontSize: 34,
                fontWeight: 560,
                letterSpacing: '-0.014em',
                color: colors.inkSoft,
                opacity: interpolate(frame, [74, 94], [0, 1], clamp),
              }}
            >
              {CTA.secondary}
            </div>
            <div
              style={{
                marginTop: 10,
                height: 1.5,
                background: colors.inkSoft,
                transform: `scaleX(${secondaryRule})`,
                transformOrigin: 'left center',
              }}
            />
          </div>
        </div>

        {/* Closing mark, left-aligned and clear of the platform action rail.
            Anchored at 1060 rather than lower down: further along there was a
            350px hole between the secondary action and the mark. */}
        <div style={{ position: 'absolute', left: V.margin, top: 1060, width: V.measure }}>
          <div style={{ overflow: 'hidden', paddingBottom: '0.06em' }}>
            <div
              style={{
                transform: `translateY(${(1 - markIn) * 108}%)`,
                fontFamily: fonts.display,
                fontSize: 132,
                fontWeight: 800,
                letterSpacing: '-0.05em',
                lineHeight: 0.86,
                color: colors.ink,
              }}
            >
              {CTA.mark}
            </div>
          </div>
          <div
            style={{
              height: 3,
              background: colors.ink,
              transform: `scaleX(${ruleIn})`,
              transformOrigin: 'left center',
              marginTop: 8,
            }}
          />
          <div
            style={{
              marginTop: 22,
              ...type.micro,
              fontFamily: fonts.mono,
              textTransform: 'uppercase',
              letterSpacing: '0.26em',
              color: colors.inkFaint,
              opacity: interpolate(frame, [134, 156], [0, 1], clamp),
            }}
          >
            {CTA.micro}
          </div>
        </div>
      </AbsoluteFill>
    </Frame>
  );
};
