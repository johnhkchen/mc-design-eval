import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Bond Building, 1400 New York Ave NW (Commercial-Office-Large).
// c.1910 Beaux-Arts/Chicago-school office block: granite base, brick shaft with
// white terracotta string courses and piers, stone-brick parapet with a cap.
// Storeys are 2 blocks high above a 3-block base.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87192";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 31, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cm = new Map();
for (const [x, z, gr, roof] of cells) {
  cm.set(key(x, z), { x, z, gr: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => cm.has(key(x, z));
const get = (x, z) => cm.get(key(x, z));

const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const DK = Object.keys(DIRS);

const xMin = Math.min(...cells.map(c => c[0]));
const xMax = Math.max(...cells.map(c => c[0]));
const zMin = Math.min(...cells.map(c => c[1]));

// Raw storey count from lidar roof, then smoothed over a 3x3 footprint window.
const raw = new Map();
for (const c of cm.values()) {
  raw.set(key(c.x, c.z), Math.max(1, Math.floor((c.roof - c.gr - 3) / 2)));
}
for (const c of cm.values()) {
  let sum = 0, cnt = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const k = key(c.x + dx, c.z + dz);
    if (raw.has(k)) { sum += raw.get(k); cnt++; }
  }
  let n = Math.round(sum / cnt);
  n = Math.min(8, Math.max(2, n));
  // Setback: outer ring of a tall block steps back one storey at the top.
  const edge = DK.some(d => !has(c.x + DIRS[d][0], c.z + DIRS[d][1]));
  if (edge && n >= 6) n -= 1;
  c.n = n;
  c.topC = c.gr + 3 + 2 * n; // roof / parapet layer
}

const topOf = c => c.topC;
// A side is exposed at height y if the neighbour is absent or has no storey there.
const exposedDirs = (c, y) => DK.filter(d => {
  const nb = get(c.x + DIRS[d][0], c.z + DIRS[d][1]);
  return !nb || topOf(nb) <= y;
});

// Materials
const FOUND = "polished_andesite";
const BASE = "polished_granite";
const BRICK = "bricks";
const TERRA = "white_terracotta";
const FLOOR = "stone";
const ROOF = "smooth_stone";
const PARAPET = "stone_brick_wall";
const CAP = "stone_brick_slab";

// Entrance: centre of the street (min-z) face, non-corner cell.
const doorCands = [...cm.values()].filter(c =>
  c.z === zMin && !has(c.x - 1, c.z) === false && has(c.x, c.z) &&
  !has(c.x - 1, c.z) === false);
const doorList = [...cm.values()].filter(c =>
  c.z === zMin && has(c.x - 1, c.z) && has(c.x + 1, c.z));
const midX = (xMin + xMax) / 2;
doorList.sort((a, b) => Math.abs(a.x - midX) - Math.abs(b.x - midX));
const doorCell = doorList[0] ?? null;

// Inward direction for a lit window: opposite of the exposed face.
const INWARD = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };

for (const c of cm.values()) {
  const { x, z, gr: ground, n, topC } = c;

  // Foundation under every cell.
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUND);

  for (let y = ground; y <= topC; y++) {
    const ex = exposedDirs(c, y);
    const exposed = ex.length > 0;

    if (y === topC) {
      if (exposed) g.set(x, y, z, PARAPET);
      else g.set(x, y, z, ROOF);
      if (exposed) g.set(x, y + 1, z, CAP, { type: "bottom", waterlogged: "false" });
      continue;
    }

    if (y < ground + 3) {
      // Granite base course on exposed sides; interior ground slab; air above.
      if (exposed) g.set(x, y, z, BASE);
      else if (y === ground) g.set(x, y, z, FLOOR);
      continue;
    }

    const s = Math.floor((y - ground - 3) / 2);
    const r = (y - ground - 3) % 2;

    if (r === 0) {
      // Storey line / floor slab.
      g.set(x, y, z, exposed ? TERRA : FLOOR);
      continue;
    }

    // r === 1: the storey's upright course.
    if (!exposed) continue; // interior air behind floor line

    const xFace = ex.includes("W") || ex.includes("E");
    const zFace = ex.includes("N") || ex.includes("S");
    const corner = xFace && zFace;
    const bayCoord = xFace ? z - zMin : x - xMin;

    if (s === n - 1) {
      g.set(x, y, z, TERRA); // cornice band under parapet
      continue;
    }

    const pier = corner || bayCoord % 3 === 0;
    if (pier) {
      g.set(x, y, z, corner ? TERRA : BRICK);
      continue;
    }

    if (xFace) {
      g.set(x, y, z, "glass_pane", {
        north: "true", south: "true", east: "false", west: "false", waterlogged: "false",
      });
    } else {
      g.set(x, y, z, "glass_pane", {
        north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
      });
    }

    // Warm light on the interior side of some panes.
    const lit = (bayCoord + s) % 3 === 0;
    if (lit && !corner) {
      const d = ex[0];
      const [ix, iz] = [x + INWARD[d][0], z + INWARD[d][1]];
      const inner = get(ix, iz);
      if (inner && inner.topC > y && exposedDirs(inner, y).length === 0) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // Roof equipment on a grid of interior roof cells.
  if (!exposedDirs(c, topC).length && x % 5 === 2 && z % 5 === 2 && topC + 1 < H - 1) {
    g.set(x, topC + 1, z, "iron_block");
  }
}

// Entrance: door on the street face, lintel above, lantern-lit recess.
if (doorCell) {
  const { x, z, gr: ground } = doorCell;
  const dprops = half => ({
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });
  g.set(x, ground, z, "dark_oak_door", dprops("lower"));
  g.set(x, ground + 1, z, "dark_oak_door", dprops("upper"));
  g.set(x, ground + 2, z, TERRA);
  g.set(x, ground + 3, z, TERRA);
}

g.save(`${DIR}/${ID}.nbt`);
