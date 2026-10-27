// Way 332241922: a three-storey interwar brick commercial block on the Mt Eden side of the CBD ridge, with shopfronts
// on its low (west) side, cream plaster string courses and quoins, a parapet, and a penthouse on the roof. Lidar roof
// heights 12-13 blocks above y 0 are smoothed to one flat tier; the few 4-6 cells are single-storey lean-tos. Walls are
// one block thick around a hollow interior (air, with floor slabs per storey), so windows have air behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241922.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241922.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([29, 26, 34]);

// Palette: red brick walls, cream render (white concrete / smooth quartz) for the trim, stone plinth, dark roof.
const STONE = "stone_bricks", BRICK = "bricks", CREAM = "white_concrete", QUOIN = "smooth_quartz";
const CORNICE = "smooth_stone", GLASS = "glass_pane", ROOF = "gray_concrete", CANOPY = "dark_oak_slab";
const PLANT = "light_gray_concrete", LAMP = "glowstone";

const key = (x, z) => `${x},${z}`;
const M = new Map(cells.map(([x, z, gr, r]) => [key(x, z), { x, z, gr, r }]));
const inM = (x, z) => M.has(key(x, z));
const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Per cell: its outward faces (a neighbour outside the footprint), corner or not, and its roof tier.
// Roof 11+ is the main tier (deck block 12, parapet to 14); lower lidar readings are wings at roof-1 (4 -> 3, 6 -> 5).
for (const c of M.values()) {
  c.outs = DIRS.filter((d) => !inM(c.x + d.dx, c.z + d.dz));
  c.perim = c.outs.length > 0;
}
// A run is how many consecutive cells along a facade share the same outward face. The diagonal east edge is a
// staircase of one-cell steps: each step has two outward faces but only the long one is a facade, so only a corner
// where both faces run 3+ cells gets a quoin.
const runOf = (c, d) => {
  const along = d.dz === 0 ? [0, 1] : [1, 0];
  let n = 1;
  for (const s of [-1, 1]) for (let k = 1; ; k++) {
    const x = c.x + along[0] * s * k, z = c.z + along[1] * s * k, o = M.get(key(x, z));
    if (!o || !o.outs.some((q) => q.name === d.name)) break;
    n++;
  }
  return n;
};
for (const c of M.values()) {
  c.runs = c.outs.map((d) => ({ name: d.name, run: runOf(c, d), d }));
  c.runs.sort((p, q) => q.run - p.run);
  c.corner = c.runs.length > 1 && c.runs.every((r) => r.run >= 3);
  c.face = c.runs[0]?.name;
  c.inward = c.runs[0] ? { dx: -c.runs[0].d.dx, dz: -c.runs[0].d.dz } : null;
  c.main = c.r >= 11;
  c.D = c.main ? 12 : c.r - 1;
  c.a = c.face === "north" || c.face === "south" ? c.x : c.z;   // position along the face, for bay rhythm
}
// A tall cell that stands beside a lower wing has open air above the wing: its side is a wall too, so the interior
// does not vent to the sky. It takes the facade of the lower neighbour.
for (const c of M.values()) {
  if (c.perim) continue;
  const lower = DIRS.filter((d) => { const n = M.get(key(c.x + d.dx, c.z + d.dz)); return n && n.D < c.D; });
  if (!lower.length) continue;
  c.perim = true; c.corner = false; c.face = lower[0].name;
  c.inward = { dx: -lower[0].dx, dz: -lower[0].dz };
  c.a = c.face === "north" || c.face === "south" ? c.x : c.z;
}

// The entrance: the middle west-facing cell on the street (ground 0), with a canopy over its bay.
const streetWest = [...M.values()].filter((c) => c.perim && !c.corner && c.face === "west" && c.gr === 0).sort((p, q) => p.z - q.z);
const door = streetWest[Math.floor(streetWest.length / 2)] ?? [...M.values()].find((c) => c.perim && c.gr === 0);
const canopy = new Set();
if (door) for (const c of M.values()) if (c.perim && c.face === door.face && Math.abs(c.a - door.a) <= 1 && c.gr === door.gr) canopy.add(key(c.x, c.z));

