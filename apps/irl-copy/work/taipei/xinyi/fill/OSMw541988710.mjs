import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988710";
const W = 8, H = 23, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground under the building
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const inFp = (x, z) => gmap.has(`${x},${z}`);
const L = Math.min(...cells.map((c) => c[2]));   // lowest ground (y 0 reference)
const ROOF = Math.min(L + 11, H - 2);            // roof slab top layer
const MID = L + 5;                               // second-storey floor line
const maxZ = Math.max(...cells.map((c) => c[1]));

// Bounds-safe setter
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Perimeter test: any side with no neighbouring footprint cell
function isPerimeter(x, z) {
  return !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
}

// Direction from an exterior cell toward the building interior
function inward(x, z) {
  if (z === 0) return [0, 1];
  if (z === D - 1) return [0, -1];
  if (x === 0) return [1, 0];
  if (x === W - 1) return [-1, 0];
  return null;
}

// Entrance: a cell on the south (max z) face, near the middle
const southCells = cells.filter((c) => c[1] === maxZ).sort((a, b) => a[0] - b[0]);
const entrance = southCells.length
  ? southCells[Math.floor(southCells.length / 2)]
  : null;

for (const [x, z, gr] of cells) {
  const per = isPerimeter(x, z);

  // Solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  // Walls, storey lines and floors from ground to the roof
  for (let y = gr; y < ROOF; y++) {
    const isFloorLine = (y === gr) || (y === MID);

    if (isFloorLine) {
      // Floor slab for every storey (interior) / storey line (exterior)
      put(x, y, z, per && y !== gr ? "light_gray_concrete" : (per ? "stone_bricks" : "smooth_stone"));
      continue;
    }

    if (!per) continue; // interior air behind the glass

    if (y === ROOF - 1) {
      // Cornice course under the roof
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Facade: storey base = MID for upper storey, L for ground storey
    const floorBase = y >= MID ? MID : L;
    const r = y - floorBase; // 0 floor line, 1..3 glazing, 4 lintel

    if (r >= 1 && r <= 3) {
      const pier = (x + z) % 2 === 0;
      if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
        // Warm light behind some panes
        const dir = inward(x, z);
        if (dir && (x * 3 + z + y) % 7 === 0) {
          const ix = x + dir[0], iz = z + dir[1];
          if (inFp(ix, iz) && !isPerimeter(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    } else if (r === 4) {
      put(x, y, z, "light_gray_concrete");
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Roof slab over the whole footprint
  put(x, ROOF, z, "gray_concrete");
}

// Low parapet ring on the roof edge
for (const [x, z] of cells) {
  if (isPerimeter(x, z)) put(x, ROOF + 1, z, "light_gray_concrete");
}

// Roof plant block standing on the roof slab (interior cells only)
for (const [x, z] of cells) {
  if (!isPerimeter(x, z) && x >= 2 && x <= 3 && z >= 3 && z <= 4) {
    put(x, ROOF + 1, z, "iron_block");
  }
}

// Entrance on the south face: double door with lintel above
if (entrance) {
  const [ex, ez, egr] = entrance;
  const lower = egr + 1, upper = egr + 2;
  put(ex, lower, ez, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, upper, ez, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel / canopy band over the entrance
  for (const dx of [-1, 0, 1]) {
    if (inFp(ex + dx, ez)) put(ex + dx, egr + 3, ez, "smooth_stone");
  }
  // Shopfront glazing beside the entrance on the ground storey
  for (const dx of [-2, -1, 1, 2]) {
    if (inFp(ex + dx, ez)) {
      for (const dy of [1, 2]) put(ex + dx, egr + dy, ez, "light_blue_stained_glass_pane");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
