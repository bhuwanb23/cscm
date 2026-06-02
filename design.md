---
name: Neural Pulse
colors:
  primary: "#0a0a12"
  on-primary: "#e8e8ed"
  accent: "#06b6d4"
  muted: "#63637a"
typography:
  headline:
    fontFamily: Fraunces
    fontSize: 3.5rem
    fontWeight: 800
    letterSpacing: -0.03em
  body:
    fontFamily: Space Grotesk
    fontSize: 1rem
    fontWeight: 400
lineHeight: 1.5
rounded:
  md: 4px
spacing:
  md: 24px
  lg: 16px
motion:
  energy: moderate
  easing:
    entry: "power3.out"
    exit: "power4.in"
    ambient: "sine.inOut"
  duration:
    entrance: 0.6
    hold: 2.0
    transition: 0.8
  atmosphere:
    - radial-glow
    - grid-lines
    - particle-field
  transition: cinematic-zoom
---

## Overview

Dark canvas with cyan electric accent — the AI-native palette for intelligent systems. Data-dense with pulse animations, neon highlights, and grid structures. For the Cognitive Supply Chain Mesh demo: precision meets intelligence.

## Colors

- **Primary** (`#0a0a12`) — Deep navy-black canvas background
- **On-Primary** (`#e8e8ed`) — Slightly warm white text and content
- **Accent** (`#06b6d4`) — Cyan electric for CTAs, highlights, data emphasis
- **Muted** (`#63637a`) — Cool gray-purple for secondary text and metadata

## Typography

- **Headline** — Fraunces at weight 800. Variable serif with personality — authoritative yet warm. For big statements and stat callouts.
- **Body** — Space Grotesk at weight 400. Clean geometric sans for reading text, labels, data labels.

## Layout

- Structure: Data Grid — metric-driven layout with stat callouts, data cards, and counters
- Density: Normal (balanced spacing)
- Corners: Slight (4px rounded)
- Padding: 24px content padding, 16px gaps

## Elevation

Subtle — faint shadows on cards and data panels. Depth through glow effects, not heavy drop shadows.

## Motion

- **Entry easing:** `power3.out` — confident, smooth deceleration
- **Exit easing:** `power4.in` — aggressive exit, snaps out
- **Ambient:** `sine.inOut` — breathing/glow pulses
- **Energy:** Moderate — nothing frantic, everything intentional

## Components

- Data cards: dark glass (`background: rgba(255,255,255,0.03)`), 1px border (`rgba(255,255,255,0.08)`), 4px radius
- Stats: 56-80px Fraunces, cyan accent, tabular-nums
- Dividers: hairline rules at `rgba(255,255,255,0.06)`
- Glow accents: cyan radial gradients behind key elements
- Grid: subtle dot grid or hairline grid background layer

## Do's and Don'ts

### Do's
- Use cyan accent sparingly for maximum impact — data highlights, CTAs, pulse indicators
- Maintain consistent 4px corners across all cards and containers
- Tint all mid-tones slightly cool (toward the blue-purple accent family)
- Use tabular-nums on all stat values
- Layer content: grid background → data cards → glow accents → foreground text

### Don'ts
- Do not mix multiple accent colors — cyan is the single accent
- Do not use pure white (#fff) or pure black (#000) — tint toward the palette
- Do not use heavy drop shadows — use glow instead
- Do not center everything — anchor content to left/top with data flowing naturally
