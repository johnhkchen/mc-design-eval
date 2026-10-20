import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3423335";
const W = 113, D = 63, H = 19;

// ---- load footprint: [x, z, ground, roof] per cell ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? raw.features ?? []);
const rows = list.map(c => Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof]);

const key = (x, z) => `${x},${z}`;
const cellsMap = new Map();
for (const [x, z, gr, ro] of rows) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cellsMap.set(key(x, z), { x, z, g: Math.round(gr), r: Number(ro) });
}

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const DIR_NAME = { n: "north", s: "south", w: "west", e: "east" };
const inF = (x, z) => cellsMap.has(key(x, z));
const outDirs = (x, z) => Object.entries(DIRS)
  .filter(([, [dx, dz]]) => !inF(x + dx, z + dz))
  .map(([k]) => k);
const isPerim = (x, z) => outDirs(x, z).length > 0;
const alongIdx = (x, z, dir) => (dir === "n" || dir === "s") ? x : z;

// ---- smooth roof noise with a 3x3 mean ----
for (const c of cellsMap.values()) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = cellsMap.get(key(c.x + dx, c.z + dz));
    if (o) { s += o.r; n++; }
  }
  c.rs = s / n;
}

// inward distance from the perimeter (BFS)
const dist = new Map();
const queue = [];
for (const c of cellsMap.values()) {
  if (isPerim(c.x, c.z)) { dist.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of Object.values(DIRS)) {
    const k = key(c.x + dx, c.z + dz);
    const n = cellsMap.get(k);
    if (n && !dist.has(k)) { dist.set(k, d + 1); queue.push(n); }
  }
}

// storey-quantised heights (2 blocks per storey), stepped-back ring below a core
for (const c of cellsMap.values()) {
  const rel = c.rs - c.g;
  let h = Math.max(2, 2 * Math.round(rel / 2));
  const d = dist.get(key(c.x, c.z));
  if (d < 7 && h >= 6) h -= 2;
  h = Math.min(h, H - 1 - c.g);
  c.h = Math.max(2, h);
}

// ---- build ----
const g = new Voxels([W, H, D]);

for (const c of cellsMap.values()) {
  const { x, z, g: gr, h } = c;
  const d = dist.get(key(x, z));
  const outs = outDirs(x, z);
  const perim = outs.length > 0;
  const corner = outs.length >= 2;

  // foundation up to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // plinth / floor at ground level
  g.set(x, gr, z, "smooth_stone");

  for (let j = 1; j < h; j++) {
    const y = gr + j;

    // roof / cap layer
    if (j === h - 1) {
      let b;
      if (perim) b = "stone_brick_slab";                    // parapet cap
      else if (h === 2) {
        // open-space ground: lawn in 8-block patches, paths between
        b = (((x >> 3) + (z >> 3)) % 2 === 0) ? "grass_block" : "smooth_stone";
      } else {
        b = (x * 7 + z * 3) % 11 === 0 ? "moss_block" : "smooth_stone";
      }
      g.set(x, y, z, b);
      continue;
    }

    if (corner) { g.set(x, y, z, "stone_bricks"); continue; }

    if (!perim) {
      // interior: floor slabs per storey, air between; lamps behind the glass
      if (j % 2 === 0) g.set(x, y, z, "smooth_stone");
      else if (d === 1 && (x + z) % 6 === 0) g.set(x, y, z, "glowstone");
      continue;
    }

    // exterior wall: spandrels on even levels, window rows on odd levels
    if (j % 2 === 0) { g.set(x, y, z, "white_concrete"); continue; }
    const idx = alongIdx(x, z, outs[0]);
    g.set(x, y, z, idx % 4 === 0 ? "white_concrete" : "glass_pane");
  }
}

// ---- entrances: one at the midpoint of every face, with a canopy ----
const faceGroups = { n: [], s: [], w: [], e: [] };
for (const c of cellsMap.values()) {
  const outs = outDirs(c.x, c.z);
  if (outs.length === 1) faceGroups[outs[0]].push(c);
}
for (const dir of Object.keys(faceGroups)) {
  const cells = faceGroups[dir];
  if (cells.length === 0) continue;
  const idxs = cells.map(c => alongIdx(c.x, c.z, dir));
  const mid = Math.round((Math.min(...idxs) + Math.max(...idxs)) / 2);
  const door = cells.find(c => alongIdx(c.x, c.z, dir) === mid);
  if (!door || door.h < 4) continue;

  const facing = DIR_NAME[dir];
  const { x, z, g: gr } = door;
  g.set(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });

  // canopy over the entrance, three cells wide, on the storey-two line
  if (door.h >= 6) {
    for (const k of [-2, -1, 0, 1, 2]) {
      const cx = (dir === "n" || dir === "s") ? x + k : x;
      const cz = (dir === "n" || dir === "s") ? z : z + k;
      const o = cellsMap.get(key(cx, cz));
      if (!o) continue;
      const oo = outDirs(cx, cz);
      if (oo.length !== 1 || oo[0] !== dir) continue;
      g.set(cx, gr + 3, cz, "oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
