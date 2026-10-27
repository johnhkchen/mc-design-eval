// Auckland, Newton / Eden Terrace: a 1920s two-storey brick shop-top on a narrow lot, with a stair tower on its west
// corner. Red brick walls on a stone plinth, cream string courses and a parapet coping, a dark timber shopfront with a
// door on the north (street) side, and a flat roof with a plant unit. The lidar roof is 7 blocks over most of the
// footprint and 9 over the stair core; the lone 8 at the north tip is noise between two 7s, so it joins the 7 tier.
// Storeys are 3 blocks (about 2.5 m) because the lidar roof is 7 blocks up. Walls are one block thick with a storey void
// behind, so glass sits in the wall line with air behind it, and warm lights stand in the void behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572149.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572149.nbt";

const W = 7, D = 10, H = 22;
const FLOORS = [3, 6];                                   // storey slabs; the ground slab is y 0
const SIDES = [                                          // N is the street front (shopfront, door, fascia)
  { dx: 0, dz: -1, name: "N" }, { dx: -1, dz: 0, name: "W" }, { dx: 1, dz: 0, name: "E" }, { dx: 0, dz: 1, name: "S" },
];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const roof = new Int16Array(W * D).fill(-1);             // -1 = outside the footprint
const ground = new Int16Array(W * D).fill(0);
for (const [x, z, g, r] of cells) {
  roof[z * W + x] = r === 8 ? 7 : r;                     // lone 8 is lidar noise between 7s
  ground[z * W + x] = g;
}
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && roof[z * W + x] >= 0;
const R = (x, z) => (inF(x, z) ? roof[z * W + x] : -1);
// the first side on which a cell's wall at height y meets air: outside the footprint, or a neighbour whose roof is below y
const edgeAt = (x, z, y) => SIDES.find((s) => !inF(x + s.dx, z + s.dz) || R(x + s.dx, z + s.dz) <= y) ?? null;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const counts = { lights: 0, glass: 0 };

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const top = R(x, z) - 1;
  // foundation below the lowest ground (none here: the footprint sits on y 0)
  for (let y = 0; y < ground[z * W + x]; y++) put(x, y, z, "stone_bricks");

  for (let y = 0; y <= top; y++) {
    const edge = edgeAt(x, z, y);

    if (y === top) {                                     // roof: cornice and coping on the edge, membrane inside
      if (edge) { put(x, y, z, "smooth_quartz"); put(x, y + 1, z, "smooth_quartz_slab", { type: "bottom" }); }
      else put(x, y, z, "smooth_stone");                 // lighter than gray_concrete, which read as holes from above
      continue;
    }
    if (y === 0) { put(x, y, z, edge ? "stone_bricks" : "smooth_stone"); continue; }     // plinth, floor slab
    if (FLOORS.includes(y)) {                            // storey line: fascia on the shopfront, string course elsewhere
      if (!edge) put(x, y, z, "smooth_stone");
      else if (edge.name === "N" && y === 3) put(x, y, z, "dark_oak_planks");
      else put(x, y, z, "smooth_quartz");
      continue;
    }
    if (!edge) continue;                                 // storey void: air behind the glass

    // the wall: t counts along the face, so window bays alternate pier and pane
    const t = edge.name === "N" || edge.name === "S" ? x : z;
    const bay = t % 2 === 1;
    if (x === 2 && z === 0 && edge.name === "N" && (y === 1 || y === 2)) {     // the street door
      const half = y === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y <= 2) {                                        // ground floor: shopfront glass, timber piers on the street
      if (bay) { put(x, y, z, "glass_pane"); counts.glass++; }
      else put(x, y, z, edge.name === "N" ? "dark_oak_planks" : "bricks");
    } else {                                             // upper storeys; louvres on the stair core above the main roof
      if (bay) put(x, y, z, y >= 7 ? "iron_bars" : "glass_pane");
      else put(x, y, z, "bricks");
    }
  }
}

// warm light in the void behind some panes: shroomlight on the shopfront, glowstone upstairs
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const top = R(x, z) - 1;
  for (const y of [1, 4]) {
    if (y > top) continue;
    const edge = edgeAt(x, z, y);
    if (!edge) continue;
    const t = edge.name === "N" || edge.name === "S" ? x : z;
    if (t % 2 !== 1) continue;
    if (y === 4 && (t + z) % 3 !== 0) continue;          // about one upper pane in three
    const ix = x - edge.dx, iz = z - edge.dz;            // the void behind the pane
    if (!inF(ix, iz) || edgeAt(ix, iz, y)) continue;
    put(ix, y, iz, y === 1 ? "shroomlight" : "glowstone"); counts.lights++;
  }
}

// plant unit standing on the main roof membrane (y 6)
put(4, 7, 4, "iron_block");

const res = g.save(OUT);
console.log(JSON.stringify({ ...res, ...counts }));