// Facade rules, bottom to top. i is the block index (top surface of the cell is i+1 blocks above y 0).
function perimeterBlock(c, i) {
  if (i < c.gr) return { b: STONE };                              // foundation under the lower ground
  if (i === c.gr) return { b: STONE };                            // plinth course on the street
  if (i === c.D) return { b: c.main ? CREAM : CORNICE };          // roof edge: parapet base, or a wing's cornice
  if (c.main && i === c.D + 1) return { b: CORNICE };             // parapet cap, top surface at 14
  if (i > c.D) return null;
  if (c.corner) return { b: QUOIN };                              // quoins at every corner, full height
  const pier = c.a % 3 === 0;                                     // brick piers between the window bays
  if (i < 4) {                                                    // ground storey
    if (door && c === door && i === c.gr + 1) return { b: "oak_door", s: { facing: OPP[c.face], half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (door && c === door && i === c.gr + 2) return { b: "oak_door", s: { facing: OPP[c.face], half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (i === 3) return { b: canopy.has(key(c.x, c.z)) ? CANOPY : CORNICE, s: canopy.has(key(c.x, c.z)) ? { type: "bottom", waterlogged: "false" } : undefined };
    if (c.gr >= 2) return { b: BRICK };
    return { b: pier ? BRICK : GLASS };                           // shopfront glass between piers
  }
  if (i === 4 || i === 7 || i === 8) return { b: CREAM };         // sill, lintel, string course
  if (i === 11) return { b: CORNICE };                            // top-floor cornice
  if ((i >= 5 && i <= 6) || (i >= 9 && i <= 10)) return { b: pier ? BRICK : GLASS };
  return { b: BRICK };
}

// Hollow interior: foundation, a floor slab at the street and at each storey line, and the roof deck above.
function interiorBlock(c, i) {
  if (i < c.gr) return { b: STONE };
  if (i === c.D) return { b: ROOF };
  if (i < c.D && (i === c.gr || i === 4 || i === 8)) return { b: CORNICE };
  return null;
}

const glass = new Map();   // glass pane cell -> the axis it runs along, for its connection states
for (const c of M.values()) {
  const top = c.main ? 13 : c.D;
  for (let i = 0; i <= top; i++) {
    const p = c.perim ? perimeterBlock(c, i) : interiorBlock(c, i);
    if (!p) continue;
    g.set(c.x, i, c.z, p.b, p.s);
    if (p.b === GLASS) glass.set(`${c.x},${i},${c.z}`, c.face === "north" || c.face === "south" ? ["west", "east"] : ["north", "south"]);
  }
}

// Penthouse on the main roof: a 5 x 5 box near the middle of the footprint, two storeys of cream walls, a flat cap.
const isMainInterior = (x, z) => inM(x, z) && M.get(key(x, z)).main && !M.get(key(x, z)).perim;
let ph = null;
for (let z = 1; z < 34 && !ph; z++) for (let x = 1; x < 29 && !ph; x++) {
  let ok = true;
  for (let dz = 0; dz < 5 && ok; dz++) for (let dx = 0; dx < 5 && ok; dx++) if (!inM(x + dx, z + dz) || !M.get(key(x + dx, z + dz)).main) ok = false;
  if (ok) ph = { x, z };
}
if (ph) {
  // prefer the box nearest the footprint's middle (about 14, 16)
  let best = null, bestD = Infinity;
  for (let z = 0; z < 34; z++) for (let x = 0; x < 29; x++) {
    let ok = true;
    for (let dz = 0; dz < 5 && ok; dz++) for (let dx = 0; dx < 5 && ok; dx++) if (!isMainInterior(x + dx, z + dz) && !(M.get(key(x + dx, z + dz))?.main && (dx === 0 || dz === 0 || dx === 4 || dz === 4))) ok = false;
    if (!ok) continue;
    const d = (x + 2 - 14) ** 2 + (z + 2 - 16) ** 2;
    if (d < bestD) { bestD = d; best = { x, z }; }
  }
  ph = best;
}
const phIn = (x, z) => ph && x >= ph.x && x <= ph.x + 4 && z >= ph.z && z <= ph.z + 4;
if (ph) {
  for (let dz = 0; dz < 5; dz++) for (let dx = 0; dx < 5; dx++) {
    const x = ph.x + dx, z = ph.z + dz, edge = dx === 0 || dz === 0 || dx === 4 || dz === 4;
    if (!edge) { g.set(x, 15, z, CORNICE); continue; }   // the cap is solid across the whole box
    g.set(x, 13, z, CREAM); g.set(x, 15, z, CORNICE);
    const midFace = (dx === 2 && (dz === 0 || dz === 4)) || (dz === 2 && (dx === 0 || dx === 4));
    if (midFace) { g.set(x, 14, z, GLASS); glass.set(`${x},14,${z}`, dx === 2 ? ["west", "east"] : ["north", "south"]); }
    else g.set(x, 14, z, CREAM);
  }
}

// Plant units on the main roof: three 2 x 2 boxes, kept off the parapet and the penthouse.
const units = [];
for (let z = 1; z < 33 && units.length < 3; z++) for (let x = 1; x < 28 && units.length < 3; x++) {
  const cell = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cell.every(([u, v]) => isMainInterior(u, v))) continue;
  if (ph && cell.some(([u, v]) => u >= ph.x - 1 && u <= ph.x + 5 && v >= ph.z - 1 && v <= ph.z + 5)) continue;
  if (units.some((p) => Math.abs(p.x - x) < 4 && Math.abs(p.z - z) < 4)) continue;
  units.push({ x, z });
  for (const [u, v] of cell) g.set(u, 13, v, PLANT);
}

// Warm light behind some windows: glowstone in the interior cell just inside the glass, where there is room.
for (const c of M.values()) {
  if (!c.perim || c.corner) continue;
  for (const i of [c.gr + 1, 5, 9]) {
    if (i >= c.D || (c.gr >= 2 && i === c.gr + 1)) continue;
    if (!glass.has(`${c.x},${i},${c.z}`)) continue;
    if ((c.a + i) % 4 !== 1) continue;
    const inX = c.x + c.inward.dx, inZ = c.z + c.inward.dz;
    const inC = M.get(key(inX, inZ));
    if (!inC || inC.perim) continue;
    g.set(inX, i, inZ, LAMP);
  }
}

// Panes connect to the solid neighbours along their own facade, as the vanilla pane states do.
const SOLID = (b) => b && !/door|slab|stairs|glass_pane/.test(b.block);
for (const [k, axis] of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const name of axis) {
    const d = DIRS.find((q) => q.name === name);
    const n = g.get(x + d.dx, y, z + d.dz);
    st[name] = n && (n.block === "minecraft:glass_pane" || SOLID(n)) ? "true" : "false";
  }
  g.set(x, y, z, GLASS, st);
}

const stats = g.save(OUT);
console.log(JSON.stringify({ cells: cells.length, blocks: stats.blocks, palette: stats.palette, penthouse: ph, units, door: door ? key(door.x, door.z) : null }));
