import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 永年亞太中心 (Yongnian Asia Pacific Center), Xinyi, Taipei.
// Late-1990s / early-2000s Taiwanese commercial office tower: about 11 storeys
// of 5-block bays, cream tile and quartz piers, white spandrels, blue-tinted
// glass, a granite plinth with a shopfront, and a set-back plant penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309235482";
const W = 32, H = 71, D = 34;
const ROOF = 59;        // roof deck level (absolute y), ~59 above lowest ground
const PARAPET = 60;
const PH_BASE = 60;     // penthouse starts on the roof deck
const PH_TOP = 63;      // penthouse cap
const MAST_BASE = 64;
const MAST_TOP = 68;
const ROD_Y = 69;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));

const NORMALS = [
  { f: "north", dx: 0, dz: -1 },
  { f: "south", dx: 0, dz: 1 },
  { f: "west", dx: -1, dz: 0 },
  { f: "east", dx: 1, dz: 0 },
];
const outward = (x, z) => NORMALS.filter((n) => !has(x + n.dx, z + n.dz));

// Distance from the outside (edge cells = 1), used for the penthouse and mast.
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (outward(x, z).length) { dist.set(key(x, z), 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const n of NORMALS) {
    const nx = x + n.dx, nz = z + n.dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Glass pane whose plane follows the wall it sits in.
function pane(x, y, z, n) {
  const alongX = n.dz !== 0; // north/south wall runs along x
  put(x, y, z, "light_blue_stained_glass_pane", {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  });
}

// Piers sit every 4 blocks along each facade, and always at corners.
function isPier(x, z, outs) {
  if (outs.length >= 2) return true;
  const n = outs[0];
  const along = n.dz !== 0 ? x : z;
  return along % 4 === 0;
}

// Entrance: a single-face wall cell near the middle of the widest facade.
// Prefer a south-facing wall; fall back to any single-face wall with room.
function findDoor(preferFace) {
  let best = null;
  let bestScore = Infinity;
  let cx = 0, cz = 0;
  for (const [x, z] of cells) { cx += x; cz += z; }
  cx /= cells.length; cz /= cells.length;
  for (const [x, z, gr] of cells) {
    const outs = outward(x, z);
    if (outs.length !== 1) continue;
    const n = outs[0];
    if (preferFace && n.f !== preferFace) continue;
    const L1 = 5 * Math.floor(gr / 5) + 5;
    if (L1 - 1 < gr + 3) continue; // room for two door blocks plus a lantern
    const along = n.dz !== 0 ? x - cx : z - cz;
    const score = Math.abs(along);
    if (score < bestScore) { bestScore = score; best = { x, z, g: gr, L1, n }; }
  }
  return best;
}
const doorCell = findDoor("south") ?? findDoor(null);

// Cells flanking the entrance bay along the same wall (full-height glass).
const entranceBay = new Set();
if (doorCell) {
  const { x, z, n } = doorCell;
  for (let off = -1; off <= 1; off++) {
    const ex = n.dz !== 0 ? x + off : x;
    const ez = n.dz !== 0 ? z : z + off;
    if (has(ex, ez) && outward(ex, ez).length === 1) entranceBay.add(key(ex, ez));
  }
}

for (const [x, z, gr] of cells) {
  const outs = outward(x, z);
  const edge = outs.length > 0;
  const L1 = 5 * Math.floor(gr / 5) + 5; // first storey line above ground
  const inBay = entranceBay.has(key(x, z));

  // Foundation: solid from y 0 up to the ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone");

  // Floor slabs at storey lines, and the body between them.
  for (let y = gr + 1; y <= 58; y++) {
    if (y % 5 === 0) {
      put(x, y, z, edge ? "white_concrete" : "smooth_quartz");
      continue;
    }
    if (!edge) continue;

    // Granite plinth course at the first block above ground.
    if (y === gr + 1) { put(x, y, z, "polished_granite"); continue; }

    // Ground-floor shopfront band; the entrance bay is full-height glass.
    if (y < L1) {
      if (inBay) put(x, y, z, "light_blue_stained_glass");
      else if (isPier(x, z, outs)) put(x, y, z, "smooth_quartz");
      else pane(x, y, z, outs[0]);
      continue;
    }

    // Storey bays: 1-3 glass, 4 spandrel.
    const k = y % 5;
    if (k === 4) { put(x, y, z, "white_concrete"); continue; }
    if (isPier(x, z, outs)) { put(x, y, z, "smooth_quartz"); continue; }

    pane(x, y, z, outs[0]);

    // Warm light: a lantern on the floor just inside some windows.
    if (k === 1) {
      const n = outs[0];
      const ix = x - n.dx, iz = z - n.dz;
      if (has(ix, iz) && outward(ix, iz).length === 0 &&
          ((x * 7 + z * 3 + Math.floor(y / 5)) % 4 === 0)) {
        put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }

  // Roof deck at ROOF: cornice on the edge, membrane inside.
  put(x, ROOF, z, edge ? "smooth_quartz" : "gray_concrete");
  // Parapet on the edge.
  if (edge) put(x, PARAPET, z, "white_concrete");
}

// Entrance: two-high iron door under a hanging lantern, with a step outside the plinth.
if (doorCell) {
  const { x, z, g: gr, L1, n } = doorCell;
  put(x, gr + 1, z, "iron_door", { facing: n.f, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "iron_door", { facing: n.f, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, L1 - 1, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Plant penthouse on the roof, set back from the edge with a louvred band.
for (const [x, z] of cells) {
  const d = dist.get(key(x, z));
  if (d < 5) continue;
  for (let y = PH_BASE; y < PH_TOP; y++) {
    if (d === 5) {
      const along = (x + z) % 3 === 1 && y === 61;
      put(x, y, z, along ? "iron_block" : "light_gray_concrete");
    }
  }
  put(x, PH_TOP, z, "stone_bricks");
}

// Mast on the deepest interior cell.
{
  let best = null;
  let bestD = -1;
  let cx = 0, cz = 0;
  for (const [x, z] of cells) { cx += x; cz += z; }
  cx /= cells.length; cz /= cells.length;
  let bestR = Infinity;
  for (const [x, z] of cells) {
    const d = dist.get(key(x, z)) ?? 0;
    const r = (x - cx) ** 2 + (z - cz) ** 2;
    if (d > bestD || (d === bestD && r < bestR)) { bestD = d; bestR = r; best = [x, z]; }
  }
  if (best && bestD >= 6) {
    const [mx, mz] = best;
    for (let y = MAST_BASE; y <= MAST_TOP; y++) put(mx, y, mz, "chain", { axis: "y", waterlogged: "false" });
    put(mx, ROD_Y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
