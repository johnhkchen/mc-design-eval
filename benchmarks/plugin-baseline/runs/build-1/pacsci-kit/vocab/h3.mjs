// Eight helpers from plan.md's VOCABULARY: fork_arch, coping_run, arch_lace, pool, helix, dome_ribbed, door_pair, poplar.
// Each takes its position (and facing, where it has one) as arguments. A helper writes only inside its own footprint,
// and only into air or into cells it wrote itself (so a cap can replace its own dome cells); anything it must skip is
// returned in `refused`, never thrown. { over: true } in the last argument also allows replacing a non-air block
// inside the footprint. Returns { placed, refused }.
import { ARCH_PROFILES, DIRS, dome, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FACES = ["north", "south", "east", "west"];

/** A view of g that writes only inside box = [x0,y0,z0,x1,y1,z1] (inclusive), only into air or into cells this helper wrote. */
function scope(g, [x0, y0, z0, x1, y1, z1], { over = false } = {}) {
  const mine = new Set(), refused = [];
  const set = (x, y, z, block, state, nbt) => {
    const k = `${x},${y},${z}`;
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1 && g.inBounds(x, y, z);
    if (!inside || !(over || mine.has(k) || g.isAir(x, y, z))) refused.push([x, y, z, block]);
    else { g.set(x, y, z, block, state, nbt); mine.add(k); }
    return view;
  };
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return set;
      if (prop === "fill") return (a, b, block, state) => {
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
          for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
            for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) set(x, y, z, block, state);
        return view;
      };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return { set, view, mine, refused };
}

const done = (s) => ({ placed: s.mine.size, refused: s.refused });

/** 1. Fork of a 3-wide panel on y: (x, y, z) is the panel's first cell on the face line; face = north|south runs it along x, east|west along z.
 *  Two upside-down smooth_quartz_stairs lean on the panel edges, smooth_quartz over the centre. */
export function fork_arch(g, facing, x, y, z, opts = {}) {
  if (!FACES.includes(facing)) throw new Error(`fork_arch: face must be one of ${FACES}, got ${facing}`);
  const ns = facing === "north" || facing === "south";
  const [dx, dz] = ns ? [1, 0] : [0, 1];
  const [toward, back] = ns ? ["east", "west"] : ["south", "north"];
  const s = scope(g, ns ? [x, y, z, x + 2, y, z] : [x, y, z, x, y, z + 2], opts);
  s.set(x, y, z, "smooth_quartz_stairs", { facing: toward, half: "top", shape: "straight" });
  s.set(x + dx, y, z + dz, "smooth_quartz", {});
  s.set(x + 2 * dx, y, z + 2 * dz, "smooth_quartz_stairs", { facing: back, half: "top", shape: "straight" });
  return done(s);
}

/** 2. Coping on the perimeter of box = [x0, z0, x1, z1]: smooth_quartz_slab at y, a quartz_pillar finial at y+1 on each
 *  rib (every 4th cell from the west/north corner; the corners are always ribs). */
export function coping_run(g, [x0, z0, x1, z1], y, opts = {}) {
  const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)], [c, d] = [Math.min(z0, z1), Math.max(z0, z1)];
  const s = scope(g, [a, y, c, b, y + 1, d], opts);
  const rib = (x, z) => ((z === c || z === d) ? (x - a) % 4 === 0 || x === b : (z - c) % 4 === 0 || z === d);
  for (let x = a; x <= b; x++) for (let z = c; z <= d; z++) {
    if (!(x === a || x === b || z === c || z === d)) continue;
    s.set(x, y, z, "smooth_quartz_slab", { type: "bottom" });
    if (rib(x, z)) s.set(x, y + 1, z, "quartz_pillar", { axis: "y" });
  }
  return done(s);
}

/** 3. Lace inside one arch frame in its plane z: frame = { x0, x1, z, spring, crown } (the same object as arch_frame).
 *  An inner pointed arch inset 2 and 2 under the crown; two end_rod braces from each leg's inner corner to the inner arch,
 *  with smooth_quartz_slab nodes where they meet it. */
