// The Vulcan: a 1920s brick Stripped-Classical block on a stone plinth. Nine levels of 4 blocks from the lowest ground
// (a ground storey, seven upper storeys and a cornice), brick piers on 3-block bays with glass in two rows and a
// terracotta spandrel, string courses at every floor line, a shopfront and a recessed door on the low (west) side,
// setbacks where the lidar roof steps down, a parapet on the top tier and a rooftop plant box. Lamps stand just behind
// some first-floor panes. Floor lines are absolute (y = 4k), so the downhill side shows its extra storeys above the
// stone foundation, which is filled from y 0 up to each cell's own ground.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912653590.cells.json", "utf8"));
const X = 56, Z = 25, Y = 51;
const ground = Array.from({ length: X }, () => Array(Z).fill(null));
let roof = Array.from({ length: X }, () => Array(Z).fill(null));
for (const [x, z, g, r] of cells) { ground[x][z] = g; roof[x][z] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && ground[x][z] !== null;

// Lidar noise: two passes of a 3x3 median over the footprint, then flat tiers on 4-block floor lines.
const median3 = (src) => Array.from({ length: X }, (_, x) => Array.from({ length: Z }, (_, z) => {
  if (!inF(x, z)) return null;
  const v = []; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) v.push(src[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
}));
roof = median3(median3(roof));

const perimeter = (x, z) => !inF(x + 1, z) || !inF(x - 1, z) || !inF(x, z + 1) || !inF(x, z - 1);
const top = Array.from({ length: X }, () => Array(Z).fill(0));   // body roof top (multiple of 4)
const par = Array.from({ length: X }, () => Array(Z).fill(0));   // parapet above the body, top tier perimeter only
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const base = Math.max(ground[x][z], 1);
  let t = Math.min(36, Math.max(8, Math.round(roof[x][z] / 4) * 4));
  t = Math.max(t, Math.ceil((base + 2) / 4) * 4);
  top[x][z] = t;
  if (t === 36 && perimeter(x, z)) par[x][z] = 2;
}

const solid = (x, y, z) => inF(x, z) && y >= 0 && y < top[x][z] + par[x][z];
const g = new Voxels([X, Y, Z]);

const PANE = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
const glassAlong = (alongZ) => ({ ...PANE, ...(alongZ ? { north: "true", south: "true" } : { east: "true", west: "true" }) });
const FACE_OUT = { E: "east", W: "west", N: "north", S: "south" };
const INWARD = { E: [-1, 0], W: [1, 0], N: [0, 1], S: [0, -1] };

// exposure at (x,y,z): the air neighbours that make it a face of the building
function exposure(x, y, z) {
  return {
    E: !solid(x + 1, y, z), W: !solid(x - 1, y, z), N: !solid(x, y, z - 1), S: !solid(x, y, z + 1),
  };
}
const faceList = (e) => Object.keys(e).filter((k) => e[k]);

// the entrance: a ground-storey face on the lowest ground, on the western side where the ground is flat
const entrance = (() => {
  const cand = [];
  for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
    if (!inF(x, z) || Math.max(ground[x][z], 1) !== 1) continue;
    const e = exposure(x, 1, z); const f = faceList(e);
    if (f.length === 1 && (f[0] === "W" || f[0] === "E" || f[0] === "N" || f[0] === "S")) cand.push({ x, z, f: f[0] });
  }
  const byFace = {}; for (const c of cand) (byFace[c.f] ??= []).push(c);
  const best = Object.entries(byFace).sort((a, b) => b[1].length - a[1].length)[0];
  const list = best[1].sort((a, b) => (a.f === "W" || a.f === "E" ? a.z - b.z : a.x - b.x));
  return list[Math.floor(list.length / 2)];
})();

const lampCells = [];

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const base = Math.max(ground[x][z], 1), t = top[x][z], p = par[x][z];
  for (let y = 0; y < t + p; y++) {
    if (y < base) { g.set(x, y, z, "stone_bricks"); continue; }                // foundation up to the ground
    if (y >= t) { g.set(x, y, z, "stone_bricks"); continue; }                  // parapet, top tier only
    if (y === t - 1) {                                                         // roof row; cornice stairs at the edge
      const e = exposure(x, y, z), f = faceList(e);
      if (f.length) { const d = f[0]; g.set(x, y, z, "stone_brick_stairs", { facing: FACE_OUT[d], half: "bottom", shape: "straight", waterlogged: "false" }); }
      else g.set(x, y, z, "stone");
      continue;
    }
    if (y % 4 === 0) { g.set(x, y, z, "smooth_stone"); continue; }             // floor line: string course, floor slab
    const e = exposure(x, y, z), f = faceList(e);
    if (!f.length) continue;                                                   // interior air behind the glass
    const exX = e.E || e.W, exZ = e.N || e.S;
    const corner = exX && exZ;
    const idx = exX ? z : x;
    const pier = corner || idx % 3 === 0;
    const r = y % 4, storey = (y - r) / 4;
    if (r === 3) { g.set(x, y, z, pier ? "bricks" : "terracotta"); continue; }   // spandrel
    if (pier) { g.set(x, y, z, storey === 0 ? "stone_bricks" : "bricks"); continue; }
    if (storey === 0 && x === entrance.x && z === entrance.z) continue;         // door drawn below
    g.set(x, y, z, "glass_pane", glassAlong(exX));
    // lit window: a lamp just inside the pane, on the slab (r = 1 only), some bays on some floors
    if (r === 1 && storey >= 1 && (Math.floor(idx / 3) + 2 * storey) % 4 === 1) {
      const dir = f[0]; const [dx, dz] = INWARD[dir];
      if (inF(x + dx, z + dz) && !faceList(exposure(x + dx, y, z + dz)).length) lampCells.push([x + dx, y, z + dz]);
    }
  }
}

// the entrance door: lower and upper halves, facing out onto the street side
{
  const f = faceList(exposure(entrance.x, 1, entrance.z))[0];
  const facing = FACE_OUT[f];
  g.set(entrance.x, 1, entrance.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(entrance.x, 2, entrance.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}
for (const [x, y, z] of lampCells) g.set(x, y, z, "glowstone");

// rooftop plant: a stone-brick box in the middle of the top tier, two blocks high
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z) || top[x][z] !== 36 || perimeter(x, z)) continue;
  if (x < 20 || x > 37 || z < 8 || z > 16) continue;
  g.set(x, 36, z, "stone_bricks"); g.set(x, 37, z, "smooth_stone");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912653590.nbt");
const tiers = {}; for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (inF(x, z)) tiers[top[x][z]] = (tiers[top[x][z]] || 0) + 1;
console.log(JSON.stringify({ blocks: g.count(), palette: g.palette.length, tiers, entrance, lamps: lampCells.length }));
