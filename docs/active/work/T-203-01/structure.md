# T-203-01 — Structure

The blueprint: file-level changes, signatures, ordering. Two pure-core edits (arch-aware
coherence; aperture-aware closure), one runner hand + wiring, one test extension.

## Files

| File | Change | In `npm test`? |
|------|--------|----------------|
| `src/view/aperture-carve.mjs` | + `archedVoidCoherence`; `apertureCoherenceGate` gains opt-in `arch:{spring}` routing COHERENT. | ✅ |
| `src/view/wall-generate.mjs` | `eaveRingClosure` gains opt-in `openCols:Set`. | ✅ |
| `src/view/aperture-carve.test.mjs` | + AR1-AR5 (arch coherence + arch gate + ragged-below-spring + closure-except-aperture + byte-stable). | ✅ |
| `src/view/wall-generate.test.mjs` | + WG-CS9 (eaveRingClosure openCols holds closure-except-aperture; default unchanged). | ✅ |
| `src/workshop/climb-gate.mjs` | + `rebuild_arch` in `TOOL_DEPARTMENTS` (`["OPENING"]`) + `TOOL_STAGE` (`"detail"`). | ✅ |
| `src/workshop/climb-gate.test.mjs` | + assertions for the two new map entries. | ✅ |
| `experiments/eval-alignment/picture-climb.mjs` | + `rebuild_arch` hand; `openColumns` tracking threaded into `closureNow`; `TOOLS`/`MENU`/enum/`formReadyGate` strings; retire `carve_arch` from MENU+enum. | ❌ (metered) |
| `docs/active/work/T-203-01/*` | RDSPI artifacts. | — |

No file is shared with the parallel T-204-01 (roof) work. `eaveRingClosure` was last touched by
T-202-01 (committed `47b7688`) — additive `openCols` only, default-empty byte-identical.

## Interfaces

### `src/view/aperture-carve.mjs`

```js
// NEW — arch-aware void coherence (Decision 1). spring passed in (same value frameArchPlacements uses).
export function archedVoidCoherence(afterOcc, target, { spring }) {
  // single        — void air cells (passage + intrados) = ONE 6-connected component (reuse componentLabels)
  // passageContinuous — every au∈[uLo,uHi] air over [vLo, spring] (a solid there = real notch/blockage)
  // headBuilt     — ≥1 solid ring cell in [spring+1, vHi] at the wall plane wStar (the arch exists)
  // returns { single, passageContinuous, headBuilt, components, notches }
}

// CHANGED — opt-in arch routing; SCOPE + CLOSURE conjuncts unchanged.
export function apertureCoherenceGate(beforeOcc, afterOcc, target, { floor, eaveY, arch } = {}) {
  // ...SCOPE (unchanged)...
  const coherent = arch
    ? (() => { const c = archedVoidCoherence(afterOcc, target, arch); c.ok = c.single && c.passageContinuous && c.headBuilt; return c; })()
    : (() => { const c = carvedVoidCoherence(afterOcc, target);       c.ok = c.single && c.continuous;                      return c; })();
  // ...CLOSURE-except-aperture (unchanged)...
  // reason: when arch && !coherent.ok → name the failing fact
  //   !single → "ragged arch: N void components"; !passageContinuous → "blocked passage: notched columns …";
  //   !headBuilt → "no arch head built (bare rectangle)"
}
```