export function arch_lace(g, { x0, x1, z, spring, crown }, opts = {}) {
  const a = Math.min(x0, x1), b = Math.max(x0, x1);
  const s = scope(g, [a, spring, z, b, crown, z], opts);
  const C = (a + b + 1) / 2, half = (b - a + 1) / 2 - 2, rise = crown - spring - 2;   // centre, half-width, rise (cell edges)
  const yAt = (x) => Math.round(spring + ARCH_PROFILES.pointed(x + 0.5 - C, half, rise));
  // a straight run of end_rods from p to q (x, y), each facing along the run
  const rod = (p, q) => {
    const dx = q[0] - p[0], dy = q[1] - p[1], n = Math.max(Math.abs(dx), Math.abs(dy), 1);
    const facing = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "east" : "west") : (dy >= 0 ? "up" : "down");
    for (let i = 0; i <= n; i++) s.set(Math.round(p[0] + (dx * i) / n), Math.round(p[1] + (dy * i) / n), z, "end_rod", { facing });
  };
  if (half > 0.5 && rise > 0) {
    for (let x = a + 2; x <= b - 2; x++) rod([x, yAt(x)], [Math.min(x + 1, b - 2), yAt(Math.min(x + 1, b - 2))]);
    const left = [Math.round(C - 0.5 - half / 2), yAt(Math.round(C - 0.5 - half / 2))];
    const right = [Math.round(C - 0.5 + half / 2), yAt(Math.round(C - 0.5 + half / 2))];
    for (const [leg, hit] of [[[a + 2, spring], left], [[b - 2, spring], right]]) {
      rod(leg, hit);
      for (const [nx, ny] of [leg, hit]) s.set(nx, ny, z, "smooth_quartz_slab", { type: "bottom" });
    }
  }
  return done(s);
}

/** 4. Pool with its rim: box = [x0, z0, x1, z1] (rim cells on the edge), at surface y. Rim smooth_quartz, water inside. */
export function pool(g, [x0, z0, x1, z1], y, opts = {}) {
  const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)], [c, d] = [Math.min(z0, z1), Math.max(z0, z1)];
  if (b - a < 2 || d - c < 2) throw new Error("pool: needs at least a 3x3 box (a rim and water)");
  const s = scope(g, [a, y, c, b, y, d], opts);
  for (let x = a; x <= b; x++) for (let z = c; z <= d; z++) {
    const rim = x === a || x === b || z === c || z === d;
    if (rim) s.set(x, y, z, "smooth_quartz", {});
    else s.set(x, y, z, "water", { level: "0" });
  }
  return done(s);
}

/** 5. Double helix in the 3x3 at (x, z) (its min corner): two iron_block strands a quarter turn every two rows, with
 *  a light_gray_concrete rung across the middle on odd rows. y = base (default 1), height default 12. */
export function helix(g, x, z, { y = 1, height = 12, ...opts } = {}) {
  const s = scope(g, [x, y, z, x + 2, y + height - 1, z + 2], opts);
  const edge = [[1, 0], [0, 1], [-1, 0], [0, -1]];   // the four edge cells of the 3x3, in turning order
  for (let r = 0; r < height; r++) {
    const k = Math.floor(r / 2) % 4;
    for (const [dx, dz] of [edge[k], edge[(k + 2) % 4]]) s.set(x + 1 + dx, y + r, z + 1 + dz, "iron_block", {});
    if (r % 2 === 1) s.set(x + 1, y + r, z + 1, "light_gray_concrete", {});
  }
  return done(s);
}

/** 6. IMAX dome at center = [cx, y, cz] (the drum's base, y = 1 in the plan): hollow white_concrete drum (5 high, a
 *  smooth_quartz course on its top layer), hollow hemisphere of radius 18 from the drum's top to a 3x3 smooth_quartz cap
 *  at y + 22 (y23), and 8 smooth_quartz meridians from the drum to the cap, laid over the dome's own shell cells. */
