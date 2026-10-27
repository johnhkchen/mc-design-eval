// Mt Eden / CBD fringe office block (way 292861382): a 1980s postmodern office tower, eleven storeys over a shop-fronted
// ground floor. Lidar roof heights are median-smoothed and snapped to a 4-block storey grid; the outer two rings are held
// at a 44-block shoulder so the core rises to its 48-52 crown (a setback, not a flat slab). The plinth is basalt (Auckland's
// volcanic stone) up to the ground-floor course at y 8; ground floor = black piers, shop glass and two doors with lanterns;
// upper storeys = white concrete floor lines, cyan tinted glass ribbons on white piers, light-grey spandrels; a basalt-style
// stone-brick parapet; a lift core with a lantern cap; plant boxes on the roof. Glowstone sits behind some panes. Interiors
// are air with a floor slab per storey, the outer ring is the facade, and the foundation is solid from y 0 to the ground course.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861382.cells.json", "utf8"));
const W = 64, D = 45, H = 63, DATUM = 8, SHOULDER = 44;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                                   // ground (foundation top), lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// edge distance: 1 = facade ring (touches outside), then BFS inward
const dist = grid(0), queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && NB.some(([a, b]) => !inside(x + a, z + b))) { dist[x][z] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [a, b] of NB) { const nx = x + a, nz = z + b; if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); } }
}

// roof: 5x5 median of the lidar roof, snapped to 4-block storeys, never under 3 storeys, outer two rings held at the shoulder
const median = (x, z) => {
  const v = [];
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (inside(x + a, z + b)) v.push(R[x + a][z + b]);
  v.sort((p, q) => p - q); return v[v.length >> 1];
};
const T = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  let t = Math.max(12, 4 * Math.round(median(x, z) / 4));
  if (dist[x][z] <= 2) t = Math.min(t, SHOULDER);
  T[x][z] = t;
}

// outward normal of a ring cell, one axis only: a stepped lidar outline has many one-cell steps, so a cell that
// touches the outside on both axes takes its z face (the step reads as part of that run, not as a pier)
const outN = (x, z) => {
  let nx = 0, nz = 0;
  if (!inside(x, z - 1)) nz -= 1; if (!inside(x, z + 1)) nz += 1;
  if (!nz) { if (!inside(x - 1, z)) nx -= 1; if (!inside(x + 1, z)) nx += 1; }
  return [nx, nz];
};
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// the design: every block of the building keyed by x,y,z (panes get their connections after)
const M = new Map();
const put = (x, y, z, block, state, tan) => M.set(`${x},${y},${z}`, { block, state, tan });
const ring = [], faces = new Map();

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const isRing = dist[x][z] === 1;
  const [nx, nz] = isRing ? outN(x, z) : [0, 0];
  const onFace = isRing;
  const idx = nz !== 0 ? x : z;                                   // position along the face
  const tan = nz !== 0 ? "x" : "z";                               // the pane runs along this axis
  const t = T[x][z];
  if (onFace) {
    const key = `${nx},${nz},${nz !== 0 ? z : x}`;
    if (!faces.has(key)) faces.set(key, []);
    faces.get(key).push([x, z, idx, nx, nz]);
  }
  if (isRing) ring.push([x, z, nx, nz]);

  // foundation and plinth: solid from y 0 to the ground course, the same mass inside
  for (let y = 0; y < DATUM; y++) put(x, y, z, isRing ? "polished_basalt" : "stone");
  // ground course, then the ground storey: shopfront glass on piers, fascia above
  put(x, DATUM, z, isRing ? "polished_basalt" : "smooth_stone");
  if (isRing) {
    for (const y of [DATUM + 1, DATUM + 2]) {
      if (idx % 4 === 0) put(x, y, z, "black_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", null, tan);
    }
    put(x, DATUM + 3, z, "black_concrete");
  }
  // upper storeys: a floor line, two glass rows on white piers, a grey spandrel
  for (let yb = 12; yb <= t - 4; yb += 4) {
    put(x, yb, z, isRing ? "white_concrete" : "smooth_stone");
    if (isRing) {
      for (const y of [yb + 1, yb + 2]) {
        if (idx % 3 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "cyan_stained_glass_pane", null, tan);
      }
      put(x, yb + 3, z, "light_gray_concrete");
    }
  }
  // parapet on the ring, roof deck inside (roof deck overrides the top floor's air)
  if (isRing) put(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  else put(x, t - 1, z, "gray_concrete");
}

