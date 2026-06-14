# T-158-01 — Design: canonical-flow-proof (E-37 terminal)

This is a **proof + narrative** ticket, not a code-change ticket. The chain already exists and is
guardrailed; the job is to *run* it on the two living subjects, record the result honestly, and
write the map. The design decisions are about **how to run the proof**, **how to record honestly**,
and **how to write the narrative** — not about new modules.

## Decision 1 — Run the live chain (not `--repro`, not a synthetic seed)

**Options.**
- (A) `npm run build:barn` + `npm run build:cottage` live — recognize → generate-seed → workshop
  (model) → final beside concept.
- (B) `--repro` only — prove determinism, skip the model loop.
- (C) Hand-assemble beside sheets from the pre-existing `generated/<key>/artifact.json`.

**Choose (A).** The AC is explicit: "each run recognize → generate-seed → workshop → final, landing
in `builds/<subject>/`, rendered beside the concept". `--repro` (B) proves determinism but never
exercises Stage 5 (the workshop is the model *designing* — the capability the project measures), and
it requires a committed build to replay (none exists; `builds/` is empty). (C) skips the chain
entirely and would be dishonest about "end-to-end". Research confirmed every input is present and
both GL and `claude -p` are available, so (A) is feasible. The budget is bounded
(`BUILD_BUDGET` rounds), so the live cost is capped.

**Risk + mitigation.** A live model round can hiccup. The chain already encodes **honest failure**
(E-25 Rule 6): a failed stage writes `{status:"pipeline-failed", stage, error}` and exits 1. That
record *is* the honest report. If a subject fails transiently, re-run once; if it fails
structurally, record the failure verbatim and name it in the review rather than papering over it.
Run **cottage first** — it is the proven-relief subject ([[look-proven-on-cottage-relief]]) and the
lower-risk smoke; barn second (its roughness/dropped-trim is the known weak read, so a barn
"drifted" render is expected, not a regression).

## Decision 2 — Honest recording: the render is the evidence, not a claim

**Options.**
- (A) Report each build as a draft, naming what still reads wrong, with the beside sheet as the
  evidence.
- (B) Run the gate too and report a verdict.

**Choose (A).** The AC says "The builds are drafts, not verdicts" and "The render is the evidence",
and the philosophy says **creation is free, measurement is frozen and singular** — the gate is a
*separate billed step* the chain must never spawn. Running the judge here would (i) violate the
workshop≠judge isolation the epic spent T-154 establishing, and (ii) re-collapse the creation /
measurement split E-36 just re-separated. So: no gate. The `builds/<key>/build.md` chain receipt +
the beside PNG carry the honesty; the review and the E-12 handoff add the prose ("the barn's trim
still reads thin / roughness on the long wall", per the known weak reads), explicitly **not** a
score.

## Decision 3 — The narrative lives in `design-learnings.md`, realizes the philosophy

**Options.**
- (A) Append one `## E-37 …` capstone section to `design-learnings.md` with the seven-beat flow,
  each beat = technique + what it allows that the alternative didn't; cross-link from STRUCTURE.md
  and the philosophy realization clause.
- (B) Put the flow in STRUCTURE.md (it already has the spine table).
- (C) Put it in pipeline-philosophy.md (it already has the stages).

**Choose (A).** `design-learnings.md` is the per-epic ledger (newest at tail; E-35 current) — the
canonical home for "what this epic taught". STRUCTURE.md is the *map of the code* (modules,
artifacts, entry points) and pipeline-philosophy.md is the *architecture of record* (stage
assignment, which the AC says must stay **unchanged** — "realized, not re-derived"). Duplicating the
narrative into either would (B) bloat the map with prose or (C) re-derive the philosophy. So the
narrative is a new design-learnings section that **points at** both: it cross-links *from*
STRUCTURE.md (a one-line pointer under the spine) and *from* the philosophy realization clause
(append E-37 to "realized by E-31 … and E-32 …"), and *to* both in its own body.

**The seven beats** (each: the alternative that failed in the middle era → what this representation
allows). These are a *retelling* of the philosophy's stages keyed to the receipts already in the
ledger (E-21 optics collapse, E-27 mesh-fit noise, E-15 surgical overflow, E-31 recognition,
E-33/34 ruler) — not new claims:

1. **language-not-optics** (Stage 0) — colorimetry can't separate brick from cobble; material is
   diegetic. The brief decides materials with cited rationale.
2. **image-not-prose** (Stage 1) — one coherent concept view is the immutable contract; prose can't
   be judged against.
3. **shape-only-not-substrate** (Stage 2) — TRELLIS gives silhouette/proportion; its textures are a
   non-diegetic amalgam, never the substrate (E-35 narrowing: layout-evidence yes, material no).
4. **recognition-not-fitting** (Stage 3) — naming "that's a gable" is robust to the mesh noise that
   *broke* fitting + the cage that enforced fidelity to noise.
5. **parametric-not-surgery** (Stage 4) — straight walls / even courses are the generator's native
   output, not properties recovered from a 57k-voxel cloud by LLM surgery that overflows context.
6. **workshop-not-one-shot** (Stage 5) — iteration is what every human builder relies on; the
   workshop revises through tools, structurally unable to call the judge.
7. **frozen-judge-not-soft-gate** (Stage 6) — categorical judgement is reliable only when the
   instrument is frozen and ungameable (the fooled-gate ledger bought that).

## Decision 4 — E-12 handoff format

**Choose:** a short `pr/assets/E-37-handoff.md` (matching the prior-ticket pattern of an E-12 note
in `pr/assets/`) listing what is delivered (the two unified-chain builds + beside sheets, by path),
the consumption contract (recognition → seed → final + beside, per subject), and honest
over/under-reach (cottage relief proven; barn trim/roughness still weak). The beside PNGs committed
to `pr/assets/frames/` are the visual half of the handoff.

## Decision 5 — Scope discipline (what NOT to do)

- **No new source, no stage change.** The chain is frozen-good; touching a stage would trip
  `topology.conformance.test.mjs` (map↔tree) and is out of scope. This keeps `npm test` green by
  *construction*.
- **No per-building constants** anywhere in the docs or handoff (E-25 Rule 3).
- **No pin rotation.** The run writes only `builds/` drafts (free) + `pr/assets/` — nothing under
  `measurements/`. If `preflightPins` ever blocks (it shouldn't — `builds/` is untracked), that is a
  signal to stop and re-check, never to pass `--rotate-pins` ([[pin-guard-is-structural]]).

## Net

Run cottage then barn live; commit the beside sheets; write the E-37 capstone narrative +
cross-links; write the E-12 handoff; keep `npm test` green untouched; review the whole epic.
Zero source changes — the proof is the run and the map is the prose.
