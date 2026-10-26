import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC62327";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 58, D = 30, H = 36;
const key = (x, z) => `${x},${z}`;

const raw = new Map();
for (const [x, z, g, r] of cells) raw.set(key(x, z), { g, r });
const isIn = (x, z) => raw.has(key(x, z));

// Wider 5x5 median smoothing kills single-cell lidar spikes and stray stubs.
const median = (arr) => {
  arr.sort((a, b) => a - b);
  return arr[Math.floor(arr.length / 2)];
};

const cell = new Map();
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const rs = [], gs = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const n = raw.get(key(x + dx, z + dz));
    if (n) { rs.push(n.r); gs.push(n.g); }
  }
  const medR = median(rs);
  const medG = median(gs);
  const G = Math.ceil(medG / 2) * 2;
  let R = Math.round(medR / 2) * 2;
  if (R < G + 4) R = G + 4;
  if (R > 26) R = 26;
  cell.set(key(x, z), { x, z, G, R, edge: false, d: 0 });
}

// Second pass: a roof may not stand more than 2 blocks above its immediate neighbours' median.
const adjust = new Map();
for (const c of cell.values()) {
  const nb = [];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]]) {
    const n = cell.get(key(c.x + dx, c.z + dz));
    if (n) nb.push(n.R);
  }
  adjust.set(key(c.x, c.z), Math.min(c.R, median(nb) + 2));
}
for (const c of cell.values()) {
  c.R = Math.max(adjust.get(key(c.x, c.z)), c.G + 4);
}

// Edge detection and perimeter distance
for (const c of cell.values()) {
  c.edge = !cell.has(key(c.x - 1, c.z)) || !cell.has(key(c.x + 1, c.z)) ||
           !cell.has(key(c.x, c.z - 1)) || !cell.has(key(c.x, c.z + 1));
}
const dist = new Map();
let frontier = [];
for (const c of cell.values()) if (c.edge) { dist.set(key(c.x, c.z), 1); frontier.push(c); }
while (frontier.length) {
  const next = [];
  for (const c of frontier) {
    const d = dist.get(key(c.x, c.z));
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = key(c.x + dx, c.z + dz);
      if (cell.has(k) && !dist.has(k)) { dist.set(k, d + 1); next.push(cell.get(k)); }
    }
  }
  frontier = next;
}
for (const c of cell.values()) c.d = dist.get(key(c.x, c.z)) ?? 1;

const maxR = Math.max(...[...cell.values()].map(c => c.R));
const zMin = Math.min(...[...cell.values()].map(c => c.z));
const streetRow = [...cell.values()].filter(c => c.z === zMin && c.edge);
const cx = Math.round(streetRow.reduce((s, c) => s + c.x, 0) / streetRow.length);

const g = new Voxels([W, H, D]);

// Pass 1: massing, foundations, facades, floors, roofs
for (const c of cell.values()) {
  const { x, z, G, R, edge } = c;

  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  for (let y = G; y <= R - 2; y++) {
    if (edge) {
      const alongX = !cell.has(key(x, z - 1)) || !cell.has(key(x, z + 1));
      const alongZ = !cell.has(key(x - 1, z)) || !cell.has(key(x + 1, z));
      const p = alongX && !alongZ ? x : (alongZ && !alongX ? z : x + z);
      // Pilaster every 6 blocks, full height, reads as vertical rhythm
      const pier = (alongX && alongZ) || p % 6 === 0 || p % 6 === 5;
      if (y < G + 2) {
        g.set(x, y, z, "stone_bricks");                       // base course
      } else if (pier) {
        g.set(x, y, z, "smooth_stone");                       // piers
      } else if (y % 2 === 0) {
        g.set(x, y, z, "calcite");                            // spandrel band
      } else if (((p * 5 + y * 7) % 13) === 0) {
        g.set(x, y, z, "glowstone");                          // warm lit office
      } else {
        g.set(x, y, z, "glass_pane");
      }
    } else {
      if (y % 2 === 0) g.set(x, y, z, "light_gray_concrete");  // floor slabs
    }
  }

  // Roof deck and parapet
  g.set(x, R - 1, z, edge ? "chiseled_stone_bricks" : "smooth_stone");
  if (edge) g.set(x, R, z, "stone_brick_wall");

  // Mechanical penthouse on the top tier, set back from the edge
  if (R === maxR && c.d >= 4) {
    for (let y = R; y <= R + 1; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, R + 2, z, "smooth_stone");
  }
}

// Pass 2: street entrance, five bays wide, double doors in the centre
for (const c of streetRow) {
  const { x, G } = c;
  const dxC = x - cx;
  if (dxC === 0 || dxC === 1) {
    const hinge = dxC === 0 ? "left" : "right";
    g.set(x, G, c.z, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    g.set(x, G + 1, c.z, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  } else if (Math.abs(dxC) >= 2 && Math.abs(dxC) <= 4) {
    g.set(x, G, c.z, "glass_pane");
    g.set(x, G + 1, c.z, "glass_pane");
  } else if (Math.abs(dxC) === 5) {
    g.set(x, G, c.z, "stone_bricks");
    g.set(x, G + 1, c.z, "stone_bricks");
  }
  // Lintel over the entrance, a warm band of light
  if (Math.abs(dxC) <= 4) g.set(x, G + 2, c.z, "smooth_stone");
}

// Warm lanterns just inside the entrance
for (const dx of [-3, 3]) {
  const inside = cell.get(key(cx + dx, zMin + 1));
  if (inside && inside.G + 1 < inside.R - 2) {
    g.set(cx + dx, inside.G + 1, zMin + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
