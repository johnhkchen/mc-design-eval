// vocab/h1.mjs: group 1 of plan.md VOCABULARY (lane, piers, window, porch, chimney, table, ham rack, pecan tree,
// beehive row). Every helper takes its own position; nothing is hard-wired to a spot.
// Writes go into air only (g.isAir). Each helper returns { placed, skipped } and a refused cell is listed in skipped,
// never overwritten. The exception is lane_strip, whose footprint IS the surface row it replaces.
// Positions plan.md's signatures leave out (y, z, front, facing) come as a trailing options object, defaulted to plan.md.
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };     // terrain.mjs convention
const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

const result = () => ({ placed: 0, skipped: [] });

/** Air-only write. A cell that already holds a block is recorded in out.skipped and left alone. */
function put(g, out, x, y, z, block, state) {
  if (!g.isAir(x, y, z)) {
    out.skipped.push([x, y, z, block]);
    return false;
  }
  g.set(x, y, z, block, state);
  out.placed++;
  return true;
}

/** Lane surface from x0 to x1, five rows from z: coarse_dirt edges, dirt_path ruts, gravel centre (plan SITE).
 *  The lane is the surface itself, so it replaces the grass at row y (default 0) and writes nothing under it. */
export function lane_strip(g, x0, x1, { z = 0, y = 0 } = {}) {
  const out = result();
  ["coarse_dirt", "dirt_path", "gravel", "dirt_path", "coarse_dirt"].forEach((block, dz) => {
    for (let x = x0; x <= x1; x++) {
      g.set(x, y, z + dz, block);
      out.placed++;
    }
  });
  return out;
}

/** Piers on the outline x0,z0..x1,z1: at both ends of every edge and every 3rd cell along it, h courses from row y.
 *  The cells between piers get `skirt` (a fence keeps its run along the edge), or stay open when skirt is null. */
export function pier_line(g, x0, z0, x1, z1, block, { y = 1, h = 1, skirt = null } = {}) {
  const out = result();
  const span = (a, b) => {
    const p = [];
    for (let v = a; v <= b; v += 3) p.push(v);
    if (p[p.length - 1] !== b) p.push(b);
    return p;
  };
  const piers = new Set([
    ...span(x0, x1).flatMap((x) => [`${x},${z0}`, `${x},${z1}`]),
    ...span(z0, z1).flatMap((z) => [`${x0},${z}`, `${x1},${z}`]),
  ]);
  const outline = [];
  for (let x = x0; x <= x1; x++) outline.push([x, z0, "x"], [x, z1, "x"]);
  for (let z = z0 + 1; z < z1; z++) outline.push([x0, z, "z"], [x1, z, "z"]);
  for (const [x, z, axis] of outline) {
    for (let dy = 0; dy < h; dy++) {
      if (piers.has(`${x},${z}`)) put(g, out, x, y + dy, z, block);
      else if (skirt) {
        const state = !skirt.endsWith("_fence") ? undefined
          : axis === "x" ? { north: "false", south: "false", east: "true", west: "true" }
          : { north: "true", south: "true", east: "false", west: "false" };
        put(g, out, x, y + dy, z, skirt, state);
      }
    }
  }
  return out;
}

/** A w x h band of glass panes in a wall that faces `face`. (x, y, z) is the band's lowest cell at its start: the lowest x
 *  on a north/south wall, the lowest z on an east/west wall. The panes connect along the wall. `sill` (a material name)
 *  lays top slabs one cell out in front of the bottom row; null means no sill. The lintel is the wall's own block, so
 *  it is not written here. */
export function window(g, x, y, z, face = "north", w = 1, h = 1, { sill = null } = {}) {
  const out = result();
  const alongX = face === "north" || face === "south";
  const [ox, oz] = STEP[face];
  const pane = alongX ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  for (let i = 0; i < w; i++) {
    const cx = alongX ? x + i : x, cz = alongX ? z : z + i;
    for (let dy = 0; dy < h; dy++) put(g, out, cx, y + dy, cz, "glass_pane", pane);
    if (sill) put(g, out, cx + ox, y, cz + oz, `${sill}_slab`, { type: "top", waterlogged: "false" });
  }
  return out;
}

/** A porch along the street front: the front line is row z, x0..x1, and the porch is two deep toward the house (away
 *  from it when front is south). Posts at each x in `posts`, y 3 up. A deck at y 2 (plus a gallery deck at y 7 when
 *  storeys is 2). A rail at y 3 along the front line, left open over the gap [gx0, gx1] for the steps; a full
 *  balustrade at y 8 on a two-storey porch. Shed roof when `roof` names a material: stairs on the front line, facing
 *  the house, with a slab row behind. Storey 1: posts to y 5, roof at y 6, slab row at y 7. Storey 2: posts to y 10,
 *  roof at y 11, slab row top-type at y 11. */
