// 49 West 45th Street, 1922 commercial and office building: a setback office block of the 1916 zoning envelope, in pale
// limestone on a grey granite base, 14 storeys to 44 blocks (about 49 m). Footprint 15 x 27 (x across the front; low z =
// north = the 45th Street frontage). The lidar is read as clean tiers on a storey grid: an 8-block street wall (z 0-1),
// a 23-block shoulder (z 2-3), a 33-block terrace (z 4), the 44-block tower (z 5-26) with a 42-block roof terrace over
// a light court (x 3-8, z 7-15) and a 42-block south-west wing. Ground floor y 0-4: shopfronts on 45th Street and a
// 3-wide entrance recessed under a canopy with a hanging lantern. Above: storeys of 3 blocks from y 5 (a smooth-stone
// floor line, then two window rows), a cornice at the top of each tier. Piers every 3 blocks; windows sit one block
// back from the piers with an air gap behind the glass; some windows show warm glowstone. Solid core, no interiors.
// A water tank and a mechanical penthouse stand on the tower roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034242.cells.json`, "utf8"));
const X = 15, Y = 56, Z = 27;
const AIR = "air";

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));

// Tier tops (block heights) from the lidar, snapped to 8, 23, 33, 42, 44. Roof 1-2 is a lidar hole in the tower, so it
// takes the tower's height; the few single-cell dips are set to their neighbours; the two roof terraces are rectangles.
const snap = (r) => (r <= 2 ? 44 : r <= 12 ? 8 : r <= 28 ? 23 : r <= 37 ? 33 : r <= 42 ? 42 : 44);
const TOP_OVERRIDE = {
  "14,3": 23, "9,2": 23,                                // dips in the shoulder
  "6,5": 44, "7,5": 44,                                 // dip in the tower's north edge
  "2,7": 44, "2,8": 44, "0,8": 44,                      // single 42 cells on the west edge
  "10,9": 44, "10,10": 44,                              // notch on the east side
  "14,11": 44, "14,14": 44,                             // east edge steps
  "0,23": 44, "5,23": 44, "7,23": 44, "10,23": 44,      // single cells in the row above the south-west wing
};
const topOf = (x, z) => {
  const k = `${x},${z}`;
  if (k in TOP_OVERRIDE) return TOP_OVERRIDE[k];
  if (x >= 3 && x <= 8 && z >= 7 && z <= 15) return 42;  // roof terrace over the light court
  if (x <= 10 && z >= 24) return 42;                     // south-west wing
  return snap(cell.get(k).roof);
};
const H = [], GR = [];
for (let z = 0; z < Z; z++) {
  H.push([]); GR.push([]);
  for (let x = 0; x < X; x++) { H[z].push(topOf(x, z)); GR[z].push(cell.get(`${x},${z}`).ground); }
}

// Solid is the geometry (below each cell's tier top); the facade is read from it, so the setbacks and the court walls
// get the same bays as the street faces. A cell's depth is how many solid cells lie between it and the air on its
// nearest side; the face is that nearest side (z-faces win ties, so corners take the north/south bay grid).
const solid = (x, y, z) => x >= 0 && z >= 0 && x < X && z < Z && y >= 0 && y < H[z][x];
const ray = (x, y, z, dx, dz) => { let c = 0; while (solid(x + dx * (c + 1), y, z + dz * (c + 1))) c++; return c; };
function faceOf(x, y, z) {
  const n = ray(x, y, z, 0, -1), s = ray(x, y, z, 0, 1), w = ray(x, y, z, -1, 0), e = ray(x, y, z, 1, 0);
  const zFace = Math.min(n, s) <= Math.min(w, e);
  const face = zFace ? (n <= s ? "N" : "S") : (w <= e ? "W" : "E");
  const u = zFace ? x : z;                                // position along the face: the bay grid runs along it
  return { face, zFace, u, edge: u === 0 || u === (zFace ? X : Z) - 1, depth: Math.min(n, s, w, e) };
}

const FACE_SEED = { N: 3, S: 11, E: 23, W: 17 };
function windowBlock(depth, glass, lit) {
  if (depth === 0) return AIR;                            // the window is one block back from the piers
  if (depth === 1) return glass;
  if (depth === 2) return lit ? "glowstone" : AIR;        // air gap behind the glass, warm light in some
  return "calcite";
}

// The block at (x, y, z) for a solid cell: a string, or [id, state]. Air is returned as AIR.
function blockAt(x, y, z) {
  const top = H[z][x], gr = GR[z][x];
  const { face, zFace, u, edge, depth } = faceOf(x, y, z);
  if (y === top - 1) return depth === 0 ? "calcite" : "stone";          // cornice, then the roof covering
  if (y < gr) return "stone_bricks";                                    // foundation on the uphill side
  const pier = edge || u % 3 === 0;
  const lit = (u * 7 + y * 5 + FACE_SEED[face]) % 9 === 0;
  if (y < 5) {
    if (y === gr) return "polished_granite";                            // base course / bulkhead
    const entrance = face === "N" && zFace && u >= 6 && u <= 8 && gr === 0 && depth <= 2;
    if (entrance) {
      if (y === 4) return depth === 0 ? ["polished_blackstone_slab", { type: "bottom", waterlogged: "false" }] : "smooth_stone";
      if (y === 3) return depth === 0 && u === 7 ? ["lantern", { hanging: "true", waterlogged: "false" }] : "calcite";
      return depth === 1 ? "glass" : depth === 0 || depth === 2 ? AIR : "calcite";   // doors, then the lobby behind
    }
    if (y === 4) return "smooth_stone";                                  // belt course
    if (pier) return "calcite";
    const shop = face === "N" && zFace;
    return windowBlock(depth, shop || lit ? "glass" : "gray_stained_glass", lit);
  }
  if ((y - 5) % 3 === 0) return depth === 0 ? "smooth_stone" : "calcite"; // storey line (floor slab)
  if (pier) return "calcite";
  return windowBlock(depth, lit ? "glass" : "gray_stained_glass", lit);
}

const vox = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 0; y < H[z][x]; y++) {
  const r = blockAt(x, y, z);
  if (r === AIR) continue;
  const [id, st] = Array.isArray(r) ? r : [r];
  vox.set(x, y, z, id, st);
}

// Roof: a water tank on the tower roof and a two-storey mechanical penthouse, both standing on the 44-block roof.
for (let y = 44; y <= 46; y++) for (let x = 10; x <= 12; x++) for (let z = 19; z <= 21; z++) vox.set(x, y, z, "spruce_planks");
for (let x = 1; x <= 3; x++) for (let z = 19; z <= 22; z++) {
  vox.set(x, 44, z, "calcite");
  vox.set(x, 45, z, "calcite");
  vox.set(x, 46, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Nothing floats: every block must connect to the ground through touching blocks.
const idx = (x, y, z) => (z * Y + y) * X + x;
const seen = new Uint8Array(X * Y * Z);
const queue = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (vox.get(x, 0, z)) { seen[idx(x, 0, z)] = 1; queue.push([x, 0, z]); }
for (let q = 0; q < queue.length; q++) {
  const [x, y, z] = queue[q];
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (!vox.get(nx, ny, nz) || seen[idx(nx, ny, nz)]) continue;
    seen[idx(nx, ny, nz)] = 1; queue.push([nx, ny, nz]);
  }
}
let floating = 0;
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) if (vox.get(x, y, z) && !seen[idx(x, y, z)]) floating++;
if (floating) throw new Error(`${floating} floating blocks`);

console.log(vox.save(`${DIR}/NYC1034242.nbt`));
