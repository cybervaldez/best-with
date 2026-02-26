# UI Patterns Reference

A comprehensive reference for visual design patterns, design tokens, typography, color theory, and testability patterns.

---

## Design Token Systems

### Token Hierarchy

Design tokens flow from primitive to semantic to component:

```
+------------------------------------------------------------------+
| Token Hierarchy                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  PRIMITIVE (raw values)                                           |
|  --blue-500: #3b82f6;                                             |
|  --gray-900: #111827;                                             |
|  --space-4: 1rem;                                                 |
|           |                                                       |
|           v                                                       |
|  SEMANTIC (meaning)                                               |
|  --color-accent: var(--blue-500);                                 |
|  --color-text-primary: var(--gray-900);                           |
|  --spacing-base: var(--space-4);                                  |
|           |                                                       |
|           v                                                       |
|  COMPONENT (usage)                                                |
|  --btn-bg: var(--color-accent);                                   |
|  --card-padding: var(--spacing-base);                             |
|                                                                   |
+------------------------------------------------------------------+
```

### Standard Token Categories

```css
/* Color Primitives */
--white: #ffffff;
--black: #000000;
--gray-{50-950}: /* 10 shades */
--{color}-{50-950}: /* per brand color */

/* Semantic Colors */
--color-bg-primary: /* main background */
--color-bg-secondary: /* elevated surfaces */
--color-bg-tertiary: /* subtle backgrounds */
--color-text-primary: /* headings, important text */
--color-text-secondary: /* body text */
--color-text-muted: /* captions, hints */
--color-accent: /* interactive elements */
--color-accent-hover: /* hover state */
--color-success: /* positive feedback */
--color-warning: /* caution */
--color-error: /* negative feedback */
--color-border: /* default borders */

/* Typography */
--font-heading: /* heading typeface */
--font-body: /* body typeface */
--font-mono: /* code typeface */
--text-{xs,sm,base,lg,xl,2xl,3xl,4xl}: /* size scale */
--leading-{tight,normal,relaxed}: /* line height */
--tracking-{tight,normal,wide}: /* letter spacing */
--font-weight-{normal,medium,semibold,bold}: /* weights */

/* Spacing */
--space-{1,2,3,4,5,6,8,10,12,16,20,24}: /* scale */

/* Border Radius */
--radius-{none,sm,md,lg,xl,full}: /* scale */

/* Shadows */
--shadow-{sm,md,lg,xl}: /* elevation scale */

/* Transitions */
--transition-{fast,base,slow}: /* timing */
--ease-{in,out,in-out}: /* easing functions */
```

---

## Typography Scales

### Modular Scale Ratios

| Name | Ratio | Use Case |
|------|-------|----------|
| Minor Second | 1.067 | Subtle variation, dense UIs |
| Major Second | 1.125 | Slight variation, compact |
| Minor Third | 1.200 | Balanced, readable |
| Major Third | 1.250 | Classic, comfortable |
| Perfect Fourth | 1.333 | Traditional, spacious |
| Augmented Fourth | 1.414 | Dramatic, editorial |
| Perfect Fifth | 1.500 | Very dramatic, marketing |

### Recommended Scale (Major Third 1.250)

```css
--text-xs: 0.64rem;    /* 10.24px */
--text-sm: 0.8rem;     /* 12.8px */
--text-base: 1rem;     /* 16px - body */
--text-lg: 1.25rem;    /* 20px */
--text-xl: 1.563rem;   /* 25px */
--text-2xl: 1.953rem;  /* 31.25px */
--text-3xl: 2.441rem;  /* 39px */
--text-4xl: 3.052rem;  /* 48.83px */
```

### Font Pairing Guidelines

| Heading | Body | Vibe |
|---------|------|------|
| Inter | Inter | Clean, modern, safe |
| Playfair Display | Source Sans Pro | Editorial, elegant |
| Space Grotesk | Inter | Technical, futuristic |
| Fraunces | Work Sans | Friendly, approachable |
| JetBrains Mono | JetBrains Mono | Developer, technical |
| Outfit | Outfit | Geometric, modern |

### Line Height Guidelines

| Text Type | Line Height | CSS |
|-----------|-------------|-----|
| Headings | 1.1 - 1.2 | `--leading-tight` |
| Body text | 1.5 - 1.6 | `--leading-normal` |
| Small text | 1.6 - 1.75 | `--leading-relaxed` |

---

## Color Theory & Palette Generation

### Color Schemes

