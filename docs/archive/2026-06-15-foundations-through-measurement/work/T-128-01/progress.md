# T-128-01 — brush-registry — Progress

Phase 5 of 6. Steps executed per plan.md; deviations documented inline.

## Steps

- **Step 0 — Preflight** ✅ Baseline 1785/1785 green; all ten declared technique test files
  exist; `workshop:offline` + `challenge:cottage -- --offline` pass at baseline. Pre-existing
  dirty files (tickets, .lisa*, barn HEIC) left untouched. *Deviation discovered late: step 0
  spot-checked `--offline` but not `--repro` — see step 7 (the repro breakage turned out to
  predate this ticket; proven via a baseline worktree instead).*
- **Step 1 — The contract** ✅ commit `61f8c4c`: `schema/brush.schema.json`,
  `src/pack/brush-contract.mjs` (+13 both-ways tests). Suite 1798/1798.
- **Step 2 — Inventory registers** ✅ commit `774e0ca`: all 15 entries gain
  composition/tests/preview; `surface.fill`/`surface.paint`/`surface.roof-courses`/
  `surface.strip-salt` join as passes with CLOSED paramsSchemas; `BRUSH_REGISTRY`/`brushNames`/
  `getBrush` alias the same frozen table. *Deviations:* substrate kind `"box"` added to the
  schema (sealed hollow box — floorplan's safeAir needs a camera-hidden interior); contract
  gained the effect-empty rule (a pass preview must visibly act, not just return its substrate).
  Suite 1805/1805; `pack:validate` green.
- **Step 3 — Pass previews** ✅ commit (brush-preview): substrates (shell via boxShell, solid,
  box), `realizePassPreview`, wired as the contract's default realizer; **the meta-test: the real
  registry validates clean, count 19**. *Deviation:* the dressing preview's openings now ALIGN on
  both walls — the aperture detector reads enclosed air in the solid PROJECTION, so preview holes
  must pierce the thin pavilion (committed references read the same way). Suite 1813/1813.
- **Step 4 — Catalog, pure half** ✅ commit (brush-catalog): one plot per brush, overlap-free
  layout, every-brush coverage pin, AJV-shaped artifact, the markdown page (param docs walked
  from paramsSchema; open pass schemas surfaced honestly; NOT_BRUSHES table). *Decision recorded:*
  the layout algorithm is a separate walk over pre-realized cells, NOT a parameterization of the
  committed T-124 idiom-card module (wrap, don't churn). Suite 1818/1818.
- **Step 5 — Committed catalog** ✅ commit: runner + `npm run brush:catalog` + committed
  `benchmarks/sculpture/brush-catalog/{catalog.json, record.json, brush-catalog.md, 5 PNGs}`.
  Contract clean over 19 → coverage 19/19 → gate (1444 placements) → unmapped 0/4019 → renders
  with sha256 receipts. Glance check on `view-catalog-+x+z.png`: all 19 plots non-empty and
  distinct (roofs, arch, dressed pavilion, hollow cutaway, painted/timbered shells read).
  **`record.json.brushCount = 19` — the factory baseline.**
- **Step 6 — The door enforced** ✅ commit: `src/pack/brush-door.conformance.test.mjs` — closed
  sweep over six pipeline dirs; exact allowlist (door / intra-layer composition / record-pinned
  legacy runners, each with a reason) derived from the real import graph, zero padding; the
  allowances are themselves asserted live; tripwire green first run. Suite 1821/1821.
- **Step 7 — Byte-identity proofs** ✅ (this commit) — results below.

## Step 7 verbatim results (the migration AC)

| assert | result |
|---|---|
| `challenge:cottage -- --offline` | PASS — artifact shas MATCH, all records well-formed |
| `challenge:gatehouse -- --offline` | PASS — artifact shas MATCH |
| `challenge:church -- --offline` | PASS — artifact shas MATCH |
| `challenge:barn -- --offline` | PASS — artifact shas MATCH |
| `durable-skin --subject cottage --offline` | PASS — artifact sha MATCHES, gates re-assert |
| `durable-skin --subject gatehouse --offline` | PASS — artifact sha MATCHES |
| `workshop:replay` | **BYTE-IDENTICAL** — final artifact reproduces from program + ledger |
| `workshop:offline` | PASS — committed record re-asserted clean |
| `pack:validate` | PASS — rustic schema + semantic OK |
| `idioms:card` regenerated | **GIT-CLEAN** — card.json/record/renders byte-unchanged |
| `npm test` | 1821/1821 |
| `challenge:* -- --repro` ×4 | **FAIL — PRE-EXISTING, NOT THIS TICKET** (evidence below) |

### The `--repro` finding (pre-existing breakage, flagged for human attention)

All four challenge subjects fail the fresh-process re-run: cottage/barn diverge at the FINAL
artifact (shells match), gatehouse refuses at the shell pin, church at the reconstructed pin
(pin-guard working as designed — preflight-before-spend caught the would-be overwrite).

**Proof it predates T-128:** a clean worktree at `808d6fc` (the commit before this ticket's
first) with the same node_modules + GLB assets reproduces the IDENTICAL failures with the
IDENTICAL hashes — cottage `final 4e8222e0… (committed) vs 347def09… (fresh)`, barn
`406be3b2… vs 80b66189…`, same pin-guard refusals. The fresh-process hash is the same before
and after this ticket's commits — i.e. **this ticket's change moved nothing in the chain**,
which is exactly the migration claim. The committed records also still self-verify (`--offline`
green), so the pins are internally consistent; what drifted is the LIVE chain vs the pins —
some change between the records' pinning and `808d6fc` (sibling tickets landed all day;
candidates include T-117/T-118/T-119-era library changes or a dependency drift) broke
fresh-process reproduction without rotating pins. Per pin policy the records are truth and are
NOT regenerated here; the owning-ticket investigation is flagged in review.md.

## Acceptance criteria status

- ✅ **Brush contract** — schema + loader + semantic validator, pure (committed-file-read class),
  unit-tested both ways; composition vocabularies; test + preview-card requirements enforced by
  the meta-test (a contract-violating entry fails `npm test`).
- ✅ **Full inventory registered** — 19 brushes: 11 constructs + timber-frame/opening-dressing/
  hollow/floorplan + the four E-23 surface ops; the door tripwire makes the registry the only
  entry path for new techniques.
- ✅ **Behavior-preserving migration** — registration is additive name-resolution; every
  committed record re-verifies (`--offline` ×6, workshop replay byte-identical, idiom-card
  byte-unchanged); the pre-existing `--repro` breakage is proven not-this-ticket and reported.
- ✅ **The catalog** — committed page + record with `brushCount: 19` (the factory baseline).
- ✅ **No per-building constants** (preview substrates are committed synthetic fixture data —
  CARD_ROWS status); `npm test` 1821/1821 green.
