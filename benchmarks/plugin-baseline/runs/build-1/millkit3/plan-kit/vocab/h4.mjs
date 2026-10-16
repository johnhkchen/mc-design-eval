// Vocabulary share h4: the ten helpers plan.md's VOCABULARY names for this share (pier_line, window, bracket, stair_run,
// stove, dresser, swing_seat, water_tank, pavilion_posts, quoin_corner). Every position and facing is an argument; nothing
// is hard-wired to a spot. Each helper writes only into air: a cell that already holds a block is refused and listed in
// `refused`, never overwritten (quoin_corner's replace option is the one exception). Each returns { cells, refused }.
import { B, DIRS, OPPOSITE, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const result = () => ({ cells: [], refused: [] });

// One block [name, state?] into air only, unless replace. Returns whether it was placed.
function put(g, out, x, y, z, pair, { replace = false } = {}) {
  if (!g.inBounds(x, y, z) || (!replace && !g.isAir(x, y, z))) { out.refused.push([x, y, z, pair[0]]); return false; }
  g.set(x, y, z, ...pair);
  out.cells.push([x, y, z]);
  return true;
}

// ---- pier_line: a foundation line along x or z: piers at the ends and every 3rd cell, skirting between -----------
// (x0,z0)-(x1,z1) is a straight line at height y. skirt: a fence, wall or block id, or an open trapdoor id
// (e.g. "birch_trapdoor" for a lattice), hinged on the side that `facing` names.
export function pier_line(g, x0, z0, x1, z1, block, skirt, { y = 1, facing = "north" } = {}) {
  if (x0 !== x1 && z0 !== z1) throw new Error(`pier_line: (${x0},${z0})-(${x1},${z1}) is not a straight line`);
  const out = result(), n = Math.abs(x1 - x0) + Math.abs(z1 - z0), sx = Math.sign(x1 - x0), sz = Math.sign(z1 - z0);
  const skirtPair = /_trapdoor$/.test(skirt) ? B.trapdoor(skirt.replace(/_trapdoor$/, ""), facing, "bottom", true) : [skirt];
  for (let i = 0; i <= n; i++) put(g, out, x0 + sx * i, y, z0 + sz * i, i % 3 === 0 || i === n ? [block] : skirtPair);
  return out;
}

// ---- window: a glass_pane w x h in the wall plane ---------------------------------------------------------------
// (x, y, z) = the window's lowest cell on the wall, faceOut = the outward side (north/south walls run along x, east/west
// along z). Panes connect to their neighbours in the window only. Sill: a top slab one cell outside, under the window,
// skipped where the cell is not air (a deck is there). Openings are the shell's, so no lintel is written here.
export function window(g, x, y, z, faceOut, w, h, { sill = "smooth_stone" } = {}) {
  const out = result(), [dx, , dz] = DIRS[faceOut], [ax, az] = dx === 0 ? [1, 0] : [0, 1];
  const [pos, neg] = dx === 0 ? ["east", "west"] : ["south", "north"];
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const state = { north: "false", south: "false", east: "false", west: "false", [pos]: i < w - 1 ? "true" : "false", [neg]: i > 0 ? "true" : "false" };
    put(g, out, x + ax * i, y + j, z + az * i, ["glass_pane", state]);
  }
  if (sill) for (let i = 0; i < w; i++) {
    const sx = x + ax * i + dx, sz = z + az * i + dz;
    if (g.inBounds(sx, y - 1, sz) && g.isAir(sx, y - 1, sz)) put(g, out, sx, y - 1, sz, B.slab(sill, "top"));
  }
  return out;
}

// ---- bracket: an upside-down wood stair under a beam (gingerbread / porch bracket) ----------------------------
// face = the way the lip points (out to the street); the stair's back is against the beam, on the wall side.
export function bracket(g, x, y, z, faceOut, wood) {
  const out = result();
  put(g, out, x, y, z, B.stairs(wood, face.opposite(faceOut), "top"));
  return out;
}

// ---- stair_run: a straight flight of wood stairs walked up toward `facing` (flight()'s convention: facing = the way
// you walk up). [x, y, z] = the first, lowest step; toY = the y of the top step (the upper floor's own layer). Width runs
// to the right of facing. An upside-down stair hangs under each step as a stringer. Writes into air only: no headroom is
// cut, so the caller keeps the floor above clear. Returns landing: the feet cell on the upper floor.
export function stair_run(g, [x, y, z], facing, toY, material, width = 1) {
  const out = result(), n = toY - y + 1, [dX, , dZ] = DIRS[facing], [rX, , rZ] = DIRS[face.cw(facing)];
  if (n < 1) throw new Error(`stair_run: top step ${toY} is below the first step ${y}`);
  for (let i = 0; i < n; i++) for (let w = 0; w < width; w++) {
    const sx = x + dX * i + rX * w, sy = y + i, sz = z + dZ * i + rZ * w;
    put(g, out, sx, sy, sz, B.stairs(material, facing, "bottom"));
    if (i > 0) put(g, out, sx, sy - 1, sz, B.stairs(material, OPPOSITE[facing], "top"));
  }
  return { ...out, landing: [x + dX * n, toY + 1, z + dZ * n] };
}

