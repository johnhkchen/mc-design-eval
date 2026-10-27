// Owner's v3 fix round: the east end (choir east of the transept + the apse) rebuilt, and the nave's flanks re-dressed with
// the same bay rhythm. Runs after towers-v2 and may replace cells. One cross-section, section(d, y), serves the flanks
// (d = |z - 37|, bays along x) and the polygonal chevet (d = distance to a 5-facet half-polygon round (150, 37), bays =
// facets), so aisles, chapels, piers and flyers run unbroken round the apse. Bands by d (south side; north mirrors):
//   0..8 vessel (air) | 9..10 clerestory wall, twin lancets under an oculus | 11..17 tribune lean-to | 18 tribune wall |
//   19..24 outer-aisle lean-to | 25 aisle wall | 26..29 chapel lean-to | 30..31 chapel wall, tracery window + gable |
//   32 pier faces. Piers (3 wide) run d 25..32 to y 40, set-offs at y 17 / 29, pinnacles to y 48; flyers from d 24 to d 11.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const MASK = [
".................##.##.......###......",
".####.#############################...",
"####################################..",
"#####################################.",
"#####################################.",
"#####################################.",
"######################################",
"######################################",
"######################################",
"#####################################.",
"#####################################.",
"####################################..",
"###################################...",
".####.###########################....."];
const inMask = (x, z) => x >= 0 && z >= 0 && MASK[Math.floor(z / 5)]?.[Math.floor(x / 5)] === "#";
const groundY = (x, z) => (x <= 34 ? 3 : z >= 48 && x >= 85 && x <= 170 && !(x >= 86 && x <= 104) ? 1 : 2);

const CX = 150, CZ = 37;
const FACETS = [-72, -36, 0, 36, 72];                 // apse facet normals (deg, 0 = east)
const CORNERS = [-54, -18, 18, 54];                   // chevet piers between the facets
const NAVE = { x0: 23, x1: 85, piers: [32, 41, 50, 59, 68, 77] };
const CHOIR = { x0: 105, x1: 149, piers: [114, 123, 132, 141, 150] };
const SS = "smooth_sandstone", CUT = "cut_sandstone", CHIS = "chiseled_sandstone", SW = "sandstone_wall";
const ESW = "end_stone_brick_wall", TILE = "deepslate_tiles", PANE = "blue_stained_glass_pane", HEAD = "purple_stained_glass_pane";
const ridgeY = (d) => 56 - d;                          // the nave's lead roof: pitch 1, ridge y 56, eave y 46 at d 10

const card = (vx, vz) => (Math.abs(vx) >= Math.abs(vz) ? (vx > 0 ? "east" : "west") : vz > 0 ? "south" : "north");
const rad = (a) => (a * Math.PI) / 180;

// Where a cell sits: d (band distance), u (along the face from the bay centre), inward cardinal, pier flag, bay half-width.
function locate(x, z) {
  const dx = x - CX, dz = z - CZ;
  if (x < CX) {
    const side = z >= CZ ? 1 : -1, d = Math.abs(dz);
    const span = x <= 85 ? NAVE : CHOIR;
    const pierAt = span.piers.find((p) => Math.abs(x - p) <= 1);
    // bay centre: midway between the pier lines (or the span's end and the first pier)
    const lines = [span.x0 - 1, ...span.piers.filter((p) => p < CX), span === CHOIR ? CX : span.x1 + 1];
    let c = 0, hw = 3;
    for (let i = 0; i + 1 < lines.length; i++) if (x > lines[i] && x < lines[i + 1]) { c = Math.round((lines[i] + lines[i + 1]) / 2); hw = Math.floor((lines[i + 1] - lines[i] - 4) / 2); }
    return { d, u: x - c, in: side > 0 ? "north" : "south", pier: pierAt !== undefined, ray: pierAt !== undefined ? x - pierAt : 9, hw, end: x === span.x0 };
  }
  // polygonal apse: the facet that gives the largest support distance (the ±90 normals continue the flanks)
  let best = -1e9, th = 0;
  for (const a of [...FACETS, 90, -90]) { const v = dx * Math.cos(rad(a)) + dz * Math.sin(rad(a)); if (v > best) { best = v; th = a; } }
  const d = best, u = -dx * Math.sin(rad(th)) + dz * Math.cos(rad(th));
  let ray = 9, pierA = null;
  for (const a of [...CORNERS, 90, -90]) {
    const along = dx * Math.cos(rad(a)) + dz * Math.sin(rad(a)), perp = -dx * Math.sin(rad(a)) + dz * Math.cos(rad(a));
    if (along > 0 && Math.abs(perp) < Math.abs(ray)) { ray = perp; pierA = a; }
  }
  const pier = Math.abs(ray) <= 1.2;
  const hwAt = Math.abs(th) === 90 ? 0 : Math.floor(Math.max(0, Math.round(d)) * Math.tan(rad(18)) - 1.5);
  return { d, u: Math.abs(th) === 90 ? 99 : u, in: card(-Math.cos(rad(th)), -Math.sin(rad(th))), pier, ray, pierA, hw: hwAt, th };
}

