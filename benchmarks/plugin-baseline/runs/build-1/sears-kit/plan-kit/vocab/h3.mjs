// Sears Modern Homes row: vocabulary helpers, set 3 (plan.md VOCABULARY).
// Every helper takes its position (and facing) as arguments and returns { box, placed, refused }: box is the footprint
// it may write inside, placed counts the cells it wrote. Writes go into air only, and a helper is all or nothing: if any
// cell of its footprint is taken, nothing is written and refused counts the taken cells. Nothing is written outside the
// box. The one exception to "never at y0" is accessRamp's walk, which the plan names as its own ground.
import { B, DIRS, face, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const DOOR_WOODS = ["oak", "spruce", "dark_oak"];
const STAIR_WOODS = ["oak", "spruce", "dark_oak"];

const free = (g, x, y, z) => g.inBounds(x, y, z) && g.isAir(x, y, z);
const solid = (g, x, y, z) => g.inBounds(x, y, z) && !g.isAir(x, y, z);
const dirOf = (f) => {
  if (!DIRS[f]) throw new Error(`h3: facing must be north, south, east or west, got ${f}`);
  return DIRS[f];
};

/** plan: [x, y, z, block, state] entries, all written or none. clear: cells that must be air but stay empty (lanes). */
function commit(g, plan, clear = []) {
  const seen = new Set();
  for (const [x, y, z] of plan) {
    if (seen.has(`${x},${y},${z}`)) throw new Error(`h3: footprint repeats ${x},${y},${z}`);
    seen.add(`${x},${y},${z}`);
  }
  const cells = plan.map(([x, y, z]) => [x, y, z]);
  const refused = [...cells, ...clear].filter(([x, y, z]) => !free(g, x, y, z)).length;
  const all = [...cells, ...clear];
  const box = [
    Math.min(...all.map((c) => c[0])), Math.min(...all.map((c) => c[1])), Math.min(...all.map((c) => c[2])),
    Math.max(...all.map((c) => c[0])), Math.max(...all.map((c) => c[1])), Math.max(...all.map((c) => c[2])),
  ];
  if (refused) return { box, placed: 0, refused };
  for (const [x, y, z, block, state] of plan) g.set(x, y, z, block, state);
  return { box, placed: plan.length, refused: 0 };
}

/** Accessible way in: a smooth_stone walk at y, two bottom smooth_stone_slabs at y+1 (the ramp), then a full deck
 *  block at y+1 (at least 2 x 2). Walk z0..deckZ0-3, ramp deckZ0-2..deckZ0-1, deck deckZ0..deckZ1, across x..x+w-1.
 *  deck: the plot's deck block id. Never stairs. Writes no ground under the ramp or the deck: the ground part owns that. */
export function accessRamp(g, { x, w, z0, deckZ0, deckZ1, deck, y = 0 }) {
  if (!deck) throw new Error("accessRamp: deck material required");
  if (w < 2 || deckZ1 - deckZ0 < 1) throw new Error("accessRamp: the deck must be at least 2 x 2");
  if (deckZ0 - 3 < z0) throw new Error("accessRamp: the walk needs at least one cell before the ramp");
  const plan = [];
  for (let dx = 0; dx < w; dx++) {
    for (let z = z0; z <= deckZ0 - 3; z++) plan.push([x + dx, y, z, "smooth_stone", {}]);
    for (let z = deckZ0 - 2; z <= deckZ0 - 1; z++) plan.push([x + dx, y + 1, z, ...B.slab("smooth_stone", "bottom")]);
    for (let z = deckZ0; z <= deckZ1; z++) plan.push([x + dx, y + 1, z, deck, {}]);
  }
  return commit(g, plan);
}

/** A door, two high, its lower half at [x, y, z]. face: the way it faces out of the house. hinge: left or right.
 *  double: a second leaf beside it (+x on a north or south wall, +z on east or west) hinged the other way. The
 *  threshold is the floor the caller already laid. */
export function doorSet(g, { x, y, z, face: facing, wood, hinge = "left", double = false }) {
  if (!DOOR_WOODS.includes(wood)) throw new Error(`doorSet: wood must be one of ${DOOR_WOODS.join(", ")}`);
  dirOf(facing);
  const [sx, sz] = facing === "north" || facing === "south" ? [1, 0] : [0, 1];
  const leaves = [[x, z, hinge]];
  if (double) leaves.push([x + sx, z + sz, hinge === "left" ? "right" : "left"]);
  const plan = [];
  for (const [lx, lz, hg] of leaves) {
    for (const half of ["lower", "upper"]) {
      const [block, state] = B.door(wood, facing, half, hg);
      plan.push([lx, y + (half === "upper" ? 1 : 0), lz, block, state]);
    }
  }
  return commit(g, plan);
}

/** Balcony: a floor block layer at y over x0..x1 by z0..z1, an iron_bars rail at y+1 along the front (z0) and both
 *  sides. The rail bars connect to the rail cells beside them. The back edge (z1) meets the house wall, so the French
 *  door behind it is doorSet's job. */
export function balcony(g, { x0, x1, z0, z1, y, floor = "smooth_quartz", rail = "iron_bars" }) {
  const railAt = [];
  for (let x = x0; x <= x1; x++) railAt.push([x, z0]);
  for (let z = z0 + 1; z <= z1; z++) railAt.push([x0, z], [x1, z]);
  const onRail = new Set(railAt.map(([x, z]) => `${x},${z}`));
  const plan = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) plan.push([x, y, z, floor, {}]);
  for (const [x, z] of railAt) {
    const joins = (dx, dz) => (onRail.has(`${x + dx},${z + dz}`) ? "true" : "false");
    plan.push([x, y + 1, z, rail, { east: joins(1, 0), west: joins(-1, 0), north: joins(0, -1), south: joins(0, 1) }]);
  }
  return commit(g, plan);
}

