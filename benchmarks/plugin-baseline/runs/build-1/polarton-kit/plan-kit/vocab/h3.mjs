// Polarton kit vocabulary, part h3 (plan.md VOCABULARY): slabRamp, hayDoor, doorPair, porchDeep, spireCap,
// picketYard, baleStack, chimney, yardBench. Every helper takes its position (and facing where it has one) and
// writes only its own footprint. Writes go into air; a cell that is not air is refused and returned in `refused`.
// The two openings (hayDoor, doorPair) cut their own hole in the shell wall, because plan.md's OPENINGS are the
// shell's holes and the frame, leaves, lintel and transom are written into them; they say so in their comments.
import { DIRS, OPPOSITE, chimney as buildChimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

/** Puts one block at a time, into air only unless `over` (the helper's own opening). */
function writer(g) {
  const placed = [], refused = [];
  const put = (x, y, z, block, state, over = false) => {
    if (!g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) { refused.push([x, y, z, block]); return false; }
    g.set(x, y, z, block, state);
    placed.push([x, y, z, block]);
    return true;
  };
  return { put, result: () => ({ placed, refused }) };
}

/** A wall frame anchored at (x, y, z): at(u, dy, out) is a cell, u runs along the wall, out runs away from the house
 *  toward facing. at.axis is the wall's axis ("x" or "z"). */
function frame(x, y, z, facing) {
  const [ox, , oz] = DIRS[facing];
  const ux = oz !== 0 ? 1 : 0, uz = ox !== 0 ? 1 : 0;
  const at = (u, dy, out = 0) => [x + ux * u + ox * out, y + dy, z + uz * u + oz * out];
  at.axis = ux ? "x" : "z";
  return at;
}

/** Fence arms toward each neighbour that is also in `set` (world "x,y,z" keys), so rails meet their posts. */
const fenceState = (set, x, y, z) => ({
  north: String(set.has(`${x},${y},${z - 1}`)), east: String(set.has(`${x + 1},${y},${z}`)),
  south: String(set.has(`${x},${y},${z + 1}`)), west: String(set.has(`${x - 1},${y},${z}`)),
});

/** Bottom slabs on the ramp row (z) at the floor's y, then a 2-long full-block landing (z+1..z+2) level with the floor.
 *  Only floorY 0 (grade, level gravel: no ramp) and 1 (raised floor) are in plan.md; anything else throws. */
export function slabRamp(g, x, z, width, floorY, { block = "cobblestone" } = {}) {
  const w = writer(g);
  if (floorY === 0) return { ...w.result(), note: "grade floor: level gravel, no ramp" };
  if (floorY !== 1) throw new RangeError(`slabRamp: floorY ${floorY} is not in plan.md (raised floors are y 1, grade y 0)`);
  if (width < 2) throw new RangeError("slabRamp: width must be 2 or more");
  for (let i = 0; i < width; i++) {
    w.put(x + i, floorY, z, `${block}_slab`, { type: "bottom", waterlogged: "false" });
    w.put(x + i, floorY, z + 1, block, {});
    w.put(x + i, floorY, z + 2, block, {});
  }
  return w.result();
}

/** Hay door: a 2-wide, 2-high opening at (x, y, z) in the wall plane (cut clear), with an open spruce trapdoor leaf
 *  folded flat on each side of it (u = -1 and u = 2), both halves of each leaf. */
export function hayDoor(g, x, y, z, facing = "north") {
  const w = writer(g), at = frame(x, y, z, facing);
  for (let dy = 0; dy < 2; dy++) {
    for (const u of [0, 1]) w.put(...at(u, dy), "minecraft:air", {}, true);
    for (const u of [-1, 2]) w.put(...at(u, dy), "spruce_trapdoor", { facing, half: "bottom", open: "true", powered: "false", waterlogged: "false" }, true);
  }
  return w.result();
}

/** Double door: two 1-wide doors side by side from (x, y, z), lower and upper halves each, hinges left and right, and
 *  a glass_pane transom over both at y + 2. The doors cut their own opening in the wall (the shell leaves it open). */
export function doorPair(g, x, y, z, facing = "north", block = "mangrove_door") {
  const w = writer(g), at = frame(x, y, z, facing);
  const [plus, minus] = at.axis === "x" ? ["east", "west"] : ["south", "north"];
  for (const u of [0, 1]) for (let dy = 0; dy < 2; dy++)
    w.put(...at(u, dy), block, { facing, half: dy ? "upper" : "lower", hinge: u ? "right" : "left", open: "false" }, true);
  for (const u of [0, 1]) {
    const pane = { north: "false", east: "false", south: "false", west: "false", [u ? minus : plus]: "true" };
    w.put(...at(u, 2), "glass_pane", pane, true);
  }
  return w.result();
}

/** Deep porch in front of a house. (x, y, z) is the deck corner at the house wall (out 0); the porch runs width cells along
 *  the wall and depth cells out toward facing. Deck of mangrove planks at y; spruce fence rail along the front edge at
 *  y + 1 with four posts up to the beam at y + 4; upside-down stair brackets under the beam at the two end bays; a
 *  mangrove beam along the front; a shed roof of stairs on the front edge, slabs behind. */
export function porchDeep(g, x, y, z, facing = "north", { width = 8, depth = 3 } = {}) {
  const w = writer(g), at = frame(x, y, z, facing), inward = OPPOSITE[facing], front = depth - 1;
  const postU = [0, Math.round((width - 1) / 3), Math.round((2 * (width - 1)) / 3), width - 1];
  for (let u = 0; u < width; u++) for (let out = 0; out < depth; out++) w.put(...at(u, 0, out), "mangrove_planks", {});
  const fence = new Set();
  for (let u = 0; u < width; u++) fence.add(at(u, 1, front).join());
  for (const u of postU) for (const dy of [2, 3]) fence.add(at(u, dy, front).join());
  for (const key of fence) {
    const [fx, fy, fz] = key.split(",").map(Number);
    w.put(fx, fy, fz, "spruce_fence", fenceState(fence, fx, fy, fz));
  }
  for (const u of [1, width - 2]) w.put(...at(u, 3, front), "mangrove_stairs", { facing: inward, half: "top", shape: "straight", waterlogged: "false" });
  for (let u = 0; u < width; u++) {
    w.put(...at(u, 4, front), "mangrove_planks", {});
    w.put(...at(u, 5, front), "mangrove_stairs", { facing: inward, half: "bottom", shape: "straight", waterlogged: "false" });
    for (let out = 0; out < front; out++) w.put(...at(u, 5, out), "mangrove_slab", { type: "bottom", waterlogged: "false" });
  }
  return w.result();
}

/** Stepped spire of deepslate tiles: each row is `size` square minus one cell per side per row above the one below
 *  (rows at y, y+1, ...), stopping where the tower runs out of width (noted). A lightning rod on the last row, and a
 *  spruce-fence cross (two posts and an arm) above it. (x, y, z) is the tower's top footprint corner. */
export function spireCap(g, x, y, z, { size = 4, rows = 6 } = {}) {
  const w = writer(g), notes = [];
  let k = 0;
  for (; k < rows; k++) {
    const x0 = x + k, x1 = x + size - 1 - k, z0 = z + k, z1 = z + size - 1 - k;
    if (x0 > x1 || z0 > z1) break;
    for (let xx = x0; xx <= x1; xx++) for (let zz = z0; zz <= z1; zz++) w.put(xx, y + k, zz, "deepslate_tiles", {});
  }
  if (k < rows) notes.push(`spire: a ${size}-wide tower tapers out after ${k} row(s), not ${rows} (one cell in per row)`);
  const cx = x + Math.floor((size - 1) / 2), cz = z + Math.floor((size - 1) / 2), top = y + k;
  w.put(cx, top, cz, "lightning_rod", { facing: "up", powered: "false" });
  const cross = new Set([`${cx},${top + 1},${cz}`, `${cx},${top + 2},${cz}`, `${cx - 1},${top + 2},${cz}`, `${cx + 1},${top + 2},${cz}`]);
  for (const key of cross) {
    const [fx, fy, fz] = key.split(",").map(Number);
    w.put(fx, fy, fz, "spruce_fence", fenceState(cross, fx, fy, fz));
  }
  return { ...w.result(), notes };
}

/** Picket fence round a yard box [x0, y0, z0, x1, y1, z1]: pale oak fence on the box's edge cells, y0..y1, arms
 *  connected to the neighbouring pickets. The inside of the box is left as it is (no gate: the caller places it). */
export function picketYard(g, box) {
  const w = writer(g), [x0, y0, z0, x1, y1, z1] = box, ring = new Set();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
    for (let y = y0; y <= y1; y++) ring.add(`${x},${y},${z}`);
  }
  for (const key of ring) {
    const [x, y, z] = key.split(",").map(Number);
    w.put(x, y, z, "pale_oak_fence", fenceState(ring, x, y, z));
  }
  return w.result();
}

