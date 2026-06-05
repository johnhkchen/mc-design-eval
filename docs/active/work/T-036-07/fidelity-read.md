# T-036-07 — Fidelity-vs-concept read: "a mushroom" (scale 32)

vConcept sculpture build, run `008-vConcept-a-mushroom`. AC#2 (fidelity-vs-concept) + AC#3
(categorical judgment) deliverable. Evidence lives in the run dir; this file is the read.

## Side by side

- **Concept (Nano Banana, 3/4):**
  [`concept.png`](../../../../benchmarks/sculpture/runs/008-vConcept-a-mushroom/concept.png)
- **3-D build — canonical 3/4 still (az 45°, el 30°):**
  [`render-3q.png`](../../../../benchmarks/sculpture/runs/008-vConcept-a-mushroom/render-3q.png)
- **3-D build — best turntable frame (near-side, az ≈ 5°):**
  [`turntable/frame.006.png`](../../../../benchmarks/sculpture/runs/008-vConcept-a-mushroom/turntable/frame.006.png)

## Faithfulness (one line)

**Faithful in every element, recognizable at a glance** — the build reproduces the concept's *Amanita
muscaria* read item-for-item (wide red cap **overhanging** a pale stem, white cap spots, a white gill
ring under the rim, a green mound base), in the exact complementary red-on-green palette; it reads
unmistakably as *a mushroom* from the near-side and 3/4.

## Where it fell short

1. **The cap terraced into a stepped cone, not a smooth dome.** The single real organic-curve loss: the
   hemispherical cap voxelized as a stack of concentric square rings — a ziggurat/stepped-cone profile
   rather than a rounded belly. From the canonical 3/4 still (`render-3q.png`), which looks *down* at
   el 30°, this is most pronounced: the top reads as a red stepped pyramid and the stem is largely
   hidden beneath the cap, so the still under-sells the "mushroom" gestalt. The **near-side turntable
   frame (`frame.006`) rescues the read** — there the cap clearly flares wider than the stem and
   overhangs it, the pale stem and green mound are fully visible, and it is obviously a toadstool. An
   angle/curvature shortfall, not a build-arrangement shortfall.
2. **Cap overhang — the key cue — is PRESENT (the win, not a shortfall).** Worth recording explicitly
   against the prediction: the design doc itself cited the dome-overhang rule
   (memory *voxel-onion-dome-and-bay-framing*) and the build honored it — the cap rim genuinely
   overhangs the stem with a shadow gap beneath, which is the one cue that separates "mushroom" from
   "tree/lollipop/cone". This is why even the stepped cap still reads as a mushroom.
3. **Block-vocabulary craft note.** The model did **not** reach for Minecraft's literal
   `red_mushroom_block` / `mushroom_stem`; it built from generic naturalism blocks — `red_concrete`
   (cap), `bone_block` (stem, "warm off-white, not sterile"), `moss_block` (base mound),
   `white_concrete` (spots + gill ring). A defensible, schema-valid choice that gives cleaner solids
   than the textured mushroom blocks would.
4. **Color-value gap (mild, memory *concept-image-not-color-value-preview*).** The concept shows a
   vivid scarlet cap; `red_concrete` renders a deeper brick/crimson — duller and darker than the
   concept promised. The hue is right, the value is muted; it does not cost recognizability (a darker
   red toadstool is still a toadstool) but it is the expected value drift, noted.
5. **Spots small/sparse.** The white_concrete cap dabs survive voxelization but read as a few small
   flecks rather than the concept's bolder dots; the white gill ring under the rim reads more clearly
   than the top spots.

## Categorical judgment: **recognizable** (strong)

Immediately and unambiguously *a mushroom*: correct top-heavy lollipop silhouette, a cap that **flares
and overhangs** the stem (the make-or-break cue, achieved), white spots + gill ring, pale stem, green
mound — every element of the concept's Amanita is present and in the right place, in the right palette.
Not **faithful** only because the smooth dome terraced into a stepped cone and the canonical still angle
(el 30° look-down) under-shows the stem; the muted-red value drift is secondary. Well above
**loose/failed**. This **meets and slightly exceeds** the ticket's "reasonably faithful" prediction and
confirms the form-note hypothesis: a domed-cap-on-stem is the **friendliest organic subject** in the
breadth set — the only organic build so far whose key gestalt cue (overhang) survived voxelization
intact. The cleanest organic read of S-036 to date.

## Run facts (from summary.json — self-contained record)

| field | value |
|-------|-------|
| run id | `008-vConcept-a-mushroom` (seq 8) |
| method | `vconcept-sculpture.v1` · model `claude-opus-4-8` |
| build ops / blocks | 50 ops → **4411 blocks**, **0 unmapped** (schema-valid) |
| bounds | `[-11,0,-11] .. [11,30,11]` → 23(x) × 31(y) × 23(z) — radially symmetric footprint, top-heavy |
| style | "amanita-toadstool naturalism" (model's label) |
| palette | red_concrete · bone_block · moss_block · white_concrete |
| concept | Gemini `gemini-3-pro-image-preview`, ~4587-char prompt, 20.3 s |
| cost / tokens | **$0.6459** · 20587 in / 17201 out |
| wall time | ~375 s |
| turntable | 24 frames, front-arc rock (center 45°, ±40°, el 30°) |

## Note for E-13 curation (T-038-01)

Two cross-subject signals for the breadth roll-up: (1) **the mushroom is the organic-fidelity high-water
mark** — the radial-symmetry + overhang make it the easiest organic form for the text-JSON archetype,
the opposite end of the frontier from the heart (T-036-05); (2) **the fixed el 30° hero-still angle
under-shows top-heavy/overhanging subjects** by looking down onto the cap and hiding the stem — same
azimuth/elevation finding flagged on the dancing man (T-036-01), now with a *second* subject. The
near-side turntable frame (`frame.006`) is the better gallery hero here. Recorded as a finding,
**not changed here** (tuning the shared `SCULPTURE_VIEW_3Q` would fork the archetype and break breadth
comparability across the eight T-036-* builds).
