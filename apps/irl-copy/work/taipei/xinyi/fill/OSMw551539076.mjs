import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-90s Taipei commercial block: two storeys of concrete over a
// stone base, shopfront glazing at street level, white upper walls with
// grey frames, a stone cornice and a flat roof with rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw551539076";
const W = 13, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let minG = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Storey levels, anchored to the lowest ground (B).
const B = minG;
const TOP = B + 11;          // parapet cap
const DECK = B + 10;         // roof slab under parapet
const FLOOR2 = B + 5;        // second-floor slab / storey line

// Exposed faces and the door.
const info = new Map();
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const exp = { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
  const ring = exp.n || exp.s || exp.w || exp.e;
  const corner = (exp.n || exp.s) && (exp.w || exp.e);
  const a = (exp.n || exp.s) ? x - minX : z - minZ;
  const pillar = corner || a % 3 === 0;
  info.set(`${x},${z}`, { x, z, exp, ring, corner, pillar });
}

// Entrance: a non-pillar cell on the street (min-z) face nearest the middle.
const midX = (minX + maxX) / 2;
let doorKey = null, doorFace = "north", best = Infinity;
for (const inf of info.values()) {
  if (!inf.ring || inf.pillar || !inf.exp.n) continue;
  const d = Math.abs(inf.x - midX);
  if (d < best) { best = d; doorKey = `${inf.x},${inf.z}`; }
}
if (!doorKey) {
  for (const inf of info.values()) {
    if (!inf.ring || inf.pillar) continue;
    const face = inf.exp.n ? "north" : inf.exp.s ? "south" : inf.exp.w ? "west" : inf.exp.e ? "east" : null;
    if (face) { doorKey = `${inf.x},${inf.z}`; doorFace = face; break; }
  }
}
if (doorKey) {
  const di = info.get(doorKey);
  doorFace = di.exp.n ? "north" : di.exp.s ? "south" : di.exp.w ? "west" : "east";
}

const glassFor = (axisAlongX) => axisAlongX
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const inf of info.values()) {
  const { x, z, exp, ring, pillar } = inf;
  const gr = gAt(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!ring) {
    // Interior: floor slabs and roof deck only, air between (no interiors).
    for (let y = gr; y <= TOP; y++) {
      if (y === FLOOR2) put(x, y, z, "smooth_stone");
      else if (y === DECK) put(x, y, z, "gray_concrete");
      else if (y === TOP && (x * 5 + z * 7) % 13 === 0) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  const axisAlongX = exp.n || exp.s;
  const isDoor = `${x},${z}` === doorKey;
  const yDoor = isDoor ? Math.max(gr, B + 1) : -1;

  // Inward neighbour for warm lights behind the glass.
  let inward = null;
  if (exp.n) inward = [x, z + 1];
  else if (exp.s) inward = [x, z - 1];
  else if (exp.w) inward = [x + 1, z];
  else if (exp.e) inward = [x - 1, z];

  for (let y = gr; y <= TOP; y++) {
    if (y === TOP) { put(x, y, z, "white_concrete"); continue; }            // parapet
    if (y === DECK) { put(x, y, z, "stone_bricks"); continue; }            // cornice
    if (y === B + 9) { put(x, y, z, "white_concrete"); continue; }         // sill band
    if (y >= B + 6 && y <= B + 8) {                                        // upper storey
      if (pillar) put(x, y, z, "gray_concrete");
      else {
        put(x, y, z, "glass_pane", glassFor(axisAlongX));
        if (y === B + 7 && inward && (x * 3 + z * 5) % 4 === 0) {
          const [ix, iz] = inward;
          if (has(ix, iz) && !info.get(`${ix},${iz}`).ring && gAt(ix, iz) <= B + 7) {
            put(ix, B + 7, iz, "glowstone");
          }
        }
      }
      continue;
    }
    if (y === FLOOR2) { put(x, y, z, "stone_bricks"); continue; }           // storey line
    if (y === B + 4) { put(x, y, z, "white_concrete"); continue; }         // lintel band
    if (y >= B + 1 && y <= B + 3) {                                        // shopfront zone
      if (isDoor && (y === yDoor || y === yDoor + 1)) {
        put(x, y, z, "oak_door", {
          facing: doorFace,
          half: y === yDoor ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isDoor && y === yDoor + 2 && y <= B + 3) {
        put(x, y, z, "glass_pane", glassFor(axisAlongX));                   // transom
      } else if (pillar) {
        put(x, y, z, "gray_concrete");
      } else {
        put(x, y, z, "glass_pane", glassFor(axisAlongX));
      }
      continue;
    }
    if (y === B) { put(x, y, z, "stone_bricks"); continue; }               // base course
    put(x, y, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
