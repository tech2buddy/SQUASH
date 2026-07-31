import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Frame, Kicker } from '../components/Frame';
import { Display } from '../components/Display';
import { colors, col, span, ease, fonts, type } from '../theme';

/**
 * Illustrative copy. Deliberately not attributed to any named app store, since
 * these are written for the film rather than quoted from anywhere real.
 */
const REVIEWS = [
  { rating: 3, quote: 'Checkout took three tries before it finally worked.', meta: 'Store review · day 2', at: 46 },
  { rating: 2, quote: 'Could not finish signing up. Gave up and used the website.', meta: 'Store review · day 3', at: 62 },
  { rating: 1, quote: 'Took my money twice and showed an error. Uninstalled.', meta: 'Store review · day 5', at: 78 },
];

/**
 * Act 02 — what the miss costs.
 *
 * Set as a review digest: hairline rules, a display numeral for the rating, and
 * a right-hand meta column. Rules and alignment do the work that a stack of
 * rounded cards was doing before — a list of identical bordered boxes has no
 * hierarchy, so the eye finds nothing to land on.
 */
export const Scene02Cost: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const push = interpolate(frame, [0, 150], [1.03, 1], { ...clamp, easing: ease.linearish });

  return (
    <Frame tone="ink" label="Act 02 · The cost" index="02 / 06">
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: '50% 50%' }}>
        <div style={{ position: 'absolute', left: col(1), top: 318, width: span(5) }}>
          <Kicker delay={6} tone="ink">
            The cost
          </Kicker>
          <div style={{ marginTop: 40 }}>
            {/* Held at 94px rather than the full display size: "first
                impression." is the longest line in the film, and at 116px it
                ran past the measure into the review column. */}
            <Display
              delay={16}
              stagger={8}
              scale="display"
              tone="ink"
              accent={colors.signal}
              style={{ fontSize: 94 }}
            >
              {"You don't get\na second\n*first impression.*"}
            </Display>
          </div>
        </div>

        <div style={{ position: 'absolute', left: col(7), top: 322, width: span(6) }}>
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
              <div key={review.quote} style={{ paddingTop: 26, paddingBottom: 30 }}>
                <div
                  style={{
                    height: 1,
                    background: 'rgba(242,241,238,0.22)',
                    transform: `scaleX(${ruleGrow})`,
                    transformOrigin: 'left center',
                    marginBottom: 24,
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 34 }}>
                  <div
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 62,
                      fontWeight: 800,
                      letterSpacing: '-0.04em',
                      lineHeight: 0.86,
                      color: colors.signal,
                      fontVariantNumeric: 'tabular-nums',
                      clipPath: `inset(0 0 ${(1 - wipe) * 100}% 0)`,
                      flexShrink: 0,
                      width: 52,
                    }}
                  >
                    {review.rating}
                  </div>
                  <div style={{ clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
                    <div
                      style={{
                        fontFamily: fonts.text,
                        fontSize: 30,
                        fontWeight: 500,
                        lineHeight: 1.36,
                        letterSpacing: '-0.012em',
                        color: 'rgba(242,241,238,0.9)',
                      }}
                    >
                      {review.quote}
                    </div>
                    <div
                      style={{
                        marginTop: 12,
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
