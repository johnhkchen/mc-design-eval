// OSMw965224970: unnamed Xinyi-district low-rise commercial block, Taipei.
// Era: 1980s-90s Taiwanese shophouse-office. Two storeys (about 5 blocks each)
// under a parapet, so the roof reads about 11 blocks above the lowest ground.
// Walls are white concrete with light-grey storey bands and cornice, glass-pane
// window grids with piers, a shopfront storey with a central door on the street
// side, and a few roof units. Warm glowstone sits behind some glass.
// Hollow shell: interior cells hold only floor slabs, so no interiors are built.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw965224970";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 22, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Minecraft: north is -z, south is +z, west is -x, east is +x.
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const openSides = (x, z) =>
  Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));

// Street-side facade: prefer south, else the first exposed side found.
const FRONT = (() => {
  if (cells.some(([x, z]) => openSides(x, z).includes("south"))) return "south";
  for (const d of ["north", "east", "west"])
    if (cells.some(([x, z]) => openSides(x, z).includes(d))) return d;
  return "south";
})();

// Entrance: middle cell of the front face.
const frontCells = cells
  .filter(([x, z]) => openSides(x, z).includes(FRONT))
  .sort((a, b) => {
    const ax = FRONT === "north" || FRONT === "south" ? 0 : 1;
    return a[ax] - b[ax];
  });
const doorKey = frontCells.length
  ? `${frontCells[Math.floor(frontCells.length / 2)][0]},${frontCells[Math.floor(frontCells.length / 2)][1]}`
  : null;

const paneProps = (f) =>
  f === "north" || f === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Foundations and interior floor slabs first, then perimeter shell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const sides = openSides(x, z);
  if (sides.length === 0) {
    // Interior: floor slabs only, no interior rooms.
    if (gr <= 10) g.set(x, gr, z, "smooth_stone");
    if (gr < 5) g.set(x, 5, z, "smooth_stone");
    if (gr < 10) g.set(x, 10, z, "smooth_stone");
    if (gr <= 9 && x % 6 === 3 && z % 5 === 2) g.set(x, 11, z, "iron_block"); // roof unit
    continue;
  }

  // Perimeter shell.
  const f = sides.includes(FRONT) ? FRONT : sides[0];
  const axis = f === "north" || f === "south" ? x : z;
  const isDoor = `${x},${z}` === doorKey;
  const windowCol = axis % 3 !== 0;

  // Inward interior cell behind the facade (for glowstone behind glass).
  const inX = x - DIRS[f][0], inZ = z - DIRS[f][1];
  const inwardInterior = has(inX, inZ) && openSides(inX, inZ).length === 0;

  for (let y = gr; y <= 11; y++) {
    if (y === gr) {
      g.set(x, y, z, "polished_granite"); // base course
      continue;
    }
    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: f,
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (y === 4) { g.set(x, y, z, "light_gray_concrete"); continue; } // transom
    if (y === 5) { g.set(x, y, z, "light_gray_concrete"); continue; } // storey line
    if (y === 6 || y === 9) { g.set(x, y, z, "white_concrete"); continue; }
    if (y === 10) { g.set(x, y, z, "light_gray_concrete"); continue; } // cornice
    if (y === 11) {
      g.set(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" }); // parapet cap
      continue;
    }
    // Window rows: storey 1 at y 1..3 (3 is lintel by the door), storey 2 at y 7..8.
    const isGlassRow = (y >= 1 && y <= 3) || y === 7 || y === 8;
    if (!isGlassRow) { g.set(x, y, z, "white_concrete"); continue; }
    if (isDoor && y === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (!windowCol) { g.set(x, y, z, "white_concrete"); continue; } // pier
    g.set(x, y, z, "glass_pane", paneProps(f));
    if (inwardInterior && ((x * 7 + z * 5 + y) % 9 === 0)) {
      g.set(inX, y, inZ, "glowstone"); // warm light behind the glass
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
