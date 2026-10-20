import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643833885";

const W = 28, H = 23, D = 16;
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint: key "x,z" -> ground (y of the cell's lowest body block)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const inFp = (x, z) => ground.has(`${x},${z}`);

// Vertical plan (y 0 = lowest ground)
const TRANSOM = 4;   // top of ground-floor glazing band
const FLOOR2 = 5;    // second-floor slab / storey line
const ROOF = 10;     // roof deck (cornice course on the edge)
const PARAPET = 11;  // parapet top; roof is ~11 blocks above lowest ground
const DOOR_X = [13, 14];

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [key, base] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  if (base > ROOF) continue;

  const north = !inFp(x, z - 1), south = !inFp(x, z + 1);
  const west = !inFp(x - 1, z), east = !inFp(x + 1, z);
  const edge = north || south || west || east;
  // bay index runs along the facade: x on north/south faces, z on east/west faces
  const bay = (north || south) ? x : z;

  // Inward neighbour (for placing warm lights behind glass)
  let inDx = 0, inDz = 0;
  if (edge) {
    if (!north) inDz = -1;
    else if (!south) inDz = 1;
    else if (!west) inDx = -1;
    else if (!east) inDx = 1;
  }

  // Ground-floor floor slab (interior) and roof deck at the top
  if (!edge) put(x, base, z, "smooth_quartz");
  if (base < FLOOR2) put(x, FLOOR2, z, "smooth_quartz");
  put(x, ROOF, z, edge ? "polished_granite" : "gray_concrete");

  // Roof equipment on interior roof cells: AC plant blocks
  if (!edge && ((x % 8 === 3 || x % 8 === 4) && (z % 6 === 2 || z % 6 === 3))) {
    put(x, PARAPET, z, "light_gray_concrete");
    put(x, PARAPET + 1, z, "smooth_stone");
  }

  if (!edge) continue;

  // Parapet on the perimeter
  put(x, PARAPET, z, "smooth_quartz");

  // Base course
  put(x, base, z, "polished_granite");

  // Ground-floor shopfront (base+1 .. TRANSOM)
  const isPillar = bay % 4 === 0;
  const doorHere = south && DOOR_X.includes(x) && inFp(x, z + 1) === false;
  const doorOK = doorHere && base + 2 <= TRANSOM - 1;

  for (let y = base + 1; y <= TRANSOM; y++) {
    if (y === TRANSOM) {
      put(x, y, z, isPillar ? "smooth_quartz" : "gray_concrete");
      continue;
    }
    if (isPillar) {
      put(x, y, z, "smooth_quartz");
    } else if (doorOK && (y === base + 1 || y === base + 2)) {
      // Door is placed in the glazing band; handled below
      put(x, y, z, "light_blue_stained_glass");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }
  if (doorOK) {
    put(x, base + 1, z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, base + 2, z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }

  // Warm light behind some shopfront glass
  if (!isPillar && !doorHere && bay % 8 === 2 && base + 2 < TRANSOM && (inDx || inDz)) {
    put(x + inDx, base + 2, z + inDz, "glowstone");
  }

  // Floor line at second floor
  put(x, FLOOR2, z, "polished_granite");

  // Upper storey: window grid with mullions, sills and lintels
  for (let y = FLOOR2 + 1; y <= ROOF - 2; y++) {
    const isMullion = bay % 3 === 0;
    if (isMullion) {
      put(x, y, z, "smooth_quartz");
    } else {
      put(x, y, z, "light_blue_stained_glass");
      if (y === 7 && bay % 6 === 1 && (inDx || inDz)) {
        put(x + inDx, y, z + inDz, "shroomlight");
      }
    }
  }
  // Lintel band under the cornice
  put(x, ROOF - 1, z, "polished_granite");
}

g.save(`${DIR}/${ID}.nbt`);
