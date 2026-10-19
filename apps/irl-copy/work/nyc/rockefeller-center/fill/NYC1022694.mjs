// 142 West 49 Street, 1903 commercial and office building (the record's "Radio City Apts"): a red-brick loft block of the
// Beaux-Arts era on a stone base, a shopfront ground floor and about 13 storeys on the lidar's main roof (39 blocks).
// A 14-storey pavilion (44) sits on the west corner and the middle of the west half, a stepped 42 on the rear slab, a
// 2-storey wing (6) fills the east half's south and a light court (lidar gap) is left open at grade. Storey lines are
// calcite string courses, the windows are recessed one block into the brick with glass panes and an air gap behind
// each (no interiors), and some panes have warm glowstone behind them. The entrance is a door under a canopy on the
// north street face, and a timber water tank stands on the rear roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022694.cells.json`, "utf8"));
const X = 17, Y = 56, Z = 31;

// Outward faces: N = low z (the north street face, with the entrance), S = rear, W/E = the side walls.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NB = Object.values(DIRS);
const FACE = { N: 0, S: 1, W: 2, E: 3 };
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

// 1. Roof tiers. Lidar of 4 blocks or less is open ground, 5-11 a 2-storey wing, 12-40 the 13-storey main roof, 41 and
// the 42-44 readings are the rear slab (42) and the pavilion (44, on the north half). A lidar gap inside the building
// (three or more built neighbours) takes their median roof; a built cell with fewer than two built neighbours is cut.
const tier = (r, z) => (r <= 4 ? 0 : r <= 11 ? 6 : r <= 40 ? 39 : r === 41 ? 42 : z <= 16 ? 44 : 42);
const lidarRoof = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const base = new Map([...lidarRoof].map(([key, r]) => [key, tier(r, Number(key.split(",")[1]))]));
const baseAt = (x, z) => base.get(`${x},${z}`) ?? 0;
const roof = new Map();
for (const [key, t] of base) {
  const [x, z] = key.split(",").map(Number);
  let v = t;
  if (!v) {
    const n = NB.map(([dx, dz]) => baseAt(x + dx, z + dz)).filter(Boolean).sort((a, b) => a - b);
    if (n.length >= 3) v = n[Math.floor(n.length / 2)];
  }
  roof.set(key, v);
}
const R = (x, z) => roof.get(`${x},${z}`) ?? 0;
const cut = [...roof.keys()].filter((key) => {
  const [x, z] = key.split(",").map(Number);
  return R(x, z) && NB.filter(([dx, dz]) => R(x + dx, z + dz)).length < 2;
});
for (const key of cut) roof.set(key, 0);
const footprint = [...roof.keys()].map((key) => key.split(",").map(Number));
const built = footprint.filter(([x, z]) => R(x, z) > 0);

// The faces open to the air at height y: outside the footprint, open ground, or a roof at or below y.
const exterior = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return R(x + dx, z + dz) <= y; });

const g = new Voxels([X, Y, Z]);
const panes = [];   // [x, y, z, face, shopfront] glass on the outer face, placed after the walls

// 2. Solid core to each roof, shell on the exposed faces. Base course at y 0, a cornice and parapet under the roof, a
// calcite string course at every storey line, calcite quoins at the corners, a shopfront with piers on the ground floor,
// and brick piers between recessed windows above it. The roof is a smooth-stone field with calcite coping at the edges.
for (const [x, z] of built) {
  const top = R(x, z);
  const coping = NB.some(([dx, dz]) => R(x + dx, z + dz) < top);
  for (let y = 0; y < top; y++) {
    if (y === top - 1) { g.set(x, y, z, coping ? "calcite" : "smooth_stone"); continue; }
    const ext = exterior(x, y, z);
    if (!ext.length) { g.set(x, y, z, "bricks"); continue; }
    const face = ext.find((d) => d === "N" || d === "S" || d === "W" || d === "E");
    const quoin = ext.some((d) => d === "N" || d === "S") && ext.some((d) => d === "W" || d === "E");
    const u = face === "W" || face === "E" ? z : x;   // position along the face
    const street = ext.includes("N") && z === 0;
    if (y === 0) g.set(x, y, z, "stone_bricks");                                 // base course
    else if (y === top - 2) g.set(x, y, z, "stone_bricks");                      // parapet
    else if (y === top - 3) g.set(x, y, z, "calcite");                           // cornice
    else if (quoin) g.set(x, y, z, "calcite");
    else if (street && y === 3 && x >= 6 && x <= 10) g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });   // canopy over the entrance
    else if (y % 3 === 0) g.set(x, y, z, "calcite");                             // string course
    else if (y < 3) {                                                            // shopfront
      if (street && x === 8 && y === 1) g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (street && x === 8 && y === 2) g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (street && x >= 7 && x <= 9) g.set(x, y, z, "polished_andesite");
      else if (u % 3 === 0) g.set(x, y, z, "polished_andesite");
      else { g.set(x, y, z, "glass_pane", face === "W" || face === "E" ? PANE_EW : PANE_NS); panes.push([x, y, z, face, true]); }
    } else if (u % 3 === 0) g.set(x, y, z, "bricks");                            // pier between windows
    else panes.push([x, y, z, face, false]);                                     // recessed window (set below)
  }
}

// 3. Glass and air. A recessed window leaves its outer block open, puts the pane one block in and an air gap behind it
// (a glowstone light in some). A shopfront pane sits flush with the wall and its gap is air. Where the footprint is too
// thin for a reveal, the window is flat, with its gap behind.
for (const [x, y, z, face, shop] of panes) {
  const [dx, dz] = DIRS[face];
  const pane = face === "N" || face === "S" ? PANE_NS : PANE_EW;
  const in1 = [x - dx, z - dz], in2 = [x - 2 * dx, z - 2 * dz];
  const u = face === "W" || face === "E" ? z : x;
  const warm = lit(u, y, FACE[face]);
  if (!shop && R(...in1) > y && R(...in2) > y) {
    g.set(x, y, z, "air");
    g.set(in1[0], y, in1[1], "glass_pane", pane);
    g.set(in2[0], y, in2[1], warm ? "glowstone" : "air");
  } else if (shop) {
    if (R(...in1) > y) g.set(in1[0], y, in1[1], warm ? "glowstone" : "air");
  } else {
    g.set(x, y, z, "glass_pane", pane);
    if (R(...in1) > y) g.set(in1[0], y, in1[1], warm ? "glowstone" : "air");
  }
}
g.set(8, 1, 1, "air");   // the entrance lobby, one block in
g.set(8, 2, 1, "air");

// 4. Open ground: a paved court at grade where the lidar has no roof (the light court, the notch and the rear yard).
for (const [x, z] of footprint) if (R(x, z) === 0) g.set(x, 0, z, "smooth_stone");

// 5. Roof equipment: a timber water tank on the rear slab, standing on its roof cover, with a slab lid.
for (let x = 12; x <= 14; x++) for (let z = 20; z <= 22; z++) {
  for (let y = 42; y <= 44; y++) g.set(x, y, z, "spruce_planks");
  g.set(x, 45, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

const stats = g.save(`${DIR}/NYC1022694.nbt`);
console.log(JSON.stringify({ cells: built.length, roofs: [...new Set(built.map(([x, z]) => R(x, z)))].sort((a, b) => a - b), ...stats }));
