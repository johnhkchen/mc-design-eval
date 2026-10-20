// Vocabulary helpers, batch 1 (plan.md VOCABULARY): finFace, revealSlot, canopyPier, aircraftLight, shopFront,
// soffit, pergola, coveredWalk, roundedPlan, observatory.
//
// Contract, for every helper: position and facing come in as arguments; it writes only inside the footprint box it is
// given (x0..x1, y0..y1, z0..z1, inclusive); it writes only into air unless o.over is true; it returns { placed, blocked }
// where blocked lists the footprint cells that were not air (left alone). Face helpers take the face the work sits on
// ("north" = the low-z plane, "south" = high z, "west" = low x, "east" = high x).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const inBox = (b, x, y, z) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && z >= b.z0 && z <= b.z1;

// One writer per call: footprint check, air check, and the placed / blocked tally.
function writer(g, box, over = false) {
  const out = { placed: 0, blocked: [] };
  const set = (x, y, z, block, state, nbt) => {
    if (!inBox(box, x, y, z) || !g.inBounds(x, y, z)) return;
    if (!over && !g.isAir(x, y, z)) { out.blocked.push([x, y, z]); return; }
    g.set(x, y, z, block, state, nbt);
    out.placed++;
  };
  return { set, out };
}

// A cell on a face: a = the coordinate along the face (x for north/south, z for east/west), d = depth in from the
// face plane (0 = the face itself, 1 = one cell back, ...).
function cellAt(face, box, a, y, d) {
  if (face === "north") return [a, y, box.z0 + d];
  if (face === "south") return [a, y, box.z1 - d];
  if (face === "west") return [box.x0 + d, y, a];
  if (face === "east") return [box.x1 - d, y, a];
  throw new Error(`face must be north|south|east|west, got ${face}`);
}
const alongStart = (face, box) => (face === "north" || face === "south" ? box.x0 : box.z0);
const alongEnd = (face, box) => (face === "north" || face === "south" ? box.x1 : box.z1);

/**
 * Outer fin plane on one face of the shaft: finMat every second cell (even offset from the span's start corner) on the
 * face plane, glass one cell back on every cell; every 4th floor band (7 high, from y0) uses the accent glass.
 * o: { x0,x1,y0,y1,z0,z1, finMat, glassMat, accentMat, accentEvery }. Call floorLine before this so its rows stay.
 */
export function finFace(g, face, o) {
  const { x0, x1, y0, y1, z0, z1, finMat = "smooth_quartz", glassMat = "gray_stained_glass",
    accentMat = "black_stained_glass", accentEvery = 4, over = false } = o;
  const box = { x0, x1, y0, y1, z0, z1 };
  const w = writer(g, box, over);
  const a0 = alongStart(face, box);
  for (let a = a0; a <= alongEnd(face, box); a++) {
    for (let y = y0; y <= y1; y++) {
      const accent = accentEvery > 0 && Math.floor((y - y0) / 7) % accentEvery === 0;
      if ((a - a0) % 2 === 0) w.set(...cellAt(face, box, a, y, 0), finMat);
      w.set(...cellAt(face, box, a, y, 1), accent ? accentMat : glassMat);
    }
  }
  return w.out;
}

/**
 * Centre reveal on one face: a slot from span `from`..`to` (along the face), cut `depth` cells back. Carved by not
 * placing: the slot's own cells are left air. Back wall light_gray_stained_glass with orange_terracotta at each floor
 * line (every 7 from y0); side walls smooth_quartz. Pass the slot's span and the shaft box.
 * o: { from, to, depth = 3, y0, y1, over }. Give the slot's air before finFace has run on it (finFace skips it).
 */
export function revealSlot(g, face, box, o) {
  const { from, to, depth = 3, y0, y1, over = false } = o;
  const w = writer(g, box, over);
  for (let y = y0; y <= y1; y++) {
    const floorLine = (y - y0) % 7 === 0;
    for (let a = from; a <= to; a++) {
      w.set(...cellAt(face, box, a, y, depth), floorLine ? "orange_terracotta" : "light_gray_stained_glass");
    }
    for (const a of [from - 1, to + 1]) {
      for (let d = 0; d < depth; d++) w.set(...cellAt(face, box, a, y, d), "smooth_quartz");
    }
  }
  return w.out;
}

/**
 * A porte-cochère pier: quartz_pillar column of height h standing on [x, y, z], a 3x3 quartz_slab canopy on its top
 * (bottom slabs at y + h), and one lantern hanging from the canopy beside the pier (x + 1). Footprint: 3x3 by h + 1.
 */
