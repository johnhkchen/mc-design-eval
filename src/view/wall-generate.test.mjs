// Unit tests for wall-generate.mjs (T-160-01, story S-160, epic E-38) — synthetic occupancies only, PURE.
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { closeColumns, perimeterColumns, spaceOpenings, constructWalls, robustExtent, coverageOf, registerRect, closureOf } from "./wall-generate.mjs";

const setOf = (...cs) => new Set(cs);
/** A hollow rectangular ring (perimeter columns only) over [x0,x1]×[z0,z1], stacked floor..eave. */
function ringOcc({ x0, x1, z0, z1, floor = 0, eave = 5, block = "minecraft:stone_bricks", drop = [] }) {
  const dropped = new Set(drop);
  const cells = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const onRing = x === x0 || x === x1 || z === z0 || z === z1;
    if (!onRing || dropped.has(`${x},${z}`)) continue;
    for (let y = floor; y <= eave; y++) cells.push({ pos: [x, y, z], block });
  }
  return occupancyFromCells(cells);
}

// --- WG1 closeColumns ---
// HONEST SCOPE (T-160-01): morphological close fills ENCLOSED holes and small concavities; it does NOT
// bridge a 1-wide gap on a flat boundary run (dilate/erode shadow it at the edge). The brush's primary
// missing-wall repair is therefore the floor→eave SOLIDIFY of present columns (WG4), with close adding the
// concave/enclosed cells on top. Straight-run fully-absent columns are the named alignment follow-up.
test("WG1 closeColumns fills an enclosed hole; a full rect is idempotent", () => {
  // a 5×5 solid with one interior column removed → close refills the enclosed hole
  const solid = new Set();
  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) solid.add(`${x},${z}`);
  solid.delete("2,2"); // interior hole
  const closed = closeColumns(solid, 2);
  assert.ok(closed.has("2,2"), "enclosed 1-cell hole refilled by close r=2");
  // closing a full rect returns the rect (idempotent on a convex filled set)
  const rect = new Set();
  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) rect.add(`${x},${z}`);
  const cr = closeColumns(rect, 2);
  for (const c of rect) assert.ok(cr.has(c), `rect column ${c} survives close`);
});

test("WG1b a wide L-notch survives close (massing preserved)", () => {
  // an L: 10×10 minus a 6×6 corner — the concavity is far wider than the r=2 element
  const L = new Set();
  for (let x = 0; x <= 9; x++) for (let z = 0; z <= 9; z++) { if (x >= 4 && z >= 4) continue; L.add(`${x},${z}`); }
  const closed = closeColumns(L, 2);
  assert.ok(!closed.has("7,7"), "deep L-notch interior NOT filled by close");
});

// --- WG2 perimeterColumns ---
test("WG2 perimeterColumns: solid rect → border ring, interior excluded", () => {
  const rect = new Set();
  for (let x = 0; x <= 4; x++) for (let z = 0; z <= 4; z++) rect.add(`${x},${z}`);
  const ring = perimeterColumns(rect);
  assert.ok(ring.has("0,0") && ring.has("4,4") && ring.has("2,0"), "corners + edges on the ring");
  assert.ok(!ring.has("2,2"), "interior column not on the ring");
  assert.equal(ring.size, 16, "5×5 border = 16 columns");
});

test("WG2b perimeterColumns: a single column is its own perimeter", () => {
  assert.deepEqual([...perimeterColumns(setOf("3,3"))], ["3,3"]);
});

// --- WG3 spaceOpenings ---
test("WG3 spaceOpenings: count 1 centres; count 2 evenly spaced in range with a gap", () => {
  assert.deepEqual(spaceOpenings(0, 10, 1), [5]);
  const two = spaceOpenings(0, 9, 2);
  assert.equal(two.length, 2);
  assert.ok(two[0] >= 1 && two[1] <= 8, "off the corners");
  assert.ok(two[1] - two[0] >= 2, "non-overlapping gap");
  assert.deepEqual(spaceOpenings(0, 10, 0), []);
});

test("WG3b spaceOpenings: over-packed count clamps without overlap", () => {
  const ps = spaceOpenings(0, 6, 10); // can't fit 10 in [1,5]
  for (let i = 1; i < ps.length; i++) assert.ok(ps[i] - ps[i - 1] >= 2, "min gap held");
  assert.ok(ps.every((p) => p >= 1 && p <= 5), "all within interior");
});

