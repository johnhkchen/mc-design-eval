// 270 Park Avenue (2021): a contemporary glass office tower on a lower wing, built from the lidar roof. The record's
// roof steps from about 13 storeys (the wing) through a 17-storey mid-tier to a tower near 195 blocks, so the massing
// is a stepped stack. Storeys are 3 blocks on absolute y: a pale spandrel line, then two rows of glass between
// light-grey mullions, tinted by a hash so the facade shimmers at dusk. The shell is a hollow one-block skin with a
// floor slab per storey and a solid cap; warm glowstone stands in the air gap behind some windows. The tower takes a
// stone-and-glass lobby on the north face (the plaza side), and the wings carry plant boxes on their roofs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1091010.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [97, 207, 47];
const DIRS = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];

const k2 = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { g, r }]));
const neigh = (x, z) => {
  const out = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (raw.has(k2(x + dx, z + dz))) out.push(raw.get(k2(x + dx, z + dz)));
  return out;
};

// Building cells: lidar above the plaza level (a stray low return inside the massing is filled, a plaza cell next to a
// wing stays open). Height is the median of the building neighbours' roofs, snapped to 3-block storeys.
const S = new Map();
for (const [key, { g, r }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const bld = neigh(x, z).filter((c) => c.r > 5).map((c) => c.r).sort((a, b) => a - b);
  if (bld.length < 5 && r <= 5) continue;                          // open ground
  if (!bld.length) continue;
  const med = bld[Math.floor(bld.length / 2)];
  const H = Math.max(3, Math.round(med / 3) * 3);
  S.set(key, { g, H });
}
const cell = (x, z) => S.get(k2(x, z));
const occ = (x, z, y) => { const c = cell(x, z); return !!c && y >= c.g && y < c.H; };
const wall = (x, z, y) => occ(x, z, y) && DIRS.some(([dx, dz]) => !occ(x + dx, z + dz, y));
const outward = (x, z, y) => DIRS.filter(([dx, dz]) => !occ(x + dx, z + dz, y));

// A stable hash per cell, so the glass tints and lamps look varied but rebuild identically.
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const g = new Voxels(SIZE);
const put = (x, y, z, block, state) => { if (y >= 0 && y < SIZE[1]) g.set(x, y, z, block, state); };

// Open ground: a plaza of smooth stone to the cell's ground level.
for (const [key, { g: gr }] of raw) {
  if (S.has(key)) continue;
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "smooth_stone");
}

// Massing: foundation, then the shell cell by cell.
for (const [key, { g: gr, H }] of S) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_granite");
  for (let y = gr; y < H; y++) {
    if (y === H - 1) { put(x, y, z, "smooth_quartz"); continue; }                // solid cap on every tier
    if (!wall(x, z, y)) {                                                        // interior: air, with a slab per storey
      if (y % 3 === 0 && y > gr) put(x, y, z, "smooth_quartz");
      continue;
    }
    const [dx, dz] = outward(x, z, y)[0] ?? [0, 0];
    const u = dx ? z : x;                                                        // position along the face
    const band = y % 3;
    if (band === 0) { put(x, y, z, y < 3 ? "polished_granite" : "white_concrete"); continue; }   // spandrel line
    const mullion = u % 3 === 0;
    if (y < 3) { put(x, y, z, mullion ? "polished_granite" : "black_stained_glass"); continue; } // lobby base
    if (mullion) { put(x, y, z, "light_gray_concrete"); continue; }
    const h = hash(x, y, z) % 10;
    put(x, y, z, h === 0 ? "gray_stained_glass" : h < 3 ? "cyan_stained_glass" : "light_blue_stained_glass");
  }
}

