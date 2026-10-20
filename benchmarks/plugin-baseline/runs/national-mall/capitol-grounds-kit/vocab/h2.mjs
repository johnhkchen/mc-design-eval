// The plan.md VOCABULARY helpers for the Capitol grounds: poolBasin, walkStrip, oakTree, pilaster, terraceFlight,
// memorialPlatform, lionCouchant, smallStatue. Each takes its position as arguments (and facing where it has one)
// and returns { cells, refused, footprint }: the cells it wrote, the writes it declined with the reason, and the box
// it may write in. Nothing throws on a refused write; a bad call (a flight whose run is not its step count) throws.
//
// Rules every helper keeps:
//   - it writes only inside its footprint;
//   - it writes only into air, except the cells the plan names as replaceable: the ground top H itself (a surface,
//     a soil patch), or the blocks a helper's option lists (a pilaster over the wall face, a glowstone in the platform);
//   - it never writes below a column's ground top H (groundTop: the highest non-air cell at or below y 20). The
//     ground part owns those cells; a helper that needs ground under it reports that instead of filling it.
import { B, DIRS, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const TOP = 20;                                                   // nothing is built above y 20 (plan.md NOTES)
const bare = (id) => id.replace(/^minecraft:/, "");

// The ground top at (x, z): the highest non-air cell at or below TOP (0 for an empty column).
function groundTop(g, x, z) {
  for (let y = TOP; y >= 0; y--) if (!g.isAir(x, y, z)) return y;
  return 0;
}

// A writer bound to one footprint and one result. replace: a list of bare block ids, or "any" for the ground top.
function writer(g, footprint, out) {
  const put = (x, y, z, block, state, { replace = [] } = {}) => {
    const inside = x >= footprint[0] && y >= footprint[1] && z >= footprint[2] && x <= footprint[3] && y <= footprint[4] && z <= footprint[5];
    const cur = g.inBounds(x, y, z) ? bare(g.blockAt(x, y, z)) : null;
    const ok = inside && cur !== null && (cur === "air" || cur === "cave_air" || cur === "void_air" || replace === "any" || replace.includes(cur));
    if (!ok) {
      const why = !inside ? "outside footprint" : cur === null ? "outside grid" : `not air: ${cur}`;
      out.refused.push([x, y, z, bare(block), why]);
      return;
    }
    g.set(x, y, z, block, state);
    out.cells.push([x, y, z]);
  };
  put.refuse = (x, y, z, block, why) => out.refused.push([x, y, z, bare(block), why]);
  return put;
}

// Run body(put) with a fresh result for a footprint box [x0, y0, z0, x1, y1, z1].
function job(g, footprint, body) {
  const out = { cells: [], refused: [], footprint };
  body(writer(g, footprint, out));
  return out;
}

// A pool basin: still water at y 2 over x0..x1, z0..z1. The floor (y 1) is the ground part's; pass { floor: true }
// to lay smooth_stone over the ground there instead. The coping ring around it must already stand.
export function poolBasin(g, x0, z0, x1, z1, { floor = false } = {}) {
  return job(g, [x0, 1, z0, x1, 2, z1], (put) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (floor) put(x, 1, z, "smooth_stone", null, { replace: ["dirt", "stone", "grass_block"] });
      put(x, 2, z, "water", { level: "0" });
    }
  });
}

// One walk cell at column (x, z) whose ground top is y: a bottom slab on the column (the half-step up) when a
// neighbour inside the strip is exactly one lower, else the surface block at y. Refuses the step when nothing
// is under it, since the ground part must have filled the column to y - 1.
function walkCell(g, put, x, z, y, surface, stepUp) {
  if (stepUp) {
    if (g.isAir(x, y - 1, z)) { put.refuse(x, y, z, "smooth_sandstone_slab", "no ground under the step"); return; }
    const [slab, state] = B.slab("smooth_sandstone", "bottom");
    put(x, y, z, slab, state, { replace: "any" });
    return;
  }
  put(x, y, z, surface, null, { replace: "any" });
}

