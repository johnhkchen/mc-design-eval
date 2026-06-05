# sculptures.md — the sculptural best-of (E-13 / S-038)

The curated **breadth/explosion** package: 8 fresh non-architectural subjects + 2 scale triptychs,
each as a **concept↔render pair** + a **rock turntable**, captioned with a one-line fidelity read.
Built by T-038-01 (terminal link of the sculpture arc).

This is **not** `sequence.md`. That file is the temple-facade *evolution* cut — one subject, a score
climb, the "method changed" story. This package is the **other half**: the same `vConcept` pipeline
(term → Nano-Banana concept → text→JSON build → real voxel render) turned loose on a wide spread of
subjects, to show **breadth** and to chart the **fidelity-vs-concept frontier**. For E-12 it feeds
the **F09 explosion** (the 8-subject wall) and **F12 breadth** beats, plus a new "fidelity tracks
scale" beat from the triptychs. Honesty first: the concept↔render *gaps* are shown, not hidden — the
failures (heart, koi, moai@48) are the evidence for the "text hit a ceiling → image→3D" turn.

All assets are committed (the source `runs/*/turntable/` frames are gitignored; the curated mp4s and
montage stills here are the durable artifacts). Concepts are **Nano-Banana art**; renders are **real
prismarine-viewer voxels** — never conflate the two on screen.

## The frontier, by row order

Subjects are grouped **angular → thin/linear → organic** so the frontier reads off the page: angular
realizes best, thin/linear is angle-gated, organic loses its defining line.

| subject | scale | pair frame | rock clip | one-line fidelity read | category |
|---------|------|-----------|-----------|------------------------|----------|
| **— angular (text→JSON best case) —** | | | | | |
| moai statue | 32 | `frames/pair-moai-003.png` | `rotations/rock-moai-003.mp4` | Faithful form, drifted *value* — every signature cue (stepped brow, eye sockets, nose ridge, set mouth, topknot, plinth) transfers; `gray_concrete` reads darker than the pale tuff. The series' best case. | **Competent** (form **Strong**) |
| sword | 32 | `frames/pair-sword-007.png` | `rotations/rock-sword-007.mp4` | Faithful cruciform — blade, fullered base, crossguard with gold caps, wrapped grip, pommel, plinth, part-for-part; only the tip *steps* instead of tapering to a point. | **recognizable** (strong, near-faithful) |
| dancing man | 32 | `frames/pair-dancing-man-002.png` | `rotations/rock-dancing-man-002.mp4` | Faithful pose + warm-earth/gold palette; the fixed 45° still merges the kicked leg into a column — the **turntable rescues** the dynamic read. | **recognizable** (strong) |
| **— thin / linear (recognizability is angle-gated) —** | | | | | |
| bow & arrow | 32 | `frames/pair-bow-and-arrow-005.png` | `rotations/rock-bow-and-arrow-005.mp4` | The hardest case. Complete part list in the exact palette (recurve bow, bone string, diagonal arrow, iron head, red fletching, plinth); the 45° still foreshortens the arrow to a speck — **only the rock reads it**. | **recognizable** (angle-gated) |
| **— organic / smooth (palette + parts kept, *line* lost) —** | | | | | |
| pineapple | 32 | `frames/pair-pineapple-004.png` | `rotations/rock-pineapple-004.mp4` | Faithful rounded ovoid + analogous yellow/green palette; the cross-hatch skin **under-reads** — `orange_terracotta` on `yellow_terracotta` is near-equal value, so the lattice nearly vanishes. | **recognizable** |
| mushroom | 32 | `frames/pair-mushroom-008.png` | `rotations/rock-mushroom-008.mp4` | Faithful element-for-element (overhanging red cap, white spots, gill ring, pale stem, green mound); the only loss is the cap **terracing** into a stepped cone instead of a smooth dome. | **recognizable** (strong) |
| koi fish | 32 | `frames/pair-koi-009.png` | `rotations/rock-koi-009.mp4` | Right Kohaku palette + parts; **wrong line** — the elegant swimming **S-curve** and membranous fins flatten to a straight chunky body and stepped slabs. Reads as koi only **broadside**. | **recognizable** (low–mid, broadside-dependent) |
| anatomical heart | 32 | `frames/pair-heart-006.png` | `rotations/rock-heart-006.mp4` | Right material vocabulary, **wrong form** — the lobed teardrop became a rectangular block and the **aortic arch never built as a loop**, so it reads as an abstract red-and-lavender shrine. | **loose** |

## The scale triptychs (16 / 32 / 48)

Renders only (concept is shared across the three scales, so the triptych isolates the **scale
variable**). Ascending left→right. The two make **opposite** cases — the headline finding.

