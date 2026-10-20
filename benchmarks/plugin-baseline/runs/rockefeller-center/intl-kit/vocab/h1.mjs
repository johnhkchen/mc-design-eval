// Helpers from plan.md VOCABULARY: pier_strip_face, deck_light, deco_panel, bronze_door, lit_bay, atlas_figure,
// ring_ellipse, uplight, lamp_post, vent. Block ids are literals from plan.md's PALETTE, checked at 1.21.1, with one
// exception: plan.md's smooth_stone_stairs is not a 1.21.1 block, so vent uses stone_stairs (the same grey stone).
// Every helper takes the grid g, then its position (and facing) as arguments, and returns { placed, refused }.
// It writes only its own footprint, and only into air: a cell an earlier part already filled is refused and listed,
// never overwritten, unless opts.overwrite is true. The two flush lights (deck_light, uplight) sit IN a surface, so
// they may also replace that one surface block (smooth_stone deck, polished_andesite / smooth_stone paving); the
// block under them is never touched.
import { DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FLUSH_OK = new Set(["minecraft:smooth_stone", "minecraft:polished_andesite"]);
const FACES = ["north", "south", "east", "west"];
const result = () => ({ placed: 0, refused: [] });

// One write: into air (or onto a flush surface) inside the grid; anything else is refused and listed.
function put(g, res, opts, x, y, z, block, state, flush = false) {
  const inside = g.inBounds(x, y, z);
  const free = inside && (g.isAir(x, y, z) || (flush && FLUSH_OK.has(g.blockAt(x, y, z))));
  if (!(free || (opts.overwrite && inside))) { res.refused.push([x, y, z, block]); return false; }
  g.set(x, y, z, block, state);
  res.placed++;
  return true;
}

function checkFace(face) {
  if (!FACES.includes(face)) throw new Error(`face must be north, south, east or west, got ${face}`);
  return face;
}
const isEW = (face) => face === "east" || face === "west";
// Outward sign on the face's normal axis: +1 for east and south, -1 for west and north.
const outSign = (face) => DIRS[face][isEW(face) ? 0 : 2];
const mod3 = (n) => ((n % 3) + 3) % 3;

// Lit or dark for one 2x2 window bay (about one in four is lit). Deterministic, so a rebuild reads the same.
function litPick(a, b, c, seed) {
  let h = Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791) ^ Math.imul(seed, 2654435761);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) % 4 === 0;
}

/**
 * A facade run on one face: smooth_sandstone piers flush at the face plane, glass strips recessed 1 (glass rows, with
 * polished_deepslate spandrel rows between), and a lit or dark block 2 in behind each pane.
 * face: the outward side (north|south|east|west); at: the face plane (x for east/west, z for north/south);
 * from..to: the run along the face (z for east/west, x for north/south); y0..y1: the height.
 * pierMod: the pier columns' residue mod 3 (0, 1 or 2): plan.md's tower east faces are 2, the plot long faces 1.
 * Two-wide corner piers at both ends, with cut_sandstone every 4th course. Lit bays are 2x2 windows (one pick per bay),
 * and a storey row of two or more bays is never all lit.
 */
export function pier_strip_face(g, { face, at, from, to, y0, y1, pierMod = 0, litSeed = 0 }, opts = {}) {
  checkFace(face);
  const res = result();
  const ew = isEW(face), s = outSign(face), pm = mod3(pierMod), fi = FACES.indexOf(face);
  const P = (a, y, depth) => (ew ? [at + s * depth, y, a] : [a, y, at + s * depth]);
  const corner = (a) => a - from < 2 || to - a < 2;
  const onPier = (a) => corner(a) || mod3(a - pm) === 0;
  const bayOf = (a, y) => [Math.floor((a - pm - 1) / 3), Math.floor((y - 2) / 3)];

  // Lit decision per bay; a storey row of two or more bays is never all lit (its first bay stays dark).
  const bays = new Map();
  for (let a = from; a <= to; a++) if (!onPier(a)) for (let y = y0; y <= y1; y++) if (y % 3 !== 1) {
    const [ba, by] = bayOf(a, y), k = `${ba},${by}`;
    if (!bays.has(k)) bays.set(k, { by, lit: litPick(ba, by, at * 4 + fi, litSeed) });
  }
  const rows = new Map();
  for (const b of bays.values()) rows.set(b.by, [...(rows.get(b.by) ?? []), b]);
  for (const row of rows.values()) if (row.length >= 2 && row.every((b) => b.lit)) row[0].lit = false;

  const panes = [];
  for (let a = from; a <= to; a++) for (let y = y0; y <= y1; y++) {
    if (onPier(a)) {
      put(g, res, opts, ...P(a, y, 0), corner(a) && y % 4 === 0 ? "cut_sandstone" : "smooth_sandstone");
    } else if (y % 3 === 1) {
      put(g, res, opts, ...P(a, y, -1), "polished_deepslate");
    } else {
      const [ba, by] = bayOf(a, y);
      if (!put(g, res, opts, ...P(a, y, -1), "glass_pane")) continue;
      panes.push(P(a, y, -1));
      const lit = bays.get(`${ba},${by}`).lit;
      put(g, res, opts, ...P(a, y, -2), lit ? "ochre_froglight" : "gray_concrete", lit ? { axis: "y" } : undefined);
    }
  }
  // Each pane joins every neighbour that is not air (glass, spandrel, pier, back block), as the game connects them.
  for (const pos of panes) {
    const states = Object.fromEntries(["north", "south", "east", "west"].map((d) => {
      const [dx, dy, dz] = DIRS[d];
      return [d, !g.isAir(pos[0] + dx, pos[1] + dy, pos[2] + dz)];
    }));
    g.set(...pos, "glass_pane", states);
  }
  return res;
}

