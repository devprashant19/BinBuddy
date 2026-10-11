# BinBuddy 3-Minute Timed Demo Script

**Total Duration**: 3:00  
**Presenter Setup**: Laptop or mobile phone with BinBuddy open at `http://localhost:3000` (or production URL). Sample items nearby: soda can, plastic bottle, greasy pizza box.

---

### [0:00 - 0:15] The Hook & Problem Statement

- **Action**: Hold up a soiled pizza box standing over a recycling cart. Show BinBuddy interface on screen.
- **Voiceover**: _"Every day, millions of people stand over their recycling carts with an item in hand, guessing where it goes. In Houston, guessing wrong contaminates truckloads of recyclables. Standard AI chatbots make this worse by hallucinating city laws. Meet BinBuddy: Point. Sort. Hear it."_

---

### [0:15 - 0:50] The Core Flow: Point, Sort, Hear It

- **Action**: Tap the **Soda Can** sample chip (or point camera at an aluminum can).
- **Visual**: The UI transitions; the vibrant blue **GREEN RECYCLING CART** lid banner opens with bold typography.
- **Action**: Tap the **Hear it** button.
- **Audio**: ElevenLabs speaks: _"Rinsed and drained aluminum and bimetal soup or beverage cans go in the green recycling cart."_
- **Action**: Tap **Why this answer** to expand the disclosure sheet.
- **Voiceover**: _"Notice two critical details: first, color belongs to the bins—the vibrant blue lid signals the destination unmistakably from arm's length. Second, under 'Why this answer', BinBuddy discloses exactly what it saw, the specific rule matched, and cites the official City of Houston Solid Waste Management directory."_

---

### [0:50 - 1:20] Ambiguity & Clarification Flow

- **Action**: Tap **Try another**. Select an item needing clarification (e.g., takeout box or translucent plastic).
- **Visual**: The Clarification screen appears with: _"Is it clean and free of food grease?"_ and two large buttons: _Yes, clean_ and _Food-soiled or greasy_.
- **Action**: Tap _Food-soiled or greasy_.
- **Visual**: The dark charcoal **BLACK TRASH CART** lid opens immediately.
- **Voiceover**: _"Instead of hallucinating or making an ungrounded guess, BinBuddy asks one direct question when confidence is low. Food-soiled materials are properly diverted to trash to protect the municipal recycling stream."_

---

### [1:20 - 1:55] Resilience & Graceful Error Handling

- **Action**: Trigger failure state (or select _Pick it yourself_ from the home screen).
- **Visual**: Error panel appears with non-accusatory copy: _"BinBuddy could not analyze that photo. Try again, use a sample, or pick the item yourself."_
- **Action**: Tap **Pick it yourself**. Select _Plastic_ -> _Food Container_ -> _Clean_ -> Submit.
- **Visual**: Result sheet displays with source label marked `manual`.
- **Voiceover**: _"Even during total network outages, users are never trapped. The interactive manual picker lets residents make authoritative sorting decisions offline."_

---

### [1:55 - 2:20] Voice Fallback & Honest Personal Tally

- **Action**: Tap **Hear it** during mock/offline mode.
- **Visual**: The button displays `Playing (browser voice)` with the subtle badge `browser voice`.
- **Voiceover**: _"If ElevenLabs voice credits or network latency are impacted, BinBuddy immediately degrades to the browser's native speech synthesis without dropping a beat."_
- **Action**: Tap **I sorted it**.
- **Visual**: Button shifts to _Sorted!_ with green checkmark. Tally counter below updates: _"Items you marked as sorted: 1 (your own count)"_.
- **Voiceover**: _"Notice the tally wording: no fake CO2 or diverted kilograms. Just an honest, verifiable record of items you marked as sorted."_

---

### [2:20 - 2:50] Architecture & Engineering Invariants

- **Visual**: Show architecture slide (or Mermaid diagram).
- **Voiceover**: _"Under the hood, BinBuddy enforces our core invariant: Gemini describes what is physically visible; our deterministic TypeScript rules engine alone decides the bin. 116 unit tests, 14 E2E Playwright tests, zero WCAG accessibility violations, zero image disk storage, containerized with Caddy on Vultr Cloud Compute."_

---

### [2:50 - 3:00] Closing

- **Voiceover**: _"BinBuddy gives residents clear, auditable waste sorting answers in 3 seconds. Built for CodeRED: Orion. Try it today at binbuddy.live!"_
