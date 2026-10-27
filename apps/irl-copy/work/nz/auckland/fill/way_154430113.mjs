// Saint James Apartments (way 154430113): an 1930s Art Deco apartment block, eight storeys of cream glazed terracotta
// over a brick-and-stone plinth, with teal Deco accents, a stepped massing on the lidar's roof (podium, wing, setback,
// main roof) and a roof plant room. Every column is solid from y 0 up to its tier (foundation below the ground line,
// the building above), so nothing floats. Interiors are air with a floor slab per 4-block storey; a row of lanterns
// stands behind some of the windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_154430113";
const X = 35, Y = 46, Z = 50;
const STOREY = 4;
const LEVELS = [16, 20, 28, 32];                   // podium, wing, setback, main roof (storeys 4, 5, 7, 8)

const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const info = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const snap = (v) => LEVELS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));

// each footprint cell: its ground G and its roof tier T, the lidar roof's 3x3 median snapped to the tiers
const T = new Map(), G = new Map();
for (const [x, z, g] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = info.get(key(x + dx, z + dz)); if (c) near.push(c.r);
  }
  let t = snap(median(near));
  if (t < g + STOREY) t = LEVELS.find((l) => l >= g + STOREY);
  T.set(key(x, z), t); G.set(key(x, z), g);
}

const inF = (x, z) => T.has(key(x, z));
const top = (x, z) => T.get(key(x, z)) ?? 0;
const solid = (x, y, z) => inF(x, z) && y >= 0 && y < top(x, z);
const NORMALS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, y, z) => NORMALS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const SOUTH = (out) => out.some(([dx, dz]) => dx === 0 && dz === 1);

// the entrance: two door cells on the +z face (the lowest ground among those with a clear bay either side)
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const doorCands = cells.filter(([x, z, g]) => SOUTH(exposed(x, g + 1, z)) && SOUTH(exposed(x + 1, g + 1, z)) && inF(x + 1, z) && inF(x - 1, z) && inF(x + 2, z));
doorCands.sort((a, b) => (top(b[0], b[1]) >= 28) - (top(a[0], a[1]) >= 28) || a[2] - b[2] || Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));   // the main block's face first, then the lowest ground
const [DX, DZ] = doorCands[0] ?? [0, 0];

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const GLASS = (x, z, s) => ((x * 31 + z * 17 + s * 7) % 5 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
const FRAME = "smooth_quartz", BAND = "smooth_quartz", BODY = "white_terracotta", TEAL = "cyan_terracotta";

// one exterior cell above its ground: plinth, entrance bay, storey bands, glazed bays with mullions, corner quoins
function facade(x, y, z, out, gr) {
  const [nx] = out[0];
  const r = y % STOREY, s = Math.floor(y / STOREY);
  if (z === DZ && SOUTH(out) && x >= DX - 1 && x <= DX + 2 && y <= gr + 2) {               // entrance bay: 2 doors, glass, teal lintel
    const door = x === DX || x === DX + 1;
    if (y === gr + 2) return put(x, y, z, TEAL);
    if (door && y <= gr + 1) return put(x, y, z, "dark_oak_door", {
      facing: "south", half: y === gr ? "lower" : "upper", hinge: x === DX ? "left" : "right", open: "false", powered: "false",
    });
    if (y === gr) return put(x, y, z, "stone_bricks");
    return put(x, y, z, "light_blue_stained_glass");
  }
  if (y === gr) return put(x, y, z, "stone_bricks");                                        // plinth course on the ground
  if (r === 0) return put(x, y, z, BAND);                                                   // floor line
  if (r === 3) return put(x, y, z, BODY);                                                   // head course
  const along = nx !== 0 ? z : x;
  if (along % 3 === 0) return put(x, y, z, FRAME);                                          // mullion
  put(x, y, z, GLASS(x, z, s));
  // a warm light in some windows: a lantern standing on the floor slab, just behind the glass
  const [ox, oz] = out[0], ix = x - ox, iz = z - oz;
  if (r === 1 && (x * 13 + z * 7 + s * 5) % 9 === 0 && inF(ix, iz) && !exposed(ix, y, iz).length && y - 1 >= gr) {
    put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

for (const [x, z, gr] of cells) {
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }                                 // foundation under the ground line
    if (y === t - 1) {                                                                       // roof: a teal cornice on the edge, membrane inside
      put(x, y, z, exposed(x, y, z).length ? TEAL : "light_gray_concrete");
      continue;
    }
    const out = exposed(x, y, z);
    if (!out.length) {                                                                       // interior: a floor slab per storey, air between
      if (y === gr || y % STOREY === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }
    facade(x, y, z, out, gr);
  }
  if (exposed(x, t - 1, z).length && t < Y) put(x, t, z, BODY);                              // parapet on the roof's edge
}

// the roof plant room: a 5 x 5 box on the main roof, inset 2 cells from the edges, walls two high and a flat cap
const mainCells = cells.filter(([x, z]) => top(x, z) === 32);
const inset = (x, z, d) => { for (let dz = -d; dz <= d; dz++) for (let dx = -d; dx <= d; dx++) if (top(x + dx, z + dz) !== 32) return false; return true; };
const plantCands = mainCells.filter(([x, z]) => inset(x, z, 2));
const mx = mainCells.reduce((s, c) => s + c[0], 0) / mainCells.length, mz = mainCells.reduce((s, c) => s + c[1], 0) / mainCells.length;
plantCands.sort((a, b) => (a[0] - mx) ** 2 + (a[1] - mz) ** 2 - ((b[0] - mx) ** 2 + (b[1] - mz) ** 2));
if (plantCands.length) {
  const [px, pz] = plantCands[0];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const x = px + dx, z = pz + dz, edge = Math.abs(dx) === 2 || Math.abs(dz) === 2;
    if (edge) { put(x, 32, z, BODY); put(x, 33, z, BODY); }                              // walls, air inside
    put(x, 34, z, FRAME);                                                                // flat cap
  }
}

const stats = g.save(`${DIR}/${NAME}.nbt`);
console.log(JSON.stringify({ door: [DX, DZ], plant: plantCands[0] ?? null, ...stats }));
