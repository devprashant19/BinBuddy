# Originality and Attribution Disclosure

## 1. Project Statement

BinBuddy was conceived and written entirely during the CodeRED: Orion hackathon hacking window (10 Oct 2026 1:00 PM US Central to 11 Oct 2026 1:00 PM US Central / 11 Oct 2026 23:30 IST).

All application logic, rules engine algorithms, API routes, user interface components, and verification suites are original work.

## 2. Reference Repositories Policy

Five reference projects (`RecycLENS`, `EnergyMate`, `Heirloom`, `PALI-GestureRecognitionForCerebralPalsy`, and `SnoozeYouChoose`) located in `E:\CodeRed\` were audited read-only during a 25-minute architecture discovery period.

- **Strict Isolation**: No code, prompts, copy, styles, or media assets were copied, translated, or adapted from any reference repository.
- **Reference Notes**: All analysis observations are documented externally in `binbuddy-docs/notes/REFERENCE-NOTES.md`.

## 3. Core Architectural Invariant: "AI Describes, Rules Decide"

Unlike typical generative AI wrappers where the model makes ungrounded, halluncinatory sorting decisions, BinBuddy strictly decouples perception from policy:

1. **Perception**: Gemini produces a schema-constrained visual description (materials, cleanliness, resin code).
2. **Policy**: A pure, deterministic rules engine maps that description against verified, authoritative municipal waste guidelines (City of Houston Solid Waste Management). The AI model never decides the bin.

## 4. Third-Party Libraries and Licenses

| Package                | License    | Purpose                                     |
| ---------------------- | ---------- | ------------------------------------------- |
| `next`                 | MIT        | Web framework (App Router)                  |
| `react`, `react-dom`   | MIT        | UI component library                        |
| `typescript`           | Apache-2.0 | Type checking and language                  |
| `tailwindcss`          | MIT        | Styling framework                           |
| `zod`                  | MIT        | Runtime schema validation                   |
| `vitest`               | MIT        | Unit testing framework                      |
| `@playwright/test`     | Apache-2.0 | End-to-end browser testing                  |
| `@axe-core/playwright` | MPL-2.0    | Automated accessibility auditing            |
| `cross-env`            | MIT        | Cross-platform environment variable setting |
| `eslint`, `prettier`   | MIT        | Code formatting and linting                 |
| `@google/genai`        | Apache-2.0 | Official Google Gemini SDK                  |
| `elevenlabs`           | MIT        | ElevenLabs TTS client                       |
| `lucide-react`         | ISC        | Accessible UI iconography                   |

## 5. AI Assistance Disclosure

Development was assisted by AI coding agents within the Antigravity IDE (Google DeepMind) in pair-programming capacity, with human engineering leadership. All architecture, schemas, and test suites were formally audited and verified against the strict verification protocol.
