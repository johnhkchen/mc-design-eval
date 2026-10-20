import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0136-7F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 47, D = 11;
const g = new Voxels([W, H, D]);

// Built 2006, roughly 35 blocks to the roof (about 7 storeys of 5 blocks):
// a mid-rise commercial/office block in reinforced concrete with a granite
// base, white concrete piers, grey spandrels and blue-green glazing.
const STOREY = 5;
const ROOF = 35;        // roof deck level, relative to lowest ground
const y0 = Math.min(...cells.map((c) => c[2]));

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

// Entrance: the middle of the south-exposed cells (the street-facing side).
const southCells = cells
  .filter(([x, z]) => !has(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
const doorCell = southCells.length
  ? southCells[Math.floor(southCells.length / 2)]
  : [Math.floor((minX + maxX) / 2), maxZ];
const [doorX, doorZ] = doorCell;

const isExterior = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Facade block for one exterior cell at height rel (relative to y0).
// Piers are full white concrete; office windows are thin panes, so the
// piers stand proud of the glass and the facade has real relief.
function facadeBlock(rel, u, face, corner, x, z) {
  const s = Math.floor(rel / STOREY);
  const k = rel % STOREY;
  const pierEvery = s === 0 ? 4 : 3;
  const isPier = corner || u % pierEvery === 0;
  const isDoorCell = face === "S" && x === doorX && z === doorZ;

  if (s === 0) {
    if (k === 0) return ["polished_granite"];
    if (isDoorCell) {
      if (k === 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (k === 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (k === 3) return ["light_gray_concrete"]; // lintel over the door
      return ["light_gray_concrete"];              // k === 4 storey line
    }
    if (k === 4) return ["light_gray_concrete"];
    if (isPier) return ["white_concrete"];
    return ["light_blue_stained_glass"];            // shopfront glass
  }
  if (k === 0) return ["light_gray_concrete"];      // spandrel
  if (k === 4) return ["white_concrete"];           // storey line / cornice
  if (isPier) return ["white_concrete"];
  if (k === 2 && (u + s * 2) % 7 === 1) return ["glowstone"]; // lit office
  return ["light_blue_stained_glass_pane"];         // recessed office window
}

for (const [x, z, gr] of cells) {
  const ext = isExterior(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  let face = null;
  if (ext) {
    if (!has(x, z + 1)) face = "S";
    else if (!has(x, z - 1)) face = "N";
    else if (!has(x + 1, z)) face = "E";
    else face = "W";
  }
  const u = face === "S" || face === "N" ? x : z;
  const missing = [!has(x - 1, z), !has(x + 1, z), !has(x, z - 1), !has(x, z + 1)].filter(Boolean).length;
  const corner = ext && missing >= 2;

  for (let rel = 0; rel <= ROOF; rel++) {
    const y = y0 + rel;
    if (y < gr) continue;
    if (rel === ROOF) {
      put(x, y, z, "light_gray_concrete"); // roof deck over every cell
      continue;
    }
    if (ext) {
      const [id, props] = facadeBlock(rel, u, face, corner, x, z);
      put(x, y, z, id, props);
    } else if (rel > 0 && rel % STOREY === 0) {
      put(x, y, z, "light_gray_concrete"); // interior floor slab
    }
  }

  // Parapet with corner lanterns on exterior cells.
  if (ext) {
    put(x, y0 + ROOF + 1, z, "white_concrete");
    put(x, y0 + ROOF + 2, z, "white_concrete");
    if (corner) put(x, y0 + ROOF + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof plant room, set back from the parapet, with a glazed band and cap.
const pMinX = minX + 4, pMaxX = maxX - 4, pMinZ = minZ + 3, pMaxZ = maxZ - 3;
for (const [x, z] of cells) {
  if (x < pMinX || x > pMaxX || z < pMinZ || z > pMaxZ) continue;
  const edge = x === pMinX || x === pMaxX || z === pMinZ || z === pMaxZ;
  for (let rel = ROOF + 1; rel <= ROOF + 3; rel++) {
    const y = y0 + rel;
    if (rel === ROOF + 2 && edge) put(x, y, z, "light_blue_stained_glass");
    else if (edge) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_gray_concrete");
  }
  put(x, y0 + ROOF + 4, z, "white_concrete"); // cap
}

g.save(`${DIR}/${ID}.nbt`);
