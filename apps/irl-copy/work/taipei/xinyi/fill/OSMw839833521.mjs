import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833521";
const W = 18, D = 12, H = 23;
const ROOF_TOP = 11;      // parapet top, about 11 blocks above lowest ground
const FLOOR_2 = 5;        // storey line between the two storeys
const DECK = 10;          // roof deck / storey-2 ceiling

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`);

// Facade helpers
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which outward faces does a footprint cell expose?
function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Facade block for a perimeter cell at height y. Returns [id, props] or null (air).
function facadeBlock(face, s, L, y, G, corner) {
  const pier = corner || s === 0 || s === L - 1 || s % 3 === 0;
  const pane = (face === "N" || face === "S") ? PANE_NS : PANE_EW;

  // Plinth
  if (y === G) return ["stone_bricks"];

  // Ground storey: shopfront glass, piers, entrance on north face
  if (y > G && y <= G + 3) {
    if (face === "N" && s === 8) {
      if (y === G + 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === G + 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      return ["glass_pane", PANE_NS]; // transom above door
    }
    if (pier) return ["white_concrete"];
    return ["glass_pane", pane];
  }

  // Ground-storey lintel
  if (y === G + 4) return ["smooth_quartz"];

  // Upper storey, absolute storey lines
  if (y > 11) return null;
  if (y === FLOOR_2) return ["red_terracotta"];         // string course
  if (y === 6 || y === 9) return pier ? ["white_concrete"] : ["smooth_quartz"];   // sill / head
  if (y === 7 || y === 8) return pier ? ["white_concrete"] : ["glass_pane", pane];
  if (y === DECK) return ["smooth_quartz"];              // cornice
  if (y === ROOF_TOP) return ["white_concrete"];         // parapet
  return null;
}

// ---- Build ----
for (const [x, z, G] of cells) {
  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "gray_concrete");

  const faces = facesOf(x, z);
  const perimeter = faces.length > 0;
  const corner = faces.length > 1;

  if (!perimeter) {
    // Interior: floor slabs and roof deck only, air between
    put(x, G, z, "light_gray_concrete");
    if (G < FLOOR_2) put(x, FLOOR_2, z, "light_gray_concrete");
    if (G <= DECK) put(x, DECK, z, "light_gray_concrete");
    continue;
  }

  // Perimeter: walls on every exposed face (corners treated as piers)
  const face = faces[0];
  const s = (face === "N" || face === "S") ? x : z;
  const L = (face === "N" || face === "S") ? W : D;

  for (let y = G; y <= ROOF_TOP; y++) {
    const blk = corner
      ? (y === G ? ["stone_bricks"]
        : (y === FLOOR_2 ? ["red_terracotta"]
          : (y === DECK ? ["smooth_quartz"]
            : (y === ROOF_TOP || (y > G && y <= 9) ? ["white_concrete"] : null))))
      : facadeBlock(face, s, L, y, G, false);
    if (blk) put(x, y, z, blk[0], blk[1]);
  }
  // Floor slab under storey 2 inside the perimeter (keeps the upper floor supported)
  if (G < FLOOR_2) put(x, FLOOR_2, z, "light_gray_concrete");
}

// Roof-top plant box, sits on the deck, inside the parapet
for (let x = 3; x <= 5; x++) for (let z = 4; z <= 7; z++) {
  if (has(x, z) && groundOf(x, z) <= DECK && facesOf(x, z).length === 0) {
    put(x, ROOF_TOP, z, "light_gray_concrete");
  }
}

// Warm lights behind glass: upper storey on north and south faces
for (const s of [2, 5, 13, 16]) {
  if (has(s, 1) && facesOf(s, 1).length === 0) put(s, 7, 1, "glowstone");
}
for (const s of [4, 10, 13]) {
  if (has(s, D - 2) && facesOf(s, D - 2).length === 0) put(s, 7, D - 2, "shroomlight");
}
// Shopfront interior lights on north face
for (const s of [4, 12]) {
  const G = groundOf(s, 1);
  if (G !== undefined && facesOf(s, 1).length === 0) put(s, G + 2, 1, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
