// Phase 1 for the Antipolar expansion (the swamp south of Polarton): the land reclaimed the way the backswamps of New
// Orleans and the Dutch polders were.
//   - A LEVEE RING: crest a 5-wide street at Polarton's lane grade (y 2), banks at 1 in 2, riprap (rough stone) on the
//     swamp face where the water laps it, an earth core (clay/packed mud) under the crest.
//   - Inside, the water is pumped out and the floor lies at y -2, two blocks below the swamp. A SEEPAGE DITCH runs along
//     the levee's inner toe; DRAINAGE CANALS a block below the floor cross the polder to PUMP HOUSES on the east levee,
//     which lift the water over into the swamp; FIELD DITCHES level with the fields keep the farmland wet.
//   - MADE LAND: house lots raised a block on fill; the waterfront built out to street level behind timber bulkheads,
//     a plank boardwalk along it, finger piers at boat height.
//   - A dredged CHANNEL links the moorings to the boatyard's slipways (the dredged mud goes into the levees).
//   - STUBS: streets end where the district will grow (a fourth polder east, the island, the pasture, the west edge).
// Frame: the export antipolar_expansion_002_raw.nbt (its corner is Polarton's (18, 3, 64)); y is the export's own:
// water surface y 0, shore meadow y 1, lanes and levee crests y 2, plateau y 8, polder floor y -2. Below y 0 the
// export shows nothing, so works there stay inside the ring's own rectangle, where every block is set.
// Heights are TOP-BLOCK y; .5 = a bottom slab on top of that block.
import { readSite } from "./site.mjs";
import { slabProfile } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/terrain.mjs";

export const CREST = 2, FLOOR = -2, DECK = 1, WHARF = 2;
export const RING = { west: 14, east: 70, north: 44, south: 148 };
// inner bank: crest |d|<=2, then a block down every 2 cells to the floor; the seepage ditch at d = 9; floor from d = 10
const innerTop = (d) => (d <= 2 ? CREST : Math.max(FLOOR, CREST - Math.ceil((d - 2) / 2)));
const outerTop = (d) => (d <= 2 ? CREST : CREST - Math.ceil((d - 2) / 2));
const TOE = 9, IN0 = 10;
export const IN = { x0: RING.west + IN0, x1: RING.east - IN0, z0: RING.north + IN0, z1: RING.south - IN0 }; // x 24..60, z 54..138
export const LOWER_BOX = { x0: RING.west - 6, z0: RING.north - 6, x1: RING.east + 6, z1: RING.south + 6, y0: -4, y1: -1 };
// drainage canals (water y -3 on a bed at y -4, 3 wide) with a farm lane on their north bank
export const CANALS = [{ z: 84, lane: 80 }, { z: 114, lane: 110 }];
export const SPINE = { x: 42, half: 2 }; // the polder road, north to south down the middle

export const STREETS = [
  // Polarton's terrace road ends at (15..20, 28), top y 5, heading south: down to the ring's north-west corner
  { name: "terrace descent", startY: 5, endY: CREST, min: CREST, points: [[17.5, 28], [17.5, 33], [16.5, 38], [15, 42], [14, 44]] },
  { name: "north levee", ring: true, level: CREST, points: [[14, 44], [70, 44]] },
  { name: "west levee", ring: true, level: CREST, points: [[14, 44], [14, 148]] },
  { name: "east levee", ring: true, level: CREST, points: [[70, 44], [70, 148]] },
  { name: "south levee", ring: true, level: CREST, points: [[14, 148], [70, 148]] },
  // a dike street from the ring's north-east corner along the swamp's edge past the village's back; ends as a stub
  { name: "shore street", level: CREST, levee: true, stub: "east: the north levee of a fourth polder", points: [[70, 44], [72, 38], [76, 34], [90, 34], [120, 34]] },
  // the south levee carried on east past the boatyard; ends as a stub (turn north there for polder 4's east levee)
  { name: "south levee east", level: CREST, levee: true, stub: "east: polder 4's south levee, then north", points: [[70, 148], [95, 148], [118, 148]] },
  { name: "bluff road", startY: CREST, min: CREST, points: [[51, 148], [51, 153], [51, 158], [51, 165], [51, 172], [51, 177]] },
  { name: "plateau road west", level: 8, stub: "west: the export's edge", points: [[51, 177], [40, 177], [28, 177], [16, 177], [2, 177]] },
  { name: "plateau road east", startY: 8, points: [[51, 177], [62, 177], [74, 177], [86, 177]] },
  // down off the plateau's east end to the low pasture; ends at its gate as a stub
  { name: "pasture road", startY: 8, stub: "east: the low pasture and on", points: [[86, 177], [93, 175], [100, 171], [106, 168]] },
  // along the bluff's foot west from the bluff road, through the grove; a stub at the export's edge
  { name: "grove lane", startY: CREST, stub: "west: the export's edge", width: 3, points: [[49, 156], [40, 155], [28, 154], [14, 156], [2, 157]] },
];

