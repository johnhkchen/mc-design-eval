import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343872";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 12;
const ROOF = 11;          // roof/parapet top, blocks above lowest ground
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Glass pane connections: panes on the z-faces run along x, panes on the x-faces run along z.
const paneAlongX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneAlongZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gy; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

  if (!edge) {
    // Interior: floor slabs only, air between them (no interiors).
    put(x, 5, z, "light_gray_concrete");   // storey 2 floor
    put(x, 10, z, "light_gray_concrete");  // roof deck

    // Roof equipment: two plant boxes on the deck.
    if ((x === 4 || x === 5) && (z === 4 || z === 5)) put(x, 11, z, "smooth_stone");
    if ((x === 16 || x === 17) && (z === 7 || z === 8)) put(x, 11, z, "smooth_stone");

    // Warm light behind the glass in a few bays.
    if (z === D - 2 && x % 6 === 3) put(x, 7, z, "shroomlight");
    if (z === 1 && x % 6 === 3) put(x, 3, z, "glowstone");
    continue;
  }

  // Edge (facade / perimeter) cell.
  const onZFace = z === 0 || z === D - 1;
  const onXFace = x === 0 || x === W - 1;

  // Pier columns: every third bay, corners always solid.
  const pier = corner || (onZFace ? x % 3 === 0 : z % 3 === 0);

  for (let y = gy + 1; y <= ROOF; y++) {
    // Entrance on the south (z = D-1) facade, centred on x = 11.
    if (z === D - 1 && x >= 10 && x <= 12 && y <= gy + 3) {
      if (x === 11) {
        if (y === gy + 1) { put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gy + 2) { put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      put(x, y, z, "glass_pane", onZFace ? paneAlongX : paneAlongZ);
      continue;
    }

    if (y === gy + 1) { put(x, y, z, "polished_andesite"); continue; }   // base course
    if (y === 10 || y === ROOF) { put(x, y, z, "smooth_quartz"); continue; } // cornice and parapet
    const band = y === 4 || y === 5 || y === 6 || y === 9;               // lintels and spandrels
    if (band) { put(x, y, z, "smooth_quartz"); continue; }

    const windowRow = (y >= gy + 2 && y <= 3) || y === 7 || y === 8;
    if (corner) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    if (pier) { put(x, y, z, "white_concrete"); continue; }
    if (windowRow) {
      put(x, y, z, "glass_pane", onZFace ? paneAlongX : paneAlongZ);
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