// two entrances: the middle of the two longest flat faces, a lantern just inside each
const groups = [...faces.values()].sort((a, b) => b.length - a.length).slice(0, 2);
for (const g of groups) {
  g.sort((a, b) => a[2] - b[2]);
  const [x, z, , nx, nz] = g[g.length >> 1];
  const facing = FACING[`${nx},${nz}`];
  for (const y of [DATUM + 1, DATUM + 2]) put(x, y, z, "dark_oak_door", { facing, half: y === DATUM + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  if (inside(x - nx, z - nz)) put(x - nx, DATUM + 1, z - nz, "lantern", { hanging: "false", waterlogged: "false" });
}

// the lift core: a solid 4x4 stair-and-lift spine rising past the crown, close to the tallest interior part
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length, cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
let core = null;
for (let x0 = 0; x0 + 4 <= W; x0++) for (let z0 = 0; z0 + 4 <= D; z0++) {
  let ok = true, tMax = 0;
  for (let a = 0; a < 4 && ok; a++) for (let b = 0; b < 4 && ok; b++) {
    const x = x0 + a, z = z0 + b;
    ok = inside(x, z) && dist[x][z] >= 4; tMax = Math.max(tMax, T[x][z] || 0);
  }
  if (!ok) continue;
  const score = tMax * 2 - Math.hypot(x0 + 1.5 - cx, z0 + 1.5 - cz);
  if (!core || score > core.score) core = { x0, z0, tMax, score };
}
const coreTop = core.tMax + 8;
const inCore = (x, z) => core && x >= core.x0 - 1 && x <= core.x0 + 4 && z >= core.z0 - 1 && z <= core.z0 + 4;
for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
  const x = core.x0 + a, z = core.z0 + b;
  for (let y = 0; y < coreTop; y++) put(x, y, z, "white_concrete");
  put(x, coreTop, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// plant boxes on the roof, sparse, clear of the core
for (let x = 4; x < W - 5; x += 8) for (let z = 4; z < D - 5; z += 8) {
  const ok = [0, 1].every((a) => [0, 1].every((b) => inside(x + a, z + b) && dist[x + a][z + b] >= 4 && T[x + a][z + b] === T[x][z] && !inCore(x + a, z + b)));
  if (!ok) continue;
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let y = T[x][z]; y < T[x][z] + 2; y++) put(x + a, y, z + b, "light_gray_concrete");
}

// warm lights behind some panes: glowstone in the air gap inside a window
for (const [x, z, nx, nz] of ring) {
  const t = T[x][z];
  for (let yb = DATUM; yb <= t - 4; yb += 4) {
    const y = yb === DATUM ? DATUM + 1 : yb + 1;
    const pane = M.get(`${x},${y},${z}`);
    if (!pane || !pane.block.endsWith("pane")) continue;
    if ((x * 5 + z * 3 + yb) % 9 !== 0) continue;
    const ix = x - nx, iz = z - nz;
    if (inside(ix, iz) && dist[ix][iz] >= 2 && !M.has(`${ix},${y},${iz}`)) put(ix, y, iz, "glowstone");
  }
}

// connections: a pane joins the neighbours along its own face (any solid or pane), never a door, lantern or light
const joins = (x, y, z) => { const e = M.get(`${x},${y},${z}`); return !!e && !/door|lantern|glowstone/.test(e.block); };
const g = new Voxels([W, H, D]);
for (const [key, e] of M) {
  const [x, y, z] = key.split(",").map(Number);
  let state = e.state;
  if (e.block.endsWith("pane")) {
    state = e.tan === "z"
      ? { north: String(joins(x, y, z - 1)), south: String(joins(x, y, z + 1)), east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)), waterlogged: "false" };
  }
  g.set(x, y, z, e.block, state);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861382.nbt");
