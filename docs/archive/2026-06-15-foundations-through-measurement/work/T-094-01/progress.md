# T-094-01 — subject-roster-refresh — Progress

Phase artifact 5/6. All plan steps executed; 4 commits as planned.

## Done

- **Step 1 — moai retirement** (`a2dd259`): `resemblance.mjs` SUBJECTS → 3 live subjects;
  moai entry preserved verbatim in a `RETIRED SUBJECTS` comment block with the full rationale;
  registry header + `resemblance-consolidation.mjs` header comments updated. Verified:
  `--subject moai --offline` fails with `unknown subject` listing 3 keys; `npm test` green.
- **Step 2 — provisioning runner + concept** (`3b118c7`): `provision-concept.mjs` (vConcept
  building stages 1+2, no build; `--run-dir` regeneration preserves attempts). Live run →
  `runs/016-vBuilding-a-village-church-with-a-square-bell-tower/`. **Attempt 1 REJECTED** by
  the checklist (thin gold cross finial — item 7); regenerated with an `--attached` steering
  note; **attempt 2 PASSED all 7 items**. `concept-checklist.md` written beside the image;
  failed attempt committed as `concept-attempt-1.png`.
- **Step 3 — GLB + smoke gate** (`79d5bee`): `glb-smoke.mjs` (26-conn components===1 gated,
  6-conn reported). Controls first: gatehouse PASS reproducing its recorded README numbers
  (41×48×41, 27,620 cells, 1 component); moai FAIL (3 components, largestFraction 0.5213).
  TRELLIS → `glb/church.glb` (6,469,100 B, glTF v2, 343.6s; gitignored — confirmed absent
  from `git status`). Church smoke @48: **48×37×40, 11,423 cells, 26-conn 1 component,
  largestFraction 1.0000** (6-conn 0.9552). Checklist sign-off appended; `glb/README.md`
  church row + provenance paragraph + moai-row retirement parenthetical.
- **Step 4 — registration + journal** (`809eb70`): `CHALLENGE_SUBJECTS.church`
  (concept/glb/scale 48 + contract comment) in `resemblance.mjs`; `design-learnings.md` tail
  section (retirement rationale · checklist · registration). Verified: import shows 3 live +
  church challenge entry; registered paths exist on disk; default `--offline` runner
  unchanged; `npm test` green (1105 tests).

## Acceptance criteria status

- [x] Moai retired (commented RETIRED block, rationale inline; history/artifacts untouched)
- [x] Church concept via the existing vConcept path (stages 1+2; GEMINI key from `.env`,
      never printed; two masses, two roof forms, 4 material zones, bulky throughout)
- [x] Sanity checklist recorded beside the image; failing attempt regenerated BEFORE
      registration and preserved
- [x] Textured GLB via `trellis-glb.mjs` → `MODAL_ENDPOINT_URL` (unsandboxed); gitignored;
      voxelization smoke-check @48 confirms a single bulky mass
- [x] Registry entry (`CHALLENGE_SUBJECTS`): concept path, GLB path, scale — paths/config
      only, zero pipeline-code changes
- [x] `npm test` green; journal note in `design-learnings.md`

## Deviations from plan

1. **Attempt count:** plan budgeted ≤3 concept attempts; needed 2. The stage-1 design doc
   specifies a `gold_block` cross finial (model's idea of a church); the `--attached`
   override at the image stage was sufficient — the doc was kept as the honest stage-1 record
   rather than regenerated (plan had left this open; design D1 named `attached` as the lever).
2. **Mesh stats source:** glb-smoke prints verts/tris itself (via `loadMeshFromGlb`) — the
   plan's fallback (`glb-silhouette.mjs` load path) was unnecessary.
3. **White background accepted:** Nano Banana pro returned solid white instead of #000000 on
   both attempts (the documented gatehouse precedent). Accepted per design's fallback rule;
   TRELLIS segmentation demonstrably coped (single mass, largestFraction 1.0).
4. Step-1 commit happened before any tickets/lisa working-tree noise was touched — the many
   modified `docs/active/tickets/*.md` files in `git status` are Lisa's (other sessions),
   deliberately never staged.

## Remaining

Review phase (review.md) only.
