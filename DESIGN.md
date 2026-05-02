---
name: Kaheteyn
description: Arabic-language RTL orphan sponsorship management system with Palestinian brand identity
---

# Design System: Kaheteyn

## 1. Overview

**Creative North Star: "The Trusted Register"**

This design system is a bound book of records: unadorned but dignified. Pages turn predictably. You trust it because nothing is flashy, because the format never changes unexpectedly, because every entry is given the same careful weight. The interface disappears into the work. Charity administrators processing sponsorship files should never pause to think about the interface itself.

The register is built on restraint. Palestinian identity is present in color (olive green, ember red, ink black) and language (Arabic throughout, RTL as structural foundation), never in decoration. Every surface is flat or near-flat. Every corner is sharp (0px radius on cards, buttons, inputs). Typography uses one family at a compact scale. The palette is narrow: one green accent, one red for danger, and achromatic neutrals. This is a Restrained color strategy by doctrine, not default.

What this system explicitly rejects: SaaS dashboard clichés with gradient hero metrics. Donation platforms with emotional imagery. Consumer apps with playful illustrations. Western admin panels that bolt on RTL as an afterthought.

**Key Characteristics:**

- Sharp corners everywhere (0px radius on all interactive and structural elements)
- Single-family Arabic typography (Tajawal) at a compact, data-dense scale
- Restrained palette: olive green accent on ≤10% of any given surface
- Flat elevation: tonal layering via background lightness, no drop shadows on content cards
- RTL-first layout using logical properties (`start`/`end`, `ps`/`pe`)

## 2. Colors

The palette is narrow and intentional. Three brand anchors from the Palestinian flag, extended into semantic roles through lightness shifts. No secondary or tertiary accent colors. Charts use the full 5-token palette; the interface uses two.

### Primary

- **Olive Guardian** (oklch(0.62 0.18 145)): The single accent. Used on primary buttons, active sidebar items, focus rings, the monthly trend chart bars, and the logo's vertical stroke. It carries the brand's trust signal. Present on ≤10% of any screen area. In dark mode it lightens to **Jade Lantern** (oklch(0.7 0.16 145)) to maintain contrast.

### Destructive

- **Ember Authority** (oklch(0.6 0.22 27)): Used exclusively for error states, destructive action buttons (tinted at 10-20% background), the confirm dialog's destructive variant, and the logo's curved accent dot. Never decorative. In dark mode it lightens to **Coral Signal** (oklch(0.7 0.19 22)).

### Neutral

- **Ink Foundation** (oklch(0.18 0 0)): Body text, headings, the logo wordmark. Near-black without being pure black.
- **Parchment Surface** (oklch(0.99 0 0)): Page background. Near-white with no chromatic tint.
- **Bone Page** (oklch(1 0 0)): Card surfaces and popover backgrounds. Pure white for layer separation.
- **Mist Muted** (oklch(0.96 0 0)): Secondary backgrounds, muted hover states, table header bands. Slightly darker than the page to create tonal layering without shadows.
- **Storm Charcoal** (oklch(0.16 0 0)): Dark mode page background.
- **Stone Border** (oklch(0.9 0 0)): Input borders, card outlines, dividers. Light gray with no chromatic cast.

### Accent Surface

- **Sage Whisper** (oklch(0.95 0.01 145)): A barely-perceptible green tint used for sidebar hover states and accent backgrounds. Carries the brand hue at near-neutral chroma. Creates visual continuity without asserting color.

### Chart Palette

Five tokens for data visualization only: Olive Guardian (green), Ember Authority (red), Ink Foundation (dark), **Deep Teal** (oklch(0.7 0.12 200)), **Burnt Amber** (oklch(0.5 0.18 60)). Charts never use colors outside this set.

**The One Accent Rule.** Olive Guardian is the only saturated color permitted on interactive surfaces. It appears on primary buttons, active states, and focus rings. Ember Authority appears only for destructive/error semantics. No other saturated colors exist in the interface palette.

**The Zero Chromatic Neutrals Rule.** All neutrals (Parchment Surface, Mist Muted, Stone Border, Ink Foundation) are achromatic (chroma 0). The only tinted neutral is Sage Whisper (chroma 0.01, hue 145), which is restricted to accent backgrounds and hover states. This keeps the register visually quiet.

## 3. Typography

**Font:** Tajawal (Google Fonts, weights 400/500/700/900) with system-ui fallback.
**Scope:** Single family for all roles: display, headings, body, labels, data, buttons. No display/body pairing. Tajawal is a humanist Arabic sans designed for UI readability at small sizes.

**Character:** Warm but not soft. The slightly rounded terminals of Tajawal's Arabic letterforms give the interface a humane quality without sacrificing the precision a register demands. Latin characters (codes like "CH-0001", amounts like "$100.00") fall back to system-ui, maintaining neutrality for data that mixes scripts.

### Hierarchy

