import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738281";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 17 x 23. Roof about 21 blocks above lowest ground.
// Read as a 1980s-90s Xinyi mid-rise: four storeys of 5 blocks, a stone
// plinth, white concrete piers, light-blue tinted glazing in grey spandrels,
// a shopfront ground floor on the street side, and a flat roof with a
// parapet and a small mechanical penthouse.
const W = 17, H = 33, D = 23;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup: "x,z" -> ground height
const inside = new Map();
for (const [x, z, gr] of cells) inside.set(`${x},${z}`, gr);
const has = (x, z) => inside.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missing = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz)).length;

const STOREYS = 4;      // 4 storeys x 5 blocks
const STEP = 5;
const ROOF = 20;        // roof slab offset above each cell's ground
const PARAPET = 21;     // parapet top offset

// Pass 1: foundations, floor slabs, roof slab, facade
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at each storey line, interior and edge alike
  for (let k = 0; k < STOREYS; k++) put(x, gr + STEP * k, z, "light_gray_concrete");

  // Roof slab
  put(x, gr + ROOF, z, "light_gray_concrete");

  const m = missing(x, z);
  if (m === 0) continue; // interior cell: no facade

  // Base course at street level on the perimeter
  put(x, gr, z, "stone_bricks");

  for (let k = 0; k < STOREYS; k++) {
    const base = gr + STEP * k;
    for (let o = 1; o <= 3; o++) {
      const y = base + o;
      const pier = m >= 2 || (x + z) % 3 === 0;
      put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
    }
    // Spandrel / cornice band at the top of each storey
    put(x, base + 4, z, "white_concrete");
  }

  // Parapet on the roof edge
  put(x, gr + PARAPET, z, "white_concrete");
}

// Pass 2: lit windows (glowstone set back behind the glass)
for (const [x, z, gr] of cells) {
  if (missing(x, z) === 0) continue;
  if ((x + z) % 6 !== 1) continue;
  // Only on glass cells
  if (missing(x, z) >= 2 || (x + z) % 3 === 0) continue;
  for (let k = 1; k < STOREYS; k++) {
    const y = gr + STEP * k + 2;
    const inward = DIRS
      .map(([dx, dz]) => [x + dx, z + dz])
      .find(([nx, nz]) => has(nx, nz) && missing(nx, nz) === 0);
    if (inward) put(inward[0], y, inward[1], "glowstone");
  }
}

// Pass 3: roof penthouse and rod at the centre
for (const [x, z, gr] of cells) {
  if (x >= 5 && x <= 11 && z >= 7 && z <= 15 && missing(x, z) === 0) {
    put(x, gr + ROOF + 1, z, "stone_bricks");
  }
}
{
  // Lightning rod on the penthouse centre if inside
  const c = cells.find(([x, z]) => x === 8 && z === 11);
  if (c) put(8, c[2] + ROOF + 2, 11, "lightning_rod");
}

// Pass 4: street-front entrance on the minimum-z edge, nearest the middle
{
  const edge = cells.filter(([x, z]) => missing(x, z) > 0);
  const zMin = Math.min(...edge.map(([, z]) => z));
  const xs = edge.filter(([, z]) => z === zMin).map(([x]) => x);
  const xMid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const [dx, dz, gr] = edge
    .filter(([, z]) => z === zMin)
    .sort((a, b) => Math.abs(a[0] - xMid) - Math.abs(b[0] - xMid))[0];

  // Piers flanking the door on the ground floor
  for (const ox of [dx - 1, dx + 1]) {
    if (!has(ox, dz)) continue;
    for (let o = 1; o <= 3; o++) put(ox, gr + o, dz, "white_concrete");
  }

  const doorProps = (half) => ({
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr + 1, dz, "oak_door", doorProps("lower"));
  put(dx, gr + 2, dz, "oak_door", doorProps("upper"));

  // Hanging lantern over the entrance
  put(dx, gr + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
