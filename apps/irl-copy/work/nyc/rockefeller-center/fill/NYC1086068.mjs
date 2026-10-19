// 360 Madison Avenue, 1917 commercial and office building: a 26-storey tower in the wedding-cake tiers the 1916 zoning
// produced. Tiers come from the lidar roof class per cell (8-block bands, mode-smoothed over 3x3, mapped to clean tops
// 36/44/68/76), with a 4-block crown on the central 76 tier to 80. Granite foundation and base course; calcite piers and
// floor bands; a smooth stone cornice; window bays of glass panes one block out from a solid core, with an air gap behind
// each pane; shopfronts with granite fascias on the Madison Avenue (east) and south faces; a granite-pilastered entrance
// with a hanging lantern; wooden water tanks on the east podium; warm glowstone behind some panes. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1086068.cells.json`, "utf8"));
const X = 53, Y = 92, Z = 28;
const g = new Voxels([X, Y, Z]);

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFoot = (x, z) => cell.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // outward normals: +x is the east (Madison) face, +z the south face

// Roof class per cell from the lidar (8-block bands), mode-smoothed over the 3x3 neighbourhood (own cell weighted).
const cls = (x, z) => Math.min(9, Math.floor(cell.get(key(x, z)).roof / 8));   // 80 reads as the top band
function smoothClass(x, z) {
  const n = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!inFoot(x + dx, z + dz)) continue;
    const c = cls(x + dx, z + dz), w = dx === 0 && dz === 0 ? 1.5 : 1;
    n.set(c, (n.get(c) ?? 0) + w);
  }
  let best = cls(x, z), bw = -1;
  for (const [c, w] of n) if (w > bw) { best = c; bw = w; }
  return best;
}

// Tier tops (block heights above y 0), then the central crown.
const top = new Map();
for (const k of cell.keys()) { const [x, z] = k.split(",").map(Number); top.set(k, 8 * smoothClass(x, z) + 4); }
for (let z = 10; z <= 14; z++) for (let x = 17; x <= 29; x++) if (top.get(key(x, z)) === 76) top.set(key(x, z), 80);
const topOf = (x, z) => top.get(key(x, z)) ?? -1;
// Directions in which the column at (x, y, z) has air beside it (off the footprint, or a lower tier).
const exposures = (x, y, z) => DIRS.filter(([dx, dz]) => y >= topOf(x + dx, z + dz));

// Facade block for an exposed voxel. Storey grid: floor bands at y = 1, 4, 7 ..., window rows between them.
function facade(x, y, z, ex, h) {
  const [dx, dz] = ex[0], corner = ex.length > 1;
  const front = ex.some(([a, b]) => a === 1 || b === 1);   // Madison Avenue and south frontages
  if (dx === 1 && x === 52 && z === 14 && y <= 2)
    return ["iron_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  if (dx === 1 && x === 52 && z === 14 && y === 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
  if (y === 0) return ["polished_granite"];
  if (y === h - 1) return ["smooth_stone"];                       // cornice
  if (y === h - 2) return ["calcite"];                            // cornice band
  if (dx === 1 && x === 52 && y === 4 && z >= 13 && z <= 15) return ["polished_granite"];   // entrance lintel band
  if ((y - 1) % 3 === 0) return [front && y === 1 ? "polished_granite" : "calcite"];         // floor bands
  if (front && y === 3) return ["polished_granite"];              // shopfront fascia
  const u = dx === 0 ? x : z;                                     // coordinate along the face
  if (corner || u % 3 === 0) return ["calcite"];                  // piers
  // Window: a glass pane one block out, with an air gap (or a warm glowstone) behind it.
  const [ix, iz] = [x - dx, z - dz];
  if (inFoot(ix, iz) && y < topOf(ix, iz) && exposures(ix, y, iz).length === 0)
    cavity.set(`${ix},${y},${iz}`, (x * 7 + z * 5 + y) % 9 === 0 && y >= 2 ? "glowstone" : "air");
  return ["glass_pane"];
}
const cavity = new Map();   // behind-window cells, applied after the facade so a neighbour's core cannot fill them

for (const [k, { ground }] of cell) {
  const [x, z] = k.split(",").map(Number), h = topOf(x, z);
  for (let y = 0; y < h; y++) {
    if (y < ground) { g.set(x, y, z, "polished_granite"); continue; }   // foundation: solid from y 0 up to the cell's ground
    const ex = exposures(x, y, z);
    if (ex.length === 0) { g.set(x, y, z, y === h - 1 ? "black_concrete" : "stone"); continue; }   // core and roof
    const [b, s] = facade(x, y, z, ex, h);
    g.set(x, y, z, b, s);
  }
}
for (const [p, b] of cavity) { const [x, y, z] = p.split(",").map(Number); g.set(x, y, z, b); }

// Roof equipment: two wooden water tanks on the east podium (tier 44), a lantern on the crown.
for (const [x, z] of [[47, 8], [48, 8], [47, 9], [48, 9]]) if (topOf(x, z) === 44) for (let y = 44; y <= 46; y++) g.set(x, y, z, "spruce_planks");
g.set(23, 80, 12, "lantern", { hanging: "false", waterlogged: "false" });

const out = g.save(`${DIR}/NYC1086068.nbt`);
console.log(JSON.stringify({ footprint: cells.length, tops: [...new Set(top.values())].sort((a, b) => a - b), ...out }));
