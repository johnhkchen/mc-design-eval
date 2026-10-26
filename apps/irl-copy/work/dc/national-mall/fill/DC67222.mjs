// 917 N St NW: a small Religious building, built as a late-19th-century red-brick church with a sandstone base and
// quoins, a stone-brick parapet and slate roof deck, and a stepped front pavilion carrying the bell. The lidar roof
// heights set the massing: the nave is 4 high, the lower annexes 2-3, and the front pavilion rises to 6 at its wings
// and 5 at its centre, with the per-cell lidar smoothed by a 3x3 median so the spikes do not become stray towers.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC67222.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const lidar = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const inF = (x, z) => lidar.has(`${x},${z}`);
const out = (x, z) => !inF(x, z);

// the lidar roof height, median of the cell and its footprint neighbours (noise spikes gone)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) v.push(lidar.get(`${x + dx},${z + dz}`));
  v.sort((a, b) => a - b); return v[Math.floor(v.length / 2)];
};
// the clean tiers: front pavilion (z 10-11, x 1-7) 6 at the wings and 5 at the centre; the rest 2-4 by smoothed lidar
const roofOf = (x, z) => {
  if (z >= 10 && x >= 1 && x <= 7) return x >= 3 && x <= 5 ? 5 : 6;
  return Math.min(4, Math.max(2, median(x, z)));
};

const X = 9, Z = 12;
const R = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) R.set(`${x},${z}`, roofOf(x, z));
const roofAt = (x, z) => R.get(`${x},${z}`);

const perim = (x, z) => out(x - 1, z) || out(x + 1, z) || out(x, z - 1) || out(x, z + 1);
const corner = (x, z) => (out(x - 1, z) || out(x + 1, z)) && (out(x, z - 1) || out(x, z + 1));
// the outward normal of a wall cell, as [dx, dz]; null for an interior cell
const normal = (x, z) => {
  if (out(x - 1, z)) return [-1, 0]; if (out(x + 1, z)) return [1, 0];
  if (out(x, z - 1)) return [0, -1]; if (out(x, z + 1)) return [0, 1];
  return null;
};

const g = new Voxels([X, 18, Z]);
const paneState = (nx) => (nx ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// 1. shell: a sandstone base, brick walls with a window grid, quoins at the corners, a stone-brick parapet on a deepslate
//    roof deck, and an air gap behind the glass (interior cells keep only a stone-brick floor and the roof above)
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const r = roofAt(x, z);
  if (!perim(x, z)) {
    g.set(x, 0, z, "stone_bricks");                       // floor slab of the storey
    g.set(x, r - 1, z, "deepslate_tiles");                // roof deck over the air gap
    continue;
  }
  g.set(x, 0, z, "cut_sandstone");                        // base course
  g.set(x, r - 1, z, "stone_bricks");                     // parapet
  const n = normal(x, z);
  if (corner(x, z)) {                                     // quoins
    for (let y = 1; y <= r - 2; y++) g.set(x, y, z, "cut_sandstone");
    continue;
  }
  const along = n[0] !== 0 ? z : x;                       // position along the face
  for (let y = 1; y <= r - 2; y++) {
    if (along % 2 === 1) g.set(x, y, z, "glass_pane", paneState(n[0] !== 0));   // windows on odd bays
    else g.set(x, y, z, "bricks");                        // pilasters between them
  }
}

// 2. entrance on the front (z 11): a double-height door under a sandstone lintel, flanked by the pavilion's windows
g.set(4, 1, 11, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(4, 2, 11, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(4, 3, 11, "cut_sandstone");

// 3. warm light behind some windows (inside the air gap), and hanging lanterns in the empty interior
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z) || !perim(x, z) || corner(x, z)) continue;
  const n = normal(x, z); if (!n) continue;
  const along = n[0] !== 0 ? z : x;
  const r = roofAt(x, z);
  for (let y = 1; y <= r - 2; y++) {
    if (along % 2 !== 1 || (x === 4 && z === 11)) continue;
    if ((along + y) % 4 !== 1) continue;
    const bx = x - n[0], bz = z - n[1];                   // the cell just inside the glass
    if (!inF(bx, bz) || perim(bx, bz)) continue;
    g.set(bx, y, bz, y >= 2 ? "shroomlight" : "glowstone");
  }
}
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z) || perim(x, z)) continue;
  const r = roofAt(x, z);
  if (r < 3) continue;
  if ((x + z) % 4 !== 0 || g.get(x, r - 2, z)) continue;
  g.set(x, r - 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4. the bell on the front pavilion's centre, standing on its roof deck
g.set(4, 5, 10, "bell", { attachment: "floor", facing: "south", powered: "false" });

const stats = g.save(`${DIR}/DC67222.nbt`);
console.log(JSON.stringify(stats));