/** Flush ochre_froglight lights in a deck or paving, one per listed cell [x, y, z] (y is the surface course). */
export function deck_light(g, cells, opts = {}) {
  const res = result();
  for (const [x, y, z] of cells) put(g, res, opts, x, y, z, "ochre_froglight", { axis: "y" }, true);
  return res;
}

/**
 * A Deco gilded panel in the plane x, spanning z0..z1 by y0..y1: a waxed_exposed_cut_copper border, a gold_block field,
 * and yellow_terracotta rays stepping out at 45 degrees from the bottom centre. face (east|west) is the side it faces.
 */
export function deco_panel(g, { x, z0, z1, y0, y1, face }, opts = {}) {
  checkFace(face);
  if (!isEW(face)) throw new Error(`deco_panel faces east or west, got ${face}`);
  const res = result();
  const zc = Math.floor((z0 + z1) / 2);
  for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
    const edge = z === z0 || z === z1 || y === y0 || y === y1;
    const dy = y - (y0 + 1), dz = Math.abs(z - zc);
    const ray = !edge && dy >= 0 && dz === dy;
    put(g, res, opts, x, y, z, edge ? "waxed_exposed_cut_copper" : ray ? "yellow_terracotta" : "gold_block");
  }
  return res;
}

/**
 * A double bronze door at (x, y, z): dark_oak_door leaves at z and z+1 (x and x+1 on a north or south face), both halves;
 * a waxed_exposed_cut_copper frame around the pair (jambs beside it, lintel at y+2); and a lantern on an oak_fence post
 * one cell out from the wall beside each side (post y+2, lantern y+3). face: the side the door faces (outward).
 */
export function bronze_door(g, { x, y, z, face }, opts = {}) {
  checkFace(face);
  const res = result();
  const ew = isEW(face), s = outSign(face), start = ew ? z : x;
  const P = (a, yy, depth = 0) => (ew ? [x + s * depth, yy, a] : [a, yy, z + s * depth]);
  for (const [a, hinge] of [[start, "left"], [start + 1, "right"]]) {
    for (const [half, yy] of [["lower", y], ["upper", y + 1]]) {
      put(g, res, opts, ...P(a, yy), "dark_oak_door", { facing: face, half, hinge, open: "false", powered: "false" });
    }
  }
  for (const yy of [y, y + 1]) for (const a of [start - 1, start + 2]) put(g, res, opts, ...P(a, yy), "waxed_exposed_cut_copper");
  for (let a = start - 1; a <= start + 2; a++) put(g, res, opts, ...P(a, y + 2), "waxed_exposed_cut_copper");
  for (const a of [start - 2, start + 3]) {
    put(g, res, opts, ...P(a, y + 2, 1), "oak_fence");
    put(g, res, opts, ...P(a, y + 3, 1), "lantern", { hanging: "false" });
  }
  return res;
}

/** One behind-glass cell at (x, y, z): ochre_froglight when lit, gray_concrete when dark. opts.lit forces it (lobbies, shops). */
export function lit_bay(g, x, y, z, { lit, seed = 0, overwrite = false } = {}) {
  const res = result();
  const on = lit ?? litPick(x, y, z, seed);
  put(g, res, { overwrite }, x, y, z, on ? "ochre_froglight" : "gray_concrete", on ? { axis: "y" } : undefined);
  return res;
}

