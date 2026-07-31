import React from 'react';
import { Composition } from 'remotion';
import { SquashIntro, INTRO_DURATION, SCENES } from './SquashIntro';
import { SquashIntroVertical, VERTICAL_SCENES } from './SquashIntroVertical';
import { FPS } from './theme';

/**
 * Registered compositions.
 *
 * `SquashIntro` is the deliverable. The per-scene entries below render the same
 * scene components in isolation so a single beat can be reviewed or re-rendered
 * without sitting through the whole 45 seconds.
 */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="SquashIntro"
      component={SquashIntro}
      durationInFrames={INTRO_DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />

    {SCENES.map(({ id, Component, duration }) => (
      <Composition
        key={id}
        id={`Scene-${id}`}
        component={Component}
        durationInFrames={duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
    ))}

    {/* 9:16 for Reels / TikTok / Shorts. */}
    <Composition
      id="SquashIntroVertical"
      component={SquashIntroVertical}
      durationInFrames={INTRO_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />

    {VERTICAL_SCENES.map(({ id, Component, duration }) => (
      <Composition
        key={`v-${id}`}
        id={`Vertical-${id}`}
        component={Component}
        durationInFrames={duration}
        fps={FPS}
        width={1080}
        height={1920}
      />
    ))}
  </>
);
