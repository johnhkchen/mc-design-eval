import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075559";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey low-rise commercial block, 1980s-90s Taipei: stone plinth,
// white-tiled concrete piers, glazed bays, parapet roof with rooftop units.
const W = 14, H = 20, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));

const has = (x, z) => ground.has(key(x, z));
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of ground.keys().map ? [...ground.keys()].map(k => k.split(",").map(Number)) : []) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Front (street) wall is the z = minZ side; pick a door cell near its middle.
const frontCells = [...ground.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => z === minZ && edge(x, z))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : -1;

const paneProps = (x, z) => {
  const alongX = (z === minZ || z === maxZ); // runs east-west
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

for (const [k, b] of ground) {
  const [x, z] = k.split(",").map(Number);
  const isEdge = edge(x, z);

  // Foundation and base course: solid from y 0 up to the cell's ground.
  for (let y = 0; y <= b; y++) g.set(x, y, z, "stone_bricks");

  // Floor slab at the second storey and the roof deck, on every footprint cell.
  g.set(x, b + 4, z, isEdge ? "white_concrete" : "smooth_stone");
  g.set(x, b + 8, z, "smooth_stone");

  if (!isEdge) {
    // Rooftop units on a grid, standing on the roof deck.
    if (x % 5 === 2 && z % 4 === 2) g.set(x, b + 9, z, "light_gray_concrete");
    continue;
  }

  const corner = (x === minX || x === maxX) && (z === minZ || z === maxZ);
  const alongX = (z === minZ || z === maxZ);
  const rel = alongX ? x - minX : z - minZ;
  const windowBay = !corner && rel % 3 === 1;
  const isDoor = z === minZ && x === doorX;

  // Ground storey: shopfront glazing between white piers, door on the street side.
  if (isDoor) {
    g.set(x, b + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, b + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    for (const y of [b + 1, b + 2]) {
      g.set(x, y, z, windowBay ? "glass_pane" : "white_concrete", windowBay ? paneProps(x, z) : undefined);
    }
  }
  g.set(x, b + 3, z, "white_concrete"); // ground-storey lintel

  // Storey line between the two storeys.
  g.set(x, b + 4, z, "white_concrete");

  // Upper storey: window bays with a head band.
  for (const y of [b + 5, b + 6]) {
    g.set(x, y, z, windowBay ? "glass_pane" : "white_concrete", windowBay ? paneProps(x, z) : undefined);
  }
  g.set(x, b + 7, z, "white_concrete");

  // Warm light behind every other upper window, set in a two-deep air gap.
  if (windowBay && rel % 6 === 1) {
    const dx = x === minX ? 1 : x === maxX ? -1 : 0;
    const dz = z === minZ ? 1 : z === maxZ ? -1 : 0;
    const tx = x + 2 * dx, tz = z + 2 * dz;
    if (has(tx, tz) && !edge(tx, tz) && ground.get(key(tx, tz)) === b) {
      g.set(tx, b + 5, tz, "glowstone");
    }
  }

  // Parapet with cornice line.
  g.set(x, b + 8, z, "smooth_stone");
  g.set(x, b + 9, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
