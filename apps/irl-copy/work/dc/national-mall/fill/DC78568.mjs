// DC78568: 1000 R St NW, a religious building on a 25 x 13 footprint, 4 blocks to the roof at the nave.
// A stepped basilica section: the nave (roof 4) on the middle columns, aisles down to 3 and 2, outer walls at 1.
// Brick walls on stone bases and cornices, a belfry on the front bay, two doors under stone hoods, and warm lights in
// the window niches. Walls are solid brick with one-cell air niches behind the glass, so there is no interior to model.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78568.cells.json", "utf8"));
const g = new Voxels([25, 16, 13]);

const BRICK = "bricks", STONE = "stone_bricks", TRIM = "smooth_stone", PANE = "glass_pane", SLATE = "deepslate_tiles";

const at = new Map();
for (const [x, z, ground, roof] of cells) at.set(`${x},${z}`, { ground, top: roof - 1 });
const inF = (x, z) => at.has(`${x},${z}`);
// outward normals of the faces that border nothing: [dx, dz, name]
const NORMALS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const exposed = (x, z) => NORMALS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const isWall = (x, z) => exposed(x, z).length > 0;

const panes = [];
for (const [x, z, ground, roof] of cells) {
  const top = roof - 1, ex = exposed(x, z), wall = ex.length > 0, corner = ex.length >= 2;
  for (let y = 0; y < ground; y++) g.set(x, y, z, STONE);
  for (let y = ground; y <= top; y++) {
    if (y === top) { g.set(x, y, z, wall ? TRIM : SLATE); continue; }     // cornice on the walls, slate roof inside
    if (!wall) { g.set(x, y, z, BRICK); continue; }                       // solid core
    if (y === ground) { g.set(x, y, z, STONE); continue; }                // base course
    if (corner) { g.set(x, y, z, TRIM); continue; }                       // quoins
    const [dx, dz] = ex[0];
    const u = dz !== 0 ? x : z;                                           // bay index along the face
    if (u % 3 !== 1) { g.set(x, y, z, BRICK); continue; }                 // brick piers between the bays
    if (top === 3 && y === 1) { g.set(x, y, z, TRIM); continue; }         // sill under the upper window
    const along = dz !== 0 ? { north: "false", south: "false", east: "true", west: "true" }
                           : { north: "true", south: "true", east: "false", west: "false" };
    g.set(x, y, z, PANE, { ...along, waterlogged: "false" });
    panes.push({ x, y, z, dx, dz });
  }
}

// one-cell air niches behind the glass; every fourth one holds a glowstone, every fourth from 2 a shroomlight
let lamp = 0;
for (const p of panes) {
  const ix = p.x - p.dx, iz = p.z - p.dz;
  if (!inF(ix, iz) || isWall(ix, iz) || at.get(`${ix},${iz}`).top <= p.y) continue;
  const k = lamp++ % 4;
  g.set(ix, p.y, iz, k === 0 ? "glowstone" : k === 2 ? "shroomlight" : "air");
}

// doors on the front (north, z 0) and the side (south, z 12), each under a stone hood, opening into air
const door = (z, facing) => {
  for (const half of ["lower", "upper"])
    g.set(6, half === "lower" ? 0 : 1, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
};
door(0, "south");
door(12, "north");
g.set(6, 0, 1, "air"); g.set(6, 1, 1, "air");
g.set(6, 0, 11, "air"); g.set(6, 1, 11, "air");
for (const x of [5, 6, 7]) {
  g.set(x, 2, 0, "stone_brick_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
  g.set(x, 2, 12, "stone_brick_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });
}

// belfry on the front bay, standing on the nave's cornice
for (const x of [5, 6, 7]) g.set(x, 4, 0, STONE);
g.set(5, 5, 0, PANE, { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
g.set(6, 5, 0, "shroomlight");
g.set(7, 5, 0, PANE, { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
for (const x of [5, 6, 7]) g.set(x, 6, 0, TRIM);
g.set(6, 7, 0, "stone_brick_wall");

// two vents on the wing's roof, standing on the roof surface
for (const x of [18, 21]) { g.set(x, 3, 9, BRICK); g.set(x, 4, 9, BRICK); g.set(x, 5, 9, TRIM); }

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78568.nbt");
console.log(r);