// --- WG4 constructWalls: vertical-hole repair (the core replace move) + roof untouched ---
test("WG4 constructWalls solidifies vertical holes floor→eave and leaves the roof verbatim", () => {
  // a ring whose columns are PRESENT but holey: punch air into two present perimeter columns, then add a
  // roof cell above the eave. The replace move must fill those holes solid floor→eave.
  const base = [...iter(ringOcc({ x0: 0, x1: 6, z0: 0, z1: 6, floor: 0, eave: 4 }))]
    .filter((c) => !((c.pos[0] === 3 && c.pos[2] === 0 && (c.pos[1] === 1 || c.pos[1] === 2)) // vertical hole
                  || (c.pos[0] === 6 && c.pos[2] === 3 && c.pos[1] === 2)));                    // a single gap
  const roof = occupancyFromCells([...base, { pos: [3, 6, 3], block: "minecraft:spruce_planks" }]);
  // sanity: the holes really exist pre-brush
  assert.ok(!roof.has(3, 1, 0) && !roof.has(6, 2, 3), "vertical holes present before the brush");
  const out = constructWalls(roof, { floor: 0, eaveY: 4, program: null, wallField: "stone_bricks" });
  for (const y of [0, 1, 2, 3, 4]) {
    assert.ok(out.solid(3, y, 0), `column 3,0 solid floor→eave at y=${y}`);
    assert.ok(out.solid(6, y, 3), `column 6,3 solid floor→eave at y=${y}`);
  }
  // the roof cell above the eave survives untouched
  assert.equal(out.block(3, 6, 3), "minecraft:spruce_planks", "above-eave roof kept verbatim");
});

// --- WG5 openings from program ---
test("WG5 constructWalls carves exactly the program's openings on the named faces", () => {
  const occ0 = ringOcc({ x0: 0, x1: 8, z0: 0, z1: 8, floor: 0, eave: 6 });
  const program = { masses: [{ openings: [
    { wall: "-x", kind: "window", count: 2, w: 1, h: 2, sill: 2 },
    { wall: "+z", kind: "door", count: 1, w: 1, h: 3, sill: 0 },
  ] }] };
  const out = constructWalls(occ0, { floor: 0, eaveY: 6, program });
  // -x face (x=0): two windows are air at y=2..3; the rest of the face stays solid
  const winZ = spaceOpeningsRef(0, 8, 2);
  for (const z of winZ) for (const y of [2, 3]) assert.ok(!out.has(0, y, z), `window air at 0,${y},${z}`);
  assert.ok(out.solid(0, 5, winZ[0]), "above the window head stays solid");
  // +z door (z=8): air floor..floor+2 at the centre column
  assert.ok(!out.has(4, 0, 8) && !out.has(4, 2, 8), "door air at the +z centre");
});

// --- WG6 no-program fallback ---
test("WG6 derived rhythm carves windows + a door when no program is supplied", () => {
  const occ0 = ringOcc({ x0: 0, x1: 8, z0: 0, z1: 8, floor: 0, eave: 6 });
  const out = constructWalls(occ0, { floor: 0, eaveY: 6, program: null, windowPeriod: 4, doorWall: "+z" });
  // a door (3 tall) at +z centre
  assert.ok(!out.has(4, 0, 8) && !out.has(4, 1, 8) && !out.has(4, 2, 8), "derived door carved");
  // windows at the derived height wy0=max(floor+1,eave-4)=2..3, on period columns (x=4 → 4%4==0), z=0 face
  assert.ok(!out.has(4, 2, 0) && !out.has(4, 3, 0), "derived window carved at a period column (y=2..3)");
  assert.ok(out.solid(1, 2, 0), "a non-period column on the same face stays solid");
});

// --- WG7 determinism / no per-building constants ---
test("WG7 constructWalls is deterministic and footprint-agnostic", () => {
  const a = ringOcc({ x0: -5, x1: 3, z0: -4, z1: 5, floor: 0, eave: 5 }); // negative-coord frame
  const o1 = constructWalls(a, { floor: 0, eaveY: 5, program: null });
  const o2 = constructWalls(a, { floor: 0, eaveY: 5, program: null });
  assert.deepEqual([...o1.cells].sort(), [...o2.cells].sort(), "identical output on identical input");
  // a different footprint with the SAME params still yields a clean solid ring (no subject baked in)
  const b = ringOcc({ x0: 10, x1: 22, z0: 10, z1: 16, floor: 0, eave: 5 });
  const ob = constructWalls(b, { floor: 0, eaveY: 5, program: null });
  assert.ok(ob.solid(10, 3, 13) && ob.solid(22, 3, 13), "ring solid on a second, unrelated footprint");
});

// --- WG8 massing preserved (L keeps its notch) ---
test("WG8 constructWalls preserves L massing — the notch is not filled", () => {
  // an L footprint: full 10×10 wall band minus the +x+z 5×5 quadrant
  const cells = [];
  for (let x = 0; x <= 9; x++) for (let z = 0; z <= 9; z++) {
    if (x >= 5 && z >= 5) continue;
    for (let y = 0; y <= 4; y++) cells.push({ pos: [x, y, z], block: "minecraft:stone_bricks" });
  }
  const out = constructWalls(occupancyFromCells(cells), { floor: 0, eaveY: 4, program: null });
  assert.ok(!out.has(8, 2, 8), "deep L-notch stays empty (massing preserved, not bbox-filled)");
});

