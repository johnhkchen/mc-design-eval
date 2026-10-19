// Warwick Apartment Hotel, 1340 Avenue of the Americas, 1926: a brick setback hotel tower on a granite base,
// in the 1916-zoning manner (stepped tiers that rise to a central shaft), 33 x 22 cells.
// Avenue (x 0) is the street front; the entrance sits on its middle bay. Storeys are 3 blocks: a limestone
// spandrel row and two rows of glazing or brick. Lidar roofs snapped to clean tiers (3, 27, 60, 72, 87, 96, 105),
// a 3x3 median on the tiers to take out single-cell noise, and a crown with a copper cap on the central shaft.
// Interior is air behind the glazing with a floor slab per storey; warm lights sit behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034786.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 33, D = 22, H = 117;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Per-cell ground and lidar roof, [x][z]; off-footprint cells read as top 0.
const ground = Array.from({ length: W }, () => Array(D).fill(0));
const snapped = Array.from({ length: W }, () => Array(D).fill(0));
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D;
const seen = Array.from({ length: W }, () => Array(D).fill(false));
for (const [x, z, g] of cells) { ground[x][z] = g; seen[x][z] = true; }

// Lidar roof -> tier: courts and light wells at grade, one- and nine-storey wings, then the four setback tiers.
const tier = (r) => (r <= 2 ? 1 : r <= 10 ? 3 : r <= 40 ? 27 : r <= 66 ? 60 : r <= 79 ? 72 : r <= 92 ? 87 : r <= 99 ? 96 : 105);
for (const [x, z, , r] of cells) snapped[x][z] = tier(r);

// 3x3 median over footprint neighbours (self included) to drop single-cell lidar noise.
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, g] of cells) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nx = x + dx, nz = z + dz;
    if (inFp(nx, nz) && seen[nx][nz]) vals.push(snapped[nx][nz]);
  }
  vals.sort((a, b) => a - b);
  let tierHere = vals[Math.floor(vals.length / 2)];
  if (tierHere === 27 && vals.filter((v) => v >= 27).length < 4) tierHere = 3;   // a two-cell 27 patch is lidar noise, not a wing
  T[x][z] = Math.max(tierHere, g + 1);   // a court is one paving block above its ground
}

// Central shaft: the 105 tier rises three more storeys in a stepped crown.
const CROWN_TOP = 114;
const crown = (x, z) => x >= 12 && x <= 20 && z >= 7 && z <= 14 && T[x][z] === 105;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (crown(x, z)) T[x][z] = CROWN_TOP;

const topAt = (x, z) => (inFp(x, z) ? T[x][z] : 0);
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const slab = (type) => ({ type, waterlogged: "false" });
const paneFor = (ex) => (ex[0][0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }   // on an x-face the pane runs along z
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const DOOR = { z: 10 };   // avenue-face bay of the entrance

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp(x, z) || !seen[x][z]) continue;
  const base = ground[x][z], top = T[x][z];
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "polished_granite");
  for (let y = base; y < top; y++) {
    const k = y - base, s = Math.floor(k / 3), p = k % 3;
    const ex = exposed(x, z, y);
    const outside = ex.length > 0;
    if (y === top - 1) {                                       // roof deck or cornice
      if (top === CROWN_TOP) put(x, y, z, "oxidized_copper");
      else if (!outside) put(x, y, z, "smooth_stone");
      else put(x, y, z, "stone_brick_slab", slab("top"));
      continue;
    }
    if (!outside) {                                            // interior: a floor slab per storey, air between
      if (p === 0) put(x, y, z, "smooth_stone");
      continue;
    }
    if (p === 0) {                                             // spandrel band, granite base course at grade
      put(x, y, z, s === 0 ? "polished_granite" : "smooth_quartz");
      continue;
    }
    const exX = ex.filter(([dx]) => dx !== 0), exZ = ex.filter(([, dz]) => dz !== 0);
    if (exX.length && exZ.length) { put(x, y, z, "smooth_quartz"); continue; }   // quoins at the corners
    const onAvenue = exX.length > 0 && exX[0][0] === -1;
    const bay = exX.length ? z : x;                            // bay index along the face
    const face = exX.length ? exX : exZ;
    // Entrance: a single door on the avenue's middle bay, granite jambs and a lintel over it.
    if (onAvenue && s === 0 && bay === DOOR.z) {
      if (p === 1) put(x, y, z, "iron_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
      if (p === 2) put(x, y, z, "iron_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (onAvenue && s === 0 && (bay === DOOR.z - 1 || bay === DOOR.z + 1)) { put(x, y, z, "polished_granite"); continue; }
    if (onAvenue && s === 0 && bay === DOOR.z + 2 && p === 2) { put(x, y, z, "polished_granite"); continue; }
    // Glazing on the odd bays, brick piers on the even; the avenue's ground storey is all shopfront glass.
    const glazed = onAvenue && s === 0 ? true : bay % 2 === 1;
    if (glazed) {
      put(x, y, z, "glass_pane", paneFor(face));
    } else {
      put(x, y, z, "bricks");
    }
    // Warm light in the air gap behind some glazing: a glowstone one cell inside, on alternate storeys.
    if (glazed && p === 1 && (bay + s) % 4 === 0) {
      const [dx, dz] = face[0];
      const ix = x - dx, iz = z - dz;
      if (inFp(ix, iz) && exposed(ix, iz, y).length === 0 && topAt(ix, iz) > y) put(ix, y, iz, "glowstone");
    }
  }
}

// Rooftop: a spire on the crown, and a small bulkhead on the 60 tier.
put(16, CROWN_TOP, 10, "iron_bars");
put(16, CROWN_TOP + 1, 10, "iron_bars");
put(16, CROWN_TOP + 2, 10, "lantern", { hanging: "false", waterlogged: "false" });
for (const [x, z] of [[3, 4], [3, 5], [4, 4], [4, 5]]) for (let y = 60; y < 63; y++) put(x, y, z, "stone_bricks");
put(3, 63, 4, "stone_brick_slab", slab("bottom")); put(3, 63, 5, "stone_brick_slab", slab("bottom"));

const info = g.save(`${DIR}/NYC1034786.nbt`);
console.log(`saved NYC1034786.nbt: ${info.blocks} blocks, ${info.palette} palette entries`);
