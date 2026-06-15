# T-070-01 — full-building-showcase · Review

Handoff. E-20's terminal showcase ticket: make the **facade→whole-building leap legible** and hand it to the
E-12 showcase. This is a **render + compose + document** ticket — **zero source-logic changes**, so zero
regression surface. All five ACs are met. `npm test` **786 pass, 0 fail** (unchanged). The one thing a reviewer
must check is **honesty**: the ticket Context says "refined to Strong+," but the dependency (T-069-01) measured
**`weak`** — every asset and doc here records the *measured* verdict (lens-confounded per E-22), not the
aspirational one. **Read concern #1 first.**

## What changed (files)

**Created — committed assets**
- `pr/assets/rotations/spin-building-e20.mp4` — the 360 turntable (768², 48 frames @ 12 fps, ~1.49 MB). The
  **first `spin-*` whose full revolution does not reveal a flat facade back** — all four sides + a stepped roof,
  real geometry. (AC#1)
- `pr/assets/frames/building-turntable-{front,right,back,left}.png` — 4 curated stills (768², az 45/135/225/315),
  the "all sides" evidence. (AC#1)
- `pr/assets/frames/beyond-facade-before-after.png` — 2-up (2072×1190): the Phase-1 facade hero (Taj, run-014
  strong) ∥ the full building in the round, captioned with the honest scale + verdict chip. (AC#3)
- `pr/assets/beyond-facade.md` — the E-12 hero handoff ("we broke facade-only"): beat, asset manifest, the
  truth-beside-the-chip verdict, the named residual, a proposed F12.5 coda slot. (AC#5)
- `docs/active/work/T-070-01/{research,design,structure,plan,progress,review}.md` — RDSPI artifacts.

**Modified (additive only)**
- `docs/knowledge/design-learnings.md` — appended the terminal **`## Beyond facade … (E-20)`** capstone
  (pure EOF append; no other section touched). (AC#4)
- `pr/assets/rotations/README.md` — added a "Beyond facade — the full building, in the round (E-20)" section +
  table row, framing the building spin as the answer to the README's own flat-back honest note. (AC#1)

**Untouched (zero regression surface)** — `benchmarks/sculpture/building/best/artifact.json` (read-only),
`src/revise/*`, `src/form/*`, `baml_src/judge.baml`, the schema, `render/src/orbit*.mjs` (used, not edited),
`pr/assets/sequence.md` (the Production contract — the handoff *proposes* a slot, does not edit the F-table),
`package.json`, every test. This ticket is render + compose + measurement, exactly as scoped.

## AC verification

- **AC#1 — 360 turntable, genuinely in the round, all sides + roof; clip committed, frames curated.** ✅
  `spin-building-e20.mp4` (real 360, GL-rendered from `building/best`, 57,202 placed every frame) +
  4 curated stills. Inspected front/back: distinct faces, roof crown reads. The first non-flat-back `spin-*`.
- **AC#2 — final categorical judge verdict recorded.** ✅ **`weak`** at whole-object form-IoU **0.929** (the
  loop accepted zero edits, so `building/best` *is* the final build) — recorded in the design-learnings
  capstone and the handoff verdict chip, citing `surgical-standard.{md,json}`. The E-22 render-lens caveat
  travels with it everywhere it appears.
- **AC#3 — before/after vs Phase-1 facades, for E-12.** ✅ `beyond-facade-before-after.png` in
  `pr/assets/frames/` — one grand face → a complete building, labeled and captioned.
- **AC#4 — design-learnings beyond-facade (E-20) section.** ✅ what the pipeline enabled (whole structure),
  scale (54×64×54, 57,202 blocks, 4-block palette), the standard reached (weak as-rendered + E-22 caveat), and
  the honest residual (fine detail tops out — surgical-edit 1M-context limit + TRELLIS detail loss).
- **AC#5 — E-12 handoff + `npm test` green.** ✅ `pr/assets/beyond-facade.md` (hero beat, assets, honest chips,
  proposed slot); `npm test` **786 green**.

## Test coverage

- **No unit tests added** — correct for this ticket: no source logic changed. The suite stays **786 pass, 0
  fail**, byte-for-byte the same set as before; any drop would be a regression to investigate, not absorb.
- **Verification gates (the acceptance evidence for a render+compose+document ticket):** turntable rendered with
  all 57,202 blocks placed every frame (logged); clip + 4 stills exist, non-zero, 768²; before/after is a valid
  2072×1190 PNG, visually 2-up; design-learnings append is pure (no other section diffed); all 10 paths the
  handoff references resolve (checked). All passed.
- **Coverage gap (by design):** the GL render + ffmpeg encode + ImageMagick compose path is not unit-tested
  (the suite must never pull GL or shell out) — the project's standard untested surface for asset generation.
  It is reproducible: the exact `orbit-cli` + `magick` commands are in `structure.md`/`plan.md`.

## Open concerns / flags for a human reviewer

1. **The verdict is `weak`, not "Strong+" — and that is the honest, correct record (HIGH — read first).** The
   ticket Context frames the building as "refined to Strong+." It was **not**: T-069-01 measured `weak`, and the
   surgical loop made **zero** accepted edits. This ticket deliberately records the **measured** verdict
   everywhere, never the aspirational one — inflating it would violate the desk's own anti-inflation norm
   (`sequence.md`). The verdict is further **render-lens-confounded** (E-22: the "grey jumble" is 512² no-AA
   texture aliasing, not build geometry; the blocks are clean per T-068/E-21). The defensible headline is the
   **completeness/scale leap** (a whole structure vs a face), which is true independent of the verdict. If a
   reviewer expected a "Strong" hero, the gap is intentional and documented — not a miss.
2. **The leap is completeness, not finish (MED — frame the showcase right).** "We broke facade-only" is about
   *extent* (4 sides + roof, in the round), not *polish*. The honest residual — fine architectural detail tops
   out — is named in both the capstone and the handoff, with both measured causes (the E-15 surgical LLM-edit
   route can't fit a 57k-block region in the 1M context; TRELLIS dropped the defining detail upstream). The
   showcase should lead with completeness and *own* the detail ceiling as on-thesis (the project exists to find
   where quality tops out).
3. **The verdict was cited, not re-run (LOW — intentional).** I did not re-judge the new 768² turntable. The
   recorded verdict is final (zero edits accepted), re-judging is metered + flaky (T-069 note 6), and a one-off
   re-judge on an un-fixed lens would muddy E-22's clean measurement (E-22 owns the lens fix + resemblance
   gate). Naming the confound is honest; substituting a better number would not be.
4. **The before/after pairs a *temple* facade (Taj) with a *gatehouse* building (LOW).** The "before" is the
   best text→JSON facade on record (run-014, strong) and the "after" is the E-20 gatehouse — different subjects.
   The comparison is *facade-vs-whole-structure* (the real axis), not same-subject; this is the honest framing
   (there is no full-building text→JSON Taj to compare against — that's the whole point). Captioned as such.
5. **Production owns the cut (LOW).** The handoff *proposes* an F12.5 E-20 coda but does not edit
   `sequence.md`'s F01–F15 table (the Production contract). Same boundary every `pr/assets/<topic>.md` respects.

## Verification commands
- `npm test` → 786 pass, 0 fail.
- Regenerate the turntable: `node render/src/orbit-cli.mjs --artifact benchmarks/sculpture/building/best/artifact.json --frames 48 --start 45 --elevation 30 --size 768 --mp4 --fps 12` (needs GL + ffmpeg).
- `file pr/assets/rotations/spin-building-e20.mp4 pr/assets/frames/beyond-facade-before-after.png` → mp4 + valid PNG.
