// 1514 Broadway (1938): a stepped commercial and office block in the Art Moderne mould, built from the lidar roof.
// Storeys are 3 blocks: a floor line (base course or spandrel), then two rows of glass between piers. The roof
// heights are median-smoothed over 3x3 and snapped to 3-block tiers (capped at the record's 20), so the massing
// steps back cleanly. The shell is a hollow one-block wall ring with a floor slab per storey and a solid cap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1022624.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [30, 24, 39];
const DIRS = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];

const k2 = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { g, r }]));
const inFp = (x, z) => raw.has(k2(x, z));

// Smoothed ground and tier top per footprint cell.
const S = new Map();
for (const [key, { g, r }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFp(x + dx, z + dz)) vals.push(raw.get(k2(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  const H = Math.max(Math.min(20, Math.round(med / 3) * 3), g + 4);
  S.set(key, { g, H });
}
const cell = (x, z) => S.get(k2(x, z));
const occ = (x, z, y) => { const c = cell(x, z); return !!c && y >= c.g && y < c.H; };
const wall = (x, z, y) => occ(x, z, y) && DIRS.some(([dx, dz]) => !occ(x + dx, z + dz, y));
const facing = (x, z, y) => DIRS.filter(([dx, dz]) => !occ(x + dx, z + dz, y));   // outward (or step) faces

const g = new Voxels(SIZE);
const put = (x, y, z, block, state) => { if (y >= 0 && y < SIZE[1]) g.set(x, y, z, block, state); };

// Base: foundation under the ground, then the shell cell by cell.
for (const [key, { g: gr, H }] of S) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_granite");
  const n = Math.floor((H - gr - 1) / 3);   // storeys; the top layer is the cap
  for (let y = gr; y < H; y++) {
    const rel = y - gr;
    if (y === H - 1) { put(x, y, z, "smooth_stone"); continue; }
    if (!wall(x, z, y)) { if (rel % 3 === 0 && rel <= 3 * n) put(x, y, z, "stone"); continue; }
    if (rel % 3 === 0 && rel <= 3 * n) { put(x, y, z, rel === 0 ? "polished_granite" : "cut_sandstone"); continue; }
    if (rel < 3 * n) {
      const k = Math.floor(rel / 3);
      const [dx] = facing(x, z, y)[0] ?? [0, 0];
      const u = dx ? z : x;
      const pier = u % 3 === 0;
      if (k === 0) put(x, y, z, pier ? "polished_granite" : "black_stained_glass");
      else put(x, y, z, pier ? "smooth_sandstone" : "light_blue_stained_glass");
      continue;
    }
    put(x, y, z, "cut_sandstone");   // cornice band under the parapet
  }
}

// Warm lamps standing on each floor, just inside some of the windows.
for (const [key, { g: gr, H }] of S) {
  const [x, z] = key.split(",").map(Number);
  const n = Math.floor((H - gr - 1) / 3);
  for (let k = 0; k < n; k++) {
    const y = gr + 3 * k + 1;
    const out = facing(x, z, y)[0];
    if (!out || wall(x - out[0], z - out[1], y) || !occ(x - out[0], z - out[1], y)) continue;
    const u = out[0] ? z : x;
    const lit = k === 0 ? u % 6 === 1 : (u * 5 + k * 3) % 7 === 0;
    if (lit) put(x - out[0], y, z - out[1], "lantern", { hanging: "false" });
  }
}

// Entrances: a lobby door on the west (Broadway-side) face, a second on the south face, each with a stone lintel.
const door = (x, z, facingName) => {
  const c = cell(x, z); if (!c) return;
  put(x, c.g, z, "iron_door", { facing: facingName, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, c.g + 1, z, "iron_door", { facing: facingName, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, c.g + 2, z, "polished_granite");
};
{
  const x = 0, z = 19, c = cell(x, z);
  if (c) {
    for (const dz of [-1, 1]) for (let rel = 1; rel <= 2; rel++) put(x, c.g + rel, z + dz, "polished_granite");
    door(x, z, "west");
    for (const dz of [-1, 1]) put(x, c.g, z + dz, "polished_granite");
  }
}
{
  const x = 10, z = 38, c = cell(x, z);
  if (c) {
    for (const dx of [-1, 1]) for (let rel = 1; rel <= 2; rel++) put(x + dx, c.g + rel, z, "polished_granite");
    door(x, z, "south");
  }
}

// Roof plant: 3x3 mechanical boxes on the flat wings (equal tops, 12 or lower), standing on the cap.
const used = new Set();
let boxes = 0;
for (const [key, { H }] of S) {
  if (boxes >= 4 || H > 12) continue;
  const [x, z] = key.split(",").map(Number);
  let ok = true;
  for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) {
    const c = cell(x + dx, z + dz);
    if (!c || c.H !== H || used.has(k2(x + dx, z + dz))) ok = false;
  }
  if (!ok || (x + z) % 5 !== 0) continue;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    used.add(k2(x + dx, z + dz));
    put(x + dx, H, z + dz, "stone_bricks");
    put(x + dx, H + 1, z + dz, dx || dz ? "stone_bricks" : "smooth_stone");
  }
  boxes++;
}

const stats = { blocks: g.save(`${FILL}/NYC1022624.nbt`).blocks };
const tops = {};
for (const { H } of S.values()) tops[H] = (tops[H] || 0) + 1;
console.log(JSON.stringify({ ...stats, cells: S.size, tierTops: tops, roofPlant: boxes }));
