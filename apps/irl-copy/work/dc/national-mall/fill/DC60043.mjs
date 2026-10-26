// A 1900-1920 DC commercial block: red brick with calcite (limestone) quoins and string courses, a one-storey
// shopfront wing on the street side (the lidar's 3-block roof, built to 4 with its cornice), a 7-block main block and
// an 8-block core stepping back from the edge (the setback the taller lidar cells show). The edge cells are the walls:
// window rows of glass panes (air behind) between brick piers, calcite quoins at the corners. Inside is air with a
// floor slab per storey, so the core's floors, parapet and roof all stand on the storey below. Each cell's foundation
// fills from y 0 up to its ground (all 0 here, so no foundation shows).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60043.cells.json`, "utf8"));

const W = 6, H = 20, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(key(x, z), { ground, roof });
const has = (x, z) => raw.has(key(x, z));

// ---- classify the footprint ----
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const outwardOf = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));   // sides facing open air
const edge = (x, z) => outwardOf(x, z).length > 0;
const wing = (x, z) => raw.get(key(x, z)).roof <= 4;                             // the lidar's low street wing
const core = (x, z) => has(x, z) && !edge(x, z) && !wing(x, z);                  // inside the outline, 8-block roof
const coreEdge = (x, z) => core(x, z) && DIRS.some(([dx, dz]) => !core(x + dx, z + dz));

// ---- blocks ----
const BRICK = "bricks", STONE = "calcite", BASE = "stone_bricks", FLOOR = "smooth_stone", ROOF = "stone";

// A window needs air behind its glass: the cell one step inward from the outer face must be core (air).
const inward = (x, z, [ox, oz]) => [x - ox, z - oz];
const windowOk = (x, z, out) => { const [ix, iz] = inward(x, z, out); return core(ix, iz); };
const along = (x, z, [ox]) => (ox !== 0 ? z : x);                                 // position along the face: bay rhythm
const paneState = ([ox]) => (ox !== 0                                              // a pane on an x-facing wall runs north-south
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const DOOR = [2, 0];                                                               // the street front
const lit = new Set();                                                             // interior cells with a warm light behind a pane

// Warm light behind every third window of the upper storey, on the storey's lower row, from the core cell inward.
const litCells = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!has(x, z) || !edge(x, z) || wing(x, z)) continue;
  const out = outwardOf(x, z);
  if (out.length > 1 || along(x, z, out[0]) % 2 !== 1 || !windowOk(x, z, out[0])) continue;
  litCells.push([x, z, out[0]]);
}
litCells.forEach(([x, z, out], i) => {
  if (i % 3 !== 1) return;
  const [ix, iz] = inward(x, z, out);
  lit.add(key(ix, iz));
});

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!has(x, z)) continue;
  const { ground, roof } = raw.get(key(x, z));

  // foundation up to the ground, then the base course on every cell (the ground storey's floor)
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);
  g.set(x, ground, z, BASE);

  if (wing(x, z)) {
    // shopfront wing: two-high storefront with the door, calcite cornice on top (wing tops out at y 3)
    const out = outwardOf(x, z)[0];
    const corner = outwardOf(x, z).length > 1;
    for (const y of [1, 2]) {
      if (corner) g.set(x, y, z, STONE);
      else if (x === DOOR[0] && z === DOOR[1]) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (along(x, z, out) % 2 === 1 && windowOk(x, z, out)) g.set(x, y, z, "glass_pane", paneState(out));
      else g.set(x, y, z, BRICK);
    }
    g.set(x, 3, z, STONE);
    continue;
  }

  if (edge(x, z)) {
    // main-block wall: window rows at 1-2 and 4-5, brick piers, calcite quoins, string courses at 3 and 6
    const out = outwardOf(x, z)[0];
    const corner = outwardOf(x, z).length > 1;
    for (const y of [1, 2, 4, 5]) {
      if (corner) g.set(x, y, z, STONE);
      else if (along(x, z, out) % 2 === 1 && windowOk(x, z, out)) g.set(x, y, z, "glass_pane", paneState(out));
      else g.set(x, y, z, BRICK);
    }
    g.set(x, 3, z, STONE);
    g.set(x, 6, z, STONE);                                                         // the cornice: top of the 7-block walls
  } else {
    // core: air at 1-2 and 4-5, floor slabs at 3 and 6, parapet and roof at 7
    g.set(x, 3, z, FLOOR);
    g.set(x, 6, z, FLOOR);
    g.set(x, 7, z, coreEdge(x, z) ? STONE : ROOF);
  }
}

// warm lights behind the panes, the rooftop plant, and an entrance lantern
for (const k of lit) { const [x, z] = k.split(",").map(Number); g.set(x, 4, z, "glowstone"); }
g.set(2, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });             // inside the door, on the floor slab above
const plant = [...Array(D)].flatMap((_, z) => [...Array(W)].map((_, x) => [x, z])).filter(([x, z]) => core(x, z) && !coreEdge(x, z));
for (const [x, z] of plant.slice(0, 2)) g.set(x, 8, z, "light_gray_concrete");

g.save(`${DIR}/DC60043.nbt`);
