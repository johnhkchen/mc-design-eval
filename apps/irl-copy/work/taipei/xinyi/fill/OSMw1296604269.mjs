import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1296604269";
const W = 21, D = 10, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const foot = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) foot.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => foot.has(`${x},${z}`);
const minG = Math.min(...foot.values());
const base = minG;                 // lowest ground under footprint
const ROOF = base + 10;            // parapet row; roof reads ~11 blocks above lowest ground

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// facade block for exterior cell at storey row r (r = y - base)
function facade(x, z, r) {
  const long = z === 0 || z === D - 1;
  const end = !long && (x === 0 || x === W - 1);
  if (!long && !end) return ["white_concrete"];
  const pos = long ? x : z;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const pier = corner || pos % 3 === 0;

  if (r === 0) return ["stone_bricks"];
  if (r === 4) return ["red_concrete"];                    // shop signage band
  if (r === 5 || r === 9) return ["smooth_quartz"];        // floor band, cornice
  if (r === 10) return ["quartz_slab", { type: "top", waterlogged: "false" }]; // parapet cap
  if (pier) return ["smooth_quartz"];
  if (long) {
    return ["light_blue_stained_glass_pane",
      { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }];
  }
  return ["light_blue_stained_glass_pane",
    { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
}

for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exterior =
    x === 0 || x === W - 1 || z === 0 || z === D - 1 ||
    !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  if (!exterior) {
    // interior: floor slabs and roof deck only, air between
    put(x, gr, z, "smooth_stone");
    if (base + 5 > gr) put(x, base + 5, z, "smooth_stone");
    put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // exterior shell: base course, storeys, parapet
  for (let r = Math.max(0, gr - base); r <= 10; r++) {
    const y = base + r;
    if (y <= gr - 1 && r !== 0) continue;
    const y0 = base + r;
    if (r === 0 && y0 < gr) continue;

    const x2 = x, z2 = z;
    // door at the entrance (north face, centre)
    if (z === 0 && x === 10 && (r === 1 || r === 2)) {
      put(x2, y0, z2, "dark_oak_door", {
        facing: "south",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    const [id, props] = facade(x, z, r);
    put(x2, y0, z2, id, props);
  }
  // ensure the base course row sits at the cell ground
  put(x, gr, z, "stone_bricks");
}

// interior air-gap lights behind the glass (warm, dusk-visible)
for (const x of [4, 10, 16]) {
  if (has(x, 1)) put(x, base + 7, 1, "shroomlight");
}
for (const x of [7, 13]) {
  if (has(x, 8)) put(x, base + 7, 8, "shroomlight");
}
if (has(4, 1)) put(4, base + 2, 1, "glowstone");
if (has(16, 8)) put(16, base + 2, 8, "glowstone");

// rooftop penthouse / plant room
for (let x = 7; x <= 13; x++) {
  for (let z = 3; z <= 6; z++) {
    if (!has(x, z)) continue;
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}
// small roof lantern on the penthouse corner
if (has(7, 3)) put(7, ROOF + 3, 3, "lantern", { hanging: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
