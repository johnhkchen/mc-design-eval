// Inspectorate / Permit Office — PASS 1: FORM, FRONT ONLY.
// Front faces NORTH (-z). Tracing column c (left to right as drawn) is world x = W-1-c (mirror trap).
// The front is symmetric about the centre line, so it is authored as ONE HALF (m = distance from the nearest edge,
// m=0 outermost .. m=12 centre pair) and mirrored; the tracing's colour noise is read only for wall-texture mixes.
// Structure: front() = the front face and its relief (the next pass must not need to touch it);
//            body()  = plain volume (side walls, back, flat deck, hip roof stub) that the next pass redesigns.
import fs from "node:fs";
import { Grid } from "../../../../../minecraft-design/tools/src/build.mjs";

const HERE = new URL(".", import.meta.url).pathname;
const OUT = HERE + "round-2.nbt";
const W = 26, H = 19, D = 27;
const ZW = 3;            // main wall plane (depth 0). Relief d: proud +d => z = ZW - d; recessed -d => z = ZW + d
const ZSLAB = 6;         // front slab runs from the cell's front face back to z=6 (4 thick at the wall plane)
const ZBACK = 24;        // back wall
const g = new Grid([W, H, D]);

// ---- trace colours (texture mixes only) -------------------------------------------------------------------------
const trace = {};
for (const l of fs.readFileSync(HERE + "trace.txt", "utf8").split("\n")) {
  const m = l.match(/^y(\d+)\s+(.*)$/);
  if (m) trace[+m[1]] = m[2].trim().split(/\s+/).map((h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)));
}
const hash = (x, y, z = 0) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---- materials by role (spec.md MATERIAL MAP) -------------------------------------------------------------------
const WALL = (x, y) => { const r = hash(x, y); return r < 0.22 ? "cracked_deepslate_bricks" : "deepslate_bricks"; };
const PLINTH = (x, y) => { const r = hash(x, y, 7); return r < 0.14 ? "cracked_deepslate_bricks" : r < 0.26 ? "mossy_stone_bricks" : "deepslate_bricks"; };
const R = {
  roof: "deepslate_tiles", ds: "deepslate_bricks", dsc: "cracked_deepslate_bricks", pbb: "polished_blackstone_bricks",
  stone: "stone_bricks", pa: "polished_andesite", oak: "stripped_oak_log", doak: "dark_oak_planks",
  quartz: "smooth_quartz", qb: "quartz_bricks", qp: "quartz_pillar", glass: "light_blue_stained_glass_pane",
  capblue: "light_blue_concrete", chisel: "chiseled_stone_bricks", gold: "gold_block", moss: "moss_block",
  msb: "mossy_stone_bricks", azalea: "flowering_azalea_leaves", barrel: "barrel", black: "black_concrete",
};
const stateOf = (b) => (b === R.oak || b === R.qp ? { axis: "y" } : b === R.barrel ? { facing: "north", open: "false" }
  : b === R.glass ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : undefined);
const put = (x, y, z, b) => g.set(x, y, z, b, stateOf(b));
const air = (x, y, z) => g.set(x, y, z, "air");

