import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { Frame, Kicker } from '../components/Frame';
import { Display, Body } from '../components/Display';
import { colors, ease, fonts, type } from '../theme';
import {
  ACTS,
  BRIEF,
  FINDINGS,
  MECHANIC_KICKER,
  PANEL,
  STEPS,
} from '../content';
import { V } from './layout';

const STEP_LEN = 160;

const SheetHead: React.FC<{ children: string }> = ({ children }) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [8, 32], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.inOut,
  });

  return (
    <>
      <div
        style={{
          ...type.micro,
          fontFamily: fonts.mono,
          textTransform: 'uppercase',
          color: colors.ink,
          opacity: grow,
          marginBottom: 16,
        }}
      >
        {children}
      </div>
      <div
        style={{
          height: 2,
          background: colors.ink,
          transform: `scaleX(${grow})`,
          transformOrigin: 'left center',
          marginBottom: 10,
        }}
      />
    </>
  );
};

/**
 * Pure, not a hook — it is called inside `.map()` callbacks, where a hook would
 * violate the rules of hooks. Each sheet reads the frame once and passes it in.
 */
const wipeAt = (frame: number, at: number, len = 26) =>
  interpolate(frame, [at, at + len], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease.inOut,
  });

/** Shared vertical step chrome: folio, kicker, title, body, then the sheet. */
const Step: React.FC<{
  numeral: string;
  title: string;
  body: string;
  children: React.ReactNode;
}> = ({ numeral, title, body, children }) => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const exit = interpolate(frame, [STEP_LEN - 20, STEP_LEN], [0, 1], {
    ...clamp,
    easing: ease.inOut,
  });
  const numeralIn = interpolate(frame, [0, 34], [0, 1], { ...clamp, easing: ease.out });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      {/* Folio, cropped by the right edge. */}
      <div
        style={{
          position: 'absolute',
          right: -48,
          top: 250,
          fontFamily: fonts.display,
          fontSize: 400,
          fontWeight: 800,
          letterSpacing: '-0.06em',
          lineHeight: 0.74,
          color: 'rgba(11,11,12,0.04)',
          fontVariantNumeric: 'tabular-nums',
          transform: `translateY(${(1 - numeralIn) * 70}px)`,
        }}
      >
        {numeral}
      </div>

      <div
        style={{
          position: 'absolute',
          left: V.margin,
          top: 254,
          transform: `translateY(${-exit * 34}px)`,
        }}
      >
        <Kicker delay={4}>{MECHANIC_KICKER}</Kicker>
      </div>

      <div
        style={{
          position: 'absolute',
          left: V.margin,
          top: 306,
          width: V.measure,
          transform: `translateY(${-exit * 34}px)`,
        }}
      >
        <Display delay={12} stagger={7} scale="title" style={{ fontSize: 82 }}>
          {title}
        </Display>
      </div>

      <div
        style={{
          position: 'absolute',
          left: V.margin,
          top: 524,
          width: 820,
          transform: `translateY(${-exit * 28}px)`,
        }}
      >
        <Body delay={30}>{body}</Body>
      </div>

      <div
        style={{
          position: 'absolute',
          left: V.margin,
          top: 736,
          width: V.measure,
          transform: `translateY(${-exit * 22}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Brief: React.FC = () => {
  const frame = useCurrentFrame();

  return (
  <div>
    <SheetHead>{BRIEF.head}</SheetHead>
    {BRIEF.rows.map((row, i) => {
      const wipe = wipeAt(frame, row.at);
      return (
        <div
          key={row.label}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 26,
            padding: '21px 0',
            borderTop: i === 0 ? 'none' : `1px solid ${colors.paperEdge}`,
            clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
          }}
        >
          <span
            style={{
              ...type.micro,
              fontFamily: fonts.mono,
              textTransform: 'uppercase',
              color: colors.inkFaint,
              flexShrink: 0,
            }}
          >
            {row.label}
          </span>
          <span
            style={{
              fontFamily: fonts.text,
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: '-0.016em',
              fontVariantNumeric: 'tabular-nums',
              color: row.accent ? colors.green : colors.ink,
              textAlign: 'right',
              minWidth: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {row.value}
          </span>
        </div>
      );
    })}
  </div>
  );
};

const Panel: React.FC = () => {
  const frame = useCurrentFrame();

  return (
  <div>
    <SheetHead>{PANEL.head}</SheetHead>
    {PANEL.rows.map((row, i) => {
      const wipe = wipeAt(frame, row.at);
      return (
        <div
          key={row.initials}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 22,
            padding: '24px 0',
            borderTop: i === 0 ? 'none' : `1px solid ${colors.paperEdge}`,
            clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: colors.inkFaint,
              width: 46,
              flexShrink: 0,
            }}
          >
            {row.initials}
          </span>
          <span
            style={{
              fontFamily: fonts.text,
              fontSize: 32,
              fontWeight: 620,
              letterSpacing: '-0.016em',
              flex: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {row.city}
          </span>
          <span
            style={{
              fontFamily: fonts.text,
              fontSize: 26,
              fontWeight: 500,
              color: colors.inkMuted,
              width: 240,
              whiteSpace: 'nowrap',
            }}
          >
            {row.device}
          </span>
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: colors.green,
              width: 62,
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            {row.net}
          </span>
        </div>
      );
    })}
  </div>
  );
};

const Findings: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const score = Math.round(
    interpolate(frame, [70, 112], [0, FINDINGS.score], { ...clamp, easing: ease.out }),
  );
  const footerWipe = interpolate(frame, [66, 94], [0, 1], { ...clamp, easing: ease.inOut });

  return (
    <div>
      <SheetHead>{FINDINGS.head}</SheetHead>
      {FINDINGS.rows.map((row, i) => {
        const wipe = wipeAt(frame, row.at);
        return (
          <div
            key={row.sev}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 22,
              padding: '24px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${colors.paperEdge}`,
              clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
            }}
          >
            <span
              style={{
                fontFamily: fonts.mono,
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: row.color,
                width: 44,
                flexShrink: 0,
              }}
            >
              {row.sev}
            </span>
            <span
              style={{
                fontFamily: fonts.text,
                fontSize: 31,
                fontWeight: 560,
                letterSpacing: '-0.016em',
                lineHeight: 1.26,
                flex: 1,
              }}
            >
              {row.text}
            </span>
            <span
              style={{
                ...type.micro,
                fontFamily: fonts.mono,
                textTransform: 'uppercase',
                color: colors.inkFaint,
                width: 100,
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {row.weight}
            </span>
          </div>
        );
      })}

      <div
        style={{
          marginTop: 26,
          paddingTop: 26,
          borderTop: `2px solid ${colors.ink}`,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 24,
          clipPath: `inset(0 ${(1 - footerWipe) * 100}% 0 0)`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              ...type.micro,
              fontFamily: fonts.mono,
              textTransform: 'uppercase',
              color: colors.inkFaint,
            }}
          >
            {FINDINGS.scoreLabel}
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: fonts.text,
              fontSize: 25,
              fontWeight: 500,
              color: colors.inkMuted,
              lineHeight: 1.3,
            }}
          >
            {FINDINGS.scoreNote}
          </div>
        </div>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 116,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 0.8,
            fontVariantNumeric: 'tabular-nums',
            color: colors.ink,
            flexShrink: 0,
          }}
        >
          {score}
          <span style={{ fontSize: 36, color: colors.inkFaint, letterSpacing: '-0.02em' }}>
            /100
          </span>
        </div>
      </div>
    </div>
  );
};

const SHEETS = [Brief, Panel, Findings];

/** Act 04, vertical. */
export const V04HowItWorks: React.FC = () => (
  <Frame tone="paper" label={ACTS.mechanic} index="04 / 06">
    {STEPS.map((step, i) => {
      const Sheet = SHEETS[i];
      return (
        <Sequence key={step.numeral} from={STEP_LEN * i} durationInFrames={STEP_LEN}>
          <Step numeral={step.numeral} title={step.title} body={step.body}>
            <Sheet />
          </Step>
        </Sequence>
      );
    })}
  </Frame>
);
