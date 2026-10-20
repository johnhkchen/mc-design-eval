import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE90-0126-13F";
const W = 39, H = 76, D = 22;
const ROOF_Y = 64;      // roof slab level, about 64 above lowest ground
const PARAPET_Y = 65;   // parapet course on the roof edge

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint helpers -------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(key(x, z), gy);
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

// exposed faces of a footprint cell
const exposedX = (x, z) => !has(x + 1, z) || !has(x - 1, z);
const exposedZ = (x, z) => !has(x, z + 1) || !has(x, z - 1);
const perim = (x, z) => has(x, z) && (exposedX(x, z) || exposedZ(x, z));
const nearPerim = (x, z) =>
  perim(x + 1, z) || perim(x - 1, z) || perim(x, z + 1) || perim(x, z - 1);
const inner = (x, z) => has(x, z) && !perim(x, z) && nearPerim(x, z);

function put(x, y, z, name, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

// ---- build each footprint column --------------------------------------
for (const [x, z, gy] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const isPerim = perim(x, z);
  const cornerCell = exposedX(x, z) && exposedZ(x, z);
  const alongX = exposedZ(x, z);            // z-facing face: mullions by x
  const along = alongX ? x : z;
  const frontDoor = isPerim && z === 0 && exposedZ(x, z);

  for (let y = gy; y < ROOF_Y; y++) {
    const rel = y - gy;
    const floorLine = y % 5 === 4;

    if (floorLine) {
      // storey line: spandrel on the facade, slab inside
      put(x, y, z, isPerim ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    if (isPerim) {
      if (cornerCell) {
        put(x, y, z, "white_concrete");
        continue;
      }
      if (y < 4 && rel < 4) {
        // shopfront band
        if (frontDoor && x === 19) {
          if (rel === 0) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (rel === 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "glass");
          continue;
        }
        if (along % 3 === 0) put(x, y, z, "polished_granite");
        else put(x, y, z, "glass");
        continue;
      }
      // curtain wall: green-tinted glazing with light grey mullions
      if (along % 3 === 0) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "cyan_stained_glass");
    } else {
      // interior: warm lights set behind the glass, otherwise air
      if (inner(x, z) && y % 5 === 2 && along % 6 === 2 && y < 58) {
        put(x, y, z, "glowstone");
      }
    }
  }

  // entrance canopy: slab over the doorway, on the footprint
  if (frontDoor && x >= 17 && x <= 21) {
    const cy = gy + 3;
    if (cy < ROOF_Y && cy % 5 !== 4) put(x, cy, z, "stone_brick_slab", { type: "top" });
  }

  // roof slab and parapet
  put(x, ROOF_Y, z, "light_gray_concrete");
  if (isPerim) put(x, PARAPET_Y, z, "white_concrete");
}

// ---- roof plant: penthouse core with a glazed band and a lightning rod --
for (let x = 14; x <= 24; x++) {
  for (let z = 7; z <= 14; z++) {
    if (!has(x, z)) continue;
    const edge = x === 14 || x === 24 || z === 7 || z === 14;
    for (let y = PARAPET_Y; y <= 68; y++) {
      if (!edge) {
        // solid plant room interior
        put(x, y, z, "white_concrete");
      } else if (y === 66 || y === 67) {
        put(x, y, z, "cyan_stained_glass");
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }
}
// antenna mast on the penthouse centre
if (has(19, 10)) {
  put(19, 69, 10, "lightning_rod");
  put(19, 70, 10, "lightning_rod");
  put(19, 71, 10, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
