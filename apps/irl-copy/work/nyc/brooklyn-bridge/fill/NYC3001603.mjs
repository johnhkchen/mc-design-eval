import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 44 Henry Street, Brooklyn Heights (1879): five-storey brick mixed-use block with
// a stone-trimmed cast shopfront on the ground floor, a central residential door
// under a canopy, and a flat roof behind a stone cornice and parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001603.cells.json`, "utf8"));

const W = 12, HY = 25, D = 5;
const g = new Voxels([W, HY, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Set(cells.map(c => key(c[0], c[1])));
const inFp = (x, z) => fp.has(key(x, z));
const info = new Map(cells.map(c => [key(c[0], c[1]), c]));

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= HY) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Outward face of a perimeter cell: [dx, dz, faceName] or null for interior cells.
function outward(x, z) {
  if (!inFp(x, z - 1)) return [0, -1, "front"];
  if (!inFp(x, z + 1)) return [0, 1, "back"];
  if (!inFp(x - 1, z)) return [-1, 0, "side"];
  if (!inFp(x + 1, z)) return [1, 0, "side"];
  return null;
}
const isPerim = (x, z) => outward(x, z) !== null;

const paneProps = face => face === "side"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Shared massing: one lowest ground for storey lines, one flat roof from the lidar median.
const grounds = cells.map(c => Math.max(0, Math.round(c[2])));
const gBase = Math.min(...grounds);
const roofsSorted = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const roofMed = roofsSorted[Math.floor(roofsSorted.length / 2)];
const T = Math.min(gBase + 14, Math.max(gBase + 9, roofMed)); // top of parapet is T-1
const H = T - gBase;
const n = Math.floor((H - 5) / 2);            // upper storeys, 2 blocks each
const roofY = gBase + 3 + 2 * n;              // flat roof slab / cornice course

// Upper-storey glass on odd bays; stone piers between.
function upperGlass(x, z, face) {
  if (face === "side") return z >= 1 && z <= 3 && z % 2 === 1;
  return x >= 1 && x <= 10 && x % 2 === 1;
}
const shopGlass = x => [1, 2, 3, 7, 8, 9, 10].includes(x);

for (const [x, z, groundRaw] of cells) {
  const gr = Math.max(0, Math.round(groundRaw));
  const out = outward(x, z);
  const per = out !== null;
  const face = out ? out[2] : null;

  // Foundation to this cell's own ground, then the ground row
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, per ? "stone_bricks" : "smooth_stone");

  // Floor slabs and roof slab on the shared storey lines (skip anything under the ground)
  for (let k = 0; k <= n; k++) {
    const fl = gBase + 3 + 2 * k;
    if (fl <= gr) continue;
    if (k === n) put(x, fl, z, per ? "stone_bricks" : "smooth_stone");
    else put(x, fl, z, per ? "stone_bricks" : "spruce_planks");
  }

  if (!per) continue;

  const [dx, dz] = out;
  const ix = x - dx, iz = z - dz;
  const inwardInterior = inFp(ix, iz) && !isPerim(ix, iz);

  // Ground storey: shopfront on the street face, plain glass/brick elsewhere
  for (const y of [gBase + 1, gBase + 2]) {
    if (y <= gr) continue;
    if (face === "front") {
      if (x === 5) {
        const half = y === gBase + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false"
        });
      } else if (shopGlass(x)) {
        put(x, y, z, "glass_pane", paneProps("front"));
      } else {
        put(x, y, z, "stone_bricks");
      }
    } else if (face === "side") {
      if (z >= 1 && z <= 3 && z % 2 === 1) put(x, y, z, "glass_pane", paneProps("side"));
      else put(x, y, z, "stone_bricks");
    } else {
      if (x >= 1 && x <= 10 && x % 2 === 1) put(x, y, z, "glass_pane", paneProps("front"));
      else put(x, y, z, "stone_bricks");
    }
  }

  // Lanterns inside the shopfront
  if (face === "front" && (x === 2 || x === 8) && inwardInterior && gBase + 1 > gr) {
    put(ix, gBase + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }

  // Upper storeys: window row at floor+1; stone piers, brick spandrel bays
  for (let k = 0; k < n; k++) {
    const wy = gBase + 4 + 2 * k;
    if (wy <= gr) continue;
    if (upperGlass(x, z, face)) {
      put(x, wy, z, "glass_pane", paneProps(face === "side" ? "side" : "front"));
      const idx = face === "side" ? z : x;
      if (inwardInterior && (idx + k) % 3 === 0) put(ix, wy, iz, "glowstone");
    } else {
      put(x, wy, z, face === "side" ? "bricks" : "stone_bricks");
    }
  }

  // Cornice course and parapet with a capping slab
  if (roofY > gr) put(x, roofY, z, "stone_bricks");
  for (let y = roofY + 1; y <= T - 2; y++) put(x, y, z, "stone_bricks");
  if (T - 1 > roofY) put(x, T - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance canopy: dark oak stair hood over the door, set at the storey line above the door
if (inFp(5, 0)) {
  const dy = gBase + 3;
  put(5, dy, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });
  put(4, dy, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });
  put(6, dy, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// Rooftop chimney stacks on two interior cells
for (const [cx, cz] of [[2, 2], [9, 2]]) {
  if (!inFp(cx, cz) || isPerim(cx, cz)) continue;
  put(cx, roofY + 1, cz, "bricks");
  put(cx, roofY + 2, cz, "bricks");
  put(cx, roofY + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/NYC3001603.nbt`);