// ---- the front: one half-column table (m = 0..12), rows y = 0..18 ----------------------------------------------
// cell(m, y) -> null (air) | { b: block, d: depth (+ proud / - recessed), kind?: "solid"|"glass"|"window"|"door"|"plant" }
const S = (b, d = 0, kind = "solid") => ({ b, d, kind });
function cell(m, y, x) {
  const tr = trace[y]?.[m];
  const wall = () => S(WALL(x, y));
  // y0: plinth, 26 wide
  if (y === 0) return S(PLINTH(x, y));
  // y1: plinth course (24 wide), moss at the corner, steps in the centre
  if (y === 1) {
    if (m === 0) return null;
    if (m === 1) return S(R.moss, 1);
    if (m <= 3) return S(R.msb);
    if (m >= 10) return S(R.quartz, 2);                 // step 1 (project 2)
    return S(PLINTH(x, y));
  }
  // y2: sills / planter ledges, barrels, steps
  if (y === 2) {
    if (m === 0) return null;
    if (m === 1) return S(R.azalea, 1);
    if (m <= 3) return S(PLINTH(x, y));
    if (m <= 7) return S(R.quartz, 1);                  // arcade sill/planter ledge
    if (m === 8) return S(R.qb);
    if (m === 9) return S(R.barrel, 1);
    return S(R.quartz, 1);                              // step 2
  }
  // y3..y7: the quartz arcade storey
  if (y >= 3 && y <= 7) {
    if (m <= 1) return null;                            // banners / lantern brackets hang here: detail pass
    const a = y - 3;                                    // 0..4 above the sill
    if (m <= 3) return S(y === 3 ? R.qb : R.qp, 1);     // corner pier, 2 wide, proud 1
    if (m <= 7) {                                       // side arch, 4 wide at y3-6, 2 wide at y7 (stepped arch head)
      if (y === 7) return (m === 5 || m === 6) ? S(R.glass, -2, "glass") : S(R.quartz, 0);
      if (y === 3 && m !== 6) return S(R.glass, -2, "glass");   // planters stand in front (placed separately)
      return S(R.glass, -2, "glass");
    }
    if (m === 8) return S(y === 7 ? R.qb : R.quartz, -1);       // arch reveal, 1 deep
    if (m === 9) return y === 7 ? S(R.qb, 1) : y === 3 ? S(R.quartz, 1) : S(R.qp, 1);   // pier between arches, proud 1
    if (y === 7) return S(R.qb, 1);                              // underside of the projecting sign
    if (m === 10) return y === 4 || y === 5 ? S(R.glass, 0, "glass") : S(R.quartz, 0);    // side lights
    if (m === 11) return y <= 4 ? S(R.doak, -1) : S(R.glass, -1, "glass");               // door jamb / transom edge
    // m === 12: the double doors, y3-4, dark oak header y5, glass transom y6
    return y === 3 ? S("dark_oak_door", -2, "door") : y === 4 ? S("dark_oak_door", -2, "door") : y === 5 ? S(R.doak, -2) : S(R.glass, -2, "glass");
  }
  // y8: sign face (centre, projects 2) and the arch-head band
  if (y === 8) {
    if (m <= 1) return null;
    if (m === 2) return S(R.pbb, 1);
    if (m <= 7) return S(R.qb, 0);
    if (m === 8) return S(R.capblue, 2);
    return S(R.quartz, 2);
  }
  // y9: string course across the whole body, proud 1
  if (y === 9) {
    if (m <= 1) return null;
    const k = tr ? (tr[0] > 0x90 && tr[0] - tr[2] > 0x30 ? R.oak : tr[0] + tr[1] + tr[2] < 3 * 0x62 ? R.pbb : (tr[0] + tr[1] + tr[2] > 3 * 0x84 ? R.pa : R.stone)) : R.stone;
    return S(k, 1);
  }
  // y10..y13: dark upper storey: oak pilasters, 2-wide windows (recessed 2), proud lintels, plaque
  if (y >= 10 && y <= 14) {
    if (m <= 1) return null;
    if (y === 14) {                                     // dentil frieze: oak dentils proud 1 between dark bricks
      if (m === 2 || m === 4) return S(R.oak, 1);
      if (m === 9) return S(R.pa, 1);
      if (m >= 10) return S(R.chisel, 1);               // plaque, upper row
      return S(WALL(x, y), 0);
    }
    if (m === 2 || m === 9 || m === 12) return S(R.oak, 1);   // pilasters (centre pair is the 2-wide centre pilaster)
    if (y === 13) {
      if (m === 5 || m === 6) return S(R.pa, 1);        // lintel over window A
      if (m === 7) return S(R.pbb, 1);
      if (m >= 10) return S(R.chisel, 1);               // plaque, lower row (x8-15 in the spec's frame)
      return wall();
    }
    if (m === 5 || m === 6 || m === 10 || m === 11) return S(R.glass, -2, "window");     // y10-12 windows
    if (m === 4) return S(R.pa, 0);
    return wall();
  }
  // y15: cornice, proud 1, 24 wide (x1..24)
  if (y === 15) {
    if (m === 0) return null;
    if (m === 8 || m === 9) return S(R.pbb, 1);
    if (m >= 10) return S(R.pa, 1);
    return S(R.stone, 1);
  }
  // y16..y18: roof stub, finial posts, pediment (x8..17 in the spec's frame)
  if (y === 16) {
    if (m === 2) return S(R.pbb, 1);
    if (m === 3) return S(R.msb, 1);
    if (m === 9) return S(R.oak, 1);
    if (m === 10) return S(R.stone, 1);                 // pediment rake
    if (m === 11) return S(R.ds, 0);                    // tympanum
    if (m === 12) return S(R.gold, 0);                  // gold cross (2x2)
    return null;                                        // hip roof fills m5..m8 (see body())
  }
  if (y === 17) {
    if (m === 9) return S(R.oak, 1);
    if (m === 11) return S(R.stone, 1);
    if (m === 12) return S(R.gold, 0);
    return null;
  }
  if (y === 18) {
    if (m === 9) return S(R.ds, 1);
    if (m === 12) return S(R.stone, 1);
    return null;
  }
  return null;
}

