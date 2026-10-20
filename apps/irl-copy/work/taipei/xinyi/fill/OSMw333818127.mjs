import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw333818127.cells.json`, "utf8"));

const W = 56, H = 23, D = 37;
const g = new Voxels([W, H, D]);

// Two storeys: ground-floor shopfronts (y 1..4), floor line y=5,
// upper windows (y 6..8), cornice y=9, red-tiled parapet y=10.
const ROOF = 11;
const FLOOR_Y = 5;
const CORNICE_Y = 9;
const PARAPET_Y = 10;

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Outward facing for an edge cell: the first side with no footprint neighbour.
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}
const isEdge = (x, z) => outward(x, z) !== null;

// Entrance: the middle three cells of the lowest-z row.
const minZ = Math.min(...cells.map(c => c[1]));
const rowXs = cells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const midX = rowXs[Math.floor(rowXs.length / 2)];
const doorXs = new Set([midX - 1, midX, midX + 1]);
const bayXs = new Set([midX - 2, midX - 1, midX, midX + 1, midX + 2]);

const FOUND = "stone_bricks";
const WALL = "white_concrete";
const GLASS = "light_blue_stained_glass";

// Roof plant room: a compact block of interior roof cells near the middle.
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
const plantCells = new Set();
for (let dx = -4; dx <= 4; dx++)
  for (let dz = -2; dz <= 2; dz++) {
    const k = key(cx + dx + 8, cz + dz);
    if (has(cx + dx + 8, cz + dz) && !isEdge(cx + dx + 8, cz + dz)) plantCells.add(k);
  }

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, ROOF - 2));

  // Foundation under every cell so nothing floats on the slope.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const out = outward(x, z);
  if (out) {
    const pier = (x + z) % 4 === 0;
    const isDoor = z === minZ && doorXs.has(x);
    const inBay = z === minZ && bayXs.has(x);

    for (let y = gr; y <= ROOF - 1; y++) {
      if (y === gr) {
        g.set(x, y, z, FOUND); // base course
      } else if (y < FLOOR_Y) {
        if (isDoor && y <= gr + 1) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north",
            half: y === gr ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (inBay && !isDoor) {
          // Entrance piers flanking the doors
          g.set(x, y, z, "stone_bricks");
        } else if (pier) {
          g.set(x, y, z, WALL);
        } else {
          g.set(x, y, z, GLASS);
        }
      } else if (y === FLOOR_Y) {
        g.set(x, y, z, "smooth_quartz");
      } else if (y < CORNICE_Y) {
        if (pier) {
          g.set(x, y, z, WALL);
        } else if (y === 7 && (x * 7 + z * 13) % 23 === 0) {
          g.set(x, y, z, "shroomlight");
        } else if (y === 7 && (x * 5 + z * 3) % 17 === 0) {
          g.set(x, y, z, "glowstone");
        } else {
          g.set(x, y, z, GLASS);
        }
      } else if (y === CORNICE_Y) {
        // Projecting cornice: stair lip facing outward
        g.set(x, y, z, "smooth_quartz_stairs", {
          facing: out,
          half: "top",
          shape: "straight",
          waterlogged: "false",
        });
      } else if (y === PARAPET_Y) {
        g.set(x, y, z, "red_terracotta");
      }
    }

    // Entrance canopy: dark oak slab hood over the door at the storey line.
    if (isDoor) {
      g.set(x, 4, z, "dark_oak_slab", { type: "top" });
    }
    // Lantern on the bay piers.
    if (z === minZ && (x === midX - 2 || x === midX + 2)) {
      g.set(x, 4, z, "lantern", { hanging: "false" });
    }
  } else {
    // Interior: solid ground-floor mass, floor slab, air, roof deck.
    for (let y = gr; y <= ROOF - 1; y++) {
      if (y < FLOOR_Y) g.set(x, y, z, WALL);
      else if (y === FLOOR_Y) g.set(x, y, z, "smooth_quartz");
      else if (y === ROOF - 1) g.set(x, y, z, "light_gray_concrete");
    }
    // Grouped plant room on the roof instead of scattered blocks.
    if (plantCells.has(key(x, z))) {
      g.set(x, ROOF, z, "stone_bricks");
      g.set(x, ROOF + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/OSMw333818127.nbt`);
