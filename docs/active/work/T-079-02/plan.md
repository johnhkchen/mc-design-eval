# T-079-02 — Plan: ordered, verifiable steps

Each step is small enough to commit atomically. Pure cores + their unit tests first (verified by `npm
test`), then the runners (verified by on-demand GL runs), then proof + journal. The deterministic
geometry is unit-tested; the GL/metered edges degrade gracefully and are verified by inspection.

---

## Step 1 — `structuralZones` in `structural-read.mjs` (+ unit test)

**Do:** add the pure `structuralZones(occ, opts)` export (Structure §1). Add `structuralZones` to the
`structural-read.test.mjs` import and a test (Structure §5): base/upper/roof classification on a
synthetic stone-base + upper-wall + flat-roof build; `storeyDivide === floorLines[1]`.

**Verify:** `node --test src/view/structural-read.test.mjs` green; new assertions pass.

**Commit:** `feat(E-23 T-079-02): structuralZones — pure base/upper/roof voxel classifier`

---

## Step 2 — `paintFace` zone gate (+ unit test)

**Do:** extend `paintFace` with `{zoneOf, allowedByZone}`, the `zoneRejected` counter, and the
`allowedByZone instanceof Map` guard (Structure §2). Add the zone-gate test to `face-paint.test.mjs`
(Structure §6): base rejects plaster, upper accepts, roof rejects.

**Verify:** `node --test src/view/face-paint.test.mjs` green — the five existing cases (no `zoneOf`)
unchanged, the new case asserts `zoneRejected` counts and that only upper-zone voxels are painted.

**Commit:** `feat(E-23 T-079-02): paintFace zone gate — splat ∩ structural-zone, zoneRejected counter`

---

## Step 3 — full pure suite green

**Do:** nothing new; gate the cores.

**Verify:** `npm test` — all `src/**/*.test.mjs` green (was 976; now 976 + 2). No regressions in
`face-paint`, `structural-read`, `surface-coherence`.

**Commit:** (folded into Step 2 if clean; otherwise a fixup.)

---

## Step 4 — standalone `spray-paint.mjs`: seal-first + zone mask + proof

**Do:** Structure §3 — imports; `ZONE_MATERIALS`; seal raw → `sealed`/`occ`; build `zoneOf` +
`allowedByZone`; pass the mask to both `paintFace` calls; add `surfacePlasterByZone` helper; run the
unmasked paint too for the before/after histogram; throw if masked `histAfter.base|roof !== 0`; extend
the record + `renderMd`; reword the refine note; extend `--offline`.

**Verify (offline path, no GL/model needed for the geometry):**
- `node benchmarks/sculpture/spray-paint.mjs` runs to completion (GL face renders best-effort; the
  deterministic core always runs).
- Console + `spray-paint/cottage.json` show: `zones.histogram.masked = {base:0, upper:>0, roof:0}` and
  `unmasked` spreading plaster into base/roof (the smear). `zoneRejected > 0` on the front face.
- The throw does **not** fire (masked base/roof = 0). Deliberately breaking the mask (temporarily) makes
  it fire — confirming the guard is live.
- `npm run` / `node ... --offline` reports the reversal CONFIRMED with zone histogram clean.

**Commit:** `fix(E-23 T-079-02): spray-paint seals before painting, masks splat by structural zone`

---

## Step 5 — milestone `hollow-cottage-milestone.mjs`: reorder + mask + assets

**Do:** Structure §4 — reorder to **seal → paint** on the raw build; run zone-masked paint on the sealed
occupancy; drop the post-paint seal; same throw-on-violation; thread `paintedOcc` into the hollow stage;
refresh `pr/assets`; add `zones` to the report's resemblance gate.

**Verify:**
- `npm run milestone:cottage` runs end-to-end. The chain log shows `seal → paint → hollow → floorplan`.
- `milestone-report.json`: `gates.exteriorResemblance.plaster` reversed; new `zones.histogram` clean
  (base 0, roof 0); `hollow.exteriorHeld.held === true`; `floorplan ... exteriorHeld true`; both gates
  pass/blind as before. No throw.
- `pr/assets/cottage-face-after.png` + `cottage-multi-angle.png` refreshed; visual check: three clean
  bands (stone base / plaster+timber upper / wood roof), no pink smear, no floating painted blocks.
- The milestone build still `assertArtifact`-valid.

**Commit:** `fix(E-23 T-079-02): milestone seals before paint + zone-masked skin; refresh PR assets`

---

## Step 6 — visual proof captured to the work dir

**Do:** save before/after cottage front (+z) + side (+x) renders to `docs/active/work/T-079-02/`
(`view-front-before.png`/`view-front-after.png`/`view-side-before.png`/`view-side-after.png`), copied
from the runner outputs. If GL is unavailable on the host, record the gap honestly in `progress.md` and
rely on the deterministic histogram + the milestone-refreshed `pr/assets`.

**Verify:** the four PNGs exist (or the gap is recorded); the after renders show banded skin.

**Commit:** `docs(E-23 T-079-02): before/after spray-paint visual proof`

---

## Step 7 — journal correction note

**Do:** Structure §7 — append the correction to `design-learnings.md` E-23 section (color-only splat was
more sophisticated but worse; splat must be ∩ structural-zone).

**Verify:** note reads honestly; links `twodee-interaction-sector`.

**Commit:** `docs(E-23 T-079-02): design-learnings correction — splat must be ∩ structural-zone`

---

## Testing strategy

| Concern | Test | Where |
|---|---|---|
| zone classification (base/upper/roof, storeyDivide) | unit | `structural-read.test.mjs` |
| zone gate (base rejects plaster, upper accepts, roof rejects); `zoneRejected` count; backward compat | unit | `face-paint.test.mjs` |
| geometry safety still holds (paint = recolor only) | existing unit | `face-paint.test.mjs` |
| seal-before-paint; histogram base/roof = 0; throw guard | runner + record | `spray-paint.mjs` (+ `--offline`) |
| full chain reorder; exteriorHeld; both gates; assets | runner + report | `hollow-cottage-milestone.mjs` |
| visual read (three bands, no smear/strays) | inspection | work-dir + `pr/assets` PNGs |

**Acceptance mapping:**
- AC#1 zone-masked paint (pure + unit-tested) → Steps 1, 2.
- AC#2 measured result (per-band histogram, base/roof = 0) → Step 4 (record), Step 5 (report).
- AC#3 seal before paint → Steps 4, 5.
- AC#4 gate not fooled (zone mask + throw) → Steps 2, 4, 5 (the throw); design D4.
- AC#5 visual proof + refreshed assets → Steps 5, 6.
- AC#6 `npm test` green + journal correction → Steps 3, 7.

## Risks & mitigations

- **GL/dwebp absent on host** → the deterministic histogram + `--offline` still prove the fix; renders
  recorded as a gap (the runners already degrade gracefully). Mitigation: rely on the pure measurable.
- **`floorLines[1]` not 7 on a re-sealed build** → sealing adds roof/wall voxels, not floor slabs;
  verified floorLines stable `[0,7,14]`. The `baseHeight` fallback covers builds with <2 floor lines.
- **Over-restrictive zone sets freeze legit recolors** → zone sets are generous (each zone's real
  materials), the only hard exclusion is plaster ∉ base/roof; verified the masked paint still recolors
  stone/planks where the concept agrees.
</content>
