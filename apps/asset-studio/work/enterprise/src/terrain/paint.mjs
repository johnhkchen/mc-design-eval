// Grade a town in a world box and paint the result, for a demo and a before/after (thread 0013). Reads a box dumped by
// tools/py/world_box.py and the client's town plan, finds the natural ground, the water and what already stands, runs
// townGrade, then cuts and fills every column to its target (felling the trees on columns that change), paves the
// streets with half steps where they climb, lays an earthworks tile at every step (the kingdom's style; walls near
// streets and buildings, cut faces in the open, quays at water) and joins the parapets. Writes two worlds (the box as it
// was, and graded) for the renderer, and grade.json (targets, edges, report) for the client.
//   node src/terrain/paint.mjs <box prefix> <plan.json> <out dir> [--style dalaran|lordaeron] [--blend 16]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { Voxels } from "../../../../../irl-copy/src/voxels.mjs";
import { writeWorld } from "../../../../../irl-copy/src/anvil.mjs";
import { townGrade, trimStreets, NONE, ROLE } from "./grade.mjs";
import { landingBlocks } from "./bridge.mjs";
import { kingdomCrossing, ferryStageBlocks, BRIDGE } from "./bridges.mjs";
import { retain, cutFace, hash, LORDAERON } from "../lordaeron/earthworks.mjs";
import { DALARAN } from "../dalaran/earthworks.mjs";
import { splitState } from "../grid.mjs";

const argv = process.argv.slice(2), [BOX, PLAN, OUT] = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const K = opt("--style", "dalaran"), S = { dalaran: DALARAN, lordaeron: LORDAERON, stormwind: LORDAERON }[K], B = BRIDGE[K], BLEND = +opt("--blend", 16);

// ---- the box into a Voxels from world y 0 (stone below the dump), so the written world keeps the game's heights
const meta = JSON.parse(readFileSync(BOX + ".json", "utf8")), raw = readFileSync(BOX + ".bin");
const dump = new Uint16Array(raw.length / 2); for (let i = 0; i < dump.length; i++) dump[i] = raw.readUInt16LE(2 * i);
const [ox, oy, oz] = meta.origin, [X, Yb, Z] = meta.size, Y = oy + Yb;
const parse = (s) => { const { name, props } = splitState(s); return [name, Object.keys(props).length ? props : undefined]; };
function load() {
  const v = new Voxels([X, Y, Z]), map = meta.palette.map((s, k) => (k === 0 ? 0 : v.paletteIndex(...parse(s)))), stone = v.paletteIndex("minecraft:stone");
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    for (let y = 0; y < oy; y++) v.data[(z * Y + y) * X + x] = stone;
    for (let y = 0; y < Yb; y++) v.data[(z * Y + y + oy) * X + x] = map[dump[(z * Yb + y) * X + x]];
  }
  return v;
}
const before = load(), V = load();
const nameOf = (v, x, y, z) => { const p = v.val(x, y, z); return p ? v.palette[p].block.replace(/^[a-z0-9_]+:/, "") : "air"; };
const stateOf = (v, x, y, z) => { const p = v.val(x, y, z); return p ? v.palette[p].state || {} : {}; };
const put = (x, y, z, s) => (s === "air" ? V.set(x, y, z, "minecraft:air") : V.set(x, y, z, ...parse(s)));

