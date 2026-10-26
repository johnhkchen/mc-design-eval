// FR245184607: a residential Haussmann-era block (1860, eight storeys under a flat deck, cream stone, a stone cornice, and
// two brick chimneys). Storeys are 4 blocks above a 5-block ground floor (base course, windows, lintel), so every string
// course and lintel row falls on y = 6 mod 4 and every roof tier (7, 11 ... 35) puts its deck on a string row. The walls
// are one block thick with an air gap behind each glass pane; floor slabs carry each storey; nothing is modelled inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184607.cells.json`, "utf8"));

const W = 30, H = 51, D = 19;
const TIERS = [7, 11, 15, 19, 23, 27, 31, 35];          // 1 + 4n: the storey counts (2 to 8), with a cornice on top
const FLOORS = [6, 10, 14, 18, 22, 26, 30];             // the upper storeys' floor slabs (their string rows)
const NEI = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// Each footprint cell: lidar roof, smoothed by a 3x3 median and snapped to the nearest tier.
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, top: 0 });
const cell = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => cell(x, z)?.top ?? 0;
const snap = (v) => TIERS.reduce((b, t) => (Math.abs(t - v) < Math.abs(b - v) ? t : b));
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  c.top = snap(vals[Math.floor(vals.length / 2)]);
}

// Air at (x, y, z): outside the footprint, or above that cell's tier. A wall face is a solid cell with air beside it.
const airAt = (x, z, y) => !cell(x, z) || y >= topAt(x, z);
const exposed = (x, z, y) => NEI.filter(([dx, dz]) => airAt(x + dx, z + dz, y));
const perimeter = (x, z, y) => exposed(x, z, y).length > 0;

// The street face: the outer face with the most exposed cells at ground level; its door sits at the middle of that run.
const faceCount = new Map();
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (const [dx, dz] of exposed(x, z, 2)) { const k = `${dx},${dz}`; faceCount.set(k, (faceCount.get(k) ?? 0) + 1); }
}
const [doorDir] = [...faceCount.entries()].sort((a, b) => b[1] - a[1])[0];
const [ddx, ddz] = doorDir.split(",").map(Number);
const doorRun = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => exposed(x, z, 2).some(([dx, dz]) => dx === ddx && dz === ddz)).map(([x]) => x).sort((a, b) => a - b);
const doorX = doorRun[Math.floor(doorRun.length / 2)];
const doorZ = (ddz === 1) ? 18 : (ddz === -1 ? 0 : null);     // the door's wall: the row on the street side

// Two chimneys on the main deck: cells deep in the roof (all eight neighbours on the top tier), a third and two thirds along.
const deep = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => topAt(x, z) === 35 &&
  [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => topAt(x + dx, z + dz) === 35)));
deep.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const chimneys = deep.length ? [deep[Math.floor(deep.length / 3)], deep[Math.floor((2 * deep.length) / 3)]] : [];
const chimneyKey = new Set(chimneys.map(([x, z]) => `${x},${z}`));

// A lit pane: deterministic, about one window in five, always with a lamp sitting on a floor slab behind the glass.
const lit = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 5 === 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const top = topAt(x, z);
  for (let y = 0; y < top; y++) {
    const outs = exposed(x, z, y);
    // foundation and ground slab
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }

    // the cornice and the deck of the top tier
    if (y === top - 1) {
      put(x, y, z, outs.length ? "stone_bricks" : "deepslate_tiles");
      continue;
    }

    // the doorway's wall: pilasters, a lintel over the door, the door itself
    const onDoorWall = doorZ !== null && z === doorZ && x >= doorX - 1 && x <= doorX + 1 && outs.length;
    if (onDoorWall && y <= 4) {
      if (x === doorX && y <= 2) continue;   // written below as the door
      if (y === 3) { put(x, y, z, "stone_bricks"); continue; }
      put(x, y, z, "smooth_stone"); continue;
    }

    if (!outs.length) {
      // interior: a floor slab at each storey's base row (ground floor is y 0), and the storey stays air
      if (FLOORS.includes(y)) put(x, y, z, "smooth_stone");
      continue;
    }

    // the walls: base course, windows with pilasters, string courses and lintels
    const [dx, dz] = outs[0];
    const u = dx ? z : x;                    // position along the face
    const winRow = (y >= 2 && y <= 4) || (y >= 6 && ((y - 6) % 4 === 1 || (y - 6) % 4 === 2));
    if (y === 1) { put(x, y, z, "polished_andesite"); continue; }
    if (y === 5 || (y >= 6 && (y - 6) % 4 === 0) || (y >= 6 && (y - 6) % 4 === 3)) { put(x, y, z, "smooth_sandstone"); continue; }
    if (winRow) {
      const behind = [x - dx, z - dz];
      const inside = cell(behind[0], behind[1]) && !perimeter(behind[0], behind[1], y) && y < topAt(behind[0], behind[1]);
      if (outs.length === 1 && u % 3 !== 0 && inside) {
        put(x, y, z, "gray_stained_glass");
        if (y >= 6 && (y - 6) % 4 === 1 && lit(x, y, z)) put(behind[0], y, behind[1], "glowstone");
        continue;
      }
      put(x, y, z, u % 3 === 0 ? "smooth_stone" : "calcite");
      continue;
    }
    put(x, y, z, "calcite");
  }
}

// Doors: lower and upper halves, facing out of the street wall.
if (doorZ !== null) {
  const facing = ddz === 1 ? "north" : "south";
  for (const y of [1, 2]) put(doorX, y, doorZ, "dark_oak_door", { facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}

// Chimneys stand on the main deck: brick shafts three high.
for (const [x, z] of chimneys) for (let y = 35; y <= 37; y++) put(x, y, z, "bricks");

const out = g.save(`${DIR}/FR245184607.nbt`);
console.log(JSON.stringify({ size: [W, H, D], doorFace: doorDir, doorX, doorZ, chimneys, ...out }));
