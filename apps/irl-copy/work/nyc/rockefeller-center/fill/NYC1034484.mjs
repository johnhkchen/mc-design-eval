// 580 Fifth Avenue, 1927: a Commercial & Office building in the 1916 zoning setback idiom. A limestone-faced tower of
// about 37 storeys rises at the north (low z) end of the lot, stepping down through a shoulder and a podium to a
// one-storey line along the south edge. Lidar roofs are quantised to storeys (3 blocks) and median-filtered into flat
// tiers. Every column stands from y 0 (foundation up to its ground), so nothing floats. The street front is the east
// face (x 67, the Fifth Avenue side): granite base, a lobby with a bronze-look iron door at z 20 under a granite lintel.
// Piers of calcite divide steel-sash windows of light blue glass in bays of two. The inside is air behind the glass, with
// a floor slab at each storey line held up on a 4-block column grid. A few offices show glowstone behind the glass, a
// stepped crown with a lantern tops the tower centre, and a spruce water tower stands on the lower roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034484.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 68, Y = 124, Z = 27;
const EAST = X - 1, ENTRY_Z = 20;                  // the Fifth Avenue front and its door
const FOUND = "stone_bricks", BASE = "polished_granite", STONE = "calcite", FLOOR = "smooth_stone";
const CAP = "smooth_stone", GLASS = "light_blue_stained_glass_pane", COLUMN = "stone_bricks";
const k = (x, z) => `${x},${z}`;

const GROUND = new Map(), T0 = new Map();
for (const [x, z, gr, r] of cells) { GROUND.set(k(x, z), gr); T0.set(k(x, z), Math.max(3, Math.round(r / 3) * 3)); }
const foot = (x, z) => GROUND.has(k(x, z));

// Storey tiers: the lidar roof to the nearest storey, then a 3x3 median so one noisy return cannot cut a notch.
const med = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (foot(x + dx, z + dz)) v.push(T0.get(k(x + dx, z + dz)));
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = new Map();
for (const [x, z] of cells) T.set(k(x, z), med(x, z));

// Crown: the tower centre steps up 4 blocks over a 3x3 plinth, then a 1x1 shaft with a lantern on top.
const CROWN = [50, 6];
const crownOk = [-1, 0, 1].every((dz) => [-1, 0, 1].every((dx) => (T.get(k(CROWN[0] + dx, CROWN[1] + dz)) ?? 0) >= 105));
if (crownOk) {
  for (const dz of [-1, 0, 1]) for (const dx of [-1, 0, 1]) T.set(k(CROWN[0] + dx, CROWN[1] + dz), T.get(k(CROWN[0], CROWN[1])) + 4);
  T.set(k(CROWN[0], CROWN[1]), T.get(k(CROWN[0], CROWN[1])) + 6);
}

// Water tower: a 3x3 stone plinth, a spruce tank and a slat cover, on a flat 3x3 of the lower roofs nearest the middle.
const flat3 = (cx, cz) => {
  const t = T.get(k(cx, cz)); if (t === undefined || t < 21 || t > 60) return null;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!foot(cx + dx, cz + dz) || T.get(k(cx + dx, cz + dz)) !== t) return null;
  return t;
};
let tank = null;
for (let cz = 2; cz < Z - 2; cz++) for (let cx = 2; cx < X - 2; cx++) {
  const t = flat3(cx, cz); if (t === null) continue;
  const d = Math.abs(cx - 16) + Math.abs(cz - 22);
  if (!tank || d < tank.d) tank = { cx, cz, t, d };
}

const H = (x, z) => T.get(k(x, z)) ?? 0;                        // off the footprint is open ground: height 0
const exposure = (x, z, y) => ({ n: H(x, z - 1) <= y, s: H(x, z + 1) <= y, w: H(x - 1, z) <= y, e: H(x + 1, z) <= y });
const isColumn = (x, z) => x % 4 === 0 && z % 4 === 0;
const isEntry = (x, z, y, gr) => x === EAST && z === ENTRY_Z && (y === gr || y === gr + 1);

