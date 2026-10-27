// Way 363700450: a 1960s-70s four-storey concrete commercial block on Mt Eden / Eden Terrace.
// Reads as a mid-century office over shops: basalt-stone base course, pale concrete walls,
// white pier grid with tinted glass panes, string courses, stone cornice, a 14-block terrace
// stepping in from the 18-block tower, and warm light in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_363700450.cells.json", "utf8"));

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "east", dx: 1, dz: 0 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
];

// Column model: ground G (foundation top), top T (roof, absolute y). Roof numbers are noisy,
// so they snap to four flat tiers: 6 (one storey + parapet), 9 (two), 14 (three), 18 (four).
const col = new Map();
const key = (x, z) => `${x},${z}`;
const tierOf = (r) => (r >= 16 ? 18 : r >= 12 ? 14 : r >= 8 ? 9 : 6);
for (const [x, z, g, r] of cells) col.set(key(x, z), { g, t: tierOf(r) });

// Clean the lidar steps: each cell takes the most common tier in its 3x3 neighbourhood,
// so single noisy cells stop drawing stair-stepped cornice stripes across the roof.
{
  const raw = new Map([...col].map(([k, c]) => [k, c.t]));
  for (const [k, c] of col) {
    const [x, z] = k.split(",").map(Number);
    const votes = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const t = raw.get(key(x + dx, z + dz));
      if (t !== undefined) votes.set(t, (votes.get(t) ?? 0) + (dx === 0 && dz === 0 ? 1.5 : 1));
    }
    let top = c.t, topVotes = votes.get(c.t) ?? 0;
    for (const [t, v] of votes) if (v > topVotes) { top = t; topVotes = v; }
    c.t = top;
  }
}

// Setback: the outer ring of the 18 tower steps in to a 14 terrace.
for (const [k, c] of col) {
  if (c.t !== 18) continue;
  const [x, z] = k.split(",").map(Number);
  const edge = DIRS.some(({ dx, dz }) => {
    const n = col.get(key(x + dx, z + dz));
    return !n || n.t < 18;
  });
  if (edge) c.t = 14;
}

const topOf = (x, z) => col.get(key(x, z))?.t ?? -1;
const inside = (x, z) => col.has(key(x, z));
const exposedDirs = (x, y, z) => DIRS.filter(({ dx, dz }) => y >= topOf(x + dx, z + dz));

// Block map so that air pockets behind glass can be carved after the solids are laid down.
const blocks = new Map();
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { x, y, z, block, state });
const carve = (x, y, z) => blocks.delete(`${x},${y},${z}`);

const WALL = "light_gray_concrete";
const PIER = "white_concrete";
const GLASS = "light_blue_stained_glass_pane";
const SHOP = "glass_pane";
const BASE = "stone_bricks";
const STRING = "smooth_stone";
const SHOP_PIER = "polished_andesite";

// Pane connections follow the face: a pane on an east/west face joins north/south neighbours.
const paneState = (d) => {
  const alongZ = d.dx !== 0;
  return {
    north: String(alongZ), south: String(alongZ),
    east: String(!alongZ), west: String(!alongZ),
    waterlogged: "false",
  };
};

const windows = []; // { x, y, z, d, shop }
const litWindow = (x, y, z) => (x * 5 + y * 3 + z * 7) % 5 === 0;

for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  const { g: G, t: T } = c;
  for (let y = 0; y < T; y++) {
    const ex = exposedDirs(x, y, z);
    if (ex.length === 0) {
      // Interior: solid mass, roof membrane on top.
      put(x, y, z, y === T - 1 ? STRING : WALL);
      continue;
    }
    const d = ex[0];
    const rel = y - G;
    const u = d.dx !== 0 ? z : x; // coordinate along the face
    if (y === T - 1) { put(x, y, z, BASE); continue; } // stone cornice / parapet cap
    if (rel < 1) { put(x, y, z, BASE); continue; }    // base course and visible plinth
    if (rel <= 3) {                                    // shopfront band
      if (u % 3 === 0) put(x, y, z, SHOP_PIER);
      else { put(x, y, z, SHOP, paneState(d)); windows.push({ x, y, z, d, shop: true }); }
      continue;
    }
    if (y % 4 === 0) { put(x, y, z, STRING); continue; }   // floor line
    if (y % 4 === 3) { put(x, y, z, WALL); continue; }     // spandrel
    if (u % 3 === 0) { put(x, y, z, PIER); continue; }     // pier between bays
    put(x, y, z, GLASS, paneState(d));
    windows.push({ x, y, z, d, shop: false });
  }
  // Foundation below ground, out of sight except on a downhill face.
  for (let y = 0; y < G; y++) {
    put(x, y, z, exposedDirs(x, y, z).length ? BASE : "stone");
  }
}

// Recess every glazed bay one block: air behind the glass, warm light in about a fifth of them.
for (const w of windows) {
  const ix = w.x - w.d.dx, iz = w.z - w.d.dz;
  if (!inside(ix, iz)) continue;
  const c = col.get(key(ix, iz));
  if (w.y < c.g || w.y >= c.t) continue;
  if (!w.shop && litWindow(w.x, w.y, w.z)) put(ix, w.y, iz, "glowstone");
  else carve(ix, w.y, iz);
}

// Entrance: the face with the most exposed shopfront cells; door at the middle of its run.
const shopRun = new Map();
for (const w of windows) if (w.shop) shopRun.set(w.d.name, (shopRun.get(w.d.name) ?? []).concat(w));
let best = null;
for (const [name, list] of shopRun) if (!best || list.length > best[1].length) best = [name, list];
const doorFace = best[1].filter((w) => w.y === col.get(key(w.x, w.z)).g + 1);
const doorCell = doorFace[Math.floor(doorFace.length / 2)];
const dd = DIRS.find((d) => d.name === doorCell.d.name);
const doorState = (half) => ({ facing: dd.name, half, hinge: "left", open: "false", powered: "false" });
const dxz = { x: doorCell.x, z: doorCell.z };
const gy = col.get(key(dxz.x, dxz.z)).g;
// Clear the pocket behind the door, then place the two door halves in the glazed bay.
carve(dxz.x - dd.dx, gy + 1, dxz.z - dd.dz);
carve(dxz.x - dd.dx, gy + 2, dxz.z - dd.dz);
put(dxz.x, gy + 1, dxz.z, "dark_oak_door", doorState("lower"));
put(dxz.x, gy + 2, dxz.z, "dark_oak_door", doorState("upper"));

// Roof equipment: plant boxes and a rooftop stack, kept off the parapet ring.
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  if (c.t < 14) continue;
  const ringFree = DIRS.every(({ dx, dz }) => topOf(x + dx, z + dz) >= c.t);
  if (!ringFree) continue;
  if ((x * 7 + z * 3) % 13 === 0) {
    put(x, c.t - 1, z, "iron_block");
    put(x, c.t, z, "iron_block");
  }
}
const mast = [...col].find(([, c]) => c.t === 18);
if (mast) {
  const [mx, mz] = mast[0].split(",").map(Number);
  for (let y = 18; y < 22; y++) put(mx, y, mz, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  put(mx, 22, mz, "lightning_rod", { facing: "up", powered: "false" });
}

const g = new Voxels([32, 31, 31]);
for (const { x, y, z, block, state } of blocks.values()) g.set(x, y, z, block, state);
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_363700450.nbt");
console.log(`way_363700450: ${blocks.size} blocks, ${windows.length} glazed bays, door ${dd.name} at ${dxz.x},${gy + 1},${dxz.z}`);
