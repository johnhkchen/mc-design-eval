# T-037-03 — Fidelity-vs-concept read: "a pineapple" @ scale 16 (scale study)

vConcept sculpture build, run `012-vConcept-a-pineapple` (**seq 12, scale 16**). AC#2
(fidelity-vs-concept, framed for 16/32/48) + AC#3 (categorical judgment) deliverable. Evidence lives in
the run dir; this file is the read. Cite this run by **seq + scale** — the slug collides with the
scale-32 anchor (run 004).

## Side by side

- **Concept (Nano Banana, 3/4):**
  [`concept.png`](../../../../benchmarks/sculpture/runs/012-vConcept-a-pineapple/concept.png)
- **3-D build — canonical 3/4 still (az 45°):**
  [`render-3q.png`](../../../../benchmarks/sculpture/runs/012-vConcept-a-pineapple/render-3q.png)
- **3-D build — near-frontal (az ≈ 5°), where the form + lattice read best:**
  [`turntable/frame.018.png`](../../../../benchmarks/sculpture/runs/012-vConcept-a-pineapple/turntable/frame.018.png)

## Faithfulness (one line)

**Recognizably a pineapple at scale 16 — the two-mass silhouette (amber checkered body + green spiky
crown) survives, and, against prediction, the signature lattice reads *more clearly* than at scale 32**
— but the body has lost its rounded ovoid (now a chunky cubic mass) and the crown fronds have
fragmented into thin arms with detached floating tips.

## Where it fell short (the three run-004 axes at ~⅒ the block budget)

1. **Cross-hatch skin — the surprise: it *survived*, and reads better than @32.** Run 004 predicted the
   diamond lattice would "almost certainly disappear" at 16. It didn't. At this scale the model chose a
   **higher-contrast pairing** — `orange_terracotta` field with `yellow_terracotta` studs (run 004 used
   the near-identical-value `yellow_terracotta` field + `orange_terracotta` diamonds, which washed out).
   The studs land as a bold **orange/yellow checkerboard** clearly visible at the near-frontal
   `frame.018`, and even legible at the 45° corner. Fewer blocks forced a *bolder, simpler* pattern
   choice — the coarsening *helped* the read here (counter to the memory
   *concept-image-not-color-value-preview*, because the value gap widened). The lattice no longer reads
   as raised *diamonds* (too few blocks to stagger a true diamond grid) — it reads as a checker — but
   it unmistakably says "patterned pineapple skin."
