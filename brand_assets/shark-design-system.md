# SHARK — Design System
**Revision 1.0**

Brutalist performance marketing visual language. Extracted from the Shark UAE website reference. High-contrast, condensed, zero decoration — every element exists to accelerate a decision.

**Aesthetic:** Industrial Brutalism. Black and concrete with a single acid-green signal.
**Unforgettable quality:** The full-bleed black wordmark crashing into the page, then a single acid-green flash that carries all the energy.

---

## 01 — Colors

Two backgrounds, one signal. The system never uses gradients or shadows as primary design moves.

### Signal

| Token | Value | Usage |
|---|---|---|
| `--acid` | `#B8FF00` | Primary CTA, active states, stat callout fills, service pill arrows, hover targets |
| `--acid-hover` | `#CCFF1A` | Button hover state only |
| `--acid-dim` | `rgba(184,255,0,.15)` | Ghost fills on pill hover |
| `--acid-border` | `rgba(184,255,0,.35)` | Focus rings on dark surfaces |

### Foundations

| Token | Value | Usage |
|---|---|---|
| `--black` | `#000000` | Navigation bar, wordmark bar, dark section backgrounds |
| `--concrete` | `#E2E2D8` | Default page background — warm grey, not pure white |
| `--dust` | `#D0D0C4` | Secondary surfaces, card hover states |
| `--bone` | `#B8B8AA` | Dividers on concrete, muted borders |
| `--white` | `#F4F4EE` | Speech bubble backgrounds on dark sections |

### Text

| Token | Value | Usage |
|---|---|---|
| `--text-black` | `#111111` | Primary headings, body text on light |
| `--text-mid` | `#444444` | Secondary labels, captions |
| `--text-dim` | `#888888` | Metadata, disabled, placeholder |

### Rule
Acid appears on black backgrounds or concrete — never on white. White text appears only on black backgrounds. There are no intermediate colours; the system operates in hard contrast.

---

## 02 — Typography

Three typefaces chosen to complement the organic gothic forms of the THCD logo — high stroke contrast, calligraphic heritage, no geometric neutrality.

### Typefaces

| Role | Family | Fallback | Character |
|---|---|---|---|
| **Display** | Cormorant Garamond 800 Italic | Palatino Linotype, serif | Extreme stroke contrast, old-press quality. The italic weight echoes the diagonal energy of the logo's drip forms. Used for the wordmark, stat callouts, speech bubbles, and hero text. |
| **Sub-headings / Labels** | Cinzel 700–900 | Trajan Pro, serif | Roman inscriptional capitals. High contrast, carved precision — shares the logo's weight and rigour without the gothic excess. Section titles, service tags, nav brand. |
| **Mono / Body** | Courier Prime | Courier New | Warmer than Space Mono, carries a typewritten quality that complements the hand-crafted logo aesthetic. All running text, labels, captions, buttons. |

### Why this stack matches the logo

The THCD logo has three qualities that drove the font choices:
1. **Extreme thick-thin stroke contrast** → Cormorant Garamond 800 has the same ratio
2. **Calligraphic / carved origins** → Cinzel is literally based on Roman stone carving; Cormorant on Renaissance manuscript
3. **Organic rather than geometric** → Courier Prime's slab serifs are humanist, not engineered

### Scale

| Token | Size | Font | Weight | Tracking | Usage |
|---|---|---|---|---|---|
| `--t-hero` | clamp(4.5rem,14vw,13rem) | Cormorant Garamond | 800 italic | .12em | Full-bleed wordmark |
| `--t-4xl` | 10rem | Cormorant Garamond | 800 italic | .1em | Hero variant |
| `--t-3xl` | 6.5rem | Cormorant Garamond | 800 italic | .1em | Section display |
| `--t-2xl` | 4rem | Cinzel | 900 | .16em | Section titles |
| `--t-xl` | 2.5rem | Cinzel | 900 | .18em | H1, large labels |
| `--t-lg` | 1.75rem | Cinzel | 700–800 | .14em | Service card titles |
| `--t-md` | 1.25rem | Cinzel | 700 | .16em | Sub-labels |
| `--t-base` | 1rem | Courier Prime | 400 | normal | Body default |
| `--t-sm` | 0.875rem | Courier Prime | 400 | .03em | Descriptions |
| `--t-xs` | 0.75rem | Courier Prime | 400 | .14–0.16em | Labels, tags, button text |
| `--t-2xs` | 0.625rem | Courier Prime | 400 | .08–0.12em | Captions, metadata |

