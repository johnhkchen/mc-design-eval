import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343714";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 7;
const g = new Voxels([W, H, D]);

// Mid-century Taipei commercial block: two storeys over a shopfront,
// white terrazzo-tile facade with quartz piers, glazed bays, parapet and rooftop AC units.
const FLOOR1 = 5;   // first-floor slab
const ROOF = 9;     // roof deck (top surface at 10)
const PARAPET = 10; // parapet, top surface at 11

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const put = (x, y, z, id) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  g.set(x, y, z, id);
};

// Entrance: the front (low-z) cell nearest the middle of the frontage.
const front = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x).sort((a, b) => a - b);
const entranceX = front.length ? front[Math.floor(front.length / 2)] : -1;

for (const [x, z, grRaw] of cells) {
  const gg = clamp(Math.round(grRaw), 0, 4);
  const missX = !has(x - 1, z) || !has(x + 1, z);
  const missZ = !has(x, z - 1) || !has(x, z + 1);
  const perim = missX || missZ;

  // Foundation under every footprint cell.
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs and roof deck, air between (no interiors).
    put(x, gg, z, "smooth_quartz");
    put(x, FLOOR1, z, "smooth_quartz");
    put(x, ROOF, z, "light_gray_concrete");
    if ((x * 7 + z * 3) % 11 === 0) put(x, ROOF + 1, z, "iron_block"); // AC condenser
    continue;
  }

  // Facade along-axis index: bays run along the face the cell belongs to.
  const along = missZ ? x : z;
  const pier = along % 3 === 0;
  const isEntrance = missZ && z === 0 && x === entranceX;

  // Inward direction for glowing interior light behind the glass.
  let inX = 0, inZ = 0;
  if (missZ && !(!has(x, z - 1) && !has(x, z + 1))) inZ = !has(x, z - 1) ? 1 : -1;
  if (missX && !(!has(x - 1, z) && !has(x + 1, z))) inX = !has(x - 1, z) ? 1 : -1;

  for (let y = gg; y <= PARAPET; y++) {
    let b = null;
    if (y === gg) {
      b = "stone_bricks";                       // base course
    } else if (y <= 3) {
      if (isEntrance) b = null;                 // open doorway
      else b = pier ? "quartz_pillar" : "glass"; // shopfront glazing
    } else if (y === 4) {
      if (isEntrance) b = "dark_oak_planks";    // entrance lintel accent
      else b = pier ? "quartz_block" : "smooth_quartz";
    } else if (y === FLOOR1) {
      b = "smooth_quartz";                      // storey string course
    } else if (y >= 6 && y <= 8) {
      if (pier) b = "quartz_block";
      else if (y === 6 || y === 8) b = "polished_andesite"; // sill and head frames
      else b = "glass";                         // window glazing
    } else if (y === ROOF) {
      b = "smooth_quartz";                      // cornice
    } else if (y === PARAPET) {
      b = "quartz_block";                       // parapet cap
    }
    if (y === gg && isEntrance) b = "smooth_stone"; // threshold
    if (b) put(x, y, z, b);
  }

  // Floor slab inside the cell behind the facade.
  put(x, gg, z, "smooth_quartz");
  put(x, FLOOR1, z, "smooth_quartz");

  // Warm light behind some windows at dusk.
  if (!pier && !isEntrance && (inX || inZ) && (along % 6 === 2)) {
    const ix = x + inX, iz = z + inZ;
    if (has(ix, iz)) {
      const inPerim = !has(ix - 1, iz) || !has(ix + 1, iz) || !has(ix, iz - 1) || !has(ix, iz + 1);
      if (!inPerim) put(ix, 7, iz, "glowstone");
    }
  }

  // Roof edge: parapet already placed; add a little roof-top equipment on the back row.
  if (!missZ || (z === 6 && x % 8 === 4)) {
    // no extra
  }
}

// Rooftop AC units on the rear perimeter (within the 11-block height).
for (const [x, z] of cells) {
  if (!has(x, z + 1) && x % 6 === 1) put(x, PARAPET, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