```
+------------------------------------------------------------------+
| Color Scheme Types                                                |
+------------------------------------------------------------------+
|                                                                   |
| MONOCHROMATIC        COMPLEMENTARY        ANALOGOUS               |
| (one hue, vary       (opposite hues)      (adjacent hues)         |
|  lightness/sat)                                                   |
|                                                                   |
|      o                   o                  o o                   |
|     /|\                 / \                  \|                   |
|    o   o               o   o                  o                   |
|                                                                   |
| TRIADIC              SPLIT-COMPLEMENT    TETRADIC                 |
| (3 equidistant)      (1 + 2 adjacent     (4 forming               |
|                       to complement)      rectangle)              |
|                                                                   |
|    o                     o                 o   o                  |
|   / \                   /|\               /     \                 |
|  o   o                 o   o             o       o                |
|                                                                   |
+------------------------------------------------------------------+
```

### 60-30-10 Rule

```
60% - Dominant (backgrounds, large areas)
30% - Secondary (cards, containers, navigation)
10% - Accent (CTAs, links, highlights)
```

### Semantic Color Mapping

| Semantic | Typical Hue | Usage |
|----------|-------------|-------|
| Success | Green (120-150) | Confirmations, completed |
| Warning | Yellow/Orange (30-50) | Caution, attention |
| Error | Red (0-10) | Failures, destructive |
| Info | Blue (200-220) | Neutral information |

### Dark Theme Considerations

```css
/* DON'T just invert colors */

/* Light theme */
--color-bg-primary: #ffffff;
--color-text-primary: #1a1a1a;

/* BAD dark theme - pure inversion */
--color-bg-primary: #000000; /* Too harsh */
--color-text-primary: #ffffff; /* Too bright */

/* GOOD dark theme - adjusted values */
--color-bg-primary: #0a0a0a; /* Off-black, easier on eyes */
--color-text-primary: #e5e5e5; /* Off-white, less glare */
```

---

## Layout Patterns (ASCII Templates)

### Sidebar Layout

```
+------------------------------------------------------------------+
|  HEADER                                                [user] [?] |
+--------+---------------------------------------------------------+
|        |                                                          |
| NAV    |  MAIN CONTENT                                            |
| ====   |                                                          |
| Item1  |  +---------------------------------------------+         |
| Item2  |  |                                             |         |
| Item3  |  |  Content Area                               |         |
|        |  |                                             |         |
| ----   |  +---------------------------------------------+         |
| Settings|                                                         |
|        |  +---------------------------------------------+         |
+--------+---------------------------------------------------------+

data-testid mapping:
- main-header
- main-sidebar, nav-item-{name}
- main-content
```

### Dashboard Layout

```
+------------------------------------------------------------------+
|  HEADER                                        [search] [user]    |
+------------------------------------------------------------------+
|  +-------------+  +-------------+  +-------------+  +-------------+
|  | METRIC 1    |  | METRIC 2    |  | METRIC 3    |  | METRIC 4    |
|  | 1,234       |  | 56.7%       |  | $12.3k      |  | 89          |
|  +-------------+  +-------------+  +-------------+  +-------------+
|                                                                   |
|  +------------------------------------------+  +-----------------+
|  |                                          |  |                 |
|  |  MAIN CHART/CONTENT                      |  |  SIDEBAR        |
|  |                                          |  |  WIDGET         |
|  |                                          |  |                 |
|  +------------------------------------------+  +-----------------+
|                                                                   |
|  +------------------------------------------------------------------+
|  |  TABLE / LIST                                                    |
|  +------------------------------------------------------------------+

data-testid mapping:
- main-header
- metric-{name}, metric-{name}-value
- main-chart, sidebar-widget
- data-table
```

### Card Grid Layout

```
+------------------------------------------------------------------+
|  HEADER                              [filter] [sort] [view]       |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------+  +-------------+  +-------------+                 |
|  | CARD        |  | CARD        |  | CARD        |                 |
|  | [image]     |  | [image]     |  | [image]     |                 |
|  | Title       |  | Title       |  | Title       |                 |
|  | Desc...     |  | Desc...     |  | Desc...     |                 |
|  | [Action]    |  | [Action]    |  | [Action]    |                 |
|  +-------------+  +-------------+  +-------------+                 |
|                                                                   |
|  +-------------+  +-------------+  +-------------+                 |
|  | CARD        |  | CARD        |  | CARD        |                 |
|  | ...         |  | ...         |  | ...         |                 |
|  +-------------+  +-------------+  +-------------+                 |
|                                                                   |
|  [Load More]                                                      |
+------------------------------------------------------------------+

data-testid mapping:
- main-header
- filter-{name}, sort-{field}, view-toggle
- card-grid, card-item-{id}, card-{id}-action
- load-more-btn
```

### Hero + Content Layout

```
+------------------------------------------------------------------+
|  NAV                                          [link] [link] [CTA] |
+------------------------------------------------------------------+
|                                                                   |
|  ================================================================ |
|                                                                   |
|                    HERO HEADLINE                                  |
|                    Subheading text here                           |
|                                                                   |
|                 [Primary CTA]  [Secondary]                        |
|                                                                   |
|  ================================================================ |
|                                                                   |
|  +------------------+  +------------------+  +------------------+  |
|  | FEATURE 1        |  | FEATURE 2        |  | FEATURE 3        |  |
|  | Icon + text      |  | Icon + text      |  | Icon + text      |  |
|  +------------------+  +------------------+  +------------------+  |
|                                                                   |
+------------------------------------------------------------------+

data-testid mapping:
- main-nav
- hero-section, hero-headline, hero-cta-primary, hero-cta-secondary
- feature-{name}
```

