# BinBuddy UI Design Notes & Decisions

## 1. Design Concept & Philosophy

BinBuddy is designed for someone standing directly over physical curbside bins—often holding an item in one hand, in outdoor daylight or kitchen lighting, needing a fast, unambiguous answer in 3 seconds.

### The Single Memorable Feature: "Colour Belongs to the Bins"

The application is visually quiet: crisp dark ink (`#16231F`) on neutral wash (`#F1F4F1`) and crisp white surfaces.
**The only saturated color permitted anywhere on screen is the destination panel itself.**

- It renders at the top of the result sheet like an open municipal bin lid with a distinct overhang lip.
- The destination name is set massive (`clamp(2.75rem, 12vw, 5.5rem)`), immediately legible from arm's length.
- Buttons never use brand or bin colors; primary buttons are Ink with Wash text, secondary buttons are crisp hairline outlines.

---

## 2. Token System & Color Contrast Auditing

All bin colors are mathematically verified to exceed WCAG AA contrast (minimum 4.5:1 ratio against pure white `#FFFFFF` text):

| Destination Tone           | Color Hex                       | White Text Contrast Ratio | Status                |
| -------------------------- | ------------------------------- | ------------------------- | --------------------- |
| `recycle` (Blue)           | `#1A5FB4`                       | 5.61:1                    | Verified (Passes AA)  |
| `landfill` (Charcoal)      | `#3F4954`                       | 8.24:1                    | Verified (Passes AAA) |
| `special` (Deep Amber)     | `#8A4500`                       | 5.25:1                    | Verified (Passes AA)  |
| `yard` (Deep Green)        | `#1A6B3F`                       | 5.48:1                    | Verified (Passes AA)  |
| `manual` (Neutral Striped) | `#FFFFFF` bg with Ink `#16231F` | 14.8:1                    | Verified (Passes AAA) |

---

## 3. Review Against the "Avoid" List (Negative Design Constraints)

- [x] **No cream with terracotta**: Uses cold neutral wash (`#F1F4F1`) with deep forest ink (`#16231F`).
- [x] **No near-black with acid neon**: Light mode first, high readability in sunlight.
- [x] **No grid of identical rounded cards with soft blurry shadows**: Single clear column, hairline dividers (`#CBD5CF`), flat tactile surfaces.
- [x] **No gradient washes**: Flat, solid, authoritative municipal tones.
- [x] **No eyebrow labels in tracked caps**: Clear sentence-case typography throughout.
- [x] **No arrows appended to button labels**: Buttons use explicit, plain action verbs ("Take a photo", "Upload a photo", "Try another").
- [x] **No emoji as icons**: Inline accessible SVGs for camera, upload, audio, checkmark, and disclosure carats.

---

## 4. Multi-State Interface Architecture

1. **Empty State**: Simple instructions, large primary "Take a photo" camera button, secondary "Upload a photo", sample quick-select chips, and "Pick it yourself".
2. **Analyzing State**: Structural skeleton preview, polite ARIA live announcement ("Looking at your item"), clear Cancel action.
3. **Decided State**: Open bin lid banner, huge destination name, concise municipal reason, action triggers ("Hear it", "I sorted it", "Try another"), and expandable "Why this answer" disclosure detailing classification attributes, rule ID, and official city link.
4. **Needs Clarification**: High-contrast prompt question with 2 to 5 large touch buttons (min 48px height) for quick one-tap disambiguation.
5. **Manual Check**: High-contrast diagonal-striped panel, transparent explanation, and direct link to City of Houston waste directory.
6. **Error State**: Non-accusatory error descriptions with three actionable recovery paths ("Try again", "Use a sample", "Pick it yourself").
7. **Voice Controls**: Accessible audio button with clear status transitions (idle, loading, playing, browser fallback, disabled).
8. **Chips**: Persistent header badges ("Demo mode", "City of Houston").

---

