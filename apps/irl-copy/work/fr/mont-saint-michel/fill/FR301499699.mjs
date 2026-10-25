import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499699";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) map.set(key(c[0], c[1]), { g: c[2], r: c[3] });

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Global storey datum: the highest ground under the footprint.
let B = 0;
for (const v of map.values()) B = Math.max(B, v.g);

// Flatten lidar noise: one median roof level for the whole block, snapped to storeys.
const roofs = [...map.values()].map((v) => v.r).filter((r) => Number.isFinite(r)).sort((a, b) => a - b);
const medRoof = roofs.length ? roofs[Math.floor(roofs.length / 2)] : B + 10;
const ROOF = clamp(Math.round(medRoof), B + 5, H - 1);

const rel = (y) => ((y - B) % 5 + 5) % 5;

const missing = (x, z) => ({
  n: !map.has(key(x, z - 1)),
  s: !map.has(key(x, z + 1)),
  w: !map.has(key(x - 1, z)),
  e: !map.has(key(x + 1, z)),
});
const isPerim = (x, z) => {
  const m = missing(x, z);
  return m.n || m.s || m.w || m.e;
};
const isCorner = (x, z) => {
  const m = missing(x, z);
  return (m.n || m.s) && (m.w || m.e);
};

const topOf = (x, z) => clamp(ROOF, map.get(key(x, z)).g + 5, H - 1);

// Window bays: alternate cells along each facade, storey bodies only, not corners.
const isWindow = (x, z, y, gr) =>
  isPerim(x, z) && !isCorner(x, z) && y > gr && rel(y) >= 1 && rel(y) <= 3 && (x + z) % 2 === 0;

// Entrance: lowest-ground perimeter cell on the south (max z) side.
let door = null;
{
  let best = null;
  for (const c of cells) {
    const [x, z, gr] = c;
    if (!isPerim(x, z)) continue;
    const m = missing(x, z);
    if (!m.s && !m.n) continue;
    const score = gr * 100 - z;
    if (!best || score < best.score) best = { score, x, z, gr };
  }
  if (best) {
    const m = missing(best.x, best.z);
    door = { x: best.x, z: best.z, gr: best.gr, facing: m.s ? "south" : "north" };
  }
}

for (const c of cells) {
  const [x, z] = c;
  const { g: gr } = map.get(key(x, z));
  const top = topOf(x, z);
  const perim = isPerim(x, z);
  const corner = isCorner(x, z);

  // Granite foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "granite");

  for (let y = gr; y <= top; y++) {
    if (y === top) {
      // Roof: slate cap with a stepped parapet ring on the perimeter.
      g.set(x, y, z, perim ? "deepslate_tiles" : "deepslate_tiles");
      continue;
    }
    if (perim) {
      if (y === gr) {
        g.set(x, y, z, "polished_granite");           // plinth
      } else if (y === top - 1) {
        g.set(x, y, z, "chiseled_stone_bricks");      // cornice band
      } else if (corner) {
        g.set(x, y, z, "polished_granite");           // corner pilaster
      } else if (rel(y) === 0 && y > gr) {
        g.set(x, y, z, "smooth_stone");               // storey string course
      } else if (isWindow(x, z, y, gr)) {
        g.set(x, y, z, "glass_pane");
      } else if (rel(y) >= 1 && rel(y) <= 3 && y > gr) {
        g.set(x, y, z, "stone_bricks");               // window surround / pier
      } else {
        g.set(x, y, z, "granite");
      }
    } else {
      // Interior: floor slabs and ceiling only, air between.
      if (y === gr || y === top - 1 || (rel(y) === 0 && y > gr)) {
        g.set(x, y, z, "smooth_stone");
      } else if (y > gr && rel(y) >= 1 && rel(y) <= 3) {
        const nb = [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]];
        const nearWin = nb.some(([nx, nz]) =>
          map.has(key(nx, nz)) && isWindow(nx, nz, y, map.get(key(nx, nz)).g));
        if (nearWin && (x + z) % 4 === 0) g.set(x, y, z, "glowstone");
      }
    }
  }
}

// Entrance: door with a stone frame above it.
if (door) {
  const { x, z, gr, facing } = door;
  g.set(x, gr, z, "spruce_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "spruce_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel and jambs in chiseled stone around the opening.
  g.set(x, gr + 2, z, "chiseled_stone_bricks");
  g.set(x, gr + 3, z, "smooth_stone");
  // Step in front of the door, on the ground outside the footprint.
  const dz = facing === "south" ? 1 : -1;
  g.set(x, gr, z + dz, "stone_brick_stairs", {
    facing: facing === "south" ? "north" : "south", half: "bottom", shape: "straight", waterlogged: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
