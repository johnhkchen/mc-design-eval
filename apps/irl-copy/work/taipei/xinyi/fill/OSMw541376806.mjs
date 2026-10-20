import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541376806";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 11 x 24 footprint, roof about 11 blocks above lowest ground.
// Two storeys of about 5 blocks with a cornice/parapet: a 1990s Xinyi
// commercial block in cream tile and concrete with a shopfront at street level.
const W = 11, H = 23, D = 24;
const ROOF_DECK = 10;   // roof slab / parapet level
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const groundOf = new Map(cells.map(([x, z, gr]) => [key(x, z), Math.max(0, Math.min(9, gr))]));
const has = (x, z) => groundOf.has(key(x, z));
const gAt = (x, z) => groundOf.get(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Exterior face of a footprint cell: returns the facade coordinate u and the
// inner neighbour, or null for an interior cell.
function faceOf(x, z) {
  if (!has(x - 1, z)) return { u: z, inner: [x + 1, z] };
  if (!has(x + 1, z)) return { u: z, inner: [x - 1, z] };
  if (!has(x, z - 1)) return { u: x, inner: [x, z + 1] };
  if (!has(x, z + 1)) return { u: x, inner: [x, z - 1] };
  return null;
}

const DOOR_X = 5;

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const gr = gAt(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = faceOf(x, z);

  if (!f) {
    // Interior: floor slabs only, air above (the gap behind the glass).
    put(x, gr, z, "smooth_stone");
    if (gr < 5) put(x, 5, z, "smooth_stone");
    put(x, ROOF_DECK, z, "light_gray_concrete");
    continue;
  }

  const u = f.u;
  const entrance = !has(x, z + 1) && x === DOOR_X && gr <= 1;
  const canopy = !has(x, z + 1) && x >= 4 && x <= 6 && gr <= 1;

  for (let y = gr; y <= 9; y++) {
    if (y === gr) {
      // Base course.
      put(x, y, z, "stone_bricks");
    } else if (y < 5) {
      // Ground storey: shopfront.
      if (entrance && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "south",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (canopy && y === gr + 3) {
        put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      } else if (y === 4 && u % 3 !== 2) {
        put(x, y, z, "black_concrete");          // lintel over glass
      } else if (u % 3 === 1) {
        put(x, y, z, "light_blue_stained_glass");
      } else if (u % 3 === 0) {
        put(x, y, z, "black_concrete");          // mullion
      } else {
        put(x, y, z, "smooth_quartz");           // pier
      }
    } else if (y === 5) {
      // String course between storeys.
      put(x, y, z, "smooth_quartz");
    } else if (y <= 8) {
      // Second storey: window band.
      if (y === 8 && u % 3 !== 2) put(x, y, z, "black_concrete"); // head frame
      else if (u % 3 === 1) put(x, y, z, "light_blue_stained_glass");
      else if (u % 3 === 0) put(x, y, z, "black_concrete");
      else put(x, y, z, "smooth_quartz");
    } else {
      // Spandrel under the cornice.
      put(x, y, z, "smooth_quartz");
    }
  }

  // Parapet / cornice cap on the exterior ring.
  put(x, ROOF_DECK, z, "smooth_quartz");

  // Warm lights inside, behind selected windows.
  if (u % 6 === 1) {
    const [ix, iz] = f.inner;
    if (has(ix, iz) && !faceOf(ix, iz)) {
      const igr = gAt(ix, iz);
      for (const ly of [2, 7]) {
        if (ly > igr && ly > gr && ly <= 9) put(ix, ly, iz, "glowstone");
      }
    }
  }
}

// Rooftop plant: a small unit and a lightning rod, only on interior roof cells.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (faceOf(x, z)) continue;
  if (x >= 3 && x <= 6 && z >= 8 && z <= 11) {
    put(x, ROOF_DECK + 1, z, "iron_block");
  }
}
const rodCell = cells.find(([x, z]) => !faceOf(x, z) && x === 5 && z === 14);
if (rodCell) {
  put(5, ROOF_DECK + 1, 14, "lightning_rod");
  put(5, ROOF_DECK + 2, 14, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
