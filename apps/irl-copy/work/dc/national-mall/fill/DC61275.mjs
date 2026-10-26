// DC61275: a 1920s Neoclassical commercial block on the Mall's north side, four storeys of Indiana-limestone-look
// calcite over a granite plinth, with a stepped roof (lidar tiers: 12 shoulders, 13 central core, 9 and 8 at the rear wing).
// Shell + air gap + floor slabs: the walls are closed, the interior is air with a slab per storey and warm lamps set
// one block in from the glass, so the windows light from inside without any rooms being built.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC61275.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC61275.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]

// Footprint: the lidar cells (a 5 x 13 box with its x 4, z 0..3 corner left out).
const inF = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
const G = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));

// Roof: each z row's median lidar height is one clean flat tier (lidar noise removed).
const TOP = new Map();
for (let z = 0; z < 13; z++) {
  const r = cells.filter(c => c[1] === z).map(c => c[3]).sort((a, b) => a - b);
  const med = r[r.length >> 1];
  for (const c of cells) if (c[1] === z) TOP.set(`${c[0]},${z}`, med);
}
const T = (x, z) => TOP.get(`${x},${z}`) ?? 0;
const ground = (x, z) => G.get(`${x},${z}`) ?? 0;

const FLOORS = new Set([3, 6, 9]);             // storey lines: string course outside, slab inside
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, y, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || T(x + dx, z + dz) <= y);
const solid = (x, y, z) => {
  if (!inF(x, z) || y < 0 || y >= T(x, z)) return false;
  return y < ground(x, z) || y === 0 || y === T(x, z) - 1 || FLOORS.has(y) || outward(x, y, z).length > 0;
};

// Window: a single exposed face, bays between piers, glass in front of an air gap; the front door sits in the z 4-5 bay.
const windowOK = (x, y, z, [dx, dz]) => {
  if (y % 3 === 0 || y === 0 || y === T(x, z) - 1) return false;
  if (!inF(x - dx, z - dz) || solid(x - dx, y, z - dz)) return false;        // needs an air gap behind
  if (dx !== 0) return z % 3 !== 0 && inF(x, z - 1) && inF(x, z + 1) && T(x, z - 1) > y && T(x, z + 1) > y;
  return inF(x - 1, z) && inF(x + 1, z) && T(x - 1, z) > y && T(x + 1, z) > y;
};

const plan = new Map();
const K = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => plan.set(K(x, y, z), { block, state });
const at = (x, y, z) => plan.get(K(x, y, z));

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (let y = 0; y < T(x, z); y++) {
    if (!solid(x, y, z)) continue;
    const out = outward(x, y, z), top = y === T(x, z) - 1;
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }                    // plinth course
    if (top) { put(x, y, z, out.length ? "smooth_quartz" : "smooth_stone"); continue; } // cornice / roof deck
    if (!out.length) { put(x, y, z, "smooth_stone"); continue; }                     // interior floor slab
    if (FLOORS.has(y)) { put(x, y, z, "smooth_quartz"); continue; }                  // string course
    if (out.length === 1 && windowOK(x, y, z, out[0])) {
      if (x === 0 && z === 5 && (y === 1 || y === 2)) { put(x, y, z, "dark_oak_door", {
        facing: "east", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      put(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      continue;
    }
    put(x, y, z, "calcite");
  }
}

// Pane connections: a pane joins the solid neighbours along its own face.
for (const [key, v] of plan) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number), out = outward(x, y, z)[0];
  const conn = out[0] !== 0
    ? { north: solid(x, y, z - 1), south: solid(x, y, z + 1) }
    : { east: solid(x + 1, y, z), west: solid(x - 1, y, z) };
  v.state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false",
    ...Object.fromEntries(Object.entries(conn).map(([k, b]) => [k, String(b)])) };
}

// Warm lamps set one block inside the glass (one air block between pane and lamp), each on a floor slab or hung from one.
const lamps = [
  [2, 2, 3, "lantern", { hanging: "true", waterlogged: "false" }],
  [2, 4, 5, "glowstone"],
  [2, 8, 8, "lantern", { hanging: "true", waterlogged: "false" }],
  [2, 10, 2, "shroomlight"],
  [1, 2, 5, "lantern", { hanging: "true", waterlogged: "false" }],   // entrance lamp over the door
  [2, 1, 7, "glowstone"],
];
for (const [x, y, z, block, state] of lamps) {
  if (at(x, y, z)) throw new Error(`lamp at ${K(x, y, z)} would replace ${at(x, y, z).block}`);
  put(x, y, z, block, state);
}

const g = new Voxels([5, 25, 13]);
for (const [key, v] of plan) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const info = g.save(OUT);
console.log(`DC61275: ${info.blocks} blocks, palette ${info.palette} -> ${OUT}`);
