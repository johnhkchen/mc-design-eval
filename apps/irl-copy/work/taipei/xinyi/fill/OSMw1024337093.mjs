import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1024337093";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Outward face of an edge cell (N = z-1 side, S = z+1 side, W = x-1, E = x+1), null if interior
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}
// Index along the facade: x for N/S faces, z for E/W faces
const idxOf = (f, x, z) => (f === "N" || f === "S" ? x : z);

// Facade rhythm
// Ground storey shopfront (door sits at x=5 on the N face)
function shopGlass(f, i) {
  if (f === "N" || f === "S") return [1, 2, 3, 4, 6, 7, 8, 9].includes(i);
  return [4, 8, 12, 16].includes(i);
}
// Upper storey windows (2 blocks tall, y=6..7)
function upperGlass(f, i) {
  if (f === "N" || f === "S") return [2, 4, 6, 8].includes(i);
  return [4, 7, 10, 13, 16].includes(i);
}

// Is this perimeter cell a glass pane at height y?
function isPane(x, z, y) {
  if (!has(x, z)) return false;
  const f = faceOf(x, z);
  if (!f) return false;
  const i = idxOf(f, x, z);
  const gr = gAt(x, z);
  if (y >= gr + 1 && y <= 3) return shopGlass(f, i);
  if (y === 6 || y === 7) return upperGlass(f, i);
  return false;
}

// Pane connection flags, so adjacent panes join along the facade
function paneProps(x, z, y) {
  const f = faceOf(x, z);
  if (f === "N" || f === "S") {
    return {
      north: "false",
      south: "false",
      east: isPane(x + 1, z, y) ? "true" : "false",
      west: isPane(x - 1, z, y) ? "true" : "false",
      waterlogged: "false",
    };
  }
  return {
    north: isPane(x, z - 1, y) ? "true" : "false",
    south: isPane(x, z + 1, y) ? "true" : "false",
    east: "false",
    west: "false",
    waterlogged: "false",
  };
}

// Pass 1: foundation, walls, floors, roof deck, parapet
for (const [x, z, gr] of cells) {
  // Foundation: solid from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const f = faceOf(x, z);
  if (f) {
    // Exterior wall column from ground to parapet (y=10)
    for (let y = gr; y <= 10; y++) {
      if (y === gr) {
        g.set(x, y, z, "stone_bricks"); // base course
      } else if (y <= 3) {
        if (isPane(x, z, y)) {
          g.set(x, y, z, "glass_pane", paneProps(x, z, y));
        } else {
          g.set(x, y, z, "white_terracotta");
        }
      } else if (y === 4) {
        g.set(x, y, z, "stone_bricks"); // lintel band / canopy line
      } else if (y === 5) {
        g.set(x, y, z, "smooth_stone"); // storey line and sill
      } else if (y === 6 || y === 7) {
        if (isPane(x, z, y)) {
          g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z, y));
        } else {
          g.set(x, y, z, "white_terracotta");
        }
      } else if (y === 8) {
        g.set(x, y, z, "white_terracotta"); // window head
      } else if (y === 9) {
        g.set(x, y, z, "smooth_stone"); // cornice
      } else if (y === 10) {
        g.set(x, y, z, "white_terracotta"); // parapet
      }
    }
  } else {
    // Interior cell: floor slab at storey line, roof deck at y=9, air between
    g.set(x, 5, z, "smooth_stone");
    g.set(x, 9, z, "gray_concrete");
  }

  // Roof deck over every footprint cell (edge cells already have cornice at 9)
  if (f) g.set(x, 9, z, "smooth_stone");
}

// Pass 2: entrance on the north face (z=0), door at x=5 above the base course
if (has(5, 0)) {
  const gr = gAt(5, 0);
  g.set(5, gr + 1, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(5, gr + 2, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Entrance canopy band with a lantern hung just inside the door
  if (has(5, 1)) g.set(5, 4, 1, "lantern", { hanging: "true" });
}

// Pass 3: warm lights behind glass (interior air cells only)
const lights = [
  [4, 6, 1, "shroomlight"],
  [8, 6, 1, "shroomlight"],
  [1, 6, 7, "shroomlight"],
  [1, 6, 13, "shroomlight"],
  [3, 2, 1, "glowstone"],
  [7, 2, 1, "glowstone"],
];
for (const [x, y, z, id] of lights) {
  if (has(x, z) && !faceOf(x, z)) g.set(x, y, z, id);
}

// Pass 4: roof equipment (condenser units on the deck, standing on y=9)
for (const [x, z] of [[3, 12], [4, 12], [3, 13], [4, 13], [7, 15]]) {
  if (has(x, z) && !faceOf(x, z)) g.set(x, 10, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
