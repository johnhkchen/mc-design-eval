# T-038-01 — Design: sculptural best-of curation

Decisions for the terminal curation, each grounded in `research.md`. No new source code — this is a
curation + journaling ticket. The "build" is a set of derived, committed assets plus two doc edits.

## Decision 1 — Rock turntables: encode existing frames, don't re-render

**Options:**
- (A) Re-run `orbit-cli.mjs --oscillate` per build → fresh frames + mp4. Needs headless GL, slow
  (24 frames × 12 builds), non-deterministic textures across machines.
- (B) **Encode the 24 already-rendered `turntable/frame.NNN.png`** per build with ffmpeg, matching
  `orbit-clip.mjs` params (12 fps, `yuv420p`, even-scale). Offline, deterministic, seconds.

**Choose B.** The on-disk frames are *already* rock-mode (`summary.json.turntable.mode="rock"`,
center 45°, amplitude 40°) — produced by the very rig the ticket says to reuse. Re-rendering would
reproduce identical frames at GL cost and risk. The ticket's "reuse `orbit-cli --oscillate`" is
satisfied by the **provenance of the frames**; I document the regeneration command for
reproducibility (as `rotations/README.md` already does for the temple clips). Rejected A for cost
and determinism with zero quality gain.

## Decision 2 — Clip naming & location

`pr/assets/rotations/rock-<subject>-<seq>.mp4`, 12 clips, committed. Matches the existing
`rock-<name>-<seq>.mp4` temple convention (`rock-taj-015.mp4`). Seq disambiguates the slug-colliding
scale builds (`rock-moai-003/010/011`, `rock-pineapple-004/012/013`). Rock (front-arc) over spin
(full 360°) because sculptures share the single-view-reconstruction limit — the inferred back must
not be paraded (research; `rotations/README.md`). No `spin-*` variants this ticket — the package is
hero/breadth content, and the flat-back honesty already has a home in the temple rotations.

## Decision 3 — Concept↔render pairs: derived montage frames, captions in the doc

**Options:**
- (A) Reference the committed `concept.png` + `render-3q.png` by path; no new image.
- (B) **Montage each pair into one `pair-<subject>-<seq>.png`** (concept left | render right, common
  height), clean (no burned-in text); captions live in the curation doc.
- (C) Burn captions into the frames.

**Choose B.** Rationale: (1) a single side-by-side frame *is* the unit E-12 wants for a
concept↔render beat, and is self-contained; (2) it matches `pr/assets/frames/` ("derived/normalized
frames cropped/letterboxed to a common aspect"); (3) keeping text out of the frame matches
`sequence.md`, where captions/overlays are a doc column the production desk renders — so E-12 keeps
full control of typography. Rejected C (bakes-in copy, not E-12's to restyle). A is the fallback if
montage tooling were absent — but `magick` is present, and a derived frame is more useful than a
bare path. The render side uses the canonical `render-3q.png`; where the 3/4 still under-sells
(dancing man, bow & arrow — per their reads), the **caption says so** and points at the rock clip,
rather than silently swapping in a flattering turntable frame (honesty AC).

## Decision 4 — Triptychs: one horizontal 3-up render montage each

`triptych-moai-16-32-48.png` and `triptych-pineapple-16-32-48.png`: the three `render-3q.png`
(scales 16 | 32 | 48, left→right ascending) montaged at a common height. Renders only (not concepts)
— the concept is shared across the three scales, so the triptych's job is to isolate the **scale
variable**. This is the visual proof of the **non-monotonic** finding (moai 48 < 16; pineapple
lattice clearer at 16). Caption carries the read. Ascending left→right so the eye reads "more
blocks →" and the regression at 48 lands as a deliberate surprise.

## Decision 5 — Where the curated sequence is documented

**New file `pr/assets/sculptures.md`**, not an edit to `sequence.md`. The latter is the
temple-facade *evolution* cut (one subject, score climb); the sculpture set is *breadth/explosion*
content — a parallel package for E-12 to slot into the F09 "explosion" / F12 "breadth" beats. A
separate doc keeps the two stories from tangling and gives E-12 a clean manifest: the 8 subjects + 2
triptychs, each row = pair frame + rock clip + caption (subject + one-line fidelity read), grouped
angular → thin/linear → organic so the **frontier reads off the page order**.

## Decision 6 — The fidelity-vs-concept journal section

Append a top-level `## Fidelity-vs-concept frontier (E-13 sculpture set, S-038)` to
`docs/knowledge/design-learnings.md`, after the E-11 consolidation that currently closes the file.
Structure: (a) the **frontier by form type** (angular best → thin/linear angle-gated → organic
form-loss) with per-build evidence; (b) the **frontier by scale** (the two triptychs, the
non-monotonic result and its mechanism: large budgets under-spent on coarse fills; tight budgets
force bolder, more legible choices); (c) the framing — *this is the measured case for image→3D / the
staged sculptor (E-11) / TRELLIS (E-09)*: text→JSON holds palette + part-inventory but loses
**line** (organic) and **point** (thin) and does not reliably convert blocks→detail at scale. Links
to the per-build reads and the committed pair/triptych frames as evidence.

## Decision 7 — pineapple@48 (run 013) has no fidelity read

Implement must **inspect run 013's `render-3q.png` + concept firsthand** and write an honest
one-line read for its caption and the journal, rather than assume. Prediction from the frontier
(non-monotonic, organic): likely a coarse/over-filled large build that does **not** beat @16 on
recognizability — but the render decides. This is the one place new judgment is formed; everywhere
else the captions distill existing reads.

## Decision 8 — E-12 handoff note

A dedicated `## E-12 handoff` section at the foot of `sculptures.md` (not a separate file — keeps the
manifest and the handoff together): **what's delivered** (12 rock clips, 8 pair frames, 2 triptychs,
all committed paths), **how it slots in** (F09 explosion = the 8-subject wall; F12 breadth = same
method, fresh non-architectural subjects; the triptychs = a "fidelity tracks scale" beat; the
honest failures — heart/koi/moai@48 — as the *why image→3D* turn), and the **honesty constraints**
(rock not spin; gaps shown; concepts are Nano-Banana art, builds are real voxels).

## Rejected globally

- **Re-judging the builds.** The per-build categorical judgments stand; curation distills, it does
  not re-litigate.
- **Hiding the failures.** Heart, koi, moai@48 are *in* the package — they are the evidence for the
  E-12 "text hit a ceiling → image→3D" pivot. Cutting them would violate the honesty AC and weaken
  the thesis.
- **New unit tests.** No source changes; `npm test` is a regression guard (Decision in plan).
