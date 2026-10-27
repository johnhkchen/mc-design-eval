// Way 332237108: a four-storey interwar commercial block, red brick on a stone plinth with cream render piers and
// string courses, a shopfront at street level, a plant room on the flat roof. Footprint, ground and roof come from the
// lidar cells file. The roof is smoothed to one flat deck (lidar 15-18 is noise on a flat roof); the parapet sits 1
// block over the deck, so the top reads at the lidar's 18.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237108.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237108.nbt";

const W = 16, H = 30, D = 15;
const DECK = 16, PARAPET = 17, FLOORS = [4, 8, 12];   // storeys are 4 blocks: slab row 4s, three rows of wall above it
const DOOR = { x: 0, z: 8 };                          // west face, on the street side with ground 1 (no step)

const key = (x, z) => `${x},${z}`;
const groundAt = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inM = (x, z) => groundAt.has(key(x, z));
const missing = (x, z) => [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]]
  .filter(([, dx, dz]) => !inM(x + dx, z + dz)).map(([d]) => d);
const bnd = (x, z) => inM(x, z) && missing(x, z).length > 0;

const g = new Voxels([W, H, D]);
const glass = [];                                     // glass pane cells, connected to neighbours at the end
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); };

for (const [x, z, gr] of cells) {
  const b = bnd(x, z);
  const miss = missing(x, z);
  const t = miss[0] === "W" || miss[0] === "E" ? z : x;      // position along the face it stands on
  const pier = b && t % 3 === 0;                          // every third cell along each face: a cream pier (the stepped lidar outline makes many corners, so no corner rule)
  const door = x === DOOR.x && z === DOOR.z;

  // foundation from y 0 up to this cell's ground (every footprint cell, interior too)
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // floor slabs per storey and the roof deck: solid across the footprint; on the edge they are string courses and cornice
  for (const f of FLOORS) put(x, f, z, "smooth_stone");
  put(x, DECK, z, b ? "smooth_stone" : "stone");
  if (!b) continue;                                     // interior: air behind the glass, nothing else

  put(x, PARAPET, z, "quartz_block");                   // parapet coping, one block above the deck

  // ground storey: plinth, shopfront glass, fascia band under the first string course
  for (let y = gr; y < 4; y++) {
    if (y === 0) put(x, y, z, "stone_bricks");
    else if (y === 3) put(x, y, z, "dark_oak_planks");
    else if (door && y === 1) put(x, y, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
    else if (door && y === 2) put(x, y, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
    else if (pier) put(x, y, z, "quartz_block");
    else { put(x, y, z, "glass_pane"); glass.push([x, y, z]); }
  }

  // upper storeys: two rows of glass sash under a brick spandrel, cream piers between the bays
  for (const s of [1, 2, 3]) {
    for (let y = 4 * s + 1; y <= 4 * s + 3; y++) {
      if (pier) put(x, y, z, "quartz_block");
      else if (y === 4 * s + 3) put(x, y, z, "bricks");       // spandrel under the string course
      else { put(x, y, z, "glass_pane"); glass.push([x, y, z]); }
    }
  }
}

// plant room on the roof, two storeys of stone brick with a slab cap, on interior deck cells
for (let x = 4; x <= 6; x++) for (let z = 5; z <= 6; z++) {
  if (!inM(x, z) || bnd(x, z)) continue;
  put(x, DECK + 1, z, "stone_bricks");
  put(x, DECK + 2, z, "stone_bricks");
  put(x, DECK + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// warm light: a glowstone just inside some sashes (the air behind the glass stays air elsewhere)
for (const [x, y, z] of glass) {
  const b = bnd(x, z);
  if (!b) continue;
  const miss = missing(x, z);
  const [dx, dz] = miss[0] === "W" ? [1, 0] : miss[0] === "E" ? [-1, 0] : miss[0] === "N" ? [0, 1] : [0, -1];
  const ix = x + dx, iz = z + dz;
  if (!inM(ix, iz) || bnd(ix, iz)) continue;
  const lit = (x * 5 + z * 3 + y) % 4 === 0;
  if (lit && g.get(ix, y, iz) === null) put(ix, y, iz, "glowstone");
}

// glass panes join their neighbours in the wall, as the vanilla pane does
const has = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, y, z] of glass) {
  const st = {
    north: has(x, y, z - 1) ? "true" : "false",
    south: has(x, y, z + 1) ? "true" : "false",
    east: has(x + 1, y, z) ? "true" : "false",
    west: has(x - 1, y, z) ? "true" : "false",
    waterlogged: "false",
  };
  put(x, y, z, "glass_pane", st);
}

const info = g.save(OUT);
console.log(`way_332237108: ${cells.length} footprint cells, ${info.blocks} blocks, ${info.palette} palette entries -> ${OUT}`);
