import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499695";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 30, D = 13;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr, rf] of cells) fp.set(key(x, z), { g: Math.round(gr), r: rf });
const inFp = (x, z) => fp.has(key(x, z));
const median = (a) => {
  const s = [...a].sort((p, q) => p - q);
  return s[Math.floor(s.length / 2)];
};

const B = median([...fp.values()].map((c) => c.g));          // storey-0 datum
const T = Math.round(median([...fp.values()].map((c) => c.r)));
const BASE_TOP = Math.min(H - 2, Math.max(B + 15, T));         // building-wide roof
// per-cell roof follows lidar lightly, snapped and clamped around the base roof
const topOf = (x, z) => {
  const r = Math.round(fp.get(key(x, z)).r);
  return Math.min(H - 2, Math.max(BASE_TOP - 2, Math.min(BASE_TOP + 2, r)));
};

// ---- face helpers -----------------------------------------------------------
const dirs = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
function missingCount(x, z) {
  let n = 0;
  for (const [dx, dz] of Object.values(dirs)) if (!inFp(x + dx, z + dz)) n++;
  return n;
}
function outward(x, z) {
  for (const [n, [dx, dz]] of Object.entries(dirs)) if (!inFp(x + dx, z + dz)) return n;
  return null;
}
const isPerim = (x, z) => missingCount(x, z) > 0;
const isCorner = (x, z) => missingCount(x, z) > 1;
const allCells = [...fp.keys()].map((k) => k.split(",").map(Number));

// ---- 1. massing: granite foundation, stone-brick shell, quoins, parapet ------
for (const [x, z] of allCells) {
  const { g: gr } = fp.get(key(x, z));
  const tc = topOf(x, z);
  const perim = isPerim(x, z);
  const corner = isCorner(x, z);
  for (let y = 0; y < tc; y++) {
    if (y <= gr) { g.set(x, y, z, "granite"); continue; }
    if (y === tc - 1) {
      if (perim) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!perim) { g.set(x, y, z, "stone"); continue; }
    if (corner) { g.set(x, y, z, "polished_granite"); continue; } // quoins
    if (y >= B && y <= B + 1) { g.set(x, y, z, "polished_granite"); continue; } // base course
    g.set(x, y, z, "stone_bricks");
  }
}

// ---- 2. storey string courses, pilasters and shopfront sign band ------------
const isDoorCol = (x, z, out) => out === "north" && z === 0 && x === Math.floor(W / 2);
for (const [x, z] of allCells) {
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  const out = outward(x, z);
  const along = out === "north" || out === "south" ? x : z;
  const tc = topOf(x, z);
  // string courses at each storey line
  for (const yy of [B + 5, B + 10]) {
    if (yy < tc - 1) g.set(x, yy, z, "polished_granite");
  }
  // pilasters on every third bay, chiseled for relief
  if (along % 3 === 0) {
    for (let y = B + 1; y < tc - 1; y++) {
      if (y === B + 5 || y === B + 10) continue;
      g.set(x, y, z, "chiseled_stone_bricks");
    }
  }
  // dark-oak sign band over the shopfront (north face, not the door)
  if (out === "north" && !isDoorCol(x, z, out)) {
    g.set(x, B + 4, z, "dark_oak_planks");
  }
}

// ---- 3. glazing, air pockets behind glass, warm lights ----------------------
const glassProps = (out) => {
  const horiz = out === "north" || out === "south";
  return horiz
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

const carve = [];
const lights = [];

for (const [x, z] of allCells) {
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  const out = outward(x, z);
  const [dx, dz] = dirs[out];
  const along = out === "north" || out === "south" ? x : z;
  const ix = x - dx, iz = z - dz;
  const pocketOk = inFp(ix, iz) && !isPerim(ix, iz);
  if (isDoorCol(x, z, out)) continue;
  const bayUsable = along % 3 !== 0; // piers stay solid
  if (!bayUsable && out !== "north") continue;

  for (let s = 0; s < 3; s++) {
    const y0 = B + 5 * s + 1;
    const y1 = B + 5 * s + 3;
    const glazed = s === 0 ? true : bayUsable;
    if (!glazed) continue;
    if (s === 0 && !bayUsable && out === "north") {
      // ground-floor piers stay as chiseled stone
      continue;
    }
    for (let y = y0; y <= y1; y++) {
      g.set(x, y, z, "glass_pane", glassProps(out));
      if (pocketOk) carve.push([ix, y, iz]);
    }
    if (pocketOk && s >= 1 && along % 6 === 1) lights.push([ix, B + 5 * s + 2, iz]);
    if (pocketOk && s === 0 && along % 6 === 4) lights.push([ix, B + 2, iz]);
  }
}

// ---- 4. entrance: recessed dark-oak door, hood and hanging lantern ----------
const doorX = Math.floor(W / 2);
if (inFp(doorX, 0)) {
  const dprops = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, B + 1, 0, "dark_oak_door", dprops("lower"));
  g.set(doorX, B + 2, 0, "dark_oak_door", dprops("upper"));
  g.set(doorX, B + 3, 0, "glass_pane", glassProps("north"));
  // dark hood over the door, spanning the three cells of the entrance bay
  for (const dxx of [-1, 0, 1]) {
    if (inFp(doorX + dxx, 0)) {
      g.set(doorX + dxx, B + 4, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // entrance hall: air behind the door, lantern hanging from the hood's ceiling
  if (inFp(doorX, 1) && !isPerim(doorX, 1)) {
    for (let y = B + 1; y <= B + 3; y++) carve.push([doorX, y, 1]);
    lights.push([doorX, B + 3, 1]);
  }
}

// carve pockets (interior only), then lights (only into carved air)
for (const [x, y, z] of carve) {
  if (inFp(x, z) && y > B && y < topOf(x, z) - 1) g.set(x, y, z, "air");
}
for (const [x, y, z] of lights) {
  if (!inFp(x, z)) continue;
  if (y === B + 3 && x === doorX && z === 1) {
    g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    g.set(x, y, z, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
