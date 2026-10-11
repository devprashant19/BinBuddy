# Houston Curbside Waste Sorting Rules and Authoritative Sources

This document details the City of Houston, Texas Solid Waste Management Department (SWMD) curbside recycling guidelines encoded into BinBuddy's deterministic rules engine.

---

## 1. Authoritative Citations

- **Primary Curbside Source**: City of Houston Solid Waste Management Department — Curbside Recycling
  - **URL**: `https://www.houstontx.gov/solidwaste/recycling.html`
  - **Last Verified At**: October 11, 2026 (`2026-10-11T08:45:00Z`)
- **Hazardous Materials / Battery Guidance**: City of Houston Environmental Service Centers (ESC)
  - **URL**: `https://www.houstontx.gov/solidwaste/esc.html`
- **Electronic Waste Guidance**: City of Houston Electronics Recycling
  - **URL**: `https://www.houstontx.gov/solidwaste/ewaste.html`
- **Garbage & Yard Waste Guidance**: City of Houston Garbage Service
  - **URL**: `https://www.houstontx.gov/solidwaste/garbage.html`

---

## 2. Municipal Destinations and Container Tones

1. **Green Recycling Cart (`recycling_cart`)** [Tone: `recycle`]:
   - Dedicated city-issued wheeled green container.
   - Purpose: Clean, empty, dry recyclables. Items must be placed loose, never bagged.
2. **Black Trash Cart (`trash_cart`)** [Tone: `landfill`]:
   - Standard municipal garbage container.
   - Purpose: Non-hazardous municipal solid waste, soiled food containers, plastics not accepted in recycling.
3. **Special Handling (`special_handling`)** [Tone: `special`]:
   - Dropped off at Environmental Service Centers or authorized e-waste depots.
   - Purpose: Items hazardous to workers, vehicles, or the community (batteries, cathode/circuit electronics).
4. **Manual Check (`manual_check`)** [Tone: `manual`]:
   - Ambiguous items or materials not explicitly covered by City rules. Directs the resident to check official guidance or call 311.

---

## 3. Comprehensive Municipal Rules Audit

Every rule in `data/rules/houston-tx-curbside.json` was cross-referenced against the official City of Houston Solid Waste Management Department curbside recycling documentation.

| Rule ID | Priority | What the Rule Says | Supporting Official Text Paraphrase | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| `battery-special` | 110 | Batteries require special handling at Environmental Service Centers; never curbside. | Hazardous waste like batteries is redirected away from curbside carts to City Environmental Service Centers. | **SUPPORTED** |
| `electronics-special` | 109 | Electronics cannot go in curbside carts; take to authorized drop-offs. | City provides dedicated e-waste recycling drop-offs and excludes electronics from curbside carts. | **SUPPORTED** |
| `plastic-film-trash` | 105 | Plastic bags and film wrap go in the black trash cart. | Film and flexible plastics including bags and wraps are explicitly listed under non-accepted materials. | **SUPPORTED** |
| `foam-packaging-trash` | 104 | Styrofoam and foam packaging belong in the black trash cart. | Accepted plastics are restricted to containers #1–5 and #7; foam packaging is not accepted in green carts. | **SUPPORTED** |
| `polystyrene-resin6-trash` | 103 | Plastic marked resin number 6 belongs in the black trash cart. | Official list of accepted plastic containers includes only #1–5 and #7, intentionally excluding resin #6. | **SUPPORTED** |
| `paper-cardboard-soiled-trash` | 102 | Food-soiled paper and greasy boxes go in the black trash cart. | Greasy or soiled paper, including food-contaminated paper and napkins, is listed under non-accepted materials. | **SUPPORTED** |
| `metal-can-clean` | 100 | Clean aluminum and bimetal cans go in the green recycling cart. | Aluminum and bimetal cans (rinsed and drained) are explicitly listed under accepted materials. | **SUPPORTED** |
| `glass-container-clean` | 95 | Clean glass bottles and jars go in the green recycling cart. | Glass bottles, jugs, and jars are explicitly accepted in curbside recycling. | **SUPPORTED** |
| `cardboard-clean` | 90 | Clean, flattened cardboard boxes go in the green recycling cart. | Flattened cardboard is explicitly listed as an accepted material. | **SUPPORTED** |
| `paper-clean` | 85 | Clean paper goes in the green recycling cart. | Clean paper (newspapers, magazines, catalogs, junk mail, office paper) is accepted. | **SUPPORTED** |
| `carton-clean` | 80 | Clean beverage cartons go in the green recycling cart. | Gable-top and shelf-stable cartons (milk, juice, soup) are explicitly accepted. | **SUPPORTED** |
| `plastic-container-clean` | 75 | Clean plastic containers marked #1–5 and #7 go in the green cart. | Plastic containers #1–5 and #7 (rinsed and drained) are accepted in green carts. | **SUPPORTED** |
| `textile-trash` | 70 | Textiles belong in the black trash cart or donation bin. | Textiles (clothing, shoes, towels, sheets, pillows) are explicitly listed as non-accepted curbside materials. | **SUPPORTED** |
| `organic-trash` | 65 | Food scraps and organic waste go in the black trash cart. | Food scraps and food contamination are prohibited from green carts; handled via regular garbage collection. | **SUPPORTED** |
| `composite-trash` | 60 | Mixed composite materials go in the black trash cart. | Non-accepted mixed-material items not matching approved single-stream categories default to regular trash. | **PARTLY SUPPORTED** (Houston specifies accepted commodities; unlisted mixed composites fall to trash) |

---

## 4. Official Page Items Not Covered by Current Curbside Ruleset

The following items are listed on the official City of Houston Solid Waste page but are not yet explicitly modeled as discrete item rules in the current 15-rule curbside subset:

1. **Yard Waste**: (Leaves, grass, tree branches, twigs) — Prohibited from the green cart; collected via separate bi-weekly City yard waste service.
2. **Large Plastic Items**: (Plastic toys, garden hoses, coolers, outdoor furniture, large buckets) — Prohibited from curbside recycling carts; collected via heavy trash or regular bulk disposal.
3. **Wrapping Paper**: Highlighted under non-accepted materials as non-recyclable soiled/coated paper.
4. **Shredded Paper**: Prohibited from loose single-stream collection unless specified under special drop-off programs.
5. **Aerosol and Paint Cans**: Handled exclusively via Environmental Service Centers (ESC).

Residents scanning these items will trigger the fallback rule (`manual_check`), which routes to official Houston guidance or 311.

---

## 5. Invariants

- Unknown material or unknown item type NEVER resolves to `recycle`.
- A dirty or food-soiled container NEVER resolves to `recycle`.
- Batteries and electronics NEVER resolve to `recycling_cart`.
- Model output cannot dictate destinations; the rules engine alone owns the mapping.
