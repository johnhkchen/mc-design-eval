// Way 269461604, Eden Terrace side of the Auckland CBD fringe (seen from Maungawhau): a two-storey brick commercial
// block in 1920s-30s stripped classical. Shopfronts (glass with brick piers) on the ground floor under a dark timber
// fascia, a stone string course, upper windows of glass panes in brick piers under a stone head course, a stone
// cornice and a brick parapet with a coping. Hollow over floor slabs at y 4 and 8 and a roof deck at y 12; the lidar
// roof (median) sets the one flat tier, the foundation fills to the highest ground, and a lift overrun sits on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269461604.cells.json`, "utf8"));

const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);
const OFF = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };          // outward step for each face
const FACE = { N: "north", S: "south", W: "west", E: "east" };
const outs = (x, z) => Object.keys(OFF).filter((d) => !inF(x + OFF[d][0], z + OFF[d][1]));
const isWall = (x, z) => inF(x, z) && outs(x, z).length > 0;

// Datums. The ground floor sits on the highest ground under the footprint (every lower cell gets a plinth up to it);
// the lidar roof is smoothed to its median so the massing is one clean tier (the lidar's 10-13 is noise on a flat roof).
const BASE = Math.max(...cells.map((c) => c[2]));                       // y 4: ground floor slab
const ROOF = [...cells.map((c) => c[3])].sort((a, b) => a - b)[Math.floor(cells.length / 2)];   // y 13: roof surface
const DECK = ROOF - 1;                                                  // y 12: roof deck and cornice course
const FLOOR2 = BASE + 4;                                                // y 8: first floor slab and string course
const SHOP = [BASE + 1, BASE + 2];                                      // y 5-6: shopfront glass
const FASCIA = BASE + 3;                                                // y 7: dark timber fascia over the shops
const UPPER = [BASE + 5, BASE + 6];                                     // y 9-10: first floor windows
const HEAD = BASE + 7;                                                  // y 11: head course

// The entrance: the north-facing run of wall cells that is longest, nearest the middle of the footprint.
const xs = cells.map((c) => c[0]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
const northOnly = (x, z) => { const o = outs(x, z); return o.length === 1 && o[0] === "N"; };
let door = null;
for (const [x, z] of cells) {
  if (!northOnly(x, z)) continue;
  let l = 0; while (northOnly(x - l - 1, z)) l++;
  let r = 0; while (northOnly(x + r + 1, z)) r++;
  const cand = { x, z, run: l + r + 1 };
  if (!door || cand.run > door.run || (cand.run === door.run && Math.abs(x - cx) < Math.abs(door.x - cx))) door = cand;
}
if (!door) throw new Error("no north-facing wall cell for the entrance");

// The facade of one wall cell at height y, from the face it looks out of: piers on the corners and every third
// cell along a run, glass between.
function facade(x, z, y, o) {
  if (x === door.x && z === door.z && (y === SHOP[0] || y === SHOP[1])) {
    return { block: "dark_oak_door", state: { facing: FACE[o[0]], half: y === SHOP[0] ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  const t = o[0] === "N" || o[0] === "S" ? x : z;
  const pier = o.length > 1 || t % 3 === 0;
  if (y === BASE) return { block: "smooth_stone" };
  if (SHOP.includes(y)) return { block: pier ? "bricks" : "glass" };
  if (y === FASCIA) return { block: "dark_oak_planks" };
  if (y === FLOOR2) return { block: "smooth_stone" };
  if (UPPER.includes(y)) return { block: pier ? "bricks" : "glass_pane" };
  if (y === HEAD) return { block: "stone_bricks" };
  if (y === DECK) return { block: "smooth_stone" };
  if (y === ROOF) return { block: "bricks" };
  return { block: "stone_brick_slab", state: { type: "bottom", waterlogged: "false" } };   // the coping
}

const g = new Voxels([36, 26, 21]);

for (const [key] of F) {
  const [x, z] = key.split(",").map(Number);
  const wall = isWall(x, z);
  // foundation: solid from y 0 up to the ground floor slab
  for (let y = 0; y < BASE; y++) g.set(x, y, z, wall ? "stone_bricks" : "stone");
  if (!wall) {
    // no interior: only the floor slabs and the roof deck
    g.set(x, BASE, z, "oak_planks");
    g.set(x, FLOOR2, z, "oak_planks");
    g.set(x, DECK, z, "stone");
    continue;
  }
  const o = outs(x, z);
  for (let y = BASE; y <= ROOF + 1; y++) {
    const f = facade(x, z, y, o);
    g.set(x, y, z, f.block, f.state);
  }
}

// Warm light: glowstone just inside some shop and upper windows (t counts along the face), a lantern inside the door.
let lights = 0;
for (const [key] of F) {
  const [x, z] = key.split(",").map(Number);
  if (!isWall(x, z)) continue;
  const o = outs(x, z);
  if (o.length !== 1 || (x === door.x && z === door.z)) continue;
  const f = o[0];
  const t = f === "N" || f === "S" ? x : z;
  const [dx, dz] = OFF[f];
  const ix = x - dx, iz = z - dz;
  if (!inF(ix, iz) || isWall(ix, iz)) continue;
  if (t % 6 === 1) { g.set(ix, SHOP[0], iz, "glowstone"); lights++; }
  if (t % 6 === 4) { g.set(ix, UPPER[0], iz, "glowstone"); lights++; }
}
{
  const [dx, dz] = OFF.N;                                               // the door faces north, so inside is one step south
  const ix = door.x - dx, iz = door.z - dz;
  if (inF(ix, iz) && !isWall(ix, iz)) g.set(ix, SHOP[0], iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof equipment: a lift overrun, 3 x 3 cells on the deck, a brick box 3 high with a stone cap.
const box = [];
for (let x = 22; x <= 24; x++) for (let z = 8; z <= 10; z++) box.push([x, z]);
if (!box.every(([x, z]) => inF(x, z) && !isWall(x, z))) throw new Error("the lift overrun is off the roof");
for (const [x, z] of box) {
  for (let y = ROOF; y <= ROOF + 2; y++) {
    const edge = x === 22 || x === 24 || z === 8 || z === 10;
    if (edge) g.set(x, y, z, "stone_bricks");
  }
  g.set(x, ROOF + 3, z, "stone_bricks");
}

const out = g.save(`${DIR}/way_269461604.nbt`);
console.log(JSON.stringify({ base: BASE, roof: ROOF, door, lights, ...out }));
