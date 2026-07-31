import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { Frame, Kicker } from '../components/Frame';
import { Display, Body } from '../components/Display';
import { colors, col, span, ease, fonts, type } from '../theme';

const STEP_LEN = 160;

/** A row of a spec sheet: mono label, rule, value set right. */
const Row: React.FC<{
  label: string;
  value: string;
  at: number;
  accent?: boolean;
  first?: boolean;
}> = ({ label, value, at, accent = false, first = false }) => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const wipe = interpolate(frame, [at, at + 26], [0, 1], { ...clamp, easing: ease.inOut });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 28,
        padding: '19px 0',
        borderTop: first ? 'none' : `1px solid ${colors.paperEdge}`,
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
        {label}
      </span>
      <span
        style={{
          fontFamily: fonts.text,
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: '-0.016em',
          fontVariantNumeric: 'tabular-nums',
          color: accent ? colors.green : colors.ink,
          textAlign: 'right',
          // Without this the longest value pushed the row past the right
          // margin instead of staying inside the measure.
          minWidth: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
};

/**
 * Shared step chrome.
 *
 * The oversized numeral bled off the right edge is the editorial device holding
 * the three steps together — it reads as a folio number, not a badge. Content
 * enters and leaves by mask rather than sliding as a block, so the steps feel
 * typeset in sequence instead of carouselled.
 */
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
      {/* Folio numeral, cropped by the right edge. */}
      <div
        style={{
          position: 'absolute',
          right: -66,
          bottom: 96,
          fontFamily: fonts.display,
          fontSize: 620,
          fontWeight: 800,
          letterSpacing: '-0.06em',
          lineHeight: 0.74,
          // Kept faint enough to sit clearly behind the sheet values it passes
          // under — at any more contrast it competes with them.
          color: 'rgba(11,11,12,0.038)',
          fontVariantNumeric: 'tabular-nums',
          transform: `translateY(${(1 - numeralIn) * 90}px)`,
        }}
      >
        {numeral}
      </div>

      <div
        style={{
          position: 'absolute',
          left: col(1),
          top: 300,
          width: span(5),
          transform: `translateY(${-exit * 40}px)`,
        }}
      >
        <Kicker delay={4}>How it works</Kicker>
        <div style={{ marginTop: 38 }}>
          <Display delay={12} stagger={7} scale="title">
            {title}
          </Display>
        </div>
        <div style={{ marginTop: 30 }}>
          <Body delay={30} width={span(4)}>
            {body}
          </Body>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: col(7),
          top: 292,
          width: span(6),
          transform: `translateY(${-exit * 26}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

const SheetHead: React.FC<{ children: string; at?: number }> = ({ children, at = 8 }) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [at, at + 24], [0, 1], {
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
          marginBottom: 14,
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
          marginBottom: 8,
        }}
      />
    </>
  );
};

/** Step 01 — the brief, as a spec sheet. */
const Brief: React.FC = () => (
  <div>
    <SheetHead>New job · SQ-1047</SheetHead>
    <Row first label="Product" value="ShopFast · Android + iOS" at={20} />
    {/* Real category names, taken from src/components/testCategories.tsx. */}
    <Row label="Test type" value="E-commerce · Low Data" at={30} />
    <Row label="Objective" value="Complete a paid checkout" at={40} />
    <Row label="Panel" value="12 everyday users" at={50} />
    <Row label="Network" value="Throttled 4G + fibre" at={60} />
    <Row label="Region" value="Gauteng · W. Cape · KZN" at={70} />
    <Row label="Budget" value="R 500,00" at={80} accent />
  </div>
);

/** Step 02 — the panel, as a roster table. */
const Panel: React.FC = () => {
  const frame = useCurrentFrame();
  const testers = [
    ['NK', 'Johannesburg', 'Galaxy A54', '4G', 20],
    ['KM', 'Cape Town', 'iPhone 13', 'Fibre', 32],
    ['AV', 'Durban', 'Redmi Note 12', '4G', 44],
    ['TS', 'Pretoria', 'Pixel 7a', '5G', 56],
    ['LM', 'Gqeberha', 'Galaxy A14', '3G', 68],
  ] as const;

  return (
    <div>
      <SheetHead>Panel · 5 of 12 reporting</SheetHead>
      {testers.map(([initials, city, device, net, at], i) => {
        const wipe = interpolate(frame, [at as number, (at as number) + 26], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: ease.inOut,
        });

        return (
          <div
            key={initials as string}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 26,
              padding: '17px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${colors.paperEdge}`,
              clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
            }}
          >
            <span
              style={{
                fontFamily: fonts.mono,
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: colors.inkFaint,
                width: 42,
                flexShrink: 0,
              }}
            >
              {initials}
            </span>
            <span
              style={{
                fontFamily: fonts.text,
                fontSize: 27,
                fontWeight: 620,
                letterSpacing: '-0.016em',
                flex: 1,
              }}
            >
              {city}
            </span>
            <span
              style={{
                fontFamily: fonts.text,
                fontSize: 23,
                fontWeight: 500,
                color: colors.inkMuted,
                width: 200,
              }}
            >
              {device}
            </span>
            <span
              style={{
                fontFamily: fonts.mono,
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: colors.green,
                width: 58,
                textAlign: 'right',
              }}
            >
              {net}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/** Step 03 — the deliverable, as a findings list with a scored footer. */
