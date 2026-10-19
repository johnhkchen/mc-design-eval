// NYC1077284: 1230 Avenue of the Americas (Rockefeller Plaza), a 1939 commercial and office block, NYC landmark.
// Massing from the lidar roof per cell: a 5x5 median, snapped to whole 3-block storeys, a 3x3 median of those, and a
// stepped crown on the tall slab. Walls are one block thick: limestone piers and spandrels, blue-grey glass in bays with
// mullions, granite base and shopfronts, glowstone behind some windows. The interior is hollow with a floor slab per
// storey, a roof over it and columns on a 4-cell grid to carry the spans. The south face has an iron door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1077284.cells.json", "utf8"));
const W = 84, D = 55, H = 75;
const G = Array.from({ length: D }, () => new Array(W).fill(null));   // G[z][x] = { g, r, s1, q, top }
for (const [x, z, g, r] of cells) G[z][x] = { g, r };

const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[z][x] !== null;
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const neigh = (x, z, rad) => {
  const out = [];
  for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) if (inside(x + dx, z + dz)) out.push([x + dx, z + dz]);
  return out;
};
const each = (fn) => { for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (G[z][x]) fn(x, z, G[z][x]); };

// 1. Lidar noise into flat tiers: 5x5 median of the roof, snapped to whole storeys, then a 3x3 median of those.
each((x, z, c) => { c.s1 = 3 * Math.round(median(neigh(x, z, 2).map(([a, b]) => G[b][a].r)) / 3); });
each((x, z, c) => { c.q = median(neigh(x, z, 1).map(([a, b]) => G[b][a].s1)); });

// 2. Stepped crown on the tall slab: cells 4 and 7 in from its edge gain a storey and then another.
const TOWER = 45, FAR = 1e9;
const edge = Array.from({ length: D }, () => new Array(W).fill(FAR));
const queue = [];
each((x, z, c) => {
  if (c.q < TOWER) return;
  const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inside(x + dx, z + dz) || G[z + dz][x + dx].q < TOWER);
  if (open) { edge[z][x] = 0; queue.push([x, z]); }
});
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz) || G[nz][nx].q < TOWER || edge[nz][nx] <= edge[z][x] + 1) continue;
    edge[nz][nx] = edge[z][x] + 1; queue.push([nx, nz]);
  }
}
each((x, z, c) => {
  const crown = c.q < TOWER ? 0 : edge[z][x] >= 7 ? 6 : edge[z][x] >= 4 ? 3 : 0;
  c.top = Math.max(c.q + crown, c.g + 1);
});

// 3. Massing helpers. Exposed faces: a neighbour missing or lower than this block's height.
const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];     // +z (south), -z (north), +x, -x
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = G[z + dz]?.[x + dx]; return !n || n.top <= y; });
const isColumn = (x, z) => x % 4 === 0 && z % 4 === 0;

const out = new Voxels([W, H, D]);
const lights = [];
const glass = "light_blue_stained_glass";

each((x, z, c) => {
  const { g, top } = c;
  for (let y = 0; y < g; y++) out.set(x, y, z, "polished_granite");           // foundation to the lowest ground
  for (let y = g; y < top; y++) {
    const ex = exposedDirs(x, z, y);
    if (ex.length) {
      // Facade. Bays on a 4-cell rhythm along the face: pier, glass, mullion, glass.
      const [dx, dz] = ex[0];
      const u = dz !== 0 ? x : z;
      const bay = u % 4;
      let b;
      if (y === top - 1) b = "calcite";                                         // parapet cap
      else if (y < 4) {                                                        // shopfront storey
        b = y === g ? "polished_granite" : y === 3 ? "calcite" : bay === 0 ? "polished_granite" : bay === 2 ? "gray_concrete" : "glass";
      } else if (y % 3 === 1) b = "calcite";                                   // storey spandrel
      else b = bay === 0 ? "calcite" : bay === 2 ? "gray_concrete" : glass;
      out.set(x, y, z, b);
      if (b === glass && (x * 7 + z * 13 + y * 3) % 11 === 0) lights.push([x, y, z, dx, dz]);
    } else {
      // Hollow interior: a roof over the top storey, a floor slab per storey, columns on the grid.
      if (y === top - 1) out.set(x, y, z, "stone");
      else if (isColumn(x, z)) out.set(x, y, z, "calcite");
      else if (y === g || (y % 3 === 1 && y < top - 2)) out.set(x, y, z, "smooth_stone");
    }
  }
});

// 4. Glowstone in the air gap behind some glass, where the cell inside is hollow.
for (const [x, y, z, dx, dz] of lights) {
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz)) continue;
  const ic = G[iz][ix];
  if (y < ic.g || y >= ic.top - 1 || y % 3 === 1 || isColumn(ix, iz) || exposedDirs(ix, iz, y).length) continue;
  out.set(ix, y, iz, "glowstone");
}

// 5. Main entrance on the south face: an iron door set in the wall, a granite surround and lintel.
const EX = 38, EZ = 54;
const eg = G[EZ][EX].g;
out.set(EX - 1, eg, EZ, "polished_granite"); out.set(EX - 1, eg + 1, EZ, "polished_granite");
out.set(EX + 1, eg, EZ, "polished_granite"); out.set(EX + 1, eg + 1, EZ, "polished_granite");
for (let x = EX - 1; x <= EX + 1; x++) out.set(x, eg + 2, EZ, "polished_granite");
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
out.set(EX, eg, EZ, "iron_door", door("lower"));
out.set(EX, eg + 1, EZ, "iron_door", door("upper"));

// 6. Roof plant on the low wings: small grey boxes on a loose grid.
each((x, z, c) => {
  if (c.top > 24 || x % 7 !== 3 || z % 5 !== 2 || exposedDirs(x, z, c.top - 1).length) return;
  out.set(x, c.top, z, "light_gray_concrete");
  if (x % 14 === 3) out.set(x, c.top + 1, z, "light_gray_concrete");
});

const info = out.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1077284.nbt");
let maxTop = 0, sumTop = 0, n = 0;
each((x, z, c) => { maxTop = Math.max(maxTop, c.top); sumTop += c.top; n++; });
console.log(JSON.stringify({ ...info, cells: n, maxTop, meanTop: +(sumTop / n).toFixed(1), glowstone: lights.length }));