/** Hay bale stack: a 3 x 3 footprint from (x, y, z) at y, `height` layers up (hay_block, axis y). */
export function baleStack(g, x, y, z, { height = 1 } = {}) {
  const w = writer(g);
  for (let dy = 0; dy < height; dy++) for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++)
    w.put(x + dx, y + dy, z + dz, "hay_block", { axis: "y" });
  return w.result();
}

/** Exterior chimney set into the wall (plan.md RESERVED), through the library's chimney(). The library's writes are
 *  dry-run first: if any cell is not air (other than the mouth and the lintel above it, which cut the wall) nothing is
 *  built and the cells come back refused. The course just under `top` takes the band block (plan.md's deepslate band). */
export function chimney(g, { wall, into, top, material = "bricks", band = "deepslate_bricks", ...rest }) {
  // the opening: the wall cell the flue opens through and the one above it (the lintel), both in the wall's column
  const inMouth = (x, y, z) => !!wall && x === wall[0] && z === wall[2] && y >= wall[1] && y <= wall[1] + 1;
  const probe = [];
  const dry = new Proxy(g, {
    get(t, p) {
      if (p === "set") return (x, y, z, b) => { probe.push([x, y, z, b]); return t; };
      const v = Reflect.get(t, p);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
  buildChimney(dry, { wall, into, top, material, ...rest });
  const refused = probe.filter(([x, y, z]) => !(g.inBounds(x, y, z) && g.isAir(x, y, z)) && !inMouth(x, y, z));
  if (refused.length) return { placed: [], refused };
  buildChimney(g, { wall, into, top, material, ...rest });
  for (const [x, y, z, b] of probe) if (y === top - 1 && b === material) g.set(x, y, z, band, {});
  return { placed: probe, refused: [] };
}

/** Yard bench: two spruce stairs side by side from (x, y, z) along the wall, facing `facing` (plan: south). */
export function yardBench(g, x, y, z, facing = "south") {
  const w = writer(g), at = frame(x, y, z, facing);
  for (const u of [0, 1]) w.put(...at(u, 0), "spruce_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
  return w.result();
}