const g = new Voxels([X, Y, Z]);
for (const [x, z] of cells) {
  const gr = GROUND.get(k(x, z)), top = H(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);                                   // foundation: solid to the ground
  for (let y = gr; y < top; y++) {
    const { n, s, w, e } = exposure(x, z, y);
    const ez = n || s, ex = w || e, out = ez || ex;
    if (!out) {                                                                         // inside: floors on a column grid
      if (isColumn(x, z)) g.set(x, y, z, COLUMN);
      else if (y === gr || y === top - 1 || y % 3 === 0) g.set(x, y, z, FLOOR);
      continue;
    }
    if (y === top - 1) { g.set(x, y, z, CAP); continue; }                               // parapet
    if (y === top - 3) { g.set(x, y, z, STONE); continue; }                             // cornice
    if (x === EAST && z >= 18 && z <= 22 && y === 3) { g.set(x, y, z, BASE); continue; } // entrance lintel
    if (isEntry(x, z, y, gr)) {                                                         // the lobby door
      g.set(x, y, z, "iron_door", { facing: "east", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === gr) { g.set(x, y, z, BASE); continue; }                                   // granite base course
    if (y % 3 === 0) { g.set(x, y, z, FLOOR); continue; }                               // storey line
    if (ez && ex) { g.set(x, y, z, STONE); continue; }                                  // corner pier
    if (ez) { x % 3 === 0 ? g.set(x, y, z, STONE) : g.set(x, y, z, GLASS, { north: "false", south: "false", east: "true", west: "true" }); continue; }
    z % 3 === 0 ? g.set(x, y, z, STONE) : g.set(x, y, z, GLASS, { north: "true", south: "true", east: "false", west: "false" });
  }
}

// Lit offices: glowstone just inside the glass on scattered bays, never in a column or a floor.
for (const [x, z] of cells) {
  const gr = GROUND.get(k(x, z)), top = H(x, z);
  for (let y = gr + 1; y < top - 3; y++) {
    if (y % 3 === 0 || (x * 5 + y * 3 + z * 7) % 9 !== 0) continue;                   // about one bay in nine
    const { n, s, w, e } = exposure(x, z, y);
    const inward = n ? [x, z + 1] : s ? [x, z - 1] : w ? [x + 1, z] : e ? [x - 1, z] : null;
    if (!inward || !foot(...inward) || isColumn(...inward)) continue;
    const [ix, iz] = inward;
    if (Object.values(exposure(ix, iz, y)).some(Boolean) || H(ix, iz) <= y || g.get(ix, y, iz)) continue;
    if ((x * 5 + y * 3 + z * 7) % 9 === 0) g.set(ix, y, iz, "glowstone");
  }
}

// Lobby lanterns hang from the lobby ceiling, behind the glass.
g.set(EAST - 2, 2, ENTRY_Z - 1, "lantern", { hanging: "true" });
g.set(EAST - 2, 2, ENTRY_Z + 1, "lantern", { hanging: "true" });

// The crown's lantern.
if (crownOk) g.set(CROWN[0], T.get(k(CROWN[0], CROWN[1])) - 1, CROWN[1], "glowstone");

// Water tower on the lower roof.
if (tank) {
  const { cx, cz, t } = tank;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (let y = t; y < t + 4; y++) g.set(cx + dx, y, cz + dz, FOUND);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (let y = t + 4; y < t + 8; y++) g.set(cx + dx, y, cz + dz, "spruce_planks");
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) g.set(cx + dx, t + 8, cz + dz, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

const { blocks, palette } = g.save(`${DIR}/NYC1034484.nbt`);
console.log(`NYC1034484: ${blocks} blocks, ${palette} palette entries, tower top ${Math.max(...T.values())}, crown ${crownOk}, tank ${tank ? `${tank.cx},${tank.cz} at ${tank.t}` : "none"}`);
