import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542681375.cells.json", "utf8"));

// Footprint 15 x 13, roof about 11 blocks above lowest ground.
// Read as a two-storey, flat-roofed 1970s-80s Taipei commercial block:
// white concrete walls, light grey piers, glass window bands, a stone base
// course, a stone cornice, and a ground-floor shopfront with a street door.
const W = 15, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outwardOf = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isPerim = (x, z) => outwardOf(x, z).length > 0;

// Street door: on the north (min z) row, middle of that row.
let door = null;
{
  let minZ = Infinity;
  for (const [x, z] of cells) if (z < minZ) minZ = z;
  const row = cells.filter(([, z]) => z === minZ).map(([x, z]) => [x, z]).sort((a, b) => a[0] - b[0]);
  if (row.length) door = { x: row[Math.floor(row.length / 2)][0], z: minZ };
}

for (const [x, z, gr] of cells) {
  // Foundation up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // Ground floor slab.
  g.set(x, gr, z, "smooth_stone");

  // Storey line (floor slab between storeys), full footprint.
  g.set(x, gr + 5, z, "light_gray_concrete");

  // Roof slab at gr+10 (top surface 11 blocks above lowest ground).
  const perim = isPerim(x, z);
  const roofY = gr + 10;
  g.set(x, roofY, z, perim ? "stone_bricks" : "smooth_quartz");

  // Roof equipment: a few sparse units on the interior roof.
  if (!perim && x >= 4 && x <= 10 && z >= 3 && z <= 9 && (x * 3 + z * 5) % 7 === 0) {
    g.set(x, roofY + 1, z, "light_gray_concrete");
  }

  if (!perim) continue;

  const out = outwardOf(x, z);
  const [odx, odz] = out[0];
  const corner = out.length > 1;
  const pier = corner || (x + z) % 3 === 0;
  const isDoor = door && x === door.x && z === door.z;
  const ix = x - odx, iz = z - odz; // inward neighbour
  const innerOk = has(ix, iz) && !isPerim(ix, iz);
  const litHere = !pier && (x + z) % 4 === 1 && innerOk;

  // Walls, storey 1 (gr+1..gr+4) and storey 2 (gr+6..gr+9).
  for (let y = gr + 1; y <= gr + 9; y++) {
    if (y === gr + 5) continue; // floor slab already placed
    const ground = y <= gr + 4;
    const sy = ground ? y - gr : y - gr - 5; // 1..4 within a storey

    let block = "white_concrete";
    let props;

    if (pier) {
      block = "light_gray_concrete";
    } else if (isDoor && (sy === 1 || sy === 2)) {
      block = "oak_door";
      props = {
        facing: "north",
        half: sy === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    } else if (isDoor && sy === 3) {
      block = "white_concrete";
    } else if (ground && sy === 1) {
      block = "stone_bricks"; // shopfront base course
    } else if (!ground && sy === 1) {
      block = "white_concrete";
    } else if ((ground && sy >= 2 && sy <= 3) || (!ground && (sy === 2 || sy === 3))) {
      block = "glass_pane";
      // Connect to neighbouring panes along the facade.
      const alongX = odz !== 0; // wall runs east-west
      props = {
        north: alongX ? "true" : "false",
        south: alongX ? "true" : "false",
        east: alongX ? "false" : "true",
        west: alongX ? "false" : "true",
        waterlogged: "false",
      };
      if (!alongX) {
        props.east = "true";
        props.west = "true";
      }
    }

    if (block === "oak_door") {
      g.set(x, y, z, block, props);
    } else if (props) {
      g.set(x, y, z, block, props);
    } else {
      g.set(x, y, z, block);
    }
  }

  // Warm lights behind some window bays: hanging lanterns from the storey
  // slabs, inside the building.
  if (litHere && innerOk) {
    g.set(ix, gr + 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
    g.set(ix, gr + 9, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542681375.nbt");
