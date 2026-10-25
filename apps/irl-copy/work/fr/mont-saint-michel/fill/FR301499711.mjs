import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499711";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 33, D = 13;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(key(x, z), { x, z, g: gr, r: roof });
const has = (x, z) => map.has(key(x, z));

// Lidar smoothing: target roof = median, rounded to a storey-friendly value
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
let R = roofs[Math.floor(roofs.length / 2)];
R = Math.max(5, Math.min(31, R));

// Materials
const WALL = "white_concrete";     // render
const BAND = "stone_bricks";       // storey lines, sills
const FLOOR = "smooth_stone";
const CAP = "stone_bricks";
const FOUND = "stone_bricks";
const GLASS = "glass";
const LIT = "glowstone";
const FRAME = "dark_oak_planks";
const TRIM = "chiseled_stone_bricks";

// Per-cell massing (setbacks only where lidar differs clearly)
const info = [];
for (const [x, z, gr, roof] of cells) {
  const top = Math.abs(roof - R) > 6 ? roof : R;
  const capY = Math.min(31, top - 1);
  let n = Math.max(1, Math.round((capY - gr) / 5));
  while (gr + 5 * n > 31 && n > 1) n--;
  const tops = gr + 5 * n;

  const mN = !has(x, z - 1), mS = !has(x, z + 1), mW = !has(x - 1, z), mE = !has(x + 1, z);
  const missCount = [mN, mS, mW, mE].filter(Boolean).length;
  info.push({ x, z, gr, n, tops, perim: missCount > 0, corner: missCount >= 2,
              mN, mS, mW, mE });

  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  for (let s = 0; s <= n; s++) put(x, gr + 5 * s, z, FLOOR);
}

// Perimeter walls, storey lines
for (const c of info) {
  if (!c.perim) continue;
  for (let y = c.gr; y <= c.tops; y++) put(c.x, y, c.z, WALL);
  for (let s = 0; s <= c.n; s++) put(c.x, c.gr + 5 * s, c.z, BAND);
}

// Choose entrance face: the south-most perimeter edge (fallback: any open edge)
let entrance = null;
for (const c of info) {
  if (!c.perim || c.corner || c.gr !== Math.min(...info.map((i) => i.gr))) continue;
  const score = (c.mS ? 3 : 0) + (c.mN ? 1 : 0) + c.z / 100 + (c.x > 4 && c.x < 10 ? 0.5 : 0);
  if (!entrance || score > entrance.score) entrance = { ...c, score };
}

// Windows: regular bays on every non-corner face cell
for (const c of info) {
  if (!c.perim || c.corner) continue;
  const alongIdx = (c.mN || c.mS) ? c.x : c.z;
  const bayOn = alongIdx % 2 === 1;
  for (let s = 0; s < c.n; s++) {
    const base = c.gr + 5 * s;
    const isEntryCell = entrance && c.x === entrance.x && c.z === entrance.z;
    if (s === 0 && isEntryCell) continue; // handled below
    if (s === 0) {
      // Ground storey: shopfront glazing across bays, pier-frames between
      if (bayOn) {
        put(c.x, base + 1, c.z, BAND);
        for (let y = base + 2; y <= base + 3; y++) put(c.x, y, c.z, GLASS);
      } else {
        for (let y = base + 1; y <= base + 3; y++) put(c.x, y, c.z, FRAME);
      }
      put(c.x, base + 4, c.z, TRIM);
    } else if (bayOn) {
      // Upper storeys: sill, two rows of glass, lintel
      put(c.x, base + 1, c.z, BAND);
      put(c.x, base + 2, c.z, GLASS);
      put(c.x, base + 3, c.z, GLASS);
      if ((alongIdx + s) % 3 === 0) put(c.x, base + 2, c.z, LIT);
      put(c.x, base + 4, c.z, TRIM);
    }
  }
}

// Entrance: double doors, canopy-line above, step at the threshold
if (entrance) {
  const { x, z, gr } = entrance;
  const face = entrance.mS ? "south" : entrance.mN ? "north" : entrance.mE ? "east" : "west";
  const hinge = "left";
  put(x, gr + 1, z, "oak_door", { facing: face, half: "lower", hinge, open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing: face, half: "upper", hinge, open: "false", powered: "false" });
  put(x, gr + 3, z, GLASS);
  put(x, gr + 4, z, TRIM);
  put(x, gr + 1, z, "oak_door", { facing: face, half: "lower", hinge, open: "false", powered: "false" });
}

// Roof cap across all cells
for (const c of info) put(c.x, c.tops, c.z, CAP);

// Single cornice course on the tallest tier only, as a wall-cap, not a stray slab
const maxTops = Math.max(...info.map((c) => c.tops));
for (const c of info) {
  if (c.perim && c.tops === maxTops && c.tops + 1 <= 31) {
    put(c.x, c.tops + 1, c.z, "stone_brick_wall", { north: "low", south: "low", east: "none", west: "none", up: "false", waterlogged: "false" });
  }
}

// Plant room on the top tier, centred, with a small lit window
for (const c of info) {
  if (c.perim || c.tops !== maxTops) continue;
  if (c.x >= 5 && c.x <= 8 && c.z >= 4 && c.z <= 7) {
    for (let y = c.tops + 1; y <= c.tops + 2 && y <= 31; y++) put(c.x, y, c.z, FLOOR);
    if (c.x === 6 && c.z === 6 && c.tops + 2 <= 31) put(c.x, c.tops + 2, c.z, LIT);
  }
}

g.save(`${DIR}/${ID}.nbt`);
