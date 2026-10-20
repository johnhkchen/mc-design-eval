import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw827011436";
const cells = JSON.parse(readFileSync(`${base}.cells.json`, "utf8"));

// Footprint 22 x 16. Mid-1980s Taipei commercial-office block: reinforced concrete
// frame, white tiled/precast facade with light-grey floor bands, glazed bays between
// piers, shopfront and double entrance on the south face, five storeys (5 blocks each),
// plain parapet, mechanical penthouse and a small mast. Roof at y=26 above lowest ground.
const W = 22, H = 38, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minX = Infinity, minZ = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  minX = Math.min(minX, x);
  minZ = Math.min(minZ, z);
}
const inFp = (x, z) => ground.has(key(x, z));
const perim = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

const TOP_FLOOR = 25;   // roof slab band
const PARAPET_LO = 26;  // cornice
const PARAPET_HI = 27;  // parapet cap

for (const [x, z, gr] of cells) {
  const isP = perim(x, z);
  const fn = !inFp(x, z - 1);
  const fs = !inFp(x, z + 1);
  const fw = !inFp(x - 1, z);
  const fe = !inFp(x + 1, z);
  const ns = fn || fs;
  const corner = ns && (fw || fe);
  const idx = ns ? x - minX : z - minZ;
  // inward direction (toward the building interior) for lamps behind glass
  const dz = fn ? 1 : fs ? -1 : 0;
  const dx = fw ? 1 : fe ? -1 : 0;

  for (let y = 0; y <= 33; y++) {
    // foundation: solid from y 0 up to this cell's ground
    if (y < gr) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    if (!isP) {
      // interior: floor slabs only, air otherwise (no interiors)
      if (y <= TOP_FLOOR && y % 5 === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (y === PARAPET_LO) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (y === PARAPET_HI) { g.set(x, y, z, "white_concrete"); continue; }
    if (y > PARAPET_HI) continue;

    const r = y % 5;
    const k = Math.floor(y / 5);

    if (corner) {
      g.set(x, y, z, r === 0 ? "light_gray_concrete" : "white_concrete");
      continue;
    }
    if (r === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (r === 4) { g.set(x, y, z, "white_concrete"); continue; }

    // south-face double entrance at the centre bays, ground storey only
    if (k === 0 && fs && (idx === 10 || idx === 11)) {
      if (r === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }
      // r === 1 or 2: door
      const hinge = idx === 10 ? "left" : "right";
      g.set(x, y, z, "dark_oak_door", {
        facing: "south", half: y % 5 === 1 ? "lower" : "upper",
        hinge, open: "false", powered: "false",
      });
      continue;
    }

    // piers between bays
    if (idx % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }

    // glazed bay: pane connects to neighbouring facade cells
    const conn = (ddx, ddz) => (inFp(x + ddx, z + ddz) && perim(x + ddx, z + ddz) ? "true" : "false");
    g.set(x, y, z, "light_blue_stained_glass_pane", {
      north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0),
      waterlogged: "false",
    });

    // warm lamps standing behind some windows (air gap otherwise)
    const lit = r === 2 && k >= 1 && ((idx + 2 * k) % 6 === 4);
    if (lit && (dx !== 0 || dz !== 0)) {
      const tx = x + dx, tz = z + dz;
      if (inFp(tx, tz) && !perim(tx, tz) && (ground.get(key(tx, tz)) ?? 0) <= y) {
        g.set(tx, y, tz, "glowstone");
      }
    }
  }
}

// Mechanical penthouse on the roof, set well inside the footprint
for (let x = 7; x <= 14; x++) {
  for (let z = 5; z <= 10; z++) {
    if (!inFp(x, z)) continue;
    for (let y = 26; y <= 28; y++) {
      const ring = x === 7 || x === 14 || z === 5 || z === 10;
      if (ring) g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, 29, z, "white_concrete");
  }
}

// Small mast on the penthouse cap
if (inFp(10, 7)) {
  for (let y = 30; y <= 32; y++) g.set(10, y, 7, "iron_bars");
  g.set(10, 33, 7, "lightning_rod");
}

g.save(`${base}.nbt`);
