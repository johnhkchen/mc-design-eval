// Way 1095570517: a two-storey 1920s-style painted-plaster shop-top on a flat lidar roof (every cell at 10).
// Plinth y0, storey 1 walls y1-3 (shopfront glass y1-2 under a y3 awning on the front), floor y4,
// storey 2 walls y5-7 (sash windows y6-7 on sills at y5), roof deck y8, parapet y9 with a stone cornice at y8.
// Shell = footprint cells with a neighbour outside the footprint; the interior is air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_1095570517.cells.json`, "utf8"));

const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => foot.has(`${x},${z}`);

// the lidar roof is flat (10 on every cell) and the ground is flat (0): one storey stack fits all of it
const roofs = new Set(cells.map(([, , , r]) => r)), grounds = new Set(cells.map(([, , g]) => g));
if (roofs.size !== 1 || grounds.size !== 1 || [...roofs][0] !== 10 || [...grounds][0] !== 0) throw new Error("expected a flat 10-high roof on ground 0");

const DX = { north: 0, south: 0, east: 1, west: -1 }, DZ = { north: -1, south: 1, east: 0, west: 0 };
const outward = (x, z) => ["north", "south", "east", "west"].filter((d) => !inF(x + DX[d], z + DZ[d]));
const shell = (x, z) => inF(x, z) && outward(x, z).length > 0;
const corner = (x, z) => outward(x, z).length >= 2;

// the front is the face with the most exposed cells; its non-corner cells, in order along the face
const faceCount = { north: 0, south: 0, east: 0, west: 0 };
for (const k of foot.keys()) { const [x, z] = k.split(",").map(Number); if (shell(x, z)) for (const d of outward(x, z)) faceCount[d]++; }
const front = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const faceCells = (d) => [...foot.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => shell(x, z) && !corner(x, z) && outward(x, z).includes(d))
  .sort((a, b) => (d === "north" || d === "south" ? a[0] - b[0] : a[1] - b[1]));
const frontCells = faceCells(front);
const doorCell = frontCells[Math.floor(frontCells.length / 2)];

const g = new Voxels([8, 23, 7]);
const WALL = "white_concrete", TRIM = "smooth_stone", ROOF = "deepslate_tiles", BASE = "stone_bricks";
const SILL = { type: "bottom", waterlogged: "false" };
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const glass = (x, y, z, d) => {
  const ew = d === "north" || d === "south"; // the pane runs along the wall: E-W on a N/S face
  set(x, y, z, "glass_pane", { east: String(ew), west: String(ew), north: String(!ew), south: String(!ew), waterlogged: "false" });
};

// base, storey floors and the roof deck across the whole footprint; interior is air between them
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  set(x, 0, z, BASE); set(x, 4, z, TRIM); set(x, 8, z, shell(x, z) ? TRIM : ROOF);
}

// walls: plaster throughout (corners too: stone quoins on every notch read as grey columns), windows on odd bays, shopfronts on the front
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!shell(x, z)) continue;
  const out = outward(x, z);
  if (corner(x, z)) { for (let y = 1; y <= 9; y++) set(x, y, z, WALL); continue; }
  const d = out[0];
  const idx = faceCells(d).findIndex(([a, b]) => a === x && b === z);
  const window = idx % 2 === 1;
  for (let y = 1; y <= 9; y++) set(x, y, z, WALL);
  if (d === front) {
    // shopfront: glass y1-2 with a red awning band at y3, and the door in the middle bay
    for (let y = 1; y <= 2; y++) glass(x, y, z, d);
    set(x, 3, z, "red_terracotta");
    if (x === doorCell[0] && z === doorCell[1]) {
      set(x, 1, z, "dark_oak_door", { facing: d, half: "lower", hinge: "left", open: "false", powered: "false" });
      set(x, 2, z, "dark_oak_door", { facing: d, half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  } else if (window) {
    set(x, 1, z, "dark_oak_slab", SILL);
    for (const y of [2, 3]) glass(x, y, z, d);
  }
  if (window) { set(x, 5, z, "dark_oak_slab", SILL); for (const y of [6, 7]) glass(x, y, z, d); }
}

// the parapet course and the stone cornice above the storey-2 windows
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (shell(x, z)) set(x, 8, z, TRIM);
}

// interior: a lantern over the door, glowstone behind some windows, and a rooftop plant unit
const interior = (x, z) => inF(x, z) && !shell(x, z);
const inward = (x, z, d) => [x - DX[d], z - DZ[d]];
{
  const [ix, iz] = inward(doorCell[0], doorCell[1], front);
  if (interior(ix, iz)) set(ix, 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
}
let lit = 0;
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!shell(x, z) || corner(x, z)) continue;
  const d = outward(x, z)[0];
  if (d === front) continue;
  const idx = faceCells(d).findIndex(([a, b]) => a === x && b === z);
  if (idx % 2 !== 1 || idx % 4 !== 1) continue;
  const [ix, iz] = inward(x, z, d);
  if (!interior(ix, iz)) continue;
  set(ix, 6, iz, "glowstone"); lit++;
}
const roofTop = [...foot.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => interior(x, z));
const units = roofTop.slice(Math.floor(roofTop.length / 2), Math.floor(roofTop.length / 2) + 2);
for (const [x, z] of units) set(x, 9, z, "iron_block");

const saved = g.save(`${FILL}/way_1095570517.nbt`);
console.log(JSON.stringify({ front, doorCell, lit, units, ...saved }));
