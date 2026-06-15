# Structure — T-149-02

The blueprint. Two workstreams: (1) the deterministic band0 diagnosis + fix, (2) the live E-35 slice
(no new production code — existing runners, invoked under `--ticket T-149-02`). Ordering matters:
diagnosis → band0 fix → recognition → relieved build → glance → milestone → docs.

## A. Diagnosis (no code change; produces an artifact)

**Mechanism (deterministic, runnable here).** `deriveZones` is exported from
`benchmarks/sculpture/multi-angle-gate.mjs:182`; `matMap` loads from `def.map` (JSON),
`conceptImg` via `decodeImage(conceptPath)` (PNG decode — no GL), `componentPlan` from the chain's
`component-plan.json`. A one-off harness reproduces the gate's zone derivation offline.

- **NEW (throwaway, not committed to src):** `docs/active/work/T-149-02/diagnose-band0.mjs` — load occ
  from `workshop/cottage/final-artifact.json`, matMap from the cottage `def.map`, conceptImg from the
  cottage concept path, componentPlan from the chain; call `deriveZones(...)`; print each band's
  `yRange` + `dominantBlock`; recompute `ownCoverage(surfaceZoneHistogram(occ, zoneOf, …))` per azimuth
  (must reproduce the committed 0.40); print the build's stone→white transition row.
- **ARTIFACT:** `docs/active/work/T-149-02/diagnosis.md` — states the branch with counts:
  `band0.yRange`, `band1.yRange`, per-band own/dominant fractions, the build's stone/white split (y4/5),
  and the verdict (instrument vs gap) with the discriminating number. Reference points already gathered:
  committed standalone `zone-map/cottage.json` is band0=[0,6]/band1=[7,13] on the *old* (pre-wall-raise)
  geometry — the concept proportion is ~50/50; the wall-raised build put stone only at y0–4.

## B. The band0 fix — one of two branches (gated by the diagnosis)

### Branch B (leaned, pending the print): the build under-supplies band0's concept-zone

