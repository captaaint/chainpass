---
name: ChainEvents Operational Console
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#07006c'
  on-tertiary-container: '#7073ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-sm:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding-desktop: 32px
  container-padding-mobile: 16px
  gutter: 16px
  stack-compact: 8px
  stack-default: 16px
  stack-loose: 24px
---

## Brand & Style
The design system is engineered for high-efficiency event operations and blockchain-integrated ticketing. The brand personality is rooted in reliability, technical precision, and functional clarity. It avoids decorative "fluff" in favor of an operational aesthetic that prioritizes data density and task completion.

The visual style is **Corporate / Modern** with a lean toward **Minimalism**. It utilizes a systematic approach to information architecture, ensuring that event coordinators can manage complex datasets without cognitive overload. The UI evokes an emotional response of "controlled efficiency"—users should feel that the system is powerful, stable, and transparent, particularly regarding on-chain transactions and ticket inventory.

## Colors
The palette is professional and grounded.
- **Primary (Deep Slate):** Used for global navigation, sidebars, and primary headings to establish a strong structural foundation.
- **Secondary (Vibrant Teal):** Reserved for primary action buttons, progress indicators, and interactive states to provide high-contrast "affordance" in dense views.
- **Tertiary (Electric Indigo):** Used for specialized technical indicators, such as Web3 wallet connections or network status.
- **Neutrals:** A range of Cool Grays (Slate) used for borders, secondary text, and surface backgrounds to maintain a clean, organized hierarchy.
- **Functional Colors:** Explicit Success (Emerald), Error (Rose), and Warning (Amber) colors are used for transaction feedback, ensuring users can instantly distinguish between confirmed and failed on-chain events.

## Typography
This design system utilizes **Inter** for all standard UI elements due to its exceptional legibility at small sizes and high x-height. For technical data—such as Wallet Addresses, Transaction Hashes, and Seat Codes—**JetBrains Mono** is employed to provide a clear distinction between narrative content and technical strings.

The scale is intentionally compact to support "data-heavy" dashboard views. Leading (line-height) is kept tight but comfortable to maximize vertical space. On mobile devices, `display-sm` and `headline-lg` should be reduced by 15% in size to maintain optical balance.

## Layout & Spacing
The design system uses a **Fluid Grid** model based on a 4px baseline unit. 

- **Desktop:** 12-column grid with 16px gutters. Main content areas use a sidebar-controlled layout where the sidebar is fixed at 240px and the dashboard area expands.
- **Tablet:** 8-column grid with 16px gutters.
- **Mobile:** 4-column grid with 12px gutters.

Spacing is optimized for high-density information. Tables should use a "Compact" vertical padding (8px) by default. Information blocks should be grouped using a logical hierarchy of 8px (related items), 16px (standard groups), and 24px (major sections).

## Elevation & Depth
Depth is conveyed primarily through **Tonal Layers** and **Low-Contrast Outlines**. 

The design system avoids heavy shadows. Instead:
- **Surface Level 0:** The main background color (#F8FAFC).
- **Surface Level 1:** White (#FFFFFF) cards or containers, defined by a subtle 1px border (#E2E8F0).
- **Surface Level 2:** Modals or fly-outs use a very soft, high-diffusion shadow (0px 4px 12px rgba(0,0,0,0.05)) to suggest elevation above the main dashboard.

Interactive elements (buttons, inputs) utilize a slight hover state transition (border color change or slight background darken) rather than an elevation lift, maintaining the flat, operational aesthetic.

## Shapes
The shape language is **Soft**. 
- Standard components (buttons, inputs, cards) use a 4px (`0.25rem`) corner radius.
- Larger containers like main dashboard panels or modal dialogs use 8px (`0.5rem`).
- **Status Badges** and **Network Indicators** may use a fully rounded "pill" shape (9999px) to distinguish them from interactive buttons.

This subtle rounding maintains a professional, software-like feel that is more approachable than sharp corners but more serious than highly rounded "consumer" apps.

## Components
- **Buttons:** Primary buttons use a solid Secondary (Teal) background with White text. Secondary buttons use a Slate border with Slate text. Utility buttons (Icon-only) are used for table actions.
- **Tables & Lists:** The core of the console. Tables feature sticky headers, zebra striping on hover, and high-contrast text for key data points. 
- **Status Badges:** Compact labels with low-opacity background tints (e.g., Success is Emerald text on 10% opacity Emerald background).
- **Cards (Tickets):** Used for individual ticket views. They include a monospaced Seat/ID section and a QR code placeholder.
- **Network Status:** A dedicated component in the top navigation showing the current blockchain (e.g., "Polygon Mainnet") with a Tertiary (Indigo) pulse indicator.
- **Input Fields:** Minimalist style with a 1px border. On focus, the border transitions to the Secondary (Teal) color with a 2px outer glow of the same color at 10% opacity.
- **Wallet Connection:** A distinct button in the header that displays a truncated address (e.g., 0x12...34) using the Monospace font label.