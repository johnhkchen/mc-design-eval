import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408121";
const W = 21, H = 23, D = 19;

// Record: two-storey (about 11 block) commercial mid-block building, 1990s-2000s Xinyi
// fabric: white-tiled concrete body, stone base, blue-tinted glazing, shopfront ground floor,
// cornice and parapet, rooftop plant room with lightning rod.

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) {
  const [x, z, gy] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, Math.round(gy));
}
const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));
const cells = [...ground.keys()].map((k) => k.split(",").map(Number));

const DIRS = {
  N: [0, -1, "north"],
  S: [0, 1, "south"],
  W: [-1, 0, "west"],
  E: [1, 0, "east"],
};
const exposed = (x, z) =>
  Object.keys(DIRS).filter(([d]) => {
    const [dx, dz] = DIRS[d];
    return !has(x + dx, z + dz);
  });

const perim = new Set();
const exposedMap = new Map();
for (const [x, z] of cells) {
  const e = exposed(x, z);
  exposedMap.set(key(x, z), e);
  if (e.length) perim.add(key(x, z));
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const topOf = (gy) => Math.min(H - 4, Math.max(11, gy + 6));

// ---- body, floors, roof cap, foundations ----
for (const [x, z] of cells) {
  const gy = ground.get(key(x, z));
  const top = topOf(gy);

  // foundation up to ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  // ground floor slab
  put(x, gy, z, "stone_bricks");
  // upper floor slab(s)
  for (let fy = gy + 5; fy < top; fy += 5) put(x, fy, z, "light_gray_concrete");
  // roof cap
  put(x, top, z, "smooth_stone");
}

// ---- perimeter walls: shopfront ground floor, bay windows, bands, cornice ----
const bayIndex = (face, x, z) => (face === "N" || face === "S" ? x : z);

for (const [x, z] of cells) {
  const key0 = key(x, z);
  if (!perim.has(key0)) continue;
  const gy = ground.get(key0);
  const top = topOf(gy);
  const e = exposedMap.get(key0);
  const face = ["N", "S", "E", "W"].find((f) => e.includes(f));
  const i = bayIndex(face, x, z);
  const pier = Math.abs(i) % 3 === 0;

  for (let h = 1; h <= top - gy - 1; h++) {
    const y = gy + h;
    const r = h % 5;
    let id;
    if (r === 0) id = "smooth_stone";            // storey band at floor line
    else if (r === 4) id = pier ? "white_concrete" : "smooth_stone"; // lintel
    else id = pier ? "white_concrete" : "light_blue_stained_glass_pane"; // glazing
    put(x, y, z, id);
  }

  // cornice ledge under parapet
  const cy = top - 1;
  if (cy > gy) put(x, cy, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });

  // parapet
  put(x, top + 1, z, "stone_brick_wall");
}

// ---- entrance on the street-facing (min z) side, middle of that run ----
const zMin = Math.min(...[...perim].map((k) => Number(k.split(",")[1])));
const streetCells = [...perim]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => z === zMin && exposedMap.get(key(x, z)).includes("N"))
  .sort((a, b) => a[0] - b[0]);
if (streetCells.length) {
  const [ex, ez] = streetCells[Math.floor(streetCells.length / 2)];
  const gy = ground.get(key(ex, ez));
  put(ex, gy + 1, ez, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(ex, gy + 2, ez, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(ex, gy + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- warm lights behind upper-floor glazing (only where an inner cell exists) ----
for (const k of perim) {
  const [x, z] = k.split(",").map(Number);
  const gy = ground.get(k);
  const top = topOf(gy);
  const e = exposedMap.get(k);
  for (const face of e) {
    const [dx, dz] = DIRS[face];
    const i = bayIndex(face, x, z);
    const pier = Math.abs(i) % 3 === 0;
    const ix = x - dx, iz = z - dz;
    if (pier || Math.abs(i) % 6 !== 1) continue;
    if (!has(ix, iz) || perim.has(key(ix, iz))) continue;
    const ig = ground.get(key(ix, iz));
    const ltop = topOf(ig);
    const ly = ig + 7;
    if (ly < ltop) put(ix, ly, iz, "glowstone");
  }
}

// ---- rooftop plant room and lightning rod ----
for (const [x, z] of cells) {
  if (perim.has(key(x, z))) continue;
  if (x < 8 || x > 12 || z < 7 || z > 11) continue;
  const gy = ground.get(key(x, z));
  const top = topOf(gy);
  if (top + 2 >= H) continue;
  put(x, top + 1, z, "light_gray_concrete");
  put(x, top + 2, z, "light_gray_concrete");
  if (x === 10 && z === 9 && top + 3 < H) put(x, top + 3, z, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
