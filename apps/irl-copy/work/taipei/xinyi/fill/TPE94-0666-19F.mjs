import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0666-19F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 37, H = 105, D = 39;
const g = new Voxels([W, H, D]);

const TOP = 92;                          // top of roof slab
const SLABS = new Set([19, 54, 79, 92]); // setback roofs and top roof slab
const TIER_TOPS = [19, 54, 79];
const k = (x, z) => `${x},${z}`;

// Footprint membership and depth from the outside edge (for setbacks)
const fp = new Set(cells.map(([x, z]) => k(x, z)));
const depth = new Map();
const q = [];
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [x, z] of cells) {
  if (NB.some(([dx, dz]) => !fp.has(k(x + dx, z + dz)))) {
    depth.set(k(x, z), 1);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = depth.get(k(x, z));
  for (const [dx, dz] of NB) {
    const nk = k(x + dx, z + dz);
    if (fp.has(nk) && !depth.has(nk)) {
      depth.set(nk, d + 1);
      q.push([x + dx, z + dz]);
    }
  }
}

// Setback tiers: podium to y19, then inset 3, 6, 9
function tierIns(y) {
  if (y <= 19) return 0;
  if (y <= 53) return 3;
  if (y <= 79) return 6;
  return 9;
}
function inRegion(x, z, ins) {
  const d = depth.get(k(x, z));
  return d !== undefined && d >= ins + 1;
}
function isEdge(x, z, ins) {
  return !inRegion(x - 1, z, ins) || !inRegion(x + 1, z, ins) ||
         !inRegion(x, z - 1, ins) || !inRegion(x, z + 1, ins);
}

// Deterministic pseudo-random for sparse lit windows
function h(x, y, z) {
  let v = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791);
  v ^= v >>> 13;
  return (v >>> 0) % 11;
}

// Main entrance: footprint cell on the minimum-z face nearest the mean x
let minZ = Infinity;
for (const [, z] of cells) if (z < minZ) minZ = z;
let sumX = 0, nFront = 0;
for (const [x, z] of cells) if (z === minZ) { sumX += x; nFront++; }
const meanX = sumX / nFront;
let door = null, bestDist = Infinity;
for (const [x, z] of cells) {
  if (z === minZ && Math.abs(x - meanX) < bestDist) {
    bestDist = Math.abs(x - meanX);
    door = { x, z };
  }
}
const doorGr = (cells.find(([x, z]) => x === door.x && z === door.z) || [0, 0, 0])[2];

// Foundation and building shell
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    const ins = tierIns(y);
    if (!inRegion(x, z, ins)) continue;

    const isSlab = y === gr || y % 5 === 0 || SLABS.has(y);
    if (isSlab) {
      g.set(x, y, z, y === gr ? "polished_granite" : "light_gray_concrete");
      continue;
    }

    const edgeX = !inRegion(x - 1, z, ins) || !inRegion(x + 1, z, ins);
    const edgeZ = !inRegion(x, z - 1, ins) || !inRegion(x, z + 1, ins);

    if (!edgeX && !edgeZ) {
      // interior: air, with occasional warm light just behind the glass
      if (depth.get(k(x, z)) === ins + 2 && y % 5 === 2 && h(x, y, z) === 0) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }

    // facade cell
    const along = (edgeX && edgeZ) ? x + z : (edgeZ ? x : z);
    const onEntryFace = ins === 0 && z === minZ && Math.abs(x - door.x) <= 1;

    // entrance door
    if (ins === 0 && x === door.x && z === minZ && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    // entrance flanks: lanterns at the door, granite lintel over the door bay
    if (onEntryFace && y === gr + 1 && Math.abs(x - door.x) === 1) {
      g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      continue;
    }
    if (onEntryFace && y === gr + 3) {
      g.set(x, y, z, "polished_granite");
      continue;
    }

    if (y % 5 === 4) {
      g.set(x, y, z, "light_gray_concrete");   // spandrel
    } else if (along % 3 === 0) {
      g.set(x, y, z, "white_concrete");        // mullion
    } else if (ins === 0 && y < gr + 5) {
      g.set(x, y, z, "glass");                 // clear shopfront glazing
    } else {
      g.set(x, y, z, "cyan_stained_glass");    // tinted curtain wall
    }
  }
}

// Setback parapets: a stone rim along the terrace edge of each lower tier
for (const T of TIER_TOPS) {
  const lowIns = tierIns(T);
  const upIns = lowIns + 3;
  for (const [x, z] of cells) {
    if (inRegion(x, z, lowIns) && !inRegion(x, z, upIns) && isEdge(x, z, lowIns)) {
      g.set(x, T + 1, z, "stone_bricks");
    }
  }
}

// Roof: cornice, corner lanterns, plant room, lightning-rod mast
const top3 = cells.filter(([x, z]) => inRegion(x, z, 9));
if (top3.length) {
  const cx0 = top3.reduce((s, [x]) => s + x, 0) / top3.length;
  const cz0 = top3.reduce((s, [, z]) => s + z, 0) / top3.length;
  let cx = null, cz = null, bd = Infinity;
  for (const [x, z] of top3) {
    const d = Math.hypot(x - cx0, z - cz0);
    if (d < bd) { bd = d; cx = x; cz = z; }
  }

  for (const [x, z] of top3) {
    const edgeX = !inRegion(x - 1, z, 9) || !inRegion(x + 1, z, 9);
    const edgeZ = !inRegion(x, z - 1, 9) || !inRegion(x, z + 1, 9);
    if (edgeX || edgeZ) {
      g.set(x, 93, z, "white_concrete");
      if (edgeX && edgeZ) g.set(x, 94, z, "sea_lantern");
    } else if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 3) {
      for (let y = 93; y <= 95; y++) g.set(x, y, z, "stone_bricks");
    }
  }

  for (let y = 96; y <= 104; y++) {
    g.set(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
