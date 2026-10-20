import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE92-0057-1F-4.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE92-0057-1F-4.nbt";

const W = 6, H = 33, D = 10;
const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxZ = Math.max(...cells.map(c => c[1]));

// Floor level = highest ground under the footprint; lower cells get a stone plinth up to it.
const M = Math.max(...cells.map(c => c[2]));
// Four storeys of 5 blocks where they fit; parapet top lands near 21 blocks above lowest ground.
const N = Math.max(1, Math.min(4, Math.floor((31 - M) / 5)));
const R = M + 5 * N - 1;   // roof slab
const P = M + 5 * N;       // parapet course

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const FACES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

const paneProps = (dz) => dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundation, plinth, floor slabs, roof slab
for (const [x, z, gr] of cells) {
  for (let y = 0; y < M; y++) put(x, y, z, y < gr ? "stone" : "stone_bricks");
  for (let s = 0; s < N; s++) put(x, M + 5 * s, z, "light_gray_concrete");
  put(x, R, z, "light_gray_concrete");
}

// 2. Exterior facades
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (const f of FACES) {
    if (has(x + f.dx, z + f.dz)) continue;
    const alongIsX = f.dz !== 0;
    const along = alongIsX ? x : z;
    const aMin = alongIsX ? minX : minZ;
    const aMax = alongIsX ? maxX : maxZ;
    const isCorner = along === aMin || along === aMax;
    const k = along - aMin;
    const isWin = !isCorner && k % 2 === 1;
    const pane = paneProps(f.dz);

    for (let s = 0; s < N; s++) {
      const fl = M + 5 * s;
      const bands = [fl + 1, fl + 2, fl + 3, fl + 4];
      for (const y of bands) {
        if (y >= R) continue; // roof slab handles the top
        let id, props;
        if (isCorner) {
          id = "smooth_quartz";
        } else if (isWin) {
          if (y === fl + 1) id = s === 0 ? "stone_bricks" : "light_gray_concrete";
          else if (y === fl + 4) id = s === 0 ? "red_concrete" : "white_concrete";
          else { id = "glass_pane"; props = pane; }
        } else {
          // mullion / frame column
          if (y === fl + 4 && s === 0) id = "red_concrete";
          else if (y === fl + 1 && s === 0) id = "stone_bricks";
          else id = y === fl + 4 ? "white_concrete" : "light_gray_concrete";
        }
        put(x, y, z, id, props);
      }
    }
  }
}

// 3. Interior light behind some windows (inner cell is air, so the light sits in the gap)
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (const f of FACES) {
    if (has(x + f.dx, z + f.dz)) continue;
    const alongIsX = f.dz !== 0;
    const along = alongIsX ? x : z;
    const aMin = alongIsX ? minX : minZ;
    const aMax = alongIsX ? maxX : maxZ;
    if (along === aMin || along === aMax) continue;
    const k = along - aMin;
    if (k % 2 !== 1) continue;
    const ix = x - f.dx, iz = z - f.dz;
    if (!has(ix, iz)) continue;
    for (let s = 0; s < N; s++) {
      if ((k + s) % 3 !== 0) continue;
      const fl = M + 5 * s;
      put(ix, fl + 2, iz, (k + s) % 6 === 0 ? "shroomlight" : "glowstone");
    }
  }
}

// 4. Ground-floor entrance on the north (street) face, nearest the middle
const midX = (minX + maxX) / 2;
const northCands = cells
  .filter(([x, z]) => !has(x, z - 1) && x !== minX && x !== maxX)
  .sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
if (northCands.length) {
  const [ex, ez] = northCands[0];
  const fl = M;
  put(ex, fl + 1, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, fl + 2, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, fl + 3, ez, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  if (has(ex, ez + 1)) put(ex, fl + 1, ez + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// 5. Parapet on the perimeter, roof plant box in the middle
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const perimeter = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !has(x + dx, z + dz));
  if (perimeter) {
    const corner = (x === minX || x === maxX) && (z === minZ || z === maxZ);
    put(x, P, z, corner ? "smooth_quartz" : "white_concrete");
  } else if (x >= 1 && x <= 2 && z >= 3 && z <= 4) {
    put(x, P, z, "stone_bricks");
  }
}

g.save(OUT);