### Split Panel Layout

```
+------------------------------------------------------------------+
|  HEADER                                                           |
+--------------------------------+---------------------------------+
|                                |                                  |
|  LEFT PANEL (MASTER)           |  RIGHT PANEL (DETAIL)            |
|                                |                                  |
|  +---------------------------+ |  +----------------------------+  |
|  | List Item 1        [>]   | |  |  Detail View               |  |
|  +---------------------------+ |  |                            |  |
|  | List Item 2              | |  |  Title                     |  |
|  +---------------------------+ |  |  Description text...       |  |
|  | List Item 3              | |  |                            |  |
|  +---------------------------+ |  |  [Edit] [Delete]           |  |
|  | List Item 4              | |  |                            |  |
|  +---------------------------+ |  +----------------------------+  |
|                                |                                  |
+--------------------------------+---------------------------------+

data-testid mapping:
- main-header
- panel-left, panel-right
- list-item-{id}, detail-view
- detail-edit-btn, detail-delete-btn
```

### List View Layout

```
+------------------------------------------------------------------+
|  HEADER                                     [+ New] [Filter] [Sort]|
+------------------------------------------------------------------+
|                                                                   |
|  +--------------------------------------------------------------+|
|  | [x] | Item Title          | Status    | Date     | Actions   ||
|  +--------------------------------------------------------------+|
|  | [ ] | First item name     | Active    | Jan 15   | [...] [x] ||
|  +--------------------------------------------------------------+|
|  | [ ] | Second item name    | Pending   | Jan 14   | [...] [x] ||
|  +--------------------------------------------------------------+|
|  | [x] | Third item name     | Complete  | Jan 13   | [...] [x] ||
|  +--------------------------------------------------------------+|
|  | [ ] | Fourth item name    | Active    | Jan 12   | [...] [x] ||
|  +--------------------------------------------------------------+|
|                                                                   |
|  Showing 1-4 of 24                          [<] [1] [2] [3] [>]  |
+------------------------------------------------------------------+

data-testid mapping:
- main-header, create-btn, filter-btn, sort-btn
- list-table, list-row-{id}
- row-{id}-checkbox, row-{id}-actions, row-{id}-delete
- pagination, page-{n}
```

---

## Motion & Animation

### Motion Design Tokens

Motion tokens generated by `/ui-planner` Step 2.5. Use these instead of hardcoded values:

```css
:root {
  /* Easing — directional, matches aesthetic */
  --ease-enter: /* from motion preset */;
  --ease-exit: /* from motion preset */;
  --ease-emphasis: /* for attention-drawing animations */;

  /* Duration — by interaction scale */
  --duration-micro: /* 80-150ms: hover, toggle, focus ring */;
  --duration-small: /* 150-250ms: accordion, tab switch, tooltip */;
  --duration-medium: /* 250-400ms: modal, drawer, dropdown */;
  --duration-page: /* 400-700ms: route transition, page enter */;

  /* Stagger — for sequential sibling animations */
  --stagger-delay: /* 30-80ms: delay between each item */;
}
```

### Duration Guidelines

| Token | Range | Use Cases |
|-------|-------|-----------|
| `--duration-micro` | 80-150ms | Hover states, toggle switches, focus rings, button press |
| `--duration-small` | 150-250ms | Accordion expand, tab switch, tooltip appear, chip dismiss |
| `--duration-medium` | 250-400ms | Modal open/close, drawer slide, dropdown menu, panel expand |
| `--duration-page` | 400-700ms | Route transitions, page enter/exit, shared element transitions |

**Rule of thumb:** Smaller elements move faster. Larger areas need more time for the eye to track.

### Easing Functions

