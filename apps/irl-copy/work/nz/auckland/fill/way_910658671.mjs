// A 1920s Free-Classical brick shop-top block (Mt Eden / Eden Terrace style): a basalt plinth, a glazed
// shopfront with a timber fascia, two storeys of red brick sash windows with cream stone string courses and quoins,
// a cream parapet, and a lower two-storey and one-storey wing stepping down to the north-west. Interior = air behind
// the glass, a floor slab per storey and a roof deck; a lantern-lit window every few bays and a small plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658671.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658671.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));           // [x, z, ground, roof] per footprint cell
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);

// Lidar roof heights smoothed into four tiers: 14 (three storeys + parapet), 10 (two storeys), 6 (one storey), 2 (plinth).
const tierTop = (roof) => (roof >= 13 ? 14 : roof >= 10 ? 10 : roof >= 6 ? 6 : 2);
const STOREY_FLOORS = [2, 6, 10];                                // floor-slab / string-course lines (y)
const OUTWARD = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const SOLID = new Set(["bricks", "stone_bricks", "smooth_quartz", "smooth_stone", "stone", "oak_planks"]);
const DOOR_CELL = [4, 1];                                        // the north entrance, on the main frontage

const B = new Map();                                             // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => B.get(`${x},${y},${z}`);
const topOf = (x, z) => (inFoot(x, z) ? tierTop(foot.get(`${x},${z}`).roof) : 0);
// the faces that open to outside air: the footprint's edge, or a step down to a lower neighbour (a setback)
const exposedFaces = (x, z) => Object.keys(OUTWARD).filter((f) => { const [dx, dz] = OUTWARD[f]; return topOf(x + dx, z + dz) < topOf(x, z); });
const outsideFaces = (x, z) => Object.keys(OUTWARD).filter((f) => { const [dx, dz] = OUTWARD[f]; return !inFoot(x + dx, z + dz); });
const isRing = (x, z) => exposedFaces(x, z).length > 0;

// 1. massing, plinth, floors, roof decks, walls (no windows yet)
for (const [x, z, , roof] of cells) {
  const T = tierTop(roof);
  const ring = isRing(x, z);
  for (let y = 0; y < 2; y++) put(x, y, z, "stone_bricks");        // basalt plinth / foundation under every cell
  if (T === 2) continue;
  for (let y = 2; y < T; y++) {
    if (STOREY_FLOORS.includes(y)) { put(x, y, z, ring ? "smooth_quartz" : "smooth_stone"); continue; }
    if (y === T - 1) { put(x, y, z, ring ? "smooth_quartz" : "stone"); continue; }   // cream parapet / roof deck
    if (ring) put(x, y, z, "bricks");                                               // brick walls
  }
}

// 2. the frontage: shopfront, sash windows, the entrance, and lanterns behind some panes
const panes = [];
for (const [x, z, , roof] of cells) {
  const T = tierTop(roof);
  // the first outside face with air behind it (a corner glazes one face and keeps the other as brick)
  const face = outsideFaces(x, z).find((f) => { const [dx, dz] = OUTWARD[f]; return inFoot(x - dx, z - dz) && !isRing(x - dx, z - dz); });
  if (!face) continue;                                           // a one-cell-thin wall: no air to look into
  const [dx, dz] = OUTWARD[face];
  const ix = x - dx, iz = z - dz;                                // the air cell behind the glass
  const u = face === "north" || face === "south" ? x : z;
  for (let y = 3; y < T - 1; y++) {
    if (STOREY_FLOORS.includes(y)) continue;
    const base = STOREY_FLOORS.filter((s) => s <= y).pop();
    if (base === 2) {                                            // ground floor: shopfront glazing, timber posts, fascia
      if (y === 5) { put(x, y, z, "oak_planks"); continue; }
      if (x === DOOR_CELL[0] && z === DOOR_CELL[1] && face === "north") {
        const st = { facing: "north", hinge: "left", open: "false", powered: "false" };
        put(x, y, z, "dark_oak_door", { ...st, half: y === 3 ? "lower" : "upper" });
        continue;
      }
      if (u % 3 === 0) put(x, y, z, "oak_planks");          // a timber post every third bay, glass between
      else { put(x, y, z, "glass_pane"); panes.push([x, y, z]); }
      continue;
    }
    if (y > base + 3 || y > T - 2) continue;                     // upper storeys: three-block sash band under the lintel
    if (u % 2 === 1) {                                           // one sash every other bay, brick piers between
      put(x, y, z, "glass_pane"); panes.push([x, y, z]);
      if (y === base + 1 && u % 4 === 1 && !at(ix, y, iz)) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// 3. the roof plant room: a 2x2 stone box on the roof deck of the top tier, inside the footprint
outer: for (const [x, z, , roof] of cells) {
  if (tierTop(roof) !== 14) continue;
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!block.every(([bx, bz]) => inFoot(bx, bz) && topOf(bx, bz) === 14 && !isRing(bx, bz))) continue;
  for (const [bx, bz] of block) {
    put(bx, 14, bz, "stone_bricks"); put(bx, 15, bz, "stone_bricks");
    put(bx, 16, bz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  break outer;
}

// 4. glass panes connect to the neighbours they touch (panes and solid walls), as in-game placement does
for (const [x, y, z] of panes) {
  const link = (dx, dz) => { const n = at(x + dx, y, z + dz); return n && (n.block === "glass_pane" || SOLID.has(n.block)) ? "true" : "false"; };
  put(x, y, z, "glass_pane", { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" });
}

// write the volume: 10 x 27 x 7, the footprint's own bounding box, height left for the plant room
const g = new Voxels([10, 27, 7]);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save(OUT);
console.log(`wrote ${OUT}: ${blocks} blocks, ${palette} palette entries`);
