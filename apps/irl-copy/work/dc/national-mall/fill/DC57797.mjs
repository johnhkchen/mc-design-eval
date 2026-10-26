// 1717 Rhode Island Ave NW (Commercial-Office-Large): a 1960s-70s speculative office, seven storeys to a flat roof at
// the lidar's 17 blocks. Pale precast piers and light spandrels in rhythm, a blue glass window band, a stone base and
// shopfront, and a stone cornice. The lidar roof is smoothed (3x3 median) and quantised into four setback tiers
// (8, 11, 14, 17). Only footprint cells are built: a solid base course at y 0 (the foundation), floor slabs at each
// storey line, facade on the exposed faces, and air behind the glass with a few glowstone lights.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${HERE}/DC57797.cells.json`, "utf8"));

const k = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [k(x, z), { x, z, g, r }]));
const inFoot = (x, z) => foot.has(k(x, z));
// [dx, dz, face name]: the outward direction of each face
const DIRS = [[0, -1, "n"], [0, 1, "s"], [-1, 0, "w"], [1, 0, "e"]];

// Massing: median of the 3x3 footprint neighbourhood (smooths the lidar's stair-step noise), then four tiers
const TIERS = [[9, 8], [12, 11], [15, 14], [Infinity, 17]];
const tier = new Map();
for (const c of foot.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = foot.get(k(c.x + dx, c.z + dz)); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  tier.set(k(c.x, c.z), TIERS.find(([lim]) => med <= lim)[1]);
}
const R = (x, z) => tier.get(k(x, z)) ?? 0;           // roof height of a cell (0 = not in the footprint)
// the faces of cell (x, z) that are outside at height y: no neighbour, or a neighbour whose roof is at or below y
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => R(x + dx, z + dz) <= y).map(([, , f]) => f);

// Entrance: the north face of the main block, nearest to x 14 (the Rhode Island Ave side is the lobby's front)
const entrance = [...foot.values()]
  .filter((c) => R(c.x, c.z) >= 14 && !inFoot(c.x, c.z - 1))
  .sort((a, b) => Math.abs(a.x - 14) - Math.abs(b.x - 14))[0];
const ex = entrance.x, ez = entrance.z;

const GLASS = "light_blue_stained_glass", PIER = "white_concrete", SPAN = "light_gray_concrete";
const STONE = "stone_bricks", CORNICE = "smooth_stone", ROOF = "stone", SLAB = "smooth_stone";
const lit = (x, y, z) => (x * 73 + y * 31 + z * 17) % 11 === 0;  // roughly one window in eleven

const g = new Voxels([29, 29, 21]);

for (const c of foot.values()) {
  const { x, z } = c, top = R(x, z);
  for (let y = 0; y < top; y++) {
    const fs = faces(x, z, y);
    const exposed = fs.length > 0;
    if (y === 0) { g.set(x, y, z, STONE); continue; }                       // base course and foundation
    if (y === top - 1) { g.set(x, y, z, exposed ? CORNICE : ROOF); continue; } // cornice / roof membrane
    if (!exposed) {                                                           // interior: a floor slab per storey, else air
      if (y >= 4 && y % 2 === 0 && y <= top - 2) g.set(x, y, z, SLAB);
      continue;
    }
    // facade on an exposed face: piers every third cell along the wall, a corner pier on each turn
    const alongNS = fs.some((f) => f === "n" || f === "s");
    const corner = alongNS && fs.some((f) => f === "w" || f === "e");
    const pier = corner || (alongNS ? x : z) % 3 === 0;
    let block;
    if (y === 3) block = CORNICE;                                              // ground-floor lintel
    else if (y <= 2) block = pier ? STONE : GLASS;                             // shopfront
    else if (y % 2 === 1) block = pier ? PIER : GLASS;                         // window row
    else block = SPAN;                                                         // spandrel row
    g.set(x, y, z, block);
    // warm light behind a glass pane: glowstone one cell inside, where the room is air
    if (block === GLASS && lit(x, y, z)) {
      const [dx, dz] = DIRS.find(([, , f]) => f === fs[0]);
      const ix = x - dx, iz = z - dz;
      if (fs.length === 1 && inFoot(ix, iz) && faces(ix, iz, y).length === 0) g.set(ix, y, iz, "glowstone");
    }
  }
}

// Entrance: a dark oak door in the glass, a standing lantern just inside it on the lobby floor
g.set(ex, 1, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, 2, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
if (inFoot(ex, ez + 1)) g.set(ex, 1, ez + 1, "lantern", { hanging: "false" });

// Roof equipment on the tower: one 2x2 plant room standing 2 blocks above the roof, nearest the middle of the roof
const plant = [...foot.values()]
  .filter((c) => R(c.x, c.z) === 17 && R(c.x + 1, c.z) === 17 && R(c.x, c.z + 1) === 17 && R(c.x + 1, c.z + 1) === 17
    && faces(c.x, c.z, 16).length === 0 && faces(c.x + 1, c.z + 1, 16).length === 0)
  .sort((a, b) => Math.hypot(a.x - 14, a.z - 9) - Math.hypot(b.x - 14, b.z - 9))[0];
if (plant) for (let y = 17; y <= 18; y++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(plant.x + dx, y, plant.z + dz, y === 18 ? "smooth_stone" : PIER);

const out = `${HERE}/DC57797.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries; entrance (${ex},${ez}), plant room ${plant ? `(${plant.x},${plant.z})` : "none"}`);