```css
/* Standard easing (CSS defaults) */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Expressive easing */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
--ease-sharp: cubic-bezier(0.4, 0, 0.6, 1);

/* Natural / spring-like (CSS approximations) */
--ease-spring-soft: cubic-bezier(0.22, 1, 0.36, 1);
--ease-spring-snappy: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Easing Selection by Intent

| Animation Intent | Easing | Why |
|-----------------|--------|-----|
| Element entering | `--ease-enter` (ease-out) | Decelerates into resting position — feels natural |
| Element exiting | `--ease-exit` (ease-in) | Accelerates away — quick departure |
| State change | ease-in-out | Smooth transition between two stable states |
| Attention/emphasis | `--ease-emphasis` (bounce) | Overshoot draws the eye |
| Loading/progress | linear | Predictable, no false sense of speed |
| Drag release | spring / ease-out | Mimics physical momentum |

### Spring Physics (Framer Motion / React Spring)

For projects using motion libraries, spring parameters replace CSS easing:

| Parameter | What it controls | Typical range |
|-----------|-----------------|---------------|
| **stiffness** | How snappy the spring is | 100-300 (higher = snappier) |
| **damping** | How quickly oscillation settles | 10-30 (higher = less bounce) |
| **mass** | Weight of the element | 0.5-2 (higher = more inertia) |

Common spring presets:

| Name | stiffness | damping | mass | Character |
|------|-----------|---------|------|-----------|
| **Gentle** | 120 | 14 | 1 | Slow, smooth settle |
| **Default** | 170 | 26 | 1 | Balanced, natural |
| **Snappy** | 300 | 30 | 1 | Quick, minimal overshoot |
| **Bouncy** | 200 | 10 | 1 | Playful, visible overshoot |
| **Heavy** | 120 | 20 | 2 | Weighty, deliberate |

```jsx
/* Framer Motion example */
<motion.div
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>

/* React Spring example */
useSpring({ opacity: 1, y: 0, config: { tension: 300, friction: 30 } })
```

### Stagger & Orchestration Patterns

Sequential animations for groups of related elements:

#### List Enter (Cascade)

Items appear one by one from top to bottom:

```
Item 1  ████████████░░░░░░░░░░
Item 2  ░░░████████████░░░░░░░
Item 3  ░░░░░░████████████░░░░
Item 4  ░░░░░░░░░████████████░
        0ms  50  100  150  200  250  300
```

```css
/* CSS stagger via animation-delay */
.list-item { animation: fadeSlideIn var(--duration-small) var(--ease-enter) both; }
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: var(--stagger-delay); }
.list-item:nth-child(3) { animation-delay: calc(var(--stagger-delay) * 2); }
/* ... or use a CSS custom property set via JS */
.list-item { animation-delay: calc(var(--stagger-delay) * var(--i)); }
```

```jsx
/* Framer Motion stagger */
<motion.ul variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
  {items.map(item => (
    <motion.li
      key={item.id}
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
    />
  ))}
</motion.ul>
```

#### Grid Reveal

Cards appear in a wave pattern (top-left to bottom-right):

```css
.grid-item {
  animation-delay: calc(
    var(--stagger-delay) * (var(--row) + var(--col))
  );
}
```

#### Coordinated Enter/Exit

Parent orchestrates children — children must finish exiting before new children enter:

```jsx
/* Framer Motion AnimatePresence */
<AnimatePresence mode="wait">
  <motion.div
    key={currentPage}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  />
</AnimatePresence>
```

### Page & Route Transitions

| Transition Type | Properties Animated | Duration | Use Case |
|----------------|-------------------|----------|----------|
| **Crossfade** | `opacity` | 200-300ms | Default between routes |
| **Slide** | `transform: translateX()` + `opacity` | 300-400ms | Navigation hierarchy (forward/back) |
| **Shared element** | `transform` + `width/height` | 400-600ms | Card → detail page, avatar → profile |
| **Scale** | `transform: scale()` + `opacity` | 300-400ms | Modal/overlay origin |

```css
/* CSS View Transitions API (modern browsers) */
@view-transition { navigation: auto; }