- **Headline** (700, 1.5rem/24px, line-height 1.3): Page titles ("الرئيسية", "الأطفال"). One per page, always at the top of the content area.
- **Title** (700, 0.875rem/14px, line-height 1.4): Card titles ("مركز التنبيهات"), section headings within pages. The workhorse heading.
- **Body** (400, system default/14px, line-height 1.6): All running text, table cell content, descriptions, form field values. Capped at comfortable reading width in prose contexts.
- **Label** (500, 0.75rem/12px, line-height 1): Form labels, KPI metric labels, badge text, version numbers, auxiliary timestamps. Always compact. Never wraps.

### Arabic-Specific Behavior

- All body text and labels are in Arabic. Latin text appears only in data codes (IDs like "CH-0001"), currency amounts ("$100.00"), and technical fields.
- Inputs for codes and amounts use `dir="ltr"` to prevent bidirectional layout issues.
- Font weights 700 and 900 create clear hierarchy steps in Arabic without relying on size alone.

**The One Family Rule.** Tajawal is the only font. No display fonts, no mono fonts for data, no icon fonts. Icons are inline SVG via Lucide. Weight and size create hierarchy; the family stays constant.

## 4. Elevation

This system uses tonal layering, not shadows. Depth is conveyed through background lightness shifts: Parchment Surface (0.99) beneath Bone Page (1.0) beneath Mist Muted (0.96) for table headers. Cards sit on the page with a 1px ring (`ring-1 ring-foreground/10`) that separates them from the background without visual weight.

The only shadow in the system appears on floating elements: dialog popups and dropdown menus use `shadow-md` for context. Content cards never use shadows. The login card uses `shadow-sm` as the sole exception on an isolated, centered surface.

Dark mode inverts the layering: Storm Charcoal (0.16) as background, slightly lighter surfaces for cards (0.21), with `ring-1` outlines using white at 12% opacity.

**The Flat Content Rule.** Content areas are flat. Shadows are reserved for elements that float above the page surface: dialogs, dropdowns, and popovers. If a shadow appears on a card that sits in the normal document flow, it is wrong.

## 5. Components

Every component is sharp-cornered (0px radius) by default. The only rounded elements are badges (full/pill radius) and the login card (rounded-xl, the single decorative surface in the system). Dropdown menus also inherit sharp corners. This creates a register-like angularity across the entire interface.

### Buttons

- **Shape:** Sharp corners (0px radius). Compact height (32px default, 24px xs, 28px sm, 36px lg). Gap between icon and label is 6px default, 4px for xs/sm.
- **Primary:** Olive Guardian background, Parchment Surface text. No border. Hover fades to 80% opacity. Focus shows a 1px ring in Olive Guardian at 50% opacity.
- **Outline:** White background, Ink Foundation text, Stone Border stroke. Hover shifts to Mist Muted background. Same focus ring.
- **Ghost:** Transparent background. Hover fills with Mist Muted. Used for sidebar inactive items, tool actions.
- **Destructive:** Ember Authority at 10% tint as background, full Ember Authority text. Hover shifts to 20% tint. Focus ring in Ember Authority at 20%. Never a solid red button.
- **Link:** Olive Guardian text with underline on hover. Used for navigation links in data tables.
- **Disabled:** 50% opacity, no pointer events. Applied consistently across all variants.
- **Loading:** Text changes to "جاري..." prefix, button becomes disabled. No spinner inside buttons.

### Badges

- **Shape:** Pill (rounded-full, 9999px radius). The only consistently rounded component. Compact: 2px vertical padding, 8px horizontal.
- **Variants:** Six semantic variants. Default (Mist Muted bg, Ink Foundation text), Success (emerald tint), Warning (amber tint), Destructive (red tint), Info (sky tint), Outline (transparent with border). Each uses a 15% opacity background with the semantic color's text. Always includes an Arabic text label alongside color.

### Cards

- **Shape:** Sharp corners (0px radius). No shadow on content cards. Separation via `ring-1 ring-foreground/10` (a 1px subtle outline).
- **Background:** Bone Page (pure white). In dark mode: slightly lighter than the page background.
- **Padding:** 16px default (py-4 px-4). Small variant at 12px (py-3 px-3).
- **Structure:** CardHeader (grid layout, gap 4px, optional CardAction in top-end), CardTitle (14px, 500 weight), CardDescription (12px, muted-foreground), CardContent (16px horizontal padding), CardFooter (border-top, 16px padding).
- **No nested cards.** Card inside Card is always wrong. Use tonal surfaces or simple bordered divs for inner grouping.

### Inputs

- **Shape:** Sharp corners (0px radius). Height 32px. Transparent background. Stone Border stroke (1px).
- **Focus:** Border shifts to Olive Guardian with a 1px ring at 50% opacity. The only visible state change.
- **Error:** Border shifts to Ember Authority with a 1px ring at 20% opacity.
- **Disabled:** 50% opacity, no pointer events, Mist Muted background.
- **Text size:** 12px (text-xs). Compact to match the register's data-dense posture.
- **RTL handling:** Username and password fields use `dir="ltr"` to prevent bidirectional layout issues with Latin characters.

