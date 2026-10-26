import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC87495 — 1050 17th St NW, Commercial-Office-Large, 10 x 26 footprint.
// Read as a mid-century (c. 1960s-70s) Washington office block: buff brick
// piers and spandrels, stone belt courses, a granite plinth, a ground-floor
// glass shopfront with a single entrance, and a quartz parapet with a roof
// penthouse. One common roof line across the footprint; storey rows follow
// each cell's own ground so the downhill side carries extra floors.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87495";
const W = 10, H = 32, D = 26;
const S = 4;              // blocks per storey
const TOP_LIMIT = H - 3;  // keep penthouse inside build height

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cells = new Map();
const rawCells = raw.map((c) => {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  return { x, z, gr: Math.max(0, Math.round(gr)), rf: Math.round(rf) };
});

// One common roof line: median lidar roof, snapped to whole storeys above the lowest ground.
const gMin = Math.min(...rawCells.map((c) => c.gr));
const roofs = rawCells.map((c) => c.rf).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
let nCommon = Math.max(3, Math.min(6, Math.round((medRoof - gMin) / S)));
let T = gMin + S * nCommon;
if (T > TOP_LIMIT) T = TOP_LIMIT;

for (const c of rawCells) {
  const ground = Math.min(c.gr, T - S);
  cells.set(key(c.x, c.z), { x: c.x, z: c.z, ground, T });
}

const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const missingDirs = (x, z) => DIRS.filter(([dx, dz]) => !cells.has(key(x + dx, z + dz)));
const isPerimeter = (x, z) => missingDirs(x, z).length > 0;

// Footprint centroid, used to pick the entrance.
let cx = 0, cz = 0;
for (const c of cells.values()) { cx += c.x; cz += c.z; }
cx /= cells.size; cz /= cells.size;

// Entrance: non-corner perimeter cell nearest the centroid (lands on a long face).
let doorKey = null, bestD = Infinity;
for (const c of cells.values()) {
  const miss = missingDirs(c.x, c.z);
  if (miss.length !== 1) continue;
  const d = Math.hypot(c.x - cx, c.z - cz);
  if (d < bestD) { bestD = d; doorKey = key(c.x, c.z); }
}

// Build the shell.
for (const c of cells.values()) {
  const { x, z, ground, T: top } = c;
  const perim = isPerimeter(x, z);
  const miss = missingDirs(x, z);
  const corner = miss.length >= 2;
  const outward = miss.length ? miss[0] : null;
  const isDoor = key(x, z) === doorKey;

  // Foundation below grade.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");

  // Ground-level plate: granite plinth on the perimeter, stone floor inside.
  g.set(x, ground, z, perim ? "polished_granite" : "smooth_stone");

  if (perim) {
    for (let y = ground + 1; y <= top - 1; y++) {
      const rel = y - ground;
      const s = Math.floor(rel / S);
      const r = rel % S;               // 0 belt, 1-2 glazing, 3 head
      const isLastStorey = y >= top - 1;
      const pier = corner || ((x + z) % 3 === 0);

      if (isLastStorey) {
        g.set(x, y, z, "smooth_quartz");          // cornice under parapet
      } else if (r === 0) {
        g.set(x, y, z, s === 0 ? "stone_bricks" : "stone_bricks"); // belt course
      } else if (r === 3) {
        g.set(x, y, z, s === 0 ? "stone_bricks" : "bricks");       // head course
      } else if (isDoor && s === 0 && outward) {
        // Door halves are placed below; leave the cell free here.
        continue;
      } else if (pier) {
        g.set(x, y, z, "bricks");
      } else if (s === 0) {
        g.set(x, y, z, "light_blue_stained_glass");               // shopfront
      } else if (r === 2 && ((x * 5 + z * 7 + s * 3) % 9 === 0)) {
        g.set(x, y, z, "glowstone");                              // warm window
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane");
      }
    }

    // Entrance door and wood awning.
    if (isDoor && outward) {
      const facing = outward[2];
      const b = ground;
      g.set(x, b + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, b + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, b + 3, z, "dark_oak_planks");
    }
  } else {
    // Interior: floor plates at each storey line, air between (no interiors).
    for (let s = 1; ground + S * s < top; s++) {
      g.set(x, ground + S * s, z, "smooth_stone");
    }
  }

  // Roof deck / parapet at the common roof line.
  g.set(x, top, z, perim ? "smooth_quartz" : "light_gray_concrete");
}

// Roof penthouse: one low mechanical block set back in the middle of the roof.
for (const c of cells.values()) {
  if (isPerimeter(c.x, c.z)) continue;
  if (c.x < 3 || c.x > 6 || c.z < 8 || c.z > 17) continue;
  if (c.x % 2 !== 0) continue;
  if (c.T + 1 > TOP_LIMIT) continue;
  g.set(c.x, c.T + 1, c.z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
