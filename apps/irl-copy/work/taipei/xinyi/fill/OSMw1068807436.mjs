import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807436";
const W = 20, H = 23, D = 24;

// Low-rise Xinyi mixed-use block (about two storeys, roof ~11 blocks above lowest ground):
// ground-floor shopfront with red sign band and a central entrance, upper storey with
// window grid of light-blue glass between light-grey concrete piers, stone cornice,
// flat roof deck with a green planter strip. Warm lights in the storefront and upper floor.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.round(gy));
const has = (x, z) => ground.has(`${x},${z}`);

let maxZ = -Infinity;
for (const [, z] of cells) if (z > maxZ) maxZ = z;

// Entrance: the two middle cells of the street-facing (south, max z) edge row.
const frontRow = cells
  .filter(([x, z]) => z === maxZ)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const n = frontRow.length;
const doorX = new Set(
  n >= 6 ? [frontRow[Math.floor(n / 2) - 1], frontRow[Math.floor(n / 2)]] : [frontRow[Math.floor(n / 2)]]
);

const isPerimeter = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gy] of cells) {
  const base = Math.round(gy);
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone");
}

for (const [x, z, gy] of cells) {
  const base = Math.round(gy);
  const per = isPerimeter(x, z);

  // Outward faces of this cell
  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");
  const corner = faces.length >= 2;
  const onFront = faces.includes("S");

  // Bay index along the face: pier every 4th bay, corners always piers.
  const idx = faces.includes("N") || faces.includes("S") ? x : z;
  const pier = per && (corner || idx % 4 === 0);
  const door = per && onFront && !corner && doorX.has(x) && z === maxZ;

  // Interior floors and roof deck (every footprint cell)
  g.set(x, base + 0, z, per ? "polished_andesite" : "smooth_stone");
  g.set(x, base + 5, z, "smooth_stone");
  g.set(x, base + 10, z, per ? "stone_bricks" : "gray_concrete");

  if (!per) {
    // Interior: air gaps, with warm lights and a green roof strip
    if ((x + z) % 6 === 0) g.set(x, base + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    if ((x + 2 * z) % 7 === 0) g.set(x, base + 6, z, "shroomlight");
    if (x % 6 === 3 && z % 6 === 3) g.set(x, base + 10, z, "moss_block");
    continue;
  }

  // Ground floor (h 1-3): shopfront glass between piers, entrance door in the middle
  for (let h = 1; h <= 3; h++) {
    if (door) {
      const hingeLeft = x === frontRow[Math.floor(n / 2) - 1] || (n < 6 && x === frontRow[Math.floor(n / 2)]);
      if (h === 1) g.set(x, base + h, z, "dark_oak_door", { facing: "north", half: "lower", hinge: hingeLeft ? "left" : "right", open: "false", powered: "false" });
      else if (h === 2) g.set(x, base + h, z, "dark_oak_door", { facing: "north", half: "upper", hinge: hingeLeft ? "left" : "right", open: "false", powered: "false" });
      else g.set(x, base + h, z, "glass");
    } else if (pier) {
      g.set(x, base + h, z, "light_gray_concrete");
    } else {
      g.set(x, base + h, z, "glass");
    }
  }

  // h4: ground-floor sign band (red on the street face), storey line elsewhere
  if (pier) g.set(x, base + 4, z, "light_gray_concrete");
  else g.set(x, base + 4, z, onFront ? "red_concrete" : "smooth_stone");

  // Upper floor (h 6-9): sill, windows, lintel; piers in light grey concrete
  if (pier) {
    for (let h = 6; h <= 9; h++) g.set(x, base + h, z, "light_gray_concrete");
  } else {
    g.set(x, base + 6, z, "white_concrete");
    g.set(x, base + 7, z, "light_blue_stained_glass");
    g.set(x, base + 8, z, "light_blue_stained_glass");
    g.set(x, base + 9, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
