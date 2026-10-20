import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833640";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const g = new Voxels([18, 23, 25]);

// Era and type: a 1980s-style two-storey commercial block with a shopfront,
// pale concrete walls, red-brown terracotta bands (Taiwanese tile and trim),
// a flat roof with a parapet and small rooftop plant.

const key = (x, z) => `${x},${z}`;
const F = new Map();
for (const [x, z, gr] of cells) F.set(key(x, z), gr);
const has = (x, z) => F.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward sides of a perimeter cell
function outwardSides(x, z) {
  const s = [];
  if (!has(x, z - 1)) s.push({ name: "north", dx: 0, dz: -1 });
  if (!has(x, z + 1)) s.push({ name: "south", dx: 0, dz: 1 });
  if (!has(x + 1, z)) s.push({ name: "east", dx: 1, dz: 0 });
  if (!has(x - 1, z)) s.push({ name: "west", dx: -1, dz: 0 });
  return s;
}

// Entrance: median x of south-facing wall cells
const southX = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southX.length ? southX[Math.floor(southX.length / 2)] : -1;

const paneProps = (axisEW) => ({
  north: axisEW ? "false" : "true",
  south: axisEW ? "false" : "true",
  east: axisEW ? "true" : "false",
  west: axisEW ? "true" : "false",
  waterlogged: "false",
});

for (const [x, z, gr] of cells) {
  const base = gr; // body starts on this cell's ground
  const top = base + 11; // parapet cap, about 11 blocks above lowest ground

  // Foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs and roof slab across the whole footprint
  put(x, base + 0, z, "smooth_stone");          // ground floor slab
  put(x, base + 5, z, "light_gray_concrete");   // second floor slab
  put(x, base + 10, z, "light_gray_concrete");  // roof slab

  const sides = outwardSides(x, z);

  if (sides.length === 0) {
    // Interior: rooftop plant and warm light (behind glass handled below)
    if (x % 5 === 2 && z % 6 === 2) put(x, base + 11, z, "iron_block");
    continue;
  }

  // Corner column
  if (sides.length >= 2) {
    for (let h = 1; h <= 9; h++) put(x, base + h, z, "white_concrete");
    put(x, base + 0, z, "polished_andesite");
    put(x, base + 10, z, "red_terracotta");
    put(x, base + 11, z, "white_concrete");
    continue;
  }

  const side = sides[0];
  const isNS = side.name === "north" || side.name === "south";
  const along = isNS ? x : z;
  const pier = along % 3 === 0;
  const isDoor = side.name === "south" && x === doorX && !pier;

  // Base course
  put(x, base + 0, z, "polished_andesite");

  // Shopfront (h1..h3), lintel h4
  for (let h = 1; h <= 3; h++) {
    if (isDoor) {
      if (h === 1) put(x, base + h, z, "dark_oak_door", { facing: side.name, half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (h === 2) put(x, base + h, z, "dark_oak_door", { facing: side.name, half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, base + h, z, "glass_pane", paneProps(isNS));
    } else if (pier) {
      put(x, base + h, z, "white_concrete");
    } else {
      put(x, base + h, z, "glass_pane", paneProps(isNS));
    }
  }
  put(x, base + 4, z, "red_terracotta"); // shop lintel / canopy band

  // Storey line
  put(x, base + 5, z, pier ? "white_concrete" : "light_gray_concrete");

  // Upper storey windows (h6..h9)
  for (let h = 6; h <= 9; h++) {
    if (pier) put(x, base + h, z, "white_concrete");
    else put(x, base + h, z, "glass_pane", paneProps(isNS));
  }

  // Cornice and parapet
  put(x, base + 10, z, "red_terracotta");
  put(x, base + 11, z, "white_concrete");

  // Warm light behind some glass: glowstone on the inside cell
  const ix = x - side.dx;
  const iz = z - side.dz;
  if (has(ix, iz) && !pier) {
    if (along % 6 === 1) put(ix, base + 7, iz, "glowstone");
    if (along % 6 === 4 && !isDoor) put(ix, base + 2, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
