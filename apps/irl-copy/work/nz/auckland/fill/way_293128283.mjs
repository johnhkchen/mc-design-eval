// Way 293128283, Mt Eden / Newton edge of the CBD: a 1930s Art Deco reinforced-concrete office block. Seven storeys on a
// stone plinth (the cream render and piers of the period), a setback eighth-storey core on the diagonal where the lidar
// reads highest, and a copper-capped crown. Storeys are 4 blocks (about 3.3 m); every storey starts on a floor slab, so
// nothing floats. Walls are one block thick around a hollow interior, with an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128283.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128283.nbt";

const W = 38, H = 48, D = 26;
const PLINTH = 4;                                  // y 0..3: stone plinth over the fill (the ground floor's base course)
const DOOR = { x: 6, z: 2 };                       // the door, set back behind a one-cell porch on the north face
const PORCH = { x: 6, z: 1 };
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const k2 = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { g, r }]));
const at = (x, z) => fp.get(k2(x, z));
const boundary = (x, z) => NB.some(([dx, dz]) => !at(x + dx, z + dz));

// Lidar roof heights, smoothed: a 3x3 median of the trusted returns (0 = no return), then three flat tiers.
const smooth = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = at(x + dx, z + dz); if (c && c.r >= 20) v.push(c.r);
  }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tops = new Map();                            // cell -> roof top (exclusive) in blocks above y0
for (const [kk] of fp) {
  const [x, z] = kk.split(",").map(Number), s = smooth(x, z);
  tops.set(kk, s >= 33 ? 36 : s >= 29 ? 32 : 28);  // core / body / wing
}
const topAt = (x, z) => tops.get(k2(x, z)) ?? 0;
// The core steps in: its outer ring stops at the body's roof, so the tower rises from an eighth-storey setback.
for (const [kk, t] of tops) {
  if (t !== 36) continue;
  const [x, z] = kk.split(",").map(Number);
  if (NB.some(([dx, dz]) => topAt(x + dx, z + dz) !== 36)) tops.set(kk, 32);
}
const exposed = (x, z, y) => NB.some(([dx, dz]) => topAt(x + dx, z + dz) <= y);   // a side with nothing beside it at this height

const g = new Voxels([W, H, D]);
const placed = new Map();                          // "x,y,z" -> block id, for glass connections and lights
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); placed.set(`${x},${y},${z}`, block); };
const has = (x, y, z) => placed.has(`${x},${y},${z}`);

// Facade cell at a window row (1, 2) or spandrel row (3): piers every third bay and at corners, glass between.
function facade(x, y, z, row) {
  const corner = NB.filter(([dx, dz]) => !at(x + dx, z + dz)).length >= 2;
  const pier = corner || (x + z) % 3 === 0;
  if (row === 3) return put(x, y, z, pier ? "quartz_block" : "smooth_quartz");
  return put(x, y, z, pier ? "quartz_block" : "glass_pane");
}

// Plinth, floor slabs, roof cap, facades and parapets, cell by cell.
for (const [kk] of fp) {
  const [x, z] = kk.split(",").map(Number), T = topAt(x, z), edge = boundary(x, z);
  for (let y = 0; y < PLINTH; y++) put(x, y, z, "stone_bricks");
  for (let y = PLINTH; y < T; y++) {
    if (y === T - 1) put(x, y, z, "stone");                                       // roof cap
    else if (y % 4 === 0) put(x, y, z, "smooth_stone");                           // floor slab (string course on the facade)
    else if (edge && x === PORCH.x && z === PORCH.z && (y === 5 || y === 6)) continue; // the porch is open to the street
    else if (edge || exposed(x, z, y)) facade(x, y, z, y % 4);
  }
  if (edge) put(x, T, z, "smooth_quartz");                                        // parapet on the outer walls
}

// Entrance: the iron door at the back of the porch, a lantern hanging under the porch lintel.
put(DOOR.x, 5, DOOR.z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR.x, 6, DOOR.z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(PORCH.x, 6, PORCH.z, "lantern", { hanging: "true", waterlogged: "false" });

// Warm light just inside some glazing: a glowstone or shroomlight on the floor slab, behind the pane.
for (const [kk] of fp) {
  const [x, z] = kk.split(",").map(Number), T = topAt(x, z);
  for (let y = PLINTH + 1; y < T; y += 4) {
    const s = (y - PLINTH) / 4;
    for (const [dx, dz] of NB) {
      if (at(x + dx, z + dz)) continue;              // only the outer walls
      const xi = x - dx, zi = z - dz;                // the cell just inside that wall
      if (!at(xi, zi) || topAt(xi, zi) <= y || has(xi, y, zi) || (xi === DOOR.x && zi === DOOR.z)) continue;
      if (!has(x, y, z) || placed.get(`${x},${y},${z}`) !== "glass_pane" || (x + z + s) % 4 !== 0) continue;
      put(xi, y, zi, (x + s) % 2 ? "glowstone" : "shroomlight");
    }
  }
}

// Roof plant on the body roof (a few boxes on the cap, a vent on some) and a copper crown on the core.
for (const [kk] of fp) {
  const [x, z] = kk.split(",").map(Number), T = topAt(x, z);
  const inner = !boundary(x, z) && NB.every(([dx, dz]) => topAt(x + dx, z + dz) >= T);
  if (T === 32 && inner && (x * 7 + z * 3) % 13 === 0) {
    put(x, 32, z, "light_gray_concrete");
    if ((x + z) % 2 === 0) put(x, 33, z, "iron_block");
  }
  if (T === 36 && inner && x % 3 === 1 && z % 3 === 1) {
    put(x, 36, z, "waxed_oxidized_copper");
    if (x % 6 === 1 && z % 6 === 1) put(x, 37, z, "waxed_oxidized_copper");
  }
}

// Glass panes connect to the solid blocks beside them (a pane arm where there is a pier, wall or pane).
for (const [key, block] of placed) {
  if (block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const on = (dx, dz) => (has(x + dx, y, z + dz) ? "true" : "false");
  g.set(x, y, z, "glass_pane", { north: on(0, -1), south: on(0, 1), east: on(1, 0), west: on(-1, 0), waterlogged: "false" });
}

const res = g.save(OUT);
console.log(`built ${res.blocks} blocks, ${res.palette} palette entries -> ${OUT}`);
