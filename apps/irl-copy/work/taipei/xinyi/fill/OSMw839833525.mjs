import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833525";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Low-rise, two-storey Xinyi-era commercial block: stone plinth, pale quartz
// tile walls, glazed shopfront below, paired upper-storey windows, cornice
// and parapet, a central entrance on the north (z = 0) face.
const W = 15, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Perimeter: any side with no footprint neighbour.
const perim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Outward-facing direction for an exposed cell.
const outward = (x, z) => {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  return "east";
};

// Glass pane connections follow the wall direction.
const paneProps = (fac) =>
  fac === "north" || fac === "south"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, b] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  if (!perim(x, z)) {
    // Interior: floor slabs only (air gap behind glass, no interiors).
    put(x, b, z, "smooth_stone");
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "smooth_stone");
    continue;
  }

  const fac = outward(x, z);
  const bay = (x + z) % 2 === 0;

  // Base course / plinth at ground level.
  put(x, b, z, "polished_granite");

  // Ground storey: shopfront bays alternate with quartz piers.
  for (const y of [b + 1, b + 2, b + 3]) {
    if (bay) put(x, y, z, "glass");
    else put(x, y, z, "quartz_pillar");
  }
  put(x, b + 4, z, "smooth_quartz");   // shopfront lintel band

  // Storey line between floors.
  put(x, b + 5, z, "smooth_quartz");

  // Upper storey: paired framed windows, warm light in some bays.
  for (const y of [b + 6, b + 7, b + 8]) {
    if (bay) {
      if (y === b + 7 && x % 3 === 0) put(x, y, z, "glowstone");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps(fac));
    } else {
      put(x, y, z, "quartz_pillar");
    }
  }
  put(x, b + 9, z, "smooth_quartz");   // upper lintel band

  // Cornice and parapet.
  put(x, b + 10, z, "smooth_quartz");
  put(x, b + 11, z, "quartz_block");
}

// Central entrance on the north face, nearest x = W/2.
let doorX = null;
for (const [x, z] of cells) {
  if (z !== 0 || !perim(x, z)) continue;
  if (doorX === null || Math.abs(x - Math.floor(W / 2)) < Math.abs(doorX - Math.floor(W / 2))) doorX = x;
}
if (doorX !== null) {
  const b = gr(doorX, 0);
  const facing = "north";
  put(doorX, b + 1, 0, "dark_oak_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, b + 2, 0, "dark_oak_door", {
    facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, b + 3, 0, "smooth_quartz");  // lintel over the door
}

g.save(`${DIR}/${ID}.nbt`);
