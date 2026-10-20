import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC3000021.cells.json`, "utf8"));

const W = 6, H = 24, D = 11;
const g = new Voxels([W, H, D]);

// ---- footprint lookup ----
const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr, rf] of cells) fp.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });
const inside = (x, z) => fp.has(key(x, z));
const isBoundary = (x, z) =>
  !(inside(x - 1, z) && inside(x + 1, z) && inside(x, z - 1) && inside(x, z + 1));
// exposed faces: n = min z (street front), s = max z, w = min x, e = max x
const exposed = (x, z) => ({
  n: !inside(x, z - 1),
  s: !inside(x, z + 1),
  w: !inside(x - 1, z),
  e: !inside(x + 1, z),
});

// ---- massing: one storey line and one roof line for clean tiers ----
const base = Math.max(...cells.map(c => Math.round(c[2])));
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
let R = roofs[Math.floor(roofs.length / 2)];
R = Math.max(R, base + 11);
R = Math.min(R, H - 2);

// upper floor slabs every 3 blocks; windows on the two rows above each slab
const floors = [];
for (let F = base + 3; F + 3 <= R - 2; F += 3) floors.push(F);
const windowRows = new Set();
for (const F of floors) { windowRows.add(F + 1); windowRows.add(F + 2); }
const floorSet = new Set([base, base + 3, ...floors]);

const GLASS_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// window position on a single-face boundary cell; null for corners (kept as solid piers)
function faceInfo(x, z) {
  const e = exposed(x, z);
  const faces = Object.keys(e).filter(k => e[k]);
  if (faces.length !== 1) return null;
  const face = faces[0];
  const idx = (face === "n" || face === "s") ? x : z;
  return { face, idx };
}

// ---- build each footprint cell ----
for (const [x, z] of fp.keys().map(k => k.split(",").map(Number))) {
  const boundary = isBoundary(x, z);
  const info = boundary ? faceInfo(x, z) : null;
  const corner = boundary && !info;

  // foundation: solid from y 0 up to the storey line
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  // floor line at base
  g.set(x, base, z, boundary ? "stone_bricks" : "smooth_stone");

  // interior floor slabs and roof deck
  if (!boundary) {
    for (const F of floors) g.set(x, F, z, "smooth_stone");
    g.set(x, R - 1, z, "smooth_stone");
    continue;
  }

  // walls from base+1 up to the frieze
  for (let y = base + 1; y <= R - 2; y++) {
    if (floorSet.has(y)) {
      g.set(x, y, z, "stone_bricks"); // string courses / sills at storey lines
      continue;
    }

    if (y <= base + 2) {
      // ground floor: shopfront on the street (n) face with a central door
      if (info && info.face === "n" && x >= 1 && x <= 4) {
        if (x === 2) {
          const half = y === base + 1 ? "lower" : "upper";
          g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
          continue;
        }
        g.set(x, y, z, "glass_pane", GLASS_NS);
        continue;
      }
      if (info && info.idx % 2 === 1) {
        const isNS = info.face === "n" || info.face === "s";
        g.set(x, y, z, "glass_pane", isNS ? GLASS_NS : GLASS_EW);
        continue;
      }
      g.set(x, y, z, "bricks");
      continue;
    }

    if (windowRows.has(y) && info && info.idx % 2 === 1) {
      const F = floors.find(f => y === f + 1 || y === f + 2);
      // sparse warm lights: one window in roughly eleven
      const lit = (x * 5 + z * 3 + F + (y - F)) % 11 === 0;
      const isNS = info.face === "n" || info.face === "s";
      g.set(x, y, z, lit ? "glowstone" : "glass_pane", isNS ? GLASS_NS : GLASS_EW);
      continue;
    }

    g.set(x, y, z, "bricks");
  }

  // cornice and roof edge
  g.set(x, R - 2, z, "bricks");
  g.set(x, R - 1, z, "stone_bricks");
  if (corner) g.set(x, R - 1, z, "stone_bricks");
}

// roof equipment: a brick chimney on one interior roof cell
if (R + 1 < H && inside(2, 5) && !isBoundary(2, 5)) {
  g.set(2, R - 1, 5, "smooth_stone");
  g.set(2, R, 5, "bricks");
  g.set(2, R + 1, 5, "bricks");
}

g.save(`${dir}/NYC3000021.nbt`);
