# Progress — T-010-01 (detail lever B: contrast-preserving block-texture grain)

## Step 1 — Lever applied ✅
Edited `composeRefRevisionPrompt` in `benchmarks/temple-facade/run.mjs`: the `Detail —` bullet swapped
from the relief mechanism to a **texture-grain** mechanism (two bullets). `git diff` vs HEAD confirms a
clean single-mechanism swap.

**Baseline clarification (important):** HEAD's committed champion is the **original 015 menu**
(`"Detail — NO LARGE FLAT FIELDS … recessed panels, pilaster strips, string-courses, banding, or inset
ornament …"`). S-006's recessed-panel grammar was an **uncommitted, un-promoted** working-tree edit
(gen 1 = run 016 came back `detail=competent`; gen 2 = run 017 never completed). My edit replaced that
working-tree text, so the diff vs the committed champion is exactly **menu → texture grain** — a clean
A/B from the same 015 baseline S-006 was measured against. The on-disk panel grammar is thus correctly
retired (it never earned promotion).

**Diff (committed baseline → now):**
- BEFORE (HEAD / 015 champion): "Detail — NO LARGE FLAT FIELDS: any wall plane wider than ~6 must carry
  layered relief — recessed panels, pilaster strips, string-courses, banding, or inset ornament … treat
  any blank field as unfinished." (a relief menu)
- AFTER (texture lever B): bullet 1 — *patterned* grain from **texture variants of the field's own
  material family** (alternate smooth/cut/chiselled courses, brick-vs-cut banding, quoined/checker
  motif, stair/slab string-grain); regular & legible, never random speckle; no plane >~6 a single
  uniform block; fill/box/line runs; variants declared in `palette.manifest`. Bullet 2 — the **anti-v5
  color guard**: grain changes texture NOT hue; same color family per field; never lower contrast or
  smear toward monochrome; dominant stays dominant; **accents un-grained, single & saturated**; drop any
  grain that washes the palette out.

The one-plane / proportion / relief-depth / color-restore bullets are intact and ahead of the new ones,
so exactly the detail *mechanism* changed (geometry → texture).

## Step 2 — Tests green ✅
`npm test` → **133 pass, 0 fail**. No `baml:gen` needed (no `.baml` touched).

## Step 3 — Round-0 judge helper ready ✅
Copied T-006-01's `judge-round0.mjs` → `docs/active/work/T-010-01/judge-round0.mjs` (same `judgeRender`
seam, median-of-3, `TEMPLE_FACADE_TASK.goal`).

## Step 4 — Generation 1 run (018) — LAUNCHED ⏳
`node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc --ref references/taj_mahal.png`
launched as background task `b8f8lypa4` (log `/tmp/t01001-gen1.log`). ~15–18 min, 3 `claude -p` calls +
judge. Harness re-invokes on completion → then judge round-0, capture A/B, decide on gen 2.

## A/B scoreboard (to fill in)

| gen | run id | round | proportion | color | detail | fidelity | overall |
|-----|--------|-------|-----------|-------|--------|----------|---------|
| baseline 014 | 014 | render | strong | strong | competent | strong | strong |
| baseline 015 | 015 | render | strong | strong | strong* | strong | strong |
| S-006 panels | 016 | render | strong | strong | **competent** | strong | strong |
| B / texture | 018 | round-0 | | | | | |
| B / texture | 018 | render | | | | | |
| B / texture | 019 | round-0 | | | | | |
| B / texture | 019 | render | | | | | |

\*015 detail=strong was boundary-noise (notes prose said competent; window-grain, not field relief).
**Color is a co-equal gate this ticket** (v5 crashed color 4→2.67 on uniform grain) — watch it as
closely as detail.

## Pending steps
5 — judge round-0(018); 6 — gen 2 (019) + judge; 7 — 015-baseline texture comparison; 8 — verdict
(promote/scope/discard per AC); 9 — revert to the 015 champion iff not promoting (note: revert target is
the **menu**, not S-006's panels, since S-006 didn't promote); 10 — journal attempt-log entry w/ the
S-006-vs-S-010 mechanism comparison; 11 — review.md.
