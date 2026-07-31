import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { Frame, Kicker } from '../components/Frame';
import { Display } from '../components/Display';
import { colors, col, span, grid, ease, fonts, type } from '../theme';

/**
 * Figures set in South African convention — comma decimal, to match the ZAR
 * amounts elsewhere in the film.
 *
 * The first two are the claims already published on the live homepage
 * (src/SquashHomepage.tsx). The third restates the same "real hardware"
 * positioning as a figure rather than inventing a new statistic.
 */
const FIGURES = [
  { value: '4,2 h', label: 'Median turnaround', at: 44 },
  { value: '100%', label: 'Human QA coverage', at: 56, accent: true },
  { value: '0', label: 'Emulators involved', at: 68 },
];

const CITIES = 'Johannesburg · Cape Town · Durban · Pretoria · Gqeberha · Bloemfontein';

/**
 * Act 05 — coverage.
 *
 * Composition is flipped relative to act 02 on purpose: headline across the top
 * on a wide measure, figures in a band along the bottom. Reusing the same
 * left-headline / right-list arrangement for a second dark scene would make the
 * film feel templated.
 */
export const Scene05Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const citiesWipe = interpolate(frame, [84, 120], [0, 1], { ...clamp, easing: ease.inOut });

  return (
    <Frame tone="ink" label="Act 05 · Coverage" index="05 / 06">
      <AbsoluteFill>
        {/* Headline sits high and the figure band low, with a clear gap
            between. Both were previously sized from the frame centre, which put
            the last line of type straight through the band's top rule. */}
        <div style={{ position: 'absolute', left: col(1), top: 196, width: span(9) }}>
          <Kicker delay={6} tone="ink" accent>
            Built for South Africa
          </Kicker>
        </div>

        <div style={{ position: 'absolute', left: col(1), top: 244, width: span(9) }}>
          <Display delay={18} stagger={8} scale="display" tone="ink">
            {'Real people.\nReal devices.\n*Real networks.*'}
          </Display>
        </div>

        {/* Figure band along the bottom. */}
        <div
          style={{
            position: 'absolute',
            left: grid.margin,
            right: grid.margin,
            bottom: 214,
            display: 'flex',
            gap: 0,
          }}
        >
          {FIGURES.map((figure) => {
            const grow = interpolate(frame, [figure.at, figure.at + 26], [0, 1], {
              ...clamp,
              easing: ease.inOut,
            });
            const rise = interpolate(frame, [figure.at + 6, figure.at + 34], [0, 1], {
              ...clamp,
              easing: ease.out,
            });

            return (
              <div key={figure.label} style={{ flex: 1, paddingRight: 48 }}>
                <div
                  style={{
                    height: 2,
                    background: figure.accent ? colors.greenBright : 'rgba(242,241,238,0.5)',
                    transform: `scaleX(${grow})`,
                    transformOrigin: 'left center',
                  }}
                />
                <div style={{ overflow: 'hidden', paddingBottom: '0.08em', marginTop: 24 }}>
                  <div
                    style={{
                      transform: `translateY(${(1 - rise) * 108}%)`,
                      fontFamily: fonts.display,
                      fontSize: 102,
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
                    marginTop: 24,
                    ...type.micro,
                    fontFamily: fonts.mono,
                    textTransform: 'uppercase',
                    color: 'rgba(242,241,238,0.44)',
                    opacity: rise,
                  }}
                >
                  {figure.label}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            left: grid.margin,
            bottom: 132,
            ...type.micro,
            fontFamily: fonts.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'rgba(242,241,238,0.34)',
            clipPath: `inset(0 ${(1 - citiesWipe) * 100}% 0 0)`,
          }}
        >
          {CITIES}
        </div>
      </AbsoluteFill>
    </Frame>
  );
};
