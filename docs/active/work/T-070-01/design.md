# T-070-01 — full-building-showcase · Design

Decide *how* to make the facade→building leap legible and hand it to E-12, given the research reality: the
build exists and renders here (GL+ffmpeg+IM all present), but the dependency measured **`weak` (lens-confounded
per E-22)**, not Strong+. The design is dominated by one question — **what is the honest, defensible claim** —
and four production choices (turntable, verdict record, before/after, ledger+handoff).

## The central decision — what claim does the showcase make?

**Options.**

- **(A) "Refined to Strong+" — take the Context literally.** Rejected. It is **false**: T-069 measured `weak`
  and the loop made zero accepted edits. The project's own norm (`pr/assets/sequence.md`: "shown beside the
  truth so nothing is inflated") forbids it. Inflating the headline would poison the most-watched asset.
- **(B) "We broke facade-only" — the scale/completeness leap.** **Chosen.** text→JSON's terminal output was a
  single grand *face* (the temple-facade benchmark); the matured pipeline produced a **whole structure in the
  round** — 54×64×54, 57,202 blocks, all four sides + a roof. This is **true, measured, and visible** in a
  turntable, and it is *exactly* the ticket title (`full-building-showcase`) and Context ("a whole structure,
  not a single face"). It does not depend on the judge verdict.
- **(C) Bury the verdict.** Rejected — AC#2 requires recording the final categorical verdict, and hiding it
  repeats the failure E-05/the categorical judge exists to prevent.

**Decision: lead with (B), carry the verdict and residual honestly.** The hero beat is *completeness*: "one
grand face → a complete building." The verdict (`weak`) and its **render-lens confound** (E-22) and the
**finish-ceiling residual** (surgical-edit scale limit + TRELLIS detail loss) ride alongside as the honest
coda. This satisfies every AC without a single false frame: the leap is real (B), the verdict is recorded
(AC#2), the residual is named (AC#4).

## Decision 2 — the turntable (AC#1)

**Options for "genuinely in the round, all sides + roof."**

- **Full 360 `spin-` clip** (`--frames N` over 0→360°, `--mp4`). **Chosen.** The whole point is "not a single
  face," so a full revolution that shows all four sides + the roof crown is the only honest form. Matches the
  existing `spin-<subject>-<seq>.mp4` convention (`spin-taj-015.mp4`, `spin-horyuji-019.mp4`).
- **Front-arc `rock-` oscillation.** Rejected for the hero — a rock deliberately *hides* the back; it would
  undercut "in the round." (A `rock-` is fine as a secondary front-hero beat, but the AC demands all sides.)

**Parameters.** `--frames 48` (smooth 360 at the existing 12 fps → 4 s loop; the rotations README norm),
`--elevation 30` (slightly above the 35 default to read the roof without going top-down), `--size 768` (a
middle ground: larger than the 512 default so the before/after composes cleanly against the 1080² facade
hero, without exploding render time on a 57k-block build), `--mp4 --fps 12`. **Start 45°** so frame 0 is a 3/4
hero angle (depth-revealing), matching the facade hero's 3/4 read. Encode the mp4; curate **4 frames**
(0°/90°/180°/270° — front, side, back, side) committed to `pr/assets/frames/` as the "all sides" evidence; the
full frame dump stays gitignored (T-068 size discipline).

**Where it lands.** Clip → `pr/assets/rotations/spin-building-e20.mp4`; curated stills →
`pr/assets/frames/building-turntable-{front,right,back,left}.png`.

## Decision 3 — the final verdict (AC#2)

**Cite, do not re-run.** The dependency already ran the metered categorical judge (3 samples × 2 rounds) and
recorded **`weak`** at whole-object IoU 0.929; the loop accepted **zero** edits, so `building/best` *is* the
final build and that verdict *is* final. Re-running `claude -p` would spend tokens to reproduce a recorded
number and risk judge flakiness (T-069 note 6). **Decision:** record the verdict by citing
`benchmarks/sculpture/surgical-standard.{md,json}` + `round-{0,1}/summary.json`, with the **E-22 lens caveat**
attached every time it appears ("weak *as rendered by the 512² no-AA lens*; aliasing ≠ geometry"). The verdict
chip in the handoff shows the truth, per the sequence.md norm.

Rejected: a fresh judge pass on the new 768² turntable. Tempting (a cleaner render *might* lift the verdict, the
E-22 hypothesis), but (a) it is out of scope — E-22 owns the lens fix and the resemblance gate, not this
showcase ticket; (b) a one-off informal re-judge on an un-fixed lens would muddy E-22's clean measurement; (c)
the AC says *record* the verdict, and the recorded verdict is `weak`. Naming the confound is honest; silently
substituting a better number is not.

## Decision 4 — the before/after vs Phase-1 facades (AC#3)

**The pairing.** *Before* = the Phase-1 facade hero, already committed at
`pr/assets/frames/spine-r4-hero-oneplane-014.png` (1080², the run-014 Strong "one connected plane" facade —
the *best* text→JSON ever did, so the contrast is honest, not strawmanned). *After* = the building turntable
3/4 hero frame (front, 45°). The composition says: **the ceiling of text→JSON was a single face; the pipeline
now builds the whole thing.**

**Tooling.** ImageMagick is present. Use `magick … +append` (side-by-side) with both normalized to the same
height (1080) and a thin gutter, captioned "FACADE (text→JSON ceiling)" / "FULL BUILDING (in the round)". A
`montage` with labels is the alternative; `+append` after a per-tile `-resize`/`-gravity` is simplest and
matches the existing `pair-*.png` look. Output → `pr/assets/frames/beyond-facade-before-after.png`.

Rejected: an animated before/after (morph/crossfade mp4). Nicer, but the Production desk composes motion from
stills + clips already; a single composed PNG is the canonical handoff unit (every `pair-*.png` is a still).
The turntable mp4 already supplies the motion.

## Decision 5 — design-learnings section (AC#4)

Append a terminal **`## Beyond facade — the whole structure, in the round (E-20) (S-070, T-070-01) · 2026-06-06`**
section, following the house shape (prose → small table → headline → honest notes → **One sentence:**). Content:
what the matured pipeline enabled (a complete building vs a face), the scale (54×64×54, **57,202 blocks**,
4-block clean palette), the standard reached (**weak as rendered**, with the E-22 lens caveat and the IoU
0.929), and the **honest residual** — where detail tops out: the surgical-edit **1M-context scale limit** (the
LLM block-edit loop can't refine a 57k-block region) and the **TRELLIS upstream detail loss**. This is the E-20
capstone the ledger lacks; it converts the dependency's measured findings into the epic's closing record.

Rejected: editing earlier E-13/E-15 sections. They are correct and dated; the capstone is additive, mirroring
how E-21 closed without touching predecessors.

## Decision 6 — the E-12 handoff (AC#5)

New `pr/assets/beyond-facade.md`, the standard per-topic handoff doc (cf. `concept-materials.md`,
`glb-grounded.md`). Contents: the **hero beat** ("we broke facade-only" — facade → whole building in the
round), the **assets shipped** (the `spin-building-e20.mp4` clip ⟳, the `beyond-facade-before-after.png`, the 4
curated turntable stills), the **honest verdict chip** (`weak` as-rendered + the E-22 lens note, scale/block
chips), and **where it slots** in `sequence.md` (a new completeness/scale beat — a candidate **F12.5 / E-20
coda** after the facade hero spine and breadth beat, marked ⟳ for the real building rotation). It explicitly
flags the truth-beside-the-chip norm so Production doesn't inflate the verdict.

Rejected: editing `sequence.md`'s F01–F15 table directly. That table is the Production desk's contract and is
mid-flight; the handoff *proposes* the slot and supplies the assets, leaving the cut to the owning desk (the
same boundary every other `pr/assets/<topic>.md` respects).

## Test & green-bar strategy

No source logic changes → no new unit tests required, and **`npm test` must stay 786 green** (the showcase is
render + compose + docs). The "tests" here are **verification gates**: the mp4 encodes and is non-empty; the 4
stills exist and are 768²; the before/after PNG exists and is a valid 2-up; the design-learnings section parses
(headed, dated); the handoff doc links real paths. All captured in `plan.md` as explicit checks.

## What this design explicitly will NOT do

- Will not re-render or re-judge to chase a better verdict (E-22's job).
- Will not touch `reviseLoop`/`glbFormTarget`/`judge.baml`/the schema/the build artifact.
- Will not commit the full gitignored frame dump or a duplicate artifact (T-068 size discipline).
- Will not edit `sequence.md`'s frame table (propose the slot in the handoff; leave the cut to Production).