// A walk strip over x0..x1, z0..z1: the surface at each column's ground top H, and a half-step slab wherever H
// rises by 1 to a neighbour in the strip. Replaces the lawn at H only; the ground below is not touched.
export function walkStrip(g, x0, z0, x1, z1, surface = "smooth_sandstone") {
  const H = new Map();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) H.set(`${x},${z}`, groundTop(g, x, z));
  const ys = [...H.values()];
  return job(g, [x0, Math.min(...ys), z0, x1, Math.max(...ys), z1], (put) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const y = H.get(`${x},${z}`);
      const stepUp = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([nx, nz]) => H.get(`${nx},${nz}`) === y - 1);
      walkCell(g, put, x, z, y, surface, stepUp);
    }
  });
}

// A big oak at (x, z): a trunk (dark_oak_log, trunk x trunk cells, from H+1 to H+h), a crown of dark_oak_leaves
// (oak_leaves on about one outer cell in four) ellipsoid radius r, with a shroomlight inside it, and a soil patch at
// H (rooted_dirt under the trunk, podzol within 2 of it). Crown cells in clearZ = [z0, z1] are skipped (the corridor).
export function oakTree(g, x, z, h = 6, r = 4, { trunk = r >= 4 ? 2 : 1, clearZ = null } = {}) {
  const H = groundTop(g, x, z);
  const rv = Math.max(2, Math.round(r * 0.75));                  // crown half-height
  const cy = H + h, cxc = x + (trunk - 1) / 2, czc = z + (trunk - 1) / 2;
  const footprint = [x - r, H, z - r, x + trunk - 1 + r, cy + rv + 1, z + trunk - 1 + r];
  const onTrunk = (px, pz) => px >= x && px < x + trunk && pz >= z && pz < z + trunk;
  return job(g, footprint, (put) => {
    for (let px = x; px < x + trunk; px++) for (let pz = z; pz < z + trunk; pz++) {
      for (let y = H + 1; y <= cy; y++) put(px, y, pz, "dark_oak_log", { axis: "y" });
    }
    put(x + trunk, cy, z + trunk, "shroomlight");                  // a light inside the crown, off the trunk
    for (let px = x - r; px <= x + trunk - 1 + r; px++) for (let pz = z - r; pz <= z + trunk - 1 + r; pz++) {
      const dist = Math.hypot(px - cxc, pz - czc);
      if (dist > r + 1) continue;
      for (let py = cy - rv; py <= cy + rv; py++) {
        const d = ((px - cxc) / r) ** 2 + ((pz - czc) / r) ** 2 + ((py - cy) / rv) ** 2;
        if (d > 1 || (py < cy - rv + 1 && d > 0.6)) continue;     // a flattened underside
        if (clearZ && pz >= clearZ[0] && pz <= clearZ[1]) continue;
        if (!g.isAir(px, py, pz)) continue;                         // the trunk and the light stay
        const outer = d > 0.6 && (((px * 73856093) ^ (py * 19349663) ^ (pz * 83492791)) & 3) === 0;
        put(px, py, pz, outer ? "oak_leaves" : "dark_oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" });
      }
    }
    for (let px = x - 2; px <= x + trunk - 1 + 2; px++) for (let pz = z - 2; pz <= z + trunk - 1 + 2; pz++) {
      if (Math.hypot(px - cxc, pz - czc) > 2) continue;
      put(px, H, pz, onTrunk(px, pz) ? "rooted_dirt" : "podzol", null, { replace: "any" });
    }
  });
}

// A quartz pillar (axis y) at (x, y0..y1, z). By default it replaces only the marble wall cells it stands flush in.
export function pilaster(g, x, z, y0, y1, { replace = ["smooth_quartz"] } = {}) {
  const [pillar, state] = B.pillar("quartz_pillar", "y");
  return job(g, [x, y0, z, x, y1, z], (put) => {
    for (let y = y0; y <= y1; y++) put(x, y, z, pillar, state, { replace });
  });
}

