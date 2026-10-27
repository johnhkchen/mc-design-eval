// A 1930s Auckland brick flat block (stripped-classical render bands, flat roof with a cream parapet), 2 to 3.5 storeys
// on the lidar tiers: a low 2-storey wing, a 2.5-storey podium, a 3-storey core and a 3.5-storey east tower with a plant
// room on its roof. The solid body is filled, windows are glass in the outer layer with a one-block air pocket behind,
// so nothing floats and there are no interiors.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332237123.cells.json`, "utf8"));   // [x, z, ground, roof] per cell
const [W, H, D] = [19, 27, 18];

// lidar roof heights smoothed into four flat tiers (storeys of 4 blocks, the top row is the parapet)
const tier = (r) => (r <= 8 ? 8 : r <= 10 ? 10 : r <= 12 ? 12 : 14);
// then a 3x3 majority vote over the footprint (own tier wins ties), so the tier edges run straight, not cell by cell
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r: tier(r) }]));
const cols = new Map();
for (const [key, c] of raw) {
  const [x, z] = key.split(",").map(Number), votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(`${x + dx},${z + dz}`); if (n) votes.set(n.r, (votes.get(n.r) || 0) + (dx || dz ? 1 : 1.5));
  }
  let best = c.r, bestN = votes.get(c.r) || 0;
  for (const [r, n] of votes) if (n > bestN) { best = r; bestN = n; }
  cols.set(key, { g: c.g, r: best });
}
const col = (x, z) => cols.get(`${x},${z}`);
const solid = (x, y, z) => { const c = col(x, z); return !!c && y >= 0 && y < c.r; };
const K = (x, y, z) => `${x},${y},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // east, west, south, north (z grows south)
// the sides a cell is open to at height y: no footprint beside it, or the neighbour is lower there
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => { const n = col(x + dx, z + dz); return !n || y >= n.r; });

const GLASS = (dx) => (dx ? { north: "true", south: "true", east: "false", west: "false" } : { east: "true", west: "true", north: "false", south: "false" });
const glass = new Map();   // outer-layer window cells -> pane state
const air = new Map();     // one-block pockets behind the glass -> [block, state] for a light, or null for air
const over = new Map();    // door, lobby and hood overrides -> [block, state] or null for air

// Pass A: windows in the middle two rows of each storey, piers every third cell, a pocket behind each window that is
// enclosed by solid on every other side (so no pocket opens onto the outside).
for (const [key, c] of cols) {
  const [x, z] = key.split(",").map(Number);
  for (let y = c.g; y < c.r - 1; y++) {           // the top row is the parapet
    const o = (y - c.g) % 4;
    if (o !== 1 && o !== 2) continue;
    const ex = exposed(x, y, z); if (!ex.length) continue;
    const [dx, dz] = ex[0];
    if ((dx ? z : x) % 3 === 0) continue;         // pier
    const [px, pz] = [x - dx, z - dz];            // the pocket, one block in from the glass
    const pc = col(px, pz); if (!pc || y >= pc.r || y + 1 >= pc.r) continue;
    const enclosed = DIRS.every(([ax, az]) => (px + ax === x && pz + az === z) || solid(px + ax, y, pz + az));
    if (!enclosed) continue;
    glass.set(K(x, y, z), GLASS(dx));
    const h = (x * 5 + z * 3 + y * 7) % 11;
    air.set(K(px, y, pz), o === 1 && h === 0 ? ["lantern", { hanging: "false" }] : h === 4 ? ["glowstone", null] : null);
  }
}

// the entrance on the north face of the lobby bay at (7,1): a dark-oak door on the ground, a white hood over it,
// and a two-high lobby pocket behind it
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
over.set(K(7, 0, 1), ["dark_oak_door", { ...DOOR, half: "lower" }]);
over.set(K(7, 1, 1), ["dark_oak_door", { ...DOOR, half: "upper" }]);
for (const x of [6, 7, 8]) over.set(K(x, 2, 1), ["white_concrete", null]);
over.set(K(7, 0, 2), null); over.set(K(7, 1, 2), null);
for (const k of [K(7, 0, 1), K(7, 1, 1), K(7, 1, 2), K(7, 0, 2)]) glass.delete(k);

// Pass B: every block of the body
const v = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => v.set(x, y, z, b, s);
for (const [key, c] of cols) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.r; y++) {
    const k = K(x, y, z);
    if (over.has(k)) { const o = over.get(k); if (o) put(x, y, z, o[0], o[1]); continue; }
    if (air.has(k)) { const l = air.get(k); if (l) put(x, y, z, l[0], l[1]); continue; }
    if (glass.has(k)) { put(x, y, z, "glass_pane", glass.get(k)); continue; }
    const ex = exposed(x, y, z);
    if (y === c.r - 1) { put(x, y, z, ex.length ? "white_concrete" : "stone"); continue; }   // parapet or roof
    if (!ex.length) { put(x, y, z, "stone"); continue; }                                   // solid core
    if (y < c.g) { put(x, y, z, "stone_bricks"); continue; }                              // plinth
    const o = (y - c.g) % 4;
    if (o === 0) put(x, y, z, y - c.g < 4 ? "stone_bricks" : "white_concrete");           // base course / storey band
    else put(x, y, z, "bricks");                                                           // spandrel, piers and wall
  }
}

// the tower's plant room on its roof, a 2x2 block with a cream cornice
for (const [x, z] of [[15, 8], [16, 8], [15, 9], [16, 9]]) { put(x, 14, z, "stone_bricks"); put(x, 15, z, "white_concrete"); }

const out = `${DIR}/way_332237123.nbt`;
const res = v.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, palette ${res.palette}`);
