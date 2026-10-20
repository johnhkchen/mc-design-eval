import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Lidar roof ~11 blocks above lowest ground.
// Read as a two-storey, flat-roofed mid-century Taipei block: white tiled-concrete
// walls, light-grey pilasters and parapet, a shopfront with a central door at street level,
// and punched windows above with piers every third cell.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1389965683";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 8, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, gr));

const inside = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const minZ = Math.min(...[...ground.keys()].map(k => +k.split(",")[1]));

// Storey layout relative to each cell's ground gr:
//  gr        base slab
//  gr+1..4   storey 1 walls (shopfront at gr+1..2 on street face)
//  gr+5      storey 2 floor slab
//  gr+6..9   storey 2 walls
//  gr+10     roof slab
//  gr+11     parapet
const PANE = "gray_stained_glass_pane";

function paneProps(x, z) {
  return {
    north: inside(x, z - 1) ? "true" : "false",
    south: inside(x, z + 1) ? "true" : "false",
    east: inside(x + 1, z) ? "true" : "false",
    west: inside(x - 1, z) ? "true" : "false",
    waterlogged: "false",
  };
}

function setSafe(x, y, z, block, props) {
  if (y < 0 || y >= H) return;
  g.set(x, y, z, block, props);
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) setSafe(x, y, z, "stone_bricks");

  const north = !inside(x, z - 1);
  const south = !inside(x, z + 1);
  const west = !inside(x - 1, z);
  const east = !inside(x + 1, z);
  const edge = north || south || west || east;
  const corner = (north || south) && (west || east);
  const street = z === minZ; // street-facing side

  // Base slab and floors / roof.
  setSafe(x, gr, z, edge ? "stone_bricks" : "smooth_stone");
  setSafe(x, gr + 5, z, "smooth_stone");          // storey 2 floor
  setSafe(x, gr + 10, z, "light_gray_concrete");  // roof slab

  if (!edge) {
    // Interior: air above the floors, only roof equipment and lights handled below.
    continue;
  }

  const pier = (x + z) % 3 === 0;

  for (const y of [1, 2, 3, 4, 6, 7, 8, 9]) {
    const yy = gr + y;
    const storey1 = y <= 4;
    const isWindowRow = storey1 ? (y === 2 || y === 3) : (y === 7 || y === 8);
    const isShopRow = storey1 && (y === 1 || y === 2);

    if (corner) {
      setSafe(x, yy, z, "light_gray_concrete");          // corner pilaster
    } else if (street && isShopRow) {
      if (x === 3 && y === 1) {
        setSafe(x, yy, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (x === 3 && y === 2) {
        setSafe(x, yy, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (!pier) {
        setSafe(x, yy, z, PANE, paneProps(x, z));       // shopfront glass
      } else {
        setSafe(x, yy, z, "light_gray_concrete");       // shopfront pier
      }
    } else if (isWindowRow && !pier) {
      setSafe(x, yy, z, PANE, paneProps(x, z));
    } else if (y === 1 || y === 5 || y === 6 || y === 9) {
      // storey lines / cornice bands
      setSafe(x, yy, z, "light_gray_concrete");
    } else {
      setSafe(x, yy, z, "white_concrete");
    }
  }

  // Parapet with a light-grey coping on the roof edge.
  setSafe(x, gr + 11, z, corner ? "light_gray_concrete" : "stone_brick_wall", corner ? undefined : { east: "none", west: "none", north: "none", south: "none", up: "true", waterlogged: "false" });
}

// Warm lights behind the glass on the street side (interior cell at z=1 is air behind pane).
for (const [x, z, gr] of cells) {
  if (z !== minZ + 1) continue;
  if (x === 2 || x === 5) {
    setSafe(x, gr + 2, z, "glowstone");          // storey 1 behind window
    setSafe(x, gr + 7, z, "shroomlight");        // storey 2 behind window
  }
}

// Roof equipment: a small plant block on the roof, set in from the parapet.
for (const [x, z, gr] of cells) {
  const interiorRoof = inside(x, z) && inside(x - 1, z) && inside(x + 1, z) && inside(x, z - 1) && inside(x, z + 1);
  if (interiorRoof && x >= 3 && x <= 4 && z >= 3 && z <= 6 && (z === 4 || z === 5)) {
    setSafe(x, gr + 11, z, "stone_bricks");
    setSafe(x, gr + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${dir}/${id}.nbt`);
