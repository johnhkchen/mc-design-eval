// P4 Dome upper: Walter's bell shell (y26..34, the owner's radius profile: near-vertical for three courses, then curving
// in faster and faster like the top half of an ellipse; each course's stepped edge is a slab outside and an upright stair
// inside, so the profile reads smooth, never stepped), hollow (a 2-thick skin, lit inside), twelve thin polished_diorite
// ribs, a tier of twelve small windows, the tholos on course 9 (a ring of quartz pillars y35..37 round a glowstone core,
// cap y38..39) and the Statue of Freedom (pedestal y40, dark bronze figure y41..42).
// Starts on P3's y25 cornice disc. Plain g.set into air: P4 owns everything above y25 inside the dome square.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DOME_AXIS } from "../vocab.mjs";

const { x: CX, z: CZ } = DOME_AXIS;
// Shell profile: [y, radius] (owner's comment v3, courses 1..9); the last course r 2.0 is the d4 disc carrying the lantern.
const PROFILE = [[26, 6.5], [27, 6.5], [28, 6.4], [29, 6.1], [30, 5.7], [31, 5.1], [32, 4.3], [33, 3.3], [34, 2.0]];
const RIBS = 12, WINDOW_Y = 28, SKIN = 2;

const cellsWithin = (r) => {
  const out = [];
  for (let x = CX - 8; x < CX + 8; x++) for (let z = CZ - 8; z < CZ + 8; z++) {
    if ((x + 0.5 - CX) ** 2 + (z + 0.5 - CZ) ** 2 <= r * r) out.push([x, z]);
  }
  return out;
};
const key = (x, z) => `${x},${z}`;
// The way toward the axis along the cell's dominant offset (a stair's back, so its lip points out).
const inward = (dx, dz) => (Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "west" : "east") : (dz > 0 ? "north" : "south"));
const step = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
const gap = (a, b) => { const d = Math.abs(a - b) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); };
// A thin rib: within about half a cell (along the arc) of one of twelve rib angles, offset so no rib doubles on an axis.
const onRib = (dx, dz) => {
  const a = Math.atan2(dz, dx), r = Math.hypot(dx, dz);
  // Near the crown the twelve converge into a grey cap: there only every second rib runs on, thinner.
  const every = r < 4 ? 2 : 1, width = r < 4 ? 0.4 : 0.55;
  for (let k = 0; k < RIBS; k += every) if (gap(a, Math.PI / RIBS + (k * 2 * Math.PI) / RIBS) * r < width) return true;
  return false;
};

function put(g, x, y, z, block, state) {
  if (!g.isAir(x, y, z)) return;
  if (state) g.set(x, y, z, block, state); else g.set(x, y, z, block);
}

function shell(g) {
  PROFILE.forEach(([y, r], i) => {
    const here = new Set(cellsWithin(r).map(([x, z]) => key(x, z)));
    const above = i + 1 < PROFILE.length ? new Set(cellsWithin(PROFILE[i + 1][1]).map(([x, z]) => key(x, z))) : null;
    const edge = (x, z) => here.has(key(x, z)) && above !== null && !above.has(key(x, z));
    const last = i + 1 === PROFILE.length;
    for (const k of here) {
      const [x, z] = k.split(",").map(Number);
      const dx = x + 0.5 - CX, dz = z + 0.5 - CZ;
      // Hollow: the void inside each course is roofed by the next one (r - SKIN <= the next r), the top course solid.
      if (!last && Math.hypot(dx, dz) <= r - SKIN) { if (y === PROFILE[0][0] && Math.hypot(dx, dz) < 1) put(g, x, y, z, "glowstone"); continue; }
      const rib = onRib(dx, dz);
      if (edge(x, z)) {
        const back = inward(dx, dz), [sx, sz] = step[back];
        // Outer of two stepped cells: a bottom slab; the inner one (or a lone step): an upright stair, lip out.
        if (edge(x + sx, z + sz)) put(g, x, y, z, rib ? "polished_diorite_slab" : "smooth_quartz_slab", { type: "bottom" });
        else {
          // A corner of the course (open to the outside on an x face and a z face): an outer-corner stair, so the
          // curve turns round the diagonal instead of sawing.
          const ox = dx > 0 ? 1 : -1, oz = dz > 0 ? 1 : -1;
          const corner = !here.has(key(x + ox, z)) && !here.has(key(x, z + oz));
          const mat = rib ? "polished_diorite" : "smooth_quartz";
          if (corner) {
            const facing = oz > 0 ? "north" : "south", westBack = ox > 0;
            const shape = facing === "north" ? (westBack ? "outer_left" : "outer_right") : (westBack ? "outer_right" : "outer_left");
            put(g, x, y, z, ...B.stairs(mat, facing, "bottom", shape));
          } else put(g, x, y, z, ...B.stairs(mat, back, "bottom"));
        }
      } else put(g, x, y, z, rib ? "polished_diorite" : "smooth_quartz");
    }
  });
}

