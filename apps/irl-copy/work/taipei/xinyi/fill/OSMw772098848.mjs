import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no tags. Lidar gives roof about 11 blocks above lowest ground.
// Reading: a two-storey (about 5 blocks per storey) mid-century-style commercial block,
// white concrete frame with tinted glazing, granite plinth, quartz cornice,
// and a rooftop penthouse with a lightning rod. Typical of older Xinyi street frontage.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098848";
const W = 16, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
let minG = Infinity;
for (const [x, z, gy] of cells) {
  gmap.set(key(x, z), gy);
  if (gy < minG) minG = gy;
}
const has = (x, z) => gmap.has(key(x, z));

// Levels relative to the lowest ground.
const CAP = minG + 10;   // top course of the building body (cornice / roof deck)
const ROOF = minG + 11;  // roof surface

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which outward faces a footprint cell exposes.
function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Front = exposed face with the most cells (tie: N, S, W, E order).
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const [x, z] of gmap.keys().map(k => k.split(",").map(Number))) {
  for (const f of facesOf(x, z)) faceCount[f]++;
}
const FRONT = ["N", "S", "W", "E"].reduce((best, f) => (faceCount[f] > faceCount[best] ? f : best), "N");

// Along-wall index: x for N/S faces, z for W/E faces.
const tOf = (x, z, face) => (face === "N" || face === "S" ? x : z);

// Door sits at the middle of the front face.
const frontTs = cells
  .filter(([x, z]) => facesOf(x, z).includes(FRONT))
  .map(([x, z]) => tOf(x, z, FRONT))
  .sort((a, b) => a - b);
const DOOR_T = frontTs.length ? frontTs[Math.floor(frontTs.length / 2)] : -1;

// Facade material for a perimeter body cell.
function facadeId(t, y, rel, gy, face) {
  if (y === gy && rel > 0) return "polished_granite";        // plinth course on sloped ground
  if (rel === 0) return "polished_granite";                  // base course
  if (rel === 10) return "quartz_block";                     // cornice / parapet
  if (rel === 4 || rel === 5 || rel === 9) return "white_concrete"; // storey lines
  const inWindowRow = (rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 8);
  if (!inWindowRow) return "white_concrete";
  const doorCol = face === FRONT && Math.abs(t - DOOR_T) <= 1;
  if (doorCol && rel === 3) return "white_concrete";        // lintel over door
  if (t % 3 === 0 || (doorCol && rel <= 2)) return "white_concrete"; // mullions / door frame
  // Warm light behind some upper glazing, staggered so it reads at dusk.
  const lit = (rel === 2 || rel === 7) && ((t * 5 + y * 3 + (face === "N" || face === "E" ? 1 : 0)) % 6 === 0);
  if (lit) return "glowstone";
  return "light_blue_stained_glass";
}

// 1) Foundation: solid from y 0 up to each cell's ground.
// 2) Body: perimeter facades, interior floor slabs, roof deck.
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy && y < H; y++) put(x, y, z, "granite");

  if (gy > CAP) continue; // ground above the roof: nothing above the foundation

  const faces = facesOf(x, z);
  const perimeter = faces.length > 0;
  const face = faces.includes(FRONT) ? FRONT : faces[0];
  const t = perimeter ? tOf(x, z, face) : -1;

  for (let y = gy; y <= CAP && y < H; y++) {
    const rel = y - minG;
    if (perimeter) {
      // Entrance: double door on the front face, lower half at rel 1-2.
      if (face === FRONT && t === DOOR_T && (rel === 1 || rel === 2)) {
        const half = rel === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: FRONT === "N" ? "north" : FRONT === "S" ? "south" : FRONT === "E" ? "east" : "west",
          half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      put(x, y, z, facadeId(t, y, rel, gy, face));
    } else {
      // Interior: only slabs at floor levels and a roof deck; air elsewhere.
      if (rel === 0 || rel === 5) put(x, y, z, "smooth_stone");
      else if (rel === 10) put(x, y, z, "light_gray_concrete");
    }
  }
}

// Rooftop penthouse (central block) and lightning rod.
for (const [x, z, gy] of cells) {
  if (gy > CAP) continue;
  if (x < 5 || x > 10 || z < 4 || z > 9) continue;
  const edge = x === 5 || x === 10 || z === 4 || z === 9;
  for (let y = ROOF; y <= ROOF + 2 && y < H; y++) {
    const rel = y - minG;
    if (rel === ROOF - minG + 2) {
      put(x, y, z, "light_gray_concrete"); // penthouse roof
    } else if (edge) {
      const lit = rel === ROOF - minG && (x + z) % 2 === 0;
      put(x, y, z, lit ? "light_blue_stained_glass" : "white_concrete");
    }
    // interior of penthouse left as air
  }
}

// Lightning rod on top of penthouse centre.
const rodY = ROOF + 3;
if (rodY < H) {
  put(7, rodY, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
