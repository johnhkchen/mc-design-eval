import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1520 20th St NW: an embassy chancery on Embassy Row in the Dupont/Kalorama blocks. Early-20th-century
// Beaux-Arts/Georgian-revival in red brick on a granite plinth, with light quartz (limestone-like) belts,
// quoins and a cornice, four storeys of glazed bays on the street front, a central portico with a dark
// canopy, and the lidar's stepped massing: a 9-block core, 6-block wings, a 4-block annex, a 2-block service range.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC61017.cells.json`, "utf8"));

const W = 16, H = 21, D = 12;
const STOREY = 2;                       // 2 blocks per storey: belt course on the floor line, one glass row above it
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const has = (x, z) => raw.has(key(x, z));
const gr = (x, z) => raw.get(key(x, z)).gr;

// Lidar roof: median over a 3x3 window (noise out), snapped to the nearest storey tier (2, 4, 6, 9 blocks)
const TIERS = [2, 4, 6, 9];
const TOP = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const c = raw.get(key(x + dx, z + dz));
      if (c) vals.push(c.roof);
    }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  TOP.set(key(x, z), TIERS.reduce((a, b) => (Math.abs(b - med) < Math.abs(a - med) ? b : a)));
}
const top = (x, z) => TOP.get(key(x, z));
const dirs = [[0, -1, "n"], [0, 1, "s"], [-1, 0, "w"], [1, 0, "e"]];
// A face is exposed when it looks onto the street (outside the footprint) or onto a lower tier (a setback's wall)
const exposed = (x, z) => dirs.filter(([dx, dz]) => !has(x + dx, z + dz) || top(x + dx, z + dz) < top(x, z));
const isPerimeter = (x, z) => exposed(x, z).length > 0;
// A true corner: two faces on the street (not a setback's step); its quoin runs the full height
const streetFaces = (x, z) => exposed(x, z).filter(([dx, dz]) => !has(x + dx, z + dz));
const isWallCorner = (x, z) => streetFaces(x, z).length > 1;
// The face a window row is set into: the street face, else the step a setback shows over its lower neighbour
const windowFace = (x, z) => streetFaces(x, z)[0] ?? exposed(x, z)[0];

// Materials
const PLINTH = "polished_andesite", BRICK = "bricks", TRIM = "smooth_quartz", ROOF = "stone_bricks",
  FLOOR = "oak_planks", GLASS = "glass_pane";

// Main entrance: the north face (20th St NW side), in the core's run
const DOOR = { x: 10, z: 0 };

// Storey rows of a column: the base (plinth or floor line), belts on every floor line, windows between, the cornice on top
function rowKind(x, z, y) {
  const b = gr(x, z), t = top(x, z);
  if (y === t - 1) return "cap";
  if (y === b) return "plinth";
  if ((y - b) % STOREY === 0) return "belt";
  return "window";
}

// Each footprint cell is one column: foundation under the ground line, then its storeys up to its tier.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const b = gr(x, z), t = top(x, z), per = isPerimeter(x, z), corner = isWallCorner(x, z);
  for (let y = 0; y < b; y++) g.set(x, y, z, PLINTH);                   // foundation: solid down to the ground line
  for (let y = b; y < t; y++) {
    const kind = rowKind(x, z, y);
    if (kind === "cap") {
      g.set(x, y, z, per ? TRIM : ROOF);                                 // cornice on the wall, roof cover on the rest
      continue;
    }
    if (!per) {                                                          // interior: floor slabs only, air between
      if (kind === "belt" || kind === "plinth") g.set(x, y, z, FLOOR);
      continue;
    }
    if (kind === "plinth") { g.set(x, y, z, PLINTH); continue; }
    const [dx, dz] = windowFace(x, z);
    const idx = dz !== 0 ? x : z;                                       // position along the face
    if (corner) { g.set(x, y, z, TRIM); continue; }                     // quoins run the full height
    // belts: limestone lintels and sills over and under each glazed bay, brick over the piers
    if (kind === "belt") { g.set(x, y, z, idx % 2 === 1 ? TRIM : BRICK); continue; }
    // a window row: glass in the bays of an outward or upper face, brick piers and blind walls elsewhere
    const outward = !has(x + dx, z + dz) || y >= top(x + dx, z + dz);  // a step's lower rows are a blind wall
    if (outward && idx % 2 === 1) {
      const along = dz !== 0 ? { north: "false", south: "false", east: "true", west: "true" }
        : { north: "true", south: "true", east: "false", west: "false" };
      g.set(x, y, z, GLASS, { ...along, waterlogged: "false" });
    } else {
      g.set(x, y, z, BRICK);
    }
  }
}

// Interior: floor slabs in the storey lines are solid across the footprint (they rest on the walls and on the
// slab below); the air rows between them are the rooms, glazed on the outward faces.
// Ground-floor and upper windows get warm light set into the room air, standing on the floor slab.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isPerimeter(x, z) || isWallCorner(x, z)) continue;
  const [dx, dz] = windowFace(x, z);
  if (has(x + dx, z + dz)) continue;                                    // only street-front bays
  const idx = dz !== 0 ? x : z;
  if (idx % 4 !== 1) continue;
  for (let y = gr(x, z) + 1; y < top(x, z) - 1; y += STOREY) {
    if (rowKind(x, z, y) !== "window") continue;
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz) || isPerimeter(ix, iz)) continue;
    if (y === gr(x, z) + 1) g.set(ix, y, iz, "glowstone");
    else g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Portico: the door stands on the plinth row (the ground line), its head in the first window row, pilasters either
// side; a dark slab canopy sits on the belt above, and a lantern hangs from it.
const plinth = gr(DOOR.x, DOOR.z);
for (const px of [DOOR.x - 1, DOOR.x + 1]) g.set(px, plinth + 1, DOOR.z, TRIM);   // pilasters flank the door
g.set(DOOR.x, plinth, DOOR.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR.x, plinth + 1, DOOR.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = DOOR.x - 1; x <= DOOR.x + 1; x++) g.set(x, plinth + 2, DOOR.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
g.set(DOOR.x, plinth + 3, DOOR.z, "lantern", { hanging: "true", waterlogged: "false" });

// Roof: mechanical boxes and a stack on the core, a few standing lanterns on the lower terraces
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (isPerimeter(x, z)) continue;
  const t = top(x, z);
  if (t === 9 && x % 5 === 2 && z % 4 === 2) g.set(x, t, z, "copper_block");
  if (t === 9 && x === 11 && z === 6) { g.set(x, t, z, "bricks"); g.set(x, t + 1, z, "bricks"); }
  if (t === 6 && x % 4 === 1 && z % 3 === 1) g.set(x, t, z, "lantern", { hanging: "false", waterlogged: "false" });
}

const r = g.save(`${DIR}/DC61017.nbt`);
console.log(JSON.stringify(r));
