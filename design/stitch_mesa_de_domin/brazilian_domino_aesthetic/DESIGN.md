---
name: Brazilian Domino Aesthetic
colors:
  surface: '#f9faf5'
  surface-dim: '#d9dbd6'
  surface-bright: '#f9faf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4ef'
  surface-container: '#edeee9'
  surface-container-high: '#e7e9e4'
  surface-container-highest: '#e1e3de'
  on-surface: '#191c19'
  on-surface-variant: '#414942'
  inverse-surface: '#2e312e'
  inverse-on-surface: '#f0f1ec'
  outline: '#717971'
  outline-variant: '#c1c9bf'
  surface-tint: '#376847'
  primary: '#00361a'
  on-primary: '#ffffff'
  primary-container: '#1b4d2e'
  on-primary-container: '#89bd95'
  inverse-primary: '#9ed3aa'
  secondary: '#7c572d'
  on-secondary: '#ffffff'
  secondary-container: '#fecb97'
  on-secondary-container: '#79542a'
  tertiary: '#45260f'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e3c23'
  on-tertiary-container: '#d7a787'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b9efc5'
  primary-fixed-dim: '#9ed3aa'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#1e5031'
  secondary-fixed: '#ffdcbc'
  secondary-fixed-dim: '#efbd8a'
  on-secondary-fixed: '#2c1700'
  on-secondary-fixed-variant: '#614018'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#efbc9b'
  on-tertiary-fixed: '#2f1502'
  on-tertiary-fixed-variant: '#623f25'
  background: '#f9faf5'
  on-background: '#191c19'
  surface-variant: '#e1e3de'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  piece-gap: 4px
---

## Brand & Style

This design system captures the soulful, communal atmosphere of a traditional Brazilian *boteco*. It prioritizes a **Tactile and Modern** aesthetic, moving away from flat digital interfaces toward a physical, "lived-in" experience. The design evokes the sensory details of a high-end domino table: the weight of ivory tiles, the softness of billiard-grade felt, and the warmth of polished wood.

The target audience is social and multi-generational, requiring an interface that feels both premium and approachable. The emotional response should be one of relaxed focus and nostalgic comfort. Key visual drivers include subtle skeuomorphism, haptic-inspired depth, and organic textures that make the digital screen feel like a physical tabletop in the heart of Rio or São Paulo.

## Colors

The palette is rooted in natural, earthy tones that define the Brazilian bar experience.

- **Primary (Deep Forest Green):** Used primarily for the "felt" of the game board. It provides a high-contrast, low-strain backdrop for the pieces.
- **Accents (Amber Gold & Rich Wood):** These colors represent the environment—the beer, the furniture, and the warmth of the lighting. Wood brown is used for structural frames and containers.
- **Background (Soft Cream):** A breathable, organic base used for menus and non-game surfaces, preventing the interface from feeling overly heavy.
- **Pieces (Ivory & Navy):** A classic pairing. The ivory isn't a pure white, but a warm, aged bone color, while the navy pips provide a sharp, legible focus point.

## Typography

This design system utilizes **Plus Jakarta Sans** (an evolution of the requested modern geometric style) to provide a friendly yet sophisticated tone. 

Bold weights are used aggressively for game states and scores to ensure readability in casual, potentially distracted environments. The Portuguese language often features longer word lengths than English; therefore, the typography scale accounts for horizontal expansion in button labels and headers. Headlines use a tighter letter-spacing to maintain a "heavy" and impactful feel, reminiscent of traditional bar signage.

## Layout & Spacing

The layout follows a **Fluid Grid** model for the gaming table and a **Fixed Grid** for administrative menus. 

1. **The Table:** The primary game area stretches to fill the viewport, utilizing a "Safe Margin" of 20px to prevent tiles from touching the screen edges. Pieces are spaced with a 4px "physical gap" to simulate how they sit on a felt surface.
2. **The HUD (Interface):** Player stats and scores are anchored to the corners, using a 12-column grid on desktop and a 4-column grid on mobile. 
3. **Menu Flow:** Modals and menus are centered with generous padding (32px+) to maintain the "relaxed" vibe of the brand. Vertical rhythm is strictly based on an 8px baseline grid to ensure alignment of tactile elements.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering**. 

- **Level 0 (The Table):** The base green felt, featuring a subtle inner-shadow to create a "recessed" look within the wooden frame.
- **Level 1 (The Pieces):** Dominoes sit atop the felt with a soft, multi-layered drop shadow (`0px 4px 10px rgba(0,0,0,0.3)`) and a very slight 1px top-highlight to simulate overhead bar lighting.
- **Level 2 (UI Panels):** Cards and menus use the Rich Wood brown as a border or the Soft Cream as a surface, with a deeper shadow to indicate they are floating above the game board.
- **Interactive States:** Buttons use a "pressed" effect where the shadow Y-offset reduces and a subtle inner-shadow appears, mimicking a physical click.

## Shapes

The shape language is defined by a consistent "soft-touch" philosophy.

- **Domino Tiles:** Must strictly use an **8px corner radius**. This creates the signature "weighted" look of high-quality resin tiles.
- **Buttons and Containers:** Follow the `rounded-lg` (16px) or `rounded-xl` (24px) standard to maintain a friendly, approachable aesthetic. 
- **Pips:** Pips on the tiles are circular and slightly recessed using a tiny inner-glow to suggest depth within the ivory material. 
Avoid sharp 90-degree angles entirely to keep the "Casual/Friendly" vibe.

## Components

### Boteco Buttons
Primary buttons use the **Amber Gold (#D4A574)** with a subtle linear gradient (lighter at the top). Text is always bold. The hover state adds a soft glow, while the active state "sinks" into the page.

### Domino Tiles (Peças)
The hero component.
- **Surface:** Ivory (#FFFFF0) with a faint noise texture.
- **Center Line:** A 1px recessed line in #D4A574 separating the two halves.
- **Pips:** Deep Navy (#000080), circular, with a subtle 5% opacity inner shadow.

### Scoreboard (Placar)
Housed in a **Rich Wood (#5C3A21)** container with a cream-colored inset. Uses **Plus Jakarta Sans Bold** for maximum legibility of the score.

### Choice Chips (Opções)
Used for selecting game modes (e.g., *Double 6*, *Tournament*). These should look like small wooden tokens, turning Green (#1B4D2E) when selected.

### Modals (Avisos)
Soft Cream (#F5F0E8) background with a thick 4px Rich Wood border. Transitions should be smooth and "heavy," mimicking a physical board being placed on a table.

### Feedback Haptics (Visual)
Every interaction (like playing a tile) should trigger a brief visual scale-up/down animation to simulate the physical weight and haptic feedback of the game.