import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { colors, fonts, ease, type as typeScale } from '../theme';

type DisplayProps = {
  /** Lines split on "\n". Text inside *asterisks* takes the accent colour. */
  children: string;
  delay?: number;
  /** Frames between line reveals. */
  stagger?: number;
  scale?: keyof typeof typeScale;
  tone?: 'paper' | 'ink';
  accent?: string;
  align?: 'left' | 'center';
  style?: React.CSSProperties;
};

/**
 * Display type revealed by mask, one line at a time.
 *
 * Each line sits in an overflow-hidden box and slides up from fully below its
 * own baseline, so the type appears to be uncovered rather than faded in. This
 * is the standard editorial reveal and it costs nothing — but it's the single
 * biggest difference between motion that looks typeset and motion that looks
 * like a CSS transition.
 *
 * A previous version fade-and-blurred every word independently. Uniform
 * per-word fades are a strong tell: nothing in print behaves that way.
 */
export const Display: React.FC<DisplayProps> = ({
  children,
  delay = 0,
  stagger = 7,
  scale = 'display',
  tone = 'paper',
  accent = colors.green,
  align = 'left',
  style,
}) => {
  const frame = useCurrentFrame();
  const lines = children.split('\n');
  const s = typeScale[scale];
  const fg = tone === 'ink' ? colors.paper : colors.ink;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        fontFamily: fonts.display,
        color: fg,
        ...s,
        ...style,
      }}
    >
      {lines.map((line, i) => {
        const local = frame - delay - i * stagger;

        const reveal = interpolate(local, [0, 26], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: ease.out,
        });

        return (
          <div
            key={i}
            style={{
              // Padding gives descenders and the tight line-height room to live
              // inside the mask without being clipped.
              overflow: 'hidden',
              paddingBottom: '0.1em',
              marginBottom: '-0.06em',
            }}
          >
            <div
              style={{
                transform: `translateY(${(1 - reveal) * 108}%)`,
                whiteSpace: 'pre',
              }}
            >
              {/* Split on "*" — odd segments are accented. */}
              {line.split('*').map((segment, si) => (
                <span key={si} style={{ color: si % 2 === 1 ? accent : undefined }}>
                  {segment}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Body copy, revealed with a horizontal wipe rather than a fade. Slower and
 * shorter than the display reveal so it never competes with the headline.
 */
export const Body: React.FC<{
  children: React.ReactNode;
  delay?: number;
  tone?: 'paper' | 'ink';
  width?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, tone = 'paper', width, style }) => {
  const frame = useCurrentFrame();

  const wipe = interpolate(frame - delay, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.inOut,
  });

  return (
    <div
      style={{
        ...typeScale.body,
        fontFamily: fonts.text,
        color: tone === 'ink' ? 'rgba(242,241,238,0.66)' : colors.inkMuted,
        maxWidth: width,
        clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
