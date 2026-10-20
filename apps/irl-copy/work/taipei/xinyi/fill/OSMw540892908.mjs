import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-district low-rise commercial block, c. 1990s: two storeys of
// white concrete over a stone-brick base, a shopfront on the street (south) face,
// a plain cornice, a parapet with coping, rooftop plant and a lightning rod.
// Storeys are absolute: floor 1 = y 0..4, floor 2 = y 5..9, roof at y 10, parapet to y 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540892908";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 36, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const maxZ = Math.max(...cells.map(c => c[1]));
const minZ = Math.min(...cells.map(c => c[1]));
const southXs = cells.filter(c => c[1] === maxZ).map(c => c[0]);
const center = Math.round((Math.min(...southXs) + Math.max(...southXs)) / 2);

const paneAlongX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneAlongZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const windows = [];

function wallCell(face, a, x, y, z, gr) {
  const alongX = face === "S" || face === "N";
  const pane = alongX ? paneAlongX : paneAlongZ;

  // Street-face door, centred on the south frontage, at the ground floor.
  if (face === "S" && a === center && (y === gr + 1 || y === gr + 2)) {
    const half = y === gr + 1 ? "lower" : "upper";
    put(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
    return;
  }
  if (y === 9) return put(x, y, z, "smooth_stone");           // cornice
  if (y === 5) return put(x, y, z, "smooth_stone");           // storey belt course
  if (y === gr) return put(x, y, z, "stone_bricks");          // base course
  if (y % 5 === 0 || y % 5 === 4) return put(x, y, z, "white_concrete"); // spandrels

  // Window band (y % 5 in 1..3)
  const shop = face === "S" && y < 5;
  const mullion = shop ? a % 6 === 0 : a % 3 === 0;
  if (mullion) return put(x, y, z, "polished_andesite");
  put(x, y, z, "glass_pane", pane);
  windows.push({ x, y, z, face, a, gr });
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
  const per = ex.n || ex.s || ex.w || ex.e;

  for (let y = gr; y <= 9; y++) {
    if (!per) {
      // Interior: air, with a floor slab at the storey line.
      if (y === 5 && gr <= 5) put(x, y, z, "smooth_stone");
      continue;
    }
    if ((ex.n || ex.s) && (ex.w || ex.e)) {
      put(x, y, z, "light_gray_concrete"); // corner pillar
      continue;
    }
    const face = ex.s ? "S" : ex.n ? "N" : ex.w ? "W" : "E";
    const a = (face === "S" || face === "N") ? x : z;
    wallCell(face, a, x, y, z, gr);
  }

  // Roof slab at y 10 (interior) and parapet + coping on the perimeter.
  if (per) {
    put(x, 10, z, "white_concrete");
    put(x, 11, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  } else {
    put(x, 10, z, "light_gray_concrete");
  }
}

// Rooftop plant: AC units on the roof slab (interior cells only).
const plant = [[8, 3], [9, 3], [10, 3], [8, 4], [9, 4], [10, 4], [25, 7], [26, 7], [27, 7], [25, 8], [26, 8], [27, 8]];
for (const [x, z] of plant) {
  if (has(x, z) && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1)) {
    put(x, 11, z, "iron_block");
  }
}

// Lightning rod on the roof centre.
if (has(18, 6)) {
  put(18, 11, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(18, 12, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Warm light: glowstone behind a sparse selection of glazed windows.
for (const w of windows) {
  if (((w.a * 5 + w.y) % 13) !== 0) continue;
  let ix = w.x, iz = w.z;
  if (w.face === "S") iz -= 1;
  else if (w.face === "N") iz += 1;
  else if (w.face === "W") ix += 1;
  else ix -= 1;
  if (!has(ix, iz) || w.y < (G.get(`${ix},${iz}`) ?? 0)) continue;
  put(ix, w.y, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
