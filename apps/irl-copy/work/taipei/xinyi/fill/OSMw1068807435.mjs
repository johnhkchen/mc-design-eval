import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807435";
const W = 20, H = 23, D = 24;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), Math.round(gr));
}
const inside = (x, z) => ground.has(key(x, z));

// Outward directions: [dx, dz]; names for facing props
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Mid-block door on the street (north, min-z) face
const northCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => outward(x, z).some(([dx, dz]) => dx === 0 && dz === -1))
  .sort((a, b) => a[0] - b[0]);
const doorKey = northCells.length ? key(...northCells[Math.floor(northCells.length / 2)]) : null;

for (const [k, G] of ground) {
  const [x, z] = k.split(",").map(Number);
  const dirs = outward(x, z);
  const env = dirs.length > 0;

  // Foundation: solid from y0 up to ground
  for (let y = 0; y <= G; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at storey lines and roof deck (full footprint)
  put(x, G + 5, z, "light_gray_concrete");
  put(x, G + 10, z, "light_gray_concrete");

  if (!env) {
    // Rooftop plant: AC units on interior roof cells
    if (x % 5 === 2 && z % 7 === 3) put(x, G + 11, z, "iron_block");
    continue;
  }

  // Envelope: base course, storey lines, cornice, parapet
  put(x, G + 1, z, "smooth_stone");
  put(x, G + 5, z, "smooth_quartz");
  put(x, G + 10, z, "smooth_quartz");
  put(x, G + 11, z, "smooth_quartz");

  const isDoor = k === doorKey;
  const corner = dirs.length >= 2;

  // Facade: window rows at ground floor and upper storey
  const rows = [G + 2, G + 3, G + 4, G + 6, G + 7, G + 8, G + 9];
  for (const y of rows) {
    if (corner) {
      put(x, y, z, "white_concrete");
      continue;
    }
    const [dx, dz] = dirs[0];
    const idx = dx !== 0 ? z : x;
    const pillar = idx % 3 === 0;
    if (pillar) {
      put(x, y, z, "white_concrete");
    } else {
      const props = dx !== 0
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      put(x, y, z, "light_blue_stained_glass_pane", props);
      // Warm light in the room behind some windows
      const ix = x - dx, iz = z - dz;
      const innerOk = inside(ix, iz) && outward(ix, iz).length === 0;
      if (innerOk && idx % 6 === 1 && (y === G + 3 || y === G + 7)) {
        put(ix, y, iz, "glowstone");
      }
    }
  }

  // Street entrance: dark oak door with glazed storey above
  if (isDoor) {
    const facing = dirs.some(([dx, dz]) => dz === -1) ? "north" : NAME[`${dirs[0][0]},${dirs[0][1]}`];
    put(x, G + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, G + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, G + 3, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  }

  // Parapet cap is already placed; railing-height roof plant handled above
}

g.save(`${DIR}/${ID}.nbt`);
