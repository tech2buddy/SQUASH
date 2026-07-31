import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Frame, Kicker } from '../components/Frame';
import { Display } from '../components/Display';
import { colors, ease, fonts, type } from '../theme';
import { ACTS, COVERAGE } from '../content';
import { V } from './layout';

/**
 * Act 05, vertical.
 *
 * The wide cut sets the three figures as a band across the bottom. Here they
 * stack, each on its own rule, with the value and label side by side — a column
 * of three centred numerals would waste the measure and read as a list of
 * unrelated stats rather than one table.
 */
export const V05Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const citiesWipe = interpolate(frame, [84, 124], [0, 1], { ...clamp, easing: ease.inOut });

  return (
    <Frame tone="ink" label={ACTS.coverage} index="05 / 06">
      <AbsoluteFill>
        <div style={{ position: 'absolute', left: V.margin, top: 258 }}>
          <Kicker delay={6} tone="ink" accent>
            {COVERAGE.kicker}
          </Kicker>
        </div>

        <div style={{ position: 'absolute', left: V.margin, top: 310, width: V.measure }}>
          <Display
            delay={18}
            stagger={8}
            scale="display"
            tone="ink"
            style={{ fontSize: 88 }}
          >
            {COVERAGE.headline}
          </Display>
        </div>

        <div style={{ position: 'absolute', left: V.margin, top: 700, width: V.measure }}>
          {COVERAGE.figures.map((figure) => {
            const grow = interpolate(frame, [figure.at, figure.at + 26], [0, 1], {
              ...clamp,
              easing: ease.inOut,
            });
            const rise = interpolate(frame, [figure.at + 6, figure.at + 34], [0, 1], {
              ...clamp,
              easing: ease.out,
            });

            return (
              <div key={figure.label} style={{ marginBottom: 46 }}>
                <div
                  style={{
                    height: 2,
                    background: figure.accent
                      ? colors.greenBright
                      : 'rgba(242,241,238,0.5)',
                    transform: `scaleX(${grow})`,
                    transformOrigin: 'left center',
                  }}
                />
                <div
                  style={{
                    marginTop: 20,
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 24,
                  }}
                >
                  <div style={{ overflow: 'hidden', paddingBottom: '0.08em' }}>
                    <div
                      style={{
                        transform: `translateY(${(1 - rise) * 108}%)`,
                        fontFamily: fonts.display,
                        fontSize: 112,
                        fontWeight: 800,
                        letterSpacing: '-0.05em',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                        color: figure.accent ? colors.greenBright : colors.paper,
                      }}
                    >
                      {figure.value}
                    </div>
                  </div>
                  <div
                    style={{
                      ...type.micro,
                      fontFamily: fonts.mono,
                      textTransform: 'uppercase',
                      color: 'rgba(242,241,238,0.44)',
                      opacity: rise,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {figure.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            left: V.margin,
            top: 1478,
            width: V.measure,
            ...type.micro,
            fontFamily: fonts.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            lineHeight: 1.9,
            color: 'rgba(242,241,238,0.34)',
            clipPath: `inset(0 ${(1 - citiesWipe) * 100}% 0 0)`,
          }}
        >
          {COVERAGE.cities}
        </div>
      </AbsoluteFill>
    </Frame>
  );
};
