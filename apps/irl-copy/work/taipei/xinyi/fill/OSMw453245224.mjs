import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unknown-era mid-rise commercial block, 9 storeys of 5 blocks, roof at y=45.
// Tinted curtain-wall glazing in white concrete bays, granite plinth, stone-brick
// foundation, quartz cornice, central mechanical penthouse with lit windows and a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245224";
const W = 34, H = 57, D = 16;
const TOP = 44;       // last wall row (ceiling of top storey)
const ROOF = 45;      // roof surface / cornice row
const PARAPET = 46;   // parapet row on the perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, y, z) => `${x},${y},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);
const isPerim = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pre-compute warm lights: interior cells just behind glazed bays.
const lights = new Set();
for (const [x, z, ground] of cells) {
  if (!isPerim(x, z)) continue;
  const oN = !has(x, z - 1), oS = !has(x, z + 1), oW = !has(x - 1, z), oE = !has(x + 1, z);
  if ((oN || oS) && (oW || oE)) continue; // corners
  const dx = oW ? 1 : oE ? -1 : 0;
  const dz = oN ? 1 : oS ? -1 : 0;
  const u = (oN || oS) ? x : z;
  if (u % 6 !== 1) continue;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerim(ix, iz) || ix % 6 === 0) continue;
  const gr = Math.min(Math.max(0, fp.get(`${ix},${iz}`)), TOP);
  for (let y = Math.max(gr, Math.min(ground, TOP)) + 1; y <= TOP; y++) {
    const w = (y - Math.min(Math.max(0, ground), TOP)) % 5;
    if (w === 2) lights.add(key(ix, y, iz));
  }
}

for (const [x, z, ground] of cells) {
  const gr = Math.min(Math.max(0, ground), TOP);

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const oN = !has(x, z - 1), oS = !has(x, z + 1), oW = !has(x - 1, z), oE = !has(x + 1, z);
  const perim = oN || oS || oW || oE;
  const corner = (oN || oS) && (oW || oE);
  const u = (oN || oS) ? x : z;
  const mullion = u % 3 === 0;

  for (let y = gr; y <= PARAPET; y++) {
    if (y === ROOF) {
      put(x, y, z, perim ? "smooth_quartz" : "gray_concrete");
      continue;
    }
    if (y === PARAPET) {
      if (perim) put(x, y, z, "white_concrete");
      continue;
    }
    if (!perim) {
      if (x % 6 === 0) put(x, y, z, "white_concrete");                 // structural column line
      else if (y === TOP || (y > gr && (y - gr) % 5 === 0)) put(x, y, z, "smooth_quartz"); // floor slabs / ceiling
      else if (lights.has(key(x, y, z))) put(x, y, z, "glowstone");
      continue;
    }
    if (corner) {
      put(x, y, z, y === gr ? "polished_granite" : "white_concrete");
      continue;
    }
    const ly = y - gr;
    const st = Math.floor(ly / 5);
    const w = ly % 5;
    if (st === 0 && w === 0) {
      put(x, y, z, "polished_granite");                                  // plinth
    } else if (st === 0 && w === 4) {
      put(x, y, z, "white_concrete");                                    // shopfront lintel
    } else if (w === 0) {
      put(x, y, z, "white_concrete");                                    // storey spandrel
    } else if (oS && x === 16 && st === 0 && (w === 1 || w === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: w === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });                                                                // main entrance
    } else if (mullion) {
      put(x, y, z, "white_concrete");                                    // curtain-wall mullion
    } else {
      put(x, y, z, "light_blue_stained_glass");                          // tinted glazing
    }
  }
}

// Central mechanical penthouse, x 12..21, z 5..10, y 46..50.
for (let x = 12; x <= 21; x++) {
  for (let z = 5; z <= 10; z++) {
    if (!has(x, z)) continue;
    put(x, 46, z, "white_concrete");
    const ring = x === 12 || x === 21 || z === 5 || z === 10;
    for (let y = 47; y <= 49; y++) {
      if (!ring) continue;
      if (y === 48 && (x + z) % 4 === 0) put(x, y, z, "glowstone");
      else if (y === 48 && (x + z) % 4 === 2) put(x, y, z, "glowstone");
      else if (x === 12 || x === 21 || z === 5 || z === 10) {
        put(x, y, z, (x === 12 || x === 21) && (z === 5 || z === 10) ? "white_concrete" : "light_blue_stained_glass");
      }
    }
    put(x, 50, z, "smooth_quartz");
  }
}

// Mast on the penthouse.
if (has(16, 8)) {
  for (let y = 51; y <= 56; y++) put(16, y, 8, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
