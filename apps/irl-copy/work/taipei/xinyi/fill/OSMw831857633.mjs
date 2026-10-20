import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, 1970s-80s Taipei: white tiled-concrete
// body, stone plinth, light-grey floor bands, glass shopfront and windows in
// aluminium-style frames, flat roof with a parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857633";
const W = 11, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward-facing sides of a footprint cell (missing neighbour = exterior)
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };
const isInterior = (x, z) => has(x, z) && faces(x, z).length === 0;

// Entrance: centre of the south (z = max) frontage
const entranceX = Math.floor(W / 2);
const entranceZ = D - 1;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const fc = faces(x, z);

  if (fc.length === 0) {
    // Interior: floor slabs per storey and a roof slab; air between (no interiors)
    g.set(x, gr, z, "smooth_stone");
    g.set(x, gr + 5, z, "smooth_stone");
    g.set(x, gr + 10, z, "gray_concrete");

    // Rooftop plant on a few roof cells
    if (x % 4 === 3 && z % 6 === 3) {
      g.set(x, gr + 11, z, "iron_block");
    }
    continue;
  }

  const corner = fc.length >= 2;
  const face = fc[0];
  const along = (face === "north" || face === "south") ? x : z;
  const [ix, iz] = [x + inward[face][0], z + inward[face][1]];
  const isEntrance = face === "south" && x === entranceX && z === entranceZ;

  for (let y = gr; y <= gr + 11; y++) {
    const r = y - gr;
    let id = "white_concrete";
    let props;

    if (r === 0) {
      // Base course / plinth
      id = "polished_andesite";
    } else if (r >= 1 && r <= 3) {
      // Ground floor shopfront
      if (corner) {
        id = "white_concrete";
      } else if (isEntrance && r === 3) {
        id = "white_concrete"; // transom over the door
      } else if (isEntrance && r <= 2) {
        id = "dark_oak_door";
        props = { facing: "south", hinge: "left", open: "false", powered: "false",
                  half: r === 1 ? "lower" : "upper" };
      } else {
        id = "light_blue_stained_glass_pane";
      }
    } else if (r === 4) {
      // Lintel band; entrance canopy as a dark oak slab
      if (isEntrance) {
        id = "dark_oak_slab";
        props = { type: "bottom", waterlogged: "false" };
      } else {
        id = "white_concrete";
      }
    } else if (r === 5 || r === 9) {
      // Floor-line bands
      id = "light_gray_concrete";
    } else if (r >= 6 && r <= 8) {
      // Upper storey windows with mullions every other block
      if (corner) {
        id = "white_concrete";
      } else if (along % 2 === 0) {
        id = "white_concrete"; // mullion / frame
      } else {
        id = "light_blue_stained_glass_pane";
        // Warm light behind some glass, in the interior air gap
        if (r === 7 && (along + gr) % 4 === 1 && isInterior(ix, iz)) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    } else if (r === 10) {
      // Cornice
      id = "smooth_stone";
    } else if (r === 11) {
      // Parapet
      id = "white_concrete";
    }

    g.set(x, y, z, id, props);
  }
}

g.save(`${DIR}/${ID}.nbt`);
