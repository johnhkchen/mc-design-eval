// Notre-Dame de Paris, the cathedral's footprint as the lidar's massing: each cell stands from its own ground up to a
// roof height smoothed by a 3x3 median and quantized to 5-block storeys, so the nave, chevet and towers step in clean
// tiers. Stone walls with a base course, storey lines, glazed bays between pilasters, doorways in a pillared portal,
// a parapet of posts, and a tiled roof. Every cell is solid massing with one air pocket behind each window (glowstone
// in some), so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245157322.cells.json`, "utf8"));

const [W, H, D] = [102, 49, 66];
const g = new Voxels([W, H, D]);

const key = (x, z) => x * 1000 + z;
const at = new Map();
const F = cells.map(([x, z, ground, roof]) => {
  const f = { x, z, g: ground, r: roof };
  at.set(key(x, z), f);
  return f;
});
const has = (x, z) => at.has(key(x, z));

// roof: 5x5 median of the footprint's own heights, then whole storeys of 5 (K storeys, solid to T = 5K)
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[s.length >> 1]; };
for (const f of F) {
  const near = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const n = at.get(key(f.x + dx, f.z + dz)); if (n) near.push(n.r);
  }
  const K = Math.max(1, Math.round(median(near) / 5));
  f.T = 5 * K;
}

// the outside faces of each footprint cell (outward normals), and the faces' cell lists
for (const f of F) {
  f.out = [];
  if (!has(f.x - 1, f.z)) f.out.push([-1, 0]);
  if (!has(f.x + 1, f.z)) f.out.push([1, 0]);
  if (!has(f.x, f.z - 1)) f.out.push([0, -1]);
  if (!has(f.x, f.z + 1)) f.out.push([0, 1]);
}

// entrances: three doors at the quarter points of the footprint's longest single-facing wall
const faces = new Map();
for (const f of F) if (f.out.length === 1) {
  const k = f.out[0].join(",");
  if (!faces.has(k)) faces.set(k, []);
  faces.get(k).push(f);
}
const [faceKey, faceCells] = [...faces].sort((a, b) => b[1].length - a[1].length)[0];
const along = (f, [nx]) => (nx !== 0 ? f.z : f.x);
faceCells.sort((a, b) => along(a, faceCells[0].out[0]) - along(b, faceCells[0].out[0]));
const doorCells = [0.25, 0.5, 0.75].map((q) => faceCells[Math.floor(faceCells.length * q)]);
const doorKey = new Set(doorCells.map((f) => key(f.x, f.z)));
const [dnx, dnz] = faceKey.split(",").map(Number);
const facing = dnx === 1 ? "east" : dnx === -1 ? "west" : dnz === 1 ? "south" : "north";

const pockets = [];   // window pockets (air, or glowstone in some): [x, y, z, lit]

for (const f of F) {
  const { x, z, g: ground, T, out } = f;
  // a stair-stepped diagonal wall has many two-faced cells; they read as the same wall, so the first face sets the pattern
  const perim = out.length > 0, corner = false;
  const [nx, nz] = out[0] || [0, 0];
  const idx = nx !== 0 ? z : x;   // position along the wall it faces

  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");   // foundation up to this cell's ground

  for (let y = ground; y < T; y++) {
    if (!perim) { g.set(x, y, z, y === T - 1 ? "deepslate_tiles" : "stone"); continue; }

    if (doorKey.has(key(x, z)) && (y === ground || y === ground + 1)) {
      const half = y === ground ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    let mat;
    if (corner) mat = "stone_bricks";                       // quoins
    else if (y === ground) mat = "polished_andesite";       // base course
    else if (y === T - 1) mat = "stone_bricks";             // cornice under the roof
    else if (y % 5 === 0) mat = "stone_bricks";             // storey line
    else if (y % 5 === 4) mat = "calcite";                  // sill / lintel band
    else if (y >= 2 && y % 5 <= 3) {                        // the storey's window band, bays between pilasters
      if (idx % 4 === 1 || idx % 4 === 2) {
        mat = "glass_pane";
        pockets.push([x - nx, y, z - nz, y % 5 === 2 && ((idx >> 1) + (y / 5 | 0)) % 4 === 0]);
      } else mat = "stone_bricks";
    } else mat = "calcite";
    g.set(x, y, z, mat);
  }

  // parapet: posts on the face, a solid crown on the corners
  if (perim && idx % 2 === 0) g.set(x, T, z, "stone_brick_wall");
}

// the air pockets behind the glass: only where the cell behind is interior (not on the outside wall)
for (const [x, y, z, lit] of pockets) {
  const f = at.get(key(x, z));
  if (!f || f.out.length) continue;
  if (lit) g.set(x, y, z, "glowstone");
  else g.set(x, y, z, "air");
}

const out = `${DIR}/FR245157322.nbt`;
const r = g.save(out);
console.log(`doors ${doorCells.length} on ${faceKey} (${faceCells.length} cells); blocks ${r.blocks}, palette ${r.palette}`);
console.log(`saved ${out}`);
