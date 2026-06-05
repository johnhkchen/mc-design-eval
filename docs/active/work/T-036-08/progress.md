# T-036-08 — Progress (Implement run log)

What actually ran, in order, with real numbers. No source code was written — this ticket *invokes* the
T-035-01 pipeline and records evidence. This is the **eighth and last** of the S-036 sibling builds.

## Pre-flight (Step 0)

- `npm run test:unit` → **312 pass / 0 fail** (baseline, before any metered call).
- Env confirmed: `baml_client/` present; `GEMINI_API_KEY` resolvable via `.env` (2 hits,
  `src/nano-banana.mjs`); claude `-p` shim at `~/.local/bin/claude`; `render/node_modules` present.

## Step 1 — Live benchmark run

Command:
```
npm run bench:sculpture -- --subject "a koi fish" --scale 32 --note "T-036-08 build"
```
Exit code **0**. Stage log:
- **Stage 1 (design doc):** 2130 chars → `design-doc.md`. Read: fat carp mid-swim; three masses
  (deep rounded body / blunt head with downturned mouth / wide flowing tail); shallow S-bend for
  motion; **Kohaku two-tone** white body + red-orange blotches + black eye; `light_blue_concrete`
  water-splash base so it never floats. Budget head 7 / body 16 / tail 9 along a ~32 nose→tail axis.
- **Stage 2 (concept image):** `gemini-3-pro-image-preview`, ~1123-tok prompt (4492 ch), **17.9 s** →
  `concept.png` (one 3/4 Kohaku koi on solid black — vivid S-curve body, orange-on-white patches,
  fanned tail, blue splash).
- **Stage 3 (3-D build):** **60 ops** → `artifact.json`, schema-valid (clean exit = AJV passed).
- **Render:** 3/4 still **1997 blocks, 0 unmapped** → `render-3q.png`; **24-frame** rock turntable →
  `turntable/`.
- **Totals:** 1997 blocks, 20022 in / 21719 out tok, **$0.7560**, ~321 s wall.

Run dir `benchmarks/sculpture/runs/009-vConcept-a-koi-fish/` written with all 9 outputs + `turntable/`
(24 frames); `benchmarks/sculpture/README.md` RUNS block auto-regenerated (row/gallery `009`).

**Seq as predicted:** `nextSeq()` returned **009** (008 mushroom was the last on disk). No concurrent
sibling race this time — this is the last of the eight, so 009 matched the plan exactly.

No retries — the run succeeded on the first attempt. No partial/stale dirs to clean.

## Step 2 — Render inspection

Viewed `concept.png`, `render-3q.png`, and turntable `frame.000.png`, `frame.006.png`, `frame.018.png`.
Cross-checked against `design-doc.md` and the artifact's palette.

**Key observations (findings, not defects to fix here):**
- The build carries the **Kohaku palette and all named masses verbatim** — white body, orange/red
  blotches, black eye, orange cheek, fanned tail, pectoral stubs, blue water splash. From the
  **broadside (frame.018)** it reads unmistakably as *a koi*.
- The concept's **swimming S-curve** voxelizes to a near-straight chunky loaf (the S-bend survives only
  as a slight kink); the **flowing tail** becomes a flat stepped slab of 1-block ribs; the fins shrink
  to stubby orange tabs. The expected smooth-organic / thin-membrane loss — the largest curve loss of
  the eight subjects, as the form note predicted.
- **The canonical 45° still foreshortens it hard:** `render-3q.png`/frame.000 catch the fish
  head-toward-camera (tail receding) and read as a stubby blob; `frame.006` (near end-on) is the genuine
  worst angle (unreadable lump). The **broadside frame.018** is the truthful view. Same azimuth-
  dependence dancing-man (002) and sword (007) flagged — acute here because a fish's silhouette lives on
  its broad flank.
- 1997 blocks is mid-high for the series (vs moai 3414, sword 166) — a curved *solid* body spends
  volume, but with low fidelity-per-block.

## Step 3 — Fidelity read

Wrote `fidelity-read.md`: concept↔render side-by-side (+ broadside frame.018 and worst-case frame.006),
faithfulness line, four shortfall points **including the AC-mandated curve/fin-loss line**, run facts,
and a curation note. **Categorical judgment: `recognizable` (low–mid, broadside-dependent)** — clears
`loose` because the koi (and its Kohaku colouring) is unambiguous at the right angle; short of
`faithful` because the S-curve and flowing fins are stepped/stubbed away and the build is view-fragile.
Slightly **beats** the ticket's pessimistic "large gap" prediction (silhouette survives at broadside
rather than collapsing) while correctly being the **lowest, most curve-starved** point of the spread.

## Deviations from plan

- **None of note.** Seq landed at 009 exactly as planned (no sibling race — last ticket). Frame count
  left at the runner **default (24)** per Design Decision 3. Cited the broadside turntable frame
  (frame.018) in the read per Design Decision 7, since the canonical 45° still foreshortens the fish.

## Step 4/5/6 — remaining

- Commit run dir + regenerated README + work-dir docs (Step 5).
- Re-confirm `npm test` green; write `review.md` (Step 6).