const Findings: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const rows = [
    ['S1', 'Checkout fails silently on throttled 4G', 'Blocking', colors.signal, 20],
    ['S2', 'Promo field rejects codes containing spaces', 'Major', colors.ink, 36],
    ['S3', 'Nav tap targets below 44 px on small screens', 'Minor', colors.inkMuted, 52],
  ] as const;

  const score = Math.round(
    interpolate(frame, [70, 112], [0, 68], { ...clamp, easing: ease.out }),
  );
  const footerWipe = interpolate(frame, [66, 94], [0, 1], { ...clamp, easing: ease.inOut });

  return (
    <div>
      <SheetHead>Findings · 3 of 9 shown</SheetHead>
      {rows.map(([sev, text, weight, color, at], i) => {
        const wipe = interpolate(frame, [at as number, (at as number) + 26], [0, 1], {
          ...clamp,
          easing: ease.inOut,
        });

        return (
          <div
            key={sev as string}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 26,
              padding: '20px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${colors.paperEdge}`,
              clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
            }}
          >
            <span
              style={{
                fontFamily: fonts.mono,
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: color as string,
                width: 40,
                flexShrink: 0,
              }}
            >
              {sev}
            </span>
            <span
              style={{
                fontFamily: fonts.text,
                fontSize: 27,
                fontWeight: 560,
                letterSpacing: '-0.016em',
                lineHeight: 1.28,
                flex: 1,
              }}
            >
              {text}
            </span>
            <span
              style={{
                ...type.micro,
                fontFamily: fonts.mono,
                textTransform: 'uppercase',
                color: colors.inkFaint,
                width: 92,
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {weight}
            </span>
          </div>
        );
      })}

      <div
        style={{
          marginTop: 22,
          paddingTop: 22,
          borderTop: `2px solid ${colors.ink}`,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          clipPath: `inset(0 ${(1 - footerWipe) * 100}% 0 0)`,
        }}
      >
        <div>
          <div
            style={{
              ...type.micro,
              fontFamily: fonts.mono,
              textTransform: 'uppercase',
              color: colors.inkFaint,
            }}
          >
            Usability score
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: fonts.text,
              fontSize: 22,
              fontWeight: 500,
              color: colors.inkMuted,
            }}
          >
            Screen recordings and repro steps attached
          </div>
        </div>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 108,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 0.8,
            fontVariantNumeric: 'tabular-nums',
            color: colors.ink,
          }}
        >
          {score}
          <span style={{ fontSize: 34, color: colors.inkFaint, letterSpacing: '-0.02em' }}>
            /100
          </span>
        </div>
      </div>
    </div>
  );
};

/** Act 04 — the mechanic. */
export const Scene04HowItWorks: React.FC = () => (
  <Frame tone="paper" label="Act 04 · The mechanic" index="04 / 06">
    <Sequence durationInFrames={STEP_LEN}>
      <Step
        numeral="01"
        title={'Post\na job'}
        // Examples chosen to avoid a hyphenated word: at this measure
        // "e-commerce" wrapped on its own hyphen. E-commerce still appears in
        // the sheet's Test type row.
        body="Choose the kind of testing you need: onboarding, accessibility, low data, performance. Then pick the devices and networks to cover."
      >
        <Brief />
      </Step>
    </Sequence>

    <Sequence from={STEP_LEN} durationInFrames={STEP_LEN}>
      <Step
        numeral="02"
        title={'Real people\nrun it'}
        body="Qualified testers work your flows on the phones and networks they already own, not an emulator farm."
      >
        <Panel />
      </Step>
    </Sequence>

    <Sequence from={STEP_LEN * 2} durationInFrames={STEP_LEN}>
      <Step
        numeral="03"
        title={'Read\nthe report'}
        body="Findings ranked by severity, each with reproduction steps, evidence, and the device it surfaced on."
      >
        <Findings />
      </Step>
    </Sequence>
  </Frame>
);
