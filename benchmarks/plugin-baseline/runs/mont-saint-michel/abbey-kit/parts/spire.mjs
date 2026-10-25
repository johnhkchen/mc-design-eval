// Part P3 "Spire and archangel": the spire on the crossing tower (plan.md ROOFS SPIRE, ANGEL), centre (55,64).
// The shell already puts the tower's balustrade (stone_brick walls) at y 99..100 round the shaft (x 49..61, z 58..70);
// the spire stands inside it, from y 99 to its needle top y 142, and the archangel stands on the column to y 151.
// Stages (octagon radius r, outline corners cut to s = r + floor(r/2), the octagon_ring outline):
//   lantern  r4  y 99..107 hollow, 8 glazed lancets y 101..105, cap y 108 (lamp hangs under it)
//   needle   r3  y 109..118, r2 y 119..128, r1 y 129..137 solid, crockets every 3rd course on the axis faces
//   column       y 138..142 (1x1), the archangel's pedestal at y 143
// Every write goes only into air: the shell's balustrade and shaft, and any earlier part, stay locked.
import {
  SPIRE_CENTER, SPIRE_BASE_Y, SPIRE_TOP_Y,
  crocket, pinnacle, archangel, lamp,
} from "../vocab.mjs";

const [CX, CZ] = SPIRE_CENTER;
// the four corner pinnacles on the tower's corners (the shell's balustrade corners); they stand on its y 100 top
const TOWER_CORNERS = [[49, 58], [61, 58], [49, 70], [61, 70]];
const PINNACLE_BASE_Y = SPIRE_BASE_Y + 2;
const PINNACLE_H = 12;
const LANTERN = { r: 4, y0: 99, y1: 107, cap: 108 };
const LANCET_Y = [101, 105];
const NEEDLE = [
  { r: 3, y0: 109, y1: 118 },
  { r: 2, y0: 119, y1: 128 },
  { r: 1, y0: 129, y1: 137 },
];

// the octagon of radius r: the same outline octagon_ring draws (corners cut to s = r + floor(r/2))
const sOf = (r) => r + Math.floor(r / 2);
const inside = (r, dx, dz) => Math.abs(dx) <= r && Math.abs(dz) <= r && Math.abs(dx) + Math.abs(dz) <= sOf(r);
const edge = (r, dx, dz) => inside(r, dx, dz) && (!inside(r, dx + 1, dz) || !inside(r, dx - 1, dz) || !inside(r, dx, dz + 1) || !inside(r, dx, dz - 1));
// an octagon vertex: an edge cell on the square's side where the two faces meet (the spire's ribs)
const vertex = (r, dx, dz) => edge(r, dx, dz) && Math.abs(dx) + Math.abs(dz) === sOf(r) && (Math.abs(dx) === r || Math.abs(dz) === r);

// Writes one block into air inside the spire's column; anything else is listed in `log.refused`.
function put(g, log, x, y, z, block, state = {}) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) { log.refused.push([x, y, z]); return; }
  g.set(x, y, z, block, state);
  log.placed++;
}

// One course of the octagon at height y: ring walls (body, ribs at the vertices), and the inside filled with `fill`
// (or left air when fill is null). lancet(dx, dz) -> a pane state for the glazed openings, which skip the body.
function course(g, log, r, y, { body, rib = null, fill = null, lancet = null }) {
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    const x = CX + dx, z = CZ + dz;
    if (!inside(r, dx, dz)) continue;
    if (edge(r, dx, dz)) {
      const pane = lancet ? lancet(dx, dz) : null;
      if (pane) put(g, log, x, y, z, "gray_stained_glass_pane", pane);
      else if (rib && r >= 2 && vertex(r, dx, dz)) put(g, log, x, y, z, rib);
      else put(g, log, x, y, z, body(y));
    } else if (fill) put(g, log, x, y, z, fill);
  }
}

// the axis-face and diagonal lancet centres of the lantern: glass panes connect along the face they sit in
const LANCETS = new Map([
  ["0,-4", { north: "false", south: "false", east: "true", west: "true" }],
  ["0,4", { north: "false", south: "false", east: "true", west: "true" }],
  ["4,0", { north: "true", south: "true", east: "false", west: "false" }],
  ["-4,0", { north: "true", south: "true", east: "false", west: "false" }],
  ["3,3", { north: "false", south: "false", east: "false", west: "false" }],
  ["-3,3", { north: "false", south: "false", east: "false", west: "false" }],
  ["3,-3", { north: "false", south: "false", east: "false", west: "false" }],
  ["-3,-3", { north: "false", south: "false", east: "false", west: "false" }],
]);
const lancetAt = (y) => (dx, dz) => (y >= LANCET_Y[0] && y <= LANCET_Y[1] ? LANCETS.get(`${dx},${dz}`) ?? null : null);

// courses alternate: dark deepslate tiles and polished deepslate, so the spire reads as courses, not a blob
const bodyAt = (y) => (y % 2 === 0 ? "deepslate_tiles" : "polished_deepslate");

export function build(g) {
  const log = { placed: 0, refused: [] };

  // corner pinnacles on the tower corners, standing on the shell's balustrade (y 100)
  for (const [x, z] of TOWER_CORNERS) {
    const res = pinnacle(g, x, PINNACLE_BASE_Y, z, PINNACLE_H);
    log.placed += res.placed ?? 0;
    for (const c of res.refused ?? []) log.refused.push(c);
  }

  // lantern stage: hollow octagon r4 with glazed lancets, then the cap that holds the needle
  for (let y = LANTERN.y0; y <= LANTERN.y1; y++) {
    course(g, log, LANTERN.r, y, { body: () => "polished_deepslate", lancet: lancetAt(y) });
  }
  course(g, log, LANTERN.r, LANTERN.cap, { body: () => "polished_deepslate", fill: "polished_deepslate" });
  // one lantern hangs under the cap (lit for dusk, the lancets glow)
  const lamps = lamp(g, CX, LANTERN.cap - 1, CZ, { hang: true });
  if (lamps.refused?.length) log.refused.push(...lamps.refused);

  // needle: solid octagons stepping in, with a rib at each vertex and crockets on the axis faces every 3rd course
  for (const { r, y0, y1 } of NEEDLE) {
    for (let y = y0; y <= y1; y++) {
      course(g, log, r, y, { body: bodyAt, rib: "polished_blackstone_wall", fill: "polished_deepslate" });
      if (y % 3 === 0 && r >= 2) {
        for (const [dx, dz, face] of [[0, -r - 1, "north"], [0, r + 1, "south"], [r + 1, 0, "east"], [-r - 1, 0, "west"]]) {
          const c = crocket(g, CX + dx, y, CZ + dz, face);
          for (const cell of c.refused ?? []) log.refused.push(cell);
        }
      }
    }
  }

  // column to the needle top, 1 x 1
  for (let y = NEEDLE[2].y1 + 1; y <= SPIRE_TOP_Y; y++) put(g, log, CX, y, CZ, "polished_deepslate");

  // St Michael on the column: pedestal at y 143, figure to ANGEL_TIP (y 151, the build's highest block)
  const angel = archangel(g, CX, CZ, SPIRE_TOP_Y + 1);
  for (const c of angel.refused ?? []) log.refused.push(c);
  log.placed += angel.placed ?? 0;

  if (log.refused.length) console.warn(`spire: ${log.refused.length} refused writes (not air)`);
  return log;
}
