// Vero Centre, Auckland CBD (way 147110866): a late-20th-century glass office tower on a stone-clad podium.
// The lidar roof gives a podium of about 24 to 48 blocks on the west, and a tower core rising to about 190 to 200 blocks
// in the middle, so the massing steps down in 8-block tiers. Each cell is a column from its foundation (0 to its ground)
// up to its roof, so every storey, tier and roof stands on the column under it. The outer ring is the facade (spandrels,
// mullions, glass), a one-cell air gap sits behind the glass with a floor slab per storey, and the core is solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110866.cells.json", "utf8"));
const W = 103, D = 84, H = 212;
const DIRS = [[-1, 0, "W"], [1, 0, "E"], [0, -1, "N"], [0, 1, "S"]];
const key = (x, z) => x + "," + z;

// each footprint cell: its ground, its smoothed roof (5 by 5 median of the lidar roof, on 8-block tiers, at least 8 above its ground)
const info = new Map();
for (const [x, z, g, r] of cells) info.set(key(x, z), { x, z, g, r });
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
for (const c of info.values()) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = info.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r); }
  c.top = Math.max(c.g + 8, Math.round(median(vals) / 8) * 8);
}

// depth from the outside: 1 = facade ring, 2 = the air gap behind the glass, 3 and more = the solid core
let frontier = [];
for (const c of info.values()) {
  if (DIRS.some(([dx, dz]) => !info.has(key(c.x + dx, c.z + dz)))) { c.d = 1; frontier.push(c); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of DIRS) {
    const n = info.get(key(c.x + dx, c.z + dz));
    if (n && n.d === undefined) { n.d = d + 1; next.push(n); }
  }
  frontier = next;
}

// a face is open at height y when there is no cell there, or that cell's roof is below y
const openFaces = (c, y) => DIRS.filter(([dx, dz]) => { const n = info.get(key(c.x + dx, c.z + dz)); return !n || y >= n.top; });

const vox = new Voxels([W, H, D]);
const podiumTop = 48;
const hash = (x, z, k) => (x * 7 + z * 13 + k * 5) % 9;

for (const c of info.values()) {
  const { x, z, g: G, top: T, d } = c;
  const podium = T <= podiumTop;
  const core = podium ? "stone_bricks" : "light_gray_concrete";
  const spandrel = podium ? "stone_bricks" : "light_gray_concrete";
  const mullion = podium ? "stone_bricks" : "light_gray_concrete";
  const glass = podium ? "light_gray_stained_glass" : "light_blue_stained_glass";

  for (let y = 0; y < G; y++) vox.set(x, y, z, "stone_bricks");   // foundation: solid from 0 up to this cell's ground
  for (let y = G; y < T; y++) {
    if (y === T - 1) { vox.set(x, y, z, core); continue; }        // roof deck
    const k = Math.floor((y - G) / 4), r = (y - G) % 4;
    if (d >= 3) { vox.set(x, y, z, core); continue; }             // solid core
    if (d === 2) {                                                  // air gap behind the glass, a floor slab per storey
      if (r === 0) { vox.set(x, y, z, "light_gray_concrete"); continue; }
      const behindWindow = DIRS.some(([dx, dz]) => info.get(key(x + dx, z + dz))?.d === 1);
      if (r === 1 && behindWindow && hash(x, z, k) === 0) { vox.set(x, y, z, k === 0 ? "shroomlight" : "glowstone"); continue; }
      continue;
    }
    // facade ring: the faces open at this height decide the material
    const faces = openFaces(c, y);
    if (!faces.length) { vox.set(x, y, z, core); continue; }
    const alongCoord = faces.some(([, dz]) => dz !== 0) ? x : z;  // N and S faces run along x; E and W along z
    let block;
    if (k === 0) {
      if (r === 0) block = "polished_andesite";                     // plinth
      else if (r === 3) block = spandrel;
      else block = alongCoord % 3 === 0 ? "polished_andesite" : glass; // shopfront piers and glass
    } else if (r === 0 || r === 3) block = spandrel;                 // floor line and head
    else block = alongCoord % 3 === 0 ? mullion : glass;             // window grid
    vox.set(x, y, z, block);
  }

  // parapet on the open edge of the roof, one block above the deck
  if (d === 1 && openFaces(c, T).length) vox.set(x, T, z, core);
  // roof equipment: plant boxes on the core roof of the tall tiers
  if (d >= 3 && T >= 60 && x % 9 === 4 && z % 9 === 4) {
    for (let y = T; y < T + 3; y++) vox.set(x, y, z, "gray_concrete");
  }
}

// entrance: the north face of the podium, where it is lowest in the middle of its run
const entranceCands = [...info.values()].filter((c) => c.d === 1 && c.top <= podiumTop && !info.has(key(c.x, c.z - 1)));
if (entranceCands.length) {
  entranceCands.sort((a, b) => a.x - b.x);
  const e = entranceCands[entranceCands.length >> 1];
  const { x, z, g: G } = e;
  vox.set(x, G, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(x, G + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  vox.set(x, G + 2, z, "light_gray_concrete");                     // lintel over the door
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110866.nbt";
const stats = vox.save(out);
console.log(`Vero Centre: ${cells.length} cells, ${stats.blocks} blocks, ${stats.palette} palette entries -> ${out}`);