/** A knee brace: one upside-down stair under a rake or eave at [x, y, z]. dir: the way its lip projects, away from the
 *  wall (its back is set into the wall, the stair's facing). One per two cells along the rake. */
export function kneeBrace(g, { x, y, z, dir, wood = "spruce" }) {
  dirOf(dir);
  if (!STAIR_WOODS.includes(wood)) throw new Error(`kneeBrace: wood must be one of ${STAIR_WOODS.join(", ")}`);
  return commit(g, [[x, y, z, ...B.stairs(wood, face.opposite(dir), "top")]]);
}

/** Hipped dormer on a front: x0..x1 wide and three deep (zFront..zFront+2). Walls at y0 and y0+1: trim corner boards at
 *  the front, body for the cheeks and back. The front centre is the window opening and stays air for the window part.
 *  The hip runs from y0+2 to y1 in stairs (roofStairs) that step in one cell a row, with full roof blocks inside and on the
 *  last row, which closes it flat. body, roof and roofStairs are block ids; roof is the full block. */
export function dormerHip(g, { x0, x1, zFront, y0, y1, trim, body, roof, roofStairs }) {
  for (const [name, v] of Object.entries({ trim, body, roof, roofStairs })) if (!v) throw new Error(`dormerHip: ${name} required`);
  const zBack = zFront + 2, plan = [];
  for (let y = y0; y <= y0 + 1; y++) {
    for (let x = x0; x <= x1; x++) {
      for (let z = zFront; z <= zBack; z++) {
        const edge = x === x0 || x === x1;
        if (z === zFront) {
          if (edge) plan.push([x, y, z, trim, {}]);
        } else if (edge || z === zBack) {
          plan.push([x, y, z, body, {}]);
        }
      }
    }
  }
  for (let y = y0 + 2, j = 0; y <= y1; y++, j++) {
    const xa = x0 + j, xb = x1 - j, za = zFront + j, zb = zBack - j;
    if (xa > xb || za > zb) break;
    const plateau = y === y1 || xa + 1 > xb - 1 || za + 1 > zb - 1;
    for (let x = xa; x <= xb; x++) {
      for (let z = za; z <= zb; z++) {
        const ring = x === xa || x === xb || z === za || z === zb;
        if (plateau || !ring) {
          plan.push([x, y, z, roof, {}]);
        } else {
          const facing = x === xa ? "east" : x === xb ? "west" : z === za ? "south" : "north";
          plan.push([x, y, z, roofStairs, { facing, half: "bottom", shape: "straight", waterlogged: "false" }]);
        }
      }
    }
  }
  return commit(g, plan);
}

