import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 44 Hicks Street, Brooklyn Heights: c.1879 Italianate-era walk-up.
// Brownstone ground storey and trim over red brick upper storeys,
// one smoothed flat roof with a stone cornice, a framed central entrance,
// and a few warm windows.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001531";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 24, D = 7;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const DIRS = {
  N: { dx: 0, dz: -1, facing: "north", axis: "x" },
  S: { dx: 0, dz: 1, facing: "south", axis: "x" },
  W: { dx: -1, dz: 0, facing: "west", axis: "z" },
  E: { dx: 1, dz: 0, facing: "east", axis: "z" },
};
const ORDER = ["N", "S", "W", "E"];

// Smooth the lidar roof into one flat tier: the mean of the cell roofs.
const roofs = cells.map((c) => c[3]);
const ROOF = Math.min(H - 4, Math.max(8, Math.round(roofs.reduce((a, b) => a + b, 0) / roofs.length)));

const cm = new Map();
for (const [x, z, gr] of cells) {
  cm.set(key(x, z), { x, z, g: Math.max(0, Math.round(gr)), r: ROOF });
}
const has = (x, z) => cm.has(key(x, z));
const exposed = (x, z) => ORDER.filter((d) => !has(x + DIRS[d].dx, z + DIRS[d].dz));

// Street front: exposed face with the most cells (ties: north first).
const faceCount = Object.fromEntries(ORDER.map((d) => [d, 0]));
for (const c of cm.values()) for (const d of exposed(c.x, c.z)) faceCount[d]++;
let front = ORDER[0];
for (const d of ORDER) if (faceCount[d] > faceCount[front]) front = d;

// Entrance: middle cell of the front face.
const frontCells = [...cm.values()]
  .filter((c) => exposed(c.x, c.z).includes(front))
  .sort((a, b) => (DIRS[front].axis === "x" ? a.x - b.x : a.z - b.z));
const doorCell = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;

// Storey floors: band at f, windows at f+1 and f+2; top window row stays below the cornice band.
function floorsOf(c) {
  const arr = [];
  for (let f = c.g; f + 2 <= c.r - 3; f += 3) arr.push(f);
  return arr;
}

function glassProps(d) {
  return DIRS[d].axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { east: "false", west: "false", north: "true", south: "true" };
}

for (const c of cm.values()) {
  const { x, z } = c;
  const F = floorsOf(c);
  const exp = exposed(x, z);
  const boundary = exp.length > 0;

  // Foundation from y 0 to this cell's ground.
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs per storey.
  for (const f of F) g.set(x, f, z, boundary ? "brown_terracotta" : "smooth_stone");

  // Roof deck / cornice top.
  g.set(x, c.r - 1, z, boundary ? "stone_bricks" : "smooth_stone");

  if (!boundary) continue;

  for (let y = c.g; y <= c.r - 2; y++) {
    if (y === c.r - 2) { g.set(x, y, z, "brown_terracotta"); continue; } // corbel band
    if (F.includes(y)) { g.set(x, y, z, "brown_terracotta"); continue; } // storey band

    let f = null;
    for (const ff of F) if (y > ff && y <= ff + 2) f = ff;
    if (f === null) { g.set(x, y, z, "bricks"); continue; }

    const d = exp[0];
    const t = DIRS[d].axis === "x" ? x : z;
    const pier = t % 4 === 0 || t % 4 === 3;
    if (pier) {
      g.set(x, y, z, f === c.g ? "stone_bricks" : "bricks");
    } else {
      g.set(x, y, z, "glass_pane", glassProps(d));
    }
  }

  // Warm light behind a few windows (sparse pattern).
  for (const f of F) {
    for (const d of exp) {
      const t = DIRS[d].axis === "x" ? x : z;
      if (t % 4 === 0 || t % 4 === 3) continue;
      if ((x * 7 + z * 3 + f) % 9 !== 0) continue;
      const ix = x - DIRS[d].dx, iz = z - DIRS[d].dz;
      if (!has(ix, iz) || exposed(ix, iz).length) continue;
      g.set(ix, f + 1, iz, "glowstone");
      g.set(ix, f + 2, iz, "glowstone");
      break;
    }
  }
}

// Entrance: stone-framed opening with a door and a lintel, so it reads at street level.
if (doorCell) {
  const { x, z, g: gr } = doorCell;
  const fd = DIRS[front];
  const doorProps = (half) => ({
    facing: fd.facing, half, hinge: "left", open: "false", powered: "false",
  });
  // Frame pilasters on the cells beside the door along the front face.
  for (const off of [-1, 1]) {
    const nx = fd.axis === "x" ? x + off : x;
    const nz = fd.axis === "z" ? z + off : z;
    if (!has(nx, nz)) continue;
    for (let y = gr; y <= gr + 2; y++) g.set(nx, y, nz, "stone_bricks");
  }
  g.set(x, gr, z, "dark_oak_door", doorProps("lower"));
  g.set(x, gr + 1, z, "dark_oak_door", doorProps("upper"));
  g.set(x, gr + 2, z, "stone_bricks");
}

// A few roof chimneys, kept sparse.
let chimneys = 0;
for (const c of cm.values()) {
  if (chimneys >= 3) break;
  if (exposed(c.x, c.z).length) continue;
  if ((c.x + 2 * c.z) % 11 !== 0) continue;
  if (c.r + 2 > H) continue;
  g.set(c.x, c.r, c.z, "bricks");
  g.set(c.x, c.r + 1, c.z, "bricks");
  chimneys++;
}

g.save(`${DIR}/${ID}.nbt`);
