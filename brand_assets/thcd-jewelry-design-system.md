# THCD — Jewelry Brand Design System
**Revision 1.0 — Acid `#B8FF00`**

**Brand context:** Dark jewelry. Brutalist forms, gothic craft. Sterling silver, 18K gold vermeil. Small-batch, numbered editions.

**Source references:**
- **Shark** — Performance marketing brutalism: condensed display type, neon-on-concrete, speech bubble callouts, pixel corner marks, diagonal arrow CTAs.
- **Thcd** — Dark gothic visual identity: the path-based SVG logotype (`logothcd.svg`), scattered word-grid annotations, thin acid contour figure overlays, deep atmospheric black.

**The bridge:** `#B8FF00` acid reads clearly on both `#000` (Thcd atmosphere) and `#E6E6DF` (Shark concrete), unifying both modes under a single signal.

---

## 00 — Logo

The THCD logotype is a **path-based SVG asset** (`logothcd.svg`) — not a font. It contains 3 paths forming the Thcd letterform, spanning a viewBox of `0 0 1999.98 1216.2`.

### Embedding

Always embed inline or as an `<img>` tag referencing the SVG file. Never attempt to reproduce with type.

```html
<!-- Inline, fill controlled by CSS class -->
<svg viewBox="0 0 1999.98 1216.2" class="logo-mark">
  <!-- paths here -->
</svg>

<!-- CSS -->
.logo-mark path { fill: var(--acid); }
```

### Approved colour uses

| Context | Fill | Background |
|---|---|---|
| Primary | `#B8FF00` | Any dark surface (`--void` through `--ash`) |
| Inverse | `#B8FF00` | `--concrete` or `--dust` |
| Reversed | `#F2F0EB` | Dark surface only |

### Forbidden uses

- Filling paths with any colour other than acid, white, or black
- Outlining (stroke) — paths are fill-only forms
- Rotating, stretching, or distorting the SVG transform
- Placing on coloured, gradient, or photographic backgrounds
- Minimum display size: **80px wide** for digital

### Scale contexts

| Context | Recommended width |
|---|---|
| Hero / full-bleed | `clamp(280px, 50vw, 680px)` |
| Section header | `clamp(160px, 20vw, 300px)` |
| Navigation bar | `~36–44px height` |
| Favicon / stamp | Use simplified single-path variant |

### Glow treatment

On dark backgrounds, a soft acid glow reinforces the logo's presence:

```css
.logo-mark {
  filter: drop-shadow(0 0 32px rgba(184,255,0,0.22));
}
```

Never apply glow on concrete/light surfaces.

---

## 01 — Colors

### Dark Foundations

Five near-black tones, all carrying a faint warm-dark undertone.

| Token | Value | Usage |
|---|---|---|
| `--black` | `#000000` | Absolute black — button fills on inverse |
| `--pit` | `#050504` | Deepest page BG — ticker bar, annotation fields |
| `--void` | `#0A0A08` | Default page background |
| `--charcoal` | `#111110` | Card backgrounds, surface panels |
| `--ash` | `#1A1A17` | Elevated surfaces, hover overlays |
| `--border` | `rgba(255,255,255,.08)` | Default borders — near-invisible |
| `--border-mid` | `rgba(255,255,255,.14)` | Input borders, slightly visible |

### Signal — Acid

| Token | Value | Usage |
|---|---|---|
| `--acid` | `#B8FF00` | Logo fill, primary CTA, active nav, price display |
| `--acid-dim` | `rgba(184,255,0,.40)` | Tag dots, secondary acid moments |
| `--acid-ghost` | `rgba(184,255,0,.07)` | Ghost button fills, card hover BG |
| `--acid-border` | `rgba(184,255,0,.22)` | Focus rings, hover card borders |
| `--acid-glow` | `drop-shadow(0 0 32px rgba(184,255,0,.22))` | Logo and SVG figure glow |

**Rule:** Full-strength `#B8FF00` appears on: logo, primary CTAs, active nav links, price display, speech bubble fills, and outline figure strokes. Everywhere else, use the dim/ghost/border variants.

### Metallic Accents — Jewelry

| Token | Value | Usage |
|---|---|---|
| `--gold` | `#C8A96A` | Gold vermeil tag labels, alert titles, gold CTA |
| `--gold-dim` | `rgba(200,169,106,.30)` | Gold tag borders, gold card accents |
| `--silver` | `#B8B8B8` | Sterling silver tag labels |
| `--silver-dim` | `rgba(184,184,184,.25)` | Silver tag borders |

These tokens carry **no glow** — they are referential, not signal.

### Inverse — Shark Concrete Mode

| Token | Value | Usage |
|---|---|---|
| `--concrete` | `#E6E6DF` | Stat card backgrounds, inverse CTA sections |
| `--dust` | `#CFCFC6` | Secondary concrete surface |

---

## 02 — Typography

Three typefaces. The logo (`logothcd.svg`) is **not a typeface** and must never be substituted with a font.

### Typefaces

