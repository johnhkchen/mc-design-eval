// Part "facade": the lattice skin on the finished shell. The shell's outer walls are solid, so the facade works OUT from
// them: proud quartz_pillar ribs one block off every exposed wall (every 4th cell, corners always ribs), the loggia
// arcades (arcade_bay) in the air the shell left under the courtyard faces, and the coping + finials on each roof ring
// (a smooth_quartz ring with finials). Everything is written into air only; the plot edge stops any rib that would
// stand outside x0..144 z0..177.
import { DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { MASS, OPENINGS, PLOT, QUARTZ_PILLAR } from "../vocab/base.mjs";
import { arcade_bay } from "../vocab.mjs";

const TALL_TOP = 27, LOW_TOP = 19;   // coping y: the ribs end in the flat parapet

// Loggia doors the arcade's back screen must leave open (fittings hangs the doors): screen cells at y 1..2 stay air.
const DOORS = [...OPENINGS.e_loggia_doors, ...OPENINGS.s_loggia_doors, OPENINGS.b2_loggia_door];
const skip = new Set();
for (const [x0, y0, z0, x1, y1, z1] of DOORS) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) skip.add(`${x},${y},${z}`);
}

// The grid as the vocabulary sees it: the same grid, but never a write into a door cell.
function guarded(g) {
  return new Proxy(g, {
    get(t, k) {
      if (k === "set") return (x, y, z, ...rest) => { if (!skip.has(`${x},${y},${z}`)) t.set(x, y, z, ...rest); };
      const v = t[k];
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
}

const inPlot = (x, y, z) => x >= PLOT.x0 && x <= PLOT.x1 && z >= PLOT.z0 && z <= PLOT.z1 && y >= 1 && y <= PLOT.y1;

// One proud rib column: the cell one block outside the wall line `line` on `face`, at tangent t, heights y0..y1.
// Only air is written, so ribs stop at the shell and at anything an earlier part built.
function proudRib(g, face, line, t, y0, y1) {
  const [ox, , oz] = DIRS[face];
  const x = face === "west" || face === "east" ? line + ox : t;
  const z = face === "north" || face === "south" ? line + oz : t;
  for (let y = y0; y <= y1; y++) {
    if (!inPlot(x, y, z) || !g.isAir(x, y, z) || skip.has(`${x},${y},${z}`)) continue;
    g.set(x, y, z, QUARTZ_PILLAR, { axis: "y" });
  }
}

// A glazed pointed lancet proud of the wall in the centre of each 4-cell bay (tangent t+2, from t0 every 4): glass
// y yA..yB-1 one block out, an upside-down smooth_quartz_stairs head at yB. Lattice-proud, since the shell's wall is solid.
function lancetProud(g, face, line, t0, t1, yA, yB) {
  const [ox, , oz] = DIRS[face];
  const along = face === "west" || face === "east";
  const into = { north: "south", south: "north", east: "west", west: "east" }[face];
  const panes = along
    ? { north: "true", south: "true", east: "false", west: "false" }
    : { north: "false", south: "false", east: "true", west: "true" };
  for (let t = t0; t + 3 <= t1; t += 4) {
    const c = t + 2;
    const x = along ? line + ox : c, z = along ? c : line + oz;
    for (let y = yA; y < yB; y++) if (inPlot(x, y, z) && g.isAir(x, y, z)) g.set(x, y, z, "gray_stained_glass_pane", panes);
    if (inPlot(x, yB, z) && g.isAir(x, yB, z)) g.set(x, yB, z, "smooth_quartz_stairs", { facing: into, half: "top", shape: "straight", waterlogged: "false" });
  }
}

// Ribs along a wall from tangent t0 to t1, one every 4 cells from t0 with the far end always a rib, rising to the
// coping y `cop` (19 low, 27 tall) and branching into pointed arches in the upper third: each 3-wide panel gets
// upside-down smooth_quartz_stairs shoulders at cop-5 leaning on its two ribs, a one-cell pointed slot to cop-4, and
// a flat smooth_quartz band cop-3..cop over the arches, flush with the flat coping (no finials, no merlons).
// `low(t)` true means that rib starts at y10; `y0` lifts the whole face (courtyard faces over the promenade);
// `keep(t, y)` true leaves a cell air (banner board, door approach).
function ribs(g, face, line, t0, t1, cop, low = () => false, { y0 = 1, keep = () => false } = {}) {
  const [ox, , oz] = DIRS[face];
  const along = face === "west" || face === "east";
  const at = [];
  for (let t = t0; t <= t1; t += 4) at.push(t);
  if (at[at.length - 1] !== t1) at.push(t1);
  const put = (t, y, ...b) => {
    const x = along ? line + ox : t, z = along ? t : line + oz;
    if (!inPlot(x, y, z) || !g.isAir(x, y, z) || skip.has(`${x},${y},${z}`) || keep(t, y)) return;
    g.set(x, y, z, ...b);
  };
  // stairs leaning toward a rib at the lower (-t) or higher (+t) side
  const lean = (dir) => (along ? (dir < 0 ? "north" : "south") : (dir < 0 ? "west" : "east"));
  for (const t of at) {
    for (let y = Math.max(y0, low(t) ? 10 : 1); y <= cop - 4; y++) put(t, y, QUARTZ_PILLAR, { axis: "y" });
    for (let y = cop - 3; y <= cop; y++) put(t, y, "smooth_quartz", {});
  }
  for (let i = 0; i + 1 < at.length; i++) {
    const a = at[i], b = at[i + 1];
    for (let t = a + 1; t < b; t++) {
      for (let y = cop - 2; y <= cop; y++) put(t, y, "smooth_quartz", {});
      if (b - a !== 4) { put(t, cop - 3, "smooth_quartz", {}); continue; }
      if (t === a + 2) put(t, cop - 3, "smooth_quartz", {});
      else {
        const dir = t === a + 1 ? -1 : 1;
        put(t, cop - 5, "smooth_quartz_stairs", { facing: lean(dir), half: "top", shape: "straight", waterlogged: "false" });
        put(t, cop - 4, "smooth_quartz", {});
        put(t, cop - 3, "smooth_quartz", {});
      }
    }
  }
}

// The roof ring of a mass [x0, y0, z0, x1, y1, z1]: a flat smooth_quartz parapet on the perimeter at y, no finials.
function coping(g, [x0, , z0, x1, , z1], y) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
    if (g.isAir(x, y, z)) g.set(x, y, z, "smooth_quartz", {});
  }
}

export function build(g) {
  const w = guarded(g);

  // 1. Loggia arcades under the courtyard faces (the shell left these cells air): piers on the face line, 3 deep.
  for (let z = 76; z + 3 <= 159; z += 4) arcade_bay(w, "west", [60, z], 3);   // E wing, courtyard face x 60
  for (let x = 4; x + 3 <= 59; x += 4) arcade_bay(w, "north", [x, 160], 3);   // S wing, courtyard face z 160
  for (let x = 40; x + 3 <= 59; x += 4) arcade_bay(w, "south", [x, 75], 3);   // B2 wing, courtyard face z 75

  // 2. Proud ribs on the exposed walls. Tall blocks run to y28, low wings to y20. Walls on the plot edge have no room out.
  // B: plaza face (west x 40) z 24..59 tall; the main door at z 45..48 keeps its approach clear below y 10.
  const atDoor = (t) => t >= 40 && t <= 52;
  ribs(g, "west", 40, 24, 59, TALL_TOP, atDoor);
  ribs(g, "west", 40, 60, 75, LOW_TOP);                 // B2 plaza face
  ribs(g, "north", 24, 40, 83, TALL_TOP);               // B's north face onto the plaza's east half
  ribs(g, "east", 143, 24, 51, TALL_TOP);               // B's east face (x 144 is the plot's last column)
  ribs(g, "east", 135, 52, 59, TALL_TOP);               // B' east face, stepped back
  ribs(g, "east", 131, 0, 23, TALL_TOP);                // N1 east face (x 132); its north face on z 0 has no room out
  ribs(g, "east", 131, 76, 159, LOW_TOP);               // E wing east face (x 132)
  ribs(g, "south", 171, 60, 131, LOW_TOP);              // S wing south face (z 172), east of the tail

  // Faces the first pass left plain: the courtyard faces' upper storey (ribs from y13, clear of the promenade deck and
  // its railing), N1's west face, B's north face east of N1, B' south over the B2 roof, B2's east end, the W stub.
  ribs(g, "west", 60, 76, 159, LOW_TOP, undefined, { y0: 13 });     // E wing courtyard face over the deck
  ribs(g, "north", 160, 4, 59, LOW_TOP, undefined, { y0: 13 });     // S wing courtyard face over the deck
  ribs(g, "south", 75, 40, 59, LOW_TOP, undefined, { y0: 13 });     // B2 courtyard face
  ribs(g, "west", 84, 0, 23, TALL_TOP);                             // N1 west face (the stair bay keeps its cells)
  ribs(g, "north", 24, 132, 143, TALL_TOP);                         // B north face east of N1
  ribs(g, "south", 59, 40, 131, TALL_TOP, undefined, { y0: 20 });   // B' south face above the B2 roof
  ribs(g, "east", 131, 60, 75, LOW_TOP);                            // B2 east end
  ribs(g, "east", 3, 140, 155, LOW_TOP, undefined, { y0: 2 });      // W stub's courtyard face, over the walk

  // 2b. Glazed lancets proud of the upper storey (y 12..15, head at 16) in each bay's centre: the lattice's pointed read.
  lancetProud(g, "east", 131, 76, 159, 12, 16);         // E wing east face
  lancetProud(g, "south", 171, 60, 131, 12, 16);        // S wing south face
  lancetProud(g, "west", 40, 24, 51, 12, 16);           // B plaza face, above the main door band
  lancetProud(g, "east", 143, 24, 51, 12, 16);          // B east face
  lancetProud(g, "west", 40, 60, 75, 12, 16);           // B2 plaza face

  // 3. Coping and finials on each roof ring: slab at y19 (low) / y27 (tall); at the rib cells a full smooth_quartz
  // block carries the quartz_pillar finial one above, so no finial stands on a half slab.
  for (const k of ["B2", "E", "S", "S_TAIL", "S_TAIL_END"]) coping(w, MASS[k], 19);
  for (const k of ["N1", "B", "B_PRIME"]) coping(w, MASS[k], 27);
}