/**
 * The kneeling Atlas per the architect's envelope. c = { x, y, z } is the envelope's low corner (plot 0: x 65, y 6, z 25,
 * spanning x 65..69, y 6..15, z 25..30). Brown_terracotta body, head bowed toward +x, arms up to the sphere, and
 * waxed_weathered_cut_copper on the shoulders and thigh tops (about 4% of the figure).
 */
export function atlas_figure(g, { x, y, z }, opts = {}) {
  const res = result();
  const B = "brown_terracotta", HI = "waxed_weathered_cut_copper";
  // Offsets from the low corner, written in order; a later box overrides an earlier one where they overlap.
  const figure = new Map();
  const add = (x0, y0, z0, x1, y1, z1, block) => {
    for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) for (let k = z0; k <= z1; k++) figure.set(`${i},${j},${k}`, [i, j, k, block]);
  };
  add(1, 3, 1, 3, 6, 4, B);                    // torso, y 9..12
  add(2, 7, 2, 3, 8, 3, B);                    // head, y 13..14, bowed toward +x
  add(2, 8, 0, 2, 9, 0, B); add(2, 8, 5, 2, 9, 5, B);  // arms from the shoulders up to the hands under the sphere
  add(2, 7, 0, 2, 7, 0, HI); add(2, 7, 5, 2, 7, 5, HI); // shoulders
  add(1, 1, 1, 2, 2, 2, B); add(1, 1, 3, 2, 2, 4, B);  // thighs
  add(1, 2, 1, 1, 2, 1, HI); add(1, 2, 3, 1, 2, 3, HI); // thigh tops
  add(0, 0, 1, 1, 0, 2, B); add(0, 0, 3, 1, 0, 4, B);  // back shins on the plinth
  add(3, 0, 1, 4, 1, 2, B);                    // forward knee and foot, x 69
  for (const [i, j, k, block] of figure.values()) put(g, res, opts, x + i, y + j, z + k, block);
  return res;
}

/**
 * A hollow ring one block thick: an ellipse with radii ra and rb centred on centre = [x, y, z], in the plane "xy", "xz" or
 * "yz" (ra along the plane's first axis, rb along its second). Points are sampled densely and rounded, so no gaps.
 */
export function ring_ellipse(g, [cx, cy, cz], plane, ra, rb, mat = "waxed_exposed_cut_copper", opts = {}) {
  if (!["xy", "xz", "yz"].includes(plane)) throw new Error(`plane must be xy, xz or yz, got ${plane}`);
  const res = result();
  const cells = new Map();
  const n = Math.ceil(2 * Math.PI * Math.max(ra, rb) * 4);
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n, u = ra * Math.cos(t), v = rb * Math.sin(t);
    const p = plane === "xy" ? [cx + u, cy + v, cz] : plane === "xz" ? [cx + u, cy, cz + v] : [cx, cy + u, cz + v];
    const q = p.map(Math.round);
    cells.set(q.join(), q);
  }
  for (const [x, y, z] of cells.values()) put(g, res, opts, x, y, z, mat);
  return res;
}

/** An ochre_froglight flush in the paving at (x, z); y defaults to 1, the paving course. The block under it is never touched. */
export function uplight(g, x, z, { y = 1, overwrite = false } = {}) {
  const res = result();
  put(g, res, { overwrite }, x, y, z, "ochre_froglight", { axis: "y" }, true);
  return res;
}

/** A lamp post standing on the cell (x, y, z): two oak_fence posts (y, y+1) and a standing lantern on top (y+2). */
export function lamp_post(g, x, y, z, opts = {}) {
  const res = result();
  put(g, res, opts, x, y, z, "oak_fence");
  put(g, res, opts, x, y + 1, z, "oak_fence");
  put(g, res, opts, x, y + 2, z, "lantern", { hanging: "false" });
  return res;
}

/**
 * A roof vent with its base at (x, y, z): a pair of stone_stairs along x at y (their full-height back toward `facing`),
 * and an iron_bars grille on top of the pair at y+1.
 */
export function vent(g, x, y, z, { facing = "north", overwrite = false } = {}) {
  checkFace(facing);
  const res = result();
  for (const dx of [0, 1]) put(g, res, { overwrite }, x + dx, y, z, "stone_stairs", { facing, half: "bottom", shape: "straight" });
  put(g, res, { overwrite }, x, y + 1, z, "iron_bars", { north: "false", south: "false", east: "true", west: "false" });
  put(g, res, { overwrite }, x + 1, y + 1, z, "iron_bars", { north: "false", south: "false", east: "false", west: "true" });
  return res;
}
