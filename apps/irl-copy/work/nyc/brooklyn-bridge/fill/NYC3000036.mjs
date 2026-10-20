import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000036";
const W = 28, H = 27, D = 43;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = (x, z) => info.has(key(x, z));
const info = new Map();   // key -> { g: ground, rs: parapet row, top: roof slab row }

// Flatten the massing: one main roof tier (median of lidar), lower wings only where clearly lower.
const roundEven = (v) => 2 * Math.round(v / 2);
const sortedRoofs = cells.map((c) => roundEven(c[3])).sort((a, b) => a - b);
const MAIN = sortedRoofs[Math.floor(sortedRoofs.length / 2)];

for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const r = roundEven(rf);
  let tier = r < MAIN - 3 ? r : MAIN;      // lower wing where lidar is clearly lower
  tier = Math.min(25, Math.max(ground + 5, tier));
  info.set(key(x, z), { g: ground, rs: tier, top: tier - 1 });
}

const SET = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Facade classification: edge cells know which face they stand on.
const faceOf = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const outN = !has(x, z - 1), outS = !has(x, z + 1);
  const outW = !has(x - 1, z), outE = !has(x + 1, z);
  if (outN || outS || outW || outE) {
    faceOf.set(key(x, z), { face: (outN || outS) ? "z" : "x" });
  }
}

// Main entrance on the street face (low z) nearest the middle.
let door = null, doorFacing = null;
const edgeList = [...faceOf.keys()].map((k) => k.split(",").map(Number));
const pickCentral = (arr) => arr.sort((a, b) => Math.abs(a[0] - 14) - Math.abs(b[0] - 14))[0];
const front = edgeList.filter(([x, z]) => faceOf.get(key(x, z)).face === "z" && !has(x, z - 1));
if (front.length) { door = pickCentral(front); doorFacing = "south"; }
else {
  const back = edgeList.filter(([x, z]) => faceOf.get(key(x, z)).face === "z" && !has(x, z + 1));
  if (back.length) { door = pickCentral(back); doorFacing = "north"; }
}
const isDoorCell = (x, z) => door && door[0] === x && door[1] === z;
// Entrance jamb cells beside the door (on the same face).
const isJamb = (x, z) => door && z === door[1] && Math.abs(x - door[0]) === 1 && faceOf.has(key(x, z));

// Window test: odd rows inside each storey, piers every third bay.
function winOK(x, z, y) {
  const f = faceOf.get(key(x, z));
  const inf = info.get(key(x, z));
  if (!f || !inf) return false;
  if (isDoorCell(x, z)) return false;
  const k = y - inf.g;
  if (k < 1 || k % 2 === 0 || y >= inf.top) return false;
  const idx = f.face === "z" ? x : z;
  return idx % 3 !== 0;
}
const lit = (x, z, y) => winOK(x, z, y) && ((x * 7 + z * 13 + y * 5) % 4 === 0);

// Build columns.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const inf = info.get(key(x, z));
  const { g: gr, top, rs } = inf;
  const edge = faceOf.has(key(x, z));
  const f = faceOf.get(key(x, z));

  // Foundation fill up to the cell's ground.
  for (let y = 0; y < gr; y++) SET(x, y, z, "stone_bricks");

  for (let y = gr; y <= top; y++) {
    const k = y - gr;
    if (!edge) {
      // Interior: floor slabs each storey plus roof slab, air between.
      if (k % 2 === 0 || y === top) SET(x, y, z, "stone");
      continue;
    }
    if (y === top) { SET(x, y, z, "smooth_stone"); continue; }           // cornice band
    if (isDoorCell(x, z) && k === 0) {
      SET(x, y, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoorCell(x, z) && k === 1) {
      SET(x, y, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (k === 0) { SET(x, y, z, isJamb(x, z) ? "smooth_stone" : "stone_bricks"); continue; } // base course + jambs
    if (isJamb(x, z) && k <= 2) { SET(x, y, z, "smooth_stone"); continue; }                  // entrance jambs and lintel
    if (k % 4 === 0) { SET(x, y, z, "smooth_stone"); continue; }        // stringcourse every other storey
    if (k % 2 === 0) { SET(x, y, z, "bricks"); continue; }              // brick spandrel
    if (winOK(x, z, y)) {
      const e = f.face === "z";
      const pw = e ? winOK(x + 1, z, y) && faceOf.get(key(x + 1, z))?.face === "z" : winOK(x, z + 1, y) && faceOf.get(key(x, z + 1))?.face === "x";
      const pe = e ? winOK(x - 1, z, y) && faceOf.get(key(x - 1, z))?.face === "z" : winOK(x, z - 1, y) && faceOf.get(key(x, z - 1))?.face === "x";
      const props = e
        ? { north: "false", south: "false", east: pw ? "true" : "false", west: pe ? "true" : "false", waterlogged: "false" }
        : { north: pe ? "true" : "false", south: pw ? "true" : "false", east: "false", west: "false", waterlogged: "false" };
      SET(x, y, z, "glass_pane", props);
    } else {
      SET(x, y, z, "bricks");                                            // brick piers
    }
  }

  // Parapet cap on the street shell.
  if (edge) SET(x, rs, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Warm interior light behind selected windows (glowstone stands on the floor slab below).
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const f = faceOf.get(key(x, z));
  if (!f) continue;
  const inf = info.get(key(x, z));
  for (let y = inf.g + 1; y < inf.top; y += 2) {
    if (!lit(x, z, y)) continue;
    let ix, iz;
    if (f.face === "z") { if (!has(x, z - 1)) { ix = x; iz = z + 1; } else { ix = x; iz = z - 1; } }
    else { if (!has(x - 1, z)) { ix = x + 1; iz = z; } else { ix = x - 1; iz = z; } }
    if (!has(ix, iz) || faceOf.has(key(ix, iz))) continue;
    SET(ix, y, iz, "glowstone");
  }
}

// Entrance lantern hanging just inside the door, under the first-floor slab.
if (door) {
  const [x, z] = door;
  const f = faceOf.get(key(x, z));
  let ix, iz;
  if (f.face === "z") { if (!has(x, z - 1)) { ix = x; iz = z + 1; } else { ix = x; iz = z - 1; } }
  else { ix = x + 1; iz = z; }
  if (has(ix, iz) && !faceOf.has(key(ix, iz))) {
    const gr = info.get(key(x, z)).g;
    SET(ix, gr + 1, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Stair/elevator bulkhead on the roof of the central interior cells where the roof allows it.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (faceOf.has(key(x, z))) continue;
  if (x < 11 || x > 16 || z < 18 || z > 23) continue;
  const inf = info.get(key(x, z));
  if (inf.rs > 24) continue;
  SET(x, inf.rs, z, "bricks");
  SET(x, inf.rs + 1, z, "bricks");
  SET(x, inf.rs + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

vox.save(`${DIR}/${ID}.nbt`);
