// Trim, shopfront and street helpers from plan.md VOCABULARY: quoins, pilaster, fascia, shopfront, oriel, flight,
// yardWall, streetSurface. Each takes the grid and its position as arguments and writes only its own cells: into air,
// or over a block named by `replace` (the wall a trim sits on). Returns { placed, refused }; a refused write is counted, not thrown.
import { B, DIRS, OPPOSITE, plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const id = (b) => (b.includes(":") ? b : `minecraft:${b}`);
const AIR = /(^|:)(cave_|void_)?air$/;
const matches = (r, cur) => (typeof r === "function" ? r(cur) : [r].flat().some((b) => id(b) === cur));
const zStep = (facing) => {
  if (facing !== "north" && facing !== "south") throw new Error(`facing must be north or south for a street wall (got ${facing})`);
  return DIRS[facing][2];
};

// A writer for one helper call: each cell goes into air, over the same block, or over a `replace` block only.
function writer(g, replace = null) {
  const t = { placed: 0, refused: 0 };
  const at = (p, block, state, nbt) => {
    const [x, y, z] = p;
    const cur = g.inBounds(x, y, z) ? g.blockAt(x, y, z) : null;
    if (!cur || !(AIR.test(cur) || cur === id(block) || (replace && matches(replace, cur)))) { t.refused++; return; }
    const before = g.refused?.length ?? 0;
    g.set(x, y, z, block, state, nbt);
    if ((g.refused?.length ?? 0) > before) t.refused++;
    else t.placed++;
  };
  return { at, t };
}

// Fill the inclusive box a..b with one block (state optional).
const fill = (W, a, b, block, state) => {
  for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
    for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
      for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) W.at([x, y, z], block, state);
};

// Quoins: a 2-high pair of cut_sandstone per band at each corner z of the column x (flush, over the brick wall).
export function quoins(g, x, zFaces, { replace = "bricks", yBands = [13, 17, 21] } = {}) {
  const W = writer(g, replace);
  for (const z of zFaces) for (const y0 of yBands) fill(W, [x, y0, z], [x, y0 + 1, z], "cut_sandstone");
  return W.t;
}

// Pilaster: smooth_sandstone shaft y 7..12 on a polished_andesite plinth at y 6, flush at z and proud one block toward the street.
export function pilaster(g, x, z, { facing = "south", replace = "bricks" } = {}) {
  const W = writer(g, replace), zOut = z + zStep(facing);
  for (const zz of [z, zOut]) {
    fill(W, [x, 6, zz], [x, 6, zz], "polished_andesite");
    fill(W, [x, 7, zz], [x, 12, zz], "smooth_sandstone");
  }
  return W.t;
}

// Fascia: dark_prismarine board flush on the wall plane z over x0..x1, y0..y0+2, with the shop name as banner letters.
export function fascia(g, x0, x1, z, name, { facing = "south", y0 = 10 } = {}) {
  const W = writer(g, null);
  fill(W, [x0, y0, z], [x1, y0 + 2, z], "dark_prismarine");
  const r = plaque(g, name, { at: [x0, y0, z], face: facing, width: x1 - x0 + 1, height: 3, material: null });
  W.t.placed += r.cells;
  W.t.refused += r.skipped;
  return W.t;
}

// Shopfront for one shop unit x0..x1: trim consoles at both ends (shared with the next unit), their heads proud at y 11..12,
// and the fascia between them. Leaves the open front (y 7..9, z 19..20) untouched.
export function shopfront(g, x0, x1, z, name, { facing = "south", replace = "bricks" } = {}) {
  const W = writer(g, replace), zOut = z + zStep(facing);
  for (const x of [x0, x1]) {
    fill(W, [x, 10, z], [x, 12, z], "smooth_sandstone");
    W.at([x, 11, zOut], ...B.stairs("smooth_sandstone", OPPOSITE[facing], "top"));
    W.at([x, 12, zOut], ...B.slab("smooth_sandstone", "top"));
  }
  const F = fascia(g, x0 + 1, x1 - 1, z, name, { facing });
  W.t.placed += F.placed;
  W.t.refused += F.refused;
  return W.t;
}

