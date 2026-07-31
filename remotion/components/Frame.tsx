import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { colors, fonts, type, grid, ease } from '../theme';
import { Grain } from './Grain';

/**
 * Frame metrics for the current composition.
 *
 * The vertical cut is for Reels and TikTok, where the platform draws its own UI
 * over the video: roughly the top 130px and the bottom 380px of a 1080×1920
 * frame are covered by captions, the caption box, and the action rail. The
 * chrome rules are pulled inside those bands so nothing the design owns sits
 * under a platform control.
 */
export const useFrameMetrics = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;

  return vertical
    ? { vertical, width, height, margin: 76, ruleTop: 168, ruleBottom: 1642 }
    : {
        vertical,
        width,
        height,
        margin: grid.margin,
        ruleTop: grid.margin * 0.56,
        ruleBottom: height - grid.margin * 0.56,
      };
};

type FrameProps = {
  tone?: 'paper' | 'ink';
  /** Section name, set in the top-right corner. */
  label?: string;
  /** Sequence marker, bottom-left. Typeset as e.g. "02 / 06". */
  index?: string;
  children?: React.ReactNode;
};

/**
 * The stage every scene sits on.
 *
 * Carries persistent chrome — margin rules and four corner labels — that never
 * changes across the film. That continuity is what makes a sequence feel
 * authored by one hand: the content changes, the apparatus around it does not.
 *
 * There is deliberately no soft gradient blob anywhere in here.
 */
export const Frame: React.FC<FrameProps> = ({
  tone = 'paper',
  label,
  index,
  children,
}) => {
  const frame = useCurrentFrame();
  const dark = tone === 'ink';

  const bg = dark ? colors.ink : colors.paper;
  const fg = dark ? colors.paper : colors.ink;
  const hairline = dark ? 'rgba(242,241,238,0.16)' : 'rgba(11,11,12,0.14)';
  const chromeColor = dark ? 'rgba(242,241,238,0.42)' : 'rgba(11,11,12,0.4)';

  // Rules draw outward from the margins rather than fading in.
  const ruleGrow = interpolate(frame, [2, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.inOut,
  });
  const chromeIn = interpolate(frame, [8, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const chrome: React.CSSProperties = {
    ...type.micro,
    fontFamily: fonts.mono,
    textTransform: 'uppercase',
    color: chromeColor,
    position: 'absolute',
    opacity: chromeIn,
  };

  const { margin, ruleTop, ruleBottom } = useFrameMetrics();

  return (
    <AbsoluteFill style={{ background: bg, color: fg, fontFamily: fonts.text }}>
      {/* Margin rules. Horizontal ones grow from the left, verticals from the top. */}
      <div
        style={{
          position: 'absolute',
          left: margin,
          right: margin,
          top: ruleTop,
          height: 1,
          background: hairline,
          transform: `scaleX(${ruleGrow})`,
          transformOrigin: 'left center',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: margin,
          right: margin,
          top: ruleBottom,
          height: 1,
          background: hairline,
          transform: `scaleX(${ruleGrow})`,
          transformOrigin: 'right center',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: ruleTop,
          height: ruleBottom - ruleTop,
          left: margin,
          width: 1,
          background: hairline,
          transform: `scaleY(${ruleGrow})`,
          transformOrigin: 'center top',
        }}
      />

      {/* Corner chrome */}
      <div style={{ ...chrome, top: ruleTop - 34, left: margin }}>Squash</div>
      {label ? (
        <div style={{ ...chrome, top: ruleTop - 34, right: margin }}>{label}</div>
      ) : null}
      {index ? (
        <div style={{ ...chrome, top: ruleBottom + 22, left: margin }}>{index}</div>
      ) : null}
      <div style={{ ...chrome, top: ruleBottom + 22, right: margin }}>squashqa.co.za</div>

      {children}

      <Grain
        opacity={dark ? 0.062 : 0.045}
        vignette={dark ? 0.42 : 0.16}
      />
    </AbsoluteFill>
  );
};

/**
 * Small uppercase label with a leading rule — the standard way a print layout
 * marks a section without resorting to a pill or a badge.
 */
export const Kicker: React.FC<{
  children: React.ReactNode;
  delay?: number;
  tone?: 'paper' | 'ink';
  accent?: boolean;
}> = ({ children, delay = 0, tone = 'paper', accent = false }) => {
  const frame = useCurrentFrame();
  const dark = tone === 'ink';

  const ruleW = interpolate(frame - delay, [0, 22], [0, 56], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.out,
  });
  const opacity = interpolate(frame - delay, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fg = accent ? colors.green : dark ? colors.paper : colors.ink;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, opacity }}>
      <div style={{ width: ruleW, height: 2, background: fg }} />
      <span
        style={{
          ...type.label,
          fontFamily: fonts.text,
          textTransform: 'uppercase',
          color: fg,
        }}
      >
        {children}
      </span>
    </div>
  );
};
