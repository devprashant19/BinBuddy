# CodeRED: Orion Track & Prize Submission Checklist

This document maps BinBuddy against all eligible hackathon tracks and sponsor prize categories.

---

## 1. Sponsor Prize Mapping

| Track / Sponsor Prize                | Eligibility Criteria                                                                       | How BinBuddy Meets the Track                                                                                                                                                                                                  | Verified Evidence                                                                             |
| :----------------------------------- | :----------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| **Best Use of Google Gemini API**    | Integration of Google Gemini model via official SDK with meaningful multimodal application | Utilizes Google Gemini 3.8 Flash via `@google/genai` to analyze consumer items and output strict structured JSON adhering to Zod schemas (materials, cleanliness, resin code). Adversarial prompt injection defense verified. | `src/lib/providers/gemini.ts`, `tests/unit/gemini-provider.test.ts`, `scripts/smoke-live.mjs` |
| **Best Use of ElevenLabs**           | Effective integration of ElevenLabs text-to-speech with natural user experience            | Implements ElevenLabs Flash v2.5 TTS to narrate municipal disposal instructions. Features SHA-256 disk caching, audio file integrity validation, and seamless fallback to the browser's native Web Speech API.                | `src/lib/voice/elevenlabs.ts`, `src/app/api/speech/route.ts`, `tests/unit/voice.test.ts`      |
| **Best Domain via GoDaddy Registry** | Custom domain registered and routed to live project                                        | Custom domain configuration guide utilizing GoDaddy Registry partner promo with automated TLS certificate issuance.                                                                                                           | `deploy/DOMAIN.md`, `deploy/HOSTING.md`                                                       |
| **Best Environment Hack**            | Meaningful real-world sustainability and climate impact                                    | Reduces municipal recycling stream contamination and curbside wishcycling by enforcing official City of Houston waste sorting guidelines.                                                                                     | `data/rules/houston-tx-curbside.json`, `src/lib/rules/engine.ts`                              |
| **DEV Writing Challenge**            | Comprehensive technical article documenting hackathon learnings and architecture           | In-depth technical article published to DEV community detailing the "AI describes, rules decide" architecture, failure ladders, and lessons learned.                                                                          | `SUBMISSION/dev-article.md`                                                                   |

---

## 2. Submission Pre-Flight Checks

- [x] **Zero Code Copied**: Attestation in `docs/ORIGINALITY.md` confirming zero reference repository code copying.
- [x] **Honest Labelling**: Every result clearly displays its source (`live`, `cache`, `demo-sample`, or `manual`).
- [x] **No Unverified Claims**: DOM text verified free of fake CO2 or landfill diverted quantities.
- [x] **Zero Secret Leaks**: Verified by automated scanning script `scripts/check-secrets.mjs`.
- [x] **Axe Accessibility**: 0 critical, 0 serious accessibility violations.
- [x] **Demo Mode Without Keys**: 100% operational out-of-the-box in demo mode.
