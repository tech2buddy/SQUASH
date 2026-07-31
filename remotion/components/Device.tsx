import React from 'react';
import { colors, fonts } from '../theme';

/**
 * South African currency, set the way it's actually written: space for
 * thousands, comma for the decimal. R 1 299,00 — not $1,299.00. Small detail,
 * but placeholder-looking money is a fast way to make a mock feel fake.
 */
const rand = (cents: number): string => {
  const whole = Math.floor(cents / 100);
  const frac = String(cents % 100).padStart(2, '0');
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
  return `R\u2009${grouped},${frac}`;
};

const ITEMS = [
  { name: 'Ceramic pour-over set', variant: 'Matte white', cents: 74900 },
  { name: 'Ethiopia Guji · 250g', variant: 'Whole bean', cents: 21500 },
  { name: 'Steel gooseneck kettle', variant: '1.0 L', cents: 89900 },
];

const SUBTOTAL = ITEMS.reduce((sum, item) => sum + item.cents, 0);
const DELIVERY = 8500;

const StatusBar: React.FC<{ scale: number }> = ({ scale }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${14 * scale}px ${26 * scale}px 0`,
      fontFamily: fonts.text,
      fontSize: 15 * scale,
      fontWeight: 650,
      color: colors.ink,
      letterSpacing: '-0.01em',
    }}
  >
    <span>21:14</span>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 * scale }}>
      {/* Signal bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 * scale }}>
        {[5, 7.5, 10, 12.5].map((h, i) => (
          <div
            key={i}
            style={{
              width: 3 * scale,
              height: h * scale,
              borderRadius: 1 * scale,
              background: colors.ink,
              opacity: i === 3 ? 0.28 : 1,
            }}
          />
        ))}
      </div>
      {/* Battery */}
      <div
        style={{
          width: 25 * scale,
          height: 12.5 * scale,
          borderRadius: 3.5 * scale,
          border: `${1.4 * scale}px solid ${colors.ink}`,
          padding: 1.8 * scale,
          marginLeft: 2 * scale,
        }}
      >
        <div
          style={{
            width: '72%',
            height: '100%',
            borderRadius: 1.5 * scale,
            background: colors.ink,
          }}
        />
      </div>
    </div>
  </div>
);

/**
 * A checkout screen with real copy, real prices and real hierarchy.
 *
 * The earlier version used gray skeleton bars and two emoji as imagery. Grey
 * placeholder rectangles read as an unfinished wireframe, which undercuts the
 * whole premise — the film is about testing a product that supposedly exists.
 */
export const Checkout: React.FC<{ width: number; failed?: boolean }> = ({
  width,
  failed = false,
}) => {
  // Everything is expressed against a 430px reference so the screen can be
  // rendered at any size without re-tuning the type.
  const s = width / 430;

  return (
    <div style={{ fontFamily: fonts.text, color: colors.ink, height: '100%' }}>
      <StatusBar scale={s} />

      <div style={{ padding: `${26 * s}px ${26 * s}px 0` }}>
        <div
          style={{
            fontSize: 13 * s,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: colors.inkFaint,
          }}
        >
          Step 3 of 3
        </div>
        <div
          style={{
            marginTop: 8 * s,
            fontFamily: fonts.display,
            fontSize: 34 * s,
            fontWeight: 750,
            letterSpacing: '-0.03em',
          }}
        >
          Checkout
        </div>

        {/* Line items, separated by rules rather than boxed in cards. */}
        <div style={{ marginTop: 22 * s }}>
          {ITEMS.map((item, i) => (
            <div
              key={item.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 14 * s,
                padding: `${15 * s}px 0`,
                borderTop: i === 0 ? 'none' : `1px solid ${colors.paperEdge}`,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 16.5 * s,
                    fontWeight: 620,
                    letterSpacing: '-0.012em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    marginTop: 3 * s,
                    fontSize: 14 * s,
                    fontWeight: 500,
                    color: colors.inkFaint,
                  }}
                >
                  {item.variant}
                </div>
              </div>
              <div
                style={{
                  fontSize: 16.5 * s,
                  fontWeight: 650,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {rand(item.cents)}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 6 * s,
            paddingTop: 16 * s,
            borderTop: `1.5px solid ${colors.ink}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 9 * s,
          }}
        >
          {[
            ['Subtotal', rand(SUBTOTAL)],
            ['Delivery · Gauteng', rand(DELIVERY)],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 15 * s,
                fontWeight: 520,
                color: colors.inkMuted,
              }}
            >
              <span>{k}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 4 * s,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              fontSize: 21 * s,
              fontWeight: 750,
              letterSpacing: '-0.02em',
            }}
          >
            <span>Total</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {rand(SUBTOTAL + DELIVERY)}
            </span>
          </div>
        </div>

        {/* Failure state: a real inline error, in the one place red is allowed. */}
        {failed ? (
          <div
            style={{
              marginTop: 18 * s,
              paddingLeft: 13 * s,
              borderLeft: `3px solid ${colors.signal}`,
            }}
          >
            <div
              style={{
                fontSize: 15 * s,
                fontWeight: 700,
                color: colors.signal,
                letterSpacing: '-0.01em',
              }}
            >
              Payment could not be processed
            </div>
            <div
              style={{
                marginTop: 4 * s,
                fontSize: 13.5 * s,
                fontWeight: 500,
                color: colors.inkMuted,
                lineHeight: 1.35,
              }}
            >
              Gateway timed out after 30s. No further detail shown.
            </div>
          </div>
        ) : null}

        <div
          style={{
            marginTop: failed ? 16 * s : 26 * s,
            height: 54 * s,
            borderRadius: 12 * s,
            background: failed ? colors.paperDim : colors.ink,
            color: failed ? colors.inkFaint : colors.paper,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17 * s,
            fontWeight: 680,
            letterSpacing: '-0.01em',
          }}
        >
          {failed ? 'Try again' : `Pay ${rand(SUBTOTAL + DELIVERY)}`}
        </div>
      </div>
    </div>
  );
};

/**
 * Handset shell. Thin, even bezels and a real corner radius ratio; no
 * decorative shadow stack.
 */
export const Device: React.FC<{
  width?: number;
  failed?: boolean;
  style?: React.CSSProperties;
}> = ({ width = 430, failed = false, style }) => {
  const s = width / 430;
  const height = width * 2.02;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 52 * s,
        background: colors.ink,
        padding: 9 * s,
        boxShadow: `0 ${52 * s}px ${100 * s}px rgba(11,11,12,0.22)`,
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 44 * s,
          background: '#FBFAF8',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Checkout width={width} failed={failed} />
      </div>
    </div>
  );
};