// --- WG9 robustExtent + coverageOf (T-160-04 pures) ---
test("WG9 robustExtent: clean set == raw bbox; an outlier post is trimmed (polluted flagged)", () => {
  const clean = new Set();
  for (let x = 0; x <= 10; x++) for (let z = 0; z <= 6; z++) clean.add(`${x},${z}`);
  const e0 = robustExtent(clean, { pLo: 0.02, pHi: 0.98 });
  assert.deepEqual([e0.x0, e0.x1, e0.z0, e0.z1], [0, 10, 0, 6], "dense clean set ⇒ percentile == bbox");
  assert.equal(e0.polluted, false);
  // inject ONE stray post far beyond the wall line
  const dirty = new Set(clean); dirty.add("40,40");
  const e1 = robustExtent(dirty, { pLo: 0.02, pHi: 0.98 });
  assert.ok(e1.raw.x1 === 40 && e1.x1 < 40, "robust extent ignores the lone outlier the raw bbox keeps");
  assert.equal(e1.polluted, true, "raw-vs-robust divergence flagged");
});

test("WG9b coverageOf: ring on the posts ⇒ ~1; off-by-one within tol ⇒ 1; far ⇒ low; empty ⇒ 0", () => {
  const posts = setOf("0,0", "0,1", "1,0", "5,5");
  assert.equal(coverageOf(posts, posts), 1, "identical ring covers all posts");
  const shifted = setOf("1,0", "1,1", "2,0", "6,5"); // each one cell off (within tol=1)
  assert.equal(coverageOf(shifted, posts), 1, "within-tol ring still covers");
  const far = setOf("100,100");
  assert.equal(coverageOf(far, posts), 0, "distant ring covers nothing");
  assert.equal(coverageOf(posts, new Set()), 0, "empty cols ⇒ 0, no NaN");
});

// --- WG10 registerRect: affine fit, axis ladder, scale ---
test("WG10 registerRect fits the program rect to a different-scale build ring (identity axis)", () => {
  // build ring: a clean 24×12 rectangle in a NEGATIVE-coord frame; program rect is 48×24 (2× scale).
  const cols = perimeterColumns(rectSet(-12, 11, -6, 5));
  const reg = registerRect([{ rect: { x0: 0, z0: 0, w: 48, d: 24 } }], cols);
  assert.equal(reg.axis, "identity", "long program axis aligns with the long build axis");
  assert.ok(reg.coverage > 0.9, `ring traces the posts (cov=${reg.coverage})`);
  assert.equal(reg.ambiguous, false);
  assert.ok(Math.abs(reg.scale.sx - 0.5) < 0.05 && Math.abs(reg.scale.sz - 0.5) < 0.05, "≈0.5 per-axis scale");
});

test("WG10b registerRect picks the SWAP axis when the program is rotated vs the build", () => {
  // build ring is 12 wide (x) × 24 deep (z); program rect is 48 (w,x) × 24 (d,z) — long axis is program-x,
  // but the build's long axis is z ⇒ swap wins.
  const cols = perimeterColumns(rectSet(0, 11, 0, 23));
  const reg = registerRect([{ rect: { x0: 0, z0: 0, w: 48, d: 24 } }], cols);
  assert.equal(reg.axis, "swap", "program long axis mapped onto the build long axis by swap");
  assert.ok(reg.coverage > 0.9, `swap ring traces the posts (cov=${reg.coverage})`);
});

test("WG10c registerRect flags a near-square footprint as AMBIGUOUS (axis tie reported, not forced)", () => {
  const cols = perimeterColumns(rectSet(0, 10, 0, 10));     // square build
  const reg = registerRect([{ rect: { x0: 0, z0: 0, w: 20, d: 20 } }], cols); // square program
  assert.equal(reg.ambiguous, true, "near-square axis tie ⇒ ambiguous=true (the finding, reported)");
});

// --- WG11 multi-mass union preserves the L (massing, not a bbox) ---
test("WG11 registerRect unions per-mass perimeters and keeps the L-notch out of the ring", () => {
  // L footprint occupancy: main 18 wide × 28 deep + a wing on +x for part of z. Build it as a clean L ring.
  const main = rectSet(0, 17, 0, 27);
  const wing = rectSet(18, 25, 7, 21);
  const Lset = new Set([...main, ...wing]);
  const cols = perimeterColumns(Lset);
  const reg = registerRect([
    { rect: { x0: 0, z0: 0, w: 18, d: 28 } },
    { rect: { x0: 18, z0: 7, w: 8, d: 15 } },
  ], cols);
  assert.ok(reg.coverage > 0.7, `L ring traces most posts (cov=${reg.coverage})`);
  // the deep notch (the +x+z quadrant NOT covered by either mass) must be OUTSIDE the ring
  assert.ok(!reg.ring.has("22,2"), "notch column off the wing's z-range stays out of the ring (L preserved)");
});

