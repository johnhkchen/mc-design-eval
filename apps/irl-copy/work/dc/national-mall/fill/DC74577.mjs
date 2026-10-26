import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC74577.cells.json`, "utf8"));

const W = 16, H = 32, D = 25;
const g = new Voxels([W, H, D]);

// Palette: 1970s-80s Washington office, pale precast piers, tinted glass bands
const FOUNDATION = "stone";
const BASE = "stone_bricks";
const PIER = "smooth_quartz";
const SPANDREL = "white_concrete";
const GLASS = "light_blue_stained_glass";
const LIT = "glowstone";
const FLOOR = "light_gray_concrete";
const CAP = "smooth_quartz";
const PLANT = "stone_bricks";

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, ground, roof] of cells) {
  map.set(key(x, z), { x, z, g0: Math.round(ground), roof: Math.round(roof) });
}
const has = (x, z) => map.has(key(x, z));

function S(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces of a footprint cell
function faces(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push({ face: "north", along: x });
  if (!has(x, z + 1)) out.push({ face: "south", along: x });
  if (!has(x - 1, z)) out.push({ face: "west", along: z });
  if (!has(x + 1, z)) out.push({ face: "east", along: z });
  return out;
}

// Smooth the lidar roof: average over a 5x5 neighbourhood of footprint cells,
// then quantise to even two-block storey tiers (absolute heights above y 0).
function smoothedRoof(x, z) {
  let sum = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      const c = map.get(key(x + dx, z + dz));
      if (c) { sum += c.roof; n++; }
    }
  }
  return sum / n;
}

for (const c of map.values()) {
  const { x, z, g0 } = c;

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < g0; y++) S(x, y, z, FOUNDATION);

  // Clean flat tier: even storey height, at least two storeys tall
  const tiered = 2 * Math.round(smoothedRoof(x, z) / 2);
  const top = Math.max(g0 + 4, Math.min(H - 5, tiered));

  const fs = faces(x, z);
  const perimeter = fs.length > 0;
  const primary = fs[0];

  for (let y = g0; y < top; y++) {
    const k = y - g0;
    const s = Math.floor(k / 2);

    // Roof deck / cornice at the top course
    if (y === top - 1) {
      S(x, y, z, perimeter ? PLANT : FLOOR);
      continue;
    }

    if (perimeter) {
      const b = primary.along;
      const pier = b % 3 === 0;
      if (k === 0) {
        S(x, y, z, BASE); // base course
      } else if (k % 2 === 0) {
        S(x, y, z, pier ? PIER : SPANDREL); // storey line / spandrel
      } else {
        if (pier) S(x, y, z, PIER);
        else if (s >= 1 && (b * 5 + s * 3) % 9 === 0) S(x, y, z, LIT); // warm lit office
        else S(x, y, z, GLASS);
      }
    } else {
      // Interior: floor slabs only, air gap behind glass
      if (k % 2 === 0) S(x, y, z, FLOOR);
    }
  }

  // Parapet course on the perimeter
  if (perimeter) S(x, top, z, CAP);

  // Roof plant: mechanical penthouse in the core
  if (!perimeter && x >= 5 && x <= 10 && z >= 7 && z <= 12) {
    S(x, top, z, PLANT);
    S(x, top + 1, z, PLANT);
  }
}

// Main entrance: centred door in a stone surround on the north (or south) street face
{
  const northCells = [...map.values()].filter((c) => !has(c.x, c.z - 1));
  const southCells = [...map.values()].filter((c) => !has(c.x, c.z + 1));
  const pool = northCells.length ? northCells : southCells;
  const facing = northCells.length ? "north" : "south";
  if (pool.length) {
    pool.sort((a, b) => a.x - b.x);
    const door = pool[Math.floor(pool.length / 2)];
    const y0 = door.g0;
    // Stone surround: the door bay and its flanks stand as a solid portal
    for (const dx of [-1, 0, 1]) {
      const cx = door.x + dx;
      if (!has(cx, door.z)) continue;
      S(cx, y0, door.z, BASE);
      S(cx, y0 + 1, door.z, BASE);
      S(cx, y0 + 2, door.z, PIER);
    }
    S(door.x, y0, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    S(door.x, y0 + 1, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    // Lit lobby glass on one flank
    if (has(door.x + 1, door.z)) S(door.x + 1, y0 + 1, door.z, LIT);
  }
}

g.save(`${DIR}/DC74577.nbt`);
