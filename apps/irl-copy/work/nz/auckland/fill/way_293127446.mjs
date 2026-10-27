// Customhouse (OSM way 293127446), Auckland CBD: a 1980s concrete office block on a volcanic-stone podium.
// Massing comes from the lidar roof record, smoothed by a 5x5 median so single-cell edge spikes drop out:
// a 6-storey body (roof 24 blocks above y 0) and an 8-storey tower stepped in from it (roof 32).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 66, D = 50, H = 122;
const cells = JSON.parse(readFileSync(`${DIR}/way_293127446.cells.json`, "utf8"));

const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const G = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, ground, lidar] of cells) G[z][x] = { ground, lidar };
const footprint = new Set(cells.map(([x, z]) => key(x, z)));
const inside = (x, z) => footprint.has(key(x, z));

// 1. the smoothed roof: the median of the footprint cells within two cells
const smoothed = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, z + dz)) v.push(G[z + dz][x + dx].lidar);
  v.sort((a, b) => a - b);
  smoothed.set(key(x, z), v[v.length >> 1]);
}

// 2. two massing tiers: the body (roof 24) and the tower (roof 32), the tower eroded one cell so it steps in
const erode = (set, n) => {
  for (let i = 0; i < n; i++) {
    const next = new Set();
    for (const k of set) {
      const [x, z] = k.split(",").map(Number);
      if (NB4.every(([dx, dz]) => set.has(key(x + dx, z + dz)))) next.add(k);
    }
    set = next;
  }
  return set;
};
const tower = erode(new Set([...footprint].filter(k => smoothed.get(k) >= 30)), 1);
const ROOF = { body: 24, tower: 32 };
const R = (x, z) => (tower.has(key(x, z)) ? ROOF.tower : ROOF.body);
const ground = (x, z) => G[z][x].ground;

// 3. faces: a side is open to the sky (or the street) at height y when the neighbour has no building there
const openTo = (x, z, y, dx, dz) => {
  const nx = x + dx, nz = z + dz;
  if (!inside(nx, nz)) return true;
  return y >= ground(nx, nz) && y >= R(nx, nz);
};
const faces = (x, z, y) => {
  const f = { east: openTo(x, z, y, 1, 0), west: openTo(x, z, y, -1, 0), south: openTo(x, z, y, 0, 1), north: openTo(x, z, y, 0, -1) };
  return { ...f, ex: f.east || f.west, ez: f.north || f.south, any: f.east || f.west || f.north || f.south };
};
// a tier's floor where a lower tier's roof runs in under it (the step is solid, not air under a storey)
const stepLevels = (x, z) => {
  const s = new Set();
  for (const [dx, dz] of NB4) if (inside(x + dx, z + dz) && R(x + dx, z + dz) < R(x, z)) s.add(R(x + dx, z + dz) - 1);
  return s;
};
// one cell's column at height y: foundation, roof cap, floor slab (every 4th row from y 4), exterior wall, or air
function kind(x, z, y) {
  const r = R(x, z), g = ground(x, z);
  if (y < g) return { k: "foundation" };
  if (y >= r) return { k: "none" };
  if (y === r - 1) return { k: "cap", f: faces(x, z, y) };
  if ((y % 4 === 0 && y >= 4) || stepLevels(x, z).has(y)) return { k: "floor" };
  const f = faces(x, z, y);
  return f.any ? { k: "wall", f } : { k: "air" };
}

// 4. the wall: podium (y < 8) with a base course, a fascia and shop glass; upper storeys with piers, spandrels and glass
const PIER = { podium: "polished_andesite", upper: "light_gray_concrete" };
const SPANDREL = { podium: "polished_andesite", upper: "white_concrete" };
const GLASS = "light_blue_stained_glass";
function wallBlock(x, z, y, f) {
  const podium = y < 8;
  const bay = f.ex ? z : x;                     // along the face the cell is on
  const pier = (f.ex && f.ez) || bay % 3 === 0; // corners and every third bay are piers
  if (y === 0) return "polished_andesite";      // base course
  const row = y % 4;
  if (row === 0 || row === 3) return SPANDREL[podium ? "podium" : "upper"];
  if (pier) return PIER[podium ? "podium" : "upper"];
  return GLASS;
}

