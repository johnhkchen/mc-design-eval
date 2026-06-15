# T-166-01 — Progress

Implementation log + deviations from `plan.md`. All steps committed; `npm test` green (2226) throughout.

## Steps completed

- **Step 1 — pure scoring core + test.** `src/workshop/bakeoff-score.mjs` + `bakeoff-score.test.mjs` (10
  tests). Commit `1a92c5a`. Suite 2216→2226.
- **Step 2 — scripts.** `bakeoff` + `clean-wrong-style` in `package.json` (with Step 1).
- **Step 3 — Claim 2 crater harness.** `clean-wrong-style.mjs`; transport probed first (minimal `claude
  -p` → "ok"); ran live (4 conditions × 2 votes). **DID NOT CRATER** (A=52, B=46, B2=40, C=58; spreads
  inside ±12). Commit `2f75c8c` (harness + `results/clean-wrong-style.json` + 3 beside-concept PNGs).
- **Step 4 — Claim 1 bake-off.** `bakeoff.mjs`; ran live (2 states × 3 votes). **split 3/6, fused 6/6**
  after the adapter fix. Commit `2c6ffe0` (harness + adapter fix + `results/bakeoff.json`).
- **Step 5 — FINDINGS.** `FINDINGS.md`. **Step 6 — Review.** `review.md`. Commit `b34c4b4` (with all
  RDSPI artifacts).

## Deviations from plan (documented, with rationale)

1. **Claim-1 state set changed during render inspection.** Plan named gatehouse-baseline (ROOF) + barn +
   cottage. *Found:* gatehouse `baseline`/`autonomy` have only **one** saved azimuth — the 4-render gate
   lens can't be fed, so excluded (logged in `results/bakeoff.json`, not padded). `cottage-r1` was a
   chaotic blob with no single unambiguous department → excluded. Replaced with `cottage-newroof` (roof
   coherent, lower-storey walls holey → WALL, medium confidence). Final set: **barn-r1 (ROOF) +
   cottage-newroof (WALL)**, 2 distinct ground truths. `VOTES` bumped 2→3 to compensate for fewer states.
   The thin, ROOF-clustered corpus is itself reported as the claim-1 limitation.
2. **Adapter precedence fix (consequential — see FINDINGS).** During the run the fused cottage region
   `"upper storey walls"` mis-filed to ROOM (the keyword `"storey"` outranked `"walls"`), yielding a TIE.
   Fixed `regionToDepartment` to check **WALL before ROOM** and dropped `"storey"`/`"story"` from ROOM (a
   storey is an envelope level, not a room) — a defensible correctness fix decided on its own merits, not
   to chase a verdict. Pinned by a new BO1 assertion. The fused departments were **re-derived offline from
   the saved raw `fusedRegion` strings** under the corrected adapter (no model re-run; split outputs are
   the live run). The fix moved TIE→fused 6/6, which is itself the reported finding (lossy free-text
   channel ⇒ argument for typed dispatch).
3. **Crater program held FIXED as a synthetic gatehouse program** (the gatehouse has no committed
   recognition program). It is a constant across all conditions — not a variable — and labelled a
   stand-in; the manipulated variables are only (concept, style_profile).
4. **Reused `decodeImage`** (`src/color/palette-extract.mjs`) for the beside-concept compose — the
   benchmark `concept.png` files are actually **JPEG** bytes; `toB64` sniffs the media type for the model
   calls too.

## Verification
- `npm test` green (2226) after every commit.
- Both live runs produced committed JSON + PNG evidence; transport confirmed working before spend.
- Frozen instrument / gate / transport-guard / `loop.mjs` / BAML sources untouched (no diffs there).
</content>
