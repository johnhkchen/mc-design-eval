import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87140";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 31, D = 24;
const g = new Voxels([W, H, D]);

// Westory Building: 1920s Commercial-Office, 5 storeys of buff brick over a
// rusticated stone base, shopfront at grade, stone string courses every 3 blocks,
// quartz cornice and a brick parapet, with a small penthouse on the roof.
const key = (x, z) => `${x},${z}`;
const cm = new Map();
for (const [x, z, gr, rf] of cells) cm.set(key(x, z), { gr, rf });
const has = (x, z) => cm.has(key(x, z));
const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const PANE = { north: "true", south: "true", east: "true", west: "true" };

// Pass 1: foundation and solid core for every footprint cell.
for (const [x, z, gr, rf] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < rf; y++) g.set(x, y, z, "stone");
}

// Pass 2: facades on edge cells, recording window gaps for later.
const gaps = [];
const doorCandidates = [];
for (const [x, z, gr, rf] of cells) {
  const face = DIRS.find((d) => !has(x + d.dx, z + d.dz));
  if (!face) continue;
  const top = rf - 1;
  const idx = face.dx !== 0 ? z : x;
  const inward = { x: x - face.dx, z: z - face.dz, ok: has(x - face.dx, z - face.dz) };

  for (let y = gr; y <= top; y++) {
    const rel = y - gr;
    if (rel === 0) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === top) { g.set(x, y, z, "quartz_block"); continue; }
    if (y === top - 1) { g.set(x, y, z, "stone_bricks"); continue; }
    if (rel % 3 === 0) { g.set(x, y, z, "stone_bricks"); continue; }

    const pier = idx % 3 === 0;
    if (rel <= 2) {
      // Ground floor shopfront: glass bays between stone piers.
      g.set(x, y, z, pier ? "stone_bricks" : "glass_pane", pier ? undefined : PANE);
      if (!pier && inward.ok) gaps.push({ x: inward.x, y, z: inward.z, light: false });
      continue;
    }
    if (pier) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", PANE);
    // Warm light in a sparser, staggered pattern so the lit windows read as accents.
    if (inward.ok) gaps.push({ x: inward.x, y, z: inward.z, light: ((idx * 2 + rel * 3) % 9 === 0) });
  }

  // Parapet course sitting on the top of the wall.
  g.set(x, rf, z, "bricks");

  if (face.n === "north") doorCandidates.push({ x, z, gr, rf, idx, inward });
}

// Pass 3: carve air gaps behind the glass and place warm light in some of them.
for (const c of gaps) {
  g.set(c.x, c.y, c.z, c.light ? "glowstone" : "air");
}

// Pass 4: entrance on the north face, centred, two blocks high.
if (doorCandidates.length) {
  doorCandidates.sort((a, b) => Math.abs(a.x - 7) - Math.abs(b.x - 7));
  const d = doorCandidates[0];
  const base = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(d.x, d.gr + 1, d.z, "oak_door", { ...base, half: "lower" });
  g.set(d.x, d.gr + 2, d.z, "oak_door", { ...base, half: "upper" });
  if (d.inward.ok) {
    g.set(d.inward.x, d.gr + 1, d.inward.z, "air");
    g.set(d.inward.x, d.gr + 2, d.inward.z, "air");
  }
}

// Pass 5: penthouse / roof plant on the central interior roof.
for (let x = 5; x <= 9; x++) {
  for (let z = 8; z <= 15; z++) {
    const c = cm.get(key(x, z));
    if (!c) continue;
    const edge = DIRS.some((d) => !has(x + d.dx, z + d.dz));
    if (edge) continue;
    const inner = x >= 6 && x <= 8 && z >= 9 && z <= 14;
    if (!inner) continue;
    g.set(x, c.rf - 1, z, "stone_bricks");
    g.set(x, c.rf, z, "stone_bricks");
    g.set(x, c.rf + 1, z, "quartz_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