// 5. build
const b = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => b.set(x, y, z, block, state);
for (const [x, z] of cells) {
  const r = R(x, z), g = ground(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");        // foundation to the lowest-ground datum
  for (let y = g; y < r; y++) {
    const c = kind(x, z, y);
    if (c.k === "foundation" || c.k === "none") continue;
    if (c.k === "cap") put(x, y, z, c.f.any ? "polished_andesite" : "smooth_stone");
    else if (c.k === "floor") put(x, y, z, "smooth_stone");
    else if (c.k === "wall") put(x, y, z, wallBlock(x, z, y, c.f));
  }
  // parapet on the edge of a tier: footprint edge or a lower roof beside it
  if (NB4.some(([dx, dz]) => !inside(x + dx, z + dz) || R(x + dx, z + dz) < r)) {
    put(x, r, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 6. entrance on the north (low-z) front, the lowest cell nearest x 33: door, flanking piers, hanging lantern
let door = null;
for (let x = 0; x < W; x++) {
  const zs = cells.filter(([cx]) => cx === x).map(([, z]) => z);
  if (!zs.length) continue;
  const z = Math.min(...zs);
  if (inside(x, z - 1) || ground(x, z) > 1) continue;
  if (!door || Math.abs(x - 33) < Math.abs(door[0] - 33)) door = [x, z];
}
if (door) {
  const [ex, ez] = door, g = ground(ex, ez);
  for (const dx of [-1, 1]) if (inside(ex + dx, ez)) for (let y = g; y < g + 3; y++) put(ex + dx, y, ez, "polished_andesite");
  put(ex, g, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, g + 1, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, g + 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

// 7. warm light: a glowstone on the floor just inside some upper windows (rows 1 of a storey, floor below it)
let warm = 0;
for (const [x, z] of cells) {
  for (let y = 5; y < R(x, z) - 2; y += 1) {
    if (y % 4 !== 1 || (x * 7 + z * 3 + y) % 13 !== 0) continue;
    const c = kind(x, z, y);
    if (c.k !== "wall" || c.f.ex && c.f.ez) continue;
    const [ix, iz] = c.f.east ? [x - 1, z] : c.f.west ? [x + 1, z] : c.f.south ? [x, z - 1] : [x, z + 1];
    if (!inside(ix, iz) || kind(ix, iz, y).k !== "air") continue;
    put(ix, y, iz, "glowstone"); warm++;
  }
}

// 8. roof plant: a few concrete boxes on the body roof, set in from its edges; a lightning rod on the tower top
const bodyRoof = erode(new Set([...footprint].filter(k => R(...k.split(",").map(Number)) === ROOF.body)), 3);
let boxes = 0;
for (const k of bodyRoof) {
  const [x, z] = k.split(",").map(Number);
  if (x % 12 !== 5 || z % 10 !== 4) continue;
  const cells3 = [];
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) cells3.push([x + dx, z + dz]);
  if (!cells3.every(([cx, cz]) => bodyRoof.has(key(cx, cz)))) continue;
  for (const [cx, cz] of cells3) { put(cx, ROOF.body, cz, "light_gray_concrete"); put(cx, ROOF.body + 1, cz, "light_gray_concrete"); }
  boxes++;
}
const towerCells = [...tower].map(k => k.split(",").map(Number));
const mx = towerCells.reduce((s, [x]) => s + x, 0) / towerCells.length;
const mz = towerCells.reduce((s, [, z]) => s + z, 0) / towerCells.length;
const [rx, rz] = towerCells.sort((a, b) => Math.hypot(a[0] - mx, a[1] - mz) - Math.hypot(b[0] - mx, b[1] - mz))[0];
put(rx, ROOF.tower, rz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const out = `${DIR}/way_293127446.nbt`;
const { blocks, palette } = b.save(out);
console.log(JSON.stringify({ footprint: footprint.size, tower: tower.size, door, boxes, warm, blocks, palette, out }));
