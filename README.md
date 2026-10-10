# BinBuddy

> Point your phone at an item and BinBuddy tells you, out loud, which bin it goes in, and why.

Built for **CodeRED: Orion** (Hackathon: 10–11 October 2026).

---

## What is BinBuddy?

Standing over a row of recycling and trash bins with an item in hand can be confusing. Rules vary by city, resin codes are tiny, and contamination ruins batches.

BinBuddy solves this with a radical principle: **The AI describes the item; the deterministic rules engine decides the bin.**

- **Google Gemini** inspects the camera image to detect item type, physical material, condition (clean vs soiled), and resin codes. It never picks a bin.
- **Houston Curbside Rules Engine** matches that structured description against official municipal rules. Every result cites its specific official source rule.
- **ElevenLabs** narrates the decision aloud for hands-free and accessible sorting.
- **Clarification Loop**: If the photo is ambiguous (e.g., cannot see if a jar is rinsed), BinBuddy asks one plain question with high-contrast buttons instead of guessing.

---

## Quick Start (Demo Mode - No Keys Required)

You can run BinBuddy immediately with zero API keys using built-in verified fixtures:

```bash
git clone https://github.com/your-username/binbuddy.git
cd binbuddy
npm ci
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app will run in **Demo Mode**, letting you test real-world scenarios instantly.

---

## Verification & Testing

BinBuddy maintains a 100% green verification protocol across static, unit, API contract, and browser E2E tests:

```bash
# Run fast verification suite (typecheck, lint, unit tests, secret checks, rules checks)
npm run verify:fast

# Run full production verification (build, E2E browser tests, API contract checks)
npm run verify
```

---

## License

MIT © 2026 BinBuddy Authors. See [LICENSE](LICENSE).