// twin lancets under an oculus (wide bays) or one lancet (narrow): "g" glass, "h" head glass, "s" stone tracery, null = wall
function clerestoryWin(u, y, hw) {
  if (hw >= 2) {
    const a = Math.abs(u);
    if (y >= 37 && y <= 40) return a === 0 ? "s" : a <= 2 ? "g" : null;
    if (y === 41) return a === 0 ? "s" : a === 1 ? "h" : a === 2 ? "s" : null;
    if (y === 43) return a <= 1 ? "h" : null;
    if (y === 42 || y === 44) return a === 0 ? "h" : a === 1 ? "s" : null;
    return null;
  }
  if (y >= 37 && y <= 42) return Math.abs(u) <= 1 ? (y >= 41 ? "h" : "g") : null;
  if (y === 43) return u === 0 ? "h" : null;
  return null;
}
// chapel tracery window, 5 wide y 6..16 (3 wide on narrow bays): mullion in the middle, pointed head
function chapelWin(u, y, hw) {
  const w = hw >= 2 ? 2 : 1, a = Math.abs(u);
  if (y >= 6 && y <= 13) return a <= w ? (a === 0 && w === 2 ? "s" : "g") : null;
  if (y === 14) return a <= w ? (a === 0 ? "s" : "h") : null;
  if (y === 15) return a <= w - 1 ? "h" : null;
  if (y === 16) return a === 0 ? "h" : null;
  return null;
}
const gableHW = [3, 2, 2, 1, 0];                       // y 18..22 half-widths of the chapel gables

