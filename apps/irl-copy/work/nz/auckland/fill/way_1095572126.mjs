// Auckland way 1095572126: a two-storey 1920s brick-and-render corner shop. Stone plinth, brick walls, cream render
// piers and string courses, a shopfront of glass bays and a timber door under a hood. Where the lidar roof reads 9
// (the back diagonal) a raised attic steps up, its walls standing on the lower roof's edge.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572126.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572126.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
// roof is the lidar height above y 0, so the top solid row is roof - 1
const FOOT = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, top: roof - 1 }]));
const at = (x, z) => FOOT.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const step = (x, z, d) => [x + DIRS[d][0], z + DIRS[d][1]];
// faces onto the street or the open air: the neighbour is off the footprint
const outFaces = (x, z) => Object.keys(DIRS).filter((d) => !at(...step(x, z, d)));
// faces onto a lower tier: the neighbour is in the footprint but its roof is lower (the attic's step)
const stepFaces = (x, z) => Object.keys(DIRS).filter((d) => { const n = at(...step(x, z, d)); return n && n.top < at(x, z).top; });
const lowTop = (x, z) => Math.max(-1, ...stepFaces(x, z).map((d) => at(...step(x, z, d)).top));

const PLINTH = "stone_bricks", WALL = "bricks", FLOOR = "smooth_stone", TRIM = "smooth_quartz";
const pane = (n, e, s, w) => ({ north: String(n), east: String(e), south: String(s), west: String(w), waterlogged: "false" });

const g = new Voxels([11, 22, 9]);
const panes = [];       // glass cells, to join up with their neighbours once the walls are up
const windows = [];     // { x, y, z, out, along } for the lights behind the glass
let door = null;

// the front: the north face (z = min), the one-face cell nearest the middle of the run
const northOnly = [...FOOT.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => {
  const o = outFaces(x, z); return o.length === 1 && o[0] === "north" && at(x, z).top >= 6;
});
const meanX = northOnly.reduce((s, [x]) => s + x, 0) / northOnly.length;
const [dx, dz] = northOnly.reduce((best, c) => (Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best));
door = { x: dx, z: dz };

for (const [key, { ground, top }] of FOOT) {
  const [x, z] = key.split(",").map(Number);
  const out = outFaces(x, z), st = stepFaces(x, z), low = lowTop(x, z);
  for (let y = 0; y <= top; y++) {
    if (y < ground || y === 0) { g.set(x, y, z, PLINTH); continue; }             // base course / foundation
    const wall = out.length > 0 || (st.length > 0 && y > low);
    if (!wall) { if (y === 3 || y === 6 || y === top) g.set(x, y, z, FLOOR); continue; }  // interior: floor slabs and the roof deck
    const faces = [...new Set([...out, ...st])];
    if (y === top || y === 3 || y === 6) { g.set(x, y, z, TRIM); continue; }     // cornice and the storey lines
    const along = faces.includes("north") || faces.includes("south") ? x : z;
    // a true convex corner only: open to the air on both axes (the stepped footprint's notches stay brick)
    const corner = out.some((f) => f === "north" || f === "south") && out.some((f) => f === "east" || f === "west");
    const ground1 = y <= 2;
    if (corner || along % 3 === 0) { g.set(x, y, z, TRIM); continue; }           // corners and pilasters
    if (ground1) { g.set(x, y, z, "glass_pane", pane(0, 0, 0, 0)); panes.push([x, y, z]); windows.push({ x, y, z, out: out[0], along }); continue; }
    if (along % 3 === 1) { g.set(x, y, z, "glass_pane", pane(0, 0, 0, 0)); panes.push([x, y, z]); windows.push({ x, y, z, out: out[0], along }); continue; }
    g.set(x, y, z, WALL);                                                         // spandrel brick between bays
  }
}

// the entrance: a timber door on the north face, its hood on the storey line above
for (const y of [1, 2]) {
  const half = y === 1 ? "lower" : "upper";
  g.set(door.x, y, door.z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
}
g.set(door.x, 3, door.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
const isDoor = (x, z) => x === door.x && z === door.z;
const glass = panes.filter(([x, , z]) => !isDoor(x, z));

// warm light behind some bays: a lantern on the ground floor, a glowstone on the upper floor, in the air behind the glass
for (const w of windows) {
  if (!w.out || isDoor(w.x, w.z)) continue;
  const [ox, oz] = DIRS[w.out];
  const ix = w.x - ox, iz = w.z - oz;                                             // the cell inside, away from the face
  if (w.y === 1 && w.along % 6 === 1 && g.get(ix, 1, iz) === null) g.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  if (w.y === 4 && w.along % 6 === 4 && g.get(ix, 4, iz) === null) g.set(ix, 4, iz, "glowstone");
}

// roof plant on the flat roofs, standing on the roof deck
for (const [key, { top }] of FOOT) {
  const [x, z] = key.split(",").map(Number);
  if (top === 6 && outFaces(x, z).length === 0 && stepFaces(x, z).length === 0 && x % 4 === 2 && z % 3 === 1) g.set(x, 7, z, "iron_block");
}

// join each pane to the blocks beside it in its plane
for (const [x, y, z] of glass) {
  const linked = (d) => { const [nx, nz] = step(x, z, d); return g.get(nx, y, nz) !== null; };
  g.set(x, y, z, "glass_pane", pane(linked("north"), linked("east"), linked("south"), linked("west")));
}

console.log(g.save(OUT));
