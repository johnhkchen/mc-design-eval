# T-172-01 — Structure

File-level blueprint. Three production touch-points (one substantive, two one-line), one test file,
one experiment runner, plus work artifacts. Nothing under `measurements/`.

## 1. `src/view/roof-generate.mjs` — the covering engine (MODIFY, substantive)

### `generateRoof(gables, family, opts = {})`
- Read `const covering = opts.covering ?? false;` (additive, default-off — the `gableBlock` pattern).
- Inside the per-column loop, before the `for (let y = …)` emission, compute the per-column floor:

  ```js
  // covering (T-172-01): hollow the wedge interior; fill only the riser-sealing depth below the
  // surface so steep slopes stay watertight. Gable-END walls (envelope) and sheet columns keep
  // their existing floors. Absent opts.covering ⇒ byte-identical solid wedge.
  let coverFloor = floor;
  if (covering && !own?.sheet && !own?.gableEnd) {
    let minNbrTop = Infinity;
    for (const dir of ["+x", "-x", "+z", "-z"]) {
      const nh = at(dir);                  // at() already defined above (downhill helper neighbour)
      if (nh !== undefined) minNbrTop = Math.min(minNbrTop, Math.floor(nh));
    }
    if (Number.isFinite(minNbrTop)) coverFloor = Math.max(floor, Math.min(top, minNbrTop + 1));
    else coverFloor = top;                 // isolated column: surface only
  }
  ```
- Change the emission bound: `for (let y = own?.sheet ? top : coverFloor; y <= top; y++)`.
  (sheet path unchanged; non-covering ⇒ `coverFloor===floor` ⇒ identical to today.)
- **Gable-end interior cells still fill** because gable-end columns force `coverFloor=floor`; the
  existing `gableBlock && own?.gableEnd && y < top` branch is untouched.
- No signature change to the return shape. `counts.full` simply drops in covering mode (fewer
  interior cells). Optionally surface this as it already is (full count is informational).
- `at(dir)` is the local neighbour-height closure already declared in the loop (used for stair/slab
  detection) — reuse it; do not add a second neighbour reader.

### New exported helper (census, pure)
```js
/** Roof-FIELD cell fraction of a generated roof (full+stair+slab in family blocks ÷ all cells) —
 *  the prism census. Gable-wall cells (envelope) are excluded. PURE. */
export function roofFieldFraction(gen) { … }   // returns {field, total, frac}
```
Used by the runner's census and by a unit test (the offline "well under 72 %" proof on synthetic
gables). Small, self-contained, no IO.

## 2. `src/form/provision-generate.mjs` — propagate covering (MODIFY, one line)

Line ~221: `const gen = generateRoof(roof.gables, family, { gableBlock });`
→ `const gen = generateRoof(roof.gables, family, { gableBlock, covering: true });`

Rationale: the generate-first chain's roof should be a covering too (it already passes `gableBlock`,
already multi-ridge). Default-off elsewhere; here we opt in. Guarded by `provision-generate.test.mjs`
(must stay green; if a pin asserts solid roof interior, gate behind an option instead — see Plan
step 4 verification). Reversible to a no-op if a pin blocks it (report).

## 3. `src/view/roof-generate.test.mjs` — covering tests (MODIFY, add cases)

Append a `--- T-172-01: covering (hollow over the envelope) ---` block:
- **`covering hollows the wedge interior`** — pitch-1 gable: assert interior cells (`floor < y <
  top−1` on a slope column) are ABSENT in covering mode but PRESENT in solid mode.
- **`covering pitch 2 stays watertight (no daylight column)`** — for every column, the slope face
  toward its lowest neighbour is sealed: assert no `y` between this column's `top` and
  `minNbrTop+1` is missing (the riser is solid). Concretely: every column has cells filling
  `[coverFloor, top]` and `coverFloor ≤ minNbrTop+1`.
- **`covering keeps the sloped surface byte-identical`** — `cells.filter(c=>c.form==='fixture')` and
  `capKeys` deep-equal on/off (only interior full cells differ), mirroring the gableBlock pin.
- **`covering preserves gable-end walls + closure`** — with `gableBlock`, `gableWallKeys` identical
  on/off; `closureOf`(footprint perimeter from `heights`) identical on/off.
- **`covering census: field fraction falls well under solid`** — tall pitch-1 gable, assert
  `roofFieldFraction(coveringGen).frac` ≪ solid and below 0.72-scale proxy (e.g. covering total <
  0.5 × solid total for a wide gable).
- **`absent covering ⇒ byte-identical legacy`** — regression pin (the proven posture).
- **multi-gable covering still composes** — the two-intersecting-gables fixture in covering mode:
  valley column still owned by the lower gable; both surfaces present.

Imports: add `roofFieldFraction`; reuse `closureOf` import from `../view/wall-generate.mjs` (or
inline a tiny perimeter check to avoid a cross-module test dep — prefer importing `closureOf`).

## 4. `experiments/eval-alignment/roof-climb.mjs` — multi-ridge + covering (MODIFY)

- Add imports: `registerRect, closureOf` from `../../src/view/wall-generate.mjs`;
  `readFileSync`/`existsSync` for the program; `roofFieldFraction` from roof-generate.
- After carving `kept` + computing the bbox & `eaveCols` (cols at `y===EAVE_Y`):
  - Try `const prog = loadProgram(SUBJECT)` (`recognition/{subject}.program.json`).
  - If `prog?.masses?.length`: `const reg = registerRect(prog.masses, eaveCols)`. Build one
    `gableRecord` per mass via `reg.transform`; collect `gables[]`. Log `reg.reason` + per-mass
    ridge. If `reg.ambiguous` or no program → single-bbox gable fallback (log it).
  - `gableBlock` = the dominant kept wall block at the eave (mode of `kept` blocks at `y===eaveY`),
    so the gable-end envelope matches the walls.
  - `const gen = generateRoof(gables, FAMILY, { covering: true, gableBlock });`
- Census: `roofFieldFraction(gen)` and the roof-field fraction of the *whole* new artifact; print
  old (carved blob/solid) vs new.
- `closureOf` of the kept wall-band ring (perimeter of `eaveCols`) — report (no-regress witness).
- Output dir → `builds/${SUBJECT}/roof-covering/` (NEW; preserves committed `new-roof`).
- Gate the metered `score()` calls behind `--score` (default OFF). Without it: render 4 views +
  census + closure only (no model calls).
- Optional `--beside`: compose a beside-concept PNG (reuse the multi-angle/montage helper if present;
  else write the `+x+z` view + note to compare against `CONCEPT`).

## 5. Work artifacts (`docs/active/work/T-172-01/`)

`research.md` (done), `design.md` (done), `structure.md` (this), `plan.md`, `progress.md`,
`FINDINGS.md` (census table old/new + closure + render notes), `review.md`, plus the render evidence
(`roof-covering` views, copied beside-concept PNGs for cottage + barn).

## Ordering / dependencies

1. Engine + `roofFieldFraction` (step 1) — self-contained, unit-testable first.
2. Tests (step 3) — pin the engine before any caller uses it.
3. `provision-generate` one-liner (step 2) — verify the generate-first suite stays green.
4. `roof-climb` wiring (step 4) — depends on the engine + `roofFieldFraction`; produces evidence.
5. Run cottage/barn (+gatehouse) renders + census; write FINDINGS + review.

Each of 1–4 is independently committable. `npm test` must be green after 1–3; step 4 is verified by
running (no unit tests, per harness posture).