export function dome_ribbed(g, [cx, y, cz], opts = {}) {
  const R = 18, drumH = 5, H = 18, base = y + drumH, topY = base + H - 1;
  const s = scope(g, [Math.floor(cx - R), y, Math.floor(cz - R), Math.ceil(cx + R), topY, Math.ceil(cz + R)], opts);
  dome(s.view, {
    center: [cx, y, cz], radius: R, height: H, profile: "hemisphere", block: "white_concrete", edge: "none", hollow: true,
    drum: { height: drumH, radius: R, block: "white_concrete", bands: [{ every: drumH, offset: drumH - 1, block: "smooth_quartz" }] },
  });
  for (let k = 0; k < 8; k++) {
    const t = (k * Math.PI) / 4;
    for (let r = 0; r <= R; r += 0.5) {
      const px = Math.round(cx + r * Math.cos(t)), pz = Math.round(cz + r * Math.sin(t));
      const py = Math.min(topY, Math.round(base + Math.sqrt(R * R - r * r)));
      // the first of the rounded cell and its neighbours above and below that the dome actually built
      const hit = [py, py - 1, py + 1].find((yy) => s.mine.has(`${px},${yy},${pz}`));
      if (hit !== undefined) s.set(px, hit, pz, "smooth_quartz", {});
    }
  }
  const mx = Math.round(cx), mz = Math.round(cz);
  for (let x = mx - 1; x <= mx + 1; x++) for (let z = mz - 1; z <= mz + 1; z++) s.set(x, topY, z, "smooth_quartz", {});
  return done(s);
}

/** 7. Double iron door, both halves of both leaves. (x, y, z) is the lower cell of the leaf on the viewer's left as the
 *  viewer faces the door from outside; the second leaf is one step to the viewer's right. facing = the way the door faces (out). */
export function door_pair(g, [x, y, z], facing, opts = {}) {
  if (!FACES.includes(facing)) throw new Error(`door_pair: face must be one of ${FACES}, got ${facing}`);
  const [rx, rz] = DIRS[face.cw(face.opposite(facing))];
  const leaves = [[x, z, "left"], [x + rx, z + rz, "right"]];
  const cells = leaves.flatMap(([lx, lz]) => [[lx, y, lz], [lx, y + 1, lz]]);
  // a pair is all or nothing: if any of its four cells is taken, write none of it
  const blocked = cells.filter(([cx, cy, cz]) => !g.inBounds(cx, cy, cz) || !g.isAir(cx, cy, cz));
  if (blocked.length && !opts.over) return { placed: 0, refused: blocked.map((c) => [...c, g.blockAt(...c)]) };
  const xs = [x, x + rx], zs = [z, z + rz];
  const s = scope(g, [Math.min(...xs), y, Math.min(...zs), Math.max(...xs), y + 1, Math.max(...zs)], opts);
  for (const [lx, lz, hinge] of leaves) {
    s.set(lx, y, lz, "iron_door", { facing, half: "lower", hinge, open: "false" });
    s.set(lx, y + 1, lz, "iron_door", { facing, half: "upper", hinge, open: "false" });
  }
  return done(s);
}

/** 8. Poplar: a one-cell grass_block planting bed at (x, y, z) (y default 1), a birch_log trunk of h blocks above it, and a
 *  narrow crown of persistent birch_leaves: a ring 3 under the top, pluses at the next two levels and at the top, a tip above. */
export function poplar(g, x, z, h, { y = 1, ...opts } = {}) {
  if (h < 4) throw new Error("poplar: trunk must be at least 4 blocks");
  const s = scope(g, [x - 1, y, z - 1, x + 1, y + h + 1, z + 1], opts);
  const leaf = { persistent: "true" };
  s.set(x, y, z, "grass_block", {});
  for (let k = 1; k <= h; k++) s.set(x, y + k, z, "birch_log", { axis: "y" });
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) s.set(x + dx, y + h - 3, z + dz, "birch_leaves", leaf);
  for (const ly of [y + h - 2, y + h - 1, y + h]) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) s.set(x + dx, ly, z + dz, "birch_leaves", leaf);
  s.set(x, y + h + 1, z, "birch_leaves", leaf);
  return done(s);
}
