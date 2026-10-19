// 410 Madison Avenue (1964, commercial office): a curtain-wall office slab of the early 1960s, the Midtown
// ideal of white spandrels, pale piers and blue glass over a dark granite plinth and shopfront. Massing is the
// lidar roof, median-smoothed over 3x3 and bucketed into three flat tiers: a 28-block east wing, a 31-block mid
// tier and a 35-block west crown with a mechanical penthouse. Storey lines sit every 3 blocks (spandrel row, then
// two glass rows); the shell is one block thick with air behind the glass, a slab per storey and a few columns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035437.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 26, D = 21, H = 47;

const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, r });
const inF = (x, z) => cell.has(`${x},${z}`);
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// Flat tiers: top = 35 (west crown), 31 (mid), 28 (east wing); the median over the 3x3 neighbourhood drops lidar speckle.
const tops = new Map();
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number), v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) v.push(cell.get(`${x + dx},${z + dz}`).r);
  const m = med(v);
  tops.set(key, m >= 33 ? 35 : m >= 30 ? 31 : 28);
}
const T = (x, z) => tops.get(`${x},${z}`);

const shell = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
const corner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
// Along-face index and the inward direction for a shell cell (north/south faces run along x, east/west along z).
function faceOf(x, z) {
  if (!inF(x, z - 1)) return { idx: x, inx: 0, inz: 1 };
  if (!inF(x, z + 1)) return { idx: x, inx: 0, inz: -1 };
  if (!inF(x - 1, z)) return { idx: z, inx: 1, inz: 0 };
  return { idx: z, inx: -1, inz: 0 };
}

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const GLASS = "light_blue_stained_glass", PIER = "light_gray_concrete", SPANDREL = "white_concrete";
const PLINTH = "polished_granite", CORNICE = "smooth_stone", FLOOR = "light_gray_concrete", COLUMN = "light_gray_concrete";
const LANTERN = { hanging: "false" };

// The entrance: a 4-wide glass door set in granite frames on the south face, under a granite canopy ledge.
const entrance = (x, y, z) => z === D - 1 && x >= 10 && x <= 15 && y >= 1 && y <= 2;
const canopy = (x, y, z) => z === D - 1 && x >= 10 && x <= 15 && y === 3;

// Shell (one block thick, the footprint's outer ring): plinth, a shopfront for the ground storey, then storeys of
// spandrel (the floor line) and two glass rows, with a granite pier every third cell and a stone cornice on top.
function shellBlock(x, z, y, Top) {
  if (y === 0) return PLINTH;
  if (y === Top - 1) return CORNICE;
  const { idx } = faceOf(x, z);
  const pier = corner(x, z) || idx % 3 === 0;
  if (y < 3) return pier ? PLINTH : GLASS;                     // ground storey: shopfront
  if (y % 3 === 0) return SPANDREL;                            // floor line
  return pier ? PIER : GLASS;
}

for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number), { g } = cell.get(key), Top = T(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");     // foundation under the downhill-side ground
  if (shell(x, z)) {
    for (let y = g; y < Top; y++) {
      if (y === 0) { put(x, y, z, PLINTH); continue; }
      if (canopy(x, y, z)) { put(x, y, z, PLINTH); continue; }
      if (entrance(x, y, z)) {
        // door frames in granite, glass doors in the middle two cells
        put(x, y, z, x === 12 || x === 13 ? "glass" : PLINTH);
        continue;
      }
      put(x, y, z, shellBlock(x, z, y, Top));
    }
  } else {
    // interior: a floor slab at ground level, at every storey line and at the roof; air otherwise (no rooms)
    for (let y = g; y < Top; y++) if (y === g || (y % 3 === 0) || y === Top - 1) put(x, y, z, FLOOR);
  }
}

// Structural columns on a loose grid through the interior, each from its floor to its tier roof.
for (const x of [7, 13, 19]) for (const z of [6, 13]) {
  if (!inF(x, z) || shell(x, z)) continue;
  for (let y = cell.get(`${x},${z}`).g; y < T(x, z) - 1; y++) put(x, y, z, COLUMN);
}

// Warm lights: a lantern in the air behind some glass windows, standing on the floor slab of its storey.
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!shell(x, z) || corner(x, z)) continue;
  const { idx, inx, inz } = faceOf(x, z), Top = T(x, z);
  for (let k = 0; 3 * k + 1 < Top - 1; k++) {
    const y = 3 * k + 1;
    if (entrance(x, y, z) || canopy(x, y, z) || y < 1) continue;
    if (shellBlock(x, z, y, Top) !== GLASS) continue;
    if ((idx + k) % 5 !== 2) continue;
    const xi = x + inx, zi = z + inz;
    if (!inF(xi, zi) || shell(xi, zi)) continue;
    put(xi, y, zi, "lantern", LANTERN);
  }
}
// Lobby lights behind the entrance glass.
for (const x of [12, 13]) put(x, 1, D - 2, "lantern", LANTERN);

// Mechanical penthouse on the 35-block crown: louvred walls, a roof at 37, lit through the louvres.
const PH = { x0: 4, x1: 9, z0: 5, z1: 9, y0: 35, y1: 36, top: 37 };
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  if (!inF(x, z) || T(x, z) !== 35) continue;
  for (let y = PH.y0; y <= PH.y1; y++) {
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    put(x, y, z, edge ? (y === PH.y1 && (x + z) % 2 ? "iron_bars" : PIER) : "air");
  }
  put(x, PH.top, z, CORNICE);
}

// Check: every footprint cell carries its tier roof, so no tier is open to the sky.
const holes = [];
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!v.get(x, T(x, z) - 1, z)) holes.push(`roof ${x},${z}`);
}
console.log("roof holes", holes.length, holes.slice(0, 12).join(" | "));

const res = v.save(`${DIR}/NYC1035437.nbt`);
console.log(JSON.stringify({ cells: cells.length, tiers: { 28: [...tops.values()].filter((t) => t === 28).length, 31: [...tops.values()].filter((t) => t === 31).length, 35: [...tops.values()].filter((t) => t === 35).length }, ...res }));