/** A gabled door hood three cells wide (x0..x0+2) at [z, y]: stairs sloping in to a full centre block at y, a slab cap
 *  at y+1. Projects out of the wall at z, so the door behind it is doorSet's. */
export function doorHood(g, { x0, x1, z, y, trim = "smooth_quartz" }) {
  if (x1 - x0 !== 2) throw new Error("doorHood: the gabled hood is three cells wide (x1 = x0 + 2)");
  return commit(g, [
    [x0, y, z, ...B.stairs(trim, "east", "bottom")],
    [x0 + 1, y, z, trim, {}],
    [x1, y, z, ...B.stairs(trim, "west", "bottom")],
    [x0 + 1, y + 1, z, ...B.slab(trim, "bottom")],
  ]);
}

/** A bed: the foot at [x, y, z], the head one step toward facing, both halves via bed(). The cell past the head must be
 *  solid (a window or open doorway refuses it), the two cells above both halves must be clear, and the two cells past
 *  the foot (y and y+1) stay clear as a lane. colour: a dye name (red, white, blue, green...). */
export function bedSet(g, [x, y, z], facing, colour = "red") {
  const [dx, , dz] = dirOf(facing);
  const hx = x + dx, hz = z + dz, wall = [hx + dx, y, hz + dz];
  const cells = [[x, y, z], [hx, y, hz]];
  const clear = [[x, y + 1, z], [x, y + 2, z], [hx, y + 1, hz], [hx, y + 2, hz], [x - dx, y, z - dz], [x - dx, y + 1, z - dz]];
  const box = [Math.min(x, hx), y, Math.min(z, hz), Math.max(x, hx), y + 2, Math.max(z, hz)];
  const refused = [...cells, ...clear].filter(([a, b, c]) => !free(g, a, b, c)).length + (solid(g, ...wall) ? 0 : 1);
  if (refused) return { box, placed: 0, refused };
  // bed() tests for air with a regex that misses a stored minecraft:air cell (a carved one), so it sees the grid
  // through a view that reports air as absent
  const view = { get: (a, b, c) => (g.isAir(a, b, c) ? undefined : g.get(a, b, c)), set: (...args) => g.set(...args) };
  if (!bed(view, [x, y, z], facing, colour)) return { box, placed: 0, refused: cells.length };
  return { box, placed: 2, refused: 0 };
}

/** A dresser: `length` barrels (1 to 3, lids up) in a row along the wall at [x, y, z], their fronts toward facing. The
 *  two cells in front of the row (y and y+1) stay clear as a lane. */
export function dresser(g, { x, y, z, facing, length = 2 }) {
  const [dx, , dz] = dirOf(facing);
  if (length < 1 || length > 3) throw new Error("dresser: length must be 1 to 3");
  const [rx, rz] = dx === 0 ? [1, 0] : [0, 1];
  const plan = [], clear = [];
  for (let i = 0; i < length; i++) {
    const bx = x + rx * i, bz = z + rz * i;
    plan.push([bx, y, bz, "barrel", { facing: "up", open: "false" }]);
    clear.push([bx + dx, y, bz + dz], [bx + dx, y + 1, bz + dz]);
  }
  return commit(g, plan, clear);
}