| subject | triptych frame | rock clips (16/32/48) | the scale read |
|---------|---------------|----------------------|----------------|
| moai (angular) | `frames/triptych-moai-16-32-48.png` | `rock-moai-010.mp4` · `rock-moai-003.mp4` · `rock-moai-011.mp4` | **Non-monotonic, peaks at 32.** @16 carved face reads (graceful coarsening); @32 best (face + topknot + plinth); @48 **regresses to a near-featureless dark monolith** — the large budget squandered on coarse fills. Bigger ≠ better. |
| pineapple (organic) | `frames/triptych-pineapple-16-32-48.png` | `rock-pineapple-012.mp4` · `rock-pineapple-004.mp4` · `rock-pineapple-013.mp4` | **Rewards the budget, ~monotonic up.** @16 blocky but bold checker; @32 rounded body, faint pattern; @48 **best** — the only scale with *both* a rounded ovoid *and* a legible brown-diamond lattice. Cost: crown fronds fragment into floating tips. |

**The sharpened law:** the *sign* of the scale effect is **form-type-dependent**. An angular,
single-dominant-mass subject (moai) can **waste** a large budget on coarse fills; an organic,
textured subject (pineapple) **converts** the extra blocks into both form and pattern. "Scale up for
fidelity" is not a safe default — it depends on the form.

## Regenerate (reproducible)

```bash
# Rock turntable frames are produced by the shared orbit rig (already on disk per run, gitignored):
node render/src/orbit-cli.mjs --artifact benchmarks/sculpture/runs/<seq>-…/artifact.json \
  --oscillate --amplitude 40 --center 45 --frames 24 --fps 12          # → turntable/ frames (needs GL)

# Encode the 24 frames → a committed rock clip (no GL; matches render/src/orbit-clip.mjs):
ffmpeg -y -framerate 12 -i benchmarks/sculpture/runs/<seq>-…/turntable/frame.%03d.png \
  -pix_fmt yuv420p -vf 'scale=trunc(iw/2)*2:trunc(ih/2)*2' pr/assets/rotations/rock-<subject>-<seq>.mp4

# Pair frame (concept | render) and triptych (16|32|48), common height 512:
magick \( concept.png -resize x512 \) \( render-3q.png -resize x512 \) +append pr/assets/frames/pair-<subject>-<seq>.png
magick \( r16/render-3q.png -resize x512 \) \( r32/… \) \( r48/… \) +append pr/assets/frames/triptych-<subject>-16-32-48.png
```

Frames carry **no burned-in text** — captions/overlays live here and are E-12's to render, matching
`sequence.md`'s caption-column convention.

## E-12 handoff

**Delivered** (all committed, stable paths):
- **12 rock turntable clips** — `pr/assets/rotations/rock-<subject>-<seq>.mp4` (front-arc ±40°,
  12 fps, 24 frames). Rock, **not** spin: sculptures share the single-view-reconstruction limit
  (back is inferred from one 3/4 concept), so the weak back is never paraded. Pick `spin-*` only if
  the flat-back honesty beat is wanted — none generated here.
- **8 concept↔render pair frames** — `pr/assets/frames/pair-<subject>-<seq>.png` (1×512 tall).
- **2 scale triptychs** — `pr/assets/frames/triptych-{moai,pineapple}-16-32-48.png` (1536×512).

**How it slots into the showcase:**
- **F09 (explosion):** the 8-subject wall — a montage of the 8 pair frames / rock clips. "The
  floodgates opened": same method, eight fresh non-architectural subjects in one sitting.
- **F12 (breadth):** the angular wins (moai, sword) as the "still strong on new subjects" beat;
  pair them with the rocks for the "yep, it's real and rotating" proof.
- **New "fidelity tracks scale" beat:** either triptych. Moai's is the dramatic one (face → monolith);
  pineapple's is the counter-example (bigger helped). Use both to make the honest, non-trivial point.
- **The image→3D turn (F08 "text hit a ceiling"):** the honest failures — heart (wrong form), koi
  (wrong line), moai@48 (featureless monolith) — are the measured *why*. Text→JSON holds **palette +
  part-inventory** but loses **line** (organic) and **point** (thin), and does not reliably convert
  **blocks→detail** at scale. This is the case for the staged sculptor (E-11) / image→3D / TRELLIS
  (E-09).

**Honesty constraints (carry into the edit):** concepts are Nano-Banana art tagged `[concept]`,
builds are real voxels; show the gaps (the failures are *content*, not bugs to hide); rock over spin
for hero shots. Full per-build evidence: `docs/active/work/T-036-0{1,3,4,5,6,7,8}/fidelity-read.md`,
`runs/003-…/fidelity.md`, `docs/active/work/T-037-0{1,2,3}/fidelity-read.md`, and the
**fidelity-vs-concept frontier** section of `docs/knowledge/design-learnings.md`.
