// Golden Bay Cement, Auckland (way 531457297): a 1960s-70s concrete-frame office block on a basalt plinth, five storeys
// (the lidar's roof of 21 blocks is 5 x 4 plus the base) over a three-storey wing on the south-east side, with a one-block
// parapet on top (roof about 23 above the lowest ground, as the record says). The facade is a 4-block storey rhythm: a
// white floor line, two rows of tinted glass in white-framed bays (a mullion every third cell), a light-grey spandrel.
// The ground floor is the shopfront band with the entrance on the north face: an iron door under a white canopy.
// Plan: the outer ring is the facade; interiors are air with a solid floor slab per storey and a solid roof deck, glowstone
// behind some panes. Lidar roofs are 3x3-median smoothed and snapped to storey lines; tier edges where a column stands
// above its lower neighbour are walled from that neighbour's roof up. A plant room sits on the roof, louvred.
// Foundation: y 0 is solid under every cell (including the 56 cells the lidar puts at ground 0), so the first slab stands.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_531457297.cells.json", "utf8"));
const W = 107, D = 65, YMAX = 35;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// edge distance: 1 on the outside ring
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// storeys: 3x3 median of the lidar roof, snapped to 4-block storeys above a base at y 1
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const N = Array.from({ length: W }, () => Array(D).fill(0));
const TOP = Array.from({ length: W }, () => Array(D).fill(0));   // roof deck layer (exclusive top of the storeys)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const n = Math.min(5, Math.max(1, Math.round((median(x, z) - 1) / 4)));
  N[x][z] = n; TOP[x][z] = 1 + 4 * n;
}

// facade: outside neighbours always; a column standing above a lower neighbour is walled from that neighbour's roof up
const outDirs = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const lowerDirs = (x, z) => DIRS.filter(([dx, dz]) => inside(x + dx, z + dz) && TOP[x + dx][z + dz] < TOP[x][z]);
const normals = (x, z) => [...outDirs(x, z), ...lowerDirs(x, z)];
const FF = Array.from({ length: W }, () => Array(D).fill(Infinity));   // first y that is facade (Infinity = not a facade cell)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (outDirs(x, z).length) FF[x][z] = 0;
  else { const low = lowerDirs(x, z); if (low.length) FF[x][z] = Math.min(...low.map(([dx, dz]) => TOP[x + dx][z + dz])); }
}
const isFacade = (x, y, z) => y >= FF[x][z];

// the mullion rhythm: a white column every third cell along each wall; corners always
const mullion = (x, z) => {
  const ns = normals(x, z); if (!ns.length) return false;
  const xs = ns.some(([dx]) => dx !== 0), zs = ns.some(([, dz]) => dz !== 0);
  return (xs && zs) || (zs && x % 3 === 0) || (xs && z % 3 === 0);
};

// entrance: a north-facing ground-floor facade cell near the middle of that face
const northFace = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1 && outDirs(x, z).some(([dx, dz]) => dx === 0 && dz === -1)) northFace.push([x, z]);
const midX = northFace.map(([x]) => x).sort((a, b) => a - b)[northFace.length >> 1] ?? Math.floor(W / 2);
const [DX, DZ] = northFace.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX))[0] ?? [Math.floor(W / 2), 0];
const DOOR_FACING = "north";
const isDoorJamb = (x, z) => z === DZ && Math.abs(x - DX) === 1 && dist[x][z] === 1;

// the plant room: a louvred box on the top storey's roof, in the largest well-inside patch of the top tier
const plant = (() => {
  const w = 16, h = 8, ok = (x, z) => inside(x, z) && N[x][z] === 5 && dist[x][z] >= 4;
  let best = null, cx = 0, cz = 0, cnt = 0;
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (ok(x, z)) { cx += x; cz += z; cnt++; }
  if (!cnt) return null;
  cx /= cnt; cz /= cnt;
  for (let x0 = 0; x0 + w <= W; x0++) for (let z0 = 0; z0 + h <= D; z0++) {
    let good = true;
    for (let x = x0; x < x0 + w && good; x++) for (let z = z0; z < z0 + h && good; z++) if (!ok(x, z)) good = false;
    if (!good) continue;
    const d = Math.hypot(x0 + w / 2 - cx, z0 + h / 2 - cz);
    if (!best || d < best.d) best = { x0, z0, x1: x0 + w - 1, z1: z0 + h - 1, d };
  }
  return best;
})();

const g = new Voxels([W, YMAX, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const T = TOP[x][z], door = x === DX && z === DZ;
  g.set(x, 0, z, "stone");                                                  // foundation under every cell
  for (let y = 1; y < T; y++) {
    const k = Math.floor((y - 1) / 4), dy = (y - 1) % 4;                   // storey k, layer within it
    if (!isFacade(x, y, z)) { if (dy === 0) g.set(x, y, z, "smooth_stone"); continue; }   // floor slabs; air between
    if (dy === 0) g.set(x, y, z, k === 0 ? "polished_basalt" : "white_concrete");        // plinth or floor line
    else if (dy === 3) g.set(x, y, z, "light_gray_concrete");                             // spandrel
    else if (k === 0 && door && (y === 2 || y === 3)) g.set(x, y, z, "iron_door", { facing: DOOR_FACING, half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (k === 0 && isDoorJamb(x, z) && (y === 2 || y === 3)) g.set(x, y, z, "white_concrete");
    else if (mullion(x, z)) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "light_blue_stained_glass");
  }
  // roof: a light-grey cornice on the edge, a gray deck over the rest, and a one-block parapet on the outside ring
  g.set(x, T, z, dist[x][z] === 1 ? "light_gray_concrete" : "gray_concrete");
  if (dist[x][z] === 1) g.set(x, T + 1, z, "white_concrete");
}

// the entrance canopy: a white lintel over the door and its jambs, standing on the facade below
for (const dx of [-1, 0, 1]) if (inside(DX + dx, DZ) && dist[DX + dx][DZ] === 1) g.set(DX + dx, 4, DZ, "white_concrete");

// warm light: glowstone on the inside of some window bays, in the storey's middle layer
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && FF[x][z] < Infinity) {
  const ns = outDirs(x, z).length ? outDirs(x, z) : lowerDirs(x, z);
  const [ox, oz] = ns[0];
  const ix = x - ox, iz = z - oz;
  for (let k = 0; k < N[x][z]; k++) {
    const y = 2 + 4 * k;                                                    // the lower window layer
    if (y >= TOP[x][z] || !isFacade(x, y, z) || mullion(x, z) || (k === 0 && x === DX && z === DZ)) continue;
    if (((x * 7 + z * 13 + k * 5) % 5) !== 0) continue;
    if (inside(ix, iz) && !isFacade(ix, y, iz)) g.set(ix, y, iz, "glowstone");
  }
}

// the plant room: edge walls with a louvre band, a cap over the air inside
if (plant) {
  const { x0, z0, x1, z1 } = plant, T = TOP[x0][z0];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (edge) {
      for (let y = T + 1; y <= T + 3; y++) {
        const louvre = y === T + 2 && (x + z) % 2 === 0;
        g.set(x, y, z, louvre ? "iron_bars" : "light_gray_concrete");
      }
    }
    g.set(x, T + 4, z, "gray_concrete");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_531457297.nbt";
const r = g.save(out);
console.log(JSON.stringify({ saved: out, ...r, door: [DX, DZ], plant }));
