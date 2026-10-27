// Humanities Building (way 23893854): a concrete-frame university block, c. 1960s-70s, on the lidar massing.
// Foundations to each cell's ground; storey lines on a 4-block grid (floors at y = 4k); a one-block shell with an air
// gap behind it (no rooms); ribbon glazing in white-concrete bays; the roof tiers quantised to 4m+1 from the lidar.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23893854.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23893854.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 54, H = 49, D = 77;

// lidar roof heights (above y0) -> clean tiers on the 4m+1 storey grid: 13, 17, 21, 25, 29, 33, 37
const tier = (r) => (r <= 13 ? 13 : r <= 18 ? 17 : r <= 22 ? 21 : r <= 26 ? 25 : r <= 31 ? 29 : r <= 35 ? 33 : 37);

const G = new Map(), R = new Map();
for (const [x, z, g, r] of cells) { G.set(x + "," + z, g); R.set(x + "," + z, tier(r)); }
// lidar noise makes ragged tier edges: one majority pass over each 3x3 (a cell keeps its own tier unless 5+ of 9 agree)
{
  const raw = new Map(R);
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    const votes = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const t = raw.get((x + dx) + "," + (z + dz)); if (t !== undefined) votes.set(t, (votes.get(t) || 0) + 1);
    }
    const own = raw.get(x + "," + z);
    const best = [...votes].sort((p, q) => q[1] - p[1] || (p[0] === own ? -1 : 0))[0];
    if (best && best[1] >= 5) R.set(x + "," + z, best[0]);
  }
}
const key = (x, z) => x + "," + z;
const inFp = (x, z) => G.has(key(x, z));
const gOf = (x, z) => G.get(key(x, z));
const rOf = (x, z) => R.get(key(x, z));
const ceil4 = (g) => Math.ceil(g / 4) * 4;
// [dx, dz, face name]; the wall is along x on n/s faces and along z on e/w faces
const DIRS = [[0, -1, "n"], [0, 1, "s"], [1, 0, "e"], [-1, 0, "w"]];
// a horizontal face of cell (x,z) at height y is open to air when the neighbour is outside or its roof is below y
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => { const r = rOf(x + dx, z + dz); return r === undefined || y >= r; });
const outsideFace = (x, z, y) => DIRS.some(([dx, dz]) => rOf(x + dx, z + dz) === undefined);

// the entrance: north-facing edge cell on the lowest ground, nearest the middle of the plan
let door = null;
for (const [x, z, g] of cells) {
  if (inFp(x, z - 1)) continue;
  const score = [gOf(x, z), Math.abs(x - 27)];
  if (!door || score[0] < door.score[0] || (score[0] === door.score[0] && score[1] < door.score[1])) door = { x, z, score };
}
const doorFl = ceil4(gOf(door.x, door.z));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < H) g.set(x, y, z, block, state); };

const PANE = (a) => ({ north: "false", east: "false", south: "false", west: "false", waterlogged: "false", ...a });
const SLAB = { type: "bottom", waterlogged: "false" };

let lamps = 0;
for (const [x, z, gr] of cells) {
  const r = rOf(x, z), fl = ceil4(gr);
  for (let y = 0; y < r; y++) {
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }             // foundation to the cell's ground
    if (y % 4 === 0) { put(x, y, z, "light_gray_concrete"); continue; } // floor slab on every storey line
    if (y < fl) { put(x, y, z, "stone_bricks"); continue; }             // base course, solid so the floor above rests on it
    const fs = faces(x, z, y);
    if (!fs.length) {                                                   // interior air, but a structural column every 6 cells
      if (x % 6 === 3 && z % 6 === 3) put(x, y, z, "white_concrete");
      continue;
    }
    const f = fs.find(([dx, dz]) => rOf(x + dx, z + dz) === undefined) || fs[0];
    const along = f[2] === "n" || f[2] === "s" ? x : z;
    if (y % 4 === 3) { put(x, y, z, "white_concrete"); continue; }      // spandrel under each window band
    if (along % 3 === 0) { put(x, y, z, "white_concrete"); continue; }  // mullion pier
    const pane = f[2] === "n" || f[2] === "s" ? PANE({ east: "true", west: "true" }) : PANE({ north: "true", south: "true" });
    put(x, y, z, "light_blue_stained_glass_pane", pane);
    // a warm lamp in the air gap behind some upper-storey windows
    if (y >= fl + 4 && (along + y) % 7 === 2) {
      const [dx, dz] = DIRS.find((d) => d[2] === f[2]).slice(0, 2);
      const ix = x - dx, iz = z - dz;
      if (inFp(ix, iz) && y >= gOf(ix, iz) && y < rOf(ix, iz) && y % 4 !== 0 && !faces(ix, iz, y).length) {
        put(ix, y, iz, "shroomlight"); lamps++;
      }
    }
  }
  // parapet and cornice on the roof edge, where the edge faces outside
  if (outsideFace(x, z, r)) put(x, r, z, "light_gray_concrete");
  else if (faces(x, z, r).length) put(x, r, z, "white_concrete");
}

// roof plant on the tower roof: small plant boxes on the inner roof
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (rOf(x, z) !== 37 || outsideFace(x, z, 37)) continue;
  if (x % 5 !== 2 || z % 5 !== 2) continue;
  put(x, 37, z, "light_gray_concrete"); put(x, 38, z, "light_gray_concrete");
  put(x, 39, z, "smooth_stone_slab", SLAB);
}

// entrance: a door in the north wall, a cantilevered canopy and a hanging lantern
const { x: dx0, z: dz0 } = door;
put(dx0, doorFl + 1, dz0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx0, doorFl + 2, dz0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dx of [-1, 0, 1]) for (const dz of [-1, -2]) if (!inFp(dx0 + dx, dz0 + dz)) put(dx0 + dx, doorFl + 3, dz0 + dz, "smooth_stone_slab", SLAB);
put(dx0, doorFl + 2, dz0 - 1, "lantern", { hanging: "true", waterlogged: "false" });

// sanity: a block with air beneath it (other than the canopy, lantern and plant slab) would be hanging
let hanging = 0;
g.forEachCell((i, v) => {
  const x = i % W, y = Math.floor(i / W) % H, z = Math.floor(i / (W * H));
  if (y === 0 || g.val(x, y - 1, z)) return;
  if (g.palette[v].block === "minecraft:lantern" || g.palette[v].block === "minecraft:smooth_stone_slab") return;
  hanging++;
});

const stats = g.save(OUT);
console.log(JSON.stringify({ ...stats, lamps, doorAt: [dx0, doorFl + 1, dz0], hanging, roofSizes: [...new Set([...R.values()])] }));
