// 370 Park Avenue, NYC individual landmark, Public Facilities & Institutions, built 1918. Read as a Classical institutional
// block of the 1910s: a granite base storey, a limestone-clad shaft in 3-block storeys, quoined-looking piers at every
// third column, and a crowning parapet. Footprint 18 x 56 (x across, low z = north). The long faces are east (x 17,
// the entrance, on the avenue) and west (x 0); the ends are north (z 0) and south (z 55).
// Massing: the lidar roof is median-smoothed over 3 x 3 and stepped to 21 / 24 / 30 / 33 blocks (7, 8, 10 and 11 storeys
// with the attic). A 2-block penthouse sits on the 30 roof at two spots. Every column is solid from y 0 to its tier, so
// nothing floats. Facade: a window bay is a 1-block pier and 2 window blocks; the window is recessed one block (air in
// front), with glass one block in, a 1-block air gap behind it, and a stone floor slab at each storey line. Warm glowstone
// sits behind some windows. Interior is air between the floor slabs (no rooms); the core is solid under the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035713.cells.json`, "utf8"));
const W = 18, L = 56, Y = 36;

// Lidar roof per cell; the footprint is a full 18 x 56 rectangle, so every cell is in the list.
const lidar = Array.from({ length: L }, () => Array(W).fill(0));
for (const [x, z, , roof] of cells) lidar[z][x] = roof;

// Median of the 3 x 3 neighbourhood that reads as roof (10 blocks or more); 28 where none does.
function smoothRoof(x, z) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const X = x + dx, Z = z + dz;
    if (X >= 0 && Z >= 0 && X < W && Z < L && lidar[Z][X] >= 10) v.push(lidar[Z][X]);
  }
  if (!v.length) return 28;
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
}
// Tiers are multiples of the 3-block storey: 21 (wings), 24, 30 (main shaft) and 33 (attic crown, where the lidar reads 34).
const tier = (s) => (s <= 23 ? 21 : s <= 27 ? 24 : s <= 32 ? 30 : 33);
const H = lidar.map((row, z) => row.map((_, x) => tier(smoothRoof(x, z))));

// Distance in cells from the nearest outside edge: 1 is the facade ring, 2 the wall behind it, 3 the air gap, 4 and up the core.
const depth = (x, z) => Math.min(x + 1, W - x, z + 1, L - z);

// Bays: on the east and west faces (along z) and on the north and south faces (along x), a window is 2 blocks wide
// with a pier at the bay's 3rd block. The bay grid keeps the corners and the ends solid.
const winEW = (z) => z >= 2 && z <= L - 3 && z % 3 !== 0;
const winNS = (x) => x >= 2 && x <= W - 3 && x % 3 !== 0;

// The entrance sits on the east face, centred on z 27: a granite portal 5 wide, two door blocks in the middle bay.
const inEntrance = (x, z, y) => x === W - 1 && z >= 25 && z <= 29 && y >= 1 && y <= 4;

// A facade window opening (air in front of the glass): the window rows of a storey, below the cornice.
function facadeWindow(x, z, y) {
  if (y % 3 === 0 || y >= H[z][x] - 1) return false;
  if (inEntrance(x, z, y)) return false;
  if ((x === 0 || x === W - 1) && winEW(z)) return true;
  if ((z === 0 || z === L - 1) && winNS(x)) return true;
  return false;
}

// Glass sits one block in, behind each facade window.
function glassAt(x, z, y) {
  if (y % 3 === 0 || y >= H[z][x]) return false;
  if (x === 1 && winEW(z)) return facadeWindow(0, z, y);
  if (x === W - 2 && winEW(z)) return facadeWindow(W - 1, z, y);
  if (z === 1 && winNS(x)) return facadeWindow(x, 0, y);
  if (z === L - 2 && winNS(x)) return facadeWindow(x, L - 1, y);
  return false;
}

// Warm lamps in about one window in eleven, on the rows that a lit glow sits behind the glass.
function litAt(x, z, y) {
  if (y % 3 !== 1) return false;
  const s = Math.floor(y / 3);
  let idx = -1, side = 0, facade = false;
  if (x === 2 && winEW(z)) { idx = z; side = 0; facade = facadeWindow(0, z, y); }
  else if (x === W - 3 && winEW(z)) { idx = z; side = 1; facade = facadeWindow(W - 1, z, y); }
  else if (z === 2 && winNS(x)) { idx = x; side = 2; facade = facadeWindow(x, 0, y); }
  else if (z === L - 3 && winNS(x)) { idx = x; side = 3; facade = facadeWindow(x, L - 1, y); }
  return facade && s >= 1 && (idx + 2 * s + side) % 11 === 0;
}

// Roof plant on the 30 roof: two small penthouses (2 blocks, the top one a slab).
const plant = (x, z) => H[z][x] === 30 &&
  ((x >= 4 && x <= 7 && z >= 36 && z <= 42) || (x >= 11 && x <= 14 && z >= 4 && z <= 7));

const g = new Voxels([W, Y, L]);

const GRANITE = "polished_granite", LIMESTONE = "calcite", STRING = "smooth_quartz", CORNICE = "chiseled_quartz_block";
const PARAPET = { block: "smooth_quartz_slab", state: { type: "bottom", waterlogged: "false" } };
const PIER = { block: "quartz_pillar", state: { axis: "y" } };
const FLOOR = "stone_bricks", ROOF = "smooth_stone", CORE = "stone", LAMP = "glowstone";

const put = (x, z, y, b, state) => (typeof b === "object" ? g.set(x, y, z, b.block, b.state) : g.set(x, y, z, b, state));

for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const h = H[z][x], d = depth(x, z);
  // Penthouses on the 30 roof, and the parapet capping the facade ring.
  if (plant(x, z)) { put(x, z, h, LIMESTONE); put(x, z, h + 1, PARAPET); }
  if (d === 1) put(x, z, h, PARAPET);

  for (let y = 0; y < h; y++) {
    if (d === 1) {
      if (inEntrance(x, z, y)) {
        if (z === 27 && y <= 2) {
          const door = { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
          put(x, z, y, "dark_oak_door", door);
        } else if ((z === 26 || z === 28) && y <= 2) { /* the doorway: air beside the door */ }
        else put(x, z, y, GRANITE);
        continue;
      }
      if (facadeWindow(x, z, y)) continue;   // the recessed window: air in front of the glass
      if (y === h - 1) { put(x, z, y, CORNICE); continue; }
      if (y < 3) { put(x, z, y, GRANITE); continue; }
      const pier = (x === 0 || x === W - 1) ? !winEW(z) : !winNS(x);
      if (pier) put(x, z, y, PIER);
      else if (y % 3 === 0) put(x, z, y, STRING);
      else put(x, z, y, LIMESTONE);
    } else if (d === 2) {
      if (glassAt(x, z, y)) {
        const ew = x === 1 || x === W - 2;   // the pane runs along the face
        put(x, z, y, "glass_pane", ew
          ? { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" }
          : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
      } else if (y < 3) put(x, z, y, GRANITE);
      else if (y % 3 === 0) put(x, z, y, STRING);
      else put(x, z, y, LIMESTONE);
    } else if (d === 3) {
      if (y === h - 1) put(x, z, y, ROOF);
      else if (y % 3 === 0) put(x, z, y, FLOOR);
      else if (litAt(x, z, y)) put(x, z, y, LAMP);
      // else air: the gap behind the glass
    } else {
      put(x, z, y, y === h - 1 ? ROOF : CORE);
    }
  }
}

const out = `${DIR}/NYC1035713.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, palette ${info.palette}`);