export function porch_run(g, x0, x1, z, posts, rail, deck, storeys = 1,
  { front = "north", post = "stripped_oak_log", roof = null, gap = null } = {}) {
  const out = result();
  const dz = front === "north" ? 1 : -1, toward = front === "north" ? "south" : "north";
  const two = storeys >= 2;
  for (const px of posts) for (let y = 3; y <= (two ? 10 : 5); y++) put(g, out, px, y, z, post, { axis: "y" });
  for (let x = x0; x <= x1; x++) {
    put(g, out, x, 2, z, deck);
    put(g, out, x, 2, z + dz, deck);
    if (two) {
      put(g, out, x, 7, z, deck);
      put(g, out, x, 7, z + dz, deck);
    }
  }
  const gapped = (x) => !!gap && x >= gap[0] && x <= gap[1];
  const railRow = (y, leaveGap) => {
    for (let x = x0; x <= x1; x++) {
      if ((leaveGap && gapped(x)) || posts.includes(x)) continue;
      const east = x < x1 && !(leaveGap && gapped(x + 1));
      const west = x > x0 && !(leaveGap && gapped(x - 1));
      put(g, out, x, y, z, rail, { north: "false", south: "false", east: String(east), west: String(west) });
    }
  };
  railRow(3, true);
  if (two) railRow(8, false);
  if (roof) {
    for (let x = x0; x <= x1; x++) {
      put(g, out, x, two ? 11 : 6, z, `${roof}_stairs`, { facing: toward, half: "bottom", shape: "straight", waterlogged: "false" });
      if (two) put(g, out, x, 11, z + dz, `${roof}_slab`, { type: "top", waterlogged: "false" });
      else put(g, out, x, 7, z + dz, `${roof}_slab`, { type: "bottom", waterlogged: "false" });
    }
  }
  return out;
}

/** A chimney stack, built by chimney() from the build library: at = [x, base y, z] of the shaft's north-west cell, top =
 *  the course its campfire sits in, size 1 or 2. The footing, crown and cap belong to the stack. Writes go through the
 *  air-only sink, so anything already standing in the flue or crown is skipped and reported. */
export function chimney_stack(g, at, top, size = 1, material = "bricks", band = undefined) {
  const out = result();
  chimney({ set: (x, y, z, block, state) => put(g, out, x, y, z, block, state) }, { at, top, size, material, band });
  return out;
}

/** A table: spruce_fence legs at both ends and every 3rd cell, and a spruce_slab top row (type top) one course up,
 *  resting on the legs. Footprint: len cells along x at z, rows y and y+1. Nothing is placed at y+2, so the lane past it
 *  stays 2 high. */
export function table_set(g, x, y, z, len) {
  const out = result();
  for (let i = 0; i < len; i++) {
    if (i === 0 || i === len - 1 || i % 3 === 0) put(g, out, x + i, y, z, "spruce_fence");
    put(g, out, x + i, y + 1, z, "spruce_slab", { type: "top", waterlogged: "false" });
  }
  return out;
}

/** Hams: a barrel (facing down) hung on an iron_chain at every x in xs and z in zs. The chain is in row y, under the tie
 *  beam at y+1 (the beam is not written here); the barrel hangs in row y-1. Footprint: xs x zs, rows y-1..y. */
export function ham_rack(g, xs, zs, y) {
  const out = result();
  for (const x of xs) for (const z of zs) {
    if (put(g, out, x, y, z, "iron_chain", { axis: "y", waterlogged: "false" })) put(g, out, x, y - 1, z, "barrel", { facing: "down" });
  }
  return out;
}

/** A pecan: a jungle_log trunk from trunk = [x, y, z] up `height` logs, two short limbs one log under the top (axis x on
 *  the +x side, axis z on the +z side), and a flat, broad crown of leaves over the box crown = [x0, y0, z0, x1, y1, z1].
 *  The crown's bottom corners are left out. About 30% of the leaves are oak, placed by position so every run matches. */
export function pecan_tree(g, [x, y0, z], height, [cx0, cy0, cz0, cx1, cy1, cz1]) {
  const out = result();
  const limbY = y0 + height - 2;
  const wood = new Set();
  for (let i = 0; i < height; i++) wood.add(`${x},${y0 + i},${z}`);
  wood.add(`${x + 1},${limbY},${z}`);
  wood.add(`${x},${limbY},${z + 1}`);
  for (let i = 0; i < height; i++) put(g, out, x, y0 + i, z, "jungle_log", { axis: "y" });
  put(g, out, x + 1, limbY, z, "jungle_log", { axis: "x" });
  put(g, out, x, limbY, z + 1, "jungle_log", { axis: "z" });
  for (let cx = cx0; cx <= cx1; cx++) for (let cy = cy0; cy <= cy1; cy++) for (let cz = cz0; cz <= cz1; cz++) {
    const bottomCorner = cy === cy0 && (cx === cx0 || cx === cx1) && (cz === cz0 || cz === cz1);
    if (bottomCorner || wood.has(`${cx},${cy},${cz}`)) continue;
    const oak = (cx * 7 + cy * 13 + cz * 5) % 10 < 3;
    put(g, out, cx, cy, cz, oak ? "oak_leaves" : "jungle_leaves", LEAF);
  }
  return out;
}

/** A row of beehives standing on the ground: x0..x1 at z, on row y (default 1), all facing `facing` (default north). */
export function beehive_row(g, x0, x1, z, { y = 1, facing = "north" } = {}) {
  const out = result();
  for (let x = x0; x <= x1; x++) put(g, out, x, y, z, "beehive", { facing, honey_level: "0" });
  return out;
}