// ---- stove: a lit furnace (or smoker) at (x, y, z), its front facing the room; a closed iron trapdoor lies on top ----
// as the flue plate. Stands against the hearth wall; the cells in front of it are never written (the 2-high lane).
export function stove(g, x, y, z, facing, { kind = "furnace" } = {}) {
  const out = result();
  put(g, out, x, y, z, [kind, { facing, lit: "true" }]);
  put(g, out, x, y + 1, z, B.trapdoor("iron", facing, "bottom", false));
  return out;
}

// ---- dresser: a barrel and a chest side by side (the chest to the right of facing), a flower pot on the barrel --------
export function dresser(g, x, y, z, facing) {
  const out = result(), [rX, , rZ] = DIRS[face.cw(facing)];
  put(g, out, x, y, z, ["barrel", { facing, open: "false" }]);
  put(g, out, x + rX, y, z + rZ, ["chest", { facing }]);
  put(g, out, x, y + 1, z, ["flower_pot"]);
  return out;
}

// ---- swing_seat: a spruce slab seat (top half) from x0 to x1 at (y, z), hung by an iron chain at each end up to the beam ---
// beamY = the beam's y (default y+3, so the chains take y+1..y+2). The beam itself is the caller's.
export function swing_seat(g, x0, x1, y, z, { beamY = y + 3 } = {}) {
  const out = result(), a = Math.min(x0, x1), b = Math.max(x0, x1);
  for (let x = a; x <= b; x++) put(g, out, x, y, z, B.slab("spruce", "top"));
  for (const x of [a, b]) for (let cy = y + 1; cy < beamY; cy++) put(g, out, x, cy, z, B.chain("y"));
  return out;
}

// ---- water_tank: a 4 x 4 tank on four stripped spruce legs, with its footprint at x0..x0+3, z0..z0+3 ----------------
// legs y..y+3, platform y+4, staves y+5..y+7 (a stripped spruce hoop at y+6), water in the 2 x 2 core at y+5..y+6,
// spruce slab lid at y+8. y defaults to 1 (the plot's stand level), so the lid is at y9 as plan.md's ROOMS has it.
export function water_tank(g, x0, z0, { y = 1 } = {}) {
  const out = result(), x1 = x0 + 3, z1 = z0 + 3;
  for (const x of [x0, x1]) for (const z of [z0, z1]) for (let cy = y; cy < y + 4; cy++) put(g, out, x, cy, z, B.log("stripped_spruce"));
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    put(g, out, x, y + 4, z, ["spruce_planks"]);
    put(g, out, x, y + 8, z, B.slab("spruce", "bottom"));
    if (x !== x0 && x !== x1 && z !== z0 && z !== z1) {
      put(g, out, x, y + 5, z, ["water"]);
      put(g, out, x, y + 6, z, ["water"]);
      continue;
    }
    for (let cy = y + 5; cy <= y + 7; cy++) put(g, out, x, cy, z, cy === y + 6 ? B.wood("stripped_spruce") : ["spruce_planks"]);
  }
  return out;
}

// ---- pavilion_posts: the posts and plates of a picnic pavilion over x0..x1 x z0..z1 ------------------------------------
// Posts at both long sides (the ends and the middle), standing y..top-1; plates lie at y = top, axis x on the z edges and
// axis z on the x edges. The roof and the tables are the caller's.
export function pavilion_posts(g, x0, x1, z0, z1, { y = 1, top = 4, wood = "stripped_oak" } = {}) {
  const out = result(), zs = [...new Set([z0, Math.round((z0 + z1) / 2), z1])];
  for (let x = x0; x <= x1; x++) for (const z of [z0, z1]) put(g, out, x, top, z, B.log(wood, "x"));
  for (let z = z0 + 1; z < z1; z++) for (const x of [x0, x1]) put(g, out, x, top, z, B.log(wood, "z"));
  for (const x of [x0, x1]) for (const z of zs) for (let cy = y; cy < top; cy++) put(g, out, x, cy, z, B.log(wood, "y"));
  return out;
}

// ---- quoin_corner: a corner column of alternating quoins (stripped log, axis y) and field blocks, y0..y1 -----------
// Quoins sit at y0, y0+2, ...; a null field leaves the in-between cells unwritten. replace: lay the column over a wall
// that is already built (the default writes into air only).
export function quoin_corner(g, x, z, { y0, y1, field = null, quoin = "stripped_birch", replace = false } = {}) {
  const out = result();
  for (let y = y0; y <= y1; y++) {
    if ((y - y0) % 2 === 0) put(g, out, x, y, z, B.log(quoin, "y"), { replace });
    else if (field) put(g, out, x, y, z, [field], { replace });
  }
  return out;
}
