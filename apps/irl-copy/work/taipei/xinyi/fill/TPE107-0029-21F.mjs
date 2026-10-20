import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE107-0029, Xinyi district, built 2018. Footprint 13 x 30 blocks, roof about
// 102 blocks above the lowest ground. A 20-storey glass-and-white-concrete
// office/residential tower: 5 blocks per storey, white spandrels and piers,
// light-blue glazing, a shopfront base with a framed recessed entrance on the
// south face, a parapet, and a small roof plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE107-0029-21F";
const W = 13, D = 30, H = 114;
const STOREY = 5;
const STOREYS = 20;
const ROOF_HEIGHT = 102;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Map footprint: key "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, gy)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Lowest ground under the building is the base line for storeys and roof.
let B = Infinity;
for (const gy of ground.values()) B = Math.min(B, gy);
if (!Number.isFinite(B)) B = 0;

const ROOF_TOP = B + ROOF_HEIGHT - 1; // highest block index of the roof
if (ROOF_TOP >= H) throw new Error(`Roof index ${ROOF_TOP} exceeds height ${H}`);

const g = new Voxels([W, H, D]);

const CONCRETE_FOUNDATION = "stone_bricks";
const BASE_COURSE = "stone_bricks";
const SLAB = "light_gray_concrete";
const FRAME = "white_concrete";
const GLASS = "light_blue_stained_glass";
const SHOP_GLASS = "cyan_stained_glass";
const LIGHT = "glowstone";
const PLANT = "light_gray_concrete";
const DOOR_BACK = "dark_oak_planks";

// Entrance: south face, k = 0, x in 5..7 (opening at x 6, jambs at 5 and 7).
const ENTRANCE_X0 = 5, ENTRANCE_X1 = 7;

for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);

  const westFace = !has(x - 1, z);
  const eastFace = !has(x + 1, z);
  const northFace = !has(x, z - 1);
  const southFace = !has(x, z + 1);
  const edge = westFace || eastFace || northFace || southFace;
  const corner = (westFace || eastFace) && (northFace || southFace);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, CONCRETE_FOUNDATION);

  // Body: from this cell's ground up to the roof.
  for (let y = gy; y <= ROOF_TOP; y++) {
    const rel = y - B;
    if (rel < 0) continue;
    const k = Math.floor(rel / STOREY);
    const r = rel % STOREY;

    // Roof level (above the last storey).
    if (k >= STOREYS) {
      if (edge) {
        g.set(x, y, z, FRAME); // parapet
      } else if (rel === STOREYS * STOREY) {
        g.set(x, y, z, SLAB); // roof deck
      } else if (
        rel === STOREYS * STOREY + 1 &&
        x >= 4 && x <= 8 && z >= 11 && z <= 18
      ) {
        g.set(x, y, z, PLANT); // roof plant box
      }
      continue;
    }

    if (!edge) {
      // Interior: floor slab per storey, otherwise air.
      if (r === 0) g.set(x, y, z, SLAB);
      continue;
    }

    // Facade cell.
    if (k === 0 && r === 0) {
      g.set(x, y, z, BASE_COURSE); // dark base course at street level
      continue;
    }
    if (r === 0) {
      g.set(x, y, z, FRAME); // floor line / spandrel
      continue;
    }
    if (r === 4) {
      g.set(x, y, z, SLAB); // head band under the next floor line
      continue;
    }

    // Ground-floor entrance on the south face.
    const inEntrance = k === 0 && southFace && !corner && x >= ENTRANCE_X0 && x <= ENTRANCE_X1;
    if (inEntrance) {
      if (r === 3) {
        g.set(x, y, z, FRAME); // lintel
      } else if (x === ENTRANCE_X0 || x === ENTRANCE_X1) {
        g.set(x, y, z, FRAME); // jambs framing the doorway
      }
      // Centre opening (x 6, r 1..2) left as air; back wall added below.
      continue;
    }

    // Pier vs glazing along the face.
    let pier;
    if (corner) pier = true;
    else if (westFace || eastFace) pier = z % 3 === 0;
    else pier = x % 3 === 0;

    if (pier) {
      g.set(x, y, z, FRAME);
      continue;
    }

    g.set(x, y, z, k === 0 ? SHOP_GLASS : GLASS);

    // Warm light behind some glazed bays, on the interior cell next to the glass.
    if (k >= 1 && r === 2 && ((k * 7 + x + z) % 5 === 0)) {
      let ix = x, iz = z;
      if (westFace) ix = x + 1;
      else if (eastFace) ix = x - 1;
      else if (northFace) iz = z + 1;
      else if (southFace) iz = z - 1;
      const inside = has(ix, iz) && !isEdge(ix, iz);
      if (inside && y >= (ground.get(`${ix},${iz}`) ?? 0)) {
        g.set(ix, y, iz, LIGHT);
      }
    }
  }
}

// Doorway back wall and warm light, so the opening reads as an entrance.
{
  const z = D - 1; // south face row
  const zIn = D - 2; // interior row behind the doorway
  const gDoor = ground.get(`${6},${z}`);
  if (gDoor !== undefined) {
    for (let r = 1; r <= 2; r++) {
      const y = B + r;
      if (y >= gDoor && has(6, zIn) && !isEdge(6, zIn)) {
        g.set(6, y, zIn, r === 1 ? LIGHT : DOOR_BACK);
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
