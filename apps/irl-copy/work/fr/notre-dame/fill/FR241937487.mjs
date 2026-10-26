// FR241937487: a six-storey Haussmann-type block (1800), pale stone facades, slate mansard on the tall core, lower wings
// stepping down to the courtyard. Massing follows the lidar roof heights, median-smoothed and snapped to storey lines.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR241937487.cells.json`, "utf8"));

const BASE = 3;          // ground-floor slab: above every cell's ground (0..3), so the plinth levels the slope
const STOREY = 5;        // blocks per storey
const MAX_STOREYS = 6;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const key = (x, z) => `${x},${z}`;
const byKey = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inside = (x, z) => byKey.has(key(x, z));

// lidar noise: each cell takes the median roof height of its 3x3 footprint neighbourhood, then snaps to storeys
const info = new Map();
for (const c of byKey.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = byKey.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  const s = vals[vals.length >> 1];
  const storeys = Math.min(MAX_STOREYS, Math.max(0, Math.round((s - BASE) / STOREY)));
  info.set(key(c.x, c.z), { ...c, smooth: s, storeys, deck: BASE + STOREY * storeys, mansard: storeys === MAX_STOREYS });
}

// distance in cells from the outer edge of the footprint: the mansard is inset from the cornice
const dist = new Map(); const queue = [];
for (const c of info.values()) {
  if (N4.some(([dx, dz]) => !inside(c.x + dx, c.z + dz))) { dist.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of N4) {
    const k = key(c.x + dx, c.z + dz);
    if (inside(c.x + dx, c.z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push(info.get(k)); }
  }
}

// the top occupied layer of a column: the deck, or the mansard one layer higher inset from the cornice
const topOf = (x, z) => {
  const c = info.get(key(x, z)); if (!c) return -1;
  return c.mansard && dist.get(key(x, z)) >= 1 ? c.deck + 1 : c.deck;
};
const occupied = (x, z, y) => y >= 0 && y <= topOf(x, z);
const exposedFaces = (x, z, y) => N4.filter(([dx, dz]) => !occupied(x + dx, z + dz, y));

// entrance: the south-facing (z = 0) ring cell nearest the middle of that edge
const edgeZ0 = [...byKey.values()].filter((c) => c.z === 0).map((c) => c.x).sort((a, b) => a - b);
const DOOR_X = edgeZ0[edgeZ0.length >> 1];

// warm lights behind some ground-to-top windows: the interior cell behind the glass gets a light
const lights = new Set();
for (const c of info.values()) {
  for (let y = BASE; y <= topOf(c.x, c.z); y++) {
    const rel = (y - BASE) % STOREY, s = Math.floor((y - BASE) / STOREY);
    const faces = exposedFaces(c.x, c.z, y);
    if (!faces.length || rel !== 2 || c.x === DOOR_X) continue;
    const [dx, dz] = faces[0], p = dz !== 0 ? c.x : c.z;
    if (p % 3 === 0) continue;
    if (((p * 7 + s * 5 + c.z) % 9) === 0) lights.add(`${c.x - dx},${y},${c.z - dz}`);
  }
}

const g = new Voxels([33, 50, 40]);
const PIER = "white_concrete", STRING = "smooth_stone", ROOF = "deepslate_tiles", GLASS = "light_blue_stained_glass_pane";

for (const c of info.values()) {
  const { x, z, g: ground } = c;
  const top = topOf(x, z);
  // foundation below the cell's ground, then a stone plinth up to the ground-floor slab
  for (let y = 0; y < BASE; y++) g.set(x, y, z, y < ground ? "stone" : "stone_bricks");

  for (let y = BASE; y <= top; y++) {
    const rel = (y - BASE) % STOREY, s = Math.floor((y - BASE) / STOREY);
    const faces = exposedFaces(x, z, y), outer = faces.length > 0;
    const mansardLayer = c.mansard && y === BASE + STOREY * MAX_STOREYS + 1;

    if (y === top) {
      if (mansardLayer) g.set(x, y, z, ROOF);
      else if (outer) g.set(x, y, z, STRING);                       // cornice / parapet
      else if (c.storeys <= 1 && dist.get(key(x, z)) >= 2) g.set(x, y, z, "glass");   // courtyard skylight
      else g.set(x, y, z, ROOF);
      continue;
    }
    if (outer) {
      const [dx, dz] = faces[0], p = dz !== 0 ? x : z;
      if (rel === 0) g.set(x, y, z, STRING);
      else if (rel === STOREY - 1) g.set(x, y, z, PIER);          // lintel
      else if (p % 3 === 0 || rel === 1) g.set(x, y, z, PIER);     // piers and sills
      else if (dz !== 0) g.set(x, y, z, GLASS, { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
      else g.set(x, y, z, GLASS, { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    } else if (rel === 0) {
      g.set(x, y, z, PIER);                                      // floor slab
    } else if (lights.has(`${x},${y},${z}`)) {
      g.set(x, y, z, s % 2 ? "shroomlight" : "glowstone");
    }
  }

  // chimney stacks on some interior roofs of the tall core
  if (c.storeys >= 5 && dist.get(key(x, z)) >= 2 && !c.mansard && (x * 5 + z * 7) % 17 === 0) {
    g.set(x, top + 1, z, "bricks"); g.set(x, top + 2, z, "bricks"); g.set(x, top + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// entrance: a dark-oak-framed doorway on the z = 0 face (door faces out, north)
g.set(DOOR_X, 4, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR_X, 5, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let dx = -1; dx <= 1; dx += 2) for (let y = 4; y <= 7; y++) g.set(DOOR_X + dx, y, 0, "stone_bricks");
for (let dx = -1; dx <= 1; dx++) g.set(DOOR_X + dx, 7, 0, "dark_oak_planks");

const out = `${DIR}/FR241937487.nbt`;
const res = g.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, ${res.palette} palette entries, door at x=${DOOR_X}`);