::view-transition-old(root) {
  animation: fade-out var(--duration-medium) var(--ease-exit);
}
::view-transition-new(root) {
  animation: fade-in var(--duration-medium) var(--ease-enter);
}
```

### Gesture Vocabulary

Thresholds and responses for touch/pointer gestures:

| Gesture | Detection Threshold | Animation Response |
|---------|-------------------|--------------------|
| **Tap** | < 10px movement, < 300ms hold | Instant feedback (scale 0.95 → 1.0) |
| **Long press** | > 500ms hold | Slow scale up, haptic-style pulse |
| **Swipe** | > 50px displacement, > 0.3 velocity | Follow-through in swipe direction |
| **Drag** | > 10px displacement | 1:1 tracking with spring release |
| **Pinch** | Two-pointer distance change | Scale transform matching gesture ratio |

#### Scroll-Driven Animations

```css
/* CSS scroll-driven (modern browsers) */
@keyframes reveal {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

/* Progress bar tied to scroll position */
.progress-bar {
  animation: grow-width linear both;
  animation-timeline: scroll(root);
}
```

### Performance Guidelines

#### Composite-Only Properties (GPU-Accelerated)

**Animate these — they don't trigger layout or paint:**

| Property | Use Case |
|----------|----------|
| `transform` | Move (`translate`), scale, rotate |
| `opacity` | Fade in/out |
| `filter` | Blur, brightness (use sparingly) |

**Avoid animating these — they trigger layout recalculation:**

| Property | Why It's Expensive | Alternative |
|----------|-------------------|-------------|
| `width` / `height` | Triggers layout on every frame | Use `transform: scale()` |
| `top` / `left` / `right` / `bottom` | Triggers layout | Use `transform: translate()` |
| `margin` / `padding` | Triggers layout + repaint | Use `transform: translate()` |
| `border-width` | Triggers layout | Use `box-shadow` or `outline` |
| `font-size` | Triggers layout + reflow | Avoid animating |

#### will-change Usage

```css
/* DO: Apply before animation starts, remove after */
.card:hover { will-change: transform; }
.card.animating { will-change: transform, opacity; }

/* DON'T: Apply to everything permanently */
* { will-change: transform; } /* Bad — wastes GPU memory */
```

#### Layout Shift Prevention

Animations can cause **Cumulative Layout Shift (CLS)** — elements jumping position after the page appears stable. This is one of the most jarring experiences in web UI.

**What causes animation-induced layout shift:**

| Cause | Why It Shifts | Prevention |
|-------|-------------|-----------|
| Elements animating from `height: 0` to `height: auto` | Pushes content below downward | Use `transform: scaleY()` or `max-height` with `overflow: hidden` |
| Images/embeds loading without reserved space | Content reflows when media appears | Always set explicit `width`/`height` or use `aspect-ratio` |
| Font swap (`font-display: swap`) | Text reflows when web font loads | Use `font-display: optional` or `size-adjust` |
| Dynamic content insertion (toast, banner) | Pushes page content | Use `position: fixed/absolute` — overlay, don't displace |
| Accordion/expand animations on layout properties | Content below shifts each frame | Animate `transform` + `clip-path` instead of `height` |

**The golden rule:** Animations should never move content the user is *not* interacting with. If opening a drawer pushes the main content sideways, that's a layout shift. Use overlays or transform-based animations instead.

```css
/* BAD — causes layout shift for content below */
.accordion-body {
  height: 0;
  overflow: hidden;
  transition: height var(--duration-small) var(--ease-enter);
}
.accordion-body.open { height: auto; }

/* GOOD — no layout shift, content below stays put */
.accordion-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-small) var(--ease-enter);
}
.accordion-body.open { grid-template-rows: 1fr; }
.accordion-body > div { overflow: hidden; }
```

#### Flashy & Distracting Motion

Motion should **guide attention**, not compete for it. When animation becomes decoration, it hurts usability.

**The distraction test:** After an animation plays, can the user immediately find what they need? If the answer is "no, they're watching the animation," it's too much.

| Warning Sign | Problem | Fix |
|-------------|---------|-----|
| User watches the animation instead of reading content | Motion is the focal point, not the content | Reduce duration, remove overshoot, or eliminate |
| Multiple animations competing for eye | No clear visual hierarchy of motion | One primary animation, others subtle or staggered |
| Animations replay on every scroll/revisit | Repeated novelty becomes annoyance | Animate once (on first appearance), not on every intersection |
| Decorative motion with no information value | Visual noise | Remove or convert to purposeful transition |
| Parallax on text content | Readability harmed by movement | Reserve parallax for non-text decorative layers only |
| Page feels "busy" even when idle | Looping/continuous animations | Limit to loading states; idle UI should be still |

**Rule of thumb:** If you removed all animation and the page still communicates clearly, your animation is decorative. Decorative motion should be minimal or absent. *Functional* motion — transitions between states, feedback for actions, spatial orientation cues — is what makes interfaces feel alive.

#### Jank Prevention Checklist

- [ ] Only animate `transform` and `opacity` for 60fps
- [ ] Use `will-change` sparingly and temporarily
- [ ] Limit simultaneous animations to 3 elements on screen
- [ ] Test on low-end devices (throttle CPU in DevTools)
- [ ] Avoid animating during scroll (use passive listeners or scroll-timeline)
- [ ] Use `requestAnimationFrame` for JS-driven animations, never `setInterval`
- [ ] Reserve explicit dimensions for images/embeds to prevent CLS
- [ ] Never animate layout properties (`height`, `width`, `margin`) on elements that push neighbors

### Accessibility — Motion Sensitivity

#### Beyond `prefers-reduced-motion`

The `prefers-reduced-motion: reduce` media query is the minimum. For thorough accessibility:

```css
/* Level 1: Respect system preference (required) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### Vestibular Sensitivity Triggers to Avoid

| Trigger | Why It's Harmful | Safe Alternative |
|---------|-----------------|-----------------|
| Parallax scrolling | Causes dizziness, nausea | Fade-only reveals |
| Auto-playing carousels | Unexpected motion | User-controlled navigation |
| Large scale transitions (zoom) | Spatial disorientation | Crossfade instead |
| Continuous rotation/spinning | Vestibular distress | Pulse or glow instead |
| Background video/animation | Peripheral motion distraction | Static image with play button |
| Bouncing/elastic overshoot | Can feel jarring | Linear or ease-out settle |

#### Safe Motion Alternatives

When `prefers-reduced-motion` is active, don't just disable — provide alternatives:

| Full Motion | Reduced Alternative |
|------------|-------------------|
| Slide in from side | Instant appear (opacity only if needed) |
| Scale + fade entrance | Instant appear |
| Stagger cascade | All items appear together |
| Parallax scroll | Static positioning |
| Spring bounce | Direct snap to position |
| Page slide transition | Crossfade or instant |

### Motion Psychology — Why Animation Makes Navigation Feel Snappy

Motion isn't just decoration. Used correctly, it fundamentally changes how fast an interface *feels*, even when the actual speed is unchanged. This section covers the psychology that makes motion a navigation tool, not just eye candy.

#### The Perception Gap: Measured vs. Felt Speed

Users don't perceive time linearly. Two interfaces loading the same data in 800ms can feel dramatically different:

```
Interface A (no motion):
Click → [blank 800ms] → Content appears
User perception: "That was slow"

Interface B (with motion):
Click → [button depresses 50ms] → [skeleton fades in 100ms] → [content staggers in 300ms]
User perception: "That was instant"
```

Both took 800ms. But Interface B filled the time with *progressive disclosure* — the user's brain had something to process at every moment, so the wait didn't register as waiting.

#### The Three Perception Thresholds

| Threshold | User Perception | Motion Strategy |
|-----------|----------------|-----------------|
| **< 100ms** | Instant — feels like direct manipulation | Micro-feedback only: button press scale, toggle snap, focus ring |
| **100ms - 1000ms** | Brief delay — user notices but stays engaged | Transition animations: slide, fade, stagger. Fill the gap with motion |
| **> 1000ms** | Waiting — user's attention starts to wander | Skeleton screens, progress indicators, optimistic updates. Motion must *mask* the wait |

**The key insight:** The 100-1000ms window is where motion has the most leverage. Animations in this range don't just look nice — they prevent the user from perceiving delay at all.

#### How Motion Makes Navigation Feel Instant

**1. Immediate acknowledgment (< 50ms)**

The single most important motion in any interface: respond to the user's action *immediately*, even if the result takes time.

```css
/* Button press — instant physical feedback */
.btn:active {
  transform: scale(0.97);
  transition: transform 50ms var(--ease-enter);
}
```

Why this matters: When a user taps/clicks and nothing happens for 200ms, their brain starts a "did it work?" anxiety loop. A 50ms scale change says "I heard you" and buys 200-500ms of patience for free.

**2. Spatial continuity (where did I come from?)**

Page transitions that communicate *direction* help users build a mental map:

```
Forward navigation:  New page slides in from right →
Back navigation:     Previous page slides in from ← left
Drill down:          Detail expands from the clicked card
Drill up:            Detail shrinks back into the card
```

Without spatial cues, every page change feels like teleportation — the user loses their sense of "where am I in the app?" Spatial animation replaces that confusion with orientation.

```jsx
/* Framer Motion — direction-aware page transition */
<motion.div
  initial={{ x: direction === 'forward' ? 100 : -100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: direction === 'forward' ? -100 : 100, opacity: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>
```

**3. Object permanence (is this the same element?)**

Shared element transitions prove that a card in a list and the detail page are *the same thing*:

```
List view:  [Card: thumbnail + title] — user clicks
Transition: Card expands, thumbnail grows, title repositions
Detail view: [Full page: large image + title + content]
```

This creates *continuity* — the brain doesn't need to re-parse the new page because it watched the old page transform into it. The View Transitions API makes this achievable in CSS:

```css
/* Card in list */
.card-thumbnail { view-transition-name: hero-image; }
.card-title { view-transition-name: hero-title; }

/* Detail page — same transition names */
.detail-image { view-transition-name: hero-image; }
.detail-title { view-transition-name: hero-title; }
```

**4. Stagger creates arrival (content is loading → content has arrived)**

A grid of cards that staggers in with 40ms delays feels like content "arriving" — the brain reads this as "fresh, live data." The same cards appearing all at once feel like a static page that was "always there."

| Pattern | Perceived Feel |
|---------|---------------|
| All items appear at once | Static, cached, stale |
| Items stagger top-to-bottom (30-60ms) | Dynamic, fresh, "just loaded" |
| Items stagger from click origin | Responsive, caused by user action |
| Items stagger randomly | Chaotic, unintentional |

The stagger delay sweet spot: **30-60ms** per item. Shorter feels like a glitch. Longer feels slow and theatrical.

**5. Optimistic motion (assume success)**

Don't wait for the server to confirm — animate to the final state immediately:

```
User: clicks "Add to favorites" ♡
Motion: Heart fills instantly (♥), gentle pulse animation
Server: [confirms 400ms later, silently]
```

If the server fails, *then* animate the rollback. This inverts the typical pattern (wait → confirm → show) into (show → wait → silently confirm), making every interaction feel zero-latency.

**6. Deceleration bias (ease-out feels faster)**

Humans perceive decelerating motion as faster than accelerating motion. An element that starts fast and slows down at the end feels quicker than one that starts slow and speeds up, even at the same duration.

```
ease-out (fast → slow):  ████████▓▓░░  Feels fast — arrives quickly
ease-in (slow → fast):   ░░▓▓████████  Feels slow — takes forever to start
ease-in-out:             ░▓████████▓░  Feels smooth — balanced
linear:                  ████████████  Feels mechanical — no character
```

**Always use ease-out (deceleration) for enter animations.** This is why `--ease-enter` defaults to ease-out curves — it's not arbitrary, it's perceptual optimization.

**7. Progress bar psychology**

Progress indicators that start fast and slow down near the end feel faster than linear ones, because:
- Early fast progress = "this is going well"
- Slow finish = brain already committed to "almost done"

```css
/* Progress bar easing — perceptually faster */
.progress-bar-fill {
  transition: width 2s cubic-bezier(0.1, 0.7, 0.3, 1);
}
```

#### Motion as Navigation Vocabulary

Consistent motion patterns teach users to "read" your interface:

| Motion Pattern | What It Communicates |
|---------------|---------------------|
| Slide right → | "Going deeper" (forward navigation) |
| Slide ← left | "Going back" (reverse navigation) |
| Scale up from point | "Expanding this item" (detail view) |
| Scale down to point | "Closing back to where I was" |
| Fade crossfade | "New context, no spatial relationship" |
| Slide up from bottom | "Temporary overlay" (modal, sheet) |
| Slide down to bottom | "Dismissing overlay" |
| Stagger enter | "New content arriving" |
| Collapse + fade | "Content removed" |

**Consistency is critical.** If "slide right" sometimes means "forward" and sometimes means "sidebar opening," the vocabulary breaks and motion becomes confusing instead of clarifying.

#### When Motion Hurts Navigation

Motion helps until it doesn't. Watch for these:

| Problem | Symptom | Fix |
|---------|---------|-----|
| **Animation blocking interaction** | User must wait for transition to finish before they can act | Keep animations < 300ms for navigation; never disable input during animation |
| **Redundant animation on repeat visits** | Entrance animations play every time user returns to a page | Animate on first visit only, or use `animation-fill-mode: both` with a "seen" flag |
| **Motion mismatch with content urgency** | Slow elegant transition on an error state or alert | Urgent content should appear instantly; motion implies leisure |
| **Spatial confusion** | Forward and back navigation use the same animation direction | Reverse the direction for back navigation |
| **Too many motion layers** | Background parallax + card stagger + header slide = cognitive overload | One dominant motion, everything else static or subtle |

---

## Anti-Patterns (AI Slop Indicators)

### Generic AI Aesthetics to Avoid

| Anti-Pattern | Why It's Slop | Better Approach |
|--------------|---------------|-----------------|
| Purple-to-pink gradient | Overused in AI-generated UIs | Choose palette with intention |
| Random floating 3D shapes | Decoration without purpose | Meaningful visual elements |
| "Futuristic" glassmorphism everywhere | Trend over function | Use glass effects sparingly |
| Gradient text on everything | Readability issues | Reserve for hero headlines |
| Every button is rounded-full | Lacks hierarchy | Vary radius by importance |
| Excessive shadows on flat elements | Visual noise | Subtle, consistent shadows |
| Blue accent for everything | Default, not chosen | Select accent with meaning |
| Generic stock-style illustrations | Forgettable, impersonal | Custom or intentional style |

### Signs of Unintentional Design

- All spacing is identical
- Colors don't relate to each other
- Typography lacks hierarchy
- Interactive elements look the same
- No visual rhythm or pattern
- Dark mode is just inverted light mode

### How to Avoid Slop

1. **Make explicit choices** - Don't accept defaults
2. **Justify decisions** - "Why this color?" should have an answer
3. **Reference moodboard** - Collect intentional inspiration
4. **Test against brand** - Does it feel like YOUR product?
5. **Less is more** - Remove decoration that doesn't serve purpose

---

## Accessibility for Visual Design

### Contrast Requirements

| Content Type | Min Ratio (AA) | Enhanced (AAA) |
|--------------|----------------|----------------|
| Normal text | 4.5:1 | 7:1 |
| Large text (18px+) | 3:1 | 4.5:1 |
| UI components | 3:1 | 3:1 |
| Non-text contrast | 3:1 | 3:1 |

### Focus States

```css
/* Visible focus indicator */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Remove outline only when not keyboard-focused */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Color Independence

```
DON'T rely on color alone:

BAD:  "Fields in red have errors"
GOOD: "Fields marked with ! have errors" + red color + icon

BAD:  Status shown only as colored dot
GOOD: Colored dot + text label + icon
```

### Motion Sensitivity

- Provide `prefers-reduced-motion` support
- Avoid auto-playing animations
- Keep animations under 5 seconds
- No flashing content (>3 per second)

---

## Discoverability Patterns for E2E Testing

### Standard data-testid Naming

| Element Type | Pattern | Example |
|--------------|---------|---------|
| Layout region | `main-{region}` | `main-sidebar`, `main-content` |
| Navigation | `nav-{name}` | `nav-primary`, `nav-item-home` |
| Button (action) | `{action}-btn` | `submit-btn`, `cancel-btn` |
| Button (entity) | `{entity}-{action}-btn` | `user-delete-btn` |
| Input | `{field}-input` | `email-input`, `search-input` |
| Form | `{name}-form` | `login-form` |
| Card/Item | `{type}-item-{id}` | `task-item-123` |
| Modal | `{name}-modal` | `confirm-modal` |
| Toggle | `{name}-toggle` | `theme-toggle` |
| Status | `{name}-status` | `connection-status` |

### Theme State Exposure

```html
<!-- Root element exposes theme state -->
<html data-theme="light">
  <!-- or -->
<body data-theme="dark">
```

```javascript
// Queryable via E2E
document.documentElement.getAttribute('data-theme')
// Returns: "light" | "dark"
```

### CSS Variable Verification

```javascript
// E2E can verify design tokens are applied
const root = document.documentElement;
const styles = getComputedStyle(root);

// Check specific tokens
styles.getPropertyValue('--color-accent'); // "#3b82f6"
styles.getPropertyValue('--font-heading'); // "'Inter', sans-serif"
```

### Snapshot-Friendly Structure

```html
<!-- Good: Semantic, testable -->
<div data-testid="card-item-123" data-status="active">
  <h3 data-testid="card-123-title">Card Title</h3>
  <p data-testid="card-123-description">Description text</p>
  <button data-testid="card-123-action">View</button>
</div>

<!-- Bad: No testability -->
<div class="card active">
  <h3>Card Title</h3>
  <p>Description text</p>
  <button>View</button>
</div>
```

### State Attributes

```html
<!-- Expose state in DOM for easy verification -->
<button
  data-testid="submit-btn"
  data-loading="true"
  disabled
>
  Submitting...
</button>

<div
  data-testid="form-section"
  data-expanded="false"
>
  ...
</div>
```

---

## Preview Template Code

Base HTML template for generating previews:

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - {aesthetic} + {layout}</title>
  <style>
    /* CSS Custom Properties */
    :root {
      /* Primitives */
      --white: #ffffff;
      --black: #000000;
      /* ... */

      /* Semantic - Light */
      --color-bg-primary: /* value */;
      --color-bg-secondary: /* value */;
      --color-text-primary: /* value */;
      --color-text-secondary: /* value */;
      --color-accent: /* value */;
      /* ... */

      /* Typography */
      --font-heading: /* value */;
      --font-body: /* value */;
      /* ... */
    }

    [data-theme="dark"] {
      --color-bg-primary: /* dark value */;
      /* ... overrides */
    }

    /* Base styles */
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-body);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      line-height: 1.5;
    }

    /* Theme toggle */
    .theme-toggle {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 100;
    }

    /* Typography showcase */
    /* Color palette display */
    /* Component samples */
    /* Layout grid */
  </style>