// ---- what each column is: the natural ground, water, or something standing
const PLANT = /^(short_grass|tall_grass|grass|fern|large_fern|dandelion|poppy|blue_orchid|allium|azure_bluet|.*_tulip|oxeye_daisy|cornflower|lily_of_the_valley|sunflower|lilac|rose_bush|peony|sweet_berry_bush|dead_bush|sugar_cane|bush|firefly_bush|lily_pad|snow|moss_carpet|pink_petals|vine|glow_lichen|hanging_roots|brown_mushroom|red_mushroom|pumpkin|melon|cobweb)$/;
const TERRAIN = /^(grass_block|dirt|coarse_dirt|podzol|rooted_dirt|mud|moss_block|stone|granite|diorite|andesite|tuff|deepslate|gravel|sand|red_sand|sandstone|clay|dirt_path|farmland|snow_block|.*_ore|crimsite|asurine|veridium|ochrum|scoria|limestone|scorchia|smooth_basalt|amethyst_block|budding_amethyst|calcite)$/;
const WATERY = /^(water|bubble_column|seagrass|tall_seagrass|kelp|kelp_plant)$/;
// a tree, for finding the ground: any leaves and any natural log or wood (a building always has its roof above them)
const isTree = (n) => /_leaves$/.test(n) || (/_(log|wood)$/.test(n) && !/^stripped_/.test(n)) || n === "cocoa" || n === "mangrove_roots";
const standing = {}, N = X * Z, top = new Int16Array(N), water = new Uint8Array(N), fixed = new Int16Array(N).fill(NONE);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const i = z * X + x; let y = Y - 1;
  for (; y > 0; y--) { const n = nameOf(V, x, y, z); if (n === "air" || PLANT.test(n) || isTree(n)) continue; break; }
  const n = nameOf(V, x, y, z);
  if (WATERY.test(n)) { water[i] = 1; top[i] = y; continue; }
  if (TERRAIN.test(n)) { top[i] = y; continue; }
  // something built stands here: its ground is the column's first natural block under it, plus one; with water under
  // it, it is a dock or a bridge, and the column is water (at the water's surface)
  let g = y, wet = -1; while (g > 0 && !TERRAIN.test(nameOf(V, x, g, z))) { if (wet < 0 && WATERY.test(nameOf(V, x, g, z))) wet = g; g--; }
  if (wet >= 0) { water[i] = 1; top[i] = wet; continue; }
  top[i] = g + 1; fixed[i] = g + 1; standing[n] = (standing[n] || 0) + 1;
}
if (argv.includes("--why")) console.log(Object.entries(standing).sort((a, b) => b[1] - a[1]).slice(0, 25));

// ---- the plan into the box's frame, and the grade
const plan = JSON.parse(readFileSync(PLAN, "utf8")), L = ([x, z]) => [x - ox, z - oz];
const R = ([x0, z0, x1, z1]) => [x0 - ox, z0 - oz, x1 - ox, z1 - oz];
const streets = plan.streets.map((s) => ({ ...s, line: s.line.map(L) }));
const plots = plan.plots.map((p) => ({ ...p, x: p.x - ox, z: p.z - oz }));
const forum = { centre: L(plan.forum.centre), reach: plan.forum.reach, level: plan.bell[1] - 1 };
let g = townGrade({ X, Z, top, water, fixed, streets, plots, forum, outer: R(plan.edge.outer), blend: BLEND, deckOver: B.over });
// --trim: the crossings that serve nothing past them are not built; their streets end at the shore with a landing
const TRIM = argv.includes("--trim"), first = g.crossings;
if (TRIM) g = { ...townGrade({ X, Z, top, water, fixed, streets: trimStreets(streets, first), plots, forum, outer: R(plan.edge.outer), blend: BLEND, deckOver: B.over }), dropped: first.filter((c) => !c.keep) };
const { target, role, bridge } = g;

