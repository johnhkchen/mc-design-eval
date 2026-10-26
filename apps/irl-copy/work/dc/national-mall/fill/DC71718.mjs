import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 27, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/DC71718.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, g, r] of cells) {
  raw.set(key(x, z), { g: Math.min(19, Math.max(0, Math.round(g))), r: Number.isFinite(r) ? Math.round(r) : null });
}
const inFp = (x, z) => raw.has(key(x, z));

// Smooth lidar roof heights with a 3x3 median inside the footprint, then quantise
// into whole 3-block storeys: floor lines every 3 blocks from the cell's ground,
// flat roof deck at T, solid parapet course at T+1.
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const info = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(key(x + dx, z + dz));
    if (n && n.r !== null) rs.push(n.r);
  }
  const g = c.g;
  const sr = rs.length ? median(rs) : g + 12;
  let n = Math.max(2, Math.round((sr - g - 1) / 3));
  n = Math.max(1, Math.min(n, Math.floor((20 - g) / 3)));
  info.set(k, { g, n, T: g + 3 * n });
}

const g = new Voxels([W, H, D]);

// Entrance: nearest north-facing perimeter cell to the centre line.
const EX = Math.floor(W / 2);
let entrance = null;
for (let dx = 0; dx < W && !entrance; dx++) {
  for (const x of [EX + dx, EX - dx]) {
    for (const [kk] of raw) {
      const [cx, cz] = kk.split(",").map(Number);
      if (cx === x && !inFp(cx, cz - 1)) { entrance = { x: cx, z: cz }; break; }
    }
    if (entrance) break;
  }
}

for (const [k, { g: gr, n, T }] of info) {
  const [x, z] = k.split(",").map(Number);
  const N = !inFp(x, z - 1), S = !inFp(x, z + 1), Wf = !inFp(x - 1, z), E = !inFp(x + 1, z);
  const perim = N || S || Wf || E;
  const corner = (N || S) && (Wf || E);
  const pier = corner || ((N || S) && x % 3 === 0) || ((Wf || E) && z % 3 === 0);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= T; y++) {
    const k3 = Math.floor((y - gr) / 3);
    const rel = (y - gr) % 3;
    if (perim) {
      let b;
      if (y === T) b = "chiseled_stone_bricks";
      else if (y === gr) b = "stone_bricks";
      else if (rel === 0) b = pier ? "calcite" : "smooth_stone";
      else b = pier ? "calcite" : "glass_pane";
      g.set(x, y, z, b);
    } else {
      if (rel === 0 || y === T) g.set(x, y, z, "smooth_stone");
      else if (rel === 1 && k3 < n && ((x * 7 + z * 3 + k3) % 6 === 0)) g.set(x, y, z, "glowstone");
    }
  }
  // Continuous solid parapet course (full blocks, no gapped posts).
  if (perim) {
    g.set(x, T + 1, z, "stone_bricks");
    g.set(x, T + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance: door in the street face, flanked by calcite jambs and a lintel.
if (entrance) {
  const { x, z } = entrance;
  const { g: gr } = info.get(key(x, z));
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false" });
  g.set(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false" });
  for (const dx of [-1, 1]) {
    if (inFp(x + dx, z)) {
      g.set(x + dx, gr + 1, z, "calcite");
      g.set(x + dx, gr + 2, z, "calcite");
    }
  }
  // Lintel course over the doorway, with a lantern under it on the centre line.
  for (const dx of [-1, 0, 1]) {
    if (inFp(x + dx, z)) g.set(x + dx, gr + 3, z, "smooth_stone");
  }
  if (inFp(x - 1, z)) g.set(x - 1, gr + 3, z, "calcite");
}

// Roof penthouse on the flat tier, if the massing allows it.
const PH = { x0: 9, x1: 17, z0: 4, z1: 9 };
let phOk = true;
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  if (!inFp(x, z)) phOk = false;
}
if (phOk) {
  const T = info.get(key(PH.x0 + 4, PH.z0 + 2))?.T;
  const sameTier = T !== undefined && T <= 18 && [...Array(PH.x1 - PH.x0 + 1)].every((_, i) =>
    [...Array(PH.z1 - PH.z0 + 1)].every((_, j) => info.get(key(PH.x0 + i, PH.z0 + j)).T === T));
  if (sameTier) {
    for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
      const ring = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
      const midFace = (z === PH.z0 || z === PH.z1) && x % 2 === 1;
      g.set(x, T + 3, z, ring ? "chiseled_stone_bricks" : "smooth_stone");
      if (ring) {
        for (let y = T + 1; y <= T + 2; y++) {
          g.set(x, y, z, midFace ? "glass_pane" : "calcite");
        }
      }
    }
  }
}

g.save(`${DIR}/DC71718.nbt`);