</head>
<body>
  <!-- Theme Toggle -->
  <button
    data-testid="theme-toggle"
    class="theme-toggle"
    onclick="toggleTheme()"
  >
    Toggle Theme
  </button>

  <!-- Preview Content -->
  <main data-testid="main-content">
    <!-- Typography Section -->
    <section data-testid="typography-section">
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <p>Body text paragraph...</p>
      <small>Small text</small>
      <code>Code sample</code>
    </section>

    <!-- Color Palette Section -->
    <section data-testid="color-palette">
      <div data-testid="color-bg-primary">Background Primary</div>
      <div data-testid="color-accent">Accent</div>
      <!-- ... more colors -->
    </section>

    <!-- Component Samples Section -->
    <section data-testid="components-section">
      <button data-testid="btn-primary" class="btn btn-primary">Primary Button</button>
      <button data-testid="btn-secondary" class="btn btn-secondary">Secondary Button</button>
      <input data-testid="sample-input" type="text" placeholder="Input field">
      <div data-testid="sample-card" class="card">Card component</div>
    </section>

    <!-- Layout Demo Section -->
    <section data-testid="layout-section">
      <!-- Layout-specific content -->
    </section>
  </main>

  <script>
    function toggleTheme() {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      html.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
    }
  </script>
</body>
</html>
```

---

## See Also

- Parent: `SKILL.md` - Main ui-planner skill documentation
- `/ux-planner` - User experience and interaction patterns
- `/ux-review` - UX review and verification
- `/create-task` - Implementation task creation
