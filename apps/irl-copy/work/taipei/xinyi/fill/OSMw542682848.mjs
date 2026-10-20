import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682848";
const W = 20, H = 23, D = 42;

// [x, z, ground] per footprint cell; y 0 is the lowest ground under the footprint.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.round(gr)));
}

const minG = Math.min(...ground.values());
// Roof about 11 blocks above the lowest ground; level across the whole footprint.
const T = Math.min(H - 1, minG + 11);

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};
const has = (x, z) => ground.has(key(x, z));
const isBoundary = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const nearBoundary = (x, z) =>
  [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([a, b]) => has(a, b) && isBoundary(a, b));

// Entrance: on the north face (min z), the cell closest to the middle of the frontage.
let entrance = null;
{
  const northFace = [...ground.keys()]
    .map((k) => k.split(",").map(Number))
    .filter(([x, z]) => isBoundary(x, z) && !has(x, z - 1));
  const pool = northFace.length ? northFace : [...ground.keys()].map((k) => k.split(",").map(Number));
  const minZ = Math.min(...pool.map(([, z]) => z));
  const row = pool.filter(([, z]) => z === minZ);
  const midX = (W - 1) / 2;
  row.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
  entrance = row[0];
}
const [ex, ez] = entrance;

// Mechanical plant zone on the roof (interior cells near the centre).
const plant = (x, z) => x >= 5 && x <= 14 && z >= 14 && z <= 26;

for (const [k, g0] of ground) {
  const [x, z] = k.split(",").map(Number);
  const g = Math.min(g0, T - 3);
  const bnd = isBoundary(x, z);
  const deck = Math.max(T - 2, g + 1);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  // Base course / ground floor slab.
  put(x, g, z, bnd ? "stone_bricks" : "smooth_stone");

  // Ground floor (storey 1): shopfront on the outer ring.
  if (bnd) {
    for (let y = g + 1; y <= g + 3; y++) {
      const pillar = (x + z) % 3 === 0;
      put(x, y, z, pillar ? "white_concrete" : "light_blue_stained_glass");
    }
    put(x, g + 4, z, "white_concrete");
  }

  // Storey line between storeys.
  if (g + 5 < deck) put(x, g + 5, z, "smooth_stone");

  // Upper storey: window grid with sills and a cornice course.
  if (bnd && g + 6 <= deck - 2) {
    for (let y = g + 6; y <= deck - 2; y++) {
      const pillar = (x + z) % 3 === 0;
      if (y === g + 6) put(x, y, z, "white_concrete");
      else if (y === deck - 2) put(x, y, z, "stone_bricks");
      else put(x, y, z, pillar ? "white_concrete" : "light_blue_stained_glass");
    }
  }

  // Warm lights behind the glass in the inner ring.
  if (!bnd && nearBoundary(x, z) && (x * 5 + z * 3) % 13 === 0) {
    if (g + 7 < deck - 1) put(x, g + 7, z, "glowstone");
    if (g + 1 < deck - 1 && (x + z) % 2 === 0) put(x, g + 1, z, "glowstone");
  }

  // Roof deck.
  put(x, deck, z, "gray_concrete");

  // Parapet and cap on the outer ring.
  if (bnd) {
    for (let y = deck + 1; y <= T - 1; y++) put(x, y, z, "white_concrete");
    if (T > deck) put(x, T, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }

  // Roof plant room on the interior.
  if (!bnd && deck === T - 2 && plant(x, z)) {
    put(x, deck + 1, z, "light_gray_concrete");
    put(x, deck + 2, z, "light_gray_concrete");
  }
}

// Entrance: door on the north face with a small canopy over it.
{
  const g = Math.min(ground.get(key(ex, ez)), T - 3);
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(ex, g + 1, ez, "dark_oak_door", doorProps("lower"));
  put(ex, g + 2, ez, "dark_oak_door", doorProps("upper"));
  for (const dx of [-1, 0, 1]) {
    if (has(ex + dx, ez)) {
      put(ex + dx, g + 3, ez, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