export const AREAS = [
  { name: "faubourg", use: "houses on raised lots either side of the polder road (shotgun and creole cottages)", rect: [IN.x0, IN.z0, IN.x1, CANALS[0].lane - 1], color: [255, 170, 60] },
  { name: "fields", use: "cotton and corn on drained ground; field ditches every 9 rows keep the farmland wet", rect: [IN.x0, CANALS[0].z + 2, IN.x1, CANALS[1].lane - 1], color: [240, 230, 80] },
  { name: "rice beds", use: "paddies flooded a block deep behind low bunds (Farmer's Delight rice)", rect: [IN.x0, CANALS[1].z + 2, IN.x1, IN.z1], color: [120, 220, 200] },
];
export const ZONES = [
  { name: "shore row", use: "houses on the meadow between Polarton's back fences and the north levee", rect: [21, 27, 66, 37], color: [255, 200, 120] },
  { name: "wetland", use: "kept: willows, mud flats and open water outside the levees", rect: [88, 52, 139, 127], color: [70, 160, 200], alpha: 0.1 },
  { name: "willow island", use: "the low island: a park; the island boardwalk crosses it", rect: [88, 70, 100, 98], color: [60, 200, 120] },
  { name: "landing", use: "a pirogue landing on the west levee's swamp side", rect: [1, 90, 7, 102], color: [120, 200, 230] },
  { name: "pump house 1", use: "lifts canal 1 over the east levee (a Create pump; a water wheel or steam engine to drive it)", rect: [61, 80, 67, 88], color: [200, 120, 255] },
  { name: "pump house 2", use: "lifts canal 2 over the east levee", rect: [61, 110, 67, 118], color: [200, 120, 255] },
  { name: "bluff grove", use: "the slope up to the plateau: pecan orchard (no earthworks)", rect: [0, 158, 44, 172], color: [170, 210, 90] },
  { name: "farmstead", use: "barn, granary and the farm family's house at the top of the bluff road", rect: [56, 160, 84, 174], color: [255, 120, 120] },
  { name: "fields west", use: "corn and cotton on the level plateau", rect: [0, 180, 46, 194], color: [240, 230, 80] },
  { name: "fields east", use: "tobacco and a curing-barn plot", rect: [56, 180, 92, 194], color: [240, 200, 60] },
  { name: "low pasture", use: "the wet meadow south-east: pasture and hay, ground left as it is", rect: [108, 152, 139, 194], color: [150, 230, 120] },
];
// the fleet: boats of the period (1880-1930) that draw little water, and where each lies
export const FLEET = [
  { boat: "cypress flatboat (cargo barge)", size: "5 x 14", where: "the distillery's and brewhouse's piers", n: 3, note: "poled or towed; an open deck for cotton bales and barrels, a small cabin aft, a sweep oar" },
  { boat: "sternwheel towboat", size: "6 x 16", where: "the shore piers", n: 1, note: "a shallow bayou steamer: boiler and stack forward of the pilot house, the paddle wheel at the stern (a Create bearing can turn it)" },
  { boat: "quarter boat (houseboat)", size: "5 x 10", where: "the shore piers", n: 1, note: "quarters for the boat crews: a cabin on a barge hull, a porch at each end" },
  { boat: "bateau (plank skiff)", size: "2 x 6", where: "the east piers, the boatyard", n: 4, note: "flat-bottomed, square ends, oars or a pole" },
  { boat: "pirogue (cypress dugout)", size: "1 x 4", where: "the landing, the island", n: 6, note: "for the shallowest water: fishing, trapping, tending the rice beds' gates" },
  { boat: "flatboat hauled out", size: "5 x 14", where: "ways 1", n: 1, note: "on the cradle for caulking, a strake half re-planked" },
  { boat: "hull in frame", size: "2 x 6", where: "ways 2", n: 1, note: "ribs steamed and set, the bottom planked" },
];

