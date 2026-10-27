// way 269465546: a 1970s-style concrete office block on Newton's edge (basalt plinth, pale concrete piers, tinted
// glass bays, a 4-storey tower on a 3-storey podium, a 2-storey east wing). Storeys are 4 blocks on one grid per
// column, so every floor and roof is a full slab standing on the slab below; walls only where the column is exposed.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465546.cells.json", "utf8"));
const g = new Voxels([48, 29, 69]);

// lidar roof heights snapped to three flat tiers: tower 16, podium 12, lower east wing 8
const cell = new Map();
for (const [x, z, ground, roof] of cells) {
  const T = roof >= 14 ? 16 : roof >= 11 ? 12 : 8;
  cell.set(`${x},${z}`, { x, z, ground, T });
}
const at = (x, z) => cell.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const PANE_OK = /stained_glass_pane$|^(white_concrete|light_gray_concrete|smooth_stone|deepslate_tiles)$/;

// everything placed, keyed by x,y,z, so panes can read their neighbours before the volume is written
const placed = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => placed.set(key(x, y, z), { block, state });
const has = (x, y, z) => placed.has(key(x, y, z));

// a horizontal neighbour is part of the volume at height y when its tier stands above y
const open = (n, y) => n && n.T > y;
const outward = (c, y) => DIRS.filter(([dx, dz]) => !open(at(c.x + dx, c.z + dz), y));

const WALL = "white_concrete", SLAB = "light_gray_concrete", ROOF = "gray_concrete", CAP = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane", BASE = "deepslate_tiles", FOUND = "deepslate_bricks";

// entrance: the west face cell nearest the middle of the west-facing run, flanked by piers, with a lintel
const west = [...cell.values()].filter((c) => !at(c.x - 1, c.z) && c.T >= 12).sort((a, b) => a.z - b.z);
const door = west[Math.floor(west.length / 2)];
const flank = west.filter((c) => Math.abs(c.z - door.z) === 1);

for (const c of cell.values()) {
  const { x, z, ground: gr, T } = c;
  // floor slabs at every 4 blocks; the top one is the roof deck
  for (let L = 0; L <= T; L += 4) put(x, L, z, L === T ? ROOF : SLAB);
  // foundation below the ground, from y 1 up to the cell's ground (y 0 is the slab)
  for (let y = 1; y < gr; y++) put(x, y, z, FOUND);
  // storeys: three wall rows above each floor slab, exterior faces only
  for (let L = 0; L + 4 <= T; L += 4) {
    for (let y = L + 1; y <= L + 3; y++) {
      if (y < gr) continue;
      const ex = outward(c, y);
      if (!ex.length) continue;               // interior void, air behind the glass
      const [dx] = ex[0];
      const idx = dx !== 0 ? z : x;           // bay index along the face
      const base = L === 0 ? Math.max(gr, 1) : -1; // ground-storey base course
      if (y === base) put(x, y, z, BASE);
      else if (y === L + 1) put(x, y, z, SLAB);    // spandrel
      else if (ex.length > 1 || idx % 3 === 0) put(x, y, z, WALL);  // corners and piers
      else put(x, y, z, GLASS, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    }
  }
  // parapet on the roof edge where the roof drops away or meets outside
  const edge = DIRS.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.T < T; });
  if (edge) put(x, T + 1, z, CAP);
  // roof plant on the podium terrace and the tower roof
  if (!edge && T === 12 && (x * 7 + z * 5) % 29 === 0) { put(x, T + 1, z, SLAB); put(x, T + 2, z, CAP); }
  if (!edge && T === 16 && x >= 24 && x <= 29 && z >= 24 && z <= 30) { put(x, T + 1, z, SLAB); put(x, T + 2, z, CAP); }
}

// the entrance: two door rows at the ground storey base, piers either side, lintel above
const b = Math.max(door.ground, 1);
const facing = DIR_NAME["-1,0"];
for (const c of flank) for (let y = b; y <= 3; y++) put(c.x, y, c.z, WALL);
put(door.x, b, door.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(door.x, b + 1, door.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
if (b + 2 <= 3) for (const c of [door, ...flank]) put(c.x, b + 2, c.z, CAP);

// warm lanterns hang from the storey slab, just inside the glass of every other bay
for (const c of cell.values()) {
  for (let L = 0; L + 4 <= c.T; L += 4) {
    const y = L + 3;
    if (y < c.ground || !has(c.x, y, c.z) || placed.get(key(c.x, y, c.z)).block !== GLASS) continue;
    const [dx, dz] = outward(c, y)[0] ?? [];
    if (dx === undefined) continue;
    const ix = c.x - dx, iz = c.z - dz;
    if (!open(at(ix, iz), y) || outward(at(ix, iz), y).length || has(ix, y, iz)) continue;
    if ((c.z * (dx !== 0 ? 1 : 0) + c.x * (dz !== 0 ? 1 : 0) + L) % 6 === 1) put(ix, y, iz, "lantern", { hanging: "true" });
  }
}

// glass panes connect to the neighbouring panes and solid blocks in their wall
for (const [k, p] of placed) {
  if (!p.block.endsWith("stained_glass_pane")) continue;
  const [x, y, z] = k.split(",").map(Number);
  const side = (dx, dz) => { const n = placed.get(key(x + dx, y, z + dz)); return n && PANE_OK.test(n.block) ? "true" : "false"; };
  p.state = { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" };
}

for (const [k, p] of placed) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, p.block, p.state); }
const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465546.nbt");
console.log(`way_269465546: ${blocks} blocks, palette ${palette}`);