### Rules

- **Cormorant Garamond display is always italic and uppercase.** The italic adds the diagonal movement that matches the logo's drip angle.
- **Cinzel is always uppercase** — it has no true lowercase, the font is all-caps by nature.
- **Never use Cormorant for body copy** — below 18px the stroke contrast collapses. Use Courier Prime.
- **Courier Prime body:** 0.03em tracking, line-height 1.7–1.75.

---

## 03 — Spacing

8-point system.

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
| `--s10` | 128px |

Section padding: `var(--s9)` top/bottom. Component internal padding: `var(--s5)`.

---

## 04 — Border & Radius

**Radius:** `0px` everywhere. The system is fully square — no rounding, no softness.

**Default border on light:** `1px solid rgba(0,0,0,.12)` — subtle, structural.
**Active/hover border on light:** `1px solid var(--black)`.
**Focus on dark:** `1px solid var(--acid)` + `box-shadow: 2px 2px 0 var(--acid)` — the offset shadow reads as a cut, not a glow.

---

## 05 — Motion

Motion is decisive — no lingering. The acid pixel doesn't drift, it snaps.

| Token | Curve | Duration | Feeling |
|---|---|---|---|
| `--ease-sharp` | `cubic-bezier(0.87,0,0.13,1)` | 200ms | Instant conviction — button press, border activation |
| `--ease-out` | `cubic-bezier(0.23,1,0.32,1)` | 420ms | Controlled deceleration — entrance animations |
| `--dur-f` | — | 80ms | Colour swaps, cursor feedback |
| `--dur-m` | — | 200ms | State transitions |
| `--dur-s` | — | 420ms | Entrances, progress fill |

**Principles:**
1. Service card `↗` arrow: `translate(2px,-2px)` on hover — diagonal mirrors the brand directional energy.
2. Button hover: `translateY(-2px)` + subtle acid box-shadow. No scale transforms.
3. One `fadeUp` sequence per section on mount, staggered by 60ms.
4. Never animate the background color of an acid-filled element — it should feel like a switch, not a transition.

---

## 06 — Components

### Speech Bubbles *(Signature Component)*

The defining visual element. A rectangular callout with a hard CSS-triangle tail pointing down-left. Three variants:

**White bubble** — white background, black text. Used on acid-green section backgrounds. The contrast is absolute.
```html
<div class="bubble bubble-white bubble-lg">YOUR GO-TO PARTNER<br>FOR RAPID GROWTH</div>
```

**Acid bubble** — acid background, black text. Used on black backgrounds.
```html
<div class="bubble bubble-acid bubble-md">200 SALES<br>IN 3 WEEKS</div>
```

**Black bubble** — black background, acid text. Secondary callout on dark sections.
```html
<div class="bubble bubble-black bubble-sm">Diverse Expertise</div>
```

Sizes: `bubble-sm` (20px), `bubble-md` (40px), `bubble-lg` (64px). Font always Anton, always uppercase.

### Pixel Corner Marks

Four L-shaped marks (10×10px, 2px weight) at the corners of any contained full-bleed section. They register the element as "measured" — a targeting metaphor.

Colour: black on acid backgrounds, acid on black backgrounds.

```html
<div class="px" style="top:12px;left:12px;position:absolute;"></div>
<div class="px tr" style="top:12px;right:12px;position:absolute;"></div>
<div class="px bl" style="bottom:12px;left:12px;position:absolute;"></div>
<div class="px br" style="bottom:12px;right:12px;position:absolute;"></div>
```