export function canopyPier(g, [x, y, z], h, o = {}) {
  const box = { x0: x - 1, x1: x + 1, y0: y, y1: y + h, z0: z - 1, z1: z + 1 };
  const w = writer(g, box, o.over);
  for (let yy = y; yy < y + h; yy++) w.set(x, yy, z, ...B.pillar("quartz_pillar", "y"));
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    w.set(x + dx, y + h, z + dz, ...B.slab("quartz", "bottom"));
  }
  w.set(x + 1, y + h - 1, z, ...B.lantern(true));
  return w.out;
}

/**
 * An aircraft light: redstone_lamp lit at [x, y, z], red_stained_glass on its four sides at the same level and on top.
 * The lamp's base cell must rest on something already built (the caller's). Footprint: 3x3 by 2.
 */
export function aircraftLight(g, [x, y, z], o = {}) {
  const box = { x0: x - 1, x1: x + 1, y0: y, y1: y + 1, z0: z - 1, z1: z + 1 };
  const w = writer(g, box, o.over);
  w.set(x, y, z, "redstone_lamp", { lit: "true" });
  for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) w.set(x + dx, y, z + dz, "red_stained_glass");
  w.set(x, y + 1, z, "red_stained_glass");
  return w.out;
}

/**
 * A street storey set back from a face: quartz_pillar colonnade on the face plane every pierEvery cells, clear glass
 * `setback` cells back, a door bay every doorEvery cells (frame, door both halves facing out, glass transom), and a
 * warm sea_lantern ceiling strip one cell behind the glass along the top row y1.
 * box = the storey band: its face plane is the face's own edge, depth runs setback + 1 cells in from it.
 * o: { setback = 2, pierEvery = 6, doorEvery = 12, wood = "birch", over }.
 */
export function shopFront(g, face, box, o = {}) {
  const { setback = 2, pierEvery = 6, doorEvery = 12, wood = "birch", over = false } = o;
  const { y0, y1 } = box;
  const w = writer(g, box, over);
  const a0 = alongStart(face, box);
  for (let a = a0; a <= alongEnd(face, box); a++) {
    const off = a - a0, phase = off % doorEvery, inDoor = phase >= 2 && phase <= 5;
    for (let y = y0; y <= y1; y++) {
      if (off % pierEvery === 0) w.set(...cellAt(face, box, a, y, 0), ...B.pillar("quartz_pillar", "y"));
      if (inDoor) {
        if (phase === 2 || phase === 5) {
          if (y <= y0 + 2) w.set(...cellAt(face, box, a, y, setback), "smooth_quartz");
        } else if (phase === 3 && y <= y0 + 1) {
          w.set(...cellAt(face, box, a, y, setback), ...B.door(wood, face, y === y0 ? "lower" : "upper", "left"));
        } else if (phase === 4 || y === y0 + 2) {
          w.set(...cellAt(face, box, a, y, setback), "glass");
        }
      } else {
        w.set(...cellAt(face, box, a, y, setback), "glass");
      }
    }
    if (!inDoor && off % 3 === 0) w.set(...cellAt(face, box, a, y1, setback + 1), "sea_lantern");
  }
  return w.out;
}

/**
 * A flat soffit at box.y0 (= box.y1): smooth_quartz underside over the box, sea_lantern flush every 4 cells both ways
 * from the box's corner. Use it for cantilever undersides.
 */
export function soffit(g, box, o = {}) {
  const w = writer(g, box, o.over);
  for (let x = box.x0; x <= box.x1; x++) for (let z = box.z0; z <= box.z1; z++) {
    const lamp = (x - box.x0) % 4 === 0 && (z - box.z0) % 4 === 0;
    for (let y = box.y0; y <= box.y1; y++) w.set(x, y, z, lamp ? "sea_lantern" : "smooth_quartz");
  }
  return w.out;
}

/**
 * An open pergola over box: quartz_pillar posts on the edges at the corners and every 4 cells (from y0 to y1 - 1),
 * an open birch_trapdoor lattice on every second column at the roof level y1, and lanterns hanging under a quartz_slab
 * beam at every fourth cell pair (the slab is what the lantern hangs from). Footprint: box.
 */
export function pergola(g, box, o = {}) {
  const { x0, x1, y0, y1, z0, z1 } = box;
  const w = writer(g, box, o.over);
  const at4 = (v, v0, v1) => (v - v0) % 4 === 0 || v === v1;
  const postAt = (x, z) => {
    if (z === z0 || z === z1) return at4(x, x0, x1);
    if (x === x0 || x === x1) return at4(z, z0, z1);
    return false;
  };
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (postAt(x, z)) for (let y = y0; y < y1; y++) w.set(x, y, z, ...B.pillar("quartz_pillar", "y"));
    const beam = (x - x0) % 4 === 2 && (z - z0) % 4 === 2;
    if (beam) {
      w.set(x, y1, z, ...B.slab("quartz", "bottom"));
      w.set(x, y1 - 1, z, ...B.lantern(true));
    } else if ((x - x0) % 2 === 0) {
      w.set(x, y1, z, ...B.trapdoor("birch", "north", "bottom", true));
    }
  }
  return w.out;
}

