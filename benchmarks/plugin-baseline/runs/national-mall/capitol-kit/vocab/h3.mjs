// Vocabulary helpers h3 (plan.md VOCABULARY): colonnade, balustrade, pilaster, cupola, domeBase, domeShell, statue.
// Every helper takes its position as arguments and returns the number of blocks it placed.
// Writes go into air only; pass { over: true } where the helper must cut into a flush wall face (pilaster). Nothing is
// written outside the helper's own footprint, and nothing under it: ground and floors belong to earlier parts.
// Stairs: `facing` names the full-height back (references/toolkit.md, and the client's stair model: facing=east is tall
// on the east). A stair whose lip points out is therefore written facing in.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Place one entry ("block" or [block, state]) at x,y,z. Refused (returns 0) out of bounds, or on a non-air cell unless over.
const put = (g, x, y, z, entry, over = false) => {
  if (!g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) return 0;
  g.set(x, y, z, ...(typeof entry === "string" ? [entry] : entry));
  return 1;
};

const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };
const keyOf = (x, z) => `${x},${z}`;
const at = (x, y, z) => `${x},${y},${z}`;

// The kept cells of disc d about the axis (cx, cz): x cx-d/2 .. cx+d/2-1, kept where the cell centre is within d/2.
const disc = (cx, cz, d) => {
  const cells = [];
  for (let x = cx - d / 2; x < cx + d / 2; x++) for (let z = cz - d / 2; z < cz + d / 2; z++)
    if ((x + 0.5 - cx) ** 2 + (z + 0.5 - cz) ** 2 <= (d / 2) ** 2) cells.push([x, z]);
  return cells;
};
// Outward side of a cell from the axis: the dominant horizontal axis of its centre offset.
const outward = (dx, dz) => Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "east" : "west") : (dz > 0 ? "south" : "north");
// Rib lines through the axis: x = cx ± ½, z = cz ± ½, and both diagonals.
const onRib = (dx, dz) => Math.abs(dx) === 0.5 || Math.abs(dz) === 0.5 || Math.abs(dx) === Math.abs(dz);
const angleGap = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

// ---- walls and columns ----------------------------------------------------------------------------------------------

/**
 * Columns on a line. axis "x": columns at x = at, zs are z positions; axis "z": at = z, zs are x positions. Each column
 * is depth cells deep in +axis and runs y0..y1 as quartz_pillar (axis y). Corner piers are the same call with depth 2.
 */
export function colonnade(g, { axis, at: fixed, zs, y0 = 5, y1 = 10, depth = 1, block = "quartz_pillar" }) {
  let n = 0;
  for (const v of zs) for (let d = 0; d < depth; d++) for (let y = y0; y <= y1; y++) {
    const [x, z] = axis === "x" ? [fixed + d, v] : [v, fixed + d];
    n += put(g, x, y, z, B.pillar(block, "y"));
  }
  return n;
}

/**
 * A balustrade on a wall line at height y: diorite_wall along the line, smooth_quartz posts at both ends and every 6th
 * cell. line = { axis, at, from, to }: axis "x" runs the line at x = at with z = from..to; axis "z" at z = at.
 * skip(x, z) leaves a cell alone (the pediment cells).
 */
export function balustrade(g, { line: { axis, at: fixed, from, to }, y = 12, skip = () => false }) {
  const run = axis === "x" ? ["north", "south"] : ["east", "west"];
  const state = { up: "true", north: "none", east: "none", south: "none", west: "none" };
  for (const side of run) state[side] = "low";
  let n = 0;
  for (let v = from; v <= to; v++) {
    const [x, z] = axis === "x" ? [fixed, v] : [v, fixed];
    if (skip(x, z)) continue;
    const post = v === from || v === to || (v - from) % 6 === 0;
    n += post ? put(g, x, y, z, "smooth_quartz") : put(g, x, y, z, ["diorite_wall", state]);
  }
  return n;
}

/** One quartz_pillar (axis y) from y0 to y1 at x, z. over: true cuts the flush wall block it stands in. */
export function pilaster(g, { x, z, y0 = 5, y1 = 10, over = false }) {
  let n = 0;
  for (let y = y0; y <= y1; y++) n += put(g, x, y, z, B.pillar("quartz_pillar", "y"), over);
  return n;
}

// ---- cupola -----------------------------------------------------------------------------------------------------------

/**
 * Copper cupola on the 4x4 footprint x0..x0+3, z0..z0+3, y0..y0+3. A calcite drum (y0..y0+1) with a centred 2-cell pane
 * on each face; a copper stair ring at y0+2 whose lip points out; a 2x2 copper slab cap at y0+3. smooth_stone core.
 */
export function cupola(g, { x0, z0, y0 = 12 }) {
  const x1 = x0 + 3, z1 = z0 + 3;
  let n = 0;
  // drum: the non-corner cells of each face are its two panes (the centred 2-cell window), the corners calcite
  for (let y = y0; y < y0 + 2; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edgeX = x === x0 || x === x1, edgeZ = z === z0 || z === z1;
    if (!edgeX && !edgeZ) n += put(g, x, y, z, "smooth_stone");
    else if (edgeX && edgeZ) n += put(g, x, y, z, "calcite");
    else if (edgeZ) n += put(g, x, y, z, ["gray_stained_glass_pane", paneOnFace(z === z0 ? "north" : "south")]);
    else n += put(g, x, y, z, ["gray_stained_glass_pane", paneOnFace(x === x0 ? "west" : "east")]);
  }
  // cap ring at y0+2: stairs whose lip points out (the state names the back, so it faces in); core smooth_stone
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edgeX = x === x0 || x === x1, edgeZ = z === z0 || z === z1;
    if (edgeX || edgeZ) {
      const out = z === z0 ? "north" : z === z1 ? "south" : x === x0 ? "west" : "east";
      n += put(g, x, y0 + 2, z, B.stairs("oxidized_cut_copper", OPPOSITE[out], "bottom"));
    } else n += put(g, x, y0 + 2, z, "smooth_stone");
  }
  for (let x = x0 + 1; x <= x1 - 1; x++) for (let z = z0 + 1; z <= z1 - 1; z++)
    n += put(g, x, y0 + 3, z, B.slab("oxidized_cut_copper", "bottom"));
  return n;
}

