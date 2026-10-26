// DC81040: religious building at 1500 16th St NW, Washington DC 20036, as a 1.21.1 module. A Romanesque-revival
// church in red brick with calcite (white limestone) trim: a 2-storey nave and aisles, a single-storey lower wing
// to the south, and a 14-block bell tower on the north-east corner. Lidar roof heights are smoothed (3x3 median over
// the footprint) and snapped to clean tiers of 4-block storeys (4, 8, 12 or 14 tops), so every tier stands on the
// one below it. Each column is solid from y 0 up to its ground (plinth) and then up to its tier, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81040.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81040.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const at = (x, z) => F.get(key(x, z));

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and edge gaps drop out).
const median = (x, z) => {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(x + dx, z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  return vals[vals.length >> 1];
};
// Storey tiers: a 1-storey lower wing (top 4, parapet to 5), a 2-storey nave (top 8, parapet to 9), the 14-block tower.
const tier = (r) => (r <= 5 ? 4 : r <= 9 ? 8 : r <= 12 ? 12 : 14);
for (const c of F.values()) c.T = tier(median(c.x, c.z));
const T = (x, z) => at(x, z).T;

// Storey lines: a string course at y 0, 4, 8, 12; windows sit in the two rows under each next course.
const COURSE = (y) => y % 4 === 0;
const DIRS = [
  { dx: 0, dz: -1, name: "north" }, { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" }, { dx: 1, dz: 0, name: "east" },
];

// Palette
const PLINTH = "stone_bricks";
const WALL = "bricks";
const TRIM = "calcite";            // quoins, piers, string courses, sills, cornice
const PARAPET = "stone_brick_wall";
const ROOF = "deepslate_tiles";
const FLOOR = "smooth_stone";
const GLASS = "glass_pane";
const DOOR = "dark_oak_door";
const LAMP = "lantern";
const HVAC = "copper_block";

const g = new Voxels([15, 16, 26]);

// A side is open to the air at height y when there is no footprint cell beside it, or the cell beside it is shorter.
const exposed = (x, z, y, d) => { const n = at(x + d.dx, z + d.dz); return !n || y >= n.T; };

const windowCol = (i) => i % 4 === 1 || i % 4 === 2;   // two-cell windows between one-cell piers, on every face

const glass = [];
const lampSpots = [];

for (const c of F.values()) {
  const { x, z, g: ground, T: top } = c;
  for (let y = 0; y < ground; y++) g.set(x, y, z, PLINTH);            // foundation under the cell's ground
  for (let y = ground; y < top; y++) {
    const faces = DIRS.filter((d) => exposed(x, z, y, d));
    if (faces.length === 0) {                                          // inside the building
      if (y === top - 1) g.set(x, y, z, ROOF);                          // the storey roof over the interior
      else if (COURSE(y)) g.set(x, y, z, FLOOR);                        // floor slab per storey
      continue;
    }
    const corner = faces.length >= 2;
    const face = faces[0];
    const i = face.dx !== 0 ? z : x;                                    // position along the face
    if (y === top - 1) { g.set(x, y, z, TRIM); continue; }              // cornice course under the roof
    if (COURSE(y) || corner) { g.set(x, y, z, TRIM); continue; }        // string courses and quoins
    const win = windowCol(i) && y <= top - 2;
    if (y % 4 === 1) { g.set(x, y, z, win ? TRIM : WALL); continue; }   // window sills, brick between
    if (y % 4 === 2 || y % 4 === 3) {
      if (win) { g.set(x, y, z, GLASS); glass.push([x, y, z]); continue; }
      g.set(x, y, z, WALL);                                             // brick pier between the glazed bays
      continue;
    }
  }
  // Parapet on the true outer edge of a 1- or 2-storey tier.
  if (top < 14) for (const d of DIRS) if (!at(x + d.dx, z + d.dz)) { g.set(x, top, z, PARAPET); break; }
}

// Lanterns in some windows: one cell inward of the pane, on the floor slab under the glass.
for (const [x, y, z] of glass) {
  if (y % 4 !== 2) continue;
  const k = Math.floor(y / 4);
  const outside = DIRS.find((d) => !at(x + d.dx, z + d.dz));
  if (!outside) continue;
  const ix = x - outside.dx, iz = z - outside.dz;                       // one cell inward
  const inner = at(ix, iz);
  if (!inner || inner.g > y - 1 || y - 1 > inner.T - 2) continue;
  if (DIRS.some((d) => exposed(ix, iz, y - 1, d))) continue;             // only inside the room, never in a wall
  if (((x + z + k) % 3) !== 0) continue;
  g.set(ix, y - 1, iz, LAMP, { hanging: "false", waterlogged: "false" });
}

// Entrances: the main portal on the north gable (the nave end), a side door on the west face.
const portalX = 7;
for (const y of [0, 1]) g.set(portalX, y, 0, DOOR, { facing: "north", half: y ? "upper" : "lower", hinge: "left", open: "false", powered: "false" });
g.set(6, 0, 0, TRIM); g.set(6, 1, 0, TRIM); g.set(6, 2, 0, TRIM); g.set(6, 3, 0, TRIM);
g.set(8, 3, 0, TRIM);                                                   // lintel over the door
g.set(portalX, 2, 0, TRIM);
const sideZ = 5;
for (const y of [0, 1]) g.set(0, y, sideZ, DOOR, { facing: "west", half: y ? "upper" : "lower", hinge: "left", open: "false", powered: "false" });

// Roof equipment on the lower wing: two copper air-handling boxes.
for (const [x, z] of [[5, 19], [6, 19], [5, 20], [6, 20]]) g.set(x, 4, z, HVAC);

// Glass panes connect to their neighbours in the wall plane (walls, piers and other panes), not into air.
const SOLID = new Set(["bricks", "stone_bricks", "calcite", "smooth_stone", "deepslate_tiles", "copper_block", "glass_pane"]);
for (const [x, y, z] of glass) {
  const conn = {};
  for (const d of DIRS) {
    const nb = g.get(x + d.dx, y, z + d.dz);
    conn[d.name] = nb && SOLID.has(nb.block.replace("minecraft:", "")) ? "true" : "false";
  }
  g.set(x, y, z, GLASS, { ...conn, waterlogged: "false" });
}

console.log(g.save(OUT));
