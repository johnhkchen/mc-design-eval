import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-era commercial block (c. 1980s): two storeys on a pale
// concrete frame, pillared window bays, shopfront base course, smooth-quartz
// cornice and parapet, one street entrance, and a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610209";
const W = 15, H = 23, D = 21;
const FLOOR_UPPER = 5;   // upper floor slab
const ROOF = 10;         // roof deck
const TOP = 11;          // parapet crest / roof record ~11 above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
  }
}
const inF = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) =>
  Object.keys(DIRS).filter((d) => {
    const [dx, dz] = DIRS[d];
    return !inF(x + dx, z + dz);
  });

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

// Pick the face a perimeter cell is drawn on and its along-wall coordinate.
function faceOf(ex, x, z) {
  const d = ex.find((f) => f === "N" || f === "S") ?? ex[0];
  const alongZ = d === "N" || d === "S";
  const t = alongZ ? x : z;
  const len = alongZ ? W : D;
  return { d, t, len, alongZ };
}

const paneProps = (alongZ) =>
  alongZ
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, z);
  const perim = ex.length > 0;

  // Foundation to the cell's own ground, then the ground-floor slab.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  put(x, G, z, "smooth_stone");
  if (FLOOR_UPPER > G) put(x, FLOOR_UPPER, z, "smooth_stone");

  if (!perim) {
    // Interior: air storeys, roof deck only.
    if (ROOF > G) put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  const { d, t, len, alongZ } = faceOf(ex, x, z);
  const [odx, odz] = DIRS[d];          // outward direction of this face
  const isDoorCol = d === "N" && x === 7;
  const pillar = t === 0 || t === len - 1 || t % 3 === 0;

  // Walls from the cell ground up to the cornice.
  for (let y = G + 1; y <= 9; y++) {
    if (isDoorCol && (y === G + 1 || y === G + 2)) {
      const half = y === G + 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoorCol && (y === G + 3 || y === G + 4)) {
      put(x, y, z, "smooth_quartz");   // entrance lintel over the door
      continue;
    }
    if (y === G + 1) { put(x, y, z, "polished_andesite"); continue; }   // base course
    if (y === 9) { put(x, y, z, "smooth_quartz"); continue; }          // cornice
    if (pillar) { put(x, y, z, "light_gray_concrete"); continue; }     // mullion
    const shopOrUpper = (y >= G + 2 && y <= 4) || (y >= 6 && y <= 8);
    if (shopOrUpper) {
      put(x, y, z, "glass_pane", paneProps(alongZ));
    } else {
      put(x, y, z, "white_concrete");                                  // storey line
    }
  }

  // Warm light behind some glass, in the air gap of the adjacent room.
  const ix = x - odx, iz = z - odz;   // inward neighbour
  if (inF(ix, iz) && exposed(ix, iz).length === 0 && !isDoorCol) {
    if (!pillar && t % 4 === 1 && 7 > G) put(ix, 7, iz, "glowstone");
    if (!pillar && t % 6 === 2 && G + 3 <= 4 && G + 3 > G) put(ix, G + 3, iz, "glowstone");
  }

  // Parapet: roof-edge course at ROOF, crenellated crest at TOP.
  if (ROOF > G) put(x, ROOF, z, "smooth_quartz");
  if (ROOF >= G && t % 2 === 0) put(x, TOP, z, "smooth_quartz");
}

// Roof deck over the rest of the footprint (interior cells handled above;
// cells whose ground is at or above the deck are left as-is).

// Rooftop water tank on the roof, stood on the deck cells.
const tankCells = [];
for (let x = 9; x <= 11; x++)
  for (let z = 8; z <= 10; z++) tankCells.push([x, z]);
for (const [x, z] of tankCells) {
  if (!inF(x, z) || gAt(x, z) >= ROOF) continue;
  for (let y = TOP; y <= TOP + 2; y++) put(x, y, z, "white_concrete");
  put(x, TOP + 3, z, "iron_block");
}

// Two small condenser units on the roof, away from the parapet.
for (const [x, z] of [[3, 9], [4, 9]]) {
  if (inF(x, z) && exposed(x, z).length === 0 && gAt(x, z) < ROOF) {
    put(x, TOP, z, "iron_block");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
