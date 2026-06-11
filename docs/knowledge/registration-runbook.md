# Subject registration runbook (S-094 + T-120-01)

THE one place for the registration flow: every step, in order, with its gate, its record, and
what a refusal licenses. Binding the same way `pin-rotation-policy.md` is: runners cite it,
the S-094 checklist + the T-120 pre-spend smoke are enforced by mechanism
(`registration-smoke.mjs`, the `trellis-glb.mjs` sibling-record gate, `glb-smoke.mjs`).

**The two incidents this codifies (the barn, T-116):** its concept passed the geometry
checklist, spent the TRELLIS budget, and was *then* refused by the zone lens
(`no-field-cells` — decidable from the concept + map alone); and its GLB failed the strict
single-component gate at every scale on ONE floating mesh cell (largestFraction ≥ 0.9813),
forcing a named deviation. Both are now regression fixtures (step 4 and step 6 below).

## The order

```
1 concept mint → 2 checklist 1–7 → 3 material map → 4 REGISTRATION SMOKE → 5 TRELLIS
                                                       ↑ refusal: regenerate 1–3, zero spend
→ 6 glb-smoke (speck-tolerant) → 7 registry edits (registration; concept now IMMUTABLE)
→ 8 bootstrap (zone-map → kit → generated milestone)
```

Until step 7 NOTHING is immutable: a refusal at 4 or 6 licenses regenerating the concept (and
its map — they travel together; the map is concept-derived). After step 7 the concept is
immutable (E-25 Rule 2) and the pipeline consumes it untuned (E-25 Rule 3).

## Step 1 — concept mint

`node benchmarks/sculpture/provision-concept.mjs --subject "<term>"` (stages 1+2 only; no
build). Regeneration: `--run-dir runs/NNN-…` (+ `--attached "<constraint>"`); attempts are
preserved as `concept-attempt-N.png`.

## Step 2 — concept sanity checklist (items 1–7, judged by eye)

Recorded beside the image as `runs/<id>/concept-checklist.md`, one row per attempt per item:

| # | Item |
|---|------|
| 1 | Single building (no second copy, no turnaround panels) |
| 2 | Clean background (solid uniform near-black — the ideal TRELLIS input) |
| 3 | One canonical 3/4 view |
| 4 | ≥3 distinct material zones |
| 5 | Readable silhouette |
| 6 | No environmental clutter |
| 7 | Bulky throughout (no thin freestanding members — the TRELLIS thin-subject limit) |

## Step 3 — material map (concept-only LLM call; the smoke needs it)

`node benchmarks/sculpture/material-map.mjs --subject <new>` (add the subject's runDir to its
DATA list first). The map is concept-derived — **this step moved in front of TRELLIS at
T-120-01**: the zone lens is map-relative, so lens readability is only decidable once the map
exists. A subscription-shim call, cheap next to the TRELLIS GPU spend; if the concept is later
refused and regenerated, regenerate the map with it (nothing is pinned until step 7 —
`--rotate-pins` if overwriting a previous attempt's record).

## Step 4 — REGISTRATION SMOKE (checklist item 8; pre-spend, zero-cost gate)

```
npm run registration:smoke -- --subject <name> \
  --concept benchmarks/sculpture/runs/<id>/concept.png \
  --map benchmarks/sculpture/material-map/<name>.json
```

Runs the REAL role-aware zone lens (`extractConceptZoneMap`, T-117 rung included) over proxy
geometry synthesized from the concept's own row profile, then the kit-extract dry-run
(`bandRefsFromZoneRecord` + prompt build — the exact preconditions that refused the barn).
No model, no network, no GL. Writes `runs/<id>/registration-smoke.{json,md}` (guarded).

- **Exit 0 / `pass:true`** — proceed to TRELLIS. The record beside the concept is what
  `trellis-glb.mjs` checks before it will spend.
- **Exit 1 / `pass:false`** — a named refusal (`refusal.stage` ∈ proxy/lens/kit-dry-run; the
  lens reasons are the production taxonomy: `no-field-cells`, `weak-dominant:*`,
  `unmapped-dominant:*`, `too-few-cells`, …). Registration is BLOCKED; regenerate steps 1–3.
  Nothing was spent.
- The verdict is **readability only** — band y-geometry is proxy-true and never becomes
  registry data (the real zone map is derived post-build at step 8, unchanged contract).

Fixture: the barn's concept PASSES post-T-117 (`runs/017-…/registration-smoke.json`, the
role-aware rung engaged); pre-T-117 the same inputs refused `no-field-cells` — the recorded
stall this gate front-runs. The synthetic-unreadable control lives in
`src/form/registration-smoke.test.mjs`.