// --- WG11b closureOf: a clean rect scores 1; a colonnade with a straight-run gap scores < 1 ---
test("WG11b closureOf: watertight rect ⇒ 1; a straight-run gap ⇒ < 1 (the registered-vs-close discriminator)", () => {
  const full = perimeterColumns(rectSet(0, 9, 0, 5));
  assert.equal(closureOf(full), 1, "clean rectangle perimeter is fully closed");
  const gappy = new Set(full); gappy.delete("4,0"); // a straight-run hole on a flat edge
  assert.ok(closureOf(gappy) < 1, "a colonnade with a straight-run gap is not fully closed");
  assert.equal(closureOf(new Set()), 0, "empty ⇒ 0");
});

// --- WG12 the AC's required companion to WG1: the straight-run gap CLOSES via the registered path ---
test("WG12 a straight-run absent column that close cannot bridge is CLOSED by the registered rect", () => {
  // a clean ring with a WHOLE perimeter column dropped from a flat edge run — WG1's documented limit case.
  const x0 = -8, x1 = 8, z0 = -4, z1 = 4, floor = 0, eave = 4;
  const occ = ringOcc({ x0, x1, z0, z1, floor, eave, drop: [`0,${z0}`] }); // column (0,z0) fully absent
  assert.ok(!occ.has(0, 2, z0), "the straight-run gap really exists pre-brush");
  // close path (no program) leaves it open — pins the WG1 limit
  const noProg = constructWalls(occ, { floor, eaveY: eave, program: null });
  assert.ok(!noProg.solid(0, 2, z0), "close path cannot bridge the straight-run gap (WG1 limit)");
  // registered path: a single clean rect matching the ring closes it solid floor→eave
  const prog = { masses: [{ rect: { x0: 0, z0: 0, w: x1 - x0, d: z1 - z0 } }] };
  const withReg = constructWalls(occ, { floor, eaveY: eave, program: prog });
  for (const y of [0, 1, 2, 3, 4]) assert.ok(withReg.solid(0, y, z0), `registered path closes the gap at y=${y}`);
});

// --- WG13 dense-shell no-regress: every real wall column stays solid under the registered path ---
// (The registered ring is the CLEAN rect perimeter; the close path on a hollow ring adds a little corner
//  bleed. We do NOT assert byte-identity — we assert no REGRESSION: every real post is still walled, and
//  the registered envelope covers every real post (nothing the close path walled is dropped).)
test("WG13 on a dense clean ring the registered path keeps every real wall column solid (no regression)", () => {
  const x0 = 0, x1 = 12, z0 = 0, z1 = 8, floor = 0, eave = 5;
  const occ = ringOcc({ x0, x1, z0, z1, floor, eave });
  const prog = { masses: [{ rect: { x0: 0, z0: 0, w: x1 - x0, d: z1 - z0 } }] };
  const out = constructWalls(occ, { floor, eaveY: eave, program: prog });
  // every original perimeter column is solid floor→eave (envelope watertight, walls not lost)
  for (let x = x0; x <= x1; x++) {
    assert.ok(out.solid(x, eave, z0) && out.solid(x, eave, z1), `top of edge column x=${x} solid`);
    assert.ok(out.solid(x, floor, z0) && out.solid(x, floor, z1), `floor of edge column x=${x} solid`);
  }
  for (let z = z0; z <= z1; z++) {
    assert.ok(out.solid(x0, eave, z) && out.solid(x1, eave, z), `top of edge column z=${z} solid`);
  }
});

// helpers
function rectSet(x0, x1, z0, z1) { const s = new Set(); for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) s.add(`${x},${z}`); return s; }
function* iter(occ) { for (const [k, b] of occ.cells) yield { pos: k.split(",").map(Number), block: b }; }
// mirror of spaceOpenings for the WG5 expectation (kept local so the test asserts against an independent calc)
function spaceOpeningsRef(lo, hi, count) {
  const inLo = lo + 1, inHi = hi - 1, span = inHi - inLo, out = []; let prev = -Infinity;
  for (let i = 0; i < count; i++) { const raw = inLo + Math.round(((i + 0.5) * span) / count); const p = Math.max(prev + 2, Math.min(inHi, raw)); if (p > inHi) break; out.push(p); prev = p; }
  return out;
}