// Oriel bay x0..x1 standing one proud of the wall plane z: corner posts, apron (y0), panel (y0+4), head (y0+8), glass
// rows at y0+1..3 and y0+5..7, slab cap at y0+9. The wall behind is left to the shell.
export function oriel(g, x0, x1, z, { facing = "south", y0 = 14 } = {}) {
  const W = writer(g, null), zp = z + zStep(facing);
  for (const x of [x0, x1]) fill(W, [x, y0, zp], [x, y0 + 8, zp], "smooth_sandstone");
  for (const y of [y0, y0 + 4, y0 + 8]) fill(W, [x0, y, zp], [x1, y, zp], "smooth_sandstone");
  for (const [a, b] of [[y0 + 1, y0 + 3], [y0 + 5, y0 + 7]]) fill(W, [x0 + 1, a, zp], [x1 - 1, b, zp], "glass_pane");
  fill(W, [x0, y0 + 9, zp], [x1, y0 + 9, zp], ...B.slab("smooth_sandstone", "top"));
  return W.t;
}

// Stair flight: one oak_stairs per step from (x, y0, z0), rising in `dir`, `width` wide across the run (+x for north/south,
// +z for east/west). Two clear cells above each step are checked, not carved (lanesBlocked counts any that are not air).
// rail "+" or "-" puts a dark_oak_fence on that open side at each step's top.
export function flight(g, x, y0, y1, z0, dir = "north", { width = 2, rail = null } = {}) {
  const W = writer(g, null), [dx, , dz] = DIRS[dir];
  const across = dir === "north" || dir === "south" ? [1, 0, 0] : [0, 0, 1];
  let lanesBlocked = 0;
  for (let i = 0; i <= y1 - y0; i++) {
    const y = y0 + i, bx = x + i * dx, bz = z0 + i * dz;
    for (let w = 0; w < width; w++) {
      const px = bx + w * across[0], pz = bz + w * across[2];
      W.at([px, y, pz], ...B.stairs("oak", dir, "bottom"));
      for (let k = 1; k <= 2; k++) if (!AIR.test(g.blockAt(px, y + k, pz))) lanesBlocked++;
    }
    if (rail) {
      const side = rail === "+" ? width : -1;
      W.at([bx + side * across[0], y + 1, bz + side * across[2]], "dark_oak_fence", {});
    }
  }
  return { ...W.t, lanesBlocked };
}

// Yard wall along x0,z0..x1,z1 (one line, axis-aligned): bricks at yBase..yBase+1, brick_slab coping on top.
// A gate column at each [x, z] in `gates` is a dark_oak_fence_gate at yBase with the wall left open above it.
export function yardWall(g, x0, z0, x1, z1, { gates = [], yBase = 7, replace = null } = {}) {
  const W = writer(g, replace), gateAt = new Set(gates.map(([x, z]) => `${x},${z}`));
  const facing = z0 === z1 ? "north" : "east";              // a closed gate lies across the run
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
      if (gateAt.has(`${x},${z}`)) { W.at([x, yBase, z], "dark_oak_fence_gate", { facing, in_wall: "false", open: "false", powered: "false" }); continue; }
      W.at([x, yBase, z], "bricks");
      W.at([x, yBase + 1, z], "bricks");
      W.at([x, yBase + 2, z], ...B.slab("brick", "top"));
    }
  return W.t;
}

// Street surface: andesite carriageway at roadY over road [z0, z1] (replacing ground), polished_andesite kerb at walkY on
// z = kerb, smooth_stone pavement at walkY over pavement [z0, z1]. Writes only the surface layers, never the ground under them.
export function streetSurface(g, x0, x1, { pavement, kerb, road, roadY = 5, walkY = 6, replace = ["dirt", "grass_block"] }) {
  const W = writer(g, replace);
  fill(W, [x0, roadY, road[0]], [x1, roadY, road[1]], "andesite");
  fill(W, [x0, walkY, kerb], [x1, walkY, kerb], "polished_andesite");
  fill(W, [x0, walkY, pavement[0]], [x1, walkY, pavement[1]], "smooth_stone");
  return W.t;
}