## Step 5 — TRELLIS spend

`set -a; . ./.env; set +a` then
`node benchmarks/sculpture/trellis-glb.mjs runs/<id>/concept.png glb/<name>.glb`
(defaults decimation 150000 / texture 1024 / seed 42). The CLI refuses before the POST if the
sibling `registration-smoke.json` says fail. Record the sha256 — the binary is gitignored;
the pin is the durable record (`glb/README.md` + the checklist sign-off).

## Step 6 — glb-smoke (speck-tolerant single-mass gate)

```
node benchmarks/sculpture/glb-smoke.mjs benchmarks/sculpture/glb/<name>.glb --scale <working> \
  --record benchmarks/sculpture/glb/smoke/<name>@<scale>.json
```

Gate (T-120-01, `speckVerdict` in `src/form/voxel-components.mjs`): every non-principal
26-conn component must individually be ≤ `GLB_SMOKE_SPECK_FRACTION` (0.02) of total cells.
- **Specks** (≤ budget) are reported and DELEGATED to the standing `shellStage`
  `componentStrip` — both consuming chains condition evidence through it before any fit, so
  sub-speck mesh debris never reaches a build. Not a deviation; the record names them.
- **Oversize** (> budget) fails — the moai fragmentation class (duplicate masses,
  hallucinated connectors) is gated exactly as before, strict above the declared budget.
- 6-conn stats stay reported-only (thin-shell surface fragmentation is not a form defect).

Fixtures (`glb/smoke/`): `barn@48.json` PASSES with one 1-cell speck (the former named
deviation, now in-contract); `moai@48.json` FAILS (oversize duplicate mass — the control);
`church@48.json` passes clean (the baseline).

## Step 7 — registry edits (REGISTRATION — the immutability boundary)

Data-only entries, paths + scale, no pipeline code, in all four DATA lists:
`durable-skin.mjs` SUBJECTS (the full def; `zoneMapRecord`/`kitRecord` start null) ·
`kit-extract.mjs` SUBJECTS · `material-map.mjs` SUBJECTS (already done at step 3) ·
`resemblance.mjs` CHALLENGE_SUBJECTS. Sign off in `runs/<id>/concept-checklist.md` (the
church/barn precedents). From here the concept is immutable.

## Step 8 — bootstrap (hard precondition order)

challenge provision → `npm run zone:map -- --subject <name>` (flips `zoneMapRecord`) →
`npm run kit:extract -- --subject=<name>` (needs the concept-derived zone record; flips
`kitRecord`) → generated milestone. All writes guarded; mind the npm `--` (a swallowed flag
fails closed at the preflight, by design).

## Invariants

- A refusal **before step 7** is cheap and licenses regeneration; **after step 7** defects are
  measured, never patched around (E-25 Rule 2/3).
- The smoke ADDS a gate; no downstream contract moved (kit-extract, zone-map,
  generated-milestone preconditions verbatim — E-30 Rule 1).
- The speck tolerance is declared and bounded (one exported constant); no subject-specific
  numbers anywhere in the flow.
- All committed records in this flow go through the pin-guard (`pin-rotation-policy.md`).
