import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw409723854";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 43, H = 165, D = 29;
const TOP = 152;          // roof slab row; roof lands at y 153
const T1_TOP = 117;       // full-footprint tier ends (slab row)
const T2_TOP = 137;       // setback tier 2 ends (slab row)
const SPIRE_TOP = 164;

const g = new Voxels([W, H, D]);

// footprint + ground map
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 4-neighbour distance from the outside edge (edge cells = 1)
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (NB.some(([dx, dz]) => !inside(x + dx, z + dz))) {
    dist.set(`${x},${z}`, 1);
    queue.push([x, z]);
  }
}
for (let qi = 0; qi < queue.length; qi++) {
  const [x, z] = queue[qi];
  const d = dist.get(`${x},${z}`);
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    const k = `${nx},${nz}`;
    if (inside(nx, nz) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dOf = (x, z) => dist.get(`${x},${z}`) ?? 0;

// tier masks: M1 full, M2 inset 3, M3 inset 6
const inM = (t, x, z) => {
  if (!inside(x, z)) return false;
  if (t === 1) return true;
  if (t === 2) return dOf(x, z) >= 3;
  return dOf(x, z) >= 6;
};
const tierAt = (y) => (y <= T1_TOP ? 1 : y <= T2_TOP ? 2 : 3);
const exposed = (x, z, t) => NB.some(([dx, dz]) => !inM(t, x + dx, z + dz));
const isSlab = (y) => ((y - 2) % 5 + 5) % 5 === 0;
const isMidLight = (y) => ((y - 2) % 5 + 5) % 5 === 2;

// entrance: exterior cells on the low-z side, central part of the width
const xs = cells.map((c) => c[0]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const span = maxX - minX;
const isEntranceCell = (x, z) =>
  !inside(x, z - 1) && x >= minX + Math.floor(span * 0.4) && x <= minX + Math.floor(span * 0.6);
const centreX = minX + Math.floor(span / 2);
// frame cells flanking the entrance opening (exterior, low-z side, just outside the opening span)
const isEntranceFrame = (x, z) =>
  !inside(x, z - 1) && !isEntranceCell(x, z) &&
  x >= minX + Math.floor(span * 0.4) - 1 && x <= minX + Math.floor(span * 0.6) + 1;

// main body
for (const [x, z, gr] of cells) {
  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  for (let y = gr; y <= TOP; y++) {
    const t = tierAt(y);
    if (!inM(t, x, z)) continue;

    // floor slab per storey (spandrel band, lighter quartz for contrast)
    if (isSlab(y)) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    const ext = exposed(x, z, t);
    if (!ext) {
      // interior: air gap, occasional warm light behind the glass
      if (isMidLight(y) && (x * 7 + z * 3 + y) % 23 === 0) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }

    // ground-level plinth, entrance and shopfront
    if (y < gr + 4 && t === 1) {
      if (isEntranceCell(x, z)) {
        if (y === gr) g.set(x, y, z, "polished_granite");
        else if (y === gr + 3) g.set(x, y, z, "smooth_quartz");
        else if (y === gr + 2 && (x - minX) % 2 === 0) {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        }
        // gr+1 and gr+2 otherwise open (entrance)
        continue;
      }
      if (isEntranceFrame(x, z)) {
        g.set(x, y, z, y === gr ? "polished_granite" : "white_concrete");
        continue;
      }
      if (y === gr) {
        g.set(x, y, z, "polished_granite");
        continue;
      }
    }

    // corner piers read as solid massing
    const cornerX = !inside(x - 1, z) || !inside(x + 1, z);
    const cornerZ = !inside(x, z - 1) || !inside(x, z + 1);
    if (cornerX && cornerZ) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // facade: piers every third cell, glass in two tones for depth
    const m = (x + z) % 3;
    if (m === 0) g.set(x, y, z, "white_concrete");
    else if (m === 1) g.set(x, y, z, "light_blue_stained_glass");
    else g.set(x, y, z, "cyan_stained_glass");
  }
}

// setback copings and tier-3 parapet
for (const [x, z] of cells) {
  if (inM(1, x, z) && !inM(2, x, z)) g.set(x, T1_TOP + 1, z, "white_concrete");
  if (inM(2, x, z) && !inM(3, x, z)) g.set(x, T2_TOP + 1, z, "white_concrete");
  if (inM(3, x, z) && exposed(x, z, 3)) g.set(x, TOP + 1, z, "white_concrete");
}

// spire centre: a tier-3 cell whose 3x3 neighbourhood is all tier 3, nearest the centroid
const t3 = cells.filter(([x, z]) => inM(3, x, z));
let sx = null, sz = null;
if (t3.length) {
  const cx = t3.reduce((s, c) => s + c[0], 0) / t3.length;
  const cz = t3.reduce((s, c) => s + c[1], 0) / t3.length;
  const pick = (pool) => {
    let best = null, bd = Infinity;
    for (const [x, z] of pool) {
      const d = (x - cx) ** 2 + (z - cz) ** 2;
      if (d < bd) { bd = d; best = [x, z]; }
    }
    return best;
  };
  const core = t3.filter(([x, z]) => dOf(x, z) >= 7);
  [sx, sz] = pick(core.length ? core : t3);
}

// roof equipment on tier 3 interior, kept clear of the spire core
for (const [x, z] of cells) {
  if (!inM(3, x, z) || exposed(x, z, 3)) continue;
  if (sx !== null && Math.abs(x - sx) <= 2 && Math.abs(z - sz) <= 2) continue;
  if ((x * 3 + z * 5) % 17 === 0) {
    g.set(x, TOP + 1, z, "gray_concrete");
    g.set(x, TOP + 2, z, "gray_concrete");
  }
}

// spire: solid 3x3 crown core, then a tapered needle to the lightning rod
if (sx !== null) {
  for (let y = TOP + 1; y <= TOP + 6; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        g.set(sx + dx, y, sz + dz, "white_concrete");
      }
    }
  }
  for (let y = TOP + 7; y <= SPIRE_TOP - 2; y++) g.set(sx, y, sz, "iron_bars");
  for (let y = SPIRE_TOP - 1; y <= SPIRE_TOP; y++) g.set(sx, y, sz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
