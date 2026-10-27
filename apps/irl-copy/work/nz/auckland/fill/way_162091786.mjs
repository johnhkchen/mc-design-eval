// Way 162091786, Mt Eden / Eden Terrace side of the CBD slope: a two-storey brick-and-plaster commercial block
// (1920s stripped classical), 21 x 39 footprint. Lidar gives one roof level (10, a 11 spine), so the massing is one
// flat roof with a parapet, plus a plant tier on the spine. Storeys step with the ground: the downhill side has two,
// the uphill side one. Street front assumed on the north (-z) face: shopfront, entrance, fascia.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091786.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..20, z 0..38

const ROOF = 10;                       // flat roof level from the lidar (the mode of 10/11 across the footprint)
const STOREY = 4;                      // blocks per storey
const g = new Voxels([21, 26, 39]);

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inside = (x, z) => cell.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };     // N is -z (the street front)
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));

const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const pane = (faces) => (faces.some((d) => d === "N" || d === "S") && !faces.some((d) => d === "E" || d === "W")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the street entrance: the north-face cell nearest the middle of that face
const northFace = [...cell.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => exposed(x, z).includes("N"));
const mid = northFace.reduce((s, [x]) => s + x, 0) / northFace.length;
const doorX = northFace.reduce((best, [x]) => (Math.abs(x - mid) < Math.abs(best - mid) ? x : best), northFace[0][0]);
const doorZ = northFace.find(([x]) => x === doorX)[1];

for (const [key, { ground, roof }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposed(x, z), perimeter = faces.length > 0;
  const R = ROOF;                                     // one roof level; the spine tier is added below
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");
  if (!perimeter) {
    // interior: a floor slab per storey and the deck; the air between them is the rooms
    for (let b = ground; b <= R - 3; b += STOREY) put(x, b, z, "smooth_stone");
    put(x, R - 1, z, "stone");
    continue;
  }
  // exterior wall from the ground to the parapet course (default brick), then the storey detail over it
  for (let y = ground; y <= R - 1; y++) put(x, y, z, "bricks");
  const ns = faces.some((d) => d === "N" || d === "S"), ew = faces.some((d) => d === "E" || d === "W");
  const along = ns && !ew ? x : ew && !ns ? z : null;     // the coordinate that runs along this wall
  const front = faces.includes("N");
  for (let k = 0, b = ground; b <= R - 3; k++, b = ground + k * STOREY) {
    put(x, b, z, k === 0 ? "polished_andesite" : "smooth_sandstone");       // base course, then storey lines
    if (along === null) {                                                   // corners and steps: plain pier
      put(x, b + 3, z, "stone_bricks");
      continue;
    }
    const pier = along % 3 !== 1;
    const shop = k === 0 && front;
    if (shop) {
      if (x === doorX && z === doorZ) {
        put(x, b + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, b + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (along % 3 === 0) {
        put(x, b + 1, z, "stone_bricks"); put(x, b + 2, z, "stone_bricks");
      } else {
        put(x, b + 1, z, "smooth_sandstone");                                 // shopfront sill
        put(x, b + 2, z, "glass_pane", pane(faces));
      }
      put(x, b + 3, z, "dark_oak_planks");                                      // fascia over the shop and door
      continue;
    }
    if (pier) continue;                                                         // brick piers between the bays
    put(x, b + 1, z, "smooth_sandstone");                                      // window sill
    put(x, b + 2, z, "glass_pane", pane(faces));
    put(x, b + 3, z, "bricks");
  }
  put(x, R - 2, z, "smooth_sandstone");                                         // cornice
  put(x, R, z, "stone_bricks");                                                 // coping
}

// warm light behind some glass: a glowstone or shroomlight on the floor just inside the window
for (const [key, { ground }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposed(x, z);
  if (!faces.length || faces.length > 1 || faces.includes("N")) continue;   // upper-storey window bays on the side walls
  if ((faces[0] === "E" || faces[0] === "W" ? z : x) % 3 !== 1) continue;
  for (let k = 1, b = ground + STOREY; b <= ROOF - 3; k++, b = ground + k * STOREY) {
    if ((x + z + k) % 3 !== 0) continue;
    const [dx, dz] = INWARD[faces[0]];
    const ix = x + dx, iz = z + dz;
    if (inside(ix, iz) && !exposed(ix, iz).length) put(ix, b + 1, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
  }
}

// roof plant: a 3 x 3 stair and lift core on the deck, set in from the parapet, nearest the footprint's middle
const interior = [...cell.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => !exposed(x + dx, z + dz).length)));
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length, cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
const [px, pz] = interior.reduce((best, p) => ((p[0] - cx) ** 2 + (p[1] - cz) ** 2 < (best[0] - cx) ** 2 + (best[1] - cz) ** 2 ? p : best));
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  put(px + dx, ROOF, pz + dz, "bricks");
  put(px + dx, ROOF + 1, pz + dz, "smooth_sandstone");
}
put(px, ROOF, pz + 1, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(px, ROOF + 1, pz + 1, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091786.nbt";
console.log(g.save(out));
