import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833541.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833541.nbt";

// Footprint 15 x 16. Reads as a 1990s Xinyi mid-rise: white tiled/concrete
// frame, tinted glass curtain bands, stone base, cornice and parapet, rooftop plant.
const W = 15, H = 23, D = 16;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const maxG = Math.max(...cells.map(c => c[2]));

// Roof about 11 blocks above lowest ground: two 5-block storeys plus roof slab.
const roofY = Math.min(17, Math.max(10, maxG + 6));

const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

for (const [x, z, gr] of cells) {
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const corner = (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Walls, storey lines and interior floor slabs from ground up to the roof.
  for (let y = gr; y < roofY; y++) {
    const r = y % 5;
    const floorLine = r === 0 && y > 0;

    if (edge) {
      if (y === gr) {
        put(x, y, z, "stone_bricks");                 // base course
      } else if (floorLine) {
        put(x, y, z, "smooth_stone");                 // storey string course
      } else if (corner) {
        put(x, y, z, "white_concrete");               // solid corner piers
      } else if (y < 5) {
        // Ground storey: shopfront glazing with mullions
        const mullion = (x + z) % 3 === 0;
        put(x, y, z, mullion ? "white_concrete" : "cyan_stained_glass");
      } else if (r >= 1 && r <= 3) {
        // Upper storeys: tinted curtain-wall bays with white mullions
        const mullion = (x + z) % 3 === 0;
        put(x, y, z, mullion ? "white_concrete" : "gray_stained_glass");
      } else {
        put(x, y, z, "white_concrete");               // spandrel / sill band
      }
    } else {
      // Interior: floor slab per storey, air elsewhere, sparse warm lights
      // placed behind the glass line.
      if (y === gr || floorLine) {
        put(x, y, z, "smooth_stone");
      } else if (r === 2 && (x * 7 + z * 3) % 11 === 0) {
        put(x, y, z, "glowstone");
      }
    }
  }

  // Roof: cornice on the edge, roof slab inside.
  if (roofY < H) {
    put(x, roofY, z, edge ? "smooth_stone" : "light_gray_concrete");
  }

  // Parapet course around the perimeter.
  if (edge && roofY + 1 < H) put(x, roofY + 1, z, "white_concrete");

  // Roof plant: small AC/mechanical boxes, a few with a steel cap.
  if (!edge && roofY + 1 < H && (x * 5 + z * 3) % 7 === 0) {
    put(x, roofY + 1, z, "light_gray_concrete");
    if (roofY + 2 < H && (x + 2 * z) % 4 === 0) put(x, roofY + 2, z, "iron_block");
  }
}

// Entrance on the north face (z = 0), centred on x = 7.
const ex = Math.floor((W - 1) / 2);
for (const dx of [-1, 0, 1]) {
  const x = ex + dx;
  if (!has(x, 0)) continue;
  const gr = ground.get(`${x},0`);
  if (gr >= 5) continue; // no ground storey under this cell
  if (dx === 0) {
    put(x, gr, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    put(x, gr + 1, 0, "cyan_stained_glass");
  }
  // Canopy above the entrance bay.
  if (gr + 4 < H) put(x, gr + 4, 0, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(OUT);