### Stat Section

Acid-green full-width block with pixel corner marks. Three stats in a grid, each with:
- Small square pixel marker (8×8px black)
- Section qualifier label (mono, 10px)
- Stat bubble (Anton value with CSS tail)
- Qualifier + note (mono, tight tracking)

This is the primary social proof component — used once per page.

### Service Cards

Concrete background, black border, `0px` radius. Service tag (acid bubble with tail) + Barlow title + mono body. Diagonal arrow appears top-right on hover with `translate(-4px,4px)→(0,0)`.

### Service Pills (Nav)

From the Shark navigation service strip. Transparent background, 1px `rgba(255,255,255,.2)` border, acid diagonal arrow. On hover: border becomes acid, slight acid ghost background.

### Big Claim Block

Full-width acid-green section. Centred white speech bubble containing the primary value proposition in Anton. Used for mid-page service CTAs.

Structure:
- Section label (mono, uppercase, 50% opacity black)
- White bubble wrapper with CSS tail
- Anton headline inside

### Navigation

Pure black bar, 46px height. Brand name in Anton left. Mono links centre. Right: two contact channel links in acid. No background blur or transparency — fully opaque.

---

## 07 — Layout

### Two-Background System

The system alternates between two backgrounds:
- **Concrete** (`#E2E2D8`) — default. Service cards, inputs, body sections, the DS page itself.
- **Black** (`#000000`) — hero bar, nav, stat section, dark CTAs.
- **Acid** (`#B8FF00`) — used as a full-width section colour for the stat block and big claim. Never as a page background.

### Full-Bleed Wordmark

The SHARK logo is not a contained logo — it's a full-bleed typographic element that bleeds to all four edges. This is the structural anchor of every page.

```css
.logo-wordmark {
  font-size: clamp(4.5rem, 14vw, 13rem);
  line-height: 0.88;
  letter-spacing: -0.01em;
}
```

### Acid Drip / Slash Shape

The transition between the wordmark bar and the hero subtitle uses a CSS `clip-path` polygon that creates an irregular slash — referencing the drip marks in the original Shark design.

```css
clip-path: polygon(0 0, 100% 0, 88% 100%, 0 60%);
```

---

## 08 — Voice & Writing Style

| Context | Register | Example |
|---|---|---|
| **Speech bubble headline** | Anton, declarative, 3–5 words per line | `YOUR GO-TO PARTNER / FOR RAPID GROWTH` |
| **Stat callout** | Anton, compressed data format | `200 SALES / IN 3 WEEKS` |
| **Stat qualifier** | Mono, lowercase, explanatory | `With a budget of only AED 5500` |
| **Nav links** | Mono, 2–3 words max | `Why Shark`, `Growth Factors` |
| **Service body** | Mono, uppercase, 2-line max | `IMPROVE WEBSITE VISIBILITY / AND RANKINGS` |
| **Section label** | Mono, single word or short phrase | `WHY SHARK` / `SERVICES` |

Numbers are written with spaces not commas: `$1 000 000` not `$1,000,000`.

---

## 09 — Do's and Don'ts

**Do:**
- Use Anton for all headline, stat, and bubble text — no exceptions
- Keep the wordmark full-bleed — it should touch all horizontal edges
- Use acid green for exactly one focal element per viewport
- Place pixel corner marks on any full-width contained block
- Write stat callouts in two-line format: number on top, context below

**Don't:**
- Use border-radius — the system is fully square
- Use gradients, shadows, or glow effects — contrast does all the work
- Use acid text on concrete or white backgrounds — it's only legible on black
- Use more than two typefaces in a single component
- Break the black/concrete/acid three-colour rule with additional hues
- Use sentence case in Anton — always uppercase

---

*SHARK Design System — Revision 1.0*
*Performance & Targeting — UAE*
