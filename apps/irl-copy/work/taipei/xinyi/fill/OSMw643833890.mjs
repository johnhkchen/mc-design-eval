import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643833890";
const W = 47, H = 24, D = 17;
const ROOF = 12;   // parapet course (roof ~12 blocks above lowest ground)
const DECK = 11;   // top of third storey / roof slab
const CLAMP_G = (v) => Math.max(0, Math.min(ROOF - 1, v | 0));

// ---- footprint -------------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, CLAMP_G(gr ?? 0));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`) ?? 0;

const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// perimeter info per cell: list of missing neighbours
const perim = new Map();
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const missing = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  perim.set(key, missing);
}
const isPerim = (x, z) => (perim.get(`${x},${z}`) ?? []).length > 0;

// ---- volume ------------------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// facade block for a perimeter cell, given outward face and position along it
function facade(y, coord, face, x, z) {
  if (y === ROOF) return { block: "white_concrete" };          // parapet
  if (y === DECK) return { block: "smooth_stone" };            // roof-edge cornice

  if (y < 4) {                                                 // ground storey: shopfront
    if (y === 0) return { block: "polished_andesite" };        // base course
    if (y === 3) return { block: coord % 4 === 0 ? "light_gray_concrete" : "red_concrete" }; // fascia
    if (coord % 12 === 6) {                                    // entrance door
      return {
        block: "oak_door",
        props: {
          facing: face,
          half: y === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        },
        door: true,
      };
    }
    if (coord % 4 === 0) return { block: "light_gray_concrete" };
    return { block: "glass" };
  }

  // upper storeys
  const b = y >= 8 ? 8 : 4;
  const r = y - b;
  if (r === 0) return { block: "smooth_stone" };               // floor band
  if (r === 3) return { block: "white_concrete" };             // lintel / spandrel
  if (coord % 3 === 0) return { block: "light_gray_concrete" }; // pilaster
  return { block: "glass", window: true };                     // glazing
}

const lightCandidates = [];

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const missing = perim.get(key);

  if (missing.length === 0) {
    // interior: floor slabs and roof deck only, air elsewhere (no interiors)
    for (let y = gr; y <= DECK; y++) {
      if (y === 4 || y === 8 || y === DECK) put(x, y, z, "light_gray_concrete");
    }
    // roof equipment: small plant units standing on the deck
    if (x % 12 === 5 && z % 8 === 4) {
      put(x, DECK + 1, z, "light_gray_concrete");
      put(x, DECK + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // perimeter shell (1 block thick), facade on the first missing face
  const [dx, dz, face] = missing[0];
  const along = dx !== 0 ? z : x; // coordinate running along the face
  for (let y = gr; y <= ROOF; y++) {
    const f = facade(y, along, face, x, z);
    put(x, y, z, f.block, f.props);
    if (f.window && y >= 1 && y !== DECK) {
      // candidate glowing light behind glass, inside the building
      lightCandidates.push({ x, y, z, ix: x - dx, iz: z - dz });
    }
  }
}

// warm lights behind some windows (only into the open interior)
for (const c of lightCandidates) {
  if (!has(c.ix, c.iz) || isPerim(c.ix, c.iz)) continue;
  if (c.y < gAt(c.ix, c.iz)) continue;
  if ((c.x * 3 + c.z * 5 + c.y) % 4 !== 0) continue;
  put(c.ix, c.y, c.iz, "glowstone");
}

// the roof terrace parapet is continuous; the roof slab sits under the deck band
g.save(`${DIR}/${ID}.nbt`);