// ---- fell the trees that stand where the ground moves: a trunk on a street or plot, or on land cut or filled by 2 or
// more (a block's change in the blend band leaves a tree standing); its crown goes with it, within 3 of the trunk
const changed = new Uint8Array(N); for (let i = 0; i < N; i++) if (target[i] !== top[i] && role[i] !== ROLE.wild && role[i] !== ROLE.water && role[i] !== ROLE.fixed) changed[i] = 1;
const fells = (i) => role[i] === ROLE.street || role[i] === ROLE.plot || role[i] === ROLE.forum || (changed[i] && Math.abs(target[i] - top[i]) >= 2);
const seen = new Set(), queue = []; let felled = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const i = z * X + x; if (!fells(i)) continue;
  for (let y = top[i] + 1; y < Y; y++) { const n = nameOf(V, x, y, z); if (/_(log|wood)$/.test(n) && !/^stripped_/.test(n)) queue.push([x, y, z, x, z]); else if (isTree(n)) { V.set(x, y, z, "minecraft:air"); felled++; } }
}
while (queue.length) {
  const [x, y, z, tx, tz] = queue.pop(), k = (z * Y + y) * X + x; if (seen.has(k)) continue; seen.add(k);
  if (Math.max(Math.abs(x - tx), Math.abs(z - tz)) > 3 || role[z * X + x] === ROLE.fixed) continue;
  const n = nameOf(V, x, y, z); if (!isTree(n) && n !== "vine") continue;
  V.set(x, y, z, "minecraft:air"); felled++;
  for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy || dz) && V.inBounds(x + dx, y + dy, z + dz)) queue.push([x + dx, y + dy, z + dz, tx, tz]);
}

// ---- cut and fill, and the surfaces: streets paved, everything else grassed
const PAVE = (x, z) => ((x + z) % 2 ? "stone_bricks" : "polished_andesite");
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const i = z * X + x, r = role[i];
  if (r === ROLE.wild || r === ROLE.water || r === ROLE.fixed || bridge[i]) continue;
  const t = target[i], n = top[i];
  if (t !== n || r === ROLE.street) {
    for (let y = Math.min(t, n) + 1; y <= Math.max(t, n) + 3 && y < Y; y++) if (y > t) { const b = nameOf(V, x, y, z); if (b === "air" || PLANT.test(b) || TERRAIN.test(b) || y <= n) put(x, y, z, "air"); }
    for (let y = n + 1; y < t; y++) put(x, y, z, "dirt");
    if (t < n && !TERRAIN.test(nameOf(V, x, t, z))) put(x, t, z, "dirt");
    put(x, t, z, r === ROLE.street || r === ROLE.forum ? PAVE(x, z) : "grass_block[snowy=false]");
    if (t > n) for (let y = t - 1; y > n; y--) put(x, y, z, "dirt");
  }
}
// a street climbs by half steps: a slab on the lower cell wherever its neighbour along the street is a block higher
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const i = z * X + x; if (role[i] !== ROLE.street && role[i] !== ROLE.forum) continue;
  const up = [[0, -1], [0, 1], [1, 0], [-1, 0]].some(([dx, dz]) => { const j = (z + dz) * X + x + dx; return x + dx >= 0 && x + dx < X && z + dz >= 0 && z + dz < Z && (role[j] === ROLE.street || role[j] === ROLE.forum) && target[j] === target[i] + 1; });
  if (up) put(x, target[i] + 1, z, "polished_andesite_slab[type=bottom,waterlogged=false]");
}

