// Stanford Apartments (way 260054093), Auckland: a 1960s-70s reinforced-concrete apartment block, 11 storeys on the
// lidar's 44-block roof, a 10-storey wing on the north-west half (lidar 41), a 3-storey podium round the fringe.
// Storeys are 4 blocks, anchored at y = 0 so every floor line falls on y % 4 == 0 across all three tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_260054093.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([48, 58, 36]);

// Lidar roof -> clean tiers: fringe (under 30) is the 3-storey podium, 30-41 the 10-storey wing, 42+ the 11-storey tower.
const foot = new Map();
for (const [x, z, ground, roof] of cells) {
  const top = roof < 30 ? 12 : roof < 42 ? 40 : 44;
  foot.set(`${x},${z}`, { x, z, ground, top });
}
const at = (x, z) => foot.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// A side of cell c at height y is outside when the neighbour is off the footprint or its roof is already below y.
const exposedDirs = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.top; });

const GLASS = "light_blue_stained_glass";
const PIER = "quartz_block";
const BAND = "light_gray_concrete";
const STONE = "stone_bricks";

for (const c of foot.values()) {
  const { x, z, ground, top } = c;
  for (let y = 0; y < top; y++) {
    if (y < ground) { g.set(x, y, z, STONE); continue; }                       // foundation to the lowest ground under it
    if (y === top - 1) { g.set(x, y, z, STONE); continue; }                     // roof deck / cornice course
    if (y % 4 === 0) { g.set(x, y, z, y === 0 ? STONE : BAND); continue; }      // floor slab and sill line per storey
    const ex = exposedDirs(c, y);
    if (!ex.length) continue;                                                    // interior: air gap, floors only
    const [ox, oz] = ex[0];
    const alongZ = ex.some(([dx, dz]) => dz !== 0);                              // which face: index along it
    const bay = (alongZ ? x : z) % 3 === 0;                                      // a pier every third column
    if (y % 4 === 3 || bay) { g.set(x, y, z, PIER); continue; }                  // head course and piers
    g.set(x, y, z, GLASS);
    // a warm light just inside some windows (one in nine), behind the glass
    const ix = x - ox, iz = z - oz;
    if ((x * 31 + y * 17 + z * 13) % 9 === 0 && at(ix, iz) && !exposedDirs(at(ix, iz), y).length) g.set(ix, y, iz, "glowstone");
  }
}

// Parapet: the coping course on the outer edge of each roof, where no taller block stands beside it.
for (const c of foot.values()) if (exposedDirs(c, c.top).length) g.set(c.x, c.top, c.z, STONE);

// Lift overrun on the tower's middle, three storeys of pale block under a stone cap.
const tower = [...foot.values()].filter((c) => c.top === 44);
const cx = Math.round(tower.reduce((s, c) => s + c.x, 0) / tower.length);
const cz = Math.round(tower.reduce((s, c) => s + c.z, 0) / tower.length);
for (const c of tower) {
  if (Math.abs(c.x - cx) > 2 || Math.abs(c.z - cz) > 2) continue;
  for (let y = 44; y < 47; y++) g.set(c.x, y, c.z, PIER);
  g.set(c.x, 47, c.z, STONE);
}

// Entrance on the street side: the lowest ground-level tower cell on the northern face, centred along the face.
const face = tower.filter((c) => c.ground === 0 && exposedDirs(c, 1).some(([dx, dz]) => dz === -1));
if (face.length) {
  const zMin = Math.min(...face.map((c) => c.z));
  const row = face.filter((c) => c.z === zMin).sort((a, b) => a.x - b.x);
  const d = row[Math.floor(row.length / 2)];
  const facing = NAME["0,-1"];
  const door = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  // piers either side of the door, and a canopy over the three bays, resting on those piers (no cell hangs)
  for (const dx of [-1, 1]) if (at(d.x + dx, d.z)?.top === 44 && at(d.x + dx, d.z).ground === 0) {
    g.set(d.x + dx, 1, d.z, PIER); g.set(d.x + dx, 2, d.z, PIER);
  }
  for (const dx of [-1, 0, 1]) if (at(d.x + dx, d.z)?.top === 44 && at(d.x + dx, d.z).ground === 0) {
    g.set(d.x + dx, 3, d.z, BAND);
  }
  g.set(d.x, 1, d.z, "dark_oak_door", door("lower"));
  g.set(d.x, 2, d.z, "dark_oak_door", door("upper"));
}

g.save(`${DIR}/way_260054093.nbt`);
console.log("built", g.count(), "blocks, palette", g.palette.length);
