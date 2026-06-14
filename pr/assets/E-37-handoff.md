# E-37 handoff → E-12 (showcase / scoring layer)

**Epic E-37 — canonical-flow proof.** The pipeline is now one subject, one chain, one home. This
note hands the showcase/scoring layer the two end-to-end builds and the glance sheets, and says
honestly where each still reads wrong. Produced by T-158-01 (story S-158).

## Delivered

Two living subjects taken end-to-end through the single entry point `npm run build:<subject>`
(recognize → generate-seed → workshop → final-beside-concept; the gate is a separate billed step the
chain never spawns):

| subject | draft home (committed JSON) | build-vs-concept sheet | workshop outcome |
| --- | --- | --- | --- |
| cottage | `builds/cottage/{build,ledger,final-artifact,seed-artifact}.{json,md}` | `pr/assets/frames/beside-concept-cottage-build.png` | budget-exhausted, 6/6 rounds |
| barn | `builds/barn/{build,ledger,final-artifact,seed-artifact}.{json,md}` | `pr/assets/frames/beside-concept-barn-build.png` | budget-exhausted, 6/6 rounds |

(The per-round 4-azimuth view PNGs under `builds/<key>/round-*/` are gitignored — regenerable by
replay; the committed JSON ledger is the receipt of record.)

## Consumption contract (per subject)

- **The program** — `benchmarks/sculpture/recognition/<key>.program.json` (Stage 3, the building
  program the build serves).
- **The seed** — `builds/<key>/seed-artifact.json` (Stage 4 generate-first realizer output, the
  geometry the workshop iterated).
- **The result** — `builds/<key>/final-artifact.json` + `builds/<key>/ledger.json` (Stage 5).
- **The glance** — `pr/assets/frames/beside-concept-<key>-build.png` (E-36 judge-free, build beside
  concept). This is **evidence, not a score**.
- **The chain receipt** — `builds/<key>/build.json` (recognition sha → seed sha → workshop
  outcome/rounds → final sha → beside path; `generalization.clean: true` — no per-building constants).
- **The verdict (separate, billed)** — if the scoring layer wants a frozen judgement, it runs
  `npm run gate:patternbook:<key>` itself, writing to `measurements/multi-angle/`. The build chain
  deliberately does not.

## Honest over/under-reach (drafts, not verdicts)

- **cottage — over-reach achieved on material, under on roof.** Reads as a recognizable timber-frame
  cottage: brown studs framing light plaster infill (the E-35 relief reads as half-timber), gabled
  roof + chimney, correct two-storey massing. *Weak:* the roof reads flat-brown without the concept's
  shingle texture; some eaves read thin. The look is proven; the roof covering is the next rung.
- **barn — form yes, surface no.** The long tithe-barn massing under a steep gabled roof reads, but
  the long walls are holey and spiky and the trim dropped — the known rough surface read. A draft,
  honestly not a win.

## One caveat the proof surfaced (fixed here, follow-up named)

Running the chain for the first time end-to-end caught a broken leg: Stage 4 imports shared stages
from `challenge-milestone.mjs` / `styled-milestone.mjs` and reads `material-map/<key>.json`, all of
which the S-156 archive sweep had moved to `_archive/` — `npm test` was green while the chain was
broken at runtime. T-158-01 restored those live shared-stage hosts + the four committed subject maps
and repointed the conformance lists. The named follow-up (its own ticket): extract the shared Stage-4
stages into a dedicated live module so the terminal *chains* can archive cleanly, and teach the
topology suite to check that a spawned stage's own imports resolve.

*The map is `STRUCTURE.md`; the architecture of record is `docs/knowledge/pipeline-philosophy.md`
(stage assignment unchanged); the narrative is the E-37 capstone in
`docs/knowledge/design-learnings.md`.*