| Role | Family | Source | Character |
|---|---|---|---|
| **Brand Logotype** | `logothcd.svg` | Thcd — custom path drawing | The identity itself. Not a font. |
| **Brutal Display** | Anton | Shark — condensed brutalism | All-caps condensed slab. Stat bubbles, CTA sections, price callouts. |
| **Narrow Utility** | Barlow Condensed 800–900 | Shark — service titles | Product names, collection headers, subheadings. |
| **Mono** | Space Mono | Both references | All labels, tags, button text, captions, annotations, input fields, metadata. The system voice. |

### Scale

| Token | Size | Default Font | Tracking | Usage |
|---|---|---|---|---|
| `--t-4xl` | 160px | Anton | 0.05em | Maximum hero — full-bleed only |
| `--t-3xl` | 104px | Anton | 0.05em | Section openers |
| `--t-2xl` | 64px | Anton | 0.05em | Large display / section titles |
| `--t-xl` | 40px | Barlow Condensed 900 | 0.03em | Product name large, H1 |
| `--t-lg` | 28px | Barlow Condensed 800 | 0.06em | Product cards, feature titles |
| `--t-md` | 20px | Barlow Condensed / Mono | 0.04em | Stat bubbles, large labels |
| `--t-base` | 16px | Mono | 0.03em | Body default |
| `--t-sm` | 14px | Mono | 0.03em | Product descriptions, secondary body |
| `--t-xs` | 12px | Mono | 0.14–0.18em | Labels, tags, button text, input labels |
| `--t-2xs` | 10px | Mono | 0.10–0.18em | Captions, metadata, scatter annotations |

### Type Rules

- **Anton is all-caps always.** Never sentence case.
- **Barlow Condensed uses `text-transform: uppercase` and `font-weight: 800–900`.**
- **Mono labels carry `letter-spacing: 0.14–0.18em` and `text-transform: uppercase`** — this reproduces Shark's corner annotation style and Thcd's scattered word grid.
- **Price display:** Anton, `--t-price` (3rem), `color: var(--acid)`.
- **Scatter words:** Mono 10px, acid, 0.55 opacity, absolutely positioned. Always decorative — never carries primary information.

---

## 03 — Spacing

8-point base. `--s1` (4px) is micro-spacing only — inside components, never between them.

| Token | Value |
|---|---|
| `--s1` | 4px |
| `--s2` | 8px |
| `--s3` | 12px |
| `--s4` | 16px |
| `--s5` | 24px |
| `--s6` | 32px |
| `--s7` | 48px |
| `--s8` | 64px |
| `--s9` | 96px |

Section vertical padding: `var(--s9)`. Card internal padding: `var(--s5)–var(--s6)`.

---

## 04 — Border & Radius

**Radius:** `1px` everywhere. The system is deliberately near-sharp — not truly square, but barely curved. This reads as "precision-cut", appropriate for metalwork.

**Default border:** `1px solid rgba(255,255,255,.08)` — invisible until context shifts.
**Hover/Active border:** `1px solid rgba(184,255,0,.22)` — the acid signal activates.
**Focus ring:** `border-color: var(--acid)` + `box-shadow: 0 0 0 3px rgba(184,255,0,.09)`.

---

## 05 — Motion

Motion is fast and precise — like a jeweler's cut.

| Token | Curve | Duration | Feeling |
|---|---|---|---|
| `--ease-surge` | `cubic-bezier(0.23,1,.32,1)` | 500ms | Slow organic rise — product card reveals, progress fill |
| `--ease-snap` | `cubic-bezier(0.87,0,.13,1)` | 240ms | Clean decision — button state, border activation |
| `--dur-f` | — | 100ms | Cursor feedback, hover colour changes |
| `--dur-m` | — | 240ms | State transitions (border, shadow) |
| `--dur-s` | — | 500ms | Entrance animations |

**Principles:**
1. Product card hover: `translateY(-3px)` max — restrained lift, not bounce.
2. Diagonal arrow `↗` hover: `translate(2px,-2px)` — inherited from Shark's navigation motif.
3. Stat card hover on concrete: `translateY(-3px)` — subtle energy.
4. One `fadeUp` stagger per section on mount. Never animate background patterns.

---

## 06 — Components

### Logo (see §00)

The SVG is the component. Used in: hero masthead (large), navigation (22px height), annotation field watermark (0.25 opacity), and footer.

### Speech Bubbles *(Shark Heritage)*

The Shark language's signature callout — reserved for bold claims, edition stats, and editorial moments.

Three variants for jewelry brand context:
- **Acid bubble:** acid background, black text. For key claims: `HANDCRAFTED IN SMALL BATCHES`, `40 PIECES PER DROP`.
- **Dark bubble:** charcoal background, acid text, acid border. For secondary callouts.
- **Outline bubble:** transparent, white border. For supporting info.

Font: always Anton, all-caps. Never Space Mono inside a bubble.

### Pixel Corner Marks *(Shark Heritage)*

Thin L-shaped marks (14×14px, 1px weight) in acid green at the corners of contained sections. On concrete/inverse surfaces, switch to black.

Used on: stat cards, inverse sections, annotation fields, full-bleed hero panels.

Signal meaning: **measured, hallmarked, precise** — the jeweler's stamp metaphor.

