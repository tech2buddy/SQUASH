import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Frame, Kicker } from '../components/Frame';
import { Display } from '../components/Display';
import { colors, col, span, grid, ease, fonts, type } from '../theme';

/**
 * Act 06 — the ask.
 *
 * Two actions, weighted. A solid ink block for the primary and a ruled text
 * link for the secondary: giving both the same visual weight is what makes a
 * CTA pair look generated. The mark closes the film bottom-right, on the same
 * baseline rule used in act 03.
 */
export const Scene06Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const primary = interpolate(frame, [58, 84], [0, 1], { ...clamp, easing: ease.out });
  const secondaryRule = interpolate(frame, [76, 100], [0, 1], {
    ...clamp,
    easing: ease.inOut,
  });
  const markIn = interpolate(frame, [96, 126], [0, 1], { ...clamp, easing: ease.out });
  const ruleIn = interpolate(frame, [110, 138], [0, 1], { ...clamp, easing: ease.inOut });

  return (
    <Frame tone="paper" label="Act 06 · Start" index="06 / 06">
      <AbsoluteFill>
        <div style={{ position: 'absolute', left: col(1), top: 288, width: span(8) }}>
          <Kicker delay={8} accent>
            Start here
          </Kicker>

          <div style={{ marginTop: 44 }}>
            <Display delay={20} stagger={8} scale="hero">
              {'Test it before\nyour users do.'}
            </Display>
          </div>

          <div style={{ marginTop: 66, display: 'flex', alignItems: 'center', gap: 44 }}>
            {/* Primary: solid block, revealed by mask rather than scaled up. */}
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  transform: `translateY(${(1 - primary) * 105}%)`,
                  background: colors.ink,
                  color: colors.paper,
                  padding: '27px 52px',
                  fontFamily: fonts.text,
                  fontSize: 30,
                  fontWeight: 660,
                  letterSpacing: '-0.014em',
                }}
              >
                Post a testing job
              </div>
            </div>

            {/* Secondary: ruled text link. */}
            <div>
              <div
                style={{
                  fontFamily: fonts.text,
                  fontSize: 30,
                  fontWeight: 560,
                  letterSpacing: '-0.014em',
                  color: colors.inkSoft,
                  opacity: interpolate(frame, [70, 90], [0, 1], clamp),
                }}
              >
                Apply as a tester
              </div>
              <div
                style={{
                  marginTop: 9,
                  height: 1.5,
                  background: colors.inkSoft,
                  transform: `scaleX(${secondaryRule})`,
                  transformOrigin: 'left center',
                }}
              />
            </div>
          </div>
        </div>

        {/* Closing mark, bottom-right. */}
        <div
          style={{
            position: 'absolute',
            right: grid.margin,
            bottom: 176,
            textAlign: 'right',
          }}
        >
          <div style={{ overflow: 'hidden', paddingBottom: '0.06em' }}>
            <div
              style={{
                transform: `translateY(${(1 - markIn) * 108}%)`,
                fontFamily: fonts.display,
                fontSize: 104,
                fontWeight: 800,
                letterSpacing: '-0.05em',
                lineHeight: 0.86,
                color: colors.ink,
              }}
            >
              SQUASH
            </div>
          </div>
          <div
            style={{
              height: 3,
              background: colors.ink,
              transform: `scaleX(${ruleIn})`,
              transformOrigin: 'right center',
              marginTop: 6,
            }}
          />
          <div
            style={{
              marginTop: 18,
              ...type.micro,
              fontFamily: fonts.mono,
              textTransform: 'uppercase',
              letterSpacing: '0.26em',
              color: colors.inkFaint,
              opacity: interpolate(frame, [130, 152], [0, 1], clamp),
            }}
          >
            Real-user QA
          </div>
        </div>
      </AbsoluteFill>
    </Frame>
  );
};