// Warm lamps: glowstone in the air gap behind some glass, one per lit window on single-face walls.
for (const [key, { g: gr, H }] of S) {
  const [x, z] = key.split(",").map(Number);
  for (let y = gr; y < H - 1; y++) {
    if (y % 3 !== 1 || y < 3) continue;
    const out = outward(x, z, y);
    if (out.length !== 1 || !wall(x, z, y)) continue;
    const [dx, dz] = out[0];
    if (hash(x, y, z) % 9 !== 0) continue;
    if (!occ(x - dx, z - dz, y) || wall(x - dx, z - dz, y)) continue;
    put(x - dx, y, z - dz, "glowstone");
  }
}

// Lobby on the north (plaza) face: two double doors under a flat canopy on posts, glass either side.
const northWall = [...S].filter(([k, { g: gr, H }]) => {
  const [x, z] = k.split(",").map(Number);
  return !occ(x, z - 1, 3) && occ(x, z, 3) && H > 9;
}).map(([k]) => k.split(",").map(Number));
if (northWall.length) {
  const xs = northWall.map(([x]) => x);
  const ex = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
  const zw = Math.min(...northWall.filter(([x]) => x === ex).map(([, z]) => z));
  for (let x = ex - 4; x <= ex + 4; x++) {
    if (!cell(x, zw)) continue;
    for (let y = 4; y < 6; y++) put(x, y, zw, "light_blue_stained_glass");
    put(x, 1, zw, "light_blue_stained_glass");
    put(x, 2, zw, "light_blue_stained_glass");
  }
  for (const [x, facingName, hinge] of [[ex - 1, "north", "left"], [ex, "north", "right"]]) {
    put(x, 0, zw, "polished_granite");
    put(x, 1, zw, "iron_door", { facing: facingName, half: "lower", hinge, open: "false", powered: "false" });
    put(x, 2, zw, "iron_door", { facing: facingName, half: "upper", hinge, open: "false", powered: "false" });
  }
  for (let x = ex - 4; x <= ex + 4; x++) for (let z = zw - 4; z <= zw - 1; z++) put(x, 3, z, "smooth_quartz");
  for (const x of [ex - 4, ex + 4]) for (let y = 1; y <= 2; y++) put(x, y, zw - 4, "light_gray_concrete");
}

// Roof plant on the flat tops: 2x2 units of grey block with a vent grille, standing on the cap.
const used = new Set();
let plant = 0;
for (const [key, { H }] of S) {
  if (plant >= 14 || H > 45) continue;
  const [x, z] = key.split(",").map(Number);
  let ok = (x % 9 === 3) && (z % 9 === 3);
  for (let dz = 0; dz <= 1 && ok; dz++) for (let dx = 0; dx <= 1 && ok; dx++) {
    const c = cell(x + dx, z + dz);
    if (!c || c.H !== H || used.has(k2(x + dx, z + dz)) || wall(x + dx, z + dz, H - 1)) ok = false;
  }
  if (!ok) continue;
  for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) {
    used.add(k2(x + dx, z + dz));
    put(x + dx, H, z + dz, "light_gray_concrete");
    put(x + dx, H + 1, z + dz, "light_gray_concrete");
    put(x + dx, H + 2, z + dz, "iron_bars");
  }
  plant++;
}

// Crown and spire on the tower: the tallest cells' centroid carries a steel mast with a lightning rod.
const tall = [...S].filter(([, { H }]) => H >= 186).map(([k]) => k.split(",").map(Number));
if (tall.length) {
  const cx = Math.round(tall.reduce((a, [x]) => a + x, 0) / tall.length);
  const cz = Math.round(tall.reduce((a, [, z]) => a + z, 0) / tall.length);
  const top = Math.max(...tall.map(([x, z]) => cell(x, z).H));
  for (let y = top; y < top + 8; y++) put(cx, y, cz, "iron_block");
  put(cx, top + 8, cz, "lightning_rod");
}

const stats = { blocks: g.save(`${FILL}/NYC1091010.nbt`).blocks };
const tops = {};
for (const { H } of S.values()) tops[H] = (tops[H] || 0) + 1;
console.log(JSON.stringify({ ...stats, cells: S.size, tierTops: tops, roofPlant: plant }));
