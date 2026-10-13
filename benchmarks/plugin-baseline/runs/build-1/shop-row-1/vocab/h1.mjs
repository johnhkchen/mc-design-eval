// Part h1 vocabulary for the Victorian shop row (plan.md VOCABULARY): brickWall, cornice, console, hangingSign,
// sashWindow, streetDoor, chimney, lampPost. Every helper takes its position as arguments; z is the wall face the
// piece sits on (19 = street front, 2 = rear), out = +1 toward the street (south), -1 toward the yard (north).
// Each returns { placed, skipped }: skipped lists the cells it did not write, so a caller sees what was refused.
// Writes go into AIR only. A cell marked "wall" (trim, openings, glazing set into the wall plane) may also take
// the wall's bricks, and only when the caller passes { into: "wall" }. Cells in g.protected (guard / runParts
// reservations) are never written. Nothing here is furniture, so no room clearance applies; lampPost stands outdoors.
import { B, signboard } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = /(^|:)(cave_)?air$/;
const BRICK = /(^|:)bricks$/;
const STAIR_FACING = (out) => (out > 0 ? "north" : "south");   // a stair's back faces into the wall
const STREET_FACE = (out) => (out > 0 ? "south" : "north");    // the side a door or sign looks out of
const PANE_EW = { north: "false", east: "true", south: "false", west: "true" };   // a pane running along x in a z wall

const range = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

// cells: [x, y, z, [block, state, nbt], mode = "air" | "wall"]. Air cells are written only into air; "wall" cells
// may also replace bricks when into === "wall".
function place(g, into, cells) {
  const out = { placed: 0, skipped: [] };
  for (const [x, y, z, [block, state, nbt], mode = "air"] of cells) {
    const cur = g.inBounds(x, y, z) ? g.blockAt(x, y, z) : null;
    const open = cur !== null && !g.protected?.has(`${x},${y},${z}`) && (AIR.test(cur) || (into === "wall" && mode === "wall" && BRICK.test(cur)));
    if (!open) { out.skipped.push([x, y, z]); continue; }
    g.set(x, y, z, block, state, nbt);
    out.placed++;
  }
  return out;
}

/** A brick wall over the box [x0,y0,z0,x1,y1,z1] (inclusive): bricks, with the course at y 6 polished_andesite. */
export function brickWall(g, [x0, y0, z0, x1, y1, z1], { into = "air" } = {}) {
  const cells = [];
  for (const x of range(x0, x1)) for (const y of range(y0, y1)) for (const z of range(z0, z1))
    cells.push([x, y, z, y === 6 ? B.block("polished_andesite") : B.block("bricks")]);
  return place(g, into, cells);
}

/** Cornice row at height y on wall face z, from x0 to x1: a flush smooth_sandstone band, and upside-down stairs out in front. */
export function cornice(g, y, z, x0, x1, { out = 1, into = "air" } = {}) {
  const cells = [];
  for (const x of range(x0, x1)) {
    cells.push([x, y, z, B.block("smooth_sandstone"), "wall"]);
    cells.push([x, y, z + out, B.stairs("smooth_sandstone", STAIR_FACING(out), "top")]);
  }
  return place(g, into, cells);
}

/** Shop console at x on wall face z: trim column y 10..12, with a head one out (upside-down stair over a slab). */
export function console(g, x, z, { out = 1, into = "air" } = {}) {
  const cells = [10, 11, 12].map((y) => [x, y, z, B.block("smooth_sandstone"), "wall"]);
  cells.push([x, 11, z + out, B.stairs("smooth_sandstone", STAIR_FACING(out), "top")]);
  cells.push([x, 12, z + out, B.slab("smooth_sandstone", "bottom")]);
  return place(g, into, cells);
}

/** Hanging shop sign at x: dark_oak_fence arm at y 11 (z+out and z+2*out), attached hanging sign at y 10 on the far end. */
export function hangingSign(g, x, z, name, { out = 1, into = "air" } = {}) {
  const [block, state, nbt] = B.sign("dark_oak", [name], { wall: false, hanging: true, rotation: out > 0 ? 0 : 8, dataVersion: g.dataVersion });
  const cells = [
    [x, 11, z + out, B.fence("dark_oak")],
    [x, 11, z + 2 * out, B.fence("dark_oak")],
    [x, 10, z + 2 * out, [block, { ...state, attached: "true" }, nbt]],
  ];
  return place(g, into, cells);
}