const chaikin = (pts, n) => { for (let k = 0; k < n; k++) { const o = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const [p, q] = [pts[i], pts[i + 1]]; o.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]); } o.push(pts.at(-1)); pts = o; } return pts; };
const resample = (pts, step = 1) => { const o = [pts[0]]; let carry = 0; for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = step - carry; while (t <= L) { o.push([a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L]); t += step; } carry = L - (t - step); } if (Math.hypot(o.at(-1)[0] - pts.at(-1)[0], o.at(-1)[1] - pts.at(-1)[1]) > 0.3) o.push(pts.at(-1)); return o; };
const line = (pts) => resample(pts.length > 2 ? chaikin(pts, 3) : pts, 1);

export function computeLayout() {
  const site = readSite(), { X, Z, H } = site, K = (x, z) => `${x},${z}`;
  // T: per column { t: top y, surf, kind, water: y of a water surface on top, deck: planks on piles, riprap }
  const T = new Map(), set = (x, z, v, prio) => { if (x < 0 || z < 0 || x >= X || z >= Z) return; const o = T.get(K(x, z)); if (o && o.prio > prio) return; T.set(K(x, z), { ...v, prio, ...(v.deck && o && !o.deck ? { under: o.under ?? Math.floor(o.t) } : o?.under != null && v.deck ? { under: o.under } : {}) }); };
  const inRing = (x, z) => x > RING.west && x < RING.east && z > RING.north && z < RING.south;
  const ringD = (x, z) => { if (inRing(x, z)) return Math.min(x - RING.west, RING.east - x, z - RING.north, RING.south - z); return Math.max(RING.west - x, 0, x - RING.east, RING.north - z, 0, z - RING.south); };
  const wet = (x, z) => (H[z]?.[x] ?? 0) < 0;

  // ---- the ring: floor, inner banks, seepage ditch; outer banks with riprap where they meet the water ------------------
  for (let z = LOWER_BOX.z0; z <= LOWER_BOX.z1; z++) for (let x = LOWER_BOX.x0; x <= LOWER_BOX.x1; x++) {
    const d = ringD(x, z);
    if (inRing(x, z)) {
      if (d === TOE) set(x, z, { t: FLOOR - 1, surf: "dirt", water: FLOOR, kind: "seepage ditch" }, 1);
      else set(x, z, { t: d > TOE ? FLOOR : innerTop(d), surf: "grass_block", kind: d > TOE ? "floor" : "levee" }, d > TOE ? 0 : 1);
    } else if (d <= 6) { const t = outerTop(d), g = H[z]?.[x] ?? -99; if (t >= Math.max(0, g)) set(x, z, { t, surf: "grass_block", kind: "levee", riprap: t <= 1 && (wet(x, z) || d >= 5) }, 1); }
  }
  // ---- inside: drainage canals and their lanes, the polder road, raised lots, field ditches, paddies -------------------
  for (const c of CANALS) for (let x = IN.x0 - 1; x <= IN.x1 + 1; x++) {
    for (let dz = -1; dz <= 1; dz++) set(x, c.z + dz, { t: FLOOR - 2, surf: "mud", water: FLOOR - 1, kind: "canal" }, 3);
    for (let dz = 0; dz <= 2; dz++) set(x, c.lane + dz, { t: FLOOR, surf: dz === 1 ? "gravel" : "coarse_dirt", kind: "farm lane" }, 3);
  }
  // sluices: where the seepage ditch (water y -2) meets a canal (water y -3), a gate block holds the levels apart
  const sluices = []; for (const c of CANALS) for (const x of [IN.x0 - 1, IN.x1 + 1]) for (let dz = -1; dz <= 1; dz++) { set(x, c.z + dz, { t: FLOOR, surf: "stone_bricks", kind: "sluice" }, 4); sluices.push([x, c.z + dz]); }
  // the polder road: north ramp off the north levee, down the middle over both canals (plank bridges), south ramp
  const ramps = [];
  const rampPath = (pts, from, to, w = 3, kind = "ramp") => { const P = line(pts), prof = slabProfile(P.map((_, i) => from + (to - from) * i / (P.length - 1)), { startY: from, endY: to }); const half = (w - 1) / 2;
    P.forEach(([px, pz], i) => { for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) set(Math.round(px + dx), Math.round(pz + dz), { t: prof[i], surf: "dirt_path", kind }, 6); }); ramps.push({ kind, from, to, length: P.length, prof }); };
  rampPath([[27, 44], [27, 49], [38, 49], [42, 52], [42, 55]], CREST, FLOOR);
  rampPath([[42, 136], [42, 141], [38, 143], [27, 143], [27, 148]], FLOOR, CREST);
  for (let z = IN.z0 - 1; z <= IN.z1 + 1; z++) for (let dx = -SPINE.half; dx <= SPINE.half; dx++) { const x = SPINE.x + dx, overCanal = CANALS.some((c) => Math.abs(z - c.z) <= 1);
    set(x, z, overCanal ? { t: FLOOR, surf: "spruce_planks", kind: "bridge", deck: true, water: FLOOR - 1 } : { t: FLOOR, surf: dx === 0 ? "gravel" : Math.abs(dx) === 1 ? "dirt_path" : "coarse_dirt", kind: "polder road" }, 5); }
  // faubourg: 12 x 14 lots either side of the road, raised a block on fill (pad y -1), fronts on the road
  const plots = [], [F, G, R] = AREAS.map((a) => a.rect);
  for (const z0 of [IN.z0 + 1, IN.z0 + 14]) {
    plots.push({ x0: SPINE.x - SPINE.half - 15, z0, x1: SPINE.x - SPINE.half - 2, z1: z0 + 11, face: "east", pad: FLOOR + 1, street: FLOOR, driveway: 1 });
    plots.push({ x0: SPINE.x + SPINE.half + 2, z0, x1: SPINE.x + SPINE.half + 15, z1: z0 + 11, face: "west", pad: FLOOR + 1, street: FLOOR, driveway: 1 });
  }
  for (const p of plots) for (let z = p.z0; z <= p.z1; z++) for (let x = p.x0; x <= p.x1; x++) set(x, z, { t: p.pad, surf: "grass_block", kind: "raised lot" }, 4);
  // fields: ditches level with the fields every 9 rows, culverts under the road, draining to the seepage ditch
  const ditches = []; for (let z = G[1] + 3; z <= G[3] - 2; z += 9) { ditches.push(z); for (let x = G[0]; x <= G[2]; x++) if (Math.abs(x - SPINE.x) > SPINE.half) set(x, z, { t: FLOOR - 1, surf: "dirt", water: FLOOR, kind: "field ditch" }, 3); }
  // rice beds: paddies a block deep (water y -2 on mud y -3), bunds every 8
  for (let z = R[1]; z <= R[3]; z++) for (let x = R[0]; x <= R[2]; x++) { if (Math.abs(x - SPINE.x) <= SPINE.half) continue; const bund = (x - R[0]) % 8 === 0 || (z - R[1]) % 8 === 0 || x === R[2] || z === R[3]; set(x, z, bund ? { t: FLOOR, surf: "grass_block", kind: "bund" } : { t: FLOOR - 1, surf: "mud", water: FLOOR, kind: "paddy" }, 3); }

  // ---- streets (levee crests and the roads beyond the ring) ------------------------------------------------------
  const laid = new Map(), streets = [];
  const gnd = (x, z, half = 2) => { let s = 0, n = 0; for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) { const xx = Math.round(x) + dx, zz = Math.round(z) + dz; if (xx < 0 || zz < 0 || xx >= X || zz >= Z) continue; const h = H[zz][xx]; s += h < 0 ? 0 : h; n++; } return Math.max(1, n ? s / n : 1); };
  for (const spec of STREETS) {
    const pts = line(spec.points), r = (spec.width ?? 5) / 2;
    const prof = spec.level != null ? pts.map(() => spec.level) : slabProfile(pts.map(([x, z]) => Math.max(spec.min ?? -9, gnd(x, z))), { startY: spec.startY, endY: spec.endY });
    const cells = new Map();
    pts.forEach(([px, pz], i) => { for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const cx = Math.round(px) + dx, cz = Math.round(pz) + dz, d = Math.hypot(cx - px, cz - pz); if (d > r || cx < 0 || cz < 0 || cx >= X || cz >= Z) continue; const o = cells.get(K(cx, cz)); if (!o || o.d > d) cells.set(K(cx, cz), { x: cx, z: cz, t: prof[i], d }); } });
    for (const c of cells.values()) { if (!laid.has(K(c.x, c.z))) laid.set(K(c.x, c.z), c); set(c.x, c.z, { t: c.t, surf: c.d < 0.75 ? "gravel" : c.d < 1.75 ? "dirt_path" : "coarse_dirt", kind: "street" }, 5); }
    // banks down to what is beside it: at 1 in 2 with riprap at the water for a dike street, a block a cell otherwise
    if (!spec.ring) for (const c of cells.values()) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 1; k <= 6; k++) { const x = c.x + dx * k, z = c.z + dz * k; if (laid.has(K(x, z)) || inRing(x, z) || ringD(x, z) <= 6) break;
      const t = Math.floor(c.t) - (spec.levee ? Math.ceil(k / 2) : k), g = H[z]?.[x] ?? -99; if (t < Math.max(0, g)) break; set(x, z, { t, surf: "grass_block", kind: "bank", riprap: spec.levee && t <= 1 && wet(x, z) }, 1); }
    streets.push({ name: spec.name, pts, prof, cells: [...cells.values()], length: pts.length, from: prof[0], to: prof.at(-1), stub: spec.stub ?? null });
  }

  // ---- the waterfront: made land behind timber bulkheads, at street level -----------------------------------------
  // mixed-use lots (a shop on the street, rooms above, a gallery to the water) on fill over the levee's swamp face out to
  // a bulkhead; the boardwalk (deck y 2, on piles) behind them; 2-wide alleys level from street to boardwalk; finger
  // piers at boat height (deck y 1) down a half-step ramp from the boardwalk
  const waterfront = [], piers = [], alleys = [];
  const deck = (x, z, t, kind, prio = 4) => { const g = H[z]?.[x] ?? -99; if (g > t) return; set(x, z, { t, surf: "spruce_planks", kind, deck: true }, prio); };
  const lot = (p) => { waterfront.push(p); for (let z = p.z0; z <= p.z1; z++) for (let x = p.x0; x <= p.x1; x++) { const edge = p.face === "west" ? x === p.x1 : z === p.z1; set(x, z, { t: WHARF, surf: edge ? "stripped_spruce_log" : "coarse_dirt", kind: edge ? "bulkhead" : "made land" }, 4); } };
  const E0 = RING.east + 3; // east levee waterfront: lots x 73..82, boardwalk x 83..85, piers x 86..
  for (const z0 of [52, 64]) lot({ x0: E0, z0, x1: E0 + 9, z1: z0 + 9, face: "west", use: "mixed use" });
  lot({ x0: E0, z0: 100, x1: E0 + 9, z1: 121, face: "west", use: "distillery (corn whiskey: still house, mash tun, a rickhouse for the barrels)" });
  lot({ x0: E0, z0: 124, x1: E0 + 9, z1: 145, face: "west", use: "brewhouse (rice beer: kettles, a malt floor, a cellar store)" });
  const SZ = 38; // shore street waterfront: lots z 38..47 south of the street, boardwalk z 48..50
  for (const x0 of [80, 92, 104]) lot({ x0, z0: SZ, x1: x0 + 9, z1: SZ + 9, face: "north", use: "mixed use" });
  for (let z = 48; z <= 146; z++) for (let x = E0 + 10; x <= E0 + 12; x++) deck(x, z, WHARF, "boardwalk");
  for (let x = E0; x <= 116; x++) for (let z = SZ + 10; z <= SZ + 12; z++) deck(x, z, WHARF, "boardwalk");
  for (const z of [62, 74]) for (const dz of [0, 1]) for (let x = E0; x <= E0 + 9; x++) deck(x, z + dz, WHARF, "alley", 5);
  for (const x of [90, 102]) for (const dx of [0, 1]) for (let z = SZ; z <= SZ + 9; z++) deck(x + dx, z, WHARF, "alley", 5);
  const pier = (cells, dir) => { piers.push({ from: cells[0], n: cells.length, dir }); cells.forEach(([x, z], i) => { const t = i < 1 ? WHARF - 0.5 : i < 2 ? DECK + 0.5 : DECK; for (const o of [0, 1]) deck(dir === "x" ? x : x + o, dir === "x" ? z + o : z, t, "pier", 5); }); };
  for (const z of [58, 70, 82, 94, 106, 118]) pier(Array.from({ length: 10 }, (_, i) => [E0 + 13 + i, z]), "x");
  pier(Array.from({ length: 5 }, (_, i) => [E0 + 13 + i, 130]), "x");
  for (const x of [98, 110]) pier(Array.from({ length: 10 }, (_, i) => [x, SZ + 13 + i]), "z");
  // the island boardwalk: from the z 82 pier's end on across the willow island (deck y 1); a stub on its far side
  for (let x = E0 + 23; x <= 104; x++) for (const dz of [0, 1]) deck(x, 82 + dz, DECK, "island boardwalk", 3);
  // the landing: from the west levee's crest down its swamp face by half steps to a pirogue landing (deck y 1)
  for (let i = 0; i < 6; i++) for (const dz of [0, 1]) set(RING.west - 3 - i, 95 + dz, { t: [CREST - 0.5, CREST - 0.5, DECK + 0.5, DECK + 0.5, DECK, DECK][i], surf: "dirt_path", kind: "landing path", deck: i >= 4 }, 6);
  for (let z = 92; z <= 100; z++) for (let x = 2; x <= 6; x++) deck(x, z, DECK, "landing");

  // ---- the boatyard: made land at street level on the open water north of the south levee's eastern stub ----------------
  const YARD = { rect: [88, 136, 112, 145], t: WHARF };
  for (let z = YARD.rect[1]; z <= YARD.rect[3]; z++) for (let x = YARD.rect[0]; x <= YARD.rect[2]; x++) set(x, z, { t: YARD.t, surf: z === YARD.rect[1] ? "stripped_spruce_log" : "coarse_dirt", kind: z === YARD.rect[1] ? "bulkhead" : "yard" }, 3);
  const yardPlots = [
    { name: "ways 1", rect: [92, 128, 96, 135], use: "slipway: a timber cradle on greased ways down into the water, for a flatboat or the towboat" },
    { name: "ways 2", rect: [100, 128, 104, 135], use: "slipway for skiffs and bateaux, a hull in frame" },
    { name: "boat shed", rect: [90, 137, 105, 140], use: "an open-sided shed over the heads of both ways, a loft for oakum, rope and sails" },
    { name: "sawmill", rect: [107, 137, 112, 145], use: "cypress sawmill (a Create saw) and the timber yard: logs seasoning, plank stacks" },
    { name: "back row", rect: [89, 142, 105, 145], use: "the steam box for bending ribs, the pitch kettle, the chandler's office and store" },
  ];
  for (const yp of yardPlots.filter((p) => /ways/.test(p.name))) { const [x0, z0, x1, z1] = yp.rect; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) set(x, z, { t: Math.max(0, Math.round(WHARF - (z1 + 1 - z) / 3)), surf: "stripped_spruce_log", kind: "ways" }, 4); }

  // ---- the channel: open water at least 3 wide from every mooring to the slipways; mud flats in the way are dredged
  // (the mud at y 0 out, water in; nothing below the export touched) ------------------------------------------------
  const mouths = yardPlots.filter((p) => /ways/.test(p.name)).map((p) => [(p.rect[0] + p.rect[2]) / 2, p.rect[1] - 2]);
  // a boat lies off a pier's end or along its side: the first of those spots with open water round it
  const mooringOf = (p) => { const [x, z] = p.from, n = p.n, c = p.dir === "x" ? [[x + n + 1, z], [x + n + 2, z], [x + n - 2, z - 2], [x + n - 2, z + 3], [x + n + 3, z]] : [[x, z + n + 1], [x, z + n + 2], [x - 2, z + n - 2], [x + 3, z + n - 2]]; return c.find(([a, b]) => passable(a, b)) ?? c[0]; };
  const mudAt = (x, z) => H[z]?.[x] === 0 && site.topBlock[z][x] === "mud";
  const passable = (x, z) => { for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= X || zz >= Z) return false; const v = T.get(K(xx, zz)); if (v && v.kind !== "channel") return false; if (!(H[zz][xx] < 0 || mudAt(xx, zz))) return false; } return true; };
  const stepCost = (x, z) => { let c = 1; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (mudAt(x + dx, z + dz)) c += 2; return c; };
  const moorings = [...piers.map(mooringOf), [105, 85]];
  const channel = new Set(), routes = [];
  for (const m0 of moorings) { const m = m0.map(Math.round);
    const dist = new Map([[K(...m), 0]]), prev = new Map(), heap = [[0, ...m]]; let hit = null;
    while (heap.length) { heap.sort((a, b) => a[0] - b[0]); const [d, x, z] = heap.shift(); if (d > dist.get(K(x, z))) continue; if (mouths.some(([mx, mz]) => Math.abs(mx - x) <= 1.5 && Math.abs(mz - z) <= 1)) { hit = [x, z]; break; }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (!passable(nx, nz)) continue; const nd = d + stepCost(nx, nz), k = K(nx, nz); if (nd < (dist.get(k) ?? Infinity)) { dist.set(k, nd); prev.set(k, K(x, z)); heap.push([nd, nx, nz]); } } }
    if (!hit) { routes.push({ from: m, ok: false }); continue; }
    let k = K(...hit), n = 0; while (k) { const [x, z] = k.split(",").map(Number); for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) channel.add(K(x + dx, z + dz)); k = prev.get(k); n++; }
    routes.push({ from: m, ok: true, length: n }); }
  let dredged = 0; for (const k of channel) { const [x, z] = k.split(",").map(Number); if (mudAt(x, z) && !T.has(k)) { set(x, z, { t: -1, surf: null, kind: "channel", water: 0, dredge: true }, 2); dredged++; } }

  // ---- earthworks tally: above the water line (the export's cells) and below it (the lower box) -------------------------
  let cut = 0, fillAbove = 0, fillBelow = 0, riprap = 0, planks = 0;
  for (const [k, v] of T) { const [x, z] = k.split(",").map(Number), g = H[z][x];
    if (v.riprap) riprap += 2; if (v.deck) { planks++; continue; } if (v.dredge) { cut++; continue; }
    const top = Math.floor(v.t) + (v.t % 1 ? 1 : 0), base = g < 0 ? -1 : g; // over water the export's column ends at the surface
    if (top >= 0) { if (base > top) cut += base - top; else fillAbove += top - base; }
    else { cut += Math.max(0, base + 1); const bot = v.water != null ? Math.min(top, v.water) : top; fillBelow += bot - LOWER_BOX.y0 + 1; } }
  return { site, T, ringD, inRing, streets, plots, areas: AREAS, zones: ZONES, waterfront, piers, alleys, ramps, sluices, ditches, yard: YARD, yardPlots, channel: { cells: channel.size, dredged, routes }, fleet: FLEET,
    earth: { cutAboveWater: cut, fillAboveWater: fillAbove, fillBelowWater: fillBelow, riprapStones: riprap, deckPlanks: planks, note: "fill below the water line counts every block of the lower box (y -4..-1) the works set solid; the export cannot show what is there now" } };
}
