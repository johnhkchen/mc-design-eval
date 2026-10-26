import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1990 M St NW, Commercial-Office-Large: a brick and stone office block on a granite plinth, four storeys of 3-block
// modules over the wings, with the core stepped up two blocks over them, a one-storey shopfront annex to the south and
// a plant room on the wing roof. The lidar roofs snap to four flat tiers: 3 (annex), 8 (bay), 12 (wings), 14 (core).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58283.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const g = new Voxels([16, 26, 18]);

const tier = (r) => (r <= 3 ? 3 : r <= 8 ? 8 : r <= 12 ? 12 : 14);
const H = new Map(), G = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, ground, roof] of cells) { H.set(key(x, z), tier(roof)); G.set(key(x, z), ground); }
const hAt = (x, z) => H.get(key(x, z)) ?? 0;

// the faces of a cell at height y that are outside: off the footprint, or beside a neighbour that stops below y
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const exposed = (x, z, y) => Object.keys(DIRS).filter(
  (f) => { const [dx, dz] = DIRS[f]; return hAt(x + dx, z + dz) <= y; });

// a glass pane joins along its wall: east-west on a z face, north-south on an x face
const pane = (zFace) => (zFace ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });

const lights = [];
for (const [x, z, ground] of cells) {
  const h = H.get(key(x, z));
  // foundation: solid from y 0 up to the cell's ground (0 across this footprint, so nothing to fill)
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");
  for (let y = 0; y < h; y++) {
    const f = exposed(x, z, y);
    if (y === h - 1) { g.set(x, y, z, f.length ? "smooth_sandstone" : "stone"); continue; }   // cornice ring, roof deck
    if (!f.length) { if (y % 3 === 0) g.set(x, y, z, "stone"); continue; }                 // floor slab; air behind the glass
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }                           // granite plinth
    if (y % 3 === 0) { g.set(x, y, z, "smooth_sandstone"); continue; }                       // storey string course
    if (f.length >= 2) { g.set(x, y, z, "smooth_sandstone"); continue; }                     // quoined corners
    const zFace = f.includes("N") || f.includes("S");
    const i = zFace ? x : z;                                                                  // position along the face
    if (i % 3 === 0) { g.set(x, y, z, "bricks"); continue; }                                  // brick piers frame each bay
    g.set(x, y, z, "glass_pane", pane(zFace));
    if (y % 3 === 1 && (i + Math.floor(y / 3)) % 6 === 1) lights.push({ x, y, z, face: f[0] });
  }
}

// a lit bay: glowstone in the air gap just inside the glass
const IN = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
for (const { x, y, z, face } of lights) {
  const [dx, dz] = IN[face];
  const cx = x + dx, cz = z + dz;
  if (hAt(cx, cz) > y && exposed(cx, cz, y).length === 0) g.set(cx, y, cz, "glowstone");
}

// the entrance: a three-bay portal on the north face (z 2): granite pilasters, two-block door, stone lintel
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
for (let y = 0; y <= 2; y++) { g.set(6, y, 2, "polished_granite"); g.set(8, y, 2, "polished_granite"); }
g.set(7, 0, 2, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(7, 1, 2, "dark_oak_door", { ...DOOR, half: "upper" });
g.set(7, 2, 2, "smooth_sandstone");

// roof equipment: a two-block plant room on the wing roof, standing on the roof deck
for (let x = 1; x <= 2; x++) for (let z = 3; z <= 4; z++) for (let y = 12; y <= 13; y++) g.set(x, y, z, "light_gray_concrete");

const stats = g.save(`${DIR}/DC58283.nbt`);
console.log(JSON.stringify(stats));