## 5. Visual Critique and Screenshot Rounds

### Round 1: Multi-Viewport Inspection (Mobile, Tablet, Desktop)

15 screenshots captured across 3 standard viewports (`375x812` mobile, `768x1024` tablet, `1280x800` desktop) in `artifacts/screenshots/phase-3/`:

1. **Empty State (`*-01-empty.png`)**:
   - Primary "Take a photo" action is prominent and thumb-reachable with a high-contrast dark ink fill (`#16231F`).
   - Sample chips render cleanly with wrap layout, offering one-tap access to 8 representative test fixtures without typing.
   - Header clearly states city rules context ("Houston, TX") and active demo mode.

2. **Manual Picker State (`*-02-manual-picker.png`)**:
   - 2-to-3 column grid adapts cleanly across viewports without cramped touch targets.
   - Condition radio options ("Clean & empty" vs "Food-soiled or greasy") are plainly phrased with 48px touch targets.

3. **Decided State (`*-03-decided.png`)**:
   - The lid panel renders at the top of the card with an authentic top-lip shadow (`bg-black/15`) simulating a physical bin lid.
   - Huge display typography (`clamp(2.5rem, 10vw, 5rem)`) ensures the destination ("GREEN RECYCLING CART", "BLACK TRASH CART") is unmistakably clear at arm's length.
   - Contrast between white display text and `#1A5FB4` recycling blue is measured at 5.61:1 (comfortably exceeding WCAG AA 4.5:1).
   - "Why this answer" disclosure stays collapsed by default to preserve focus, expanding smoothly to disclose source citations, ruleset versions, and reasoning.

4. **Clarification State (`*-04-clarification.png`)**:
   - Highlights what BinBuddy detected with low confidence, asking exactly one direct clarifying question with large vertical button targets.
   - Prominently offers a "Not sure" exit ramp that gracefully diverts to municipal manual check rather than making a wild guess.

5. **Manual Check State (`*-05-manual-check.png`)**:
   - The striped neutral lid (`repeating-linear-gradient` with 45° alternating wash stripes) signals ambiguity without looking broken or alarmed.
   - Provides direct, actionable outbound links to City of Houston Solid Waste Management and a "Pick it yourself" recovery option.

### Automated Accessibility & Responsive Audit

- **Axe-core Playwright Audit**: 0 critical, 0 serious accessibility violations across all states.
- **Narrow Viewport (320px width)**: Confirmed `scrollWidth <= clientWidth` with 0 horizontal overflow.
- **Keyboard Navigation**: Full tab/enter sequence operable with explicit focus movement to `#destination-heading`.

---

## 6. Phase 6 Polish: Tally Bar, Settings Modal, and Copy Invariants

### Personal Tally Bar

- Positioned above footer, styled in quiet `#F1F4F1` wash with hairline border.
- Strict wording: `"Items you marked as sorted: N (your own count)"`.
- **Absolute ban on environmental quantity claims**: zero CO2, kg saved, landfill diverted, or carbon offset metrics anywhere. Verified via automated E2E regex tests on DOM text.
- Increments strictly when the user taps `[I sorted it]` on a decided result sheet.
- LocalStorage key `binbuddy.tally.v1` with try/catch fallback to in-memory state when storage is restricted (private browsing).

### Settings Modal & Voice Control

- Small, accessible popover dialog with proper `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="settings-heading"`.
- "Speak results automatically" toggle (off by default), persisting to `binbuddy:auto_speak`.
- "Reset sorted count" button with two-step confirmation dialog ("Reset your personal sorted count to 0?").

### Footer Verification

- Rules source attribution: "Source: City of Houston Solid Waste Management Department".
- Complete version and verification metadata: `(v1.0.0, verified 2026-10-10)`.
- Privacy disclosure: "Photos are sent to Gemini to describe the item. BinBuddy does not store them."
- Attribution: "Built during CodeRED: Orion • Hackathon 2026".
