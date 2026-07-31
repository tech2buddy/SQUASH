# SQUASH marketing video

A 45-second "what is SQUASH" film, built with [Remotion](https://remotion.dev) —
video compositions written as React components, rendered to MP4 through headless
Chrome.

Nothing here ships to production. `vite build` only reads `src/`.

## Commands

```bash
npm run video
```

Opens the visual editor — timeline, scrubber, and each scene as its own
composition so you can iterate on one beat without watching all 45 seconds.

```bash
npm run video:render
```

Renders to `out/squash-intro.mp4`. Add `--muted` to drop the silent audio track.

```bash
npx remotion still remotion/index.ts SquashIntro out/still.png --frame=400
npx remotion render remotion/index.ts Scene-how out/scene-how.mp4
```

Single frames (useful for OG images) and single scenes.

The first render downloads Chrome Headless Shell (~113 MB) into Remotion's
cache, once per machine.

## Art direction

Editorial/Swiss. The rules below are what the film is; breaking one will make it
look like generic motion graphics again.

**Three colours.** Warm off-white paper, near-black ink, and the brand green.
Red (`colors.signal`) appears in exactly two places — the payment failure in act
01 and the S1 severity marker in act 04. That restraint is what makes it read as
a warning when it does appear. Do not introduce a fourth accent.

**Nothing is centred** except the wordmark in act 03. A lockup earns the middle
of the frame; nothing else does. Everything else is set on the 12-column grid in
`theme.ts` via `col()` and `span()`, deliberately off-balance, with objects
cropped by the frame edge.

**Extreme type contrast.** A 170px hero against a 14px mono label. Tracking
tightens as size grows. Numbers use `tabular-nums` everywhere.

**Rules, not cards.** Lists are separated by hairlines and alignment. A stack of
identically-bordered rounded boxes has no hierarchy, so the eye finds nothing to
land on.

**Reveals are masked, not faded.** Type slides up out of an `overflow: hidden`
box; body copy and table rows wipe in via `clip-path`. Uniform per-element fades
are the strongest tell that nobody art-directed the motion.

**Motion mechanics vary.** Four easing curves with distinct characters
(`ease.out`, `ease.inOut`, `ease.in`, `ease.linearish`), chosen per element. When
everything shares one spring, the motion flattens.

**Grain and vignette on every frame** (`components/Grain.tsx`). A few percent of
moving noise puts the whole composition on one optical surface. Flat vector fills
are what make motion graphics look synthetic.

**No gradient blobs.** Ever.

## The squash

`components/Squashmark.tsx` is the hero moment, and it's the reason the film
leads with typography rather than the ladybug. The keyframes:

| Phase | Behaviour |
| --- | --- |
| Fall | Accelerates down on `ease.in`, stretching vertically |
| Impact | Compresses to `scaleY 0.30`, widens to `scaleX 1.25`, tracking opens |
| Rebound | Overshoots past rest — taller and narrower than final |
| Settle | Resolves to 1 |

Volume is roughly conserved, which is what makes it read as a solid object being
compressed rather than a layer being scaled. The tagline below is shoved down on
the impact frame and recovers late — secondary motion is what sells the hit as
physical.

## The cut

45s at 30fps = 1350 frames, 1920×1080.

| Time | Scene | Beat |
| --- | --- | --- |
| 0–6s | `Scene01Hook` | A green build fails a real user's payment |
| 6–11s | `Scene02Cost` | What that costs, as a review digest |
| 11–17s | `Scene03Reveal` | The wordmark takes the impact; tone cuts to paper |
| 17–33s | `Scene04HowItWorks` | Brief → panel → report, as three spec sheets |
| 33–39s | `Scene05Proof` | Coverage figures and cities |
| 39–45s | `Scene06Cta` | Two weighted actions, closing mark |

Hard cuts throughout. Every scene animates itself in, so a cut reads as rhythm
rather than a missing dissolve. Act 03 cuts value on the downbeat — the frame
flips from ink to paper on the exact impact frame.

## Placeholder content

All invented for the film, and worth replacing with something real before this
goes public:

- **ShopFast** and its checkout contents (`components/Device.tsx`)
- Tester initials, cities and devices (`Scene04HowItWorks`)
- The three store reviews (`Scene02Cost`) — deliberately not attributed to any
  named platform, since they aren't quoted from anywhere real
- Brief reference `SQ-1047`, budget `R 4 800,00`, usability score `68`

The figures in act 05 (`4,2 h` median turnaround, `100%` human QA) are the claims
already published on the live homepage. `0 emulators` restates the same
"real hardware" positioning as a figure. Confirm you still stand behind all three
before publishing.

Currency is set in South African convention throughout — comma decimal, U+2009
thin space for thousands. Placeholder-looking money makes a mock feel fake fast.

## Music

No audio ships with the repo. To add a track: save a **licensed** MP3 to
`public/audio/intro-music.mp3` and set `WITH_MUSIC = true` in `SquashIntro.tsx`.
The flag exists because Remotion hard-fails a render when an `<Audio>` source is
missing.

The film is designed to read fully silent — which is also what feed autoplay and
landing-page embeds require.

## Aspect ratios

Two cuts, both 45s:

| Composition | Size | Use |
| --- | --- | --- |
| `SquashIntro` | 1920×1080 | Landing page, YouTube, decks |
| `SquashIntroVertical` | 1080×1920 | Reels, TikTok, Shorts |

```bash
npm run video:render
npm run video:render:vertical
```

Per-scene compositions exist for both (`Scene-hook`, `Vertical-hook`, …).

**Copy lives in `content.ts` and nowhere else.** Both cuts read from it, so a
wording change lands in both. Layouts are separate on purpose — `scenes/` for
16:9, `vertical/` for 9:16 — because a two-column arrangement cannot reflow into
a vertical frame. Scaling the wide cut down would leave unreadable type and dead
bands top and bottom.

### Vertical safe area

Reels and TikTok draw their own UI over the video: roughly the top 130px and the
bottom 380px of a 1080×1920 frame sit under captions, the caption box, and the
action rail. `vertical/layout.ts` defines `safeTop: 200` / `safeBottom: 1600`,
and `useFrameMetrics()` in `components/Frame.tsx` pulls the chrome rules inside
those bands.

Anything the viewer must read belongs in that band. Two consequences worth
knowing before editing:

- Act 03's lockup is centred on the safe band, not the frame — otherwise it
  reads low once the platform UI is over it.
- Act 06's closing mark is left-aligned, not bottom-right, because that corner
  is under the action rail.

Act 01 crops into the bottom of the handset rather than showing it whole. A full
phone scaled to fit 9:16 puts the checkout type below legibility *and* drops the
error message under the caption box.
