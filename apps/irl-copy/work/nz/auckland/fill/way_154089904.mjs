// Wright's Buildings, Mt Eden side of the CBD: a 1970s-80s concrete-framed office block on a brick podium. The lidar
// roof (9 to 38 blocks above y 0) is read as four flat set-back tiers at storey lines (roofs at 16, 24, 32, 38), each
// on the one below through its own footing, the podium in brick, the towers in light concrete with aluminium-framed
// glass bays, a black shopfront fascia on the ground storey, a glazed entrance on the north face and roof plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_154089904.cells.json`, "utf8"));

const W = 40, D = 53, H = 51;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // east, west, south, north (z grows south)

// footprint, ground and lidar roof per cell, indexed [z][x]
const FP = Array.from({ length: D }, () => Array(W).fill(false));
const G = Array.from({ length: D }, () => Array(W).fill(0));
const RAW = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, g, r] of cells) { FP[z][x] = true; G[z][x] = g; RAW[z][x] = r; }
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && FP[z][x];

// lidar noise into flat tiers: a 5x5 median of the roof, then four set-backs at storey lines
const TIER = (v) => (v <= 19 ? 16 : v <= 28 ? 24 : v <= 35 ? 32 : 38);
const R = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!FP[z][x]) continue;
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFp(x + dx, z + dz)) vals.push(RAW[z + dz][x + dx]);
  vals.sort((a, b) => a - b);
  R[z][x] = TIER(vals[vals.length >> 1]);
}

// the faces at height y that look out: off the footprint, or onto a neighbour whose roof is lower. Above the roof
// (y = R + 1) only a lower neighbour or the edge makes a parapet, so same-tier roofs stay open
const exposed = (x, z, y) => {
  const h = Math.min(y, R[z][x]);
  return DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || R[z + dz][x + dx] < h);
};

// the entrance: a north-facing bay at ground 0 (so the door's two blocks stand clear of the ground), the middle one
const northBays = [];
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!FP[z][x]) continue;
    if (G[z][x] === 0 && !inFp(x, z - 1)) northBays.push([x, z]);
    break;
  }
}
const ent = (() => {
  const xs = northBays.map(([x]) => x).sort((a, b) => a - b);
  const [doorX, doorZ] = northBays[Math.floor(xs.length / 2)];
  const bays = new Set([doorX - 1, doorX, doorX + 1].filter((x) => northBays.some(([nx]) => nx === x)));
  return { x: doorX, z: doorZ, bays };
})();

const v = new Voxels([W, H, D]);
const panes = [];   // { x, y, z, dx, dz, j } for each glass pane, to link up at the end
const glassAt = (x, y, z) => ((x * 5 + z * 3 + y) % 5 === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane");

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!FP[z][x]) continue;
  const r = R[z][x], gr = G[z][x], podium = r === 16;
  for (let y = 0; y <= r + 1; y++) {
    const dirs = exposed(x, z, y), ring = dirs.length > 0;
    if (y <= gr) { v.set(x, y, z, ring ? "stone_bricks" : "stone"); continue; }             // foundation, up to the ground
    if (y === r + 1) { if (ring) v.set(x, y, z, "light_gray_concrete"); continue; }        // parapet
    if (y === r) { v.set(x, y, z, "smooth_stone"); continue; }                              // roof
    if (y % 4 === 0) { v.set(x, y, z, "light_gray_concrete"); continue; }                  // floor slab, every storey
    if (!ring) continue;                                                                    // interior: an air gap
    const j = y % 4, k = (y - j) / 4;
    if (j === 3) { v.set(x, y, z, k === 0 ? "black_concrete" : podium ? "bricks" : "light_gray_concrete"); continue; }
    if (dirs.length > 1) { v.set(x, y, z, "light_gray_concrete"); continue; }              // corner pier
    const [dx, dz] = dirs[0];
    if (dz === -1 && z === ent.z && ent.bays.has(x)) {                                    // entrance: door, glazing
      if (x === ent.x && j === 1) { v.set(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (x === ent.x && j === 2) { v.set(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (x === ent.x) { v.set(x, y, z, "light_gray_concrete"); continue; }
      v.set(x, y, z, "light_blue_stained_glass_pane"); panes.push({ x, y, z, dx, dz, j, name: "light_blue_stained_glass_pane" }); continue;
    }
    const s = dx !== 0 ? z : x;                                                            // position along the face
    if (s % 3 === 0) { v.set(x, y, z, "gray_concrete"); continue; }                         // aluminium mullion
    const name = k === 0 ? "light_blue_stained_glass_pane" : glassAt(x, y, z);
    v.set(x, y, z, name); panes.push({ x, y, z, dx, dz, j, name });
  }
}

// warm light behind some glass: an interior air cell just inside a window band
for (const p of panes) {
  if (p.j !== 1) continue;
  const ix = p.x - p.dx, iz = p.z - p.dz, k = Math.floor(p.y / 4);
  if (!inFp(ix, iz) || p.y <= G[iz][ix] || p.y >= R[iz][ix] || exposed(ix, iz, p.y).length) continue;
  if ((p.x + p.z + k) % 4 === 0) v.set(ix, p.y, iz, "glowstone");
}

// lobby: a lantern on the floor just inside the door
if (inFp(ent.x, ent.z + 1) && !exposed(ent.x, ent.z + 1, 1).length) v.set(ent.x, 1, ent.z + 1, "lantern", { hanging: "false" });

// roof plant: 3x2x3 boxes on the flat interior of each tier, spaced apart
const plant = (tier, count) => {
  const placed = [];
  for (let z = 1; z < D - 1 && placed.length < count; z++) for (let x = 1; x < W - 1 && placed.length < count; x++) {
    let ok = true;
    for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) if (!inFp(x + dx, z + dz) || R[z + dz][x + dx] !== tier) ok = false;
    if (!ok || placed.some(([px, pz]) => Math.abs(px - x) < 6 && Math.abs(pz - z) < 6)) continue;
    placed.push([x, z]);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (let dy = 1; dy <= 2; dy++) v.set(x + dx, tier + dy, z + dz, "gray_concrete");
  }
};
plant(16, 1); plant(24, 1); plant(38, 3);

// link the glass: a pane joins a neighbour that is a pane or a solid block, in the four horizontal directions
const isGlassOrFit = (b) => /pane|door|lantern|glowstone/.test(b);
for (const p of panes) {
  const link = (dx, dz) => {
    const c = v.get(p.x + dx, p.y, p.z + dz);
    return !!c && (c.block.endsWith("_pane") || !isGlassOrFit(c.block));
  };
  v.set(p.x, p.y, p.z, p.name, {
    north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)), waterlogged: "false",
  });
}

const out = v.save(`${DIR}/way_154089904.nbt`);
console.log(`way_154089904: ${out.blocks} blocks, ${out.palette} palette entries, ${panes.length} panes, entrance x=${ent.x} z=${ent.z}`);
