// Way 1095572188: a two-storey Edwardian brick commercial block (shopfront below, a stone cornice and a brick parapet
// above), on Eden Terrace's Mt Eden Road side. Footprint 7 x 11 blocks; lidar roof 10 blocks on every cell but one
// corner (8, a lidar dip), so the massing is one flat tier at 10, with the parapet to 11.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572188.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572188.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const ROOF = 10;   // flat roof line (lidar mode; the 8 at (0,7) is noise, smoothed up)
const PARAPET = 10; // one parapet course on the wall tops, to 11 blocks
const g = new Voxels([7, 23, 11]);

const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));
const isWall = (x, z) => exposed(x, z).length > 0;     // a perimeter cell: the 1-block shell
// a convex corner: two perpendicular faces meet with the diagonal outside (the stepped footprint has many notch cells
// that are exposed twice but are not corners of the building; those stay brick)
const isCorner = (x, z) => {
  const ex = exposed(x, z);
  return ex.some((a) => ex.some((b) => a !== b && !inFp(x + DIRS[a][0] + DIRS[b][0], z + DIRS[a][1] + DIRS[b][1])));
};

// bays along a face: the run of cells exposed on that face, corners at both ends, windows at odd steps
const alongOf = (d, x, z) => (d === "north" || d === "south" ? x : z);
const runStart = (x, z, d) => {
  const [dx, dz] = d === "north" || d === "south" ? [1, 0] : [0, 1];
  let a = x, b = z;
  while (inFp(a - dx, b - dz) && exposed(a - dx, b - dz).includes(d)) { a -= dx; b -= dz; }
  return alongOf(d, a, b);
};
const isBay = (x, z, d) => (alongOf(d, x, z) - runStart(x, z, d)) % 2 === 1;   // window bays; the others are piers

const blocks = new Map();
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });

// shell: each perimeter column solid from y 0 to the parapet, banded into storeys
const windows = [];   // { x, z, d, y } of glazed cells, for the door and the lamps
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (!ex.length) continue;
  const corner = isCorner(x, z);
  const d = ex[0];
  const bay = !corner && isBay(x, z, d);
  for (let y = 0; y < ROOF; y++) {
    let b;
    if (corner) b = "stone_bricks";                                   // quoins, full height
    else if (y === 0) b = "stone_bricks";                             // plinth
    else if (y <= 2) b = bay ? "glass_pane" : "bricks";               // shopfront glazing
    else if (y === 3) b = "dark_oak_planks";                          // timber fascia
    else if (y === 4) b = "bricks";                                   // brick band under the first floor
    else if (y === 5) b = bay ? "stone_brick_slab" : "bricks";        // first-floor sill
    else if (y <= 8) b = bay ? "glass_pane" : "bricks";               // first-floor glazing
    else b = "stone_bricks";                                          // cornice (y 9)
    if (b === "stone_brick_slab") put(x, y, z, b, { type: "bottom", waterlogged: "false" });
    else put(x, y, z, b);
    if (bay && b === "glass_pane") windows.push({ x, z, d, y });
  }
  for (let y = ROOF; y < ROOF + PARAPET; y++) put(x, y, z, corner ? "stone_bricks" : "bricks");
}

// floor slabs in the interior, one per storey and the roof deck; the air between is the gap behind the glass
for (const [x, z] of cells) {
  if (isWall(x, z)) continue;
  put(x, 0, z, "stone_bricks");
  put(x, 4, z, "stone_bricks");
  put(x, 9, z, "smooth_stone");
}

// the entrance: the face with the most glazed bays, the middle bay of it, ground floor
const byFace = {};
for (const w of windows) if (w.y === 1) (byFace[w.d] ??= []).push(w);
const main = Object.entries(byFace).sort((a, b) => b[1].length - a[1].length)[0];
if (main) {
  const [d, list] = main;
  const door = list[Math.floor(list.length / 2)];
  const doorState = (half) => ({ facing: d, half, hinge: "left", open: "false", powered: "false" });
  put(door.x, 1, door.z, "dark_oak_door", doorState("lower"));
  put(door.x, 2, door.z, "dark_oak_door", doorState("upper"));
  windows.splice(windows.indexOf(door), 1);
}

// warm light: a glowstone in the room behind every third window that has an interior behind it
let k = 0;
for (const w of windows) {
  const [dx, dz] = DIRS[w.d];
  const ix = w.x - dx, iz = w.z - dz;
  if (!inFp(ix, iz) || isWall(ix, iz)) continue;
  if (k++ % 3 === 0) put(ix, w.y, iz, "glowstone");
}

// roof plant on the deck: one unit, on an interior cell nearest the middle
const interior = cells.filter(([x, z]) => !isWall(x, z));
if (interior.length) {
  const cx = 3, cz = 5;
  const [px, pz] = interior.reduce((best, c) => (Math.abs(c[0] - cx) + Math.abs(c[1] - cz) < Math.abs(best[0] - cx) + Math.abs(best[1] - cz) ? c : best));
  put(px, 10, pz, "smooth_stone");
  put(px, 11, pz, "iron_bars");
}

// glass panes connect to whatever stands beside them (wall, pier, door, lamp), and to nothing else
const solidAt = (x, y, z) => blocks.has(`${x},${y},${z}`);
for (const [key, b] of blocks) {
  if (b.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  b.state = {
    north: String(solidAt(x, y, z - 1)),
    south: String(solidAt(x, y, z + 1)),
    east: String(solidAt(x + 1, y, z)),
    west: String(solidAt(x - 1, y, z)),
    waterlogged: "false",
  };
}

for (const [key, { block, state }] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}

const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, ${res.palette} palette entries`);
