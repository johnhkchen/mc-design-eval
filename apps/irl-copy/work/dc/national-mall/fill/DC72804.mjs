// 1514 17th St NW: a 1920s Washington residential co-op block, five storeys of brick over a limestone base, with a
// stone cornice and parapet. The lidar roof reads 9 to 10 blocks across the body (a noise band of about 2 m), so the
// body is one flat tier at 10 with a parapet to 11; the five lidar 11s become a rooftop penthouse and mechanical
// boxes. The one 2-high cell at the east end is a lower stone wing, kept at its own lidar height. The plan is an E:
// two courts open to the south (z 6..10), so the back walls of the wings face them as well.
// Every cell is built from its ground (0) up; storeys are a 1-block air layer on a 1-block floor, so each window row
// has a limestone sill and head, and the air behind the glass is the room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC72804.cells.json`, "utf8"));

const X = 26, Y = 23, Z = 11;
const g = new Voxels([X, Y, Z]);

const roofAt = new Map();
for (const [x, z, , r] of cells) roofAt.set(`${x},${z}`, r);
const inF = (x, z) => roofAt.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };
// the body is one flat tier; a cell lidar reads below 5 keeps its own low height (the east lobby)
const heightOf = (x, z) => { const r = roofAt.get(`${x},${z}`); return r < 5 ? r : 10; };
const isBody = (x, z) => inF(x, z) && heightOf(x, z) === 10;
// faces of a footprint cell that look out at storey y: no footprint cell beside them, or one standing lower than y
// (the east lobby's roof is 2, so the body wall beside it is outside from storey 2 up); N before S before W before E
const outAt = (x, z, y) => ["N", "S", "W", "E"].filter((d) => {
  const nx = x + DIRS[d][0], nz = z + DIRS[d][1];
  return !inF(nx, nz) || heightOf(nx, nz) <= y;
});

// window rows are the odd storeys (1, 3, 5, 7); even rows are the limestone sills, heads and string courses
const WINDOW_ROW = (y) => y % 2 === 1 && y <= 7;

// 1. shell, floors, roof and the storey skin
for (const [x, z] of cells) {
  const H = heightOf(x, z);
  for (let y = 0; y < H; y++) {
    const out = outAt(x, z, y);
    const perim = out.length > 0;
    const face = out[0];
    if (!perim) {                                         // room: air, with a floor slab per storey and the roof cap
      if (y === H - 1) g.set(x, y, z, "stone");
      else if (y % 2 === 0) g.set(x, y, z, "dark_oak_planks");
      continue;
    }
    if (H === 2) { g.set(x, y, z, "stone_bricks"); continue; }      // lower east wing: base and cap
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }      // base course
    if (y === H - 1) { g.set(x, y, z, "stone_bricks"); continue; }  // cornice
    if (!WINDOW_ROW(y)) { g.set(x, y, z, "calcite"); continue; }    // sill, head and string courses in limestone
    const idx = face === "N" || face === "S" ? x : z;
    if (idx % 3 === 0) { g.set(x, y, z, "bricks"); continue; }      // brick piers between the windows
    const ew = face === "N" || face === "S";                        // a pane joins along its wall
    g.set(x, y, z, "glass_pane", ew
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
  // parapet on the body's perimeter, to 11 with the penthouse and the boxes
  if (H === 10 && outAt(x, z, 9).length) {
    const conn = (d) => (isBody(x + DIRS[d][0], z + DIRS[d][1]) && outAt(x + DIRS[d][0], z + DIRS[d][1], 9).length ? "low" : "none");
    g.set(x, 10, z, "stone_brick_wall", { up: "true", north: conn("N"), south: conn("S"), east: conn("E"), west: conn("W"), waterlogged: "false" });
  }
}

// 2. warm lights in some windows: a glowstone in the room behind the pane
for (const [x, z] of cells) {
  if (heightOf(x, z) !== 10) continue;
  for (const y of [1, 3, 5, 7]) {
    const out = outAt(x, z, y);
    if (!out.length) continue;
    const idx = out[0] === "N" || out[0] === "S" ? x : z;
    if (idx % 3 === 0) continue;
    if ((x + y) % 7 !== 0) continue;
    const [dx, dz] = DIRS[OPP[out[0]]];
    const ix = x + dx, iz = z + dz;
    if (!inF(ix, iz) || outAt(ix, iz, y).length) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// 3. the entrance on the street (south) face, at the middle wing's tip: a limestone surround, a double-height door,
// a lantern hung in the hall
for (const x of [11, 13]) for (const y of [0, 1]) g.set(x, y, 10, "calcite");
g.set(12, 0, 10, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(12, 1, 10, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(12, 1, 9, "lantern", { hanging: "true", waterlogged: "false" });

// 4. roof: the penthouse the lidar sees as 11s, and two plant boxes
for (const [x0, z0] of [[12, 8]]) for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) {
  g.set(x, 10, z, "stone_bricks"); g.set(x, 11, z, "chiseled_stone_bricks");
}
for (const [x0, z0] of [[9, 2], [21, 3]]) for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) {
  g.set(x, 10, z, "stone_bricks"); g.set(x, 11, z, "iron_bars");
}

const stats = g.save(`${DIR}/DC72804.nbt`);
console.log(JSON.stringify(stats));
