# T-094-01 — subject-roster-refresh — Review

Phase artifact 6/6. Handoff: what changed, how it's verified, what a human should look at.

## What changed (4 commits)

| Commit | Files | Substance |
|--------|-------|-----------|
| `a2dd259` | `benchmarks/sculpture/resemblance.mjs`, `resemblance-consolidation.mjs` | Moai removed from the live `SUBJECTS` roster → preserved verbatim in a `RETIRED SUBJECTS` comment block with the full rationale (multi-statue concept → fragmented mesh → verdicts measured debris, not design). Stale header comments fixed. Default consolidation sweep is now gatehouse + cottage + pineapple. |
| `3b118c7` | `benchmarks/sculpture/provision-concept.mjs` (new), `runs/016-vBuilding-a-village-church-with-a-square-bell-tower/` (new: design-doc + prompt, `concept.png`, `concept-attempt-1.png`, `concept-checklist.md`) | Concept-only provisioning runner (vConcept building stages 1+2 — design doc via the pinned claude shim, BAML `BuildingConceptPrompt` → Nano Banana pro — deliberately **no build stage**). Church concept generated; attempt 1 rejected by the checklist (thin gold cross finial), attempt 2 passed all 7 items; both preserved. |
| `79d5bee` | `benchmarks/sculpture/glb-smoke.mjs` (new), `glb/README.md`, checklist sign-off | Single-bulky-mass smoke gate (26-conn `components === 1` gated; 6-conn reported only). Validated both ways before judging church: gatehouse PASS reproducing its recorded numbers; moai FAIL (3 components, 0.5213). Church GLB minted via TRELLIS (6.47 MB, gitignored — verified absent from `git status`), smoke @48: 48×37×40, 11,423 cells, **1 component, largestFraction 1.0000**. Manifest row + provenance paragraph added; moai row marked retired. |
| `809eb70` | `benchmarks/sculpture/resemblance.mjs`, `docs/knowledge/design-learnings.md` | `export const CHALLENGE_SUBJECTS = { church: { key, glb, concept, scale: 48 } }` — paths/config only, with the untuned-pipeline contract in the comment. Journal section: retirement rationale · the checklist · the registration. |

No file deletions. No pipeline code touched: `durable-skin.mjs`, `zone-map.mjs`,
`multi-angle-gate.mjs`, `material-map.mjs`, `shell-integrity.mjs`, `trellis-glb.mjs`, and all
of `src/` are unmodified. Moai history (run dirs, e19-build artifacts, scale-study records,
`glb/moai.glb`, manifest row) untouched per the AC.

## Acceptance criteria — all met

1. **Moai retired** — commented `RETIRED` block in `resemblance.mjs` with rationale; no other
   roster contained it (verified by grep across `benchmarks/` + `src/`); history untouched.
2. **Church concept via vConcept** — stages 1+2 of the existing building mode; GEMINI key
   sourced from `.env`, never printed/committed. Subject shape per AC: two attached masses,
   pitched nave + pyramidal tower cap, 4 material zones, bulky throughout.
3. **Checklist recorded beside the image** — `concept-checklist.md`, per-attempt rows; the
   failing generation was regenerated BEFORE registration; immutable after (Rule 2).
4. **Textured GLB + smoke-check** — `trellis-glb.mjs` → `MODAL_ENDPOINT_URL` (unsandboxed),
   on disk gitignored like the existing 9; voxelization @48 confirms one bulky mass.
5. **Registry entry** — `CHALLENGE_SUBJECTS.church` (concept path, GLB path, scale). Zero
   pipeline-code changes; nothing consumes the entry yet, by design.
6. **`npm test` green** (1105/1105) + journal note in `design-learnings.md`.

## Test coverage

- **No new unit tests, by repo convention:** both new files are impure provisioning runners
  (network/model); the suite "must never pull GL / the model" (resemblance.mjs header). Their
  pure cores (`voxelizeGlb`, `strayVoxelStats`, `loadMeshFromGlb`, the prompt builders,
  `assertBuildingSpec`, `runIdForBuilding`) are already unit-tested.
- **Ground-truth validation instead:** glb-smoke was proven against a recorded positive
  (gatehouse — exact README numbers reproduced) and the motivating negative (moai) before
  judging church. provision-concept's arg/usage paths exercised without metered work.
- **Regression net:** full `npm test` after both registry-touching commits; the default
  `--offline` resemblance run re-verified post-registration.

## Open concerns / limitations (honest)

1. **The checklist is judgement-based.** Items are verified by visual inspection (recorded
   with evidence per row), not by a detector. That matches the instrument's other judged
   gates, but a second pair of eyes on `concept.png` is the cheapest review win here.
2. **White background, again.** Nano Banana pro ignored the #000000 instruction on both
   attempts (third occurrence incl. gatehouse). TRELLIS coped (largestFraction 1.0), and the
   checklist documents the fallback, but if a future subject's segmentation struggles, the
   black-bg regen advice in `glb/README.md` stands. Consider hardening the BAML prompt
   wording in a future ticket — NOT now (the church concept is immutable).
3. **`CHALLENGE_SUBJECTS` is consumed by nothing yet — deliberately.** The risk is it being
   forgotten; mitigated by the registration contract comment naming the runner-roster
   wiring as the next ticket's first step, plus the journal note. The follow-on ticket should
   add church to `material-map.mjs` SUBJECTS (paths only) and run the pipeline untuned.
4. **GLB regenerability is seed-pinned but endpoint-dependent.** seed 42 / decimation 150000 /
   texture 1024 are recorded; a TRELLIS redeploy could still produce different bytes. The
   smoke gate + manifest numbers are the durable acceptance record, not the binary.
5. **The stage-1 design doc mentions a cross finial** (model's prior for "church"); the
   registered image does not contain one. The doc is kept as the honest stage-1 record and
   the checklist explains the override. A future pipeline stage that re-reads the design doc
   (none does today — the pipeline starts from the concept image) would need to respect the
   image as canonical.
6. **Working-tree noise:** many `docs/active/tickets/*.md` and `pr/assets/frames/*` files are
   modified by sibling Lisa sessions; none were staged in this ticket's commits.

## Suggested human attention

- Eyeball `runs/016-…/concept.png` vs the checklist rows (1 minute — gate of record).
- Skim the `RETIRED`/`CHALLENGE` blocks in `resemblance.mjs` for wording/policy fit.
- Confirm the follow-on ticket exists (or create it) for "run the pipeline on church, untuned".