The build's recognized program splits storeys at the geometric divide (stone y0–4, white y5–19), but the
gate's concept-derived band0 reaches ~mid-wall, so band0's upper rows read band1's white. The dressing
must **supply band0's gate-zone with its dominant** (`stone_bricks`) — the supplying-op fixpoint
(`presence-is-a-fixpoint-not-a-census`, `surface-paint-respects-run-rule`): a settle pass that, after
realize, re-dresses each band's gate-zone with that band's dominant where a *foreign* (non-own) block
sits, re-deriving the zone the same way the gate does (against the workshop's own occupancy), honoring
the run rule (gaps in kept runs adopt the kept block; isolates skipped; pre-existing own-vocab specks
never gated).

- **MODIFY (likely site):** `src/workshop/seed.mjs` and/or `src/workshop/loop.mjs` — after
  `realizeWithArticulation`, run a band-settle dress over `occ` using the program's band policy +
  `deriveZones`-equivalent zone-of, so the realized build the loop critiques + the gate censuses carries
  band0 stone across its full concept-zone. The exact insertion point is confirmed post-diagnosis (the
  realize→occ seam is the same one articulation already folds onto).
- **REUSE:** `src/form/placement-grammar.mjs` `zoneFill` (the existing band-fill that supplies a zone's
  dominant under the run rule) + `src/view/zone-map.mjs` `zonesFromBands` + `src/color/band-profile.mjs`
  `extractConceptZoneMap`. No new dressing algorithm — reuse the durable-skin/styled band-fill the gate
  already trusts, applied inside the workshop realize seam.
- **NEW TEST:** `src/workshop/*.test.mjs` (or `src/form/placement-grammar.test.mjs`) — a fixture proving
  a build whose geometric storey divide is below the concept band0 boundary gets band0's full zone
  dressed to its dominant (own-fraction → ≥ threshold), and a facade-less/aligned build is unchanged
  (byte-identical — the settle is a no-op when the dressing already matches the zone).

### Branch A (if the print shows the boundary snapped wrong / instrument): reconcile the zone boundary

The band0/band1 boundary is mis-placed by a floor-line snap (`snapBands`,
`src/color/band-profile.mjs:338`) landing it a few rows off the build's true storey transition.

- **MODIFY:** `src/color/band-profile.mjs` (the snap/anchor) or `benchmarks/sculpture/multi-angle-gate.mjs`
  `deriveZones` — only the boundary derivation, never a threshold or per-building constant.
- **DISCIPLINE (mandatory, both branches but binding here):** monotone proof — every committed gate
  record (barn, saltcrag, fixture, styled, generated, challenge, cottage's *other* bands) re-derives
  byte-identically; `src/view/coverage-monotone.test.mjs` green; own ⊇ dominant preserved; both
  arithmetics reported; committed records untouched; gate contract unmoved.

### Shared bar (either branch)
- Cottage reaches **coverage-PASS (judge-eligible)** on band0, or the residual is **named with counts**.
- `--repro`/`--offline` byte-identical on the touched gate/skin path.
- No per-building constants.

## C. Live facade recognition — existing runner, no code change

- **RUN:** `node benchmarks/sculpture/facade-grammar.mjs --subject cottage --ticket T-149-02`
  and `--subject barn --ticket T-149-02` (pack `rustic`), subscription shim. Then `facade:offline` to
  prove byte-identical replay.
- **COMMITS (pin-guarded):** `recognition/<runKey>.merged.json` (program now carrying `masses[].facade`),
  `.record.json`, `.render.json`, `.replies.json`, `prompt.md`. Each face records `evidence.source`
  (concept | textured-glb) and `layoutOnly`.
- **No file under `src/` changes** — `facade-grammar.mjs` (T-145-01) is the contract; this is its first
  real-subject invocation.

## D. Relieved workshop build — existing runner, no code change

- **RUN:** `node benchmarks/sculpture/pattern-book.mjs --subject cottage --ticket T-149-02 --rotate-pins`
  and `--subject barn --ticket T-149-02 --rotate-pins`. The recognized facade ⇒ non-empty articulation
  plan ⇒ `realizeWithArticulation` folds relief onto the skin (T-149-01).
- **VERIFY:** `patternbook:repro` + `workshop:replay` byte-identical on the *new* chain; S-142 witnesses
  (`proportion:repro`, `visibility:repro`) green-or-named-SKIP (recorded).
- **COMMITS:** `workshop/<runKey>/` ledger/digest/final-artifact, `pattern-book/<runKey>.json`. Pins
  rotated under T-119 with retired pins named.

## E. The glance + milestone — existing runner

- **RUN:** `milestone:facade:baselines` (snapshot pre-rotation flat-build quotes) → `milestone:facade
  --rotate-pins` → `milestone:facade:repro` (byte-identical). Both arithmetics per row; `reliefAware`
  `armed:false` honest until a relieved judge runs (out of scope).
- **ASSETS:** sheets to `pr/assets/` — cottage + barn, relieved build vs flat baseline vs concept.

## F. Docs & close

- **MODIFY:** `docs/knowledge/design-learnings.md` E-35 section — add the live-build outcome (the texture
  finding: does the flat box become articulated) + the band0 root cause (the diagnosis verdict).
- **ARTIFACT:** `docs/active/work/T-149-02/progress.md` (Implement), then `review.md` (Review).
- **Memory:** a `feedback`/`project` note on the band0 root cause if non-obvious post-diagnosis.

## Environment / honesty boundary

C–E require `claude -p` + headless GL. If unavailable here, B (the band0 fix, deterministic, with
monotone proof + tests + `--offline` byte-identity) lands as the self-contained deliverable; C–E are
named **deferred to the operator runbook with exact commands**, not reported as done. The honesty clause
(still-flat / still-blocked = the finding) governs the glance.