// A pane in a face of the drum: it joins the calcite on both sides of its face.
const paneOnFace = (face) => face === "north" || face === "south"
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" };

// ---- dome -------------------------------------------------------------------------------------------------------------

/**
 * The square base of the dome over (cx, cz): size × size cells, smooth_quartz at y0..y0+1, a smooth_quartz_slab cornice at
 * y0+2 (cornice: "top" as drawn in the plan; "bottom" if the course should sit flush on the body).
 */
export function domeBase(g, { cx, cz, size = 18, y0 = 12, cornice = "top" }) {
  let n = 0;
  for (let x = cx - size / 2; x < cx + size / 2; x++) for (let z = cz - size / 2; z < cz + size / 2; z++) {
    for (let y = y0; y < y0 + 2; y++) n += put(g, x, y, z, "smooth_quartz");
    n += put(g, x, y0 + 2, z, B.slab("smooth_quartz", cornice));
  }
  return n;
}

// The plan's bell courses, [y, d] bottom to top.
const COURSES = [[26, 12], [27, 12], [28, 12], [29, 10], [30, 10], [31, 8], [32, 6], [33, 4]];

/**
 * The ribbed bell shell over (cx, cz). Each course is a solid disc. Cells the next course steps in from are upright
 * stairs with the lip out (written facing in: the state names the back). The top course (d4) is full blocks. Ribs on the
 * rib lines are polished_diorite (polished_diorite_stairs at the steps). Eight windows sit at windowY, one centred in each
 * segment between ribs: the outer cell is left air and the pane is one cell in.
 */
export function domeShell(g, { cx, cz, windowY = 27, courses = COURSES }) {
  const plan = new Map();   // "x,y,z" -> [x, y, z, entry]: the whole shell, written at the end
  const set = (x, y, z, entry) => plan.set(at(x, y, z), [x, y, z, entry]);
  courses.forEach(([y, d], i) => {
    const above = i + 1 < courses.length ? new Set(disc(cx, cz, courses[i + 1][1]).map(([x, z]) => keyOf(x, z))) : null;
    for (const [x, z] of disc(cx, cz, d)) {
      const dx = x + 0.5 - cx, dz = z + 0.5 - cz;
      const stepped = above !== null && !above.has(keyOf(x, z));
      const back = OPPOSITE[outward(dx, dz)];
      const rib = onRib(dx, dz);
      if (rib && stepped) set(x, y, z, B.stairs("polished_diorite", back, "bottom"));
      else if (rib) set(x, y, z, "polished_diorite");
      else if (stepped) set(x, y, z, B.stairs("smooth_quartz", back, "bottom"));
      else set(x, y, z, "smooth_quartz");
    }
  });

  const win = courses.find(([y]) => y === windowY);
  if (win) {
    const dset = new Set(disc(cx, cz, win[1]).map(([x, z]) => keyOf(x, z)));
    const ring = [...dset].map((k) => k.split(",").map(Number)).filter(([x, z]) => {
      const dx = x + 0.5 - cx, dz = z + 0.5 - cz;
      return !onRib(dx, dz) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !dset.has(keyOf(x + a, z + b)));
    });
    for (let k = 0; k < 8; k++) {
      const mid = Math.PI / 8 + (k * Math.PI) / 4;     // segment centres lie between the ribs at multiples of 45°
      const best = ring.reduce((a, c) => (angleGap(Math.atan2(c[1] + 0.5 - cz, c[0] + 0.5 - cx), mid)
        < angleGap(Math.atan2(a[1] + 0.5 - cz, a[0] + 0.5 - cx), mid) ? c : a));
      const [x, z] = best, dx = x + 0.5 - cx, dz = z + 0.5 - cz;
      const xWall = Math.abs(dx) >= Math.abs(dz);       // the wall runs north-south under an east/west face
      plan.delete(at(x, windowY, z));                   // the recess: outer cell left air
      const [ix, iz] = xWall ? [x - Math.sign(dx), z] : [x, z - Math.sign(dz)];
      const pane = xWall ? { north: "true", south: "true", east: "false", west: "false" }
        : { north: "false", south: "false", east: "true", west: "true" };
      set(ix, windowY, iz, ["gray_stained_glass_pane", pane]);
    }
  }

  let n = 0;
  for (const [x, y, z, entry] of plan.values()) n += put(g, x, y, z, entry);
  return n;
}

// ---- statue -----------------------------------------------------------------------------------------------------------

/** The Statue of Freedom on one column: a polished_diorite pedestal at y0, the figure at y0+1..y0+2, its head at y0+3. */
export function statue(g, { x, z, y0 = 38 }) {
  const alone = { up: "true", north: "none", east: "none", south: "none", west: "none" };
  let n = put(g, x, y0, z, B.block("polished_diorite"));
  n += put(g, x, y0 + 1, z, B.block("polished_blackstone"));
  n += put(g, x, y0 + 2, z, B.block("polished_blackstone"));
  n += put(g, x, y0 + 3, z, ["polished_blackstone_wall", alone]);
  return n;
}
