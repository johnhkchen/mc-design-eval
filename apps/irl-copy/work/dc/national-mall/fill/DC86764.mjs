// Mount Olivet Lutheran Church (Vermont Ave. Christian Church), 1306 Vermont Ave NW: a stone Gothic-Revival church.
// Massing from the lidar roof record, smoothed into three flat tiers (nave/wings 5, centre and turret 9, SE tower 13).
// Solid stone shell with a one-block air pocket behind each window, a floor band per storey, a deepslate roof and
// a stone cornice; the tower carries merlons and a bell; the west-facing door sits in a recessed porch.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86764.cells.json", "utf8"));

// lidar roof -> nearest flat tier (tops at y 5, 9, 13: one, two, three storeys over the ground)
const tier = (r) => (r <= 7 ? 5 : r <= 10 ? 9 : 13);
const C = new Map();
for (const [x, z, g, r] of cells) C.set(`${x},${z}`, { g, T: tier(r) });
const at = (x, z) => C.get(`${x},${z}`);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the faces that show: open ground beyond the footprint, or a lower tier (a setback's exposed wall)
const normalsOf = (x, z) => {
  const c = at(x, z);
  return DIRS.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.T < c.T; });
};

const g3 = new Voxels([15, 25, 15]);
const pane = (axisX) => ({ north: axisX ? "true" : "false", south: axisX ? "true" : "false", east: axisX ? "false" : "true", west: axisX ? "false" : "true", waterlogged: "false" });

// 1. solid body: foundation to ground, then the stone shell to its tier's cap
for (const [key, { g, T }] of C) {
  const [x, z] = key.split(",").map(Number);
  const perim = normalsOf(x, z).length > 0;
  for (let y = 0; y < g; y++) g3.set(x, y, z, "stone_bricks");
  for (let y = g; y < T - 1; y++) g3.set(x, y, z, "stone_bricks");
  g3.set(x, T - 1, z, perim ? "smooth_stone" : "deepslate_tiles");   // cornice on the edge, slate on the flat tops
}

// 2. facade: base course, floor bands, lintels, lancet-width windows between stone piers, with a pocket behind each
const windows = [];
for (const [key, { g, T }] of C) {
  const [x, z] = key.split(",").map(Number);
  const ns = normalsOf(x, z);
  if (!ns.length) continue;
  const corner = ns.length >= 2;
  const [nx, nz] = ns[0];
  const along = nx !== 0 ? z : x;                       // position along the face
  const inward = at(x - nx, z - nz);
  const pocketOk = !!inward && normalsOf(x - nx, z - nz).length === 0;
  for (let y = g; y < T - 1; y++) {
    const rel = y - g;
    if (rel === 0) { g3.set(x, y, z, "polished_andesite"); continue; }   // plinth
    const r4 = rel % 4;
    if (r4 === 0 || r4 === 3) { g3.set(x, y, z, "smooth_stone"); continue; }  // string course and lintel
    if (corner || along % 2 === 0) { g3.set(x, y, z, "stone_bricks"); continue; }  // piers
    const lit = (along + rel) % 3 === 0;
    g3.set(x, y, z, lit ? "yellow_stained_glass_pane" : "light_blue_stained_glass_pane", pane(nz !== 0));
    if (pocketOk) windows.push({ x, y, z, lit, inX: x - nx, inZ: z - nz });
  }
}
// an air gap behind each pane; glowstone behind the lit ones on their lower row (a warm lamp in each lit bay)
for (const w of windows) {
  const lamp = w.lit && (w.y - C.get(`${w.x},${w.z}`).g) % 4 === 1;
  g3.set(w.inX, w.y, w.inZ, lamp ? "glowstone" : "air");
}

// 3. the recessed west porch on the street face: opening at x 3, two cells deep, lantern under the lintel
for (const y of [2, 3]) {
  g3.set(3, y, 1, "air");
  g3.set(3, y, 0, "dark_oak_door", { facing: "north", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}
g3.set(3, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 4. tower top: a crenellated parapet on alternate edge cells, and the bell on the belfry deck
for (const [key, { T }] of C) {
  if (T !== 13) continue;
  const [x, z] = key.split(",").map(Number);
  if (normalsOf(x, z).length && (x + z) % 2 === 0) g3.set(x, 13, z, "stone_brick_wall", { east: "none", north: "none", south: "none", west: "none", up: "true", waterlogged: "false" });
}
g3.set(11, 13, 13, "bell", { attachment: "floor", direction: "north", powered: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86764.nbt";
const r = g3.save(out);
console.log(JSON.stringify(r));
