import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw1016280234: no record. Decided from the lidar roof height (about 21 blocks above
// the lowest ground) and the Xinyi streetscape: a four-storey reinforced-concrete
// commercial block of the 1980s-90s. Pale concrete frame, glazed bays, a shopfront
// at street level, a white parapet, and the rooftop water tanks typical of Taipei.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280234";
const W = 20, H = 33, D = 16;
const STOREY = 5;
const STOREYS = 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`);

// Floor level of the building: the lowest ground under the footprint.
const datum = Math.min(...cells.map(c => c[2]));
// Each cell's structure starts at the higher of its own ground and the datum.
const baseOf = (x, z) => Math.max(groundOf(x, z), datum);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces of a footprint cell (a neighbour missing from the footprint).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ n: "north", dx: 0, dz: -1, along: "x" });
  if (!has(x, z + 1)) f.push({ n: "south", dx: 0, dz: 1, along: "x" });
  if (!has(x - 1, z)) f.push({ n: "west", dx: -1, dz: 0, along: "z" });
  if (!has(x + 1, z)) f.push({ n: "east", dx: 1, dz: 0, along: "z" });
  return f;
}
const isPerim = (x, z) => has(x, z) && faces(x, z).length > 0;

// 1. Foundation and plinth: natural ground below each cell, stone-brick plinth up to the datum.
for (const [x, z, gy] of cells) {
  const base = baseOf(x, z);
  for (let y = 0; y < base; y++) {
    put(x, y, z, y < gy ? "stone" : "stone_bricks");
  }
}

// 2. Floor slabs per storey (and the roof slab on top), one block thick, no interiors.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const base = baseOf(x, z);
  for (let k = 0; k <= STOREYS; k++) {
    const y = datum + STOREY * k;
    if (y < base) continue;
    put(x, y, z, k < STOREYS ? "smooth_stone" : "light_gray_concrete");
  }
}

// 3. Facade: each perimeter cell gets a glazed band between concrete spandrels.
const perimCells = cells.filter(([x, z]) => isPerim(x, z));

// Find the street entrance: the middle of the south (z+) facing cells.
const southXs = perimCells
  .filter(([x, z]) => faces(x, z).some(f => f.n === "south"))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : null;

for (const [x, z] of perimCells) {
  const fs = faces(x, z);
  const base = baseOf(x, z);
  const f = fs[0];
  const corner = fs.length >= 2;

  for (let k = 0; k < STOREYS; k++) {
    const L = datum + STOREY * k;
    for (let y = L + 1; y <= L + 4; y++) {
      if (y < base) continue;
      if (corner) {
        put(x, y, z, "white_concrete");
        continue;
      }
      const i = f.along === "x" ? x : z;
      const pier = i % 3 === 0;
      let id;
      if (k === 0) {
        if (y === L + 1) id = "polished_andesite";
        else if (y === L + 4) id = "smooth_stone";            // canopy fascia over the shopfront
        else id = pier ? "dark_oak_planks" : "light_blue_stained_glass";
      } else {
        if (y === L + 1) id = "light_gray_concrete";
        else if (y === L + 4) id = "white_concrete";          // storey line
        else id = pier ? "white_concrete" : "light_blue_stained_glass";
      }
      put(x, y, z, id);
    }
  }
}

// 4. Entrance door on the street face, centred.
if (doorX !== null) {
  const z = Math.max(...perimCells.filter(([x]) => x === doorX).map(c => c[1]));
  const f = faces(doorX, z).find(ff => ff.n === "south");
  if (f && baseOf(doorX, z) <= datum + 1) {
    const props = (half) => ({ facing: f.n, half, hinge: "left", open: "false", powered: "false" });
    put(doorX, datum + 1, z, "oak_door", props("lower"));
    put(doorX, datum + 2, z, "oak_door", props("upper"));
  }
}

// 5. Warm light behind some windows: glowstone set just inside the glass.
for (const [x, z] of perimCells) {
  const fs = faces(x, z);
  if (fs.length !== 1) continue;
  const f = fs[0];
  const i = f.along === "x" ? x : z;
  for (let k = 0; k < STOREYS; k++) {
    const L = datum + STOREY * k;
    if (((i + k) % 4) !== 1 || i % 3 === 0) continue;
    const ix = x - f.dx, iz = z - f.dz;
    if (!has(ix, iz) || isPerim(ix, iz)) continue;
    const y = L + 2;
    if (y < baseOf(ix, iz)) continue;
    put(ix, y, iz, "glowstone");
  }
}

// 6. Parapet on the perimeter, one block above the roof slab.
const parapetY = datum + STOREY * STOREYS + 1;
for (const [x, z] of perimCells) {
  put(x, parapetY, z, "white_concrete");
}

// 7. Roof equipment: two water tanks and a plant box, set on the roof slab.
const roofY = datum + STOREY * STOREYS + 1; // first block above roof slab
const interiorBlock = (x0, z0, w, d) => {
  for (let x = x0; x < x0 + w; x++)
    for (let z = z0; z < z0 + d; z++)
      if (!isPerim(x, z) || !has(x, z)) return false;
  return true;
};
const tanks = [[5, 4, 2, 2], [12, 9, 2, 2]];
for (const [tx, tz, tw, td] of tanks) {
  if (!interiorBlock(tx, tz, tw, td)) continue;
  if (roofY + 2 >= H) continue;
  for (let x = tx; x < tx + tw; x++)
    for (let z = tz; z < tz + td; z++) {
      put(x, roofY, z, "iron_block");
      put(x, roofY + 1, z, "iron_block");
      put(x, roofY + 2, z, "smooth_stone");
    }
}
// plant box on the other side
if (interiorBlock(14, 3, 3, 2) && roofY < H) {
  for (let x = 14; x < 17; x++)
    for (let z = 3; z < 5; z++)
      put(x, roofY, z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