### Tables

- **Header:** Mist Muted background at 40% opacity (`bg-muted/40`). 40px row height. Muted foreground text, medium weight.
- **Body rows:** White background. 1px bottom border. Hover fills with Mist Muted at 50%. 12px cell padding.
- **No zebra striping.** Alternating row colors add noise without improving scanability in a data register.

### Navigation (Sidebar)

- **Shape:** Fixed left (in RTL: right) sidebar, 256px width. Full viewport height. Sticky. Stone Border right-side (in RTL: left-side) border.
- **Active item:** Olive Guardian background, Parchment Surface text. Instant color swap, no transition on the background change.
- **Inactive item:** Transparent background. Hover fills with Sage Whisper (green-tinted accent).
- **Icons:** 16px Lucide SVGs. Same size for all items. Muted foreground when inactive, inherited from parent when active.
- **Footer:** Border-top separator. Version label in label typography. Sign-out button as a ghost-style text button.
- **Mobile:** Hidden on small screens (marked `no-print` for print). Collapses via browser responsiveness, no separate mobile nav pattern yet.

### Confirm Dialog

- **Backdrop:** Black at 60% opacity. Click-to-dismiss.
- **Panel:** Bone Page background, 12px radius (rounded-lg), shadow-lg. Max width 448px. Centered.
- **Actions:** Reversed flex direction (`flex-row-reverse`) to place the primary action on the leading (right in RTL) side. Destructive variant swaps the primary button to Ember Authority.
- **Not a modal-first pattern.** Used only for irreversible actions (delete child, delete sponsor, force-remove with cascading payments).

### File Upload

- **Empty state:** Dashed border input area. Stone Border stroke, dashed style. Mist Muted foreground text.
- **Filled state:** Inline thumbnail (64px square for images) or PDF link. "Replace" and "Remove" as text links. Replace in Olive Guardian, Remove in Ember Authority.
- **Error:** 12px Ember Authority text below the field. Shows file size limit message.

### Toast (Sonner)

- **Position:** Top center. RTL-aware.
- **Icons:** Lucide status icons (check, alert triangle, info, octagon-x, spinner).
- **Theme:** Follows system dark/light preference. Uses CSS custom properties for background and text.

## 6. Do's and Don'ts

### Do:

- **Do** keep Olive Guardian under 10% of any screen surface area. It is an accent, not a theme color. The register is predominantly achromatic.
- **Do** use sharp corners (0px radius) on all cards, buttons, inputs, dropdowns, and checkboxes. The angular posture is structural, not decorative. It signals precision.
- **Do** provide text labels on every badge and status indicator. Color alone must not convey meaning. "خطر" (critical) alongside red, not just red.
- **Do** use `dir="ltr"` on any input field that accepts Latin characters (codes, amounts, usernames). Bidirectional text handling is a correctness requirement, not a nice-to-have.
- **Do** use tonal background shifts (Mist Muted, Sage Whisper) for depth instead of shadows on content elements. Shadows are for floating elements only.
- **Do** maintain the one-family rule. Tajawal at all weights and sizes. No second font for any purpose.
- **Do** keep the component vocabulary consistent across every screen. Same button shape, same input shape, same card shape. Muscle memory is the goal.

### Don't:

- **Don't** use a SaaS dashboard with hero metrics and gradient accents. This is a register, not a marketing surface. (PRODUCT.md anti-reference.)
- **Don't** use donation platform patterns with emotional imagery or fundraising theatrics. The work is serious and the interface respects that. (PRODUCT.md anti-reference.)
- **Don't** use consumer app patterns: playful illustrations, onboarding gamification, or decorative motion. (PRODUCT.md anti-reference.)
- **Don't** use western-style admin panel patterns that ignore RTL and Arabic typography. RTL is structural (`start`/`end` logical properties, `dir="rtl"` at the HTML root), not a CSS flip. (PRODUCT.md anti-reference.)
- **Don't** apply border-left or border-right greater than 1px as a colored accent stripe on cards, list items, or alerts. Use full borders, background tints, or nothing. (Shared absolute ban.)
- **Don't** use gradient text (`background-clip: text`). Use weight or size for emphasis.
- **Don't** use glassmorphism or blur effects on any surface.
- **Don't** nest cards inside cards. Use tonal surfaces or bordered divs for inner grouping.
- **Don't** use display fonts in UI labels, buttons, or data. Tajawal at appropriate weight is sufficient.
- **Don't** add decorative motion that does not convey state. 150-250ms transitions for state changes only. No page-load choreography.
- **Don't** use the same-sized card grid with icon+heading+text repeated endlessly. Vary layout density and structure to match content purpose.
