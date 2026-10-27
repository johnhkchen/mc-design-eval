// Way 912170824, Auckland (Eden Terrace side): a two-storey Edwardian brick shop-and-flat block. The lidar record is
// flat (ground 0, roof 10 on every footprint cell), so there are no setbacks to step: the massing is one box with a
// stone plinth, a shopfront at street level, a first floor of sash-style glass bays on red brick piers, a string
// course, a dentil cornice and a parapet. Walls are the footprint's outer cells; interior cells are air between
// the floor slabs (y0, y4) and the ceiling/roof (y8, y9), with lights and two roof plant boxes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170824.cells.json", "utf8"));

const fp = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inF = (x, z) => fp.has(`${x},${z}`);
const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

const ROOF = Math.max(...cells.map((c) => c[3]));     // 10: the top face of the roof, the parapet's top course is ROOF-1
const SLABS = [0, 4, 8];                               // ground floor, first floor, first-floor ceiling
const WIN_LO = 1, WIN_HI = 3;                          // shopfront band y1..y3 (glass to y2, fascia y3)

const blocks = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, name, state) => blocks.set(key(x, y, z), { name, state });

// the street front: the north face (z-min). Its non-corner cells carry the shopfront; the door sits mid-front.
const DOOR = [2, 0];
const isCorner = (faces) => faces.length >= 2;

// interior cells: candidates for lights and roof plant
const interior = cells.filter(([x, z]) => exposed(x, z).length === 0).map(([x, z]) => [x, z]);
const lanternCells = interior.filter(([x, z]) => (x + z) % 3 === 0).slice(0, 4);
const glowCells = interior.filter(([x, z]) => (x * 2 + z) % 5 === 0).slice(0, 3);
const plantCells = [interior[Math.floor(interior.length / 3)], interior[Math.floor((2 * interior.length) / 3)]];
const isLantern = (x, z) => lanternCells.some(([a, b]) => a === x && b === z);
const isGlow = (x, z) => glowCells.some(([a, b]) => a === x && b === z);
const isPlant = (x, z) => plantCells.some((c) => c && c[0] === x && c[1] === z);

for (const [x, z, g, r] of cells) {
  const faces = exposed(x, z);
  const ext = faces.length > 0;
  const corner = isCorner(faces);
  const isN = faces.includes("N");
  // along the face: x for north/south walls, z for east/west walls; alternating bays (glass on odd, pier on even)
  const along = isN || faces.includes("S") ? x : z;
  const bay = along % 2 === 1;

  for (let y = g; y < r; y++) {
    if (!ext) {
      // interior: a floor slab per storey, a ceiling over the first floor, and the roof membrane; air between
      if (y === ROOF - 1) put(x, y, z, "stone");
      else if (SLABS.includes(y)) put(x, y, z, "oak_planks");
      else if (y === 1 && isLantern(x, z)) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      else if (y === 5 && isGlow(x, z)) put(x, y, z, "glowstone");
      continue;
    }
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                // plinth course
    if (y <= 3) {                                                          // ground storey
      if (corner) put(x, y, z, "stone_bricks");                            // the shopfront's quoins
      else if (isN && y <= 2 && [x, z].join() === DOOR.join()) {           // the entrance
        const half = y === 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      } else if (isN && [x, z].join() === DOOR.join() && y === 3) {          // the hood over the door
        put(x, y, z, "dark_oak_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
      } else if (isN) {                                                    // the shopfront
        put(x, y, z, y <= 2 ? "glass_pane" : "dark_oak_planks");
      } else {                                                             // side street-level bays
        put(x, y, z, y <= 2 && bay ? "glass_pane" : "bricks");
      }
      continue;
    }
    if (y === 4) { put(x, y, z, "smooth_stone"); continue; }               // string course
    if (y <= 7) {                                                          // first floor: sash bays on brick piers
      if (y === 5) put(x, y, z, bay && !corner ? "smooth_stone" : "bricks");   // sill row / pier
      else put(x, y, z, bay && !corner ? "glass_pane" : "bricks");          // sash bay / brick pier
      continue;
    }
    if (y === 8) { put(x, y, z, along % 2 === 0 ? "chiseled_stone_bricks" : "stone_bricks"); continue; } // dentil cornice
    if (y === ROOF - 1) put(x, y, z, "smooth_stone");                      // parapet coping
  }
}

// the roof plant: two iron boxes standing on the first-floor ceiling, at roof level
for (const c of plantCells) if (c) put(c[0], ROOF - 1, c[1], "iron_block");

// glass panes connect to any solid neighbour in the same course, as a real pane does
const SOLID = (n) => n === "glass_pane" || !/stairs|door|lantern|slab|glowstone/.test(n) ? true : false;
const [X, Y, Z] = [9, 23, 8];
const g = new Voxels([X, Y, Z]);
for (const [k, b] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  let state = b.state;
  if (b.name === "glass_pane") {
    const side = (dx, dz) => {
      const n = blocks.get(key(x + dx, y, z + dz));
      return n && SOLID(n.name) ? "true" : "false";
    };
    state = { north: side(0, -1), east: side(1, 0), south: side(0, 1), west: side(-1, 0), waterlogged: "false" };
  }
  g.set(x, y, z, b.name, state);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170824.nbt");