function front() {
  for (let c = 0; c < W; c++) {
    const m = Math.min(c, W - 1 - c), x = W - 1 - c;   // tracing column c -> world x (mirror trap)
    for (let y = 0; y < H; y++) {
      const k = cell(m, y, x);
      if (!k) continue;
      const zf = ZW - k.d;
      const thick = y === 0 ? ZSLAB : y >= 16 && m <= 3 ? zf + 1 : y >= 16 ? zf + 2 : ZSLAB;   // roof-level pieces are shallow
      if (k.kind === "glass") {
        put(x, y, zf, k.b); for (let z = zf + 1; z <= ZSLAB; z++) air(x, y, z);
      } else if (k.kind === "window") {
        put(x, y, zf, k.b); put(x, y, zf + 1, R.black);
      } else if (k.kind === "door") {
        const left = c === 12;                           // viewer's left door (world +x) hinges left
        g.set(x, y, zf, "dark_oak_door", { facing: "north", half: y === 3 ? "lower" : "upper", hinge: left ? "left" : "right", open: "false", powered: "false" });
        for (let z = zf + 1; z <= ZSLAB; z++) air(x, y, z);
      } else {
        for (let z = zf; z <= Math.max(thick, zf); z++) put(x, y, z, k.b);
      }
    }
  }
  // planters in front of the shopfront glass (barrel/azalea on the ledge), flowering azalea on the pier barrels
  for (const c of [4, 5, 7, 9, 16, 18, 20, 21]) put(W - 1 - c, 3, ZW - 1, R.azalea);
  // light backdrop behind the two side arches so the shopfront glass reads light blue (the centre stays open to the door)
  for (const c of [4, 5, 6, 7, 18, 19, 20, 21]) for (let y = 3; y <= 7; y++) if (cell(Math.min(c, W - 1 - c), y, 0)?.kind === "glass") put(W - 1 - c, y, ZSLAB + 1, R.quartz);
}

// ---- PASS 2: sides, back, roof (the front above is untouched) ----------------------------------------------------
// Side = west wall authored at d = distance in from the outer edge (d=0 is x=0 / x=25); mirrored to the east wall.
// Wall plane: west outer face x=2 (d=2), 2 thick (x=2,3). Proud elements at x=1. Front corner zone z<=6 belongs to front().
const SIDE = (d, y, z, b, st) => { put(d, y, z, b); put(W - 1 - d, y, z, b); if (st) { g.set(d, y, z, b, st); g.set(W - 1 - d, y, z, b, st); } };
const sput = (d, y, z, b, st) => { g.set(d, y, z, b, st); g.set(W - 1 - d, y, z, b, st); };
const PIERZ = (z) => (z >= 11 && z <= 12) || (z >= 17 && z <= 18) || z >= 23;
const BAYS = [7, 13, 19];                                 // 4-wide bays between piers: z g0..g0+3
const bayOf = (z) => BAYS.find((g0) => z >= g0 && z <= g0 + 3);
const PANE = "glass_pane";
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane along z (side walls)
const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // pane along x (back wall)
const logY = { axis: "y" };

