import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { V01Hook } from './vertical/V01Hook';
import { V02Cost } from './vertical/V02Cost';
import { V03Reveal } from './vertical/V03Reveal';
import { V04HowItWorks } from './vertical/V04HowItWorks';
import { V05Proof } from './vertical/V05Proof';
import { V06Cta } from './vertical/V06Cta';
import { WITH_MUSIC, MUSIC_PATH } from './SquashIntro';
import { colors, sec } from './theme';

/**
 * 9:16 cut for Reels, TikTok and Shorts.
 *
 * Same six acts, same copy (both cuts read from content.ts), same timings — but
 * genuinely different layouts. The wide cut's two-column arrangements cannot
 * reflow into a vertical frame, so each scene is set again rather than scaled.
 */
export const VERTICAL_SCENES = [
  { id: 'hook', Component: V01Hook, from: sec(0), duration: sec(6) },
  { id: 'cost', Component: V02Cost, from: sec(6), duration: sec(5) },
  { id: 'reveal', Component: V03Reveal, from: sec(11), duration: sec(6) },
  { id: 'how', Component: V04HowItWorks, from: sec(17), duration: sec(16) },
  { id: 'proof', Component: V05Proof, from: sec(33), duration: sec(6) },
  { id: 'cta', Component: V06Cta, from: sec(39), duration: sec(6) },
] as const;

export const SquashIntroVertical: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: colors.paper }}>
    {VERTICAL_SCENES.map(({ id, Component, from, duration }) => (
      <Sequence key={id} from={from} durationInFrames={duration} name={id}>
        <Component />
      </Sequence>
    ))}

    {WITH_MUSIC ? <Audio src={staticFile(MUSIC_PATH)} volume={0.6} /> : null}
  </AbsoluteFill>
);