### Product Cards

Dark substrate (`--charcoal`), `1px border` activates to acid on hover. Structure:

1. **Image area** (3:4 ratio) — dark pit, radial acid ghost glow, placeholder glyph at 8% opacity. Status tag top-left.
2. **Body** — product name (Barlow 800), material line (mono, `--gold` or `--silver`).
3. **Footer** — price (Anton, acid), add-to-cart CTA (small primary button).

### Stat Cards *(Shark Heritage — adapted)*

Source: Shark's three primary stat blocks. Applied to brand claims in jewelry context.

- Background: `--concrete`
- Corner marks in black
- Stat bubble (Anton, acid, CSS tail)
- Label (mono, black) + Desc (mono, #444)
- Hover: `translateY(-3px)`

### Feature Cards

Dark atmospheric. Radial acid ghost glow in corner. Icon-title-body structure. Diagonal arrow appears on hover.

### Navigation

Glass bar (`rgba(5,5,4,.92)` + `backdrop-filter: blur(14px)`). Logo SVG at 22px height, acid fill. Links: mono 10px, uppercase, underline on hover/active via `::after scaleX`. Cart CTA: small primary button.

### Tags / Badges

Four semantic variants for jewelry:
- `tag-acid` — In Stock, Edition 001, active status
- `tag-gold` — Gold Vermeil products
- `tag-silver` — Sterling Silver products
- `tag-dim` — Sold Out, Archive
- `tag-inv` — New (black background, acid text — high emphasis)

### Alerts

Three severity levels with jewelry e-commerce copy:
- **Acid** — Drop active, in stock, shipping confirmed
- **Gold** — Low stock warning for gold pieces
- **Error** — Sold out, payment failure

---

## 07 — Layout Patterns

### Two-Mode System

**Dark Mode (default — Thcd dominant):**
Dark foundations, acid signal, gothic atmosphere. All product cards, navigation, standard page sections.

**Inverse Mode (Shark dominant):**
Concrete background, black typography, acid signal preserved. Used for: hero CTA sections, stat blocks, "Why us" rows, editorial emphasis sections.

Acid reads clearly on both — this is the structural decision that makes the two modes coherent.

### Scatter Annotation Grid *(Thcd Heritage)*

Absolute-positioned mono words at 0.28–0.55 opacity on dark surfaces. Sourced from the Thcd top/bottom word-grids.

Used as: masthead atmospheric texture, annotation field demo surfaces.

**Rules:**
- Never above 0.55 opacity
- Never legible as primary information
- Always `pointer-events: none`
- In jewelry context, mix brand references (THCD, CRAFT, HAND) with original Thcd words (AESPA, 에스파, LEMONADE)

### Logo Watermark in Dark Panels

The THCD logo SVG at 0.25 opacity, `drop-shadow(0 0 20px rgba(184,255,0,.3))`, centered in dark panels (annotation fields, section dividers). Acts as a brand stamp without competing with foreground content.

---

## 08 — Jewelry Brand Voice

Copy should carry the tension between both reference aesthetics:

| Context | Register | Example |
|---|---|---|
| **Hero / CTA** | Anton brutalist — uppercase, declarative, Shark energy | `HANDCRAFTED IN SMALL BATCHES. WORN BY PEOPLE WHO DON'T COMPROMISE.` |
| **Product name** | Barlow — two-word max, dark evocative | `Drip Ring`, `Brutal Cuff`, `Signal Pendant`, `Void Earrings` |
| **Material line** | Mono — specification format | `925 Sterling Silver — Oxidised` / `18K Gold Vermeil — Brushed` |
| **Edition label** | Mono — code format | `Edition 001 of 040` / `HALLMARK: 925` |
| **Scatter words** | Mono 10px — stream-of-consciousness, multilingual OK | `THCD / CRAFT / HAND / DREW / SELF / 에스파` |
| **Navigation links** | Mono — category, minimal | `Shop`, `Collections`, `Craft`, `About` |

**Naming convention for drops:** Edition [number], never "collection" or "season". `Edition 001`, `Edition 002`.

---

## 09 — Do's and Don'ts

**Do:**
- Use `logothcd.svg` — never substitute with a font
- Apply corner marks to anything that implies measurement, hallmark, or registration
- Use acid at full `#B8FF00` only for the logo, primary CTA, price, and nav active state
- Use gold/silver accent tokens for material-specific labelling
- Keep scatter annotations below 0.55 opacity and `pointer-events: none`
- Keep product names to two words maximum — let the form communicate
- Use Anton for prices — the scale and weight commands attention

**Don't:**
- Use gradient backgrounds — ever
- Apply border-radius above 1px
- Place the logo on coloured, gradient, or photographic backgrounds
- Use gold or silver tokens for primary UI actions (they are material-referential only)
- Use more than two typefaces in a single component
- Animate scatter annotation words — they are static atmosphere
- Use acid green for body copy or material descriptions — it belongs only to the signal layer

---

*THCD Jewelry — Design System Rev 1.0*
*Shark × Thcd — unified under Acid #B8FF00*
*logothcd.svg — 3 paths — viewBox 0 0 1999.98 1216.2*
