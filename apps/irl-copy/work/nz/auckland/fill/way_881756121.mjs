// Skyview: a 1970s concrete-and-tinted-glass office tower on the Auckland CBD ridge. A 13-storey slab (roof 53 blocks
// above y 0, the lidar height) with setback tiers stepping down to the north-east and a low lobby-level plinth where
// the lidar reads ground. Solid concrete structure, a 1-block air gap behind every window, a floor line and a head
// band per storey, piers between bays, a glazed lobby with a canopy band and a dark oak entrance door, and warm
// lights in a few offices. Not a room-by-room interior: the shell reads from the air and from the street at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_881756121.cells.json", "utf8"));
const W = 22, D = 34, Y = 66;
const key = (x, y, z) => `${x},${y},${z}`;
const col = (x, z) => `${x},${z}`;

// Massing per footprint cell: g = ground, T = top of the body (storeys are 4 blocks, on absolute storey lines),
// H = top of the roof zone (the tower's parapet and roof deck sit one block above its 52-block body).
// Lidar roof values under 3 blocks above ground are terraces: foundation only, no body.
const fp = new Map();
for (const [x, z, g, r] of cells) {
  if (r - g < 3) { fp.set(col(x, z), { g, T: g, H: g }); continue; }
  const T = Math.max(r >= 49 ? 52 : 4 * Math.round(r / 4), g + 4);
  fp.set(col(x, z), { g, T, H: T === 52 ? 53 : T });
}
// Lidar noise: each body's top becomes the median of its 3x3 neighbourhood (lower middle, so it stays on a storey line),
// which takes the saw-tooth out of the setback edges and leaves clean flat tiers.
const smoothed = new Map();
for (const [k, c] of fp) {
  if (c.T === c.g) continue;
  const [x, z] = k.split(",").map(Number), ts = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = fp.get(col(x + dx, z + dz)); if (n && n.T > n.g) ts.push(n.T);
  }
  ts.sort((a, b) => a - b);
  smoothed.set(k, ts[Math.floor((ts.length - 1) / 2)]);
}
for (const [k, T] of smoothed) {
  const c = fp.get(k), t = Math.max(T, c.g + 4);
  fp.set(k, { g: c.g, T: t, H: t === 52 ? 53 : t });
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// The outward faces of a cell: where the neighbour is off the footprint, or sits lower (a setback).
// Each face with the height it starts at: the ground for an edge, the lower neighbour's top for a setback.
const faces = (x, z, c) => Object.entries(DIRS).flatMap(([d, [dx, dz]]) => {
  const n = fp.get(col(x + dx, z + dz));
  return !n ? [[d, c.g]] : n.T < c.T ? [[d, n.T]] : [];
});

const cellsOut = new Map();  // key x,y,z -> { b, s, pane }; a missing key is air
const put = (x, y, z, b, s, pane) => cellsOut.set(key(x, y, z), { b, s, pane });

for (const [cx, cz] of fp.keys().map((k) => k.split(",").map(Number))) {
  const c = fp.get(col(cx, cz));
  // the foundation: solid from y 0 up to the ground under the cell
  for (let y = 0; y < c.g; y++) put(cx, y, cz, "stone");
  // the structure and roof deck: light concrete, the top layer is the deck
  for (let y = c.g; y < c.H; y++) put(cx, y, cz, "light_gray_concrete");
}

for (const [cx, cz] of fp.keys().map((k) => k.split(",").map(Number))) {
  const c = fp.get(col(cx, cz));
  const fa = faces(cx, cz, c);
  if (!fa.length) continue;
  for (let y = c.g; y < c.H; y++) {
    const fs = fa.filter(([, b]) => y >= b).map(([d]) => d);
    if (!fs.length) continue;
    const k = Math.floor(y / 4), r = y % 4;
    // the roof zone above a tower's body: a parapet on the edge, the deck inside
    if (y >= c.T) { put(cx, y, cz, "white_concrete"); continue; }
    if (fs.length > 1) { put(cx, y, cz, y === c.g ? "polished_andesite" : "white_concrete"); continue; }   // corner pier
    if (y === c.g) { put(cx, y, cz, "polished_andesite"); continue; }                                    // base course
    if (r === 0) { put(cx, y, cz, "light_gray_concrete"); continue; }                                    // floor line
    if (r === 3) { put(cx, y, cz, "white_concrete"); continue; }                                         // head band
    const d = fs[0], j = d === "N" || d === "S" ? cx : cz;
    if (j % 3 === 0) { put(cx, y, cz, "white_concrete"); continue; }                                     // pier between bays
    // the lobby: a glazed ground floor on the north face, with the entrance door at (16, 1)
    if (d === "N" && k === 0 && cx >= 14 && cx <= 18) {
      if (cx === 16 && r === 1) { put(cx, y, cz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (cx === 16 && r === 2) { put(cx, y, cz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      put(cx, y, cz, "light_blue_stained_glass_pane", null, d); continue;
    }
    // an office window: glass with an air gap behind it, and a warm light in some of them
    put(cx, y, cz, "light_blue_stained_glass_pane", null, d);
    const [dx, dz] = DIRS[d], ix = cx - dx, iz = cz - dz;
    if (fp.has(col(ix, iz)) && !cellsOut.get(key(ix, y, iz))?.pane) {
      const h = (cx * 7 + cz * 13 + y * 5) % 9;
      if (k >= 1 && h === 0) put(ix, y, iz, "glowstone");
      else if (k >= 1 && h === 4) put(ix, y, iz, "shroomlight");
      else cellsOut.delete(key(ix, y, iz));
    }
  }
}

// The penthouse plant room on the tower roof: a block of concrete with a smooth cap, standing on the roof deck.
for (const [cx, cz] of fp.keys().map((k) => k.split(",").map(Number))) {
  if (cx < 8 || cx > 13 || cz < 12 || cz > 18 || fp.get(col(cx, cz)).T !== 52) continue;
  put(cx, 53, cz, "white_concrete"); put(cx, 54, cz, "white_concrete"); put(cx, 55, cz, "smooth_stone");
}

// Glass panes connect to the neighbours along their face, so the mullions and runs read as one wall.
const solid = (x, y, z) => cellsOut.has(key(x, y, z));
for (const [k, v] of cellsOut) {
  if (!v.pane) continue;
  const [x, y, z] = k.split(",").map(Number);
  const along = v.pane === "N" || v.pane === "S" ? ["east", "west"] : ["north", "south"];
  const nb = { east: [x + 1, z], west: [x - 1, z], north: [x, z - 1], south: [x, z + 1] };
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const side of along) state[side] = solid(nb[side][0], y, nb[side][1]) ? "true" : "false";
  v.s = state;
  v.b = "light_blue_stained_glass_pane";
}

const g = new Voxels([W, Y, D]);
for (const [k, v] of cellsOut) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.b, v.s ?? undefined);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_881756121.nbt";
const stats = g.save(out);
console.log(`Skyview: ${cells.length} footprint cells, ${stats.blocks} blocks, palette ${stats.palette} -> ${out}`);
