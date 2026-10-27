// Way 332241947, Eden Terrace side of the CBD seen from Maungawhau: a 1930s reinforced-concrete Art Deco office and shop block.
// Five storeys on the main body (roof at 20, parapet to 21), a four-storey wing on the west and a two-storey corner on the north.
// Cream render and quartz string courses, black polished-stone shopfronts, copper parapet caps, glass in quartz piers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241947.cells.json`, "utf8"));
const SIZE = [23, 33, 26];
const GLASS = "light_blue_stained_glass_pane";

// footprint by cell, x 0..22 (east), z 0..25 (south)
const F = new Map();
for (const [x, z, g, r] of cells) F.set(`${x},${z}`, { x, z, g, r });
const at = (x, z) => F.get(`${x},${z}`);

// 1. Smooth the lidar roof: 3x3 median over footprint neighbours, then to whole 4-block storeys, from the ground's first storey line up to 20.
const median = (v) => v.sort((a, b) => a - b)[Math.floor(v.length / 2)];
for (const c of F.values()) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.r); }
  const L = 4 * Math.floor(c.g / 4) + 4;                          // the first storey line above this cell's ground
  c.L = L;
  c.H = Math.max(L, Math.min(20, Math.round(median(v) / 4) * 4)); // roof row: 4, 8, 12, 16 or 20
}

// 2. Exposed sides: a side faces outside the footprint, or a lower tier (then it shows only above that tier's roof).
const DIRS = [
  { k: "W", dx: -1, dz: 0, inner: [1, 0], along: (c) => c.z },    // west is the street face: shopfronts
  { k: "E", dx: 1, dz: 0, inner: [-1, 0], along: (c) => c.z },
  { k: "N", dx: 0, dz: -1, inner: [0, 1], along: (c) => c.x },
  { k: "S", dx: 0, dz: 1, inner: [0, -1], along: (c) => c.x },
];
for (const c of F.values()) {
  c.sides = DIRS.map((d) => {
    const n = at(c.x + d.dx, c.z + d.dz);
    const from = !n ? c.g : n.H < c.H ? n.H : null;
    return from === null ? null : { ...d, from };
  }).filter(Boolean);
}
const exposed = (c, y) => c.sides.filter((s) => y >= s.from);

// 3. The entrance: a ground-floor west-face cell near the middle of the street face, on the tallest tier.
const doorCands = [...F.values()].filter((c) => c.sides.some((s) => s.k === "W" && s.from === c.g) && c.g <= c.L - 4 && c.H >= 12);
doorCands.sort((a, b) => (b.H === 20) - (a.H === 20) || Math.abs(a.z - 14) - Math.abs(b.z - 14));
const door = doorCands[0];

// 4. Columns, bottom up: foundation, plinth, storey lines, facades, interiors.
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, [block, state ?? null]);
const solid = (x, y, z) => B.has(`${x},${y},${z}`);
const glass = [];

for (const c of F.values()) {
  const { x, z, g, H: top, L } = c;
  for (let y = 0; y <= top; y++) {
    const ex = exposed(c, y);
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }                                   // foundation to grade
    if (y === top) { put(x, y, z, c.sides.length ? "oxidized_cut_copper" : "smooth_stone"); continue; } // roof, copper parapet on the edge
    if (y === g) { put(x, y, z, ex.length ? "polished_andesite" : "smooth_stone"); continue; } // base course / ground slab
    if (y % 4 === 0) { put(x, y, z, ex.length ? "smooth_quartz" : "smooth_stone"); continue; } // string course / floor slab
    if (!ex.length) continue;                                                                // interior air behind the glass

    const s = ex[0], a = s.along(c), ground = y < L;
    if (door && c === door && (y === g + 1 || y === g + 2)) {
      put(x, y, z, "dark_oak_door", { facing: "east", half: y === g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ground && y === L - 1) put(x, y, z, "polished_blackstone");                              // shop fascia
    else if (a % 3 === 0) put(x, y, z, ground ? "polished_blackstone" : "smooth_quartz");       // piers
    else if (!ground && y % 4 === 3) put(x, y, z, "white_concrete");                             // spandrel under each window head
    else { put(x, y, z, GLASS); glass.push({ x, y, z, ix: s.inner[0], iz: s.inner[1] }); }
  }
}

// 5. Warm light: glowstone on the floor just inside some windows (sitting on the slab below).
for (const { x, y, z, ix, iz } of glass) {
  if (((x * 31 + z * 17 + y * 7) % 4) !== 0) continue;
  const I = at(x + ix, z + iz);
  if (!I || I.H <= y || exposed(I, y).length || solid(I.x, I.y ?? y, I.z) || !solid(I.x, y - 1, I.z)) continue;
  put(I.x, y, I.z, "glowstone");
}

// 6. Roof plant: a solid box on the main roof, copper cap.
for (let x = 14; x <= 17; x++) for (let z = 8; z <= 10; z++) {
  if (at(x, z)?.H !== 20) continue;
  for (let y = 21; y <= 23; y++) {
    const edge = x === 14 || x === 17 || z === 8 || z === 10;
    put(x, y, z, y === 23 ? "oxidized_cut_copper" : edge ? "white_concrete" : "smooth_stone");
  }
}

// 7. Panes join their neighbours (glass or any solid), as a vanilla pane does, so each window grid reads as one run.
const PANE = (x, y, z) => B.get(`${x},${y},${z}`)?.[0] === GLASS;
const full = (x, y, z) => { const b = B.get(`${x},${y},${z}`)?.[0]; return b !== undefined && b !== "dark_oak_door"; };
for (const g2 of glass) {
  const { x, y, z } = g2;
  const st = {
    north: full(x, y, z - 1) ? "true" : "false", south: full(x, y, z + 1) ? "true" : "false",
    east: full(x + 1, y, z) ? "true" : "false", west: full(x - 1, y, z) ? "true" : "false", waterlogged: "false",
  };
  B.set(`${x},${y},${z}`, [GLASS, st]);
}

// 8. Write it.
const g = new Voxels(SIZE);
for (const [key, [block, state]] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state ?? undefined);
}
const { blocks, palette } = g.save(`${DIR}/way_332241947.nbt`);
console.log(`way_332241947.nbt: ${blocks} blocks, palette ${palette}, glass ${glass.length}, door at x${door?.x} z${door?.z}`);
