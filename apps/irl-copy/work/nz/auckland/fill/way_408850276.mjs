// University Hall, Auckland: a 1970s concrete frame tower on a stone plinth. Roof about 74 blocks above the lowest ground:
// a 15-storey slab (4-block storeys from a common datum at y 14, above the highest ground under the footprint), with
// the lidar's wings stepping down to 4-block tiers, a glazed portico on the south face, a plant room on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_408850276.cells.json", "utf8"));

const W = 47, D = 57, H = 86;   // footprint box; the tallest roof is 74, the plant room and rod reach 79
const PL = 14, SH = 4;          // plinth datum (above every cell's ground) and storey height
const N = W * D;
const at = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? -1 : z * W + x);

// 1. raw tops: each cell's lidar roof snapped to a storey line (a roof under 18 is a terrace on the plinth)
const raw = new Int16Array(N).fill(-1);
for (const [x, z, , r] of cells) raw[at(x, z)] = r < PL + SH ? PL : PL + SH * Math.min(15, Math.round((r - PL) / SH));

// 2. smooth the lidar noise: the median of each cell and its footprint neighbours
const top = new Int16Array(N).fill(-1);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = at(x, z); if (raw[i] < 0) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const j = at(x + dx, z + dz); if (j >= 0 && raw[j] >= 0) vals.push(raw[j]); }
  vals.sort((a, b) => a - b); top[i] = vals[vals.length >> 1];
}
const topAt = (x, z) => { const i = at(x, z); return i < 0 ? -1 : top[i]; };
const inS = (x, z, y) => topAt(x, z) > y;                     // the building's footprint at height y
const exposed = (x, z, y, dx, dz) => topAt(x + dx, z + dz) <= y;

// 3. depth from the outside at each height: 1 = the facade ring, 2 = behind it (window air gap), 3+ = core
const depth = [];
for (let y = 0; y < H; y++) {
  const d = new Int8Array(N), q = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = at(x, z); if (!inS(x, z, y)) continue;
    if (exposed(x, z, y, 1, 0) || exposed(x, z, y, -1, 0) || exposed(x, z, y, 0, 1) || exposed(x, z, y, 0, -1)) { d[i] = 1; q.push(i); }
  }
  for (let k = 0; k < q.length; k++) {
    const i = q[k], x = i % W, z = (i - x) / W;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const j = at(x + dx, z + dz); if (j < 0 || d[j] || !inS(x + dx, z + dz, y)) continue;
      d[j] = d[i] + 1; q.push(j);
    }
  }
  depth.push(d);
}

// 4. the portico: the south-most ring-1 cells at the plinth (or the first face that has any), the middle of that line
const faces = [["south", 0, 1], ["north", 0, -1], ["east", 1, 0], ["west", -1, 0]];
const ringCells = (dx, dz) => {
  const c = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
    if (inS(x, z, PL) && depth[PL][at(x, z)] === 1 && exposed(x, z, PL, dx, dz)) c.push([x, z]);
  return c;
};
const [doorFacing, fdx, fdz] = faces.find(([, dx, dz]) => ringCells(dx, dz).length > 0);
const face = ringCells(fdx, fdz);
const outward = ([x, z]) => fdx * x + fdz * z;
const maxOut = Math.max(...face.map(outward));
const line = face.filter((c) => outward(c) === maxOut).sort((a, b) => a[fdz ? 0 : 1] - b[fdz ? 0 : 1]);
const along = fdz ? 0 : 1;                                   // the coordinate that runs along the face
const mid = line[Math.floor(line.length / 2)];
const entrance = new Set();
for (const [x, z] of ringCells(fdx, fdz)) if (outward([x, z]) >= maxOut - 1 && Math.abs([x, z][along] - mid[along]) <= 2) entrance.add(at(x, z));
const doorIdx = at(mid[0], mid[1]);

