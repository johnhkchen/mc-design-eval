import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A Federal-era office block on the Mall: a limestone shell on a granite base, four storeys of 4-block bays, a pavilion
// over the middle of the south front and lower wings stepping down to the east. Built on the footprint cells only.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76187.cells.json`, "utf8"));
const SIZE = [37, 32, 21];

// The lidar roofs snap to four flat tiers. top = the first row above the building; R = its roof slab (top - 1), except the
// pavilion, which carries a parapet row above its roof slab.
const TIERS = { P: { top: 20, R: 18 }, M: { top: 18, R: 17 }, W: { top: 15, R: 14 }, A: { top: 5, R: 4 } };
const FLOORS = [2, 6, 10, 14];   // slab rows above the granite base; a storey is its slab plus three air rows
const tierOf = (r) => (r >= 19 ? "P" : r >= 17 ? "M" : r >= 12 ? "W" : "A");

const F = new Map();
for (const [x, z, ground, roof] of cells) {
  const t = tierOf(roof);
  F.set(`${x},${z}`, { x, z, ground, t, ...TIERS[t] });
}
const at = (x, z) => F.get(`${x},${z}`);
// outside the building at height y: no footprint cell there, or its tier has stopped below y
const outside = (x, z, y) => { const n = at(x, z); return !n || n.top <= y; };
const sides = (c, y) => ({
  N: outside(c.x, c.z - 1, y), S: outside(c.x, c.z + 1, y),
  W: outside(c.x - 1, c.z, y), E: outside(c.x + 1, c.z, y),
});
const exposed = (s) => s.N || s.S || s.E || s.W;
const floorBelow = (y) => Math.max(...FLOORS.filter((f) => f < y));
// a storey's bay at row y: f = its slab below, n = air rows above that slab, k = this row's place (1 = just above the slab)
const bay = (c, y) => {
  const f = floorBelow(y);
  const next = Math.min(...FLOORS.concat(c.R).filter((v) => v > f));
  return { f, n: next - f - 1, k: y - f };
};

// the front door: the middle of the main block's south front (the pavilion sits back from it)
const pavSouth = [...F.values()].filter((c) => c.t === "M" && outside(c.x, c.z + 1, 3));
const xsSorted = pavSouth.map((c) => c.x).sort((a, b) => a - b);
const doorX = xsSorted[xsSorted.length >> 1];
const doorCell = pavSouth.find((c) => c.x === doorX);
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// one exposed wall cell. Piers every four cells along the face, a window bay (sill, glass, lintel) and a blank spandrel.
function wall(c, y, s) {
  const { f, n, k } = bay(c, y);
  // a stepped outline exposes both axes on every step: the face follows the neighbours that share an exposed side
  const nsRun = [c.x - 1, c.x + 1].some((nx) => at(nx, c.z) && ((s.N && outside(nx, c.z - 1, y)) || (s.S && outside(nx, c.z + 1, y))));
  const ewRun = [c.z - 1, c.z + 1].some((nz) => at(c.x, nz) && ((s.W && outside(c.x - 1, nz, y)) || (s.E && outside(c.x + 1, nz, y))));
  const ns = (s.N || s.S) && (!(s.E || s.W) || nsRun || !ewRun);
  if ((s.N || s.S) && (s.E || s.W) && !nsRun && !ewRun) return { block: "smooth_quartz" };   // isolated corner pier
  if (f === 2 && c.x === doorCell.x && c.z === doorCell.z && k <= 2) {                   // entrance, two high
    return k === 1 ? { block: "iron_door", state: doorState("lower") } : { block: "iron_door", state: doorState("upper") };
  }
  const i = ns ? c.x : c.z;                                                                 // position along the face
  if (i % 4 === 0) return { block: "smooth_quartz" };
  if (i % 4 === 3) return { block: "calcite" };
  if (n > 1 && k === 1) return { block: "smooth_quartz" };                                  // sill
  if (n === 3 && k === 3) return { block: "smooth_quartz" };                                // lintel
  const pane = ns ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };
  return { block: "glass_pane", state: pane, lamp: i % 8 === 5 };                         // a lit room behind some panes
}

// the cell just inside the wall, opposite its exposed face
const inward = (c, s) => (s.N ? [c.x, c.z + 1] : s.S ? [c.x, c.z - 1] : s.W ? [c.x + 1, c.z] : [c.x - 1, c.z]);

const g = new Voxels(SIZE);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const c of F.values()) {
  // foundation below the lowest ground, granite base course to y 2
  for (let y = 0; y < 2; y++) put(c.x, y, c.z, y < c.ground ? "stone_bricks" : "polished_granite");
  for (let y = 2; y < c.top; y++) {
    const s = sides(c, y), exp = exposed(s);
    if (y === c.R) { put(c.x, y, c.z, exp ? "smooth_quartz" : "smooth_stone"); continue; }     // cornice / roof
    if (y > c.R) { if (exp) put(c.x, y, c.z, "stone_bricks"); continue; }                     // pavilion parapet
    if (FLOORS.includes(y)) { put(c.x, y, c.z, exp ? "smooth_quartz" : "smooth_stone"); continue; } // storey line / slab
    if (!exp) continue;                                                                       // interior air
    const w = wall(c, y, s);
    put(c.x, y, c.z, w.block, w.state);
    if (w.lamp) {
      const [ix, iz] = inward(c, s), inner = at(ix, iz), f1 = bay(c, y).f + 1;
      if (inner && !exposed(sides(inner, f1))) put(ix, f1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// the entrance hall lit behind the door
{
  const [ix, iz] = inward(doorCell, sides(doorCell, 3));
  put(ix, 3, iz, "glowstone");
}

// roof plant: 2x2 iron units on the pavilion and main roofs, set well in from the edges
const roofClear = (x0, z0, R) => {
  for (let x = x0 - 1; x <= x0 + 2; x++) for (let z = z0 - 1; z <= z0 + 2; z++) {
    const n = at(x, z); if (!n || n.top <= R) return false;
  }
  return true;
};
for (let x0 = 0; x0 < 36; x0 += 5) for (let z0 = 0; z0 < 20; z0 += 4) {
  const c = at(x0, z0);
  if (!c || (c.t !== "P" && c.t !== "M") || !roofClear(x0, z0, c.R)) continue;
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) put(x0 + dx, c.R + 1, z0 + dz, "iron_block");
}

const out = `${DIR}/DC76187.nbt`;
const stats = g.save(out);
console.log(`saved ${out}: ${stats.blocks} blocks, palette ${stats.palette}`);