// A monumental flight of steps climbing toward `facing`, from the low end of the run (steps cells long, one tread
// per cell, the first at y0). Quartz stair treads, smooth_quartz solid under each tread down to ground, a 1-wide
// smooth_quartz cheek on both outside edges whose top course is a stair following the slope, and an urn pier on
// each cheek's foot (the low end). Position: x0..x1, z0..z1, with the run along x for east/west, along z for north/south.
export function terraceFlight(g, { x0, x1, z0, z1, y0, steps, facing = "east" }) {
  const along = facing === "east" || facing === "west";
  const [lo, hi] = along ? [x0, x1] : [z0, z1];
  const [cLo, cHi] = along ? [z0, z1] : [x0, x1];
  if (hi - lo + 1 !== steps) throw new Error(`terraceFlight: ${steps} steps need a run of ${steps} cells, got ${hi - lo + 1}`);
  const at = (p, c, y) => (along ? [p, y, c] : [c, y, p]);       // run position, cross position, height
  const pos = (i) => (facing === "east" || facing === "south" ? lo + i : hi - i);
  const groundAt = (p, c) => { const [gx, , gz] = at(p, c, 0); return groundTop(g, gx, gz); };
  const H = new Map();
  for (let i = 0; i < steps; i++) for (let c = cLo - 1; c <= cHi + 1; c++) H.set(`${pos(i)},${c}`, groundAt(pos(i), c));
  const yMin = Math.min(...H.values()) + 1;
  const yMax = y0 + steps + 1;
  const footprint = along ? [lo, yMin, cLo - 1, hi, yMax, cHi + 1] : [cLo - 1, yMin, lo, cHi + 1, yMax, hi];
  const [tread, treadState] = B.stairs("quartz", facing, "bottom");
  const [cap, capState] = B.stairs("smooth_quartz", facing, "bottom");
  const [pillar, pillarState] = B.pillar("quartz_pillar", "y");
  return job(g, footprint, (put) => {
    for (let i = 0; i < steps; i++) {
      const p = pos(i), ty = y0 + i;
      for (let c = cLo; c <= cHi; c++) {
        for (let y = H.get(`${p},${c}`) + 1; y < ty; y++) put(...at(p, c, y), "smooth_quartz");
        put(...at(p, c, ty), tread, treadState);
      }
      for (const c of [cLo - 1, cHi + 1]) {
        for (let y = H.get(`${p},${c}`) + 1; y <= ty; y++) put(...at(p, c, y), "smooth_quartz");
        if (i === 0) {                                             // the foot of the cheek: pier and urn
          put(...at(p, c, ty + 1), pillar, pillarState);
          put(...at(p, c, ty + 2), "decorated_pot");
        } else {
          put(...at(p, c, ty + 1), cap, capState);
        }
      }
    }
  });
}

// A memorial platform: smooth_quartz box x0..x1, z0..z1 from y0 to topY; a polished_diorite base course on the ring
// one cell out at y0 (with stepZ = [za, zb] the ring is slabs there, and inboard y0+1 slabs stand for the steps);
// a smooth_quartz_slab rim at topY+1 on the perimeter except at the steps and inside each `open` box [xa, za, xb, zb]
// (where a group stands); glowstone at topY under the rim at the corners and mid-sides.
export function memorialPlatform(g, { x0, z0, x1, z1, y0, topY, stepZ = null, open = [] }) {
  const inStep = (z) => stepZ !== null && z >= stepZ[0] && z <= stepZ[1];
  const inOpen = (x, z) => open.some(([a, b, c, d]) => x >= a && x <= c && z >= b && z <= d);
  const onRim = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && (x === x0 || x === x1 || z === z0 || z === z1)
    && !((x === x0 || x === x1) && inStep(z)) && !inOpen(x, z);
  const footprint = [x0 - 1, y0, z0 - 1, x1 + 1, topY + 1, z1 + 1];
  const [slab, slabState] = B.slab("smooth_quartz", "bottom");
  const mx = Math.round((x0 + x1) / 2), mz = Math.round((z0 + z1) / 2);
  return job(g, footprint, (put) => {
    for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
      if (x >= x0 && x <= x1 && z >= z0 && z <= z1) continue;
      if ((x === x0 - 1 || x === x1 + 1) && inStep(z)) put(x, y0, z, slab, slabState);
      else put(x, y0, z, "polished_diorite");
    }
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= topY; y++) put(x, y, z, "smooth_quartz");
    if (stepZ !== null) for (let z = stepZ[0]; z <= stepZ[1]; z++) for (const x of [x0, x1]) {
      put(x, y0 + 1, z, slab, slabState, { replace: ["smooth_quartz"] });
    }
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (onRim(x, z)) put(x, topY + 1, z, slab, slabState);
    }
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [mx, z0], [mx, z1], [x0, mz], [x1, mz]]) {
      if (onRim(x, z)) put(x, topY, z, "glowstone", null, { replace: ["smooth_quartz"] });
    }
  });
}

