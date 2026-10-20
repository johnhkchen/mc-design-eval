import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608947";
const W = 22, H = 23, D = 16;

// ---- footprint ------------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(`${x},${z}`, Math.max(0, Math.min(H - 14, Math.round(gr))));
}
const has = (x, z) => cells.has(`${x},${z}`);
const groundOf = (x, z) => cells.get(`${x},${z}`);
const B = cells.size ? Math.min(...cells.values()) : 0; // lowest ground = y 0 of the record

// Lidar record: roof about 11 above lowest ground. Two storeys of ~5 blocks
// (B..B+4, B+6..B+9), a stone floor line at B+5, roof deck B+10, parapet B+11.
const LINE = B + 5, DECK = B + 10, PARAPET = B + 11;
const SHOP_TOP = B + 4;              // sign band over the ground floor
const WIN1 = [B + 1, B + 3];         // ground-floor glazing rows
const WIN2 = [B + 7, B + 8];         // upper glazing rows

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const inRange = (v, [a, b]) => v >= a && v <= b;

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const outFaces = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Front = south (+z) side when present, otherwise none.
let frontZ = -1;
for (let z = 0; z < D; z++) if (has(10, z)) frontZ = z;
const doorX = 10;
const doorOnFront = frontZ >= 0 && !has(doorX, frontZ + 1);

// ---- pass 1: foundation, walls, floors, roof ------------------------------
for (const [key, gc] of cells) {
  const [x, z] = key.split(",").map(Number);

  // foundation under every footprint cell, up to its own ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  if (perim(x, z)) {
    const faces = outFaces(x, z);
    const face = faces[0];
    const idx = face.dz !== 0 ? x : z;          // position along the facade
    const isPier = idx % 3 === 0;                // piers every third block
    const isFront = face.name === "south" && z === frontZ;

    for (let y = gc; y <= PARAPET; y++) {
      if (y === PARAPET) { put(x, y, z, "white_concrete"); continue; }   // parapet
      if (y === DECK || y === LINE) { put(x, y, z, "smooth_stone"); continue; } // cornice / storey line
      if (y === gc) { put(x, y, z, "polished_andesite"); continue; }      // base course
      if (isFront && y === SHOP_TOP) { put(x, y, z, "red_terracotta"); continue; } // sign band
      const glazed = (inRange(y, WIN1) || inRange(y, WIN2)) && !isPier;
      if (glazed) {
        const shop = isFront && inRange(y, WIN1);
        put(x, y, z, shop ? "light_blue_stained_glass" : "light_gray_stained_glass");
        continue;
      }
      put(x, y, z, "white_concrete");
    }
  } else {
    // interior: floor slabs only, air above
    for (const y of [LINE, DECK]) if (y >= gc) put(x, y, z, "light_gray_concrete");
  }
}

// ---- pass 2: entrance -----------------------------------------------------
if (doorOnFront) {
  const dgc = groundOf(doorX, frontZ);
  put(doorX, dgc, frontZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, dgc + 1, frontZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// ---- pass 3: warm lights behind some glazing (interior air cells) ---------
for (const [key, gc] of cells) {
  const [x, z] = key.split(",").map(Number);
  if (!perim(x, z)) continue;
  const face = outFaces(x, z)[0];
  const idx = face.dz !== 0 ? x : z;
  if (idx % 3 === 0 || idx % 6 !== 1) continue;
  if (doorOnFront && x === doorX && z === frontZ) continue;
  const ix = x - face.dx, iz = z - face.dz;
  if (!has(ix, iz) || perim(ix, iz)) continue;
  const igc = groundOf(ix, iz);
  if (B + 2 >= igc) put(ix, B + 2, iz, "shroomlight");   // storey 1, behind glass
  if (B + 8 >= igc) put(ix, B + 8, iz, "glowstone");     // storey 2, behind glass
}

// ---- pass 4: roof equipment (sits on the roof deck) -----------------------
const boxFits = (x0, x1, z0, z1) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (!has(x, z)) return false;
  return true;
};
const box = (x0, x1, z0, z1, y0, y1, id) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
    for (let y = y0; y <= y1; y++) put(x, y, z, id);
};

// water tank, centred on an interior 3x3
const tx = 7, tz = 8;
if (boxFits(tx - 1, tx + 1, tz - 1, tz + 1)) {
  box(tx - 1, tx + 1, tz - 1, tz + 1, DECK + 1, DECK + 2, "iron_block");
  box(tx - 1, tx + 1, tz - 1, tz + 1, DECK + 3, DECK + 3, "smooth_stone");
}
// stair / lift bulkhead near the back
if (boxFits(15, 16, 2, 3)) {
  box(15, 16, 2, 3, DECK + 1, DECK + 3, "white_concrete");
  box(15, 16, 2, 3, DECK + 4, DECK + 4, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
