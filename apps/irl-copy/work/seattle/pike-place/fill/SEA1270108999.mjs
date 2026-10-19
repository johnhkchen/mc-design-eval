// Market Place North Phase I condominium, 1st Ave, Pike Place Market: a 1982 residential condo of seventeen storeys
// (roof 86 blocks above the lowest ground, five blocks a storey) on a site that climbs about 21 blocks from the
// downhill west edge to the uphill east edge. Brick-faced walls with light precast floor lines and a smooth cornice,
// grey-tinted glass in window bays between brick piers, a stone plinth where the wall sits in the hill, a shopfront
// band (glass, stone piers, a stone lintel) and two doors on the downhill frontage, recessed loggias with iron rails
// every few bays, a brick parapet with a stone cap, and a set-back penthouse with rooftop units. Floors are flat across
// the plate: the downhill side shows its extra storeys above the foundation. No interiors: one air cell behind the
// glass, and a floor slab per storey. Warm glowstone sits two cells behind some panes and in the shopfronts.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${DIR}/SEA1270108999.cells.json`, "utf8"));

const SIZE = [113, 98, 68];
const BAND = 5;          // one storey: floor line (r0), windows (r1-3), spandrel (r4)
const CORNICE = 84;      // top of the last full storey
const ROOF_DECK = 85;    // roof membrane across the plate; its top is the roof at 86
const TOP = 86;          // parapet cap

// Footprint lookup: ground per cell, the outward faces open to the air, and the depth in from the nearest one.
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const has = (x, z) => ground.has(`${x},${z}`);
const NORMALS = { "+x": [1, 0], "-x": [-1, 0], "+z": [0, 1], "-z": [0, -1] };
const exposed = (x, z) => Object.keys(NORMALS).filter((n) => !has(x + NORMALS[n][0], z + NORMALS[n][1]));
const INTO = { "-x": "east", "+x": "west", "-z": "south", "+z": "north" };   // a door faces into the building

const depth = new Map();
let frontier = cells.filter(([x, z]) => exposed(x, z).length).map(([x, z]) => `${x},${z}`);
for (const k of frontier) depth.set(k, 0);
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const k of frontier) {
    const [x, z] = k.split(",").map(Number);
    for (const [dx, dz] of Object.values(NORMALS)) {
      const nk = `${x + dx},${z + dz}`;
      if (has(x + dx, z + dz) && !depth.has(nk)) { depth.set(nk, d); next.push(nk); }
    }
  }
  frontier = next;
}
const dep = (x, z) => depth.get(`${x},${z}`) ?? 0;

const V = new Voxels(SIZE);

// Foundation: solid from y 0 up to each cell's ground, so nothing floats on the slope.
for (const [x, z, g] of cells) for (let y = 0; y < g; y++) V.set(x, y, z, "stone_bricks");

// Interior: a slab at every storey line over the plate, and the roof membrane. Nothing else is filled, so the
// building is hollow behind its skin.
for (const [x, z, g] of cells) {
  for (let y = BAND; y <= CORNICE; y += BAND) if (y >= g) V.set(x, y, z, "smooth_stone");
  V.set(x, ROOF_DECK, z, "stone");
}

// Doors: two on the downhill frontage, a west door near the Elliott Bay side and a north one on the Pike Place side.
const DOORS = new Set(["0,50", "0,51", "2,0", "3,0"]);

const pane = (face) => (face.endsWith("x")
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const shell = cells.filter(([x, z]) => exposed(x, z).length);
for (const [x, z, g] of shell) {
  const ex = exposed(x, z);
  const face = ex[0];
  const corner = ex.length > 1;                   // a corner cell is a brick pier all the way up
  const along = face.endsWith("x") ? z : x;       // bay grid runs along the face; piers every third cell
  const pier = corner || along % 3 === 0;
  const ps = pane(face);
  const k0 = Math.floor(g / BAND);
  const shop = g <= 4;                            // the downhill frontage: shopfront band on the ground storey

  // Stone plinth where the wall sits in the hill (the partial storey above the ground).
  if (!shop) for (let y = g; y <= k0 * BAND + BAND - 1; y++) V.set(x, y, z, "stone_bricks");

  // Shopfront band: glass with stone piers and a lintel, doors in the two entrance bays.
  if (shop) {
    for (let y = g; y < BAND - 1; y++) {
      if (DOORS.has(`${x},${z}`)) {
        const half = y === g ? "lower" : "upper";
        if (y <= g + 1) { V.set(x, y, z, "dark_oak_door", { facing: INTO[face], half, hinge: "left", open: "false", powered: "false" }); continue; }
      }
      if (pier) V.set(x, y, z, "stone_bricks");
      else V.set(x, y, z, "glass_pane", ps);
    }
    V.set(x, BAND - 1, z, "stone_bricks");
    if (!pier && along % 6 === 1) {
      const [ix, iz] = [face.endsWith("x") ? -NORMALS[face][0] * 2 : 0, face.endsWith("z") ? -NORMALS[face][1] * 2 : 0];
      if (has(x + ix, z + iz)) V.set(x + ix, g + 1, z + iz, "glowstone");
    }
  }

  // Storeys: floor line, three window rows, spandrel. Loggias are recessed bays with an iron rail at the sill.
  for (let y = Math.max(g, k0 * BAND + BAND); y <= CORNICE; y++) {
    const k = Math.floor(y / BAND), r = y % BAND;
    if (r === 0) { V.set(x, y, z, "smooth_stone"); continue; }
    if (r === 4) { V.set(x, y, z, "bricks"); continue; }
    const loggia = !pier && k >= 2 && (along + 2 * k) % 9 === 4;
    if (loggia) {
      if (r === 1) V.set(x, y, z, "iron_bars", { north: ps.north, south: ps.south, east: ps.east, west: ps.west, waterlogged: "false" });
      continue;                                   // r2, r3 left open: the recess
    }
    if (pier) { V.set(x, y, z, "bricks"); continue; }
    V.set(x, y, z, "gray_stained_glass_pane", ps);
    if (r === 2 && (along * 3 + k * 5) % 13 === 0) {
      const ix = face.endsWith("x") ? -NORMALS[face][0] * 2 : 0;
      const iz = face.endsWith("z") ? -NORMALS[face][1] * 2 : 0;
      if (has(x + ix, z + iz)) V.set(x + ix, y, z + iz, "glowstone");
    }
  }

  // Cornice course is already at CORNICE; the parapet and its stone cap sit on the roof.
  V.set(x, ROOF_DECK, z, "bricks");
  V.set(x, TOP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof: a set-back penthouse (brick ring with a solid core) and a few rooftop units on the terrace ring.
for (const [x, z] of cells) {
  const d = dep(x, z);
  if (d >= 4) {
    const ring = d === 4;
    for (let y = ROOF_DECK + 1; y <= ROOF_DECK + 3; y++) {
      if (ring) V.set(x, y, z, y === ROOF_DECK + 2 ? "gray_stained_glass" : "bricks");
      else V.set(x, y, z, "light_gray_concrete");
    }
    V.set(x, ROOF_DECK + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else if (d >= 1 && x % 8 === 3 && z % 8 === 3) {
    V.set(x, TOP, z, "iron_block");
    V.set(x, TOP + 1, z, "light_gray_concrete");
  }
}

const stats = V.save(`${DIR}/SEA1270108999.nbt`);
console.log(JSON.stringify(stats));
