import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020178";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// ---- footprint bookkeeping -------------------------------------------------
const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr] of cells) raw.set(key(x, z), Math.round(gr));
const B = Math.min(...raw.values());            // lowest ground under the building
const gnd = new Map();
for (const [k, v] of raw) gnd.set(k, v - B);     // ground relative to y 0
const has = (x, z) => gnd.has(key(x, z));
const G = (x, z) => gnd.get(key(x, z));

// Storey plan (absolute y, relative to lowest ground):
//  gg       base course (stone bricks), foundation below
//  1..3     shopfront / ground-storey glazing, 4 header band
//  5        floor line (storey 1 ceiling / storey 2 sill band)
//  6..8     upper storey glazing with piers
//  9        head band
//  10       roof deck (roof surface at 11)
//  11..13   roof plant and lightning rods
const ROOF_DECK = 10;
const FLOOR = 5;

const FACES = [
  { name: "n", dx: 0, dz: -1 },
  { name: "e", dx: 1, dz: 0 },
  { name: "s", dx: 0, dz: 1 },
  { name: "w", dx: -1, dz: 0 },
];

const exposedFaces = (x, z) => FACES.filter(f => !has(x + f.dx, z + f.dz));
const isPerimeter = (x, z) => exposedFaces(x, z).length > 0;

// Exposed-face census and along-face extents
const faceCount = { n: 0, e: 0, s: 0, w: 0 };
const faceRange = { n: { lo: Infinity, hi: -Infinity }, e: { lo: Infinity, hi: -Infinity },
                    s: { lo: Infinity, hi: -Infinity }, w: { lo: Infinity, hi: -Infinity } };
for (const [k] of gnd) {
  const [x, z] = k.split(",").map(Number);
  for (const f of exposedFaces(x, z)) {
    faceCount[f.name]++;
    const i = (f.name === "n" || f.name === "s") ? x : z;
    faceRange[f.name].lo = Math.min(faceRange[f.name].lo, i);
    faceRange[f.name].hi = Math.max(faceRange[f.name].hi, i);
  }
}
// Front (shopfront) face: the longest exposed face; ties go north, then east, south, west
let front = "n";
for (const n of ["e", "s", "w"]) if (faceCount[n] > faceCount[front]) front = n;
const frontRange = faceRange[front];
const doorI = Math.floor((frontRange.lo + frontRange.hi) / 2);

// ---- helpers ---------------------------------------------------------------
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const BASE = "stone_bricks";
const GLASS = "glass_pane";

// Block for a perimeter wall cell at height y on a given face, along-index i
function facadeBlock(face, i, y, isFront, lo) {
  const pier = ((i - lo) % 3 + 3) % 3 === 0;
  if (y === 4 || y === 5 || y === 9) return { id: BAND };
  if (y >= 1 && y <= 3) {
    if (isFront) {
      if (i === doorI) {
        if (y === 3) return { id: "lantern", props: { hanging: "true", waterlogged: "false" } };
        return { id: "dark_oak_planks" };
      }
      if ((i - frontRange.lo) % 4 === 0) return { id: BAND };
      return { id: GLASS };
    }
    return pier ? { id: BAND } : { id: GLASS };
  }
  if (y >= 6 && y <= 8) {
    return pier ? { id: BAND } : { id: GLASS, lit: { face, i } };
  }
  return { id: WALL };
}

// ---- build cells -----------------------------------------------------------
for (const [k, gg] of gnd) {
  const [x, z] = k.split(",").map(Number);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  // floor slab at the storey line (interior); perimeter gets the band
  if (gg <= FLOOR && !isPerimeter(x, z)) put(x, FLOOR, z, "smooth_stone");

  // roof deck
  if (gg <= ROOF_DECK) {
    put(x, ROOF_DECK, z, isPerimeter(x, z) ? BASE : "smooth_stone");
  }

  if (!isPerimeter(x, z)) continue;

  const faces = exposedFaces(x, z);
  const primary = faces[0];
  const isFront = primary.name === front;
  const i = (primary.name === "n" || primary.name === "s") ? x : z;
  const lo = faceRange[primary.name].lo;

  // perimeter walls: from ground up to the head band
  for (let y = gg; y <= 9; y++) {
    if (y === gg && gg <= 9) {
      put(x, y, z, BASE);                           // base course
      continue;
    }
    const b = facadeBlock(primary.name, i, y, isFront, lo);
    if (b.props) put(x, y, z, b.id, b.props);
    else put(x, y, z, b.id);
  }

  // warm light: glowstone inside behind some upper-storey glazing
  const interiorOK = (ix, iz) => has(ix, iz) && !isPerimeter(ix, iz) && G(ix, iz) <= FLOOR;
  for (let y = 6; y <= 8; y++) {
    const pier = ((i - lo) % 3 + 3) % 3 === 0;
    if (pier) continue;
    if (((x * 31 + z * 17 + y * 7 + i) % 4) !== 0) continue;
    const ix = x - primary.dx, iz = z - primary.dz;   // one step inward
    if (interiorOK(ix, iz)) put(ix, 6, iz, "glowstone");
    break;
  }
}

// ---- roof plant -------------------------------------------------------------
// Rooftop air-handling box on interior deck cells, with a short rod mast
const plant = [];
for (const [k, gg] of gnd) {
  const [x, z] = k.split(",").map(Number);
  if (gg > ROOF_DECK) continue;
  if (x >= 2 && x <= 5 && z >= 5 && z <= 9 && !isPerimeter(x, z)) plant.push([x, z]);
}
for (const [x, z] of plant) {
  put(x, 11, z, BAND);
  if (z === 5 || z === 9) put(x, 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}
if (plant.length) {
  const [mx, mz] = plant[Math.floor(plant.length / 2)];
  put(mx, 12, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(mx, 13, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