export function fix(g) {
  const put = (x, y, z, b, s) => { if (inMask(x, z) && y < 139) g.set(x, y, z, b, s); };
  const isAir = (x, y, z) => g.isAir(x, y, z);
  const st = (f, half = "bottom") => B.stairs("smooth_sandstone", f, half);
  const opp = { north: "south", south: "north", east: "west", west: "east" };

  const inScope = (x, z) => {
    if (!inMask(x, z) || z > 69) return false;
    const L = locate(x, z);
    if (x >= NAVE.x0 && x <= NAVE.x1) return L.d >= 11 && L.d <= 32.5;   // nave: flanks only
    if (x >= 106 || (x === 105 && z >= 4 && z <= 65)) return L.d <= 32.5 || x >= CX;
    return false;
  };

  // ---- clear: the choir and apse (keep the east apostle and its ridge at x <= 106), the nave flanks
  for (const k of [...g.cells.keys()]) {
    const [x, y, z] = k.split(",").map(Number);
    if (y <= 3 || !(inScope(x, z) || (x >= 107 && z <= 69 && !inMask(x, z)))) continue;
    if (x <= 106 && y >= 55 && Math.abs(z - CZ) <= 1) continue;
    g.unset(x, y, z);
  }

  const cols = [];
  for (let x = 23; x <= 188; x++) for (let z = 0; z <= 69; z++) if (inScope(x, z)) cols.push([x, z]);

  for (const [x, z] of cols) {
    const L = locate(x, z), d = Math.round(L.d), inw = L.in, out = opp[inw];
    const nave = x <= NAVE.x1;
    // plinth and floor up to y 3, under every band
    for (let y = groundY(x, z) + 1; y <= 3; y++) put(x, y, z, y === 3 ? "polished_andesite" : "stone_bricks");
    if (d > 32) continue;
    const wallMat = (y) => (y <= 5 ? "stone_bricks" : y % 8 === 0 ? CUT : y < 12 && (x * 7 + z * 13 + y) % 9 === 0 ? "sandstone" : SS);

    // ---- piers: d 25..32, 3 wide, set-offs, pinnacle on top (centred on the ray, d 28)
    if (L.pier && d >= 25) {
      const top = d === 32 ? 15 : d === 31 ? 25 : d >= 29 ? 33 : 40;
      const panel = (y) => Math.abs(L.ray) > 0.6 && (d === 26 || d === 27) && y >= 6 && y <= 34 && [6, 7, 0, 1, 2].includes(y % 8);
      for (let y = 4; y <= top; y++) if (!panel(y)) put(x, y, z, y <= 5 ? "stone_bricks" : y % 8 === 4 ? CUT : y === 31 && d === 30 && Math.abs(L.ray) < 0.6 ? CHIS : SS);
      if (d >= 29) put(x, top + 1, z, ...st(inw));
      if (d === 32 && Math.abs(L.ray) < 0.6) put(x, 3, z, "ochre_froglight");   // floodlight at the pier foot
      continue;
    }
    // the clerestory's pier strips (where the flyers land), proud one at d 11
    if (L.pier && d === 11 && !nave) { for (let y = 36; y <= 41; y++) put(x, y, z, SS); }

    if (!nave && d <= 8) continue;                                  // the vessel: open
    if (!nave && d <= 10) {                                         // clerestory, 2 thick, deep reveal
      for (let y = 4; y <= 45; y++) {
        const w = L.pier ? null : clerestoryWin(L.u, y, L.hw);
        if (w && d === 10) continue;                                  // reveal: the front layer left open
        if (w) { put(x, y, z, ...(w === "s" ? [CHIS] : B.pane(w === "h" ? HEAD : PANE))); continue; }
        put(x, y, z, y === 36 || y === 45 ? CUT : wallMat(y));
      }
      if (d === 10 && !L.pier && L.hw >= 0) { const h = clerestoryWin(L.u, 44, L.hw) || clerestoryWin(L.u, 43, L.hw); if (!h) put(x, 45, z, CUT); }
      continue;
    }
    if (d === 11 && !nave) { put(x, 45, z, CUT); put(x, 46, z, ...B.wall("sandstone")); }   // eave cornice + balustrade
    if (d >= 11 && d <= 17) {                                        // tribune lean-to, slabs
      const T = 36.5 - (d - 11) / 4;
      for (let y = 33; y < Math.floor(T); y++) put(x, y, z, TILE);
      put(x, Math.floor(T), z, ...B.slab("deepslate_tile"));
    } else if (d === 18) {                                           // tribune wall, small round-headed window per bay
      for (let y = 4; y <= 33; y++) {
        if (Math.abs(L.u) <= 1 && y >= 29 && y <= 31) { put(x, y, z, ...B.pane(y === 31 ? HEAD : PANE)); continue; }
        if (L.u === 0 && y === 32) { put(x, y, z, ...st(out, "top")); continue; }
        put(x, y, z, y === 33 || y === 28 ? CUT : wallMat(y));
      }
      put(x, 34, z, ...st(inw));
    } else if (d >= 19 && d <= 24) {                                 // outer aisle lean-to
      const T = 28.5 - (d - 19) / 2;
      for (let y = 25; y < Math.floor(T); y++) put(x, y, z, TILE);
      put(x, Math.floor(T), z, ...B.slab("deepslate_tile"));
    } else if (d === 25) {                                           // aisle wall, cornice
      for (let y = 4; y <= 24; y++) put(x, y, z, y === 24 ? CUT : y === 22 && Math.abs(L.u) <= 1 ? "polished_andesite" : wallMat(y));
    } else if (d >= 26 && d <= 29) {                                 // chapel lean-to behind the gables
      const T = 21.5 - (d - 26) / 2;
      for (let y = 18; y < Math.floor(T); y++) put(x, y, z, TILE);
      put(x, Math.floor(T), z, ...B.slab("deepslate_tile"));
    } else if (d === 30 || d === 31) {                               // chapel wall: tracery window, cornice, gable, parapet
      for (let y = 4; y <= 17; y++) {
        const w = chapelWin(L.u, y, L.hw);
        if (w && d === 31) continue;
        if (w) { put(x, y, z, ...(w === "s" ? [SW] : B.pane(w === "h" ? HEAD : PANE))); continue; }
        // the arch's voussoirs round the opening at the front
        if (d === 31 && (chapelWin(L.u, y - 1, L.hw) || chapelWin(L.u + 1, y, L.hw) || chapelWin(L.u - 1, y, L.hw)) && y >= 14) { put(x, y, z, CUT); continue; }
        put(x, y, z, y === 17 ? CUT : wallMat(y));
      }
      // gable over the window (crocketed edges), else the pierced parapet
      let gable = false;
      for (let i = 0; i < gableHW.length; i++) {
        const y = 18 + i, a = Math.abs(L.u), hw = gableHW[i];
        if (a > hw || L.hw < 1) continue;
        gable = true;
        if (d === 30) { put(x, y, z, SS); continue; }
        if (a === hw && hw > 0) put(x, y, z, ...st(L.u < 0 ? (Math.abs(L.th ?? 90) === 90 ? "east" : card(Math.sin(rad(L.th)), -Math.cos(rad(L.th)))) : (Math.abs(L.th ?? 90) === 90 ? "west" : card(-Math.sin(rad(L.th)), Math.cos(rad(L.th))))));
        else put(x, y, z, i === 1 && L.u === 0 ? CHIS : SS);
      }
      if (gable && d === 31 && L.u === 0) put(x, 23, z, ...B.wall("end_stone_brick"));
      if (!gable && d === 31) put(x, 18, z, ...B.wall("sandstone"));
      if (!gable && d === 30) put(x, 18, z, TILE);
    } else if (d === 32) {                                           // cornice lip in front of the chapel wall
      if (!L.pier) put(x, 17, z, ...st(inw, "top"));
    }
  }

  // ---- the choir and apse roof: pitch 1 from the eave (d 10, y 46) to the ridge y 56, hipped round the polygon
  for (const [x, z] of cols) {
    if (x <= NAVE.x1) continue;
    const L = locate(x, z); if (L.d > 10.5) continue;
    const H = ridgeY(Math.max(0, L.d)), top = Math.round(H);
    for (let y = 46; y < top; y++) if (isAir(x, y, z)) put(x, y, z, TILE);
    if (!isAir(x, top, z)) continue;
    const ridge = (x < CX && Math.abs(z - CZ) === 0) || (x >= CX && L.d < 0.6);
    // hip lines: two facets nearly equal
    let hip = false;
    if (x >= CX) { const v = [...FACETS, 90, -90].map((a) => (x - CX) * Math.cos(rad(a)) + (z - CZ) * Math.sin(rad(a))).sort((p, q) => q - p); hip = v[0] - v[1] < 0.7; }
    if (ridge || hip) { put(x, top, z, "polished_deepslate"); if (ridge && x < CX && x % 2 === 0) put(x, top + 1, z, "iron_bars"); }
    else put(x, top, z, ...B.stairs("deepslate_tile", L.in));
  }
  // the eave's overhang course at d 11 behind the balustrade is the balustrade itself; the finial at the ridge's east tip
  put(CX, 57, CZ, "polished_deepslate"); put(CX, 58, CZ, ...B.wall("polished_deepslate")); put(CX, 59, CZ, ...B.wall("polished_deepslate"));
  put(CX, 59, CZ - 1, "iron_bars"); put(CX, 59, CZ + 1, "iron_bars"); put(CX, 60, CZ, "lightning_rod");

  // ---- pinnacles on every pier: 3x3 cap y 41..42, crocket corners, spike to y 47, lightning_rod finial y 48
  const pinnacle = (px, pz) => {
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      put(px + a, 41, pz + b, SS); put(px + a, 42, pz + b, a === 0 && b === 0 ? CHIS : a && b ? SS : CUT);
      if (a && b) { put(px + a, 43, pz + b, ...B.wall("end_stone_brick")); put(px + a, 44, pz + b, ...B.wall("end_stone_brick")); }
    }
    put(px, 43, pz, "end_stone_bricks"); for (let y = 44; y <= 47; y++) put(px, y, pz, ...B.wall("end_stone_brick")); put(px, 48, pz, "lightning_rod");
  };
  // ---- flyers: one block thick, from the pier's inner face (d 24) to the clerestory (d 11): coping stairs on a straight
  // slope y 40 -> 44, a quarter-arc soffit of upside-down stairs, open air under it down to the aisle roofs
  const flyerCell = (x, z, d, inw) => {
    const t = (24 - d) / 13, yT = Math.round(40 + 4 * t), yB = Math.min(yT - 1, Math.round(32 + 10 * Math.sin((t * Math.PI) / 2)));
    for (let y = yB; y <= yT; y++) {
      if (y === yT) put(x, y, z, ...st(inw));
      else if (y === yB) put(x, y, z, ...st(opp[inw], "top"));
      else put(x, y, z, SS);
    }
  };
  for (const span of [NAVE, CHOIR]) for (const p of span.piers) for (const side of [1, -1]) {
    const pz = CZ + side * 27;
    pinnacle(p, pz);
    if (p === CX) continue;                                   // the ±90 pier: the apse's own flyers handle the corner
    for (let d = 11; d <= 24; d++) flyerCell(p, CZ + side * d, d, side > 0 ? "north" : "south");
  }
  for (const a of [...CORNERS, 90, -90]) {
    const c = Math.cos(rad(a)), s = Math.sin(rad(a));
    pinnacle(Math.round(CX + 28 * c), Math.round(CZ + 28 * s));
    if (Math.abs(a) === 90) continue;
    const seen = new Set();
    for (let r = 11; r <= 25.5; r += 0.25) {
      const x = Math.round(CX + r * c), z = Math.round(CZ + r * s), k = `${x},${z}`;
      if (seen.has(k)) continue; seen.add(k);
      const L = locate(x, z), d = Math.max(11, Math.min(24, L.d));
      if (L.d > 24.5) continue;
      flyerCell(x, z, d, card(-c, -s));
    }
  }
  // the 90° corner piers: a flyer to the choir's last bay (x 150, d 24 -> 11), as along the flanks
  for (const side of [1, -1]) for (let d = 11; d <= 24; d++) flyerCell(CX, CZ + side * d, d, side > 0 ? "north" : "south");

  // ---- light behind the glass (the cleared choir lost the finish part's lamps): lanterns hung on chains down the
  // choir's centre line from the roof, and one standing lantern on the floor of every chapel bay
  for (let x = 108; x <= 156; x += 6) {
    for (let y = 40; y <= 45; y++) if (isAir(x, y, CZ)) put(x, y, CZ, ...B.chain("y", false));
    if (isAir(x, 39, CZ)) put(x, 39, CZ, ...B.lantern(true));
  }
  for (const [x, z] of cols) {
    const L = locate(x, z);
    if (Math.round(L.d) === 28 && Math.abs(L.u) < 0.5 && !L.pier && isAir(x, 4, z)) put(x, 4, z, ...B.lantern(false));
  }

}
