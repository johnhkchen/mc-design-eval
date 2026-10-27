// way/948317527: no OSM record, so the building is decided from the lidar massing. Its footprint is a 78-cell L-shaped
// shop block with a two-storey strip down the west side (roof 8-9), a single-storey east block (roof 4-5) and a low
// wing to the south (roof 3). The lidar is smoothed (3x3 mean) and snapped to four flat tiers: 9 (two storeys and a
// cornice), 7 (a setback with one upper row), 4 (a single-storey shopfront with a cornice) and 3 (a low annex).
// Read as an early-20th-century Auckland brick shop block: red brick walls on a stone plinth, cream render for the
// string course, cornices and window heads, glazed shopfronts on the ground floor, dark-wood entrance canopies, and a
// stair-and-plant box on the high roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317527.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317527.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const key = (x, z) => `${x},${z}`;
const roofAt = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));
const inF = (x, z) => roofAt.has(key(x, z));

// flat tiers: the 3x3 mean of the lidar roof over footprint cells, snapped to 9 / 7 / 4 / 3 blocks
const tier = (m) => (m >= 7.5 ? 9 : m >= 5.5 ? 7 : m >= 3.5 ? 4 : 3);
const H = new Map();
for (const k of roofAt.keys()) {
  const [x, z] = k.split(",").map(Number);
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = roofAt.get(key(x + dx, z + dz)); if (r !== undefined) { s += r; n++; }
  }
  H.set(k, tier(s / n));
}
const h = (x, z) => H.get(key(x, z));

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];               // N, S, W, E (z grows south)
const outward = (x, z) => { for (const [dx, dz] of DIRS) if (!inF(x + dx, z + dz)) return [dx, dz]; return null; };
// a wall cell faces the outside or a lower tier (its face above that tier is exposed); the rest is hollow interior
const isWall = (x, z) => outward(x, z) !== null || DIRS.some(([dx, dz]) => inF(x + dx, z + dz) && h(x + dx, z + dz) < h(x, z));

// what each cell holds: "x,y,z" -> { block, state } or null (air)
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => B.get(`${x},${y},${z}`);
const cellOf = (k) => k.split(",").map(Number);

const windows = [];
for (const k of roofAt.keys()) {
  const [x, z] = cellOf(k), t = h(x, z);
  // foundation from y 0 (the lowest ground) up to each cell's ground: every footprint cell has its ground at y 1 or 0
  put(x, 0, z, "cobblestone");
  if (!isWall(x, z)) {
    if (t >= 7) put(x, 4, z, "stone");                          // floor slab of the upper storey, over the hollow
    put(x, t - 1, z, "stone");                                  // flat roof membrane
    continue;
  }
  for (let y = 1; y < t; y++) {
    let block = "bricks";
    if (y === 1) block = "stone_bricks";                        // base course on the plinth
    if (t >= 7 && y === 4) block = "smooth_quartz";             // storey string course
    if (y === t - 1) block = "smooth_quartz";                   // cornice on the top course
    put(x, y, z, block);
  }
  const out = outward(x, z);
  if (!out) continue;
  // windows sit in every bay not on a 3-block pier; the bay runs along the face (z on E/W faces, x on N/S faces)
  const along = out[0] !== 0 ? z : x;
  if (along % 3 === 0) continue;
  const rows = t >= 9 ? [2, 3, 5, 6] : t === 7 ? [2, 3, 5] : t === 4 ? [2] : [];
  if (!rows.length) continue;
  const pane = out[0] !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  for (const y of rows) put(x, y, z, "glass_pane", pane);
  if (t >= 9) put(x, 7, z, "smooth_quartz");                    // head of the upper windows
  windows.push({ x, z, out, along, rows, t });
}

// warm lights: a lit window's lamp stands on the floor just inside it (only where the cell inside is hollow, so the
// lamp rests on the foundation or the storey slab)
for (const w of windows) {
  if ((w.along + w.rows[0]) % 4 !== 0) continue;
  const ix = w.x - w.out[0], iz = w.z - w.out[1];
  if (!inF(ix, iz) || isWall(ix, iz)) continue;
  if (w.t >= 7) { if (h(ix, iz) >= 7) put(ix, 5, iz, "glowstone"); }   // upper storey: on the slab at y 4
  else put(ix, 1, iz, "glowstone");                                    // ground floor: on the foundation at y 0
}

// entrances: a dark-oak door in a window bay of the single-storey east block, and one on the west face of the corner
// block, each under a dark-oak canopy slab on the cornice course
const doorway = (x, z, facing, canopy) => {
  put(x, 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const [cx, cz] of canopy) put(cx, 3, cz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
};
doorway(8, 2, "east", [[8, 1], [8, 2], [8, 3]]);
doorway(3, 3, "west", [[3, 3]]);

// roof plant: a low plant-room box on the top tier, standing on the cornice course at y 8
for (const [x, z] of [[2, 7], [2, 8]]) {
  put(x, 9, z, "bricks"); put(x, 10, z, "smooth_quartz");
}

const g = new Voxels([9, 21, 15]);
let blocks = 0, unsupported = 0;
for (const [k, spec] of B) {
  if (!spec) continue;
  const [x, y, z] = cellOf(k);
  g.set(x, y, z, spec.block, spec.state);
  blocks++;
  if (y > 0 && !at(x, y - 1, z)) unsupported++;   // the roof and slabs over the hollow are the only ones resting on air
}
const res = g.save(OUT);
console.log(JSON.stringify({ blocks, unsupportedOverHollow: unsupported, palette: res.palette, windows: windows.length }));