// A lion couchant: a polished_blackstone body at (x, y, z) and, at the neighbour on the side away from the pedestal,
// a polished_blackstone_stairs head facing away from the statue. toward: the direction from the lion to the pedestal.
export function lionCouchant(g, x, y, z, toward) {
  const away = face.opposite(toward);
  if (!DIRS[away]) throw new Error(`lionCouchant: toward must be north, south, east or west, got ${toward}`);
  const hx = x + DIRS[away][0], hz = z + DIRS[away][2];
  const footprint = [Math.min(x, hx), y, Math.min(z, hz), Math.max(x, hx), y, Math.max(z, hz)];
  const [head, headState] = B.stairs("polished_blackstone", away, "bottom");
  return job(g, footprint, (put) => {
    put(x, y, z, "polished_blackstone");
    put(hx, y, hz, head, headState);
  });
}

// Small statues by kind (a plinth of smooth_quartz on the ground at H, a figure, a slab cap). The kinds are plan.md's
// statues P, g, p and J; each has its footprint w x d from (x, z) and its heights above H. P's figure is smooth_quartz.
const STATUES = {
  P: { w: 4, d: 4, tiers: [{ box: [0, 0, 3, 3], y: [1, 3] }, { box: [1, 1, 2, 2], y: [4, 5] }], figure: { dx: 1, dz: 1, y: [6, 6], block: "smooth_quartz" } },
  g: { w: 1, d: 3, tiers: [{ box: [0, 0, 0, 2], y: [1, 2] }], figure: { dx: 0, dz: 1, y: [3, 4], block: "polished_blackstone" } },
  p: { w: 3, d: 4, tiers: [{ box: [0, 0, 2, 3], y: [1, 2] }], figure: { dx: 1, dz: 1, y: [3, 4], block: "polished_blackstone" } },
  J: { w: 2, d: 2, tiers: [{ box: [0, 0, 1, 1], y: [1, 3] }], figure: { dx: 0, dz: 0, y: [4, 5], block: "polished_blackstone" } },
};

export function smallStatue(g, x, z, kind) {
  const k = STATUES[kind];
  if (!k) throw new Error(`smallStatue: no kind ${kind} (P, g, p or J)`);
  const H = groundTop(g, x, z);
  const f = k.figure, cap = H + f.y[1] + 1;
  const [slab, slabState] = B.slab("polished_blackstone", "bottom");
  return job(g, [x, H + 1, z, x + k.w - 1, cap, z + k.d - 1], (put) => {
    for (const t of k.tiers) for (let dx = t.box[0]; dx <= t.box[2]; dx++) for (let dz = t.box[1]; dz <= t.box[3]; dz++) {
      for (let y = H + t.y[0]; y <= H + t.y[1]; y++) put(x + dx, y, z + dz, "smooth_quartz");
    }
    for (let y = H + f.y[0]; y <= H + f.y[1]; y++) put(x + f.dx, y, z + f.dz, f.block);
    put(x + f.dx, cap, z + f.dz, slab, slabState);
  });
}