/**
 * A covered walk: quartz_pillar piers on the two long sides (x0 and x1) every 6 cells along z (from z0, and at z1),
 * from y0 + 1 up to y1 - 2; a smooth_quartz canopy across the whole box at y1 - 1, with a smooth_quartz_slab cap at y1;
 * lanterns hung from the canopy every 6 cells along z on the middle line. y0 is the floor block (left alone).
 */
export function coveredWalk(g, box, o = {}) {
  const { x0, x1, y0, y1, z0, z1 } = box;
  const w = writer(g, box, o.over);
  const piers = [];
  for (let z = z0; z <= z1; z += 6) piers.push(z);
  if (piers.at(-1) !== z1) piers.push(z1);
  for (const z of piers) for (const x of [x0, x1]) {
    for (let y = y0 + 1; y <= y1 - 2; y++) w.set(x, y, z, ...B.pillar("quartz_pillar", "y"));
  }
  const xm = x0 + Math.floor((x1 - x0) / 2);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    w.set(x, y1 - 1, z, "smooth_quartz");
    w.set(x, y1, z, ...B.slab("smooth_quartz", "bottom"));
  }
  for (let z = z0; z <= z1; z += 6) w.set(xm, y1 - 2, z, ...B.lantern(true));
  return w.out;
}

/**
 * The arc cells of a rounded shaft corner: cells whose distance from the arc centre (cx, cz) rounds to r, in the quadrant
 * of the given corner ('nw' | 'ne' | 'sw' | 'se': the arc bows toward that corner). Returns [[x, z], ...] from one end of
 * the arc to the other. Pure: writes nothing. Used for the rib cells on the curve (every cell).
 */
export function roundedPlan(cx, cz, r, corner) {
  const dirZ = corner[0] === "s" ? 1 : -1, dirX = corner[1] === "e" ? 1 : -1;
  const cells = new Map();
  for (let a = 0; a <= r; a++) for (let b = 0; b <= r; b++) {
    if (Math.round(Math.hypot(a, b)) !== r) continue;
    cells.set(`${a},${b}`, [cx + dirX * a, cz + dirZ * b, Math.atan2(b, a)]);
  }
  return [...cells.values()].sort((p, q) => q[2] - p[2]).map(([x, z]) => [x, z]);
}

/**
 * An observatory lantern: decks (smooth_stone floors) at y0 and y0 + 14, ceiling grid of shroomlight / ochre_froglight
 * every 3 cells at y0 + 13 and y1, white_stained_glass one cell in behind the outer ring, and the outer ring as a rib
 * cage of white_concrete on every second cell, up to ribTop (default y1 + 5). Footprint: box, with y1 raised to ribTop.
 */
export function observatory(g, box, o = {}) {
  const { x0, x1, y0, y1, z0, z1 } = box;
  const ribTop = o.ribTop ?? y1 + 5;
  const w = writer(g, { ...box, y1: ribTop }, o.over);
  const decks = [y0, y0 + 14];
  const inside = (x, z) => x > x0 && x < x1 && z > z0 && z < z1;
  for (const y of decks) for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++) w.set(x, y, z, "smooth_stone");
  for (const y of [y0 + 13, y1]) {
    for (let x = x0 + 2; x < x1 - 1; x += 3) for (let z = z0 + 2; z < z1 - 1; z += 3) {
      const k = (x - x0 - 2) / 3 + (z - z0 - 2) / 3;
      w.set(x, y, z, k % 2 ? "ochre_froglight" : "shroomlight");
    }
  }
  for (let y = y0; y <= y1; y++) {
    if (decks.includes(y)) continue;
    for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++) {
      if ((x === x0 + 1 || x === x1 - 1 || z === z0 + 1 || z === z1 - 1) && inside(x, z)) {
        w.set(x, y, z, "white_stained_glass");
      }
    }
  }
  for (let y = y0; y <= ribTop; y++) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const ring = x === x0 || x === x1 || z === z0 || z === z1;
      const offset = x === x0 || x === x1 ? z - z0 : x - x0;
      if (ring && offset % 2 === 0) w.set(x, y, z, "white_concrete");
    }
  }
  return w.out;
}