// Twelve small windows at WINDOW_Y, one mid-way between each pair of ribs: a dark pane in the surface, a sealed
// one-cell dark pocket behind it (glowstone there read orange through the pane).
function windows(g) {
  const [, r] = PROFILE.find(([y]) => y === WINDOW_Y);
  const here = new Set(cellsWithin(r).map(([x, z]) => key(x, z)));
  const ring = [...here].map((k) => k.split(",").map(Number)).filter(([x, z]) =>
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !here.has(key(x + a, z + b))));
  for (let k = 0; k < RIBS; k++) {
    const mid = (k * 2 * Math.PI) / RIBS;
    const [x, z] = ring.reduce((a, c) => (gap(Math.atan2(c[1] + 0.5 - CZ, c[0] + 0.5 - CX), mid)
      < gap(Math.atan2(a[1] + 0.5 - CZ, a[0] + 0.5 - CX), mid) ? c : a));
    const dx = x + 0.5 - CX, dz = z + 0.5 - CZ, xWall = Math.abs(dx) >= Math.abs(dz);
    const pane = xWall ? { north: "true", south: "true", east: "false", west: "false" }
      : { north: "false", south: "false", east: "true", west: "true" };
    g.set(x, WINDOW_Y, z, "gray_stained_glass_pane", pane);
    const [sx, sz] = step[inward(dx, dz)];
    g.set(x + sx, WINDOW_Y, z + sz, "air");
  }
}

// Tholos on course 9's d4 disc: quartz_pillar columns on every other cell of its 8-cell ring, y35..37, round a
// glowstone core (lit through the gaps), a stair-ringed cap y38 (lip out) and a 2 x 2 top y39.
function tholos(g) {
  const d4 = cellsWithin(2.0), core = cellsWithin(1.0);
  const isCore = new Set(core.map(([x, z]) => key(x, z)));
  const ring = d4.filter(([x, z]) => !isCore.has(key(x, z)))
    .sort((a, b) => Math.atan2(a[1] + 0.5 - CZ, a[0] + 0.5 - CX) - Math.atan2(b[1] + 0.5 - CZ, b[0] + 0.5 - CX));
  for (const [x, z] of core) {
    for (const y of [35, 36, 37]) put(g, x, y, z, "glowstone");
    put(g, x, 38, z, "smooth_quartz");
    put(g, x, 39, z, "smooth_quartz");
  }
  ring.forEach(([x, z], i) => {
    const dx = x + 0.5 - CX, dz = z + 0.5 - CZ;
    if (i % 2 === 0) for (const y of [35, 36, 37]) put(g, x, y, z, "quartz_pillar", { axis: "y" });
    put(g, x, 38, z, ...B.stairs("smooth_quartz", inward(dx, dz), "top"));
  });
}

function statue(g) {
  put(g, 19, 40, 47, "polished_diorite");
  put(g, 19, 41, 47, "polished_blackstone");
  put(g, 19, 42, 47, "polished_blackstone_wall", { up: "true" });
}

export function build(g) {
  windows(g);     // first, so the shell (air-only) leaves the panes and their glowstone
  shell(g);
  tholos(g);
  statue(g);
}