// ---- crossings, assembled from the kingdom's bridge parts (bridges.mjs): arches on piers, or a causeway for 3 or less;
// a crossing not built ends its street at a landing, or a ferry stage where it would have been a ferry. Each part is
// drawn in its own frame (i along the street from the near bank, o across; i runs south and o east there) and laid here
// along the crossing's way, its facings turned to match
const bedAt0 = (x, z) => { let y = Y - 1; while (y > 0 && (nameOf(V, x, y, z) === "air" || WATERY.test(nameOf(V, x, y, z)) || PLANT.test(nameOf(V, x, y, z)))) y--; return y; };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
function frame(c) {
  const [nx, nz] = c.near_bank, [tx, tz] = c.from, d = [Math.sign(tx - nx), Math.sign(tz - nz)], p = d[0] ? [0, 1] : [1, 0], off = Math.floor((c.width - 1) / 2);
  return { at: (i, o) => [nx + d[0] * i + p[0] * (o - off), nz + d[1] * i + p[1] * (o - off)], d, p };
}
function lay(c, blocks) {
  const { at, d, p } = frame(c), dir = (v) => (v[0] > 0 ? "east" : v[0] < 0 ? "west" : v[1] > 0 ? "south" : "north"), D = dir(d), P = dir(p);
  const map = { south: D, north: OPP[D], east: P, west: OPP[P] };
  const turnF = (b) => { const { name, props } = splitState(b); if (!Object.keys(props).length) return b; const o = {}; for (const [k, v] of Object.entries(props)) o[map[k] ?? k] = k === "facing" ? (map[v] ?? v) : v; return name.replace(/^minecraft:/, "") + "[" + Object.entries(o).map(([k, v]) => `${k}=${v}`).join(",") + "]"; };
  for (const [i, o, y, b] of blocks) { const [x, z] = at(i, o); if (x >= 0 && z >= 0 && x < X && z < Z) put(x, y, z, b === "air" ? "air" : turnF(b)); }
}
for (const c of g.crossings.filter((c) => c.near_bank && c.far_bank)) {
  const { at } = frame(c), bedAt = (i, o) => bedAt0(...at(i, o));
  lay(c, kingdomCrossing({ span: c.span, width: c.width, deck: c.deck, water: c.water, bedAt, style: B }));
}
for (const c of g.dropped || []) if (c.landing) {
  const lv = target[c.landing.at[1] * X + c.landing.at[0]];
  for (const [x, y, z, b] of landingBlocks({ at: c.landing.at, facing: c.landing.facing, level: lv, water: c.water, width: c.width, style: S, pave: PAVE, jetty: c.kind === "ferry" ? 0 : 4 })) put(x, y, z, b);
  if (c.kind === "ferry") {
    // the ferry's stage beyond the landing's steps: frame along the landing's way, from where the steps reach the water
    const steps = Math.max(1, Math.round((lv + 0.5 - (c.water + 2)) * 2)), [fx, fz] = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[c.landing.facing];
    const start = [c.landing.at[0] + fx * steps, c.landing.at[1] + fz * steps];
    lay({ ...c, near_bank: start, from: [start[0] + fx, start[1] + fz] }, ferryStageBlocks({ width: c.width, level: lv, water: c.water, style: B }));
  }
}
const parapet = [];

