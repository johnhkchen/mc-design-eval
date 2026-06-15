# T-037-04 — Progress (run log)

Implement phase. Live, metered scale-48 pineapple build executed per `plan.md`. No source code changed —
this ticket *invokes* the fixed pipeline (T-035-01) and records evidence.

## Step 0 — Pre-flight ✅

- `npm run test:unit` → **312 pass / 0 fail** (~1.1 s). Pure surface (incl. `sculptureScaleCaps`) intact.
- Env confirmed: `GEMINI_API_KEY` present in `.env`; claude `-p` shim at `~/.local/bin/claude`;
  `baml_client/` present. No `baml:gen` needed.
- Args sanity: subject `"a pineapple"` (== anchors 004/012), scale `48` (≤ SCALE_MAX 64). Valid.

## Step 1 — Live run ✅

```
npm run bench:sculpture -- --subject "a pineapple" --scale 48 --note "T-037-04 scale-48 study"
```

Ran in background (exit 0, ~229 s wall). Stage log:
- stage 1 (design doc): 2179 chars
- stage 2 (concept image): `gemini-3-pro-image-preview`, ~1135 tok prompt, 18,674 ms
- stage 3 (3-D build): **124 ops**
- 3/4 still: **12176 blocks (unmapped 0)** → `render-3q.png`
- rock turntable: 24 frames → `turntable/`
- done: 12176 blocks, 20,801/17,283 tok, **$0.6518**

Run dir: `benchmarks/sculpture/runs/013-vConcept-a-pineapple/` — **seq 13** (as predicted; 012 was the
in-flight scale-16 sibling at launch, this claimed 13). All outputs present: `design-doc.md`,
`design-doc.prompt.txt`, `build.prompt.txt`, `concept.png`, `artifact.json`, `render-3q.png`,
`summary.json`, `transcript.jsonl`, `turntable/` (24 frames).

Verification: `summary.json` parses, **`scale == 48`**, `blocks 12176`, `unmapped 0`, bounds
`[-12,0,-12]..[12,47,12]` (25×48×25, within ≲48³). Clean exit ⇒ AJV schema passed. No retry needed.

## Step 2 — Render inspection ✅

Read (as images): `concept.png`, `render-3q.png`, turntable frames 000 (corner, == hero) and 018
(cardinal, az ≈ 5°), plus the scale-32 anchor (run 004) and scale-16 sibling (run 012) renders for the
cross-scale comparison.

Observation: the concept is a classic cross-hatched pineapple with a dense crown; the **build renders as
a faithful, recognizable pineapple** — rounded ovoid body, spiky radiating frond crown (lime tips), and
— the headline — **a diamond cross-hatch lattice that actually reads** (darker orange-terracotta
diamonds over enough yellow rows to register). The fixed 45° hero shows a body *corner* (run-004's
problem); the cardinal frame 018 shows the diamond grid face-on and is cited as the best pattern view.

**Headline cross-scale finding:** **opposite of the moai@48 regression.** For the organic form,
*form* fidelity rises roughly monotonically (16 coarse → 32 smooth → 48 smooth+detailed), and the
**cross-hatch — washed out at 32 — finally reads at 48** (more rows let the fine lattice register). The
pattern itself is U-shaped across scale (reads at 16 as a bold blocky checker → vanishes at 32 → reads
at 48 as a fine diamond grid). Effort still did **not** scale with the canvas (tokens out 15.7k → 31.0k
→ 17.3k; ops 213 → 124 — scale 32 drew the most), i.e. the *same* under-spend that wrecked the moai@48 —
but here it was *harmless* because a rounded fruit + repeating texture tolerates coarse volumetric fills,
whereas the moai needed fine relief that fills destroyed. Full evidence + table in `fidelity-read.md`.

## Step 3 — `fidelity-read.md` ✅

Written: side-by-side links (concept ↔ hero ↔ cardinal frame 018 ↔ both anchors), one-line faithfulness
(Strong), shortfall analysis (spidery crown, patchy grid, corner azimuth, modest value contrast), the
**scale-48-vs-32-vs-16 table + the "form monotonic, pattern U-shaped, opposite-of-moai" finding**,
categorical judgment **`faithful` / `Strong`** (vs anchor `recognizable / Competent`), and self-contained
run facts.

## Step 4 — this file ✅

## Deviations from plan

- None material. Timeout was budgeted generous (~15 min); the run finished in ~229 s — faster than the
  scale-32 anchor (382 s) despite ~3.7× the blocks, because the model used fewer/larger ops (the same
  under-spend behavior noted above; here it did not hurt the read).
- The scale-16 sibling (run 012, T-037-03) **completed during this ticket**, so its `summary.json` was
  available — the cross-scale note covers all three points (16/32/48), exceeding the AC's minimum.
  (T-037-03 still owns the *canonical* scale-16 fidelity read; the figures used here are descriptive for
  comparison.)

## Next

Step 5 — commit run + evidence (feat) and the review handoff (docs). Step 6 — `review.md`.
