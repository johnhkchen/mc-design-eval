// World War II Memorial, Washington DC: an oval plaza ringed by 56 granite pillars, the Rainbow Pool down the middle,
// two stepped pavilions (Atlantic north, Pacific south) with a through-passage, and the Freedom Wall on the east side.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87521.cells.json", "utf8"));
const g = new Voxels([55, 22, 62]);
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const ground = (x, z) => foot.get(`${x},${z}`).ground;

const CX = 27, CZ = 30.5;                            // the oval's centre
const ellipse = (x, z, rx, rz) => ((x - CX) / rx) ** 2 + ((z - CZ) / rz) ** 2;
const RING = [21, 27];                              // colonnade ellipse radii
const POOL = [8, 15];                               // Rainbow Pool ellipse radii

// Pavilions: [x0, x1, z0, z1, top offset]; the south one mirrors the north in z (z -> 61 - z)
const TIERS = [[15, 32, 0, 9, 3], [17, 30, 1, 7, 6], [19, 28, 2, 5, 9]];
const pavRects = TIERS.flatMap(([x0, x1, z0, z1, top]) => [[x0, x1, z0, z1, top], [x0, x1, 61 - z1, 61 - z0, top]]);
const pavTop = (x, z) => pavRects.reduce((t, [x0, x1, z0, z1, top]) => (x >= x0 && x <= x1 && z >= z0 && z <= z1 ? Math.max(t, top) : t), -1);
// through-passages in each pavilion's plaza-facing side: 3 wide, 3 high, under the top tier's floor
const passage = (x, z) => (x >= 23 && x <= 25 && ((z >= 7 && z <= 9) || (z >= 52 && z <= 54)));

// Colonnade: 56 pillar positions around the ring, kept off the pavilions and inside the footprint
const pillars = new Map();
for (let k = 0; k < 56; k++) {
  const t = (2 * Math.PI * k) / 56;
  const x = Math.round(CX + RING[0] * Math.cos(t)), z = Math.round(CZ + RING[1] * Math.sin(t));
  if (inFoot(x, z) && pavTop(x, z) < 0) pillars.set(`${x},${z}`, k);
}

// 1. foundations: solid from y 0 up to each cell's ground (plaza: stone; lawn: dirt)
for (const [x, z, gr] of cells) {
  const fill = ellipse(x, z, ...RING) < 1 ? "stone_bricks" : "dirt";
  for (let y = 0; y < gr; y++) g.set(x, y, z, fill);
}

// 2. surfaces at ground level: paved oval, grass outside, the Rainbow Pool
for (const [x, z, gr] of cells) {
  if (ellipse(x, z, ...POOL) < 1) g.set(x, gr, z, "water", { level: "0" });
  else if (ellipse(x, z, ...RING) < 1) g.set(x, gr, z, "smooth_stone");
  else g.set(x, gr, z, "grass_block");
}

// 3. colonnade: pillars standing on the paving, a chiseled capital, lanterns on every fourth
for (const [key, k] of pillars) {
  const [x, z] = key.split(",").map(Number), gr = ground(x, z);
  for (let y = gr; y <= gr + 6; y++) g.set(x, y, z, "smooth_quartz");
  g.set(x, gr + 7, z, "chiseled_quartz_block");
  if (k % 4 === 0) g.set(x, gr + 8, z, "lantern", { hanging: "false" });
}

// 4. pavilions: stepped tiers, each standing on the one below
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const top = pavTop(x, z);
  if (top < 0) continue;
  const gr = ground(x, z);
  for (let y = gr; y <= gr + top; y++) g.set(x, y, z, "smooth_quartz");
  g.set(x, gr + top, z, "chiseled_quartz_block");               // cornice cap on each tier's top course
}
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!passage(x, z)) continue;
  const gr = ground(x, z);
  for (let y = gr; y <= gr + 2; y++) g.set(x, y, z, "air");     // the through-passage, roofed by the tier's floor
}

// 5. Freedom Wall: a polished granite wall, two high, gold stars on the outer course
for (let z = 25; z <= 36; z++) {
  if (!inFoot(41, z)) continue;
  const gr = ground(41, z);
  g.set(41, gr + 1, z, "polished_granite");
  g.set(41, gr + 2, z, z % 2 ? "gold_block" : "polished_granite");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87521.nbt";
const info = g.save(out);
console.log("saved", out, info);