/** Sash window 1 wide x 3 tall at x, from y0 up, in wall face z: glass in the wall plane, lintel above, sill below. */
export function sashWindow(g, x, y0, z, { out = 1, sill = true, into = "air" } = {}) {
  const cells = [0, 1, 2].map((dy) => [x, y0 + dy, z, ["glass_pane", PANE_EW], "wall"]);
  if (sill) cells.push([x, y0 - 1, z + out, B.slab("smooth_sandstone", "bottom")]);
  cells.push([x, y0 + 3, z, B.block("smooth_sandstone"), "wall"]);
  return place(g, into, cells);
}

/**
 * Double street door for the flats: two dark_oak_door leaves at x and x+1 (lower y0, upper y0+1), a glass fanlight
 * at y0+2, trim surround one out each side, a hood on y0+3 (slabs under, stairs at the ends), and a FLATS wall sign
 * at y0+4 on the street face.
 */
export function streetDoor(g, x, y0, z, { out = 1, sign = "FLATS", into = "air" } = {}) {
  const facing = STREET_FACE(out), cells = [];
  for (const [dx, hinge] of [[0, "left"], [1, "right"]]) {
    cells.push([x + dx, y0, z, B.door("dark_oak", facing, "lower", hinge), "wall"]);
    cells.push([x + dx, y0 + 1, z, B.door("dark_oak", facing, "upper", hinge), "wall"]);
    cells.push([x + dx, y0 + 2, z, ["glass_pane", PANE_EW], "wall"]);
    cells.push([x + dx, y0 + 3, z + out, B.slab("smooth_sandstone", "bottom")]);
  }
  for (let dy = 0; dy < 3; dy++) for (const dx of [-1, 2]) cells.push([x + dx, y0 + dy, z, B.block("smooth_sandstone"), "wall"]);
  cells.push([x - 1, y0 + 3, z + out, B.stairs("smooth_sandstone", "east", "bottom")]);
  cells.push([x + 2, y0 + 3, z + out, B.stairs("smooth_sandstone", "west", "bottom")]);
  // the sign's own row only (x..x+1 at y0+4, out from the wall): signboard would otherwise build a taller board
  const [zLo, zHi] = [Math.min(z + out, z + 2 * out), Math.max(z + out, z + 2 * out)];
  const onRow = ([px, py, pz]) => px >= x && px <= x + 1 && py === y0 + 4 && pz >= zLo && pz <= zHi;
  const board = signboard(g, sign, { at: [x, y0 + 4, z], face: STREET_FACE(out), mode: "wall", width: 2, height: 1, wood: "dark_oak",
    avoid: (p) => !onRow(p) || !!g.protected?.has(p.join(",")) });
  const placed = place(g, into, cells);
  return { ...placed, placed: placed.placed + board.cells, skipped: placed.skipped };
}

/**
 * Chimney stack on a 2x2 footing at x..x+1, z..z+1, from y 6 to y 32. The flue is the cell (x+1, z+1): air below y 31.
 * A trim band at y 30. A 4x4 smooth_sandstone_slab cap at y 33 with the flue left open. With fire: hay_block in the
 * flue at y 32 and a lit campfire in the flue at y 33.
 */
export function chimney(g, x, z, { fire = false, into = "air" } = {}) {
  const flue = [x + 1, z + 1], isFlue = (cx, cz) => cx === flue[0] && cz === flue[1], cells = [];
  for (let y = 6; y <= 32; y++) for (const cx of [x, x + 1]) for (const cz of [z, z + 1]) {
    const f = isFlue(cx, cz);
    if (f && y < 31) continue;
    if (y === 30 && !f) cells.push([cx, y, cz, B.block("smooth_sandstone")]);
    else if (f && y === 32 && fire) cells.push([cx, y, cz, B.pillar("hay_block", "y")]);
    else cells.push([cx, y, cz, B.block("bricks")]);
  }
  for (const cx of range(x - 1, x + 2)) for (const cz of range(z - 1, z + 2)) if (!isFlue(cx, cz)) cells.push([cx, 33, cz, B.slab("smooth_sandstone", "bottom")]);
  if (fire) cells.push([flue[0], 33, flue[1], ["campfire", { facing: "north", lit: "true" }]]);
  return place(g, into, cells);
}

/** Street lamp post at x, z: dark_oak_fence from y 7 to y 9 with a standing lantern at y 10. */
export function lampPost(g, x, z, { into = "air" } = {}) {
  const cells = [7, 8, 9].map((y) => [x, y, z, B.fence("dark_oak")]);
  cells.push([x, 10, z, B.lantern(false)]);
  return place(g, into, cells);
}
