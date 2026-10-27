// Sapphire Apartments: a 1980s precast-concrete residential tower (14 storeys of 4 blocks, 1.2 blocks a metre) with
// blue-glazed bays, a stepped setback shoulder, a low two-storey wing, a glazed lobby entrance and a plant room on the roof.
// Every storey is a floor slab (solid row at the storey line) and a spandrel (solid row at the top of the storey), with
// two rows of air between them; the walls are a shell on the footprint's edge, so no interior is built.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020885.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 47, D = 29, H = 71;
const FLOOR0 = 3;                    // ground-floor slab; the plinth sits under it on the downhill side
const foot = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g, r] of cells) foot[z][x] = { g, r };
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && foot[z][x] !== null;

// Tier tops: the lidar roof's 3x3 median (kills single-cell noise), then snapped to a storey line (FLOOR0 + 4k).
const T = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) rs.push(foot[z + dz][x + dx].r);
  rs.sort((a, b) => a - b);
  const med = rs[Math.floor(rs.length / 2)];
  const k = Math.max(1, Math.floor((med - FLOOR0) / 4 + 0.5));
  T[z][x] = FLOOR0 + 4 * k;
}
const TOP = Math.max(...T.flat());

// A neighbour is air at height y if it is off the footprint or its tier has already ended below y.
const air = (x, y, z) => !inside(x, z) || y >= T[z][x];
const exposed = (x, y, z) => ({ x: air(x - 1, y, z) || air(x + 1, y, z), z: air(x, y, z - 1) || air(x, y, z + 1) });

// The entrance: a lower-ground, non-corner cell on the tower's wall, nearest the middle of its face.
let entrance = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z) || T[z][x] < 47) continue;
  const ex = exposed(x, 4, z);
  if (ex.x === ex.z) continue;
  const u = ex.x ? z : x, len = ex.x ? D : W;
  if (u < 3 || u > len - 4) continue;
  const score = foot[z][x].g * 1000 + Math.abs(u - len / 2);
  if (!entrance || score < entrance.score) entrance = { x, z, ex, u, score };
}
const outward = entrance.ex.z ? (air(entrance.x, 4, entrance.z - 1) ? "north" : "south")
                              : (air(entrance.x - 1, 4, entrance.z) ? "west" : "east");