`spring`/`wStar` geometry: `posOf(ax, au, av, wStar)` (the module's existing helper) probes the
wall-plane column at the carved face; `headBuilt` scans `av∈[spring+1, vHi]` for a solid cell.

### `src/view/wall-generate.mjs`

```js
// CHANGED — closure-except-aperture (Decision 2). Default openCols=∅ → byte-identical to T-202.
export function eaveRingClosure(occ, { floor, eaveY, openCols } = {}) {
  // ...band columns → robustExtent(PROUD_TRIM) clamp → footprint (unchanged)...
  const per = perimeterColumns(footprint);
  if (!openCols || openCols.size === 0) return closureOf(per);   // unchanged authority
  // closure-except-aperture: a perimeter slot that is a declared-open column counts satisfied
  const bb = bboxOf(footprint);                  // local helper already in module (or inline)
  let present = 0; const ring = per;             // reuse the SAME perimeter rectangle as closureOf
  for (const c of perimeterColumns(filledRect(bb))) if (ring.has(c) || openCols.has(c)) present++;
  return present / perimeterColumns(filledRect(bb)).size;
}
```

`closureOf` is *not* forked — the openCols branch reproduces its exact `present/perimeter` math
with the one added `|| openCols.has(c)` term. (If cleaner, add an internal
`closureOfWithOpen(ring, openCols)` and have `closureOf` delegate with `∅`; either keeps one
authority. Implementer's call — must keep `closureOf(ring)` byte-identical.)

### `src/workshop/climb-gate.mjs`

```js
TOOL_DEPARTMENTS = { …, rebuild_arch: Object.freeze(["OPENING"]) }   // beside carve_arch
TOOL_STAGE       = { …, rebuild_arch: "detail" }                      // gated on form-readiness
```

`closureDecidedMove` unchanged (`rebuild_arch` is OPENING, not WALL-form → keeps the picture
gradient, like the other detail hands).

### `experiments/eval-alignment/picture-climb.mjs`

```js
let openColumns = new Set();                       // declared-open aperture cols, set on a kept rebuild
const closureNow = (o) => eaveRingClosure(o, { floor: o.bounds.min[1], eaveY: CFG.eaveY, openCols: openColumns });

function rebuild_arch(occ) {
  // 1. resolve declared arch door + scale width  → REUSE carve_arch's preamble verbatim
  // 2. carveTargetCells → { remove, target }; radius=target.width/2; spring=max(vLo+1, vHi-floor(radius))
  // 3. carved = carveAperture(occ, remove)
  // 4. frameArchPlacements(carved, [apertureFromTarget(target)], { frameBlock }) → head+jambs+arch ring
  //    + sill course (band row vLo-1 across [uLo,uHi] → frameBlock)
  //    + deriveArchHead(wideAp).voussoirs → dress-block crown (S-179)
  // 5. dressed = occupancyFromCells([...carved, ...placements])
  // 6. gate = apertureCoherenceGate(occ, dressed, target, { floor, eaveY, arch:{spring} })
  //    ok  → record openColumns ∪= aperColumns(target); return dressed
  //    else → log REFUTE; return frame_arch(occ)
}

TOOLS = { …, rebuild_arch }            // add; carve_arch stays defined but off-MENU
```

`apertureFromTarget(t)` (existing, line 223) builds the wide aperture record for
`frameArchPlacements`/`deriveArchHead`. The aperture columns helper mirrors `aperColumns(target)`
(currently private in `aperture-carve.mjs`) — **export it** as `apertureColumns(target)` so both
the gate and the runner share one definition (no drift between "what the gate forgives" and "what
`openColumns` tracks").

## Ordering

1. `aperture-carve.mjs`: `archedVoidCoherence` + gate `arch` routing + export `apertureColumns`.
   → AR1-AR3, AR5 green. (Pure, self-contained.)
2. `wall-generate.mjs`: `eaveRingClosure` `openCols`. → AR4 + WG-CS9 green. (Pure.)
3. `climb-gate.mjs` + test: the two map entries. (Pure.)
4. `picture-climb.mjs`: `rebuild_arch`, `openColumns` threading, MENU/enum/strings. (Runner.)
5. Real-build evidence: scoped render of the rebuilt gate beside concept + coherence/closure
   numbers → `progress.md`. Each of 1-4 is independently committable and `npm test`-verifiable.

## Invariants

- `closureOf(ring)` and the default `eaveRingClosure`/`carvedVoidCoherence`/AC1-AC8 paths byte-
  identical (every new behaviour opt-in).
- The carve is the only air op, inside the declared aperture only; recess-by-exclusion elsewhere.
- One coherence authority (gate), one closure authority (`closureOf`), one aperture-column
  definition (`apertureColumns`). No second metric.
