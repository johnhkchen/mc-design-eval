import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888737";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 8;
const g = new Voxels([W, H, D]);

// Footprint lookup
const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

// Lowest ground under the footprint: the level everything is referenced to.
const L = Math.min(...cells.map(c => c[2]));

// Record: about 11 blocks from lowest ground to roof. Two storeys of 5 blocks
// plus a 1-block parapet. Reads as a 1980s-90s Taipei commercial block:
// white tiled facade, ground-floor glazed shopfront, glass windows in
// white-concrete bays, stone base, cornice and parapet.
const ROOF_R = 10; // parapet top row relative to L (roof surface at L + 11)

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const doorProps = (half) => ({
  facing: "north",
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

// Facade block by row (r = y - L), pillar flag, and door flag.
function facadeBlock(r, pillar, isDoor, doorHalf) {
  if (r === 0) return ["stone_bricks"];                    // base course
  if (r >= 1 && r <= 3) {                                  // ground storey
    if (isDoor && r <= 2) return ["oak_door", doorProps(doorHalf)];
    if (pillar) return ["white_concrete"];
    return ["glass"];                                      // shopfront glazing
  }
  if (r === 4) return ["white_concrete"];                  // shopfront lintel
  if (r === 5) return ["white_concrete"];                  // storey line
  if (r === 6) return pillar ? ["white_concrete"] : ["light_gray_concrete"]; // spandrel
  if (r === 7 || r === 8) return pillar ? ["white_concrete"] : ["glass"];   // upper windows
  if (r === 9) return ["smooth_stone"];                    // cornice
  if (r === 10) return ["white_concrete"];                 // parapet
  return null;
}

// Pass 1: foundations, floor slabs, roof slab, and roof equipment for every cell.
for (const [x, z, gd] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gd; y++) set(x, y, z, "stone_bricks");

  // Floor slab at the storey line (L+5) and roof deck (L+9).
  if (L + 5 >= gd) set(x, L + 5, z, "smooth_stone");
  if (L + 9 >= gd) set(x, L + 9, z, "smooth_stone");
}

// Pass 2: facades, doors, lights, and roof plant.
for (const [x, z, gd] of cells) {
  const edgeN = !has(x, z - 1);
  const edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z);
  const edgeE = !has(x + 1, z);

  let face = null;
  if (edgeN) face = "N";
  else if (edgeS) face = "S";
  else if (edgeW) face = "W";
  else if (edgeE) face = "E";

  if (face) {
    // Position along the facade and whether this column is a pillar.
    const u = (face === "N" || face === "S") ? x : z;
    const pillar = (u % 3 === 0);
    // Main entrance: centre bay of the street (south/north) face.
    const isDoor = (face === "N" && z === 0 && x === 11);

    const yStart = Math.max(gd, L);
    for (let y = yStart; y <= L + ROOF_R; y++) {
      const r = y - L;
      const doorHalf = r === 1 ? "lower" : "upper";
      const spec = facadeBlock(r, pillar, isDoor && (r === 1 || r === 2), doorHalf);
      if (!spec) continue;
      if (spec.length === 2) set(x, y, z, spec[0], spec[1]);
      else set(x, y, z, spec[0]);
    }
  } else {
    // Interior cell: warm lamps behind upper windows, and roof plant.
    if (z === 2 && x % 6 === 4 && L + 7 >= gd) set(x, L + 7, z, "glowstone");
    if (z === 5 && x % 8 === 3 && L + 10 >= gd) set(x, L + 10, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
