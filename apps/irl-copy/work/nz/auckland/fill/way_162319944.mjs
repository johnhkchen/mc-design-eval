// Lower Greys Avenue Flats: an eight-storey, 1970s reinforced-concrete apartment block on the Auckland CBD ridge edge.
// Massing from the lidar roof (smoothed, snapped to 4-block storeys), a podium ring with setbacks, a solid concrete core
// (no interiors), a 1-block air gap behind every glazed bay, global storey lines so neighbours align.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162319944.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162319944.nbt";
const cells = JSON.parse(readFileSync(SRC, "utf8"));

const CORE = "smooth_quartz", BAND = "light_gray_concrete", MULLION = "gray_concrete", GLASS = "light_blue_stained_glass_pane";
const BASE = "polished_andesite", ROOF = "stone", DOOR = "dark_oak_door", LIT = "glowstone";

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const ORDER = ["north", "south", "west", "east"];
const up4 = (v) => Math.ceil(v / 4) * 4;

const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(`${x},${z}`, g); roof.set(`${x},${z}`, r); }
const inF = (x, z) => ground.has(`${x},${z}`);
const xyOf = (k) => k.split(",").map(Number);

// depth from the outside edge: 0 on the facade ring, growing inward
const depth = new Map(), q = [];
for (const k of ground.keys()) {
  const [x, z] = xyOf(k);
  if (ORDER.some((n) => !inF(x + DIRS[n][0], z + DIRS[n][1]))) { depth.set(k, 0); q.push([x, z]); }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i], d0 = depth.get(`${x},${z}`);
  for (const n of ORDER) {
    const nx = x + DIRS[n][0], nz = z + DIRS[n][1], nk = `${nx},${nz}`;
    if (inF(nx, nz) && !depth.has(nk)) { depth.set(nk, d0 + 1); q.push([nx, nz]); }
  }
}

// lidar roof smoothed over a 7x7 window of footprint cells, snapped to storeys of 4 blocks
const smoothRoof = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    const k = `${x + dx},${z + dz}`; if (roof.has(k)) { s += roof.get(k); n++; }
  }
  return s / n;
};

// per cell: g ground, G first storey line (global, 4-multiple) above the base, T top, d depth
const plan = new Map();
for (const [k, g] of ground) {
  const [x, z] = xyOf(k), d = depth.get(k);
  const T = Math.min(32, Math.max(16, 4 * Math.round(smoothRoof(x, z) / 4)));
  const G = up4(g + 4);
  const cap = 20 + 4 * Math.floor(d / 2);            // podium ring 20, then setbacks stepping up to the tower
  const Tp = Math.max(Math.min(T, cap), G + 4);
  plan.set(k, { x, z, g, G, T: Tp, d, facade: d === 0 ? ORDER.find((n) => !inF(x + DIRS[n][0], z + DIRS[n][1])) : null });
}

// entrance: the lowest-ground facade cell, nearest the middle of its run
const facades = [...plan.values()].filter((c) => c.facade);
const minG = Math.min(...facades.map((c) => c.g));
const door = facades.filter((c) => c.g === minG).sort((a, b) => a.x - b.x || a.z - b.z);
const doorCell = door[Math.floor(door.length / 2)] ?? facades[0];
const doorKey = `${doorCell.x},${doorCell.z}`;

const put = new Map();      // "x,y,z" -> [block, state]
const gaps = new Set();     // air behind the glazing (inward cell, same y)
const k3 = (x, y, z) => `${x},${y},${z}`;
const paneState = (o) => (o === "north" || o === "south"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the solid core, every column from y 0 to its top
for (const c of plan.values()) {
  for (let y = 0; y < c.T; y++) {
    const topRow = y === c.T - 1;
    if (c.d >= 1) put.set(k3(c.x, y, c.z), [topRow ? ROOF : CORE]);
    else put.set(k3(c.x, y, c.z), [CORE]);
  }
}

// facade articulation
const glowCand = [];
for (const c of facades) {
  const o = c.facade, [dx, dz] = DIRS[o];
  const along = o === "north" || o === "south" ? c.x : c.z;
  const ix = c.x - dx, iz = c.z - dz, inKey = `${ix},${iz}`;
  const gapOK = inF(ix, iz) && depth.get(inKey) >= 1;
  const isDoorCell = `${c.x},${c.z}` === doorKey;
  const mullionCol = along % 3 === 0;
  const glazed = (y) => {
    if (mullionCol) put.set(k3(c.x, y, c.z), [MULLION]);
    else {
      put.set(k3(c.x, y, c.z), [GLASS, paneState(o)]);
      if (gapOK) { gaps.add(k3(ix, y, iz)); glowCand.push([ix, y, iz, c.x, c.z]); }
    }
  };
  // base course on the ground
  put.set(k3(c.x, c.g, c.z), [BASE]);
  // ground floor: shopfront (lobby) with the entrance
  for (let y = c.g + 1; y <= c.G - 2; y++) {
    if (isDoorCell && (y === c.g + 1 || y === c.g + 2)) {
      put.set(k3(c.x, y, c.z), [DOOR, { facing: OPP[o], half: y === c.g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }]);
      if (gapOK) gaps.add(k3(ix, y, iz));
      continue;
    }
    glazed(y);
  }
  if (isDoorCell) put.set(k3(c.x, c.g + 3, c.z), [BAND]);     // lintel over the door
  put.set(k3(c.x, c.G - 1, c.z), [BAND]);                      // fascia under the first storey line
  // storeys: a band course on each storey line, three rows of glazing between
  for (let y = c.G; y <= c.T - 1; y++) {
    if ((y - c.G) % 4 === 0) put.set(k3(c.x, y, c.z), [BAND]);
    else glazed(y);
  }
  put.set(k3(c.x, c.T, c.z), [BAND]);                          // parapet cap
}

// a 1-block air gap behind glazing (never written); a few bays lit warm from behind with glowstone
for (const [x, y, z] of glowCand) {
  const h = (x * 7 + y * 5) % 13;
  if (h === 0 || h === 6) put.set(k3(x, y, z), [LIT]);
}

// roof plant rooms on the flat tops of the core (supported: full column below)
for (const c of plan.values()) {
  if (c.d < 3 || c.x % 14 !== 6 || c.z % 14 !== 6) continue;
  const box = [];
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) {
    const p = plan.get(`${c.x + dx},${c.z + dz}`);
    if (!p || p.T !== c.T || p.d < 2) { box.length = 0; break; }
    box.push([c.x + dx, c.z + dz]);
  }
  for (const [x, z] of box) { put.set(k3(x, c.T, z), [BAND]); put.set(k3(x, c.T + 1, z), [MULLION]); }
}

// write the volume (gaps are air: they never get a block)
const g = new Voxels([85, 44, 86]);
for (const [k, [block, state]] of put) {
  const [x, y, z] = k.split(",").map(Number);
  if (gaps.has(k) && block !== LIT) continue;
  g.set(x, y, z, block, state);
}
const info = g.save(OUT);
const tiers = {};
for (const c of plan.values()) tiers[c.T] = (tiers[c.T] || 0) + 1;
console.log(JSON.stringify({ out: OUT, blocks: info.blocks, palette: info.palette, door: doorKey, cellsByTop: tiers, glazedGaps: gaps.size }));
