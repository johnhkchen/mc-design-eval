// Alpha Apartments, Auckland (way 265495466): a 1980s concrete-frame apartment slab, fourteen storeys of 4 blocks (about
// 17 m) on a basalt plinth that follows the slope. The lidar roof is one flat tier at 58 (57 or 58 across the footprint;
// the three cells at 3, 15 and 53 are noise), so the massing is a single slab with a two-block parapet, no setbacks.
// Facade: white-concrete piers at the corners and every third bay, blue-glass window bands two blocks high with light-grey
// spandrels, a white slab line at each floor, a light-grey cornice under the parapet. Entrance on a low face: dark-oak door,
// a lobby of glass either side and a dark-oak hood band. About one window in six has a glowstone behind the glass. Interiors
// are air behind the glass, a floor slab per storey, and the roof is a deck with a few plant pads.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_265495466.cells.json", "utf8"));
const W = 48, D = 31, Y = 71;
const STOREY = 4, STOREYS = 14, DECK = 56, TOP = 58;   // 14 x 4 = 56, deck at 56, parapet 57 -> roof at 58

const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each footprint cell, -1 = outside
for (const [x, z, g] of cells) G[x][z] = g;
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const outs = (x, z) => [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dx, dz]) => !inside(x + dx, z + dz));  // outward normals
const floorOf = (g) => Math.ceil(g / STOREY) * STOREY;   // first storey line at or above the ground; the gap below is plinth
const deep = (x, z) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => inside(x + dx, z + dz)));

const M = {
  base: "polished_basalt", core: "stone", slab: "white_concrete", floor: "light_gray_concrete", cornice: "light_gray_concrete",
  parapet: "white_concrete", pier: "white_concrete", spandrel: "light_gray_concrete", glass: "light_blue_stained_glass",
  glow: "glowstone", hood: "dark_oak_planks", pad: "stone_bricks",
};
const NAME = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };   // a door faces into the building: the opposite of its outward normal

const v = new Voxels([W, Y, D]);

// the entrance: a single-outward-side cell on a low storey line with its inward neighbour inside (a plain wall, not a corner)
let door = null;
for (const [x, z, g] of cells) {
  const o = outs(x, z);
  if (o.length !== 1 || !inside(x - o[0][0], z - o[0][1])) continue;
  if (!inside(x - 2 * o[0][0], z - 2 * o[0][1])) continue;
  const cand = { x, z, g, n: o[0], f: floorOf(g) };
  if (!door || cand.f < door.f || (cand.f === door.f && cand.g < door.g)) door = cand;
}

for (const [x, z, g] of cells) {
  const F = floorOf(g), o = outs(x, z), facade = o.length > 0;
  // foundation and plinth: solid from y 0 up to the first storey line, so nothing floats on the slope
  for (let y = 0; y < F; y++) v.set(x, y, z, facade ? M.base : M.core);
  // one floor slab per storey line and the roof deck, below the lowest air
  for (let y = F; y <= DECK; y += STOREY) v.set(x, y, z, facade ? M.slab : M.floor);
  if (!facade) {
    // interiors: air behind the glass, a slab per storey; plant pads on the deck where the building is wide
    if (deep(x, z) && (x % 8 < 2) && (z % 6 < 2)) v.set(x, DECK + 1, z, M.pad);
    continue;
  }
  const n = o.length === 1 ? o[0] : null, corner = o.length > 1;
  const along = n && n[0] !== 0 ? z : x;   // bay index along the face
  // a pier only on a straight run (both neighbours along the face share this outward normal); a one-cell stair step on
  // the diagonal edge takes glass, not a pier, or the diagonal reads as a blank dark wall
  const run = n && [-1, 1].every((d) => { const ax = n[0] !== 0 ? x : x + d, az = n[0] !== 0 ? z + d : z; return inside(ax, az) && outs(ax, az).some(([p, q]) => p === n[0] && q === n[1]); });
  const key = n ? `${n[0]},${n[1]}` : "";
  const inward = n ? [x - n[0], z - n[1]] : null;
  // cornice under a two-block parapet
  v.set(x, DECK, z, M.cornice); v.set(x, DECK + 1, z, M.parapet);
  for (let k = Math.ceil(F / STOREY); k < STOREYS; k++) {
    const y0 = k * STOREY;
    const pier = corner || (run && along % 3 === 0);
    const isDoorCell = door && door.x === x && door.z === z;
    const lobby = door && n && key === `${door.n[0]},${door.n[1]}` && k === F / STOREY && Math.abs(along - (door.n[0] !== 0 ? door.z : door.x)) <= 2;
    for (const y of [y0 + 1, y0 + 2]) {
      if (isDoorCell && k === F / STOREY) {
        const half = y === y0 + 1 ? "lower" : "upper";
        v.set(x, y, z, "dark_oak_door", { facing: NAME[`${-n[0]},${-n[1]}`], half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (pier && !lobby) { v.set(x, y, z, M.pier); continue; }
      v.set(x, y, z, M.glass);
      // a lit window: a glowstone in the air cell behind the glass
      if (n && (x * 7 + z * 13 + k * 5) % 6 === 0 && inward && inside(inward[0], inward[1]) && outs(inward[0], inward[1]).length === 0)
        v.set(inward[0], y, inward[1], M.glow);
    }
    v.set(x, y0 + 3, z, lobby && k === F / STOREY ? M.hood : M.spandrel);
  }
  // corner fins run the full height above the plinth
  if (corner) for (let y = F; y <= DECK + 1; y++) v.set(x, y, z, M.pier);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_265495466.nbt";
const r = v.save(out);
console.log(`door ${door ? `${door.x},${door.z} floor ${door.f}` : "none"}; ${r.blocks} blocks, ${r.palette} palette entries`);