2. **Rounded body — the main casualty.** The concept (and the doc's "vertical ovoid, widest 7×7 at
   one-third height, octagon section") wanted a smooth egg. At 9×9 footprint and ~8 tall the body has
   too few blocks to round; it reads as a **two-tier chunky cube**, not an ovoid. The rounding that run
   004 nailed at 17×17 is the feature scale took. This is the inverse of the @32 result, where the
   rounded body was a success and the *pattern* was the shortfall.
3. **Spiky crown — partial; thin-element fragility, not the predicted "green cap".** Run 004 predicted
   the crown would "collapse to a green cap." It didn't collapse to a cap — but it didn't hold as a
   lush fan either. The `green_concrete` fronds render as **sparse radiating arms whose 1-wide stepped
   tips detach into floating cubes** (the same thin-element breakup the dancing-man limbs and the @32
   crown tips showed, worse here with fewer blocks). At the 45° still the crown reads almost
   cactus-/cross-like; the near-frontal frame is the truer "frond fan" read. The crown *survives as a
   spiky green top* (the silhouette cue holds) but is the second-weakest element after the body.

## Categorical judgment: **recognizable**  ·  Category-enum: **Competent** (pattern Strong, form Weak–Competent)

Immediately reads as *a pineapple* at the near-frontal angle: correct two-mass form (fruit body +
radiating spiky crown), faithful warm-amber / complementary-green palette carried verbatim concept →
doc → build, and — the headline — a **clearly visible skin pattern**, the very thing that under-read at
scale 32. Not **faithful** because the **rounded ovoid body is lost** (reads cubic) and the **crown
fronds fragment** into floating tips; at the fixed 45° corner the read weakens toward an ambiguous green
plant-on-a-checkered-base. Comfortably above **loose** — no mass is missing or wrong, the subject is
never in doubt at the cardinal view. This **lands on par with the scale-32 anchor's `recognizable`**:
the organic form did **not** degrade more steeply than the angular moai did at 16 — it held
recognizability, just trading *which* attribute it keeps (here: pattern over form; the moai kept form
over finish).

## Run facts (from summary.json — self-contained record)

| field | value |
|-------|-------|
| run id | `012-vConcept-a-pineapple` (**seq 12, scale 16**) |
| method | `vconcept-sculpture.v1` · model `claude-opus-4-8` |
| build ops / blocks | **111 ops** → **332 blocks**, **0 unmapped** (schema-valid) |
| bounds | `[-4,0,-4] .. [4,16,4]` → **9(x) × 17(y) × 9(z)**, radially symmetric body, height = scale |
| style | "warm-analogous-fruit-with-complementary-crown" (model's label) |
| palette | orange_terracotta (body) · yellow_terracotta (lattice studs) · green_concrete (crown) · brown_terracotta (collar/base/seams) |
| concept | Gemini `gemini-3-pro-image-preview`, ~1147-tok prompt, 20.4 s |
| cost / tokens | **$0.6062** · 19950 in / 15697 out |
| wall time | ~215 s |
| turntable | 24 frames, front-arc rock (center 45°, ±40°) |

## Scale-16 vs scale-32 (run 004) — the AC's cross-scale note

| axis | scale 16 (run 012, this) | scale 32 (run 004, anchor) | delta / reading |
|------|--------------------------|----------------------------|-----------------|
| blocks | **332** | 3314 | ~**⅒** the blocks (close to the predicted ~⅛) |
| ops | 111 | 213 | ~half the ops |
| bounds | 9 × 17 × 9 | 17 × 32 × 17 | linear ~half, height = scale both |
| **cross-hatch skin** | **survives — bold orange/yellow checker, clearly visible** | partial — diamonds present but low-contrast, washed out | **scale 16 reads BETTER** (model picked a higher-contrast palette) |
| **rounded body** | lost — chunky cubic mass | success — genuine rounded ovoid | **scale 16 reads WORSE** (too few blocks to round) |
| **spiky crown** | partial — sparse arms, floating detached tips | success — clear jagged frond fan | scale 16 weaker (thin-element breakup worse at low res) |
| palette mapping | orange body + **yellow** studs | **yellow** body + orange diamonds | inverted field/stud choice — the key to the contrast flip |
| cost | **$0.6062** | $0.9905 | cost **fell** with scale (fewer cross-hatch ops); opposite of the moai (@16 cost *more* than @32) |
| judgment | `recognizable` / `Competent` | `recognizable` | **same bucket** — organic form held recognizability at 16 |

**The headline finding:** the two predictions run 004 logged for scale 16 were **both wrong, and in
opposite directions.** (1) The cross-hatch did **not** disappear — it survived *better*, because at a
tighter budget the model chose a bolder, higher-value-contrast field/stud pairing (orange+yellow vs the
@32 yellow+orange that washed out). (2) The crown did **not** collapse to a green cap — it fragmented
into thin floating fronds. And the casualty scale actually claimed was the one @32 got right: the
**rounded ovoid body**, which needs blocks to round and went cubic at 9×9. Net fidelity is **flat
across 16↔32** (both `recognizable`) — what changes is *which* attribute survives, not *how much*.

## Note for the scale study (S-037) + curation (T-038-01)

- **Join key:** seq + `summary.json.scale`, not the slug (collides with run 004). This is run **012,
  scale 16**.
- **The S-037 thesis, refined.** For the *angular* moai (T-037-01) low res cost *finish, not form*
  (graceful degradation). For the *organic* pineapple it is **not** a simple "more degradation" — it is
  a **trade**: pattern gets *clearer* (coarsening forces a bolder palette), form (rounding) gets
  *worse*, crown thins. Both forms stayed `recognizable` at 16; the organic form did **not** fall off a
  cliff as predicted. The interesting cross-form contrast is *what* each keeps, not the bucket.
- **Hero-angle finding repeats** (T-036-01/03/T-037-01): the fixed 45° still shows a *corner*, the worst
  angle for a cardinal-face checker and for a fragmenting crown — `render-3q.png` under-sells it.
  `frame.018` (az ≈ 5°) is the truer read. Curation may prefer the cardinal turntable frame as the @16
  gallery hero. Recorded as a finding, **not changed here** (editing `SCULPTURE_VIEW_3Q` forks the
  archetype and breaks comparability).
- **48-end prediction for T-037-04:** more blocks should let the body round fully *and* render a true
  staggered diamond grid (not a checker) *and* hold un-fragmented fronds — i.e. scale 48 is the build
  most likely to lift the pineapple from `recognizable` toward `faithful`. The contrast ceiling depends
  on whether @48 keeps the @16 orange/yellow pairing or reverts to the @32 washed-out one.
