// way 269465569: a 1970s concrete office block on Mt Eden's flank, four storeys on a stepped massing.
// The lidar roof is smoothed to three flat tiers (8, 12, 18 blocks): a two-storey wing, a three-storey podium and
// the four-storey tower with a 2-block parapet. Every column is solid from y 0 to its tier (foundation below its
// ground), so nothing floats. Facades: a plinth, storey lines of light concrete, window bands of glass with white
// concrete mullions, and a 1-block air pocket behind each pane (lit with glowstone in some). Entrance on the east face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269465569.cells.json`, "utf8"));

const X = 50, Y = 31, Z = 77;
const g = new Voxels([X, Y, Z]);

const WALL = "white_concrete", SLAB = "light_gray_concrete", GLASS = "light_blue_stained_glass";
const ROOF = "gray_concrete", CAP = "smooth_stone", FOUND = "stone_bricks";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// footprint, keyed by cell
const cell = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, ground, roof });
const at = (x, z) => cell.get(key(x, z));

// lidar roof -> 3x3 median (kills the 0/1/6 edge noise) -> three flat tiers
for (const c of cell.values()) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.roof); }
  v.sort((a, b) => a - b);
  const m = v[v.length >> 1];
  c.top = m <= 10 ? 8 : m <= 15 ? 12 : 18;
}
// the tier height of a cell; 0 outside the footprint
const topAt = (x, z) => { const c = at(x, z); return c ? c.top : 0; };
// the sides of a cell at height y that face air: outside the footprint, or a neighbour standing lower than y
const openDirs = (c, y) => DIRS.filter(([dx, dz]) => topAt(c.x + dx, c.z + dz) <= y);

// the building's storeys: a light-concrete floor line at every 4th block, glass in the two blocks between, a
// spandrel under the next line; the ground storey's plinth is at y 0 and its shopfront is y 1-2
const windows = [];
for (const c of cell.values()) {
  for (let y = 0; y < c.top; y++) {
    let b;
    if (y < c.ground || y === 0) b = FOUND;
    else if (y === c.top - 1) b = openDirs(c, y).length ? CAP : ROOF;
    else if (y % 4 === 0 || y % 4 === 3) b = SLAB;
    else {
      const open = openDirs(c, y);
      if (open.length === 1) {
        const [dx] = open[0];
        const along = dx ? c.z : c.x;
        b = along % 4 === 0 ? WALL : GLASS;          // a white-concrete mullion every 4th block along the face
        if (b === GLASS) windows.push({ x: c.x, y, z: c.z, dx: open[0][0], dz: open[0][1] });
      } else b = WALL;
    }
    g.set(c.x, y, c.z, b);
  }
}

// an air pocket behind each pane: only where its four neighbours stand through the storey, so no hole shows
const storeyTop = (y) => 4 * Math.floor(y / 4) + 4;
const pockets = [];
for (const w of windows) {
  const px = w.x - w.dx, pz = w.z - w.dz;
  const need = storeyTop(w.y);
  const p = at(px, pz);
  if (!p || p.top < need) continue;
  if (!DIRS.every(([dx, dz]) => topAt(px + dx, pz + dz) >= need)) continue;
  pockets.push({ x: px, y: w.y, z: pz });
  g.set(px, w.y, pz, "air");
}
// warm light in some pockets: glowstone behind the glass, and a few on the shopfront
for (const p of pockets) {
  if ((p.x * 7 + p.y * 13 + p.z * 5) % 6 === 0) g.set(p.x, p.y, p.z, "glowstone");
}

// the entrance: the east face's middle cell, a dark oak door in the shopfront, a canopy over it and air behind
const east = [...cell.values()].filter((c) => topAt(c.x + 1, c.z) === 0).sort((a, b) => a.z - b.z);
const ent = east[east.length >> 1];
g.set(ent.x, 1, ent.z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ent.x, 2, ent.z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(ent.x - 1, 1, ent.z, "air");
g.set(ent.x - 1, 2, ent.z, "air");
for (let dz = -1; dz <= 1; dz++) g.set(ent.x + 1, 3, ent.z + dz, CAP);   // a canopy 1 deep, held by the fascia

// roofs: the 18-tier tower gets a lift overrun and a plant box on a clear 5x5 patch; the 12-tier podium next to
// the tower gets planters and a low parapet where it is open to the air
const tower = [...cell.values()].filter((c) => c.top === 18);
const cx = tower.reduce((s, c) => s + c.x, 0) / tower.length, cz = tower.reduce((s, c) => s + c.z, 0) / tower.length;
const clear = (c, r) => { for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (topAt(c.x + dx, c.z + dz) !== 18) return false; return true; };
const plantSites = tower.filter((c) => clear(c, 2)).sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
if (plantSites.length) {
  const s = plantSites[0];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++)
    for (let y = 18; y <= 19; y++) g.set(s.x + dx, y, s.z + dz, SLAB);
  for (let dz = -1; dz <= 0; dz++) for (let y = 18; y <= 20; y++) g.set(s.x + 2, y, s.z + dz, WALL);
  g.set(s.x + 2, 21, s.z - 1, CAP); g.set(s.x + 2, 21, s.z, CAP);
}
for (const c of cell.values()) {
  if (c.top !== 12) continue;
  const nearTower = DIRS.some(([dx, dz]) => topAt(c.x + dx, c.z + dz) === 18);
  if (nearTower && (c.x + c.z) % 2 === 0) g.set(c.x, 12, c.z, "oak_leaves", { persistent: "true" });
  if (openDirs(c, 11).length) g.set(c.x, 12, c.z, "stone_brick_wall");
}

// a sanity pass: every block above y 0 has a block under it or beside it at its own height (a canopy's cantilever)
let loose = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 1; y < Y; y++) {
  if (!g.val(x, y, z)) continue;
  const below = g.val(x, y - 1, z);
  const beside = DIRS.some(([dx, dz]) => g.val(x + dx, y, z + dz));
  if (!below && !beside) loose++;
}
const out = g.save(`${DIR}/way_269465569.nbt`);
const tiers = {};
for (const c of cell.values()) tiers[c.top] = (tiers[c.top] ?? 0) + 1;
console.log(JSON.stringify({ footprint: cell.size, tiers, windows: windows.length, pockets: pockets.length, loose, ...out }));
