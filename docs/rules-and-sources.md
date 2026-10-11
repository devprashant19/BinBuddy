# Houston Curbside Waste Sorting Rules and Authoritative Sources

This document details the City of Houston, Texas Solid Waste Management Department (SWMD) curbside recycling guidelines encoded into BinBuddy's deterministic rules engine.

---

## 1. Authoritative Citations

- **Primary Curbside Source**: City of Houston Solid Waste Management Department — Curbside Recycling
  - **URL**: `https://www.houstontx.gov/solidwaste/recycling.html`
  - **Verified On**: October 11, 2026
- **Hazardous Materials / Battery Guidance**: City of Houston Environmental Service Centers (ESC)
  - **URL**: `https://www.houstontx.gov/solidwaste/esc.html`
- **Electronic Waste Guidance**: City of Houston Electronics Recycling
  - **URL**: `https://www.houstontx.gov/solidwaste/ewaste.html`

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

## 3. Verified Rules Catalog

| Rule ID                        | Priority | Materials / Item Types / Conditions          | Outcome            | Destination        | Rationale                                                          |
| ------------------------------ | -------- | -------------------------------------------- | ------------------ | ------------------ | ------------------------------------------------------------------ |
| `battery-special`              | 110      | Battery                                      | `special_handling` | `special_handling` | High fire risk in compactor trucks and sorting conveyors.          |
| `electronics-special`          | 109      | Electronics                                  | `special_handling` | `special_handling` | Heavy metals and circuitry; prohibited from curbside carts.        |
| `plastic-film-trash`           | 105      | Plastic film, grocery bags                   | `trash`            | `trash_cart`       | Tanglers cause mechanical shutdown of optical sorters.             |
| `foam-polystyrene-trash`       | 104      | Foam packaging, #6 resin                     | `trash`            | `trash_cart`       | Polystyrene is explicitly rejected by Houston curbside facilities. |
| `paper-cardboard-soiled-trash` | 103      | Soiled paper, greasy pizza boxes             | `trash`            | `trash_cart`       | Oil and food remnants ruin pulp processing batches.                |
| `metal-can-clean`              | 100      | Metal cans, clean                            | `recycle`          | `recycling_cart`   | Aluminum and bimetal cans rinsed and drained.                      |
| `glass-container-clean`        | 95       | Glass bottles and jars, clean                | `recycle`          | `recycling_cart`   | Clean glass containers are accepted loose in green carts.          |
| `cardboard-clean`              | 90       | Cardboard box, clean                         | `recycle`          | `recycling_cart`   | Corrugated boxes flattened to conserve cart capacity.              |
| `paper-clean`                  | 85       | Paper, clean                                 | `recycle`          | `recycling_cart`   | Newspapers, catalogs, junk mail, and dry office paper.             |
| `carton-clean`                 | 80       | Beverage carton, clean                       | `recycle`          | `recycling_cart`   | Gable-top and aseptic food/drink cartons, rinsed.                  |
| `plastic-container-clean`      | 75       | Plastic bottles/containers (#1-5, #7), clean | `recycle`          | `recycling_cart`   | Rigids marked #1-5 and #7; #6 excluded.                            |
| `textile-trash`                | 70       | Textile garments, cloth                      | `trash`            | `trash_cart`       | Fibers jam rollers; belong in donations or trash.                  |
| `organic-trash`                | 65       | Organic food scraps                          | `trash`            | `trash_cart`       | Organic waste goes in trash or municipal yard waste piles.         |
| `composite-trash`              | 60       | Composite laminated items                    | `trash`            | `trash_cart`       | Multi-layer packaging cannot be mechanically separated.            |

---

## 4. Invariants

- Unknown material or unknown item type NEVER resolves to `recycle`.
- A dirty or food-soiled container NEVER resolves to `recycle`.
- Batteries and electronics NEVER resolve to `recycling_cart`.
- Model output cannot dictate destinations; the rules engine alone owns the mapping.
