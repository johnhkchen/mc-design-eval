import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0030-3F";
const W = 11, H = 71, D = 21;
const ROOF = 59;           // roof slab top, from lidar (lowest ground is y 0)
const STOREY = 5;          // blocks per storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);
const maxZ = Math.max(...cells.map(([, z]) => z));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces of a footprint cell that have no neighbour.
function exposures(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x - 1, z)) f.push("west");
  return f;
}

// Pane connection props: a pane on a north/south face runs east-west, and so on.
function paneProps(ex) {
  const p = { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" };
  if (ex.includes("north") || ex.includes("south")) { p.east = "true"; p.west = "true"; }
  if (ex.includes("east") || ex.includes("west")) { p.north = "true"; p.south = "true"; }
  return p;
}

const slabBottom = { type: "bottom", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposures(x, z);
  const edge = ex.length > 0;
  const corner = ex.length >= 2;
  const onNS = ex.includes("north") || ex.includes("south");
  const col = onNS ? x : z;

  for (let y = gr + 1; y < ROOF; y++) {
    if (!edge) {
      // Interior: air gap, with a floor slab at each storey line.
      if (y % STOREY === 0 && y > gr + 4) put(x, y, z, "white_concrete");
      continue;
    }

    // Ground floor: plinth, glass shopfront, lintel. Entrance at centre of south face.
    if (y <= gr + 4) {
      const entrance = ex.includes("south") && x >= 4 && x <= 6 && z === maxZ;
      if (entrance) {
        if (y === gr + 1 && x === 5) {
          put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (y === gr + 2 && x === 5) {
          put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (y === gr + 3 && x === 5) {
          // Hanging lantern marks the entrance at dusk.
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        } else if (y === gr + 4) {
          put(x, y, z, "dark_oak_slab", slabBottom); // canopy over entrance
        } else if (y === gr + 1) {
          put(x, y, z, "polished_granite");
        } else {
          put(x, y, z, "cyan_stained_glass_pane", paneProps(ex));
        }
      } else if (y === gr + 1) {
        put(x, y, z, "polished_granite");
      } else if (y === gr + 4) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "cyan_stained_glass_pane", paneProps(ex));
      }
      continue;
    }

    // Cornice course just under the parapet.
    if (y === ROOF - 1) { put(x, y, z, "white_concrete"); continue; }

    const rel = y % STOREY;
    if (rel === 0) { put(x, y, z, "white_concrete"); continue; }   // floor line
    if (rel === 4) { put(x, y, z, "light_gray_concrete"); continue; } // spandrel
    if (rel === 1) { put(x, y, z, "gray_concrete"); continue; }      // dark sill course

    // Window band (rel 2..3): concrete piers every third bay, glass between.
    if (corner) {
      put(x, y, z, "smooth_quartz");
    } else if (col % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(ex));
      // Warm light behind some windows, inside the air gap.
      if (rel === 2 && (col + y) % 4 === 0) {
        const e = ex[0];
        const [jx, jz] = e === "north" ? [x, z + 1]
          : e === "south" ? [x, z - 1]
          : e === "east" ? [x - 1, z]
          : [x + 1, z];
        if (has(jx, jz) && exposures(jx, jz).length === 0) put(jx, y, jz, "glowstone");
      }
    }
  }

  // Roof: parapet on the edge, gray roof slab inside, cap on the parapet.
  if (edge) {
    put(x, ROOF, z, "white_concrete");
    put(x, ROOF + 1, z, "smooth_stone_slab", slabBottom);
  } else {
    put(x, ROOF, z, "gray_concrete");
  }
}

// Rooftop mechanical penthouse, glazed on the perimeter, capped in stone.
for (let x = 3; x <= 7; x++) {
  for (let z = 6; z <= 14; z++) {
    if (!has(x, z)) continue;
    const perimeter = x === 3 || x === 7 || z === 6 || z === 14;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (perimeter) put(x, y, z, "light_blue_stained_glass");
    }
    put(x, ROOF + 4, z, "smooth_stone");
  }
}

// Mast on top of the penthouse.
for (let y = ROOF + 5; y <= ROOF + 8; y++) put(5, y, 10, "iron_bars");
put(5, ROOF + 9, 10, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
