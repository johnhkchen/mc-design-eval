// 1825 New Hampshire Ave NW: a red-brick residential apartment block (1910s-20s, Dupont Circle), U-plan around a
// north-facing light court. Stone plinth, limestone string courses at each floor line, two-light windows between brick
// piers, a limestone cornice, an elevator penthouse, and an entrance on the low (south) side. Roof heights follow the
// lidar record (median-smoothed over the footprint). Three storeys of ~3 blocks; the walls are one block thick with an
// air gap behind the glass, and every floor line is a solid slab across the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68219.cells.json`, "utf8"));

const X = 18, Y = 25, Z = 10;
const EXPOSE = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BRICK = "bricks", TRIM = "smooth_sandstone", BASE = "stone_bricks", SLAB = "smooth_stone", ROOF = "stone";
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// footprint: ground (lowest-ground relative) and top layer (lidar roof height minus one), median-smoothed
const raw = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const fp = new Map();
for (const [x, z, ground] of cells) {
  const vals = [raw.get(`${x},${z}`)];
  for (const [dx, dz] of EXPOSE) { const r = raw.get(`${x + dx},${z + dz}`); if (r !== undefined) vals.push(r); }
  vals.sort((a, b) => a - b);
  fp.set(`${x},${z}`, { ground, top: vals[vals.length >> 1] - 1 });
}
const cellAt = (x, z) => fp.get(`${x},${z}`);
// solid: inside the footprint and at or below the cell's top layer
const solid = (x, y, z) => { const c = cellAt(x, z); return !!c && y >= 0 && y <= c.top; };
const exposed = (x, y, z) => EXPOSE.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

// what a footprint cell is at height y: a block and its state, or null for air (the interior behind the glass)
function cladding(x, y, z) {
  const { ground, top } = cellAt(x, z);
  if (y <= ground) return [BASE];                       // foundation and plinth
  const ex = exposed(x, y, z);
  if (y === top) return [ex.length ? TRIM : ROOF];      // limestone cornice on the exterior, roof deck inside
  if ((y - ground) % 3 === 0) return [ex.length ? TRIM : SLAB]; // floor line: string course outside, slab inside
  if (!ex.length) return null;
  if (y === top - 1 && (y - ground) % 3 === 1) return [BRICK]; // a one-row frieze under the cornice, not a window row
  const xFace = ex.some(([dx]) => dx !== 0), zFace = ex.some(([, dz]) => dz !== 0);
  if (xFace && zFace) return [TRIM];                    // quoin at corners
  const u = zFace ? x : z;                              // position along the wall
  if (u % 4 === 1 || u % 4 === 2) return ["glass_pane", zFace ? PANE_EW : PANE_NS];
  return [BRICK];                                       // pier between window pairs
}

const g = new Voxels([X, Y, Z]);
const windows = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = cellAt(x, z); if (!c) continue;
  for (let y = 0; y <= c.top; y++) {
    const b = cladding(x, y, z); if (!b) continue;
    g.set(x, y, z, b[0], b[1]);
    if (b[0] === "glass_pane") windows.push({ x, y, z, out: exposed(x, y, z)[0] });
  }
}

// entrance on the low south face: double door under a limestone lintel, pilasters and a hood
for (const x of [7, 8]) {
  const hinge = x === 7 ? "left" : "right";
  const st = (half) => ({ facing: "south", half, hinge, open: "false", powered: "false" });
  g.set(x, 1, 9, "dark_oak_door", st("lower"));
  g.set(x, 2, 9, "dark_oak_door", st("upper"));
}
for (const x of [6, 9]) for (const y of [1, 2]) g.set(x, y, 9, TRIM);
for (let x = 6; x <= 9; x++) g.set(x, 4, 9, TRIM);

// warm light in about one window in six: a glowstone in the air gap just inside the glass
for (const w of windows) {
  if ((w.x * 2 + w.z * 3 + w.y) % 6 !== 0) continue;
  const ix = w.x - w.out[0], iz = w.z - w.out[1];
  if (solid(ix, w.y, iz) && !g.get(ix, w.y, iz)) g.set(ix, w.y, iz, "glowstone");
}

// rooftop plant: two small equipment boxes on the lower roof, standing on its deck
for (const [x, z] of [[1, 2], [2, 2], [1, 3], [2, 3]]) for (const y of [11, 12]) g.set(x, y, z, BASE);
for (const [x, z] of [[14, 2], [15, 2], [14, 3], [15, 3]]) g.set(x, 11, z, SLAB);

const out = `${DIR}/DC68219.nbt`;
const info = g.save(out);
console.log(`DC68219: ${info.blocks} blocks, ${info.palette} palette entries -> ${out}`);
