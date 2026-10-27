// Shortland Flats: a 1930s six-storey plaster-and-brick apartment block (flat roof, parapet, steel-sash windows),
// with a seventh-storey stair/lift core set back in the middle. Massing follows the lidar roof per cell, rounded to
// 4-block storeys and median-smoothed over the 3x3 neighbourhood so the east-edge spikes (53) read as the body (24).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_147112337.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 26, Z = 27, Y = 66;
const k2 = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { x, z, g, r: Math.round(r / 4) * 4 }]));
const inFp = (x, z) => fp.has(k2(x, z));

// Top of each cell: the 3x3 median of the storey-rounded roof, so a lone lidar spike does not make a tower.
for (const c of fp.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = fp.get(k2(c.x + dx, c.z + dz)); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  c.T = Math.min(28, Math.max(24, vals[Math.floor(vals.length / 2)]));
  c.base = Math.max(c.g, 1);                       // plinth: solid from y 0 up to the cell's ground (at least one course)
}

const DIRS = [[-1, 0, "W"], [1, 0, "E"], [0, -1, "N"], [0, 1, "S"]];
// Outward faces a cell shows at height y: outside the footprint, or a lower neighbour (a setback face). Above the cell's
// own top, only a neighbour lower than it counts, so the core's inner roof gets no parapet.
function faces(c, y) {
  const out = [];
  for (const [dx, dz, name] of DIRS) {
    const n = fp.get(k2(c.x + dx, c.z + dz));
    const open = !n || (y < c.T ? n.T <= y : n.T < c.T);
    if (open) out.push({ dx, dz, name });
  }
  return out;
}

const v = new Voxels([X, Y, Z]);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// the entrance: the north-facing wall at x 6, the street front
const DOOR = fp.get(k2(6, 0));
const doorY = DOOR.base;

for (const c of fp.values()) {
  const { x, z, base, T } = c;
  for (let y = 0; y < base; y++) v.set(x, y, z, "bricks");                 // plinth
  for (let y = base; y <= T + 1; y++) {
    const ex = faces(c, y);
    if (y === T) {                                                          // flat roof, cornice on the open edge
      v.set(x, y, z, ex.length ? "quartz_block" : "smooth_stone");
      continue;
    }
    if (y === T + 1) { if (ex.length) v.set(x, y, z, "smooth_quartz"); continue; }   // parapet
    if (y > T) continue;
    if (y % 4 === 0) { v.set(x, y, z, ex.length ? "quartz_block" : "smooth_quartz"); continue; }   // storey string course / floor slab
    if (!ex.length) continue;                                               // interior: air behind the glass
    if (c === DOOR && (y === doorY || y === doorY + 1)) {                  // entrance door
      v.set(x, y, z, "oak_door", { facing: "south", half: y === doorY ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (c === DOOR && y === 3) { v.set(x, y, z, "smooth_quartz_slab", { type: "top" }); continue; }   // canopy over the door
    const f = ex[0];
    const along = f.dx !== 0 ? z : x;                                       // position along the face
    if (y % 4 === 3) { v.set(x, y, z, "smooth_quartz"); continue; }         // spandrel under the window band
    if (along % 3 === 0) { v.set(x, y, z, "quartz_pillar"); continue; }     // pier between window bays
    const ns = f.dx !== 0;                                                  // pane runs along the face
    const st = ns ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };
    v.set(x, y, z, "glass_pane", st);
    // a warm light behind some lower-band windows, in the room inside
    if (y % 4 === 1 && hash(x, y, z) % 6 === 0) {
      const ix = x - f.dx, iz = z - f.dz, n = fp.get(k2(ix, iz));
      if (n && n.T > y && faces(n, y).length === 0) v.set(ix, y, iz, "glowstone");
    }
  }
  // the floor slab at each storey line is above; the roof deck sits on the top wall row
}

// Roof plant: a 3x2 stair-and-lift housing on the body roof (stands on the roof cover at y = 24)
const plantCells = [];
for (const c of fp.values()) {
  if (plantCells.length) break;
  const block = [];
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) block.push(fp.get(k2(c.x + dx, c.z + dz)));
  if (block.every((n) => n && n.T === 24 && faces(n, 24).length === 0)) plantCells.push(...block);
}
for (const n of plantCells) for (let y = 25; y <= 26; y++) v.set(n.x, y, n.z, "stone_bricks");
const plant = plantCells.length ? [plantCells[0].x, plantCells[0].z] : null;

const info = v.save(`${HERE}/way_147112337.nbt`);
console.log(JSON.stringify({ cells: fp.size, plant, ...info }));