function sides() {
  for (let z = 7; z <= 25; z++) {
    const g0 = bayOf(z), pier = PIERZ(z), wallZ = z <= ZBACK;
    if (wallZ) {
      // plinth courses y1-2 (2 thick) with a 1-proud ledge on y1
      for (const y of [1, 2]) for (const d of [2, 3]) SIDE(d, y, z, PLINTH(d * 3 + z, y));
      SIDE(1, 1, z, PLINTH(z, 5));
      // arcade storey y3-8
      if (pier) {
        for (let y = 3; y <= 7; y++) { sput(1, y, z, R.doak); sput(2, y, z, R.doak); sput(3, y, z, R.quartz); }
        sput(1, 8, z, R.qb); sput(2, 8, z, R.qb); sput(3, 8, z, R.qb);
      } else {
        const inner = z === g0 + 1 || z === g0 + 2;
        for (let y = 3; y <= 8; y++) {
          const open = y <= 6 || (y === 7 && inner);
          if (open) {                                       // carved by exclusion; glazing 2 back, light backdrop behind
            for (const d of [2, 3]) { SIDE(d, y, z, "air"); }
            sput(4, y, z, R.glass, paneZ);
            SIDE(5, y, z, R.quartz);
          } else for (const d of [2, 3]) SIDE(d, y, z, y === 8 ? R.qb : R.quartz);
        }
      }
      // y9 string course (2 thick + 1 proud)
      for (const d of [2, 3]) SIDE(d, 9, z, R.stone);
      SIDE(1, 9, z, PIERZ(z) ? R.pa : R.stone);
      // upper storey y10-14
      for (let y = 10; y <= 14; y++) for (const d of [2, 3]) SIDE(d, y, z, WALL(d * 5 + z, y));
      if (pier) {
        for (let y = 10; y <= 14; y++) { SIDE(1, y, z, R.oak); SIDE(2, y, z, R.oak); }
        for (let y = 10; y <= 14; y++) { sput(1, y, z, R.oak, logY); sput(2, y, z, R.oak, logY); }
      } else {
        const inner = z === g0 + 1 || z === g0 + 2;
        for (let y = 10; y <= 12; y++) {
          if (inner) { SIDE(2, y, z, "air"); sput(3, y, z, PANE, paneZ); SIDE(4, y, z, R.black); }
          else SIDE(2, y, z, R.pbb);                        // window frame, flush
        }
        SIDE(1, 13, z, R.pa);                               // lintel, proud 1
        if (z % 2 === 0) SIDE(1, 14, z, R.oak);              // dentils
        else SIDE(2, 14, z, R.stone);
      }
    }
  }
  // back corner pier/pilaster z=25 (proud of back wall) on the sides
  for (let y = 3; y <= 7; y++) { sput(1, y, 25, R.doak); sput(2, y, 25, R.doak); }
  for (let y = 10; y <= 14; y++) { sput(1, y, 25, R.oak, logY); sput(2, y, 25, R.oak, logY); }
  sput(1, 8, 25, R.qb); sput(2, 8, 25, R.qb); SIDE(1, 9, 25, R.pa); SIDE(2, 9, 25, R.stone);
}

