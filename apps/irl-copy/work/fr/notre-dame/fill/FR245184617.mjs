// FR245184617: a commercial block on the Paris footprint (17 x 43 cells). Lidar roof heights, median-smoothed, snap to three
// tiers of 15, 10 and 5 blocks (three, two and one storeys of 5). A cream limestone facade with a shopfront ground storey,
// stone pilasters every 4 cells, paired glass panes between string courses, a parapet on each roof edge, and a plant box on
// the tallest tier. Every column is solid from y 0 up to its tier top, with a one-cell air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184617.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184617.nbt";

const W = 17, D = 43, H = 31;
const FACES = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };   // minecraft facing: north is -z, east is +x
const key = (x, z) => `${x},${z}`;

const WALL = "calcite", TRIM = "smooth_stone", BASE = "stone_bricks", PILASTER = "stone_bricks", FASCIA = "dark_oak_planks";
const ROOF = "deepslate_tiles", PARAPET = "stone_brick_wall", PANE = "glass_pane", SHOP = "glass", LIGHT = "glowstone";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const roofAt = new Map(), groundAt = new Map();
for (const [x, z, g, r] of cells) { roofAt.set(key(x, z), r); groundAt.set(key(x, z), g); }
const inFp = (x, z) => roofAt.has(key(x, z));

// Tier top per cell: the 3 x 3 median of the lidar roof, snapped to 15 / 10 / 5 blocks (a flat tier each).
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const tierOf = (r) => (r >= 12 ? 15 : r >= 8 ? 10 : 5);
const topAt = new Map();
for (const [x, z] of [...roofAt.keys()].map((k) => k.split(",").map(Number))) {
  const around = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) around.push(roofAt.get(key(x + dx, z + dz)));
  topAt.set(key(x, z), tierOf(median(around)));
}
const top = (x, z) => topAt.get(key(x, z));
const ground = (x, z) => groundAt.get(key(x, z));

// A cell is present at y while y is within its column (foundation to tier top). Faces that look at an absent cell are exposed.
const present = (x, z, y) => inFp(x, z) && y >= 0 && y <= top(x, z);
const exposed = (x, z, y) => Object.entries(FACES).filter(([, [dx, dz]]) => !present(x + dx, z + dz, y)).map(([f]) => f);
// Storey slabs (every 5 blocks) and the tier top are solid over the whole column; the rest is shell only where exposed.
const solid = (x, z, y) => present(x, z, y) && (y < ground(x, z) || y === 0 || y % 5 === 0 || y === top(x, z) || exposed(x, z, y).length > 0);
const interiorAir = (x, z, y) => present(x, z, y) && !solid(x, z, y);

// The street face: the side with the most exposed cells at the shopfront row, and the door near the middle of its bays.
const sideCount = Object.fromEntries(Object.keys(FACES).map((f) => [f, 0]));
for (const [x, z] of [...roofAt.keys()].map((k) => k.split(",").map(Number)))
  for (const f of exposed(x, z, 2)) sideCount[f]++;
const street = Object.keys(FACES).reduce((a, b) => (sideCount[b] > sideCount[a] ? b : a));
const bays = [];
for (const [x, z] of [...roofAt.keys()].map((k) => k.split(",").map(Number))) {
  const ex = exposed(x, z, 2);
  if (!ex.includes(street) || ex.length !== 1) continue;
  const along = street === "north" || street === "south" ? x : z;
  if (along % 4 === 1 || along % 4 === 2) bays.push({ x, z, along });
}
const mid = bays.reduce((s, b) => s + b.along, 0) / bays.length;
const doorBay = bays.reduce((a, b) => (Math.abs(b.along - mid) < Math.abs(a.along - mid) ? b : a));
const doorKey = key(doorBay.x, doorBay.z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// The roof's edge takes a parapet, its wall states set to join the neighbours that stand at the same height.
const parapetState = (x, z, y) => {
  const st = {};
  for (const [f, [dx, dz]] of Object.entries(FACES)) st[f] = present(x + dx, z + dz, y) ? "low" : "none";
  return { ...st, up: "false", waterlogged: "false" };
};

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp(x, z)) continue;
  const tp = top(x, z), gr = ground(x, z);
  for (let y = 0; y <= tp; y++) {
    if (!solid(x, z, y)) continue;
    const ex = exposed(x, z, y);
    const row = y % 5, s = Math.floor(y / 5);

    if (y === tp) {                                           // the tier's top: a parapet on the edge, roof surface inside
      if (ex.length) put(x, y, z, PARAPET, parapetState(x, z, y));
      else put(x, y, z, ROOF);
      continue;
    }
    if (y < gr || y === 0) { put(x, y, z, BASE); continue; }   // foundation and plinth
    if (row === 0) { put(x, y, z, TRIM); continue; }           // storey string course
    if (!ex.length) continue;                                  // interior: air behind the glass

    const axisX = ex.includes("east") || ex.includes("west");
    const axisZ = ex.includes("north") || ex.includes("south");
    const along = axisX && !axisZ ? z : x;
    const pier = along % 4;

    if (axisX && axisZ) { put(x, y, z, PILASTER); continue; }  // corner quoins
    if (s === 0 && key(x, z) === doorKey && row >= 1 && row <= 3) {   // the entrance: door on the base, its head in fascia
      if (row === 1) put(x, y, z, "dark_oak_door", { facing: street, half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (row === 2) put(x, y, z, "dark_oak_door", { facing: street, half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, FASCIA);
      continue;
    }

    if (s === 0) {                                             // shopfront: base course, glazing between pilasters, fascia
      if (row === 1) put(x, y, z, BASE);
      else if (row === 4) put(x, y, z, FASCIA);
      else put(x, y, z, pier === 0 ? PILASTER : SHOP);
      continue;
    }
    if (row === 1 || row === 4) { put(x, y, z, pier === 0 ? PILASTER : TRIM); continue; }   // sills and lintels
    if (pier === 0) { put(x, y, z, PILASTER); continue; }
    if (pier === 3) { put(x, y, z, WALL); continue; }
    const horiz = axisX ? { north: "true", south: "true", east: "false", west: "false" }
      : { north: "false", south: "false", east: "true", west: "true" };
    put(x, y, z, PANE, { ...horiz, waterlogged: "false" });
  }
}

// Warm light: a glowstone just inside every other window bay on the upper storeys and the shopfront (interior air only).
for (const [x, z] of [...roofAt.keys()].map((k) => k.split(",").map(Number))) {
  for (const [f, [dx, dz]] of Object.entries(FACES)) {
    if (!exposed(x, z, 2).includes(f)) continue;
    const axisX = f === "east" || f === "west";
    const along = axisX ? z : x;
    if (along % 8 !== 1) continue;
    const ix = x - dx, iz = z - dz;
    if (interiorAir(ix, iz, 2)) put(ix, 2, iz, LIGHT);
  }
}

// Roof plant on the tallest tier: a solid box of stone brick with a copper roof, set on the roof surface.
for (let x = 4; x <= 9; x++) for (let z = 16; z <= 22; z++) {
  if (!inFp(x, z) || top(x, z) !== 15) continue;
  const edge = x === 4 || x === 9 || z === 16 || z === 22;
  if (edge) { put(x, 16, z, BASE); put(x, 17, z, BASE); }
  put(x, 18, z, "copper_block");
}

const counts = g.save(OUT);
console.log(street, "door", doorKey, "tiers", JSON.stringify(counts));
