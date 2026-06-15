# T-036-08 — Fidelity-vs-concept read: "a koi fish" (scale 32)

vConcept sculpture build, run `009-vConcept-a-koi-fish` (seq landed at **009** as predicted — last of
the eight S-036 siblings). AC#2 (fidelity-vs-concept) + AC#3 (categorical judgment) deliverable.
Evidence lives in the run dir; this file is the read.

## Side by side

- **Concept (Nano Banana, 3/4):**
  [`concept.png`](../../../../benchmarks/sculpture/runs/009-vConcept-a-koi-fish/concept.png)
- **3-D build — canonical 3/4 still (az 45°):**
  [`render-3q.png`](../../../../benchmarks/sculpture/runs/009-vConcept-a-koi-fish/render-3q.png)
- **3-D build — turntable broadside (the truthful view):**
  [`turntable/frame.018.png`](../../../../benchmarks/sculpture/runs/009-vConcept-a-koi-fish/turntable/frame.018.png)
  · near-end-on worst angle for contrast:
  [`turntable/frame.006.png`](../../../../benchmarks/sculpture/runs/009-vConcept-a-koi-fish/turntable/frame.006.png)

## Faithfulness (one line)

**Right palette and parts, wrong line** — the build carries the concept's Kohaku scheme verbatim
(`white_concrete` body, `orange`/`red_concrete` blotches, `black_concrete` eye, `light_blue_concrete`
water splash) and all the named masses (blunt head with eye + orange cheek, deep body, fanned tail,
pectoral stubs), and from the **broadside** (frame.018) it reads unmistakably as *a koi*; but the
concept's elegant swimming **S-curve** and **flowing translucent fins** are gone, replaced by a
straight chunky body and flat stepped fin-slabs.

## Where it fell short

1. **Curve/fin loss (the AC-mandated line).** The koi's identity — a gentle **S-bend body and
   trailing, membranous fins/tail** — is exactly what the voxel grid cannot hold: the body voxelizes to
   a near-straight rectangular loaf (the planned S-bend reads only as a slight kink), the broad flowing
   tail becomes a **flat fanned slab of 1-block ribs**, and the dorsal/pectoral fins shrink to stubby
   orange tabs. This is the expected smooth-organic gap — curvature and thin membranes are stepped or
   stubbed away. It is the largest curve loss of the eight subjects, as predicted for this anchor.
2. **The canonical 45° still badly foreshortens it.** `render-3q.png` (and frame.000) catch the fish
   head-toward-camera with the tail receding, so the still reads as a stubby boxy blob and *under-sells*
   the build; the **broadside frame.018** is far more truthful (full body arch + tail fan + eye + water
   base). Same azimuth-dependence the dancing-man and sword siblings flagged — here it is acute because
   a fish's whole silhouette lives on its broad flank, which the 45° hero angle quarters away. The
   near-end-on frame.006 is the genuine worst case (an unreadable lump).
3. **Pattern reads as stripes, not Kohaku blotches.** The concept's crisp irregular red-orange islands
   on white become more banded/striped across the body at block scale; recognizable as koi colouring
   but coarser and more regular than the concept's painterly patches.
4. **Blocky everything (expected at 1997 blocks).** Head, body and tail are chunky prisms; the mouth and
   fin rays are suggested in 1-block steps rather than shaped. The water-splash base reads well and
   keeps the fish grounded (it never floats).

## Categorical judgment: **recognizable** (low–mid; broadside-dependent)

From the **broadside** it is immediately *a koi* — deep two-tone body, blunt head with a black eye and
orange cheek, fanned tail, pectoral stubs, water splash — all named masses present in roughly the right
proportions and the Kohaku palette carried verbatim concept → doc → build. It clears **loose** because
the fish (and specifically the *koi* colouring) is unambiguous at the right angle; it falls well short
of **faithful** because the swimming S-curve and flowing fins — the koi's *grace* — are stepped/stubbed
away, and because the build is **view-fragile** (the canonical 45° still and the end-on frame both read
as a blob). This is **slightly better than the ticket's pessimistic "large gap" prediction**: the
silhouette survives at broadside rather than collapsing — but it is correctly the **lowest, most
curve-starved** point of the eight-subject spread, the smooth-organic anchor opposite the angular moai.

## Run facts (from summary.json — self-contained record)

| field | value |
|-------|-------|
| run id | `009-vConcept-a-koi-fish` (seq 9, as predicted — last sibling, no race) |
| method | `vconcept-sculpture.v1` · model `claude-opus-4-8` |
| build ops / blocks | 60 ops → **1997 blocks**, **0 unmapped** (schema-valid) |
| bounds | `[-15,0,-7] .. [16,15,7]` → 32(x) long × 16(y) tall × 15(z) deep — horizontal swimming pose |
| orientation | horizontal, nose→tail along x (uses full 32 length budget); slight S-kink |
| palette | white_concrete (body) · orange_concrete + red_concrete (Kohaku patches) · black_concrete (eye) · light_blue_concrete (water splash base) |
| concept | Gemini `gemini-3-pro-image-preview`, ~1123-tok prompt (4492 ch), 17.9 s |
| cost / tokens | **$0.7560** · 20022 in / 21719 out |
| wall time | ~321 s |
| turntable | 24 frames, front-arc rock (center 45°, ±40°) |

## Note for E-13 curation (T-038-01)

The **hard anchor** of the breadth spread, and it behaves as designed: a smooth-organic subject loses
its defining *curve* (S-bend → straight loaf) and *thin membranes* (fins/tail → stepped slabs/stubs)
to the grid, while keeping enough mass + palette to still read as the named thing. Two cross-subject
signals reappear, strongest here: (a) **the fixed 45° still under-shows a broad-flank subject** — for a
fish it is acute (the hero angle quarters away the whole silhouette; frame.018 broadside is the honest
view) — the same azimuth-dependence dancing-man (002) and sword (007) flagged; and (b) **models step
curves and stub thin appendages** at this scale. Highest block count of the thin/organic group (1997)
but lowest *fidelity per block* — a curved solid body spends volume that an angular subject spends on
readable edges. Recorded as findings, **not changed here** (editing the shared `SCULPTURE_VIEW_3Q` or
the prompt would fork the archetype and break breadth comparability across the eight T-036-* builds).
