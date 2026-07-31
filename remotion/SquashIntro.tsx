import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Scene01Hook } from './scenes/Scene01Hook';
import { Scene02Cost } from './scenes/Scene02Cost';
import { Scene03Reveal } from './scenes/Scene03Reveal';
import { Scene04HowItWorks } from './scenes/Scene04HowItWorks';
import { Scene05Proof } from './scenes/Scene05Proof';
import { Scene06Cta } from './scenes/Scene06Cta';
import { colors, sec } from './theme';

/**
 * Flip to true once a licensed track is saved at public/audio/intro-music.mp3.
 * Left off by default because Remotion hard-fails the render if the file is
 * missing, and no track ships with the repo.
 */
export const WITH_MUSIC = false;
export const MUSIC_PATH = 'audio/intro-music.mp3';

/**
 * Scene map. Hard cuts throughout — every scene animates itself in, so a cut
 * reads as intentional rhythm rather than a missing transition. Apple's product
 * films work the same way.
 */
export const SCENES = [
  { id: 'hook', Component: Scene01Hook, from: sec(0), duration: sec(6) },
  { id: 'cost', Component: Scene02Cost, from: sec(6), duration: sec(5) },
  { id: 'reveal', Component: Scene03Reveal, from: sec(11), duration: sec(6) },
  // 3 steps × 160 frames.
  { id: 'how', Component: Scene04HowItWorks, from: sec(17), duration: sec(16) },
  { id: 'proof', Component: Scene05Proof, from: sec(33), duration: sec(6) },
  { id: 'cta', Component: Scene06Cta, from: sec(39), duration: sec(6) },
] as const;

export const INTRO_DURATION = sec(45);

export const SquashIntro: React.FC = () => (
  <AbsoluteFill style={{
    backgroundColor: colors.paper
  }}>
    {SCENES.map(({ id, Component, from, duration }) => (
      <Sequence key={id} from={from} durationInFrames={duration} name={id}>
        <Component />
      </Sequence>
    ))}

    {WITH_MUSIC ? <Audio src={staticFile(MUSIC_PATH)} volume={0.6} /> : null}
  </AbsoluteFill>
);
