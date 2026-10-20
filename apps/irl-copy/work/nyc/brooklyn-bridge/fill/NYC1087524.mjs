import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1087524";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 28, H = 31, D = 18;
const vox = new Voxels([W, H, D]);

const K = (x, z) => `${x},${z}`;
const K3 = (x, y, z) => `${x},${y},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(K(x, z), { x, z, gr: Math.round(gr), rf });
const inside = (x, z) => cellMap.has(K(x, z));

const DIRS = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];
const outward = (x, z) => {
  for (const [dx, dz, n] of DIRS) if (!inside(x + dx, z + dz)) return { dx, dz, n };
  return null;
};

// Inner depth: 1 = perimeter wall, 2 = air gap behind it, etc.
const depth = new Map();
const queue = [];
for (const c of cellMap.values()) {
  if (outward(c.x, c.z)) { depth.set(K(c.x, c.z), 1); queue.push([c.x, c.z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(K(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !depth.has(K(nx, nz))) {
      depth.set(K(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dep = (x, z) => depth.get(K(x, z)) ?? 1;

// Roof massing: broad 5x5 average, quantised to 4-block tiers so setbacks read as
// clean steps rather than lidar noise. Floor of ground+6 keeps every cell a real building.
for (const c of cellMap.values()) {
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const q = cellMap.get(K(c.x + dx, c.z + dz));
    if (q) { s += q.rf; n++; }
  }
  let rv = Math.round(s / n / 4) * 4;
  rv = Math.min(20, Math.max(rv, c.gr + 6));
  c.rv = rv;
}

// One clean central penthouse on the main tier only.
const isPent = (x, z) => {
  const c = cellMap.get(K(x, z));
  return !!c && dep(x, z) >= 4 && x >= 8 && x <= 19 && c.rv >= 16;
};
const isPentRing = (x, z) =>
  isPent(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !isPent(x + dx, z + dz));

// Entrance: north-facing wall cell nearest the middle of that wall.
const northCells = [...cellMap.values()].filter((c) => {
  const o = outward(c.x, c.z);
  return o && o.n === "north";
});
let doorKey = null;
let doorX = null;
if (northCells.length) {
  const mx = northCells.reduce((a, c) => a + c.x, 0) / northCells.length;
  northCells.sort((a, b) => Math.abs(a.x - mx) - Math.abs(b.x - mx));
  doorKey = K(northCells[0].x, northCells[0].z);
  doorX = northCells[0].x;
}

const glows = new Set();

// Pass 1: foundations, walls, floors, roofs.
for (const c of cellMap.values()) {
  const { x, z, gr: G, rv } = c;
  const d = dep(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) vox.set(x, y, z, "stone_bricks");

  // Floor slabs: base at G, then stacked down from the roof so the top storey
  // ends on a slab directly under the roof. Ground storey = rows G+1..b-1.
  const S = new Set([G]);
  let b = rv - 1;
  S.add(b);
  while (b - 2 >= G + 3) { b -= 2; S.add(b); }

  if (d === 1) {
    const o = outward(x, z);
    const t = o.dx !== 0 ? z : x;
    const alongX = o.dx === 0;
    const paneProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    const isDoor = K(x, z) === doorKey;
    // Door surround: the bays either side of the entrance become solid stone piers.
    const nearDoor = doorX !== null && !isDoor && o.n === "north" && Math.abs(x - doorX) === 1;

    for (let y = G; y <= rv; y++) {
      if (y === G) { vox.set(x, y, z, "polished_granite"); continue; }
      if (y === rv) { vox.set(x, y, z, "stone_bricks"); continue; }
      if (y === rv - 1) {
        vox.set(x, y, z, t % 2 ? "stone_bricks" : "chiseled_stone_bricks");
        continue;
      }
      if (S.has(y)) { vox.set(x, y, z, "stone_bricks"); continue; }

      const ground = y < b;

      if (isDoor && (y === G + 1 || y === G + 2)) {
        const half = y === G + 1 ? "lower" : "upper";
        vox.set(x, y, z, "oak_door", { facing: o.n, half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoor && y > G + 2) { vox.set(x, y, z, "stone_bricks"); continue; }
      if (nearDoor && ground && y <= G + 2) { vox.set(x, y, z, "stone_bricks"); continue; }

      // Paired windows: two glass bays then one brick pier, every third cell.
      const win = t % 3 !== 0;
      if (win) {
        vox.set(x, y, z, "glass_pane", paneProps);
        if (!ground && (x * 7 + z * 5 + y) % 5 === 0) {
          const ix = x - o.dx, iz = z - o.dz;
          if (inside(ix, iz) && dep(ix, iz) === 2) glows.add(K3(ix, y, iz));
        }
      } else {
        vox.set(x, y, z, "bricks");
      }
    }
  } else {
    // Inner cells: floor slabs and roof only, with an air gap between them.
    for (const y of S) {
      if (y < rv - 1) vox.set(x, y, z, "smooth_stone");
    }
    vox.set(x, rv - 1, z, "stone");
  }
}

// Pass 2: central penthouse on the main roof tier.
for (const c of cellMap.values()) {
  const { x, z, rv } = c;
  if (!isPent(x, z)) continue;
  if (isPentRing(x, z)) {
    vox.set(x, rv, z, (x + z) % 2 === 0 ? "glass" : "white_concrete");
    vox.set(x, rv + 1, z, "white_concrete");
  } else {
    vox.set(x, rv, z, "white_concrete");
    vox.set(x, rv + 1, z, "gray_concrete");
  }
}

// Pass 3: warm lights behind some upper windows.
for (const k of glows) {
  const [x, y, z] = k.split(",").map(Number);
  vox.set(x, y, z, "glowstone");
}

vox.save(`${DIR}/${ID}.nbt`);
