import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise commercial/office block, c. 1990s-2000s Xinyi style:
// white concrete piers, light-grey storey spandrels, blue-glass curtain wall,
// stone base, cornice and parapet, plain penthouse with a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397476";
const W = 21, H = 38, D = 17;

const ROOF = 25;   // roof deck layer; parapet sits at ROOF + 1 = 26
const LINE0 = 26;  // storey lines at 26, 21, 16, 11, 6, 1 (5 blocks per storey)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, Math.round(gy));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const has = (x, z) => ground.has(`${x},${z}`);
const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const isLine = (y) => (LINE0 - y) % 5 === 0;
const exposed = (x, z) =>
  Object.entries(FACES).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([f]) => f);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: south-facing exposed cell nearest the middle of the frontage.
const midX = (minX + maxX) / 2;
const southCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => exposed(x, z).includes("south"))
  .sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
const entrance = southCells[0] ?? null;

// Penthouse box, inset from the footprint edges so it is never exposed.
const pxMin = minX + 6, pxMax = maxX - 6, pzMin = minZ + 4, pzMax = maxZ - 4;
const inPH = (x, z) => x >= pxMin && x <= pxMax && z >= pzMin && z <= pzMax && has(x, z);
const mx = Math.round((pxMin + pxMax) / 2), mz = Math.round((pzMin + pzMax) / 2);

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gy = ground.get(`${x},${z}`);
  const exp = exposed(x, z);
  const corner = exp.length >= 2;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Body: storeys from ground up to the roof deck.
  for (let y = gy; y < ROOF; y++) {
    if (exp.length === 0) {
      // Interior: only floor slabs at storey lines, air elsewhere (no interiors).
      if (isLine(y) && y > gy) put(x, y, z, "smooth_stone");
      continue;
    }

    const face = exp[0];
    const [nx, nz] = FACES[face];

    // Entrance: double door with a white lintel above.
    if (entrance && x === entrance[0] && z === entrance[1]) {
      if (y === gy) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gy + 1) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === gy + 2) {
        put(x, y, z, "white_concrete");
        continue;
      }
    }

    const along = nz !== 0 ? x : z;
    const pier = corner || along % 3 === 0;
    let id;
    if (y === gy) id = "stone_bricks";                  // base course
    else if (isLine(y)) id = "light_gray_concrete";     // storey spandrel
    else if (pier) id = "white_concrete";               // mullion / pier
    else id = "light_blue_stained_glass";               // glazing

    put(x, y, z, id);

    // Warm light behind some glass, in the interior cell beside the window.
    if (id === "light_blue_stained_glass" && (x * 3 + y * 7 + z * 5) % 7 === 0) {
      const ix = x - nx, iz = z - nz;
      if (has(ix, iz) && exposed(ix, iz).length === 0 && !isLine(y)) {
        put(ix, y, iz, (x + y) % 2 ? "shroomlight" : "glowstone");
      }
    }
  }

  // Roof deck (interior) and cornice (edge), then parapet on the edge.
  if (gy <= ROOF) put(x, ROOF, z, exp.length ? "smooth_stone" : "light_gray_concrete");
  if (exp.length) put(x, ROOF + 1, z, "white_concrete");
}

// Penthouse: gray concrete walls with a glass band, ceiling slab, roof slab.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!inPH(x, z)) continue;
  const ring = !(inPH(x + 1, z) && inPH(x - 1, z) && inPH(x, z + 1) && inPH(x, z - 1));
  for (let y = ROOF + 1; y <= 29; y++) {
    if (!ring) continue;
    put(x, y, z, y === 27 || y === 28 ? "light_blue_stained_glass" : "gray_concrete");
  }
  put(x, 30, z, "smooth_stone");
  put(x, 31, z, "stone_brick_slab", { type: "bottom" });
}

// Mast on the penthouse roof.
if (has(mx, mz) && inPH(mx, mz)) {
  for (let y = 32; y <= 36; y++) put(mx, y, mz, "iron_bars");
  put(mx, 37, mz, "lightning_rod", { facing: "up" });
}

g.save(`${DIR}/${ID}.nbt`);
