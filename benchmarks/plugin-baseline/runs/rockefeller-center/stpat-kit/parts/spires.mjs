// Part "spires pinnacles flyers": openwork octagon spires on both west towers (lace every third course, crockets,
// lucarnes, crosses), the tower corner pinnacles, the buttress piers with their pinnacles, the nave and choir flying
// buttresses, and the fleche over the crossing. Every write goes into air only (earlier parts are locked).
import { spire_ring, spire_cross, crocket, lucarne, flyer, fleche } from "../vocab.mjs";

// Both west towers: the octagon centre is the tower's centre (x 5), z 8 north and z 32 south (plan.md SITE).
const SPIRES = [
  { cx: 5, cz: 8 },
  { cx: 5, cz: 32 },
];
const SPIRE_BASE = 44;   // the spire rises from the tower deck at y 44
const SPIRE_TIP = 87;    // the single-cell tip; the cross sits on it at y 88..93

// Octagon width by row: 9 (44..53), 7 (54..63), 5 (64..73), 3 (74..81), 1 (82..87) as in plan.md.
function widthAt(y) {
  return y <= 53 ? 9 : y <= 63 ? 7 : y <= 73 ? 5 : y <= 81 ? 3 : 1;
}

// Deterministic 0..1 value so the same cell always gets the same stone.
function hash(...n) {
  let h = 2166136261;
  for (const v of n) h = Math.imul(h ^ (v | 0), 16777619);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

// Writes only into air: an earlier part's cell is left alone.
function put(g, x, y, z, block, state = {}) {
  if (!g.isAir(x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

function spires(g) {
  for (const { cx, cz } of SPIRES) {
    // The octagon: rows of width 9..1. Two solid courses to every lace course (air between the posts).
    for (let y = SPIRE_BASE; y <= SPIRE_TIP; y++) {
      const w = widthAt(y), h = (w - 1) / 2;
      spire_ring(g, [[cx - 4, y, cz - 4], [cx + 4, y, cz + 4]], cx, cz, w, y, {
        lace: w > 1 && (y - SPIRE_BASE) % 3 === 2,
        phase: y % 2,
      });
      // Crockets on the octagon's edges every third solid course, on the cells beside each cut corner.
      if (w >= 5 && (y - SPIRE_BASE) % 3 === 0) {
        for (const [dx, dz] of [[h, h - 1], [h, -(h - 1)], [-h, h - 1], [-h, -(h - 1)], [h - 1, h], [-(h - 1), h], [h - 1, -h], [-(h - 1), -h]]) {
          const ox = Math.sign(dx) * (Math.abs(dx) === h ? 1 : 0);
          const oz = Math.sign(dz) * (Math.abs(dz) === h ? 1 : 0);
          const face = ox > 0 ? "east" : ox < 0 ? "west" : oz > 0 ? "south" : "north";
          crocket(g, cx + dx + ox, y, cz + dz + oz, face);
        }
      }
    }
    // Gabled lucarnes on the four cardinal faces of the 9-wide octagon (rows 46..50), one proud of each face.
    lucarne(g, cx, 46, "north", cz - 4);
    lucarne(g, cx, 46, "south", cz + 4);
    lucarne(g, cz, 46, "west", cx - 4);
    lucarne(g, cz, 46, "east", cx + 4);
    // The cross on the tip: shaft 88..92, arms at 91, end rod 93.
    spire_cross(g, [[cx - 1, 88, cz - 1], [cx + 1, 93, cz + 1]], cx, 88, cz);
  }
}

// Tower corner pinnacles: a 2x2 stone shaft from y 44 to 49, a 1x1 diorite shaft to 53 on the outer corner, rod at 54.
function towerPinnacles(g) {
  const corners = [
    [0, 3, 1, 1],    // north tower, north-west outer corner
    [10, 3, -1, 1],  // north tower, north-east
    [0, 13, 1, -1],  // north tower, south-west
    [10, 13, -1, -1],// north tower, south-east
    [0, 27, 1, 1],   // south tower, north-west
    [10, 27, -1, 1], // south tower, north-east
    [0, 37, 1, -1],  // south tower, south-west
    [10, 37, -1, -1],// south tower, south-east
  ];
  for (const [x, z, ix, iz] of corners) {
    for (let y = 44; y <= 49; y++)
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++) {
          const cx = x + ix * i, cz = z + iz * j;
          put(g, cx, y, cz, hash(cx, y, cz, 9) < 0.5 ? "diorite" : "calcite");
        }
    for (let y = 50; y <= 53; y++) put(g, x, y, z, "diorite_wall", { up: "true" });
    put(g, x, 54, z, "end_rod", { facing: "up" });
  }
}

// Buttress piers on the aisle outer walls (1 proud, y 0..22), each with a pinnacle on top (shaft 23..27, rod 28).
// The flyers spring from the pier tops at y 22; the pinnacles stand over them.
const NAVE_PIERS = [10, 16, 22, 28, 34, 40, 46];
const CHOIR_PIERS = [64, 70, 76];

function piers(g, xs, zOut) {
  for (const x of xs)
    for (let y = 0; y <= 22; y++) put(g, x, y, zOut, hash(x, y, zOut, 3) < 0.7 ? "diorite" : "calcite");
}

// A pinnacle on a pier top: diorite_wall shaft 23..28, end rod at 29, quartz crockets on the east and west sides only.
// The north and south sides stay clear: the flyer's coping lies on the aisle side at y 23.
function buttressPinnacle(g, x, z) {
  for (let y = 23; y <= 28; y++) put(g, x, y, z, "diorite_wall", { up: "true" });
  put(g, x, 29, z, "end_rod", { facing: "up" });
  for (const [dx, face] of [[1, "east"], [-1, "west"]]) crocket(g, x + dx, 25, z, face);
}

function buttresses(g) {
  // Nave: the aisle piers at z 3 (north) and z 37 (south); choir piers at z 5 and z 35.
  piers(g, NAVE_PIERS, 3);
  piers(g, NAVE_PIERS, 37);
  piers(g, CHOIR_PIERS, 5);
  piers(g, CHOIR_PIERS, 35);
  for (const x of NAVE_PIERS) {
    buttressPinnacle(g, x, 3);
    buttressPinnacle(g, x, 37);
  }
  for (const x of CHOIR_PIERS) {
    buttressPinnacle(g, x, 5);
    buttressPinnacle(g, x, 35);
  }
}

// Flying buttresses: from each pier top (y 22) over the aisle roof to the clerestory (y 30).
function flyers(g) {
  for (const x of NAVE_PIERS.slice(1, -1)) {
    flyer(g, [[x, 22, 4], [x, 31, 13]], x, 4, 22, 13, 30, "north");
    flyer(g, [[x, 22, 27], [x, 31, 36]], x, 36, 22, 27, 30, "south");
  }
  // The x 64 pier stands where the east transept rib crosses the choir aisle: that rib carries the load there.
  for (const x of CHOIR_PIERS.filter((x) => x !== 64)) {
    flyer(g, [[x, 22, 6], [x, 31, 13]], x, 6, 22, 13, 30, "north");
    flyer(g, [[x, 22, 27], [x, 31, 34]], x, 34, 22, 27, 30, "south");
  }
}

// Transept flyers run along x in the plane z = pierZ, from the aisle edge (x0, y0) up to the transept wall (x1, y1). The
// vocab flyer() runs along z only, so this is the same quarter-sine curve in the other direction.
function flyerX(g, pierZ, x0, y0, x1, y1, side) {
  const n = Math.abs(x1 - x0), dir = Math.sign(x1 - x0) || 1;
  const stair = { north: "north", south: "south", east: "east", west: "west" }[side];
  let prev = y0;
  for (let t = 0; t <= n; t++) {
    const y = Math.round(y0 + (y1 - y0) * Math.sin((Math.PI / 2) * (n ? t / n : 1)));
    const x = x0 + dir * t;
    for (let yy = Math.min(prev, y); yy <= Math.max(prev, y); yy++)
      put(g, x, yy, pierZ, "polished_diorite_stairs", { facing: stair, half: "top", shape: "straight", waterlogged: "false" });
    put(g, x, y + 1, pierZ, "polished_diorite_slab", { type: "bottom", waterlogged: "false" });
    prev = y;
  }
}

// Transepts: one rib per transept arm on each side, in the planes z 6 (north) and z 34 (south).
function transeptFlyers(g) {
  for (const z of [6, 34]) {
    flyerX(g, z, 39, 22, 46, 30, z < 20 ? "north" : "south");   // west transept aisle, rising east to the transept wall
    flyerX(g, z, 65, 22, 58, 30, z < 20 ? "north" : "south");   // east transept aisle, rising west
  }
}

// A slim spike: diorite_wall shaft from y0 to y1, an end rod on top; the roofline's bristle.
function spike(g, x, z, y0, y1) {
  for (let y = y0; y <= y1; y++) put(g, x, y, z, "diorite_wall", { up: "true" });
  put(g, x, y1 + 1, z, "end_rod", { facing: "up" });
}

// Sharper roofline: a pinnacle where each flyer lands, standing on the roof's eave course (y34) over the clerestory;
// the same at the transept flyers' heads; spirelets on the four transept stair turrets (flat tops at y42); spikes on the
// outer corners of the transept aisles' parapets.
function roofline(g) {
  for (const x of [...NAVE_PIERS.slice(1, -1), ...CHOIR_PIERS.filter((x) => x !== 64)]) {
    spike(g, x, 13, 35, 38);
    spike(g, x, 27, 35, 38);
  }
  for (const [x, z] of [[45, 6], [59, 6], [45, 34], [59, 34]]) spike(g, x, z, 35, 38);
  for (const tx of [45, 59]) for (const tz of [1, 39]) {
    spike(g, tx, tz, 43, 47);
    for (const [dx, dz, face] of [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]]) crocket(g, tx + dx, 43, tz + dz, face);
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) put(g, tx + dx, 43, tz + dz, "end_rod", { facing: "up" });
  }
  for (const [x, z] of [[39, 0], [65, 0], [39, 40], [65, 40]]) spike(g, x, z, 21, 24);
}

export function build(g) {
  roofline(g);
  flyers(g);
  transeptFlyers(g);
  buttresses(g);
  towerPinnacles(g);
  spires(g);
  fleche(g, [52, 42, 20]);
}
