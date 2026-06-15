# T-117-01 review — role-aware zone lens

## What changed (4 commits: 4ee2b5a, e59d216, a907836, + this docs commit)

**Logic (one module):** `src/color/band-profile.mjs`
- New pure export `fieldResolution(materialMap)`: bare feature-key → bare walls-key, derived
  entirely from the committed map's `placementRule` rows and recorded `nearTonePairs` (either
  orientation, min-dL pick, lexicographic tie). Eligible sources: blocks whose every rule is in
  {corners-edges, trim, openings, base}; walls and roof keys never resolve (roof leakage must not
  manufacture wall bands). No new threshold constants anywhere — committed data only.
- `segmentLayerBands` gains optional `fieldResolve`; dominance and share are computed over a
  *projected* histogram (`projectFieldCounts`), band `counts`/secondaries stay original. With
  `fieldResolve` null behavior is bitwise the old `filterCounts` path.
- `extractConceptZoneMap`: rung-2 retry engages **only** from the exact prior failure state
  (rung-1 segmentation empty + fieldBlocks present), records `params.fieldResolution`
  conditionally (the `anchor` precedent), and falls through to the **verbatim**
  `refuse("no-field-cells")` when the map licenses nothing.

**Tests:** `src/color/band-profile.test.mjs` Group H (7 new, 29 total in file, suite 1526/0):
barn-transcribed map literal (the real recorded ΔL 2.082 pair), the witness end-to-end
(flipped field rows → cobble-dominant band0), the honest-refusal negative, projection unit
cases, roof ineligibility, min-dL determinism, legacy invariance (no param on rung-1 reads).

**Data/records:**
- `zone-map/barn.json` + `.md` regenerated: `source:"concept"`, band0 y0..12 cobblestone
  (structural wall infill, share 1.0), roof dark_oak_planks (share 1.0),
  `params.fieldResolution {stone_bricks→cobblestone, oak_planks→cobblestone}`; diff vs the
  transcribed prior is empty — the prior was right, but now the bands are *derived*, which is
  what `bandRefsFromZoneRecord` requires.
- T-116 refusal record preserved byte-identical as `zone-map/barn.prior-fallback.json` (history
  beside the derivation, per AC).
- `kit/barn.{json,raw.json,md}` created (live recognition, strong tier, single-subject direct
  node — no other subject's pins touched): kept=5 (cube=4 fixture=1), overrides={} —
  all cube recognitions flagged-for-review (church precedent; flag, never silently snap).
- `durable-skin.mjs` registry: `zoneMapRecord`/`kitRecord` flipped from null (data-only;
  comments updated to provenance notes).

## Acceptance criteria — status

- ✅ Role-aware band classification, pure, unit-tested; barn ΔL 2.082 witness is a unit test
  (field rows classify cobble-dominant).
- ✅ Refusal path survives (synthetic negative test green); no contract relaxed —
  `kit.mjs`/`generated-milestone.mjs`/`kit-extract.mjs`/runners untouched.
- ✅ Barn unblocked and recorded: zone:map derives (cobble-dominant field band present),
  kit:extract runs on the bands, both registry records flipped, refusal retained as history.
- ✅ Legacy maps re-verified: full sweep regenerated cottage/gatehouse/church `.json`+`.md`
  **byte-identical** (git diff clean) — zero diffs to name. Committed kit/value pins untouched.
- ✅ No judge runs (kit call is recognition); no subject-specific constants (no new constants at
  all); `npm test` 1526/0.

## Test coverage assessment

Strong on the pure core (every new branch has a direct test plus an end-to-end witness/negative
pair; null-path equivalence asserted). Integration covered by live re-runs: armed
agrees-with-record assert (twice), kit `--offline` reproduction, full-sweep byte-identity. **Gap:**
no committed automated test runs the real barn concept PNG through the lens (suite stays
decode-free by design — the witness uses a synthetic grid in the measured failure shape; the real
image is covered by the regenerated record + the armed assert on every future chain run).

## Open concerns for a human reviewer

1. **The kit's roof correction (non-shipping).** The recognizer read the barn roof as
   spruce_planks vs the map's dark_oak_planks (`diff.corrections[0], ships:false`) and 4/4 cubes
   are flagged-for-review with `lightnessOffset 0 (offsetSamples 2)` — the same global-darkness
   phenomenon this ticket worked around at the zone level. Whether the barn's styled chain wants
   any of these recognitions to *ship* is exactly T-119 (pin/distillation policy) + S-121
   (terminal proof) territory; nothing ships today.
2. **Eligibility whitelist is positional.** `fieldResolution` hardcodes the rule list
   {corners-edges, trim, openings, base} as "wall-adjacent features". If E-30 later adds a new
   placementRule vocabulary entry, it is resolution-ineligible by default (safe direction, but
   worth knowing).
3. **Roof symmetry not built.** The roof has the analogous starvation mode
   (`weak-dominant:roof` when the roof class is empty); the mechanism would transfer, but the
   barn witness is walls-only and S-118 owns the roof-form seam — left as a named seam.
4. **`oak_planks→cobblestone` in the resolution map** is licensed by the recorded pair
   (dL 3.26) and the openings rule; on the barn grid oak contributed zero cells so it is inert,
   but on a future subject a door-heavy facade row could re-count into the field. The
   weak-dominant and role gates still apply downstream; flagging for awareness.
5. **Sibling work in tree.** T-118-01 (`src/view/roof-region-diff.mjs` + its work dir) was in
   flight in this working tree and was deliberately excluded from all commits here.

## Verification trail

- 4ee2b5a — lens + tests (suite 1526/0; existing 22 tests passed unchanged pre-Group-H)
- e59d216 — barn derivation + refusal history + zoneMapRecord (legacy sweep byte-identical)
- a907836 — kit + kitRecord (offline reproduction verified; zone record byte-stable under
  composed kit)
- final `npm test`: 1526 pass / 0 fail
