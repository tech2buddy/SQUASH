import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Frame, Kicker } from '../components/Frame';
import { Display } from '../components/Display';
import { colors, ease, fonts, type } from '../theme';
import { ACTS, COST, REVIEWS } from '../content';
import { V } from './layout';

/**
 * Act 02, vertical. Headline above, review digest stacked below — the same
 * hairline-and-alignment treatment as the wide cut, just on one column.
 */
export const V02Cost: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const push = interpolate(frame, [0, 150], [1.025, 1], { ...clamp, easing: ease.linearish });

  return (
    <Frame tone="ink" label={ACTS.cost} index="02 / 06">
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: '50% 50%' }}>
        <div style={{ position: 'absolute', left: V.margin, top: 268 }}>
          <Kicker delay={6} tone="ink">
            {COST.kicker}
          </Kicker>
        </div>

        <div style={{ position: 'absolute', left: V.margin, top: 320, width: V.measure }}>
          <Display
            delay={16}
            stagger={8}
            scale="display"
            tone="ink"
            accent={colors.signal}
            style={{ fontSize: 88 }}
          >
            {COST.headline}
          </Display>
        </div>

        <div style={{ position: 'absolute', left: V.margin, top: 700, width: V.measure }}>
          {REVIEWS.map((review) => {
            const ruleGrow = interpolate(frame, [review.at, review.at + 24], [0, 1], {
              ...clamp,
              easing: ease.inOut,
            });
            const wipe = interpolate(frame, [review.at + 8, review.at + 34], [0, 1], {
              ...clamp,
              easing: ease.inOut,
            });

            return (
              <div key={review.quote} style={{ paddingTop: 30, paddingBottom: 34 }}>
                <div
                  style={{
                    height: 1,
                    background: 'rgba(242,241,238,0.22)',
                    transform: `scaleX(${ruleGrow})`,
                    transformOrigin: 'left center',
                    marginBottom: 28,
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
                  <div
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 72,
                      fontWeight: 800,
                      letterSpacing: '-0.04em',
                      lineHeight: 0.84,
                      color: colors.signal,
                      fontVariantNumeric: 'tabular-nums',
                      clipPath: `inset(0 0 ${(1 - wipe) * 100}% 0)`,
                      flexShrink: 0,
                      width: 56,
                    }}
                  >
                    {review.rating}
                  </div>
                  <div style={{ clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`, flex: 1 }}>
                    <div
                      style={{
                        fontFamily: fonts.text,
                        fontSize: 36,
                        fontWeight: 500,
                        lineHeight: 1.34,
                        letterSpacing: '-0.012em',
                        color: 'rgba(242,241,238,0.9)',
                      }}
                    >
                      {review.quote}
                    </div>
                    <div
                      style={{
                        marginTop: 14,
                        ...type.micro,
                        fontFamily: fonts.mono,
                        textTransform: 'uppercase',
                        color: 'rgba(242,241,238,0.36)',
                      }}
                    >
                      {review.meta}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Frame>
  );
};
