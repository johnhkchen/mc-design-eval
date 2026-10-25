import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499690";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 37, D = 16;
const g = new Voxels([W, H, D]);

const S = new Map();
for (const c of cells) {
  const [x, z, gr, roof] = c;
  S.set(`${x},${z}`, { x, z, gr: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => S.has(`${x},${z}`);
const isPerim = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
function outwardFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}
const DV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// One flat roof level for the whole block: median lidar roof, clamped to the build height.
const roofs = [...S.values()].map(c => c.roof).sort((a, b) => a - b);
const T = Math.min(34, Math.max(10, roofs[Math.floor(roofs.length / 2)]));
const STOREY = 5;

// Floor levels aligned to the roof: T, T-5, T-10 ... down to 0.
const aligned = [];
for (let y = T; y >= 0; y -= STOREY) aligned.unshift(y);

// Entrance: north-most straight exposed wall, nearest the middle.
const minZ = Math.min(...[...S.values()].map(c => c.z));
const doorCands = [...S.values()]
  .filter(c => c.z === minZ && !has(c.x, c.z - 1) && has(c.x - 1, c.z) && has(c.x + 1, c.z))
  .map(c => c.x).sort((a, b) => a - b);
const midX = doorCands.length ? doorCands[Math.floor(doorCands.length / 2)] : -1;

const levelsFor = (gr) => {
  const L = new Set(aligned.filter(y => y >= gr));
  L.add(gr);
  return [...L].sort((a, b) => a - b);
};

// Pass 1: foundation, floor slabs, roof surface, walls.
for (const c of S.values()) {
  const { x, z } = c;
  const gr = Math.min(c.gr, T - STOREY);
  const perim = isPerim(x, z);
  const L = levelsFor(gr);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "granite");
  for (const y of L) {
    if (y === T) continue;
    g.set(x, y, z, perim ? "stone_bricks" : "spruce_planks");
  }
  g.set(x, T, z, "deepslate_tiles");
  if (perim) {
    for (let y = gr + 1; y < T; y++) {
      if (L.includes(y)) continue;
      g.set(x, y, z, "white_terracotta");
    }
  }
}

// Pass 2: perimeter articulation.
for (const c of S.values()) {
  const { x, z } = c;
  const gr = Math.min(c.gr, T - STOREY);
  const faces = outwardFaces(x, z);
  if (!faces.length) continue;
  const L = levelsFor(gr);

  g.set(x, T - 1, z, "stone_bricks");          // cornice
  g.set(x, T + 1 <= 35 ? T + 1 : T, z, "stone_brick_wall"); // parapet

  if (faces.length >= 2) {
    for (let y = gr + 1; y < T - 1; y++) g.set(x, y, z, "stone_bricks");
    continue;
  }
  const face = faces[0];
  const idx = (face === "N" || face === "S") ? x : z;
  if (idx % 3 === 0) continue;

  for (let i = 0; i < L.length - 1; i++) {
    const base = L[i], top = L[i + 1];
    if (base === T) continue;
    if (i === 0) {
      for (let y = base + 1; y <= base + 3 && y < top; y++) g.set(x, y, z, "glass_pane");
      if (base + 4 < top) g.set(x, base + 4, z, "dark_oak_planks"); // shopfront fascia
    } else {
      g.set(x, base + 1, z, "stone_bricks"); // sill
      for (let y = base + 2; y <= base + 3 && y < top; y++) g.set(x, y, z, "glass_pane");
      if (top - 1 > base + 3) g.set(x, top - 1, z, "stone_bricks"); // lintel band
    }
  }
}

// Pass 3: entrance and canopy.
if (midX >= 0) {
  const gr = Math.min(S.get(`${midX},${minZ}`).gr, T - STOREY);
  const props = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(midX, gr + 1, minZ, "oak_door", { ...props, half: "lower" });
  g.set(midX, gr + 2, minZ, "oak_door", { ...props, half: "upper" });
  for (let dx = -1; dx <= 1; dx++) {
    if (has(midX + dx, minZ) && dx !== 0)
      g.set(midX + dx, gr + 4, minZ, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
  g.set(midX, gr + 3, minZ, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 4: warm light behind a few windows.
for (const c of S.values()) {
  const { x, z } = c;
  const gr = Math.min(c.gr, T - STOREY);
  const faces = outwardFaces(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const idx = (face === "N" || face === "S") ? x : z;
  if (idx % 3 === 0) continue;
  const [ox, oz] = DV[face];
  const ix = x - ox, iz = z - oz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const L = levelsFor(gr);
  for (let i = 0; i < L.length - 1; i++) {
    if (L[i] === T) continue;
    if (((x * 3 + z * 5 + i) % 6) !== 0) continue;
    g.set(ix, L[i] + 2, iz, "glowstone");
  }
}

// Pass 5: a few roof chimneys, interior only.
for (const c of S.values()) {
  const { x, z } = c;
  if (isPerim(x, z)) continue;
  if ((x + z) % 9 === 3 && T + 2 <= 35) {
    g.set(x, T + 1, z, "bricks");
    g.set(x, T + 2, z, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
