import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

/**
 * Film grain + vignette.
 *
 * Flat vector fills are the thing that makes motion graphics look synthetic.
 * A few percent of moving grain and a slight corner falloff put the whole frame
 * on the same optical surface, which is most of the difference between "SVG in
 * a browser" and "shot".
 *
 * The seed steps every other frame rather than every frame — real film grain
 * reads at roughly half the shutter rate, and per-frame reseeding sizzles.
 */
export const Grain: React.FC<{ opacity?: number; vignette?: number }> = ({
  opacity = 0.052,
  vignette = 0.3,
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 100% at 50% 45%, rgba(0,0,0,0) 42%, rgba(0,0,0,${vignette}) 100%)`,
          mixBlendMode: 'multiply',
        }}
      />
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay' }}
      >
        <filter id={`grain-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves={4}
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
