import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "OSMw1071343800";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 31, H = 23, D = 17;
const ROOF = 11;      // roof slab top, blocks above lowest ground
const PARAPET = 12;   // parapet course on the perimeter
const EQUIP = 13;     // roof plant height

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw
  .map(([x, z, g]) => [Math.round(x), Math.round(z), Math.min(10, Math.max(0, Math.round(g)))])
  .filter(([x, z]) => x >= 0 && x < W && z >= 0 && z < D);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const has = (x, z) => ground.has(key(x, z));

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const exteriorSides = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Main entrance: a south-facing perimeter cell nearest the middle of the facade.
let door = null;
for (const [x, z] of cells) {
  if (!exteriorSides(x, z).some((d) => d.name === "south")) continue;
  if (!door || Math.abs(x - 15) < Math.abs(door.x - 15)) door = { x, z };
}

const g = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  const gl = gr;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gl; y++) g.set(x, y, z, "stone_bricks");

  const sides = exteriorSides(x, z);
  const perimeter = sides.length > 0;
  const side = sides[0];

  // Base course / floor slab at ground level.
  g.set(x, gl, z, perimeter ? "stone_bricks" : "light_gray_concrete");

  if (!perimeter) {
    // Interior: floor slabs at storey lines, roof slab, air between.
    for (let y = gl + 1; y <= PARAPET; y++) {
      if (y === 5 || y === ROOF) g.set(x, y, z, "light_gray_concrete");
    }
    // Roof plant on a sparse grid.
    if (x % 8 === 4 && z % 5 === 2) {
      g.set(x, ROOF + 1, z, "gray_concrete");
      g.set(x, EQUIP, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter: facade. Panes run along the wall they sit in.
  const wallAlongX = side.dz !== 0;
  const idx = wallAlongX ? x : z;
  const paneProps = wallAlongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isDoor = door && door.x === x && door.z === z;

  for (let y = gl + 1; y <= PARAPET; y++) {
    if (y === PARAPET) {
      g.set(x, y, z, "white_concrete");
    } else if (y === ROOF) {
      g.set(x, y, z, "smooth_stone");                        // cornice
    } else if (y === 10) {
      g.set(x, y, z, "white_concrete");                      // spandrel
    } else if (y >= 6 && y <= 9) {
      if (idx % 3 === 0) {
        g.set(x, y, z, "white_concrete");                    // mullion
      } else {
        g.set(x, y, z, "glass_pane", paneProps);
        // Warm light in the room behind some windows (interior neighbour, if any).
        if (y === 7 && idx % 6 === 1) {
          const ix = x - side.dx, iz = z - side.dz;
          if (has(ix, iz) && ground.get(key(ix, iz)) < 7 && exteriorSides(ix, iz).length === 0) {
            g.set(ix, 7, iz, "glowstone");
          }
        }
      }
    } else if (y === 5) {
      g.set(x, y, z, "smooth_stone");                        // storey line
    } else if (y === 4) {
      g.set(x, y, z, "smooth_stone");                        // shopfront lintel
    } else {
      // Shopfront, ground floor.
      if (isDoor && (y === gl + 1 || y === gl + 2)) {
        // Door is placed below.
        continue;
      }
      if (idx % 4 === 0) g.set(x, y, z, "polished_andesite"); // shopfront posts
      else g.set(x, y, z, "glass_pane", paneProps);
    }
  }

  if (isDoor && gl + 2 < ROOF) {
    const facing = "south";
    g.set(x, gl + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gl + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    if (gl + 3 < 4) g.set(x, gl + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
