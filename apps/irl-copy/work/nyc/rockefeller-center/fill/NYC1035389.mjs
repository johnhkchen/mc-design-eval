// Fred F. French Building (1927, 547 Fifth Avenue): a setback Art Deco tower in buff limestone and terracotta.
// Massing follows the lidar roof per cell (3x3 median, snapped to whole storeys of 3 blocks); the shell is one
// block thick, interiors are air with a floor slab per storey; ground floor is a shopfront base with a bronze-doored
// entrance on Fifth Avenue (x = 0); a three-storey penthouse with a gilt crown sits on the tallest tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035389.cells.json`, "utf8"));
const X = 55, Z = 28, H = 132, STOREY = 3, TIER = 6, PENT = 9;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Per footprint cell: ground g, lidar roof r (0 = open court, nothing built).
const G = Array.from({ length: X }, () => Array(Z).fill(null));
for (const [x, z, g, r] of cells) G[x][z] = { g, r };

// Tier per cell: 5x5 median of the lidar roof, snapped to two-storey steps (keeps storey lines on multiples of 3); low wings (<4) are one storey.
const top = Array.from({ length: X }, () => Array(Z).fill(0));
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!G[x][z] || G[x][z].r <= 0) continue;
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const c = G[x + dx]?.[z + dz];
    if (c && c.r > 0) vals.push(c.r);
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  top[x][z] = med < 4 ? STOREY : Math.round(med / TIER) * TIER;
}

// Column segments: foundation below the ground, the mass above it, and the penthouse on the tallest tier.
const seg = Array.from({ length: X }, () => Array.from({ length: Z }, () => []));
let tMax = 0;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const c = G[x][z]; if (!c || c.r <= 0) continue;
  if (c.g > 0) seg[x][z].push({ b: 0, t: c.g, kind: "found" });
  seg[x][z].push({ b: c.g, t: top[x][z], kind: "mass" });
  tMax = Math.max(tMax, top[x][z]);
}
// Penthouse: the tallest-tier cells inset from their edges (a tower of three storeys on the roof).
let px0 = X, px1 = -1, pz0 = Z, pz1 = -1;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (top[x][z] === tMax) {
  px0 = Math.min(px0, x); px1 = Math.max(px1, x); pz0 = Math.min(pz0, z); pz1 = Math.max(pz1, z);
}
const inset = { x0: px0 + 5, x1: px1 - 5, z0: pz0 + 4, z1: pz1 - 4 };
for (let x = inset.x0; x <= inset.x1; x++) for (let z = inset.z0; z <= inset.z1; z++) {
  if (top[x][z] === tMax) seg[x][z].push({ b: tMax, t: tMax + PENT, kind: "ph" });
}

const segAt = (x, z, y) => {
  if (x < 0 || z < 0 || x >= X || z >= Z) return null;
  for (const s of seg[x][z]) if (y >= s.b && y < s.t) return s;
  return null;
};
const solidAt = (x, y, z) => segAt(x, z, y) !== null;
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solidAt(x + dx, y, z + dz));

// Deterministic scatter for lit windows.
const hash = (x, y, z) => (x * 7919 + y * 104729 + z * 1299709) % 97;

const v = new Voxels([X, H, Z]);
const DOOR = { facing: "west", hinge: "left", open: "false", powered: "false" };

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  for (let y = 0; y < H; y++) {
    const s = segAt(x, z, y); if (!s) continue;
    if (s.kind === "found") { v.set(x, y, z, "polished_granite"); continue; }
    const out = exposed(x, y, z);
    const isTop = y === s.t - 1;
    // Interior: one floor slab per storey and the roof deck; everything else is air behind the shell.
    if (!out.length && !isTop && y % STOREY !== 0) continue;
    if (isTop) {
      const corner = s.kind === "ph" && out.length === 2;
      v.set(x, y, z, corner ? "gold_block" : "polished_granite");
      continue;
    }
    if (y % STOREY === 0) { v.set(x, y, z, out.length ? (y === 0 ? "polished_granite" : "chiseled_sandstone") : "smooth_sandstone"); continue; }
    if (!out.length) continue;
    const [nx, nz] = out[0];
    const u = nx !== 0 ? z : x;                     // position along the face
    const ground = y < STOREY;
    if (ground) {
      v.set(x, y, z, u % 3 === 0 ? "polished_granite" : "light_blue_stained_glass");
      continue;
    }
    if (u % 3 === 0) { v.set(x, y, z, "sandstone"); continue; }
    v.set(x, y, z, "gray_stained_glass");
    // A warm lamp on the floor just inside a lit window (sits on the storey slab below it).
    const ix = x - nx, iz = z - nz;
    if (y % STOREY === 1 && solidAt(ix, y, iz) && !exposed(ix, y, iz).length && !isTopAt(ix, y, iz)) {
      const h = hash(x, y, z);
      if (h % 6 === 0) v.set(ix, y, iz, "lantern", { hanging: "false" });
      else if (h % 17 === 0) v.set(ix, y, iz, "glowstone");
    }
  }
}
function isTopAt(x, y, z) { const s = segAt(x, z, y); return !!s && y === s.t - 1; }

// Parapet: a course on the edge of each mass tier that nothing taller stands against.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const s = seg[x][z].find((q) => q.kind === "mass"); if (!s || segAt(x, z, s.t)) continue;
  if (exposed(x, s.t, z).length) v.set(x, s.t, z, "polished_granite");
}

// Entrances: Fifth Avenue (x = 0) lobby door, and a secondary door on the south street front (z = 27).
const doorAt = (x, y, z, facing, half) => v.set(x, y, z, "iron_door", { ...DOOR, facing, half });
if (!segAt(0, 13, 1)) throw new Error("no Fifth Avenue frontage at z=13");
doorAt(0, 1, 13, "west", "lower"); doorAt(0, 2, 13, "west", "upper");
if (!segAt(30, 27, 1)) throw new Error("no street frontage at x=30");
doorAt(30, 1, 27, "south", "lower"); doorAt(30, 2, 27, "south", "upper");

const res = v.save(`${DIR}/NYC1035389.nbt`);
const tiers = {};
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (G[x][z]?.r > 0) tiers[top[x][z]] = (tiers[top[x][z]] || 0) + 1;
console.log(JSON.stringify({ ...res, tMax, penthouseTop: tMax + PENT, tiers }));
