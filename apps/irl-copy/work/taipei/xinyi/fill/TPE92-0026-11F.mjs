import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0026-11F";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 48, H = 66, D = 18;
const ROOF_SLAB = 50;   // top occupied slab, storeys run 0..49 (10 storeys x 5)
const TOP = 53;         // parapet cap, roof about 54 above lowest ground
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// perimeter shell: a footprint cell with any side open to air
const perim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
// corner column: open on one x side and one z side
const corner = (x, z) => (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));
// second ring: inside the shell, touching it (air gap behind glazing)
const ring2 = (x, z) => {
  if (perim(x, z)) return false;
  return (perim(x + 1, z) && has(x + 1, z)) || (perim(x - 1, z) && has(x - 1, z)) ||
         (perim(x, z + 1) && has(x, z + 1)) || (perim(x, z - 1) && has(x, z - 1));
};
// rooftop plant box, central, inside the parapet
const inPlant = (x, z) => x >= 14 && x <= 33 && z >= 5 && z <= 12;
// street-face entrance bay (min z face), wider lobby opening
const inEntrance = (x, z) => z === 0 && x >= 21 && x <= 26;

function pick(x, y, z, gr) {
  const isP = perim(x, z);
  const isC = corner(x, z);
  const s = Math.floor(y / 5);
  const r = y % 5;

  // foundation: solid from y 0 up to this cell's ground
  if (y < gr) return "light_gray_concrete";

  // roof level: parapet with stepped cornice, plant box
  if (y > ROOF_SLAB) {
    if (isP) {
      if (y === TOP) return isC ? "quartz_block" : "smooth_quartz";
      return "white_concrete";
    }
    if (inPlant(x, z) && y <= TOP - 1) return "light_gray_concrete";
    if (inPlant(x, z) && y === TOP) return "quartz_slab";
    return null;
  }

  // floor slabs at every storey line (roof slab at y 50 included)
  if (r === 0) return isP ? "smooth_quartz" : "white_concrete";

  if (isP) {
    // ground storey entrance: open lobby with quartz surround and transom
    if (s === 0 && inEntrance(x, z)) {
      if (r === 4) return "quartz_block";
      if (x === 21 || x === 26) return "quartz_block";
      if (r === 1) return "quartz_slab";
      return null; // open doorway
    }
    // ground storey shopfront transom band
    if (s === 0 && r === 4) return "quartz_block";
    if (isC) return "quartz_block";
    if (r === 1) return "white_concrete";                // spandrel / sill
    if ((x + z) % 3 === 0) return "light_gray_concrete"; // mullion
    return "cyan_stained_glass";                         // glazing
  }

  // interior: structural columns on a grid
  if (x % 8 === 4 && z % 6 === 3) return "light_gray_concrete";

  // warm lights just behind the glazing, some windows only
  if (ring2(x, z) && r === 2 && (x + z + s) % 4 === 0) return "glowstone";

  // lanterns lighting the entrance lobby
  if (s === 0 && z === 2 && (x === 22 || x === 25) && r === 3) return "lantern";
  if (s === 0 && z === 1 && (x === 23 || x === 24) && r === 1) return "shroomlight";

  return null; // air gap
}

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(TOP, Math.round(gr0)));
  for (let y = 0; y <= TOP; y++) {
    const id = pick(x, y, z, gr);
    if (id) g.set(x, y, z, id);
  }
}

g.save(`${DIR}/${ID}.nbt`);
