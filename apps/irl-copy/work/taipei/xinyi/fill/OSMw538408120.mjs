import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408120";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 23;
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Pick the entrance: edge cell on the minimum-z side, nearest the middle of the width
let door = null;
{
  let minZ = Infinity;
  for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
    if (isEdge(x, z)) minZ = Math.min(minZ, z);
  }
  let best = Infinity;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (z === minZ && isEdge(x, z) && Math.abs(x - 5) < best) {
      best = Math.abs(x - 5);
      door = { x, z };
    }
  }
}

for (const [x, z, gr] of cells) {
  const base = Math.round(gr);
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Ground slab / base course
  put(x, base, z, edge ? "smooth_stone" : "gray_concrete");

  // Storey line between floors
  put(x, base + 5, z, "white_concrete");

  // Roof slab
  put(x, base + 10, z, "gray_concrete");

  if (edge) {
    // Ground storey: shopfront glazing, pillars, red lintel band
    for (let y = base + 1; y <= base + 3; y++) {
      if ((x + z) % 3 === 0) put(x, y, z, "stone_bricks");
      else put(x, y, z, "glass_pane");
    }
    put(x, base + 4, z, "red_terracotta");

    // Upper storey: window grid with white concrete mullions
    for (let y = base + 6; y <= base + 9; y++) {
      if ((x + z) % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane");
    }

    // Parapet
    put(x, base + 11, z, "white_concrete");
  } else {
    // Interior: air behind the glass, occasional warm lanterns on the upper floor
    if ((x * 5 + z * 3) % 7 === 0) {
      put(x, base + 6, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
    // Roof equipment boxes
    if ((x * 2 + z) % 13 === 0) {
      put(x, base + 11, z, "stone_bricks");
    }
  }
}

// Entrance door on the street-facing edge
if (door) {
  const base = ground.get(`${door.x},${door.z}`);
  put(door.x, base + 1, door.z, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, base + 2, door.z, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