// ---- an earthworks tile at every step: the tile is drawn with its low side south; turn it to the edge's way down
const TURN = { south: 0, west: 1, north: 2, east: 3 }, CW = { north: "east", east: "south", south: "west", west: "north" };
function turn(s, q) {
  if (!q) return s;
  const { name, props } = splitState(s), sides = ["north", "east", "south", "west"], out = { ...props };
  let rot = (d) => { for (let k = 0; k < q; k++) d = CW[d]; return d; };
  if (props.facing && sides.includes(props.facing)) out.facing = rot(props.facing);
  if (sides.some((d) => d in props)) for (const d of sides) if (d in props) out[rot(d)] = props[d];
  const body = Object.entries(out).map(([k, v]) => `${k}=${v}`).join(",");
  return name.replace(/^minecraft:/, "") + (body ? `[${body}]` : "");
}
const tiles = { wall: 0, cut_face: 0, quay: 0 };
const DIAG = { "south-east": 0, "south-west": 1, "north-west": 2, "north-east": 3 };
for (const e of g.edges) {
  if (e.kind === "street_step" || e.kind === "street_stair" || e.kind === "slope") continue;
  if (e.corner === "inner") {
    // the inner corner's own column: the inner-corner tile's corner wall (its low side to the south-east), turned
    const h = Math.min(4, e.rise), low = target[e.z * X + e.x] - e.rise, seed = e.x * 7349 + e.z * 31 + 23, q = DIAG[e.dir];
    const tile = e.kind === "cut_face" ? cutFace({ h, seed, style: S }) : retain(["TTT", "TWW", "TWA"], { h, seed, style: S }), cx = e.kind === "cut_face" ? 0 : 1;
    for (let y = low + 1; y <= low + e.rise - h; y++) put(e.x, y, e.z, S.course(hash(seed, y, 3)));
    const base = low + e.rise - h;
    for (let ty = 2; ty < tile.size[1]; ty++) { const b = tile.get(cx, ty, 1); if (b) { put(e.x, base - 2 + ty, e.z, turn(b, q)); if (/_fence|cobblestone_wall/.test(b) && ty === 2 + h + 1) parapet.push([e.x, base - 2 + ty, e.z]); } }
    tiles.inner = (tiles.inner || 0) + 1; continue;
  }
  const [dx, dz] = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[e.dir], j = (e.z + dz) * X + e.x + dx;
  const h = Math.min(4, e.rise), low = target[e.z * X + e.x] - e.rise, seed = e.x * 7349 + e.z * 31 + 17;
  const lamp = e.kind !== "cut_face" && hash(e.x, e.z, 5) < 0.2;
  const tile = e.kind === "cut_face" ? cutFace({ h, seed, style: S }) : retain(["T", "W", "A"], { h, seed, lamp: lamp ? [0, 1] : null, style: S });
  const q = TURN[e.dir], streetBelow = role[j] === ROLE.street || role[j] === ROLE.forum;
  tiles[e.kind]++;
  // the wall column: the tile's courses from the low surface up (a rise over 4 carries on down in coursed stone)
  for (let y = low + 1; y <= low + e.rise - h; y++) put(e.x, y, e.z, S.course(hash(seed, y, 3)));
  const base = low + e.rise - h;                                 // the tile's low surface (layer 2) sits here
  for (let ty = 2; ty < tile.size[1]; ty++) {
    const b = tile.get(0, ty, 1); if (b) { put(e.x, base - 2 + ty, e.z, turn(b, q)); if (/_fence|cobblestone_wall/.test(b) && ty === 2 + h + 1) parapet.push([e.x, base - 2 + ty, e.z]); }
    const a = tile.get(0, ty, 2); if (a && ty > 2 && !(streetBelow && /_stairs|_slab/.test(a)) && role[j] !== ROLE.water) put(e.x + dx, base - 2 + ty, e.z + dz, turn(a, q));
  }
}
// the parapet joined along its whole length: each post or rail looks at its neighbours along the coping
const isPar = new Set(parapet.map(([x, y, z]) => `${x},${y},${z}`));
for (const [x, y, z] of parapet) {
  const p = Object.fromEntries([["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]].map(([d, dx, dz]) => [d, isPar.has(`${x + dx},${y},${z + dz}`) ? "low" : "none"]));
  const ends = Object.values(p).filter((v) => v === "low").length, lit = /lantern/.test(nameOf(V, x, y + 1, z));
  put(x, y, z, S.parapet(p, lit || ends !== 2 || (p.east === "low") !== (p.west === "low")));
}

// ---- out: the two worlds, the grade for the client
const W = (d, v) => { mkdirSync(d, { recursive: true }); return writeWorld(d, v, { name: "darkshire-grade" }); };
W(`${OUT}/before/world`, before); W(`${OUT}/graded/world`, V);
const b64 = (a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString("base64");
writeFileSync(`${OUT}/grade.json`, JSON.stringify({ origin: [ox, oz], size: [X, Z], target: b64(target), role: b64(role), roles: ROLE,
  plot_levels: g.plotLevels.map((p) => ({ ...p, plot: plan.plots[p.plot] })),
  crossings: [...g.crossings, ...(g.dropped || []).map((c) => ({ ...c, dropped: true }))].map((c) => { const W = (p) => p && [p[0] + ox, p[1] + oz]; return { ...c, street_line: plan.streets[c.street]?.line, near_bank: W(c.near_bank), far_bank: W(c.far_bank), from: W(c.from), to: W(c.to), landing: c.landing && { ...c.landing, at: W(c.landing.at) } }; }), edges: g.edges.map((e) => ({ ...e, x: e.x + ox, z: e.z + oz })), report: { ...g.report, felled, tiles } }));
console.log(JSON.stringify({ ...g.report, felled, tiles, origin: [ox, oz] }, null, 1));
