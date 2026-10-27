import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A two-storey brick shop-house from the 1920s-30s (the Mt Eden / Eden Terrace commercial strip), with a three-storey
// brick core on its south-west side. Storeys are 4 blocks: plinth y0, shopfront y1-2, sill belt y3, upper windows y4-5,
// belt y6, third-storey windows y7-8, cornice on each cell's top course. Brick is the wall, stone the plinth, belts and
// cornice, glass in a recess with a room behind it where the cell is enclosed (no room where it would leak).
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570515.cells.json", "utf8"));   // [x, z, ground, roof]
const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const has = (x, z) => roof.has(`${x},${z}`);
const enclosed = (x, z) => has(x, z) && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

// the outward face of each wall: the cell's step out (dx, dz); north is -z (the shop front faces the street side)
const FACES = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const PANE = {
  ew: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },   // a pane in an east-west wall
  ns: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },   // a pane in a north-south wall
};

const g = new Voxels([9, 23, 7]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// 1. massing: every cell solid from y 0 to its roof (ground is 0 under the whole footprint, so there is no foundation fill)
for (const [x, z, , r] of cells) {
  for (let y = 0; y < r; y++) {
    const belt = y === 3 || y === r - 1 || (r >= 8 && y === 6);
    put(x, y, z, y === 0 ? "stone_bricks" : belt ? "smooth_stone" : "bricks");
  }
}

// 2. articulation on the outside faces: shopfront, upper window grid, a door, rooms behind the glass, lights
for (const [x, z, , r] of cells) {
  for (const [name, [dx, dz]] of Object.entries(FACES)) {
    if (has(x + dx, z + dz)) continue;                  // only faces that look out
    const along = dz ? x : z;                           // index along the wall, for the window rhythm
    const ix = x - dx, iz = z - dz;                     // the cell one step back in: the room behind the glass
    const room = has(ix, iz) && enclosed(ix, iz);       // carve air only where no room cell is exposed to the outside
    const front = name === "north";
    const door = name === "north" && x === 5 && z === 2; // the entrance, off the shopfront
    const pane = dz ? PANE.ew : PANE.ns;
    const ground = [1, 2];
    const upper = [4, 5, ...range(7, r - 2)];

    // ground storey: a continuous shopfront on the street face, glazed bays and brick piers elsewhere
    for (const y of ground) {
      if (door) put(x, y, z, "oak_door", { facing: name, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (front || along % 2) put(x, y, z, "glass");
    }
    if (door || front || along % 2) {
      for (const y of ground) if (room) put(ix, y, iz, "air");
    }

    // upper storeys: glazed panes on alternate bays, brick between; a glowstone or shroomlight behind some of them
    for (const y of upper) {
      if (!(along % 2)) continue;
      put(x, y, z, "glass_pane", pane);
      if (room) {
        const lit = (along + y) % 5;
        put(ix, y, iz, lit === 0 ? "glowstone" : lit === 2 ? "shroomlight" : "air");
      }
    }

    // a lantern hangs in the room behind the shopfront every third bay, and over the door (it hangs off the sill belt)
    if (front && room) {
      if (door || along % 3 === 1) put(ix, 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// 3. roof plant on the core: a flat plant box on the third-storey cornice, so the roof reads as used, not empty
for (const [x, y, z] of [[1, 10, 5], [2, 10, 5]]) put(x, y, z, "light_gray_concrete");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570515.nbt";
const { blocks, palette } = g.save(out);
console.log(`way_1095570515: ${cells.length} cells, ${blocks} blocks, ${palette} block states -> ${out}`);
