import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR24585744";
const W = 14, H = 28, D = 12;

const rawCells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const K = (x, z) => `${x},${z}`;

// Keep only the largest 4-connected group of footprint cells (drops detached stray cells).
function largestComponent(list) {
  const set = new Map(list.map(c => [K(c[0], c[1]), c]));
  const seen = new Set();
  let best = [];
  for (const c of list) {
    const k0 = K(c[0], c[1]);
    if (seen.has(k0)) continue;
    const comp = [];
    const stack = [c];
    seen.add(k0);
    while (stack.length) {
      const cur = stack.pop();
      comp.push(cur);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = K(cur[0] + dx, cur[1] + dz);
        if (set.has(k) && !seen.has(k)) {
          seen.add(k);
          stack.push(set.get(k));
        }
      }
    }
    if (comp.length > best.length) best = comp;
  }
  return best;
}

const cells = largestComponent(rawCells);
const vox = new Voxels([W, H, D]);

const C = new Map();
for (const [x, z, gr, roof] of cells) C.set(K(x, z), { g: gr, roof });
const has = (x, z) => C.has(K(x, z));

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

// Flat, clean roof line from the median lidar roof height (smooths noise).
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const T = Math.min(22, Math.max(8, Math.round(roofs[Math.floor(roofs.length / 2)])));

// Outward faces of a perimeter cell.
function faces(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push({ dx: 0, dz: -1, idx: x - minX, span: maxX - minX, axis: "ns" });
  if (!has(x, z + 1)) out.push({ dx: 0, dz: 1, idx: x - minX, span: maxX - minX, axis: "ns" });
  if (!has(x - 1, z)) out.push({ dx: -1, dz: 0, idx: z - minZ, span: maxZ - minZ, axis: "ew" });
  if (!has(x + 1, z)) out.push({ dx: 1, dz: 0, idx: z - minZ, span: maxZ - minZ, axis: "ew" });
  return out;
}

// Window bays: every third column away from corners, glazed in the middle 3 rows of each 5-block storey.
const isWindowFace = (f, y) => f.idx > 0 && f.idx < f.span && f.idx % 3 === 1 && y % 5 >= 1 && y % 5 <= 3;
// Main entrance: centred on the south face.
const isDoorFace = (f) => f.dz === 1 && f.idx === Math.floor((maxX - minX) / 2);
const lit = (x, z, y) => (x + z + Math.floor(y / 5)) % 3 === 0;

const topOf = (c) => Math.max(c.g + 5, T);

// Main body: foundation, solid stone core, storey courses, glazed bays, roof cap.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const c = C.get(K(x, z));
  const fs = faces(x, z);
  const per = fs.length > 0;
  const tp = topOf(c);

  for (let y = 0; y < tp; y++) {
    if (y < c.g) {
      vox.set(x, y, z, per ? "cobblestone" : "stone");
      continue;
    }
    if (y === tp - 1) {
      vox.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!per) {
      vox.set(x, y, z, "stone");
      continue;
    }
    // Base course at the foot of the storey, string courses every 5 blocks.
    let b = (y % 5 === 0 || y === c.g) ? "polished_andesite" : "stone_bricks";
    const win = fs.find(f => isWindowFace(f, y));
    if (win) {
      const props = win.axis === "ns"
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      vox.set(x, y, z, "glass_pane", props);
      continue;
    }
    vox.set(x, y, z, b);
  }
}

// Interior air pockets behind glazed bays (or a warm glowstone light), so glass reads as recessed.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (faces(x, z).length > 0) continue;
  const c = C.get(K(x, z));
  const tp = topOf(c);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz)) continue;
    const nc = C.get(K(nx, nz));
    const f = faces(nx, nz).find(ff => ff.dx === dx && ff.dz === dz);
    if (!f) continue;
    for (let y = c.g; y < tp - 1; y++) {
      if (y < nc.g) continue;
      if (!isWindowFace(f, y)) continue;
      if (lit(x, z, y)) vox.set(x, y, z, "glowstone");
      else vox.set(x, y, z, "air");
    }
  }
}

// Parapet on the perimeter with alternating merlons.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (faces(x, z).length === 0) continue;
  const c = C.get(K(x, z));
  const tp = topOf(c);
  vox.set(x, tp, z, "stone_bricks");
  if ((x + z) % 2 === 0) vox.set(x, tp + 1, z, "stone_bricks");
}

// Corner towers: corner cells (two outward faces) rise two blocks above the parapet with a capping course.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const fs = faces(x, z);
  if (fs.length < 2) continue;
  const c = C.get(K(x, z));
  const tp = topOf(c);
  if (tp + 3 >= H) continue;
  vox.set(x, tp + 1, z, "stone_bricks");
  vox.set(x, tp + 2, z, "stone_bricks");
  vox.set(x, tp + 3, z, "chiseled_stone_bricks");
}

// Entrance: door on the south face, chiseled lintel above, opening into the interior.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const fs = faces(x, z);
  if (!fs.some(isDoorFace)) continue;
  const c = C.get(K(x, z));
  vox.set(x, c.g, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(x, c.g + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  vox.set(x, c.g + 2, z, "chiseled_stone_bricks");
  if (has(x, z - 1)) {
    vox.set(x, c.g, z - 1, "air");
    vox.set(x, c.g + 1, z - 1, "air");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
