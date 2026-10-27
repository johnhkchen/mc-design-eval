// Way 439089827, Auckland: a three-storey Edwardian brick commercial block. The lidar's tall edge runs along the
// north-west (street) side as a row of three-storey cells; the rest is a one-storey shop wing. Brick walls on a stone
// plinth, a shopfront with glazed bays and dark timber fascia at ground level, sash-style glazing above with white
// lintels and stone string courses, a stone cornice and brick parapet, a door on the street face, and a plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_439089827.cells.json`, "utf8"));
const SIZE = [10, 25, 29];

const k2 = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, ground, roof]) => [k2(x, z), { x, z, ground, roof }]));

// Storeys: the lidar roof height in 4-block storeys, clamped to 1..3, then a 3x3 median so a noisy cell joins its neighbours.
const raw = new Map([...foot].map(([k, c]) => [k, Math.max(1, Math.min(3, Math.round(c.roof / 4)))]));
const storeys = new Map();
for (const [k, c] of foot) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const v = raw.get(k2(c.x + dx, c.z + dz)); if (v) vals.push(v);
  }
  vals.sort((a, b) => a - b);
  storeys.set(k, vals[Math.floor(vals.length / 2)]);
}
const S = (x, z) => storeys.get(k2(x, z)) ?? 0;          // 0 = outside the footprint
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of cell (x, z) that are exposed at storey k: the neighbour there has no storey k
const exposed = (x, z, k) => Object.keys(DIRS).filter((d) => S(x + DIRS[d][0], z + DIRS[d][1]) < k + 1);

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { x, y, z, block, state });
const TIMBER = { type: "top", waterlogged: "false" };

// Door: the street face (north-west) is the single-face cell with the most storeys, median along its run.
const street = [...foot.values()].filter((c) => {
  const e = exposed(c.x, c.z, 0); return e.length === 1 && (e[0] === "W" || e[0] === "N");
});
const topS = Math.max(...street.map((c) => S(c.x, c.z)));
const run = street.filter((c) => S(c.x, c.z) === topS).sort((a, b) => a.z - b.z || a.x - b.x);
const door = run[Math.floor(run.length / 2)];

for (const c of foot.values()) {
  const { x, z } = c, s = S(x, z);
  put(x, 0, z, "stone_bricks");                                     // ground slab across the footprint
  for (let k = 1; k < s; k++) put(x, 4 * k, z, "smooth_stone");     // one floor slab per storey, air between
  const roofEdge = exposed(x, z, s - 1).length > 0;
  put(x, 4 * s, z, roofEdge ? "stone_bricks" : "smooth_stone");     // roof; its edge takes the cornice course
  if (roofEdge) {
    put(x, 4 * s + 1, z, "bricks"); put(x, 4 * s + 2, z, "bricks");
    put(x, 4 * s + 3, z, "stone_brick_slab", TIMBER);                 // coping
  }
  for (let k = 0; k < s; k++) {
    const ex = exposed(x, z, k);
    if (!ex.length) continue;                                       // interior: air behind the glass
    // a stepped cell is exposed on two faces; it takes the first, so the diagonal street reads as one wall, not pillars
    const face = ex[0], u = face === "N" || face === "S" ? x : z;
    const pier = u % 3 === 0;
    const win = u % 3 === 1;
    const b = 4 * k;
    if (k === 0) {
      put(x, 1, z, "stone_bricks");                                 // plinth
      if (pier) { put(x, 2, z, "bricks"); put(x, 3, z, "bricks"); }
      else { put(x, 2, z, "glass_pane"); put(x, 3, z, "dark_oak_planks"); }   // shopfront and fascia
    } else {
      put(x, b, z, "stone_bricks");                                 // string course, the sill of this storey
      for (const y of [b + 1, b + 2]) put(x, y, z, win ? "glass_pane" : "bricks");
      put(x, b + 3, z, win ? "white_concrete" : "bricks");          // white lintel
    }
  }
}

// Doorway and hood on the street face: the door's upper half, and an inverted stair as the canopy above it.
put(door.x, 1, door.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(door.x, 2, door.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(door.x, 3, door.z, "dark_oak_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });

// Warm light: a glowstone in the room behind some upper windows.
for (const c of foot.values()) {
  const { x, z } = c, s = S(x, z);
  for (let k = 1; k < s; k++) {
    const ex = exposed(x, z, k);
    if (ex.length !== 1 || ex[0] === undefined) continue;
    const u = ex[0] === "N" || ex[0] === "S" ? x : z;
    if (u % 3 !== 1 || (x * 7 + z * 13 + k * 5) % 3 !== 0) continue;
    const [dx, dz] = DIRS[ex[0]];
    const ix = x - dx, iz = z - dz;                                   // the room behind the window
    if (S(ix, iz) >= k + 1 && exposed(ix, iz, k).length === 0) put(ix, 4 * k + 1, iz, "glowstone");
  }
}

// Plant room on the highest interior roof, a 2x2 block where it fits.
const interiorTop = (c) => S(c.x, c.z) >= 2 && exposed(c.x, c.z, S(c.x, c.z) - 1).length === 0;
const tops = [...foot.values()].filter(interiorTop);
if (tops.length) {
  const hi = Math.max(...tops.map((c) => S(c.x, c.z)));
  const seed = tops.find((c) => S(c.x, c.z) === hi);
  const isTop = (x, z) => tops.some((c) => c.x === x && c.z === z && S(x, z) === hi);
  const cover = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => isTop(seed.x + dx, seed.z + dz))
    ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]];
  for (const [dx, dz] of cover) {
    put(seed.x + dx, 4 * hi + 1, seed.z + dz, "stone_bricks");
    put(seed.x + dx, 4 * hi + 2, seed.z + dz, "stone_bricks");
    put(seed.x + dx, 4 * hi + 3, seed.z + dz, "stone_brick_slab", TIMBER);
  }
}

// Glass panes connect to the solid blocks and panes beside them, as in a wall.
const CONNECT = new Set(["bricks", "stone_bricks", "white_concrete", "dark_oak_planks", "smooth_stone", "glowstone", "glass_pane"]);
const conn = (x, y, z) => (CONNECT.has(plan.get(`${x},${y},${z}`)?.block) ? "true" : "false");

const g = new Voxels(SIZE);
for (const p of plan.values()) {
  if (p.block === "glass_pane") {
    const { x, y, z } = p;
    g.set(x, y, z, "glass_pane", { north: conn(x, y, z - 1), south: conn(x, y, z + 1), east: conn(x + 1, y, z), west: conn(x - 1, y, z), waterlogged: "false" });
  } else g.set(p.x, p.y, p.z, p.block, p.state);
}
const out = `${DIR}/way_439089827.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, palette ${palette}, door at x${door.x} z${door.z}, ${topS} storeys on the street face`);
