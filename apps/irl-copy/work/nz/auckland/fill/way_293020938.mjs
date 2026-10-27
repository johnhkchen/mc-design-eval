import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A two-storey Edwardian brick commercial block (Eden Terrace / Karangahape Road fringe): basalt-stone plinth, brick
// piers, shopfront glass on the ground floor, a sill-and-lintel window grid above, a dentil cornice and a flat parapet
// with a brick chimney and a plant box on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_293020938.cells.json", "utf8"));

const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => foot.has(`${x},${z}`);
// The lidar gives one roof height (9 above y 0) and no ground drop on every cell, so this is one flat mass.
for (const c of foot.values()) if (c.ground !== 0 || c.roof !== 9) throw new Error("setback tiers in the record: massing needs them");
const TOP = 8;   // top block layer: the roof is 9 above y 0

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const grid = new Map();   // "x,y,z" -> { name, state }
const put = (x, y, z, name, state) => { if (inF(x, z)) grid.set(`${x},${y},${z}`, { name, state }); };
const at = (x, y, z) => grid.get(`${x},${y},${z}`)?.name;

const cellsXZ = [...foot.keys()].map((k) => k.split(",").map(Number));
const perim = cellsXZ.map(([x, z]) => ({ x, z, ex: exposed(x, z) })).filter((c) => c.ex.length);
const isWall = (x, z) => exposed(x, z).length > 0;

// The front is the face with the most single-exposed cells; the entrance sits at the middle of it.
const count = {};
for (const c of perim) if (c.ex.length === 1) count[c.ex[0]] = (count[c.ex[0]] ?? 0) + 1;
const front = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
const back = { north: "south", south: "north", east: "west", west: "east" }[front];
const along = (x, z, ex) => (ex.includes("north") || ex.includes("south") ? x : z);
const onFront = perim.filter((c) => c.ex.length === 1 && c.ex[0] === front).map((c) => along(c.x, c.z, c.ex)).sort((a, b) => a - b);
const doorAt = onFront[Math.floor(onFront.length / 2)];

// Floors and roof: solid across the footprint, so each storey stands on the one below.
for (const [x, z] of cellsXZ) {
  put(x, 0, z, "stone_bricks");     // plinth and ground floor slab
  put(x, 4, z, "smooth_stone");     // storey line and first floor slab
  put(x, TOP, z, "stone");          // roof membrane
}

// Walls: the exposed cells, storey by storey.
for (const { x, z, ex } of perim) {
  const corner = ex.length > 1, t = along(x, z, ex), pier = corner || t % 3 === 0;
  const inward = ex.length === 1 ? [x - DIRS[ex[0]][0], z - DIRS[ex[0]][1]] : null;
  const interiorBehind = inward && inF(...inward) && !isWall(...inward);
  put(x, 0, z, "stone_bricks");
  for (let y = 1; y <= 3; y++) put(x, y, z, pier || y === 3 ? "bricks" : "glass_pane");
  put(x, 4, z, "smooth_stone");
  for (let y = 5; y <= 6; y++) put(x, y, z, pier ? "bricks" : "glass_pane");
  put(x, 7, z, "bricks");                                   // lintel band
  put(x, TOP, z, t % 2 === 0 ? "polished_andesite" : "bricks");   // dentil cornice and parapet
  if (interiorBehind && !pier) {
    if (t % 4 === 2) put(...inward, 3, "lantern", { hanging: "true", waterlogged: "false" });   // shopfront light hung from the storey line
    if (t % 6 === 1) put(...inward, 5, "glowstone");                                            // upper window lit behind the glass
  }
  if (ex.length === 1 && ex[0] === front && t === doorAt && !corner) {
    const facing = front;
    put(x, 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Brick chimney on the back wall, rising from the parapet, capped with a slab.
const backWall = perim.filter((c) => c.ex.length === 1 && c.ex[0] === back).map((c) => along(c.x, c.z, c.ex)).sort((a, b) => a - b);
const chimneyAt = backWall[Math.floor(backWall.length / 2)];
const chimney = perim.find((c) => c.ex.length === 1 && c.ex[0] === back && along(c.x, c.z, c.ex) === chimneyAt);
if (chimney) {
  put(chimney.x, 9, chimney.z, "bricks");
  put(chimney.x, 10, chimney.z, "bricks");
  put(chimney.x, 11, chimney.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant: a 3 x 2 concrete box on the roof, set in from the parapet, nearest the middle.
const interior = (x, z) => inF(x, z) && !isWall(x, z);
const cx = cellsXZ.reduce((s, [x]) => s + x, 0) / cellsXZ.length, cz = cellsXZ.reduce((s, [, z]) => s + z, 0) / cellsXZ.length;
const boxes = cellsXZ.filter(([x, z]) => [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]].every(([dx, dz]) => interior(x + dx, z + dz)));
boxes.sort((a, b) => Math.hypot(a[0] + 1 - cx, a[1] + 0.5 - cz) - Math.hypot(b[0] + 1 - cx, b[1] + 0.5 - cz));
if (boxes.length) for (const [dx, dz] of [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]]) put(boxes[0][0] + dx, 9, boxes[0][1] + dz, "light_gray_concrete");

// Glass panes connect to the solid blocks beside them, so the windows read as continuous frames.
const SOLID = new Set(["bricks", "stone_bricks", "smooth_stone", "polished_andesite", "stone", "glass_pane", "dark_oak_door"]);
const PANE = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
for (const [k, b] of grid) {
  if (b.name !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  b.state = Object.fromEntries(PANE.map(([d, dx, dz]) => [d, SOLID.has(at(x + dx, y, z + dz)) ? "true" : "false"]));
  b.state.waterlogged = "false";
}

const g = new Voxels([13, 22, 21]);
for (const [k, { name, state }] of grid) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, name, state);
}
console.log(g.save(DIR + "way_293020938.nbt"), { front, back, doorAt });