function back() {
  const WINX = [5, 6, 10, 11, 14, 15, 19, 20], PILX = [9, 16], CEN = [12, 13];
  const winPair = (x) => WINX.includes(x);
  for (let x = 4; x <= 21; x++) {
    for (const y of [1, 2]) for (const z of [23, 24]) put(x, y, z, PLINTH(x, y + z));
    put(x, 1, 25, PLINTH(x, 41));
    for (let y = 3; y <= 8; y++) for (const z of [23, 24]) put(x, y, z, y === 8 ? R.qb : R.quartz);
    for (const z of [23, 24]) put(x, 9, z, R.stone);
    put(x, 9, 25, R.stone);
    for (let y = 10; y <= 14; y++) for (const z of [23, 24]) put(x, y, z, WALL(x * 7, y + z));
    if (PILX.includes(x) || CEN.includes(x)) {
      for (let y = 3; y <= 7; y++) if (!CEN.includes(x)) for (const z of [24, 25]) put(x, y, z, R.doak);
      if (!CEN.includes(x)) { put(x, 8, 25, R.qb); put(x, 9, 25, R.pa); }
      for (let y = 10; y <= 14; y++) for (const z of [24, 25]) put(x, y, z, R.oak, logY) , g.set(x, y, z, R.oak, logY);
    } else if (winPair(x)) {
      for (let y = 4; y <= 6; y++) { air(x, y, 24); put(x, y, 23, PANE); g.set(x, y, 23, PANE, paneX); put(x, y, 22, R.quartz); }
      for (let y = 10; y <= 12; y++) { air(x, y, 24); g.set(x, y, 23, PANE, paneX); put(x, y, 22, R.black); }
      put(x, 13, 25, R.pa);
      if (x % 2 === 0) put(x, 14, 25, R.oak);
    } else {
      if (x === 4 || x === 7 || x === 18 || x === 21) for (let y = 10; y <= 12; y++) put(x, y, 24, R.pbb);
      if (x % 2 === 0) put(x, 14, 25, R.oak);
    }
  }
  // back door x12-13 on the centre pier bay, with a two-step stoop
  for (const x of CEN) {
    air(x, 3, 24); air(x, 4, 24);
    g.set(x, 3, 24, "dark_oak_door", { facing: "south", half: "lower", hinge: x === 12 ? "left" : "right", open: "false", powered: "false" });
    g.set(x, 4, 24, "dark_oak_door", { facing: "south", half: "upper", hinge: x === 12 ? "left" : "right", open: "false", powered: "false" });
    put(x, 5, 24, R.doak); put(x, 5, 25, R.doak);
    put(x, 3, 23, "air"); put(x, 4, 23, "air");
    for (let y = 3; y <= 4; y++) { air(x, y, 25); }
  }
  for (let x = 11; x <= 14; x++) { put(x, 1, 25, R.quartz); put(x, 2, 25, R.quartz); put(x, 1, 26, R.quartz); }
  for (let y = 3; y <= 4; y++) for (const x of [11, 14]) put(x, y, 25, R.doak);   // door jambs proud
  for (const x of [12, 13]) put(x, 6, 24, R.glass), g.set(x, 6, 24, R.glass, paneX);
  put(12, 5, 25, R.doak); put(13, 5, 25, R.doak);
  // back corner pilasters x=2,23 are the sides' z=23..25 piers; add the corner caps and the back finials
  for (const d of [2, 3]) for (const z of [24, 25]) SIDE(d, 16, z, d === 2 ? R.pbb : R.msb);
  for (const x of PILX) { for (const z of [23, 24, 25]) { g.set(x, 16, z, R.oak, logY); g.set(x, 17, z, R.oak, logY); } put(x, 18, 25, R.ds); }
}

function deckAndRoof() {
  // plinth slab, deck and dentil-cornice ring (y15, x1..24, z2..25)
  for (let x = 0; x < W; x++) for (let z = ZW; z <= 26; z++) put(x, 0, z, PLINTH(x, z));
  for (let x = 1; x <= 24; x++) for (let z = 2; z <= 25; z++) put(x, 15, z, R.stone);
  // stepped hip, two full-block courses (y16-17); the pediment/finials in front() stand above it at the front
  for (let x = 4; x <= 21; x++) for (let z = 4; z <= 23; z++) put(x, 16, z, R.roof);
  for (let x = 6; x <= 19; x++) for (let z = 6; z <= 21; z++) put(x, 17, z, R.roof);
  // copper-capped chimney at the back, on the -x (right-when-facing-front) side
  for (let y = 16; y <= 17; y++) for (const x of [3, 4]) for (const z of [21, 22]) put(x, y, z, y === 17 ? R.dsc : R.ds);
  for (const x of [3, 4]) for (const z of [21, 22]) put(x, 18, z, "copper_block");
}

deckAndRoof();
sides();
back();
front();
g.save(OUT);
console.log(JSON.stringify({ saved: OUT, size: g.size }));
