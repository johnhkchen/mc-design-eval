// FR245184604: a Haussmann-era commercial block (c. 1860, four storeys over a shopfront, parapeted flat roof) on the lidar footprint.
// Storeys are 4 blocks (sill band, two glass rows, lintel), so every floor line falls on y = 1 mod 4 and every roof
// on a lintel. Tiers come from the lidar's 3x3 median, snapped to storeys (1..4). Ground floor is a dark-wood shopfront
// with one or two doors per run; upper floors are calcite piers and glass. Interior is solid (no rooms) except an air
// pocket behind each window, with glowstone behind some of them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184604.cells.json`, "utf8"));

const W = 16, H = 35, D = 50;
const MAT = {
  plinth: "polished_andesite",   // y 0 under the whole footprint, and the base course over the shopfront
  band: "polished_andesite",     // sill band at each storey's first row
  wall: "calcite",               // render: piers and lintels
  core: "stone",                 // solid interior
  roof: "smooth_stone",          // flat roof deck
  shop: "dark_oak_planks",       // shopfront piers and fascia
  glass: "glass",
  door: "dark_oak_door",
  cap: "smooth_stone_slab",
  brick: "bricks",
  brickCap: "brick_slab",
  unit: "iron_block",
  light: "glowstone",
};
const FACE = [["W", -1, 0, "west"], ["E", 1, 0, "east"], ["N", 0, -1, "north"], ["S", 0, 1, "south"]];

const fp = new Map();                                   // "x,z" -> { lidar, n, exp }
for (const [x, z, , r] of cells) fp.set(`${x},${z}`, { lidar: r });
const at = (x, z) => fp.get(`${x},${z}`);

// Tier: 5x5 median of the lidar, snapped to whole storeys (1..4): roof top = 4n + 2 (parapet), 19 blocks is four storeys.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.n = Math.min(4, Math.max(1, Math.round((med - 2) / 4)));
  c.exp = FACE.filter(([, dx, dz]) => !at(x + dx, z + dz));   // the faces that look out of the footprint
}
const perim = (c) => c.exp.length > 0;
const nMax = Math.max(...[...fp.values()].map((c) => c.n));

// Doors on the ground floor: each run of plain (non-corner) street faces gets one door in the middle, or two on a long run.
const doors = new Set();
for (const [d] of FACE) {
  const run = [];
  for (const [key, c] of fp) {
    if (!perim(c) || c.exp.length !== 1 || c.exp[0][0] !== d) continue;
    const [x, z] = key.split(",").map(Number);
    run.push({ key, u: d === "W" || d === "E" ? z : x });
  }
  run.sort((a, b) => a.u - b.u);
  if (run.length < 4) continue;
  const picks = run.length >= 14 ? [Math.floor(run.length / 4), Math.floor((3 * run.length) / 4)] : [Math.floor(run.length / 2)];
  for (const i of picks) doors.add(run[i].key);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Pass 1: the solid massing, every cell from y 0 up to its tier, with the perimeter's facade on top.
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const top = 4 * c.n;                                    // solid through the lintel row that closes the top storey
  for (let y = 0; y <= top; y++) put(x, y, z, MAT.core);
  put(x, 0, z, MAT.plinth);
  put(x, top, z, perim(c) ? MAT.wall : MAT.roof);         // roof deck (interior) or lintel (perimeter)
  if (!perim(c)) continue;

  const corner = c.exp.length > 1;
  const u = c.exp[0][0] === "W" || c.exp[0][0] === "E" ? z : x;   // position along the face it looks out of
  for (let k = 0; k < c.n; k++) {
    const b = 4 * k;
    put(x, b + 1, z, MAT.band);                           // sill band
    const pier = corner || u % 3 === 0;
    for (const y of [b + 2, b + 3]) put(x, y, z, k === 0 ? (pier ? MAT.shop : MAT.glass) : (pier ? MAT.wall : MAT.glass));
    put(x, b + 4, z, k === 0 ? MAT.shop : MAT.wall);      // lintel, or the shopfront's fascia
  }
  put(x, 4 * c.n + 1, z, MAT.wall);                       // parapet
  put(x, 4 * c.n + 2, z, MAT.cap);                        // coping
}

// Pass 2: the openings. A door in the street face, and an air pocket behind each window (glowstone behind some).
for (const [key, c] of fp) {
  if (!perim(c)) continue;
  const [x, z] = key.split(",").map(Number);
  const [d, dx, dz, facing] = c.exp[0];
  const ix = x - dx, iz = z - dz;                         // the cell inward from the face
  const inner = at(ix, iz) && !perim(at(ix, iz)) ? at(ix, iz) : null;
  if (doors.has(key) && c.exp.length === 1) {
    put(x, 1, z, MAT.door, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, MAT.door, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, MAT.glass);
    if (inner) for (const y of [1, 2, 3]) put(ix, y, iz, "air");
    continue;
  }
  if (!inner) continue;
  const u = d === "W" || d === "E" ? z : x;
  if (c.exp.length > 1 || u % 3 === 0) continue;         // piers and corners stay solid
  for (let k = 0; k < c.n; k++) {
    const rows = [4 * k + 2, 4 * k + 3];
    const lit = (u + k) % 5 === 1;
    for (const y of rows) {
      if (y > 4 * inner.n) continue;
      put(ix, y, iz, lit && y === rows[0] ? MAT.light : "air");
    }
  }
}

// Pass 3: roof equipment on the top tiers: brick stacks and a few units, all standing on the roof deck.
for (const [key, c] of fp) {
  if (perim(c) || c.n !== nMax) continue;
  const [x, z] = key.split(",").map(Number);
  const y0 = 4 * c.n + 1;
  if (x % 5 === 2 && z % 9 === 4) {
    for (let y = y0; y < y0 + 3; y++) put(x, y, z, MAT.brick);
    put(x, y0 + 3, z, MAT.brickCap, { type: "bottom", waterlogged: "false" });
  } else if (x % 4 === 1 && z % 13 === 10) {
    put(x, y0, z, MAT.unit);
  }
}

g.save(`${DIR}/FR245184604.nbt`);
