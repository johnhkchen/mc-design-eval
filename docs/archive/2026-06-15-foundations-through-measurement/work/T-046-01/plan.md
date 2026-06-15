# T-046-01 — Plan: llm-form-edit-route

Two commit-sized steps plus an on-demand A/B run. Step 1 is the pure, fully-tested heart (`npm test`
green, no GL/SDK). Step 2 adds the live BAML edit path + GL-gated proof + the A/B harness. Step 3 runs
the metered A/B and commits its output. Verification is concrete at each boundary.

## Step 1 — The pure editor core + the cage proof (commit 1)

**Goal:** `applyFormEdit` + bounds + `makeFormEditor` proven, and the LLM editor demonstrated to run in
`reviseLoop` **with zero loop changes** (AC #3, #5), all without GL/SDK.

1. Create `src/revise/form-edit.mjs`:
   - `FORM_EDIT_SCHEMA`, `LLM_EDIT_ROUTE`, `EDIT_KINDS`.
   - `placementInBounds(p, subBounds)` — every `expandPlacement(p)` voxel in `subBounds` (reuse
     `coordInBounds`/`expandPlacement`).
   - `regionKey(subBounds)` — `min.join(',') + '|' + max.join(',')`.
   - `applyFormEdit(inRegion, subBounds, ops)` — tombstone-indexed apply of add/remove/move/swap; bounds
     guard rejects (records, never throws) out-of-R add/move; never empties a non-empty input. Returns
     `{placements, applied, rejected}`.
   - `makeFormEditor({critic=proceduralDiagnose, propose, validate=assertArtifact, applyEdit=applyRegionEdit})`
     → `{diagnose, tweakFor, stash}` per structure.md (router + stash + replay). `propose` has **no live
     default in this commit's imports** — the live `defaultProposeEdit` is added in Step 2; here `propose`
     is required/injected so the core stays SDK-free. (Order Step 2 to add the default.)
2. Create `src/revise/form-edit.test.mjs` — groups FE-apply, FE-bounds, FE-ajv, FE-router, FE-cage,
   FE-imports (structure.md). FE-cage uses a stubbed `propose` returning a known op set + a synthetic
   `score` (in-region voxel count, say) to prove keep vs roll-back through the **unmodified** loop.
3. **Verify:** `node --test src/revise/form-edit.test.mjs` green; full `npm test` green (no regressions —
   nothing else changed). FE-imports asserts no top-level GL/SDK/child_process import.

**Commit:** `feat(E-15 T-046-01): pure LLM form-edit core + cage proof (no loop change)`

**Risk:** the stash key must match between `diagnose` (writes `regionKey(R.subBounds)`) and `tweakFor`'s
closure (reads `regionKey(sub)` where `sub = subBoundsOf(R)`). Mitigation: both derive from the same
frozen `R.subBounds`; an FE-cage assertion checks the stashed edit is actually replayed (not the identity
fallback) on an accepted iteration.

## Step 2 — The live BAML edit path + GL proof + A/B harness (commit 2)

**Goal:** the real `ReviseRegion` model call wired through the bridge and proven end-to-end (GL-gated);
the A/B harness ready to run.

1. Create `baml_src/revise.baml` — `EditAdd/Remove/Move/Swap`, `RegionEdit`, `ReviseRegion(subject,
   defect, region, placements, crop)` (structure.md). Reuse the facade Voxel/Line/Box/Fill shapes.
2. Regenerate the BAML client: `npx baml-cli generate` (or the repo's generate script). Confirm
   `baml_client/` now exports `ReviseRegion` on `b.request`/`b.parse`. Commit the regenerated client.
3. Create `src/revise/baml-revise.mts` — mirror `baml-review.mts`: stdin → render → `requestTextWithImage`
   → SAP-parse → `{ops}` on stdout.
4. Add `defaultProposeEdit(artifact, R, observation, defect, opts)` to `form-edit.mjs` — lazy
   `child_process` spawn of the bridge, writing `{imagePath: observation.path, subject, defect, region,
   placements: <indexed JSON>}`; parse stdout `{ops}`. Make it the default `propose` in `makeFormEditor`
   via lazy import (so the pure core/tests still load no SDK; FE-imports stays green because the import is
   inside the live leaf, not top-level).
5. Create `render/test/form-edit.live.test.mjs` — GL-gated; koi; one forced-form-route iteration through
   `reviseLoop` with `observe: observeRegion`, `score: liveFormScore`, `propose: defaultProposeEdit`.
6. Create `benchmarks/sculpture/form-revise-ab.mjs` — discover koi (`009`) + heart (`006`); per subject:
   curated region list, `makeFormEditor({propose: defaultProposeEdit})`, run `reviseLoop`; record
   before/after whole-object IoU (`formFidelityFromPair` on saved renders) + R-framed IoU (from the trace)
   + the kept/rolled-back trace; save before/after `render-3q` PNGs into an output dir. Deterministic
   discovery (sorted), writes `.json` + `.md` (mirror `form-baseline.mjs`). Guarded to no-op cleanly when
   GL/subscription absent.
7. **Verify:** `npm test` green (the live test self-skips without GL; the A/B is not a test). `node
   --check` the `.mjs`; `npx tsc`/tsx parse-check the `.mts` if the repo does so for siblings.

**Commit:** `feat(E-15 T-046-01): ReviseRegion BAML edit fn + live propropose leaf + koi/heart A/B`

**Risks:**
- **BAML tagged-union parse.** `b.parse.ReviseRegion` must SAP-parse the op union. Mitigation: small
  output, `kind` discriminators; the bridge strips fences/slices braces like baml-review. If SAP struggles
  with the union, fall back to a flat `RegionEdit { ops EditOp[] }` where `EditOp` carries an optional
  field per kind (documented deviation).
- **`observation.path` plumbing.** `observeRegion` writes a PNG only if `opts.outPath` is given; the live
  test/A/B must pass `outPath`. Mitigation: the loop's `observe` wrapper supplies a temp `outPath`; assert
  `observation.path` non-null before spawning the bridge.
- **Metered cost.** Each region = up to 2 model calls (critic + ReviseRegion). Mitigation: A/B uses
  `perRegion: 1` and a short curated region list; the live test forces the route (one ReviseRegion call).

## Step 3 — Run the A/B and commit results (on demand)

When run in an environment with headless GL + an authenticated subscription:
`node benchmarks/sculpture/form-revise-ab.mjs` → inspect renders → commit
`form-revise-ab.{json,md}` + saved before/after PNGs. **Verify (AC #4):** the `.md` shows koi + heart
before/after region IoU and the kept/rolled-back edit trace; renders saved. If GL/subscription is
unavailable in this session, the harness + live proof are committed and the run is left documented for a
metered environment (the form-baseline precedent: code + a documented run).

## Testing strategy summary

| Concern | Test | In `npm test`? |
|---------|------|----------------|
| op application + bounds rejection | `form-edit.test.mjs` FE-apply/FE-bounds | yes |
| AJV revalidation gate | FE-ajv | yes |
| router + stash replay | FE-router | yes |
| no loop change (cage) | FE-cage (stubbed propose + synthetic score) | yes |
| no top-level GL/SDK | FE-imports (static scan) | yes |
| live ReviseRegion round-trip | `form-edit.live.test.mjs` | no (GL-gated) |
| koi/heart before/after IoU + trace | `form-revise-ab.mjs` output | no (metered) |
