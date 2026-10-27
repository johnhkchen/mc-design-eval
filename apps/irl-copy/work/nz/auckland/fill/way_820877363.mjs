// Skhy Pavilion Apartments: a two-storey plaster walk-up with brick base, terracotta spandrels and a stair core on the roof.
// The lidar gives one flat roof at y 9 over the body (roof >= 7; the 0-5 edge cells are footprint noise, not built),
// so the massing is one tier, two storeys of 4 blocks and a cornice; the stair core and plant boxes are the roof equipment.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_820877363.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([21, 22, 22]);

const STOREY = 4, CORNICE = 8, ROOF_TOP = 9;
const DOOR = { x: 13, z: 20 };              // the entrance: on the south face, under the lidar's widest run
const k = (x, z) => `${x},${z}`;
const ground = new Map(), body = new Set();
for (const [x, z, gr, roof] of cells) if (roof >= 7) { body.add(k(x, z)); ground.set(k(x, z), gr); }
const isBody = (x, z) => body.has(k(x, z));
const exposed = (x, z) => ({ N: !isBody(x, z - 1), S: !isBody(x, z + 1), W: !isBody(x - 1, z), E: !isBody(x + 1, z) });
const isRing = (x, z) => { const e = exposed(x, z); return e.N || e.S || e.E || e.W; };
const lamp = (x, y, z) => (x * 7 + z * 3 + y) % 5 === 0;   // about one window in five is lit

for (const [x, z] of [...body].map((s) => s.split(",").map(Number))) {
  const gr = ground.get(k(x, z)), e = exposed(x, z);
  const ring = e.N || e.S || e.E || e.W, corner = (e.N || e.S) && (e.E || e.W);
  // foundation under the cell, then the ground-floor slab, the storey slab and the roof slab (interior, full footprint)
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  g.set(x, gr, z, "smooth_stone");
  g.set(x, STOREY, z, "smooth_stone");
  g.set(x, CORNICE, z, "gray_concrete");
  if (!ring) continue;

  // the outward face decides the bay rhythm: piers every third block, two-block window bays between them
  const dir = e.N ? [0, 1] : e.S ? [0, -1] : e.W ? [1, 0] : [-1, 0];   // inward step
  const u = e.N || e.S ? x : z;
  const door = x === DOOR.x && z === DOOR.z && e.S;
  const surround = e.S && z === DOOR.z && (x === DOOR.x - 1 || x === DOOR.x + 1);
  const bay = !corner && !door && !surround && u % 3 !== 0;
  const inW = bay && isBody(x + dir[0], z + dir[1]) && !isRing(x + dir[0], z + dir[1]);   // recessed glass one block behind the face
  const back = [x + 2 * dir[0], z + 2 * dir[1]];

  for (let y = gr; y <= CORNICE; y++) {
    const windowRow = y === gr + 1 || y === gr + 2 || y === 5 || y === 6;
    if (y === gr) g.set(x, y, z, "bricks");                                   // base course
    else if (y === CORNICE) g.set(x, y, z, "smooth_stone");                   // cornice
    else if (door) {
      if (y === gr + 1) g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 2) g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 3) g.set(x, y, z, "stone_bricks");                  // lintel over the door
      else g.set(x, y, z, "white_concrete");
    }
    else if (surround || corner || y === STOREY) g.set(x, y, z, "light_gray_concrete");
    else if (y === 7) g.set(x, y, z, "red_terracotta");                        // spandrel band
    else if (bay && windowRow) {
      if (inW) {
        g.set(x + dir[0], y, z + dir[1], "glass");
        if ((y === 5 || y === gr + 1) && lamp(x, y, z) && isBody(...back) && !isRing(...back)) g.set(back[0], y, back[1], "glowstone");
      } else g.set(x, y, z, "glass");
    }
    else g.set(x, y, z, "white_concrete");
  }
}

// roof: a stair core on the north-east corner, and two plant boxes
for (const [x, z] of [[15, 9], [16, 9], [15, 10], [16, 10]]) {
  g.set(x, 9, z, "light_gray_concrete"); g.set(x, 10, z, "light_gray_concrete"); g.set(x, 11, z, "smooth_stone");
}
for (const [x, z] of [[6, 11], [7, 11], [10, 16], [11, 16]]) g.set(x, ROOF_TOP, z, "iron_block");

const out = g.save(`${DIR}/way_820877363.nbt`);
console.log(out);