// 5. the facade kind of a ring-1 cell at height y (a window grid: a 3-wide glass bay, a 1-wide concrete pier)
function facadeKind(x, z, y) {
  const s = (y - PL) >> 2;
  const i = at(x, z);
  const onX = exposed(x, z, y, 1, 0) || exposed(x, z, y, -1, 0);
  const onZ = exposed(x, z, y, 0, 1) || exposed(x, z, y, 0, -1);
  const corner = onX && onZ;
  const k = corner ? 0 : onX ? z : x;      // the position along the face
  if (s === 0 && entrance.has(i)) return i === doorIdx ? "door" : "lobby";
  if (corner || k % 4 === 0) return "pier";
  return s === 0 ? "lobby" : "glass";
}
const glassy = (k) => k === "glass" || k === "lobby" || k === "door";

// 6. the walls, slabs, roof and plinth, cell column by cell column
const g = new Voxels([W, H, D]);
let glow = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = at(x, z), T = top[i]; if (T < 0) continue;
  for (let y = 0; y < T; y++) {
    const d = depth[y][i];
    if (y < PL) { g.set(x, y, z, d === 1 ? "stone_bricks" : "smooth_stone"); continue; }
    const s = (y - PL) >> 2, dy = (y - PL) & 3;
    if (y === T - 1 && d >= 2) { g.set(x, y, z, "smooth_stone"); continue; }   // the roof membrane on the core
    if (d === 1) {
      if (dy === 0) g.set(x, y, z, "light_gray_concrete");                       // storey line
      else if (dy === 3) g.set(x, y, z, entrance.has(i) && s === 0 ? "light_gray_concrete" : "white_concrete");
      else {
        const k = facadeKind(x, z, y);
        if (k === "pier") g.set(x, y, z, "white_concrete");
        else if (k === "glass") g.set(x, y, z, "light_blue_stained_glass");
        else if (k === "lobby") g.set(x, y, z, "cyan_stained_glass");
        else g.set(x, y, z, "dark_oak_door", { facing: doorFacing, half: dy === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      }
    } else if (d >= 2) {
      if (dy === 0 || dy === 3) { g.set(x, y, z, "white_concrete"); continue; }
      // behind a glass bay: the air gap, with a warm glowstone in some of them; a pier's back is solid
      const behindGlass = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
        const nx = x + dx, nz = z + dz;
        return inS(nx, nz, y) && depth[y][at(nx, nz)] === 1 && glassy(facadeKind(nx, nz, y));
      });
      if (!behindGlass) g.set(x, y, z, "white_concrete");
      else if (s === 0 ? (x + 2 * z) % 5 === 0 : (3 * x + 5 * z + s) % 13 === 0) { g.set(x, y, z, "glowstone"); glow++; }
    } else if (d >= 3) g.set(x, y, z, "white_concrete");
  }
  // the parapet: a ring-1 cell at the top of its tier
  if (T > PL && depth[T - 1][i] === 1) g.set(x, T, z, "light_gray_concrete");
}

// 7. the roof plant room on the 74 tower, centred on it, with a lightning rod
let cx = 0, cz = 0, nTop = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (topAt(x, z) === 74) { cx += x; cz += z; nTop++; }
cx = Math.round(cx / nTop); cz = Math.round(cz / nTop);
const P = new Set();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
  if (topAt(x, z) === 74 && Math.abs(x - cx) <= 6 && Math.abs(z - cz) <= 5 && depth[73][at(x, z)] >= 3) P.add(at(x, z));
for (const i of P) {
  const x = i % W, z = (i - x) / W;
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !P.has(at(x + dx, z + dz)));
  for (let y = 74; y <= 76; y++) g.set(x, y, z, edge && y === 75 ? "gray_stained_glass" : "light_gray_concrete");
  g.set(x, 77, z, "smooth_stone");
}
g.set(cx, 78, cz, "lightning_rod", { facing: "up", powered: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_408850276.nbt";
const r = g.save(out);
console.log(JSON.stringify({ footprint: cells.length, tops: [...new Set(top.filter((t) => t >= 0))].sort((a, b) => a - b), entrance: doorFacing, plantRoom: P.size, glowstones: glow, ...r }));