const plan = new Map();
const K = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state, extra) => plan.set(K(x, y, z), { block, state, ...extra });

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const g = foot[z][x].g, t = T[z][x];
  for (let y = 0; y < g; y++) put(x, y, z, "stone");                  // foundation, to this cell's ground
  for (let y = g; y < FLOOR0; y++) put(x, y, z, "stone_bricks");      // plinth up to the ground-floor slab

  for (let y = FLOOR0; y < t; y++) {
    const rel = (y - FLOOR0) % 4, storey = (y - FLOOR0) >> 2;
    const ex = exposed(x, y, z), out = ex.x || ex.z;
    if (rel === 0) {                                                  // floor slab / storey line
      put(x, y, z, !out ? "light_gray_concrete" : storey === 0 ? "stone_bricks" : "smooth_stone");
    } else if (rel === 3) {                                           // spandrel / ceiling, the top row is the cap
      put(x, y, z, out ? "white_concrete" : "light_gray_concrete");
    } else if (out) {                                                 // window rows: piers on a 3-block bay, glass between
      const corner = ex.x && ex.z, u = ex.x ? z : x, bay = Math.floor(u / 3);
      if (corner || u % 3 === 0) put(x, y, z, "gray_concrete");
      else {
        const block = (bay + storey) % 4 === 2 ? "blue_stained_glass_pane" : "light_blue_stained_glass_pane";
        const inward = ex.x ? [air(x - 1, y, z) ? 1 : -1, 0] : [0, air(x, y, z - 1) ? 1 : -1];
        put(x, y, z, block, null, { axis: ex.x ? "x" : "z", bay: bay + storey, inward });
      }
    }
  }

  // parapet on the tier's edge: a full block on the tower's crown, a half-block cornice on the lower tiers
  if (exposed(x, t - 1, z).x || exposed(x, t - 1, z).z)
    t === TOP ? put(x, t, z, "blue_concrete") : put(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// The entrance bay: a glazed lobby three cells wide, the door, and a stone lintel over it.
{
  const { x, z, ex, u } = entrance;
  const along = (d) => (ex.x ? [x, z + d] : [x + d, z]);
  for (const d of [-1, 1]) for (const y of [4, 5]) {
    const [cx, cz] = along(d);
    put(cx, y, cz, "light_blue_stained_glass_pane", null, { axis: ex.x ? "x" : "z", bay: -1, inward: [0, 0] });
  }
  put(x, 4, z, "iron_door", { facing: outward, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 5, z, "iron_door", { facing: outward, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const d of [-1, 0, 1]) { const [lx, lz] = along(d); put(lx, 6, lz, "smooth_stone"); }
  // a lantern under each end of the lintel, on the lobby's glass line
  for (const d of [-1, 1]) { const [lx, lz] = along(d); put(lx, 5, lz, "lantern", { hanging: "true", waterlogged: "false" }); }
}

// The roof plant room: a 7 x 4 box of white concrete on the tower's crown, away from its edges.
{
  let best = null;
  for (let z0 = 2; z0 < D - 6; z0++) for (let x0 = 2; x0 < W - 8; x0++) {
    let ok = true;
    for (let z = z0; z < z0 + 4 && ok; z++) for (let x = x0; x < x0 + 7 && ok; x++)
      ok = inside(x, z) && T[z][x] === TOP && !exposed(x, TOP - 1, z).x && !exposed(x, TOP - 1, z).z;
    if (!ok) continue;
    const d = Math.abs(x0 + 3.5 - W / 2) + Math.abs(z0 + 1.5 - D / 2);
    if (!best || d < best.d) best = { x0, z0, d };
  }
  if (best) {
    const { x0, z0 } = best;
    for (let z = z0; z < z0 + 4; z++) for (let x = x0; x < x0 + 7; x++) {
      const edge = x === x0 || x === x0 + 6 || z === z0 || z === z0 + 3;
      for (let y = TOP; y < TOP + 3; y++) if (edge) put(x, y, z, "white_concrete");
      put(x, TOP + 3, z, "light_gray_concrete");
    }
    // a lantern on the roof of the plant room
    put(x0 + 3, TOP + 4, z0 + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Air-conditioning units on the setback shoulders (on the tier caps, away from the walls).
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = T[z][x];
  if (!inside(x, z) || t >= TOP || t < 47 || x % 6 !== 3 || z % 5 !== 2) continue;
  if (exposed(x, t - 1, z).x || exposed(x, t - 1, z).z) continue;
  put(x, t, z, "iron_block");
}

// Pane connections: a pane joins the glass and solid neighbours in its own wall plane.
const isPane = (b) => /_pane$/.test(b);
const joins = (n) => n && (isPane(n.block) || !/slab|door|lantern|stairs/.test(n.block));
for (const [k, e] of plan) {
  if (!e.axis) continue;
  const [x, y, z] = k.split(",").map(Number);
  const dirs = e.axis === "x"
    ? { north: [0, -1], south: [0, 1] }
    : { east: [1, 0], west: [-1, 0] };
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const [name, [dx, dz]] of Object.entries(dirs)) if (joins(plan.get(K(x + dx, y, z + dz)))) st[name] = "true";
  e.state = st;
  // a warm light just inside some panes, in the air gap behind the glass
  if (e.bay % 3 === 1 && (y - FLOOR0) % 4 === 1) {
    const [ix, iz] = [x + e.inward[0], z + e.inward[1]];
    if (inside(ix, iz) && !plan.has(K(ix, y, iz))) put(ix, y, iz, "glowstone");
  }
}

const g = new Voxels([W, H, D]);
for (const [k, e] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, e.block, e.state ?? undefined);
}
const { blocks, palette } = g.save(`${DIR}/way_293020885.nbt`);
console.log(JSON.stringify({ tierTops: [...new Set(T.flat().filter(Boolean))].sort((a, b) => a - b), top: TOP, entrance: { x: entrance.x, z: entrance.z, outward }, blocks, palette }));
