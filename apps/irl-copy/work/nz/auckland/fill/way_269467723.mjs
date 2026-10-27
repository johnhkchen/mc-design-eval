// Way 269467723, Auckland: a c.1930s stripped-classical commercial block (three storeys at the high east end, one at the
// west) in cream plaster on a dark volcanic basalt plinth, with stone string courses, a stone cornice and parapet,
// shopfronts and a red fascia on the ground floor where the street is low, and glazed upper windows with a lintel
// course over each. The massing is the lidar roof, median-smoothed over each cell's neighbourhood and quantised to
// whole storeys (6, 9 and 12 blocks, at 4 blocks a storey). Every column is solid from y 0 to its ground, then its
// floor slabs sit on what is below; the inside is air, so each window has an air gap behind its glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467723.cells.json", "utf8"));   // [x, z, ground, roof]
const g = new Voxels([44, 24, 25]);

const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => at.has(`${x},${z}`);
// the outward faces of a footprint cell (the neighbour across the face is outside the footprint)
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const outward = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));

// lidar roof, median over the 3x3 footprint neighbourhood, quantised to storeys: 1 (6 high), 2 (9), 3 (12)
const storeysAt = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = at.get(`${x + dx},${z + dz}`); if (c) v.push(c.roof); }
  v.sort((a, b) => a - b); const m = v[v.length >> 1];
  return m >= 10 ? 3 : m >= 8 ? 2 : 1;
};
const HEIGHT = [0, 6, 9, 12];
const minGround = Math.min(...cells.map(([, , ground]) => ground));
const cols = cells.map(([x, z, ground]) => ({ x, z, ground, h: HEIGHT[storeysAt(x, z)], out: outward(x, z), pillar: (x + z) % 3 === 0 }));
const boundary = (c) => c.out.length > 0;

// the entrance: the boundary cell at the lowest ground nearest the footprint's middle, facing out
const entrance = cols.filter((c) => boundary(c) && c.ground === minGround && !c.pillar)
  .sort((a, b) => (Math.abs(a.x - 22) + Math.abs(a.z - 12)) - (Math.abs(b.x - 22) + Math.abs(b.z - 12)))[0];
const doorKey = entrance ? `${entrance.x},${entrance.z}` : null;

// pass 1: the solid part of every column: foundation, base or floor slab, walls, parapet and roof
for (const c of cols) {
  const { x, z, ground: gr, h, out } = c;
  const floors = [...new Set([gr, 4, 8].filter((f) => f < h - 1))];
  for (let y = 0; y < gr; y++) g.set(x, y, z, "cobbled_deepslate");
  if (!boundary(c)) {
    for (const f of floors) g.set(x, f, z, "smooth_stone");
    g.set(x, h - 1, z, "smooth_stone");                       // flat roof deck
    continue;
  }
  g.set(x, gr, z, "polished_deepslate");                       // base course at grade
  for (let y = gr + 1; y < h - 1; y++) {
    const f = Math.max(...floors.filter((ff) => ff <= y)), k = y - f;
    if (floors.includes(y)) { if (c.pillar) g.set(x, y, z, "quartz_pillar", { axis: "y" }); else g.set(x, y, z, "stone_bricks"); continue; }  // string course
    if (c.pillar) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }   // pilaster, the full storey height
    if (doorKey === `${x},${z}` && (y === gr + 1 || y === gr + 2)) {                // entrance door, lower and upper halves
      g.set(x, y, z, "oak_door", { facing: out[0][0], half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const shop = f === gr && gr <= 1;                                             // ground-floor shopfront where the street is low
    const win = shop || (x + z) % 3 === 1;                                        // one cell in three is glazed above grade
    if (shop && k <= 2) g.set(x, y, z, "glass");
    else if (shop && k === 3) g.set(x, y, z, "red_terracotta");                  // fascia
    else if (k <= 2 && win) { const ns = out[0][0] === "north" || out[0][0] === "south";
      g.set(x, y, z, "glass_pane", ns ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" }); }
    else if (k === 3 && win) g.set(x, y, z, "stone_bricks");                       // lintel course over each window
    else g.set(x, y, z, "smooth_quartz");                                          // cream plaster between
  }
  g.set(x, h - 1, z, "stone_bricks");                                             // cornice and parapet cap
}

// pass 2: warm light in the room behind some upper windows, a lantern on the floor or glowstone
const glowAt = [];
for (const c of cols) {
  if (!boundary(c) || c.pillar || (c.x + c.z) % 3 !== 1) continue;   // glazed upper cells only
  const [, dx, dz] = c.out[0];
  const ix = c.x - dx, iz = c.z - dz;                           // the cell inside, behind the glass
  if (!has(ix, iz) || boundary({ x: ix, z: iz, out: outward(ix, iz) })) continue;
  const floors = [...new Set([c.ground, 4, 8].filter((f) => f < c.h - 1))];
  for (const f of floors) {
    const y = f + 1;
    if (y >= c.h - 1 || (c.x * 7 + c.z * 3 + f) % 4 !== 0) continue;   // some windows, not all
    glowAt.push([ix, y, iz, (c.x + c.z + f) % 2 ? "lantern" : "glowstone"]);
  }
}
for (const [x, y, z, b] of glowAt) g.set(x, y, z, b, b === "lantern" ? { hanging: "false" } : undefined);

// roof plant on the top tier: 2x2 plant rooms on interior roof cells that stand on the deck (no single-column stubs)
const top = (x, z) => { const c = at.get(`${x},${z}`); return c && HEIGHT[storeysAt(x, z)] === 12; };
for (const c of cols) {
  if (boundary(c) || c.h !== 12 || c.x % 7 !== 3 || c.z % 5 !== 2) continue;
  const quad = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j]) => [c.x + i, c.z + j]);
  if (!quad.every(([x, z]) => top(x, z) && outward(x, z).length === 0)) continue;
  for (const [x, z] of quad) { g.set(x, 12, z, "stone_bricks"); g.set(x, 13, z, "smooth_stone"); }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467723.nbt");
