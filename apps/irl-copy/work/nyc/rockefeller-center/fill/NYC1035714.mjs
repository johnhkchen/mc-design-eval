// 507 Madison Avenue, 1929 commercial and office building: a 19 x 27 setback office block of limestone over a granite-
// look base, in the 1920s Manhattan manner. Lidar roof read as clean tiers (48 wings, 57, 69 and a 81 tower), not cell by cell. Base: 3 storeys of polished andesite piers and shopfront glass with a
// double iron door under a black canopy on the east (avenue) face. Above: smooth limestone spandrels, quartz pillar
// piers, light-blue glass panes, a chiseled cornice on every tier and a parapet cap. Each tier is a solid column from
// its ground up, so nothing floats: floor slabs every 3 blocks, a roof deck under each cap, air behind the glass.
// Warm glowstone sits behind some panes. Light courts (lidar roof 1-2) are open to the sky and paved at ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035714.cells.json`, "utf8"));
const W = 19, D = 27, H = 96;
const TIERS = [48, 57, 69, 81];              // clean roof tiers, all multiples of 3 (storey lines); the 84 cells snap to 81 (no spike)
const BASE_TOP = 9;                          // three storeys of base above the ground

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const ground = (x, z) => cell.get(`${x},${z}`).ground;

// Roof per cell: a court is a roof of 1 or 2 (no building); a 0 is a missing return, filled from its neighbours.
const isCourt = (x, z) => inFoot(x, z) && (cell.get(`${x},${z}`).roof === 1 || cell.get(`${x},${z}`).roof === 2);
const isBuilding = (x, z) => inFoot(x, z) && !isCourt(x, z);
const nb3 = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, nz = z + dz;
    if (isBuilding(nx, nz) && cell.get(`${nx},${nz}`).roof > 0) v.push(cell.get(`${nx},${nz}`).roof);
  }
  return v.sort((a, b) => a - b);
};
const median = (v) => (v.length ? v[Math.floor(v.length / 2)] : 0);
const tier = (h) => {                        // nearest tier; a tie goes to the taller one
  let best = TIERS[0];
  for (const t of TIERS) if (Math.abs(t - h) <= Math.abs(best - h)) best = t;
  return best;
};
const tops = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!isBuilding(x, z)) continue;
  tops[z][x] = tier(median(nb3(x, z)));
}

// A tier with fewer than three like neighbours is a fin or spike of lidar noise, not a tower: it steps down one tier.
{
  const raw = tops.map((row) => row.slice());
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const t = raw[z][x];
    if (!t) continue;
    let same = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if ((dx || dz) && raw[z + dz]?.[x + dx] === t) same++;
    }
    if (same < 3) tops[z][x] = TIERS[TIERS.indexOf(t) - 1] ?? t;
  }
}

const solid = (x, z, y) => {
  if (!inFoot(x, z)) return false;
  if (y < ground(x, z)) return true;         // foundation
  return y < tops[z][x];
};
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const g = new Voxels([W, H, D]);
const cap = (x, z) => tops[z][x];

// Foundation under every footprint cell, then the massing column by column.
for (const [cx, cz] of [...cell.keys()].map((k) => k.split(",").map(Number))) {
  for (let y = 0; y < ground(cx, cz); y++) g.set(cx, y, cz, "stone_bricks");
  if (!isBuilding(cx, cz)) {
    // Light court: paved at the top of its foundation, open to the sky.
    if (ground(cx, cz) > 0) g.set(cx, ground(cx, cz) - 1, cz, "stone_bricks");
    continue;
  }
  const T = cap(cx, cz);
  for (let y = ground(cx, cz); y < T; y++) {
    const exposed = DIRS.filter(([dx, dz]) => !solid(cx + dx, cz + dz, y));
    const ext = exposed.length > 0;
    const base = y < BASE_TOP;

    if (y === T - 1) { g.set(cx, y, cz, ext ? "polished_andesite" : "stone"); continue; }   // parapet cap / roof deck
    if (y === T - 2) { if (ext) g.set(cx, y, cz, "chiseled_quartz_block"); continue; }      // cornice course
    if (y % 3 === 0) {                                                                     // floor line / spandrel
      if (!ext) g.set(cx, y, cz, "stone");                                                  // floor slab
      else g.set(cx, y, cz, base ? "polished_andesite" : "smooth_quartz");
      continue;
    }
    if (!ext) continue;                                                                    // air gap behind glass
    const xFace = exposed.some(([dx]) => dx !== 0), zFace = exposed.some(([, dz]) => dz !== 0);
    const corner = xFace && zFace;
    const along = xFace ? cz : cx;             // position along the facade
    if (corner || along % 3 === 0) {           // pier between windows
      g.set(cx, y, cz, base ? "polished_andesite" : "quartz_pillar", base ? undefined : { axis: "y" });
      continue;
    }
    const pane = xFace
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
    g.set(cx, y, cz, "light_blue_stained_glass_pane", pane);
    // Warm light in some windows: glowstone one cell in, standing on the floor slab below.
    const [dx, dz] = exposed[0];
    const ix = cx - dx, iz = cz - dz;
    if (y % 3 === 1 && (cx * 5 + cz * 7 + y * 3) % 11 === 0 && inFoot(ix, iz) && !solid(ix, iz, y)) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

// Avenue entrance on the east face (x = 18): a double iron door at z 12-13, a black canopy over it, shopfront glass.
for (const z of [11, 12, 13, 14]) g.set(18, 3, z, "black_concrete");
const door = (z, hinge, half) => g.set(18, half === "upper" ? 1 : 0, z, "iron_door",
  { facing: "east", half, hinge, open: "false", powered: "false" });
door(12, "left", "lower"); door(12, "left", "upper");
door(13, "right", "lower"); door(13, "right", "upper");

// Roof plant: two small mechanical boxes on a flat 2 x 2 patch of the mid tier and one on the 57 terrace.
const flatPatch = (h) => {
  for (let z = 1; z < D - 2; z++) for (let x = 1; x < W - 2; x++) {
    const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => isBuilding(x + dx, z + dz) && tops[z + dz][x + dx] === h);
    if (ok) return [x, z];
  }
  return null;
};
for (const h of [69, 57]) {
  const p = flatPatch(h);
  if (!p) continue;
  const [px, pz] = p;
  for (let dy = 0; dy < 2; dy++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    g.set(px + dx, h + dy, pz + dz, dy === 0 ? "polished_andesite" : "smooth_quartz");
  }
}

const info = g.save(`${DIR}/NYC1035714.nbt`);
console.log(JSON.stringify(info));
