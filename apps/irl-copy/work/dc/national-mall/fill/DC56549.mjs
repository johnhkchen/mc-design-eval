// Carnegie Institution of Washington, Administration Building (1530 P St NW): a c.1910 Classical Revival office block
// in pale limestone, massed from the lidar roof: a 6-block perimeter, a 7-block body, an 8-block central pavilion
// with an attic and balustrade, and a recessed 4-block entrance bay on the north front. Three storeys of windows
// with string courses between, a rusticated base, quoins at the corners, a smooth cornice on every top. Every
// column is solid from its ground up to its top at the floor-slab rows, and the window rows are air behind the
// glass, so nothing hangs. Warm lanterns hang behind a quarter of the panes and stand on the pavilion roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56549.cells.json`, "utf8"));

const WALL = "calcite", BASE = "stone_bricks", CORNICE = "smooth_stone", QUOIN = "quartz_pillar";
const GLASS = "glass_pane", SLAB = "smooth_stone_slab", DOOR = "dark_oak_door", RAIL = "stone_brick_wall";

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, gr, roof]) => [key(x, z), { gr, roof }]));
const ground = (x, z) => raw.get(key(x, z)).gr;

// The lidar's lone 8s in the 7-block body are noise: an 8 with fewer than three 8 neighbours drops to 7.
const eightNeighbours = (x, z) => [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
  .filter(([dx, dz]) => raw.get(key(x + dx, z + dz))?.roof === 8).length;
const top = new Map();
for (const [x, z, , roof] of cells) top.set(key(x, z), roof === 8 && eightNeighbours(x, z) < 3 ? 7 : roof);
const T = (x, z) => top.get(key(x, z)) ?? -1;                 // -1 = outside the footprint

// The entrance vestibule: a 2 x 2 hall, open to the north front, 4 blocks under the cornice.
const isVestibule = (x, y, z) => (x === 10 || x === 11) && (z === 1 || z === 2) && (y === 1 || y === 2);
const isDoor = (x, y, z) => (x === 10 || x === 11) && z === 0 && (y === 1 || y === 2);

// Directions in which a cell at row y faces open air: outside the footprint, a neighbour with no cell at y, or the vestibule.
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const openSides = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d], nx = x + dx, nz = z + dz;
  return T(nx, nz) <= y || isVestibule(nx, y, nz);
});

const g = new Voxels([25, 20, 15]);
const panes = [];
const columns = [...top.keys()].map((k) => k.split(",").map(Number));

// ---- massing: foundation, then the storeys ----
// Rows: base at the ground, window rows on odd rows, string-course floor slabs on even rows, cornice on the top row.
for (const [x, z] of columns) {
  const H = T(x, z), gr = ground(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");                       // foundation below the ground
  for (let y = gr; y < H; y++) {
    const ext = openSides(x, z, y).length > 0;
    if (isVestibule(x, y, z)) {
      if (y === 2 && ((x === 10 && z === 1) || (x === 11 && z === 2))) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;                                                              // air: the hall
    }
    if (isDoor(x, y, z)) {                                                   // double doors, hinged at the outer edges
      const half = y === 1 ? "lower" : "upper";
      g.set(x, y, z, DOOR, { facing: "north", half, hinge: x === 10 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (y === H - 1) { g.set(x, y, z, ext ? CORNICE : WALL); continue; }   // cornice / roof deck
    if (y === gr) { g.set(x, y, z, ext ? BASE : "stone"); continue; }      // rusticated base
    if (y % 2 === 0) { g.set(x, y, z, WALL); continue; }                  // floor slab + string course (solid, so nothing floats)
    if (!ext) continue;                                                    // window row, interior: air behind the glass
    const ew = openSides(x, z, y).some((d) => d === "E" || d === "W");
    const ns = openSides(x, z, y).some((d) => d === "N" || d === "S");
    if (ew && ns) g.set(x, y, z, QUOIN, { axis: "y" });                    // corner quoins
    else if (ns) {                                                         // long faces: a pier every third cell, panes between
      if (x % 3 === 0) g.set(x, y, z, WALL);
      else { g.set(x, y, z, GLASS); panes.push([x, y, z]); }
    } else {                                                               // end faces: the same rhythm along z
      if (z % 3 === 0) g.set(x, y, z, WALL);
      else { g.set(x, y, z, GLASS); panes.push([x, y, z]); }
    }
  }
}

// ---- the entrance: a slab canopy over the vestibule door, lintel level with the body's string course ----
for (const x of [10, 11]) g.set(x, 4, 0, SLAB, { type: "bottom", waterlogged: "false" });

// ---- the pavilion: a balustrade on its outer rim (row 8), lanterns on its roof ----
const rails = columns.filter(([x, z]) => T(x, z) === 8 && openSides(x, z, 7).length > 0);
const isRail = (x, z) => rails.some(([rx, rz]) => rx === x && rz === z);
for (const [x, z] of rails) {
  const arm = (dx, dz) => (isRail(x + dx, z + dz) ? "low" : "none");          // a run of rail joins its neighbours, so it reads as a balustrade, not battlements
  g.set(x, 8, z, RAIL, { north: arm(0, -1), south: arm(0, 1), east: arm(1, 0), west: arm(-1, 0), up: "true", waterlogged: "false" });
}
for (const [x, z] of columns) {
  if (T(x, z) === 8 && openSides(x, z, 7).length === 0 && x % 4 === 1 && z % 4 === 1) g.set(x, 8, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- warm light: a hanging lantern in the air behind about a quarter of the panes (the cornice/slab above holds it) ----
const isFacing = (x, y, z, d) => openSides(x, z, y).includes(d);
let lights = 0;
for (const [x, y, z] of panes) {
  if ((x * 5 + y * 3 + z) % 4 !== 0) continue;
  const inward = isFacing(x, y, z, "N") ? [x, y, z + 1] : isFacing(x, y, z, "S") ? [x, y, z - 1]
    : isFacing(x, y, z, "W") ? [x + 1, y, z] : isFacing(x, y, z, "E") ? [x - 1, y, z] : null;
  if (!inward || !g.inBounds(...inward) || !top.has(key(inward[0], inward[2]))) continue;
  if (g.get(...inward)) continue;
  g.set(...inward, "lantern", { hanging: "true", waterlogged: "false" }); lights++;
}

// ---- glass panes join their neighbours and the piers, so each window is a framed grid ----
const solidNeighbour = (x, y, z) => { const b = g.get(x, y, z); return b && !["minecraft:lantern", "minecraft:dark_oak_door"].includes(b.block); };
for (const [x, y, z] of panes) {
  g.set(x, y, z, GLASS, {
    north: String(!!solidNeighbour(x, y, z - 1)), south: String(!!solidNeighbour(x, y, z + 1)),
    east: String(!!solidNeighbour(x + 1, y, z)), west: String(!!solidNeighbour(x - 1, y, z)), waterlogged: "false",
  });
}

const out = `${DIR}/DC56549.nbt`;
const r = g.save(out);
console.log(`DC56549: ${r.blocks} blocks, ${r.palette} palette entries, ${panes.length} panes, ${lights} lanterns behind glass -> ${out}`);
