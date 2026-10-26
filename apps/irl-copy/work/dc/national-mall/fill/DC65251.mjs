// 1510 9th St NW (Religious, Shaw/Logan Circle edge): a late-19th-century red-brick church. A low brick nave
// (lidar roof 7) with a stone-quoined podium across the front (roof 8) and a square tower on it (roof 9, lidar),
// a lower apse-side at the back (8). Walls are one block thick with an air gap behind every window; interiors
// are hollow with a ground floor slab and a storey slab at y 4. Massing tiers are the lidar roof smoothed to 7/8/9.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65251.cells.json", "utf8"));
const foot = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inF = (x, z) => foot.has(`${x},${z}`);
const gnd = (x, z) => foot.get(`${x},${z}`).g;

// clean flat tiers from the lidar roof: a front podium at 8, the tower (x 3..6, z 2..5) at 9, the nave hall at 7, the back at 8.
const roofTier = (x, z) => (z <= 5 ? (x >= 3 && x <= 6 && z >= 2 ? 9 : 8) : z >= 17 ? 8 : 7);
const top = (x, z) => roofTier(x, z) - 1;           // the cap block's y; walls run from the ground up to top - 1

const H = 11;                                        // max block is the tower's lantern at y 9
const g = new Voxels([10, H, 21]);

// a face is exposed where a neighbour is outside the footprint or stands lower
const exposedTo = (x, z, dx, dz) => !inF(x + dx, z + dz) || top(x + dx, z + dz) < top(x, z);
const isWall = (x, z) => exposedTo(x, z, 1, 0) || exposedTo(x, z, -1, 0) || exposedTo(x, z, 0, 1) || exposedTo(x, z, 0, -1);

const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // pane in an x-y plane
const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane in a z-y plane

// the entrance: a pair of dark oak doors in the front (z 0) at x 4 and 5, with a dark hood over both
const DOOR = [4, 5];
const isDoor = (x, z) => z === 0 && DOOR.includes(x);

// windows: on the front and back faces at x = 1, 4, 7 (not the doors); on the sides every third z from 1
const windowBay = (x, z) => {
  const nz = exposedTo(x, z, 0, 1) || exposedTo(x, z, 0, -1);
  const nx = exposedTo(x, z, 1, 0) || exposedTo(x, z, -1, 0);
  if (nz && !nx) return x % 3 === 1;
  if (nx && !nz) return z % 3 === 1;
  return false;
};
const winRows = (x, z) => [2, 3, ...Array.from({ length: Math.max(0, top(x, z) - 6) }, (_, i) => 5 + i)];
const isWindowRow = (x, z, y) => winRows(x, z).includes(y);
const tower = (x, z) => roofTier(x, z) === 9;
const paneFor = (x, z) => (tower(x, z) || z >= 17 ? "light_blue_stained_glass_pane" : "glass_pane");

// 1. foundation rubble from y 0 up to each cell's ground, and the cap on every cell
// 2. walls on the exposed cells; interior air with floor slabs at the ground and at y 4
for (const [key, { g: gr }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const T = top(x, z), wall = isWall(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "cobblestone");
  g.set(x, T, z, "deepslate_tiles");
  if (!wall) {
    if (T > gr && !isDoor(x, z)) g.set(x, gr, z, "spruce_planks");     // ground floor slab
    if (T > 4) g.set(x, 4, z, "spruce_planks");                         // storey slab
    continue;
  }
  const exX = exposedTo(x, z, 1, 0) || exposedTo(x, z, -1, 0);
  const exZ = exposedTo(x, z, 0, 1) || exposedTo(x, z, 0, -1);
  const corner = exX && exZ;
  for (let y = gr; y < T; y++) {
    if (isDoor(x, z)) {
      if (y === 1) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: x === 4 ? "left" : "right", open: "false", powered: "false" });
      else if (y === 2) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: x === 4 ? "left" : "right", open: "false", powered: "false" });
      else if (y === 3) g.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });       // the hood
      else g.set(x, y, z, "bricks");
      continue;
    }
    if (corner) g.set(x, y, z, "stone_bricks");                       // quoins
    else if (y === gr) g.set(x, y, z, "stone_bricks");                // base course
    else if (y === 4) g.set(x, y, z, "smooth_stone");                  // string course
    else if (y === T - 1) g.set(x, y, z, "smooth_stone");              // cornice
    else if (isWindowRow(x, z, y) && windowBay(x, z)) {
      const pane = paneFor(x, z);
      g.set(x, y, z, pane, exZ && !exX ? PANE_Z : PANE_X);
    } else g.set(x, y, z, "bricks");
  }
}

// 3. warm light behind every other window: glowstone in the air gap on the inside
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (!isWall(x, z) || isDoor(x, z)) continue;
  for (const y of [2, 5]) {
    if (!isWindowRow(x, z, y) || !windowBay(x, z) || (x + z + y) % 2) continue;
    // the inward neighbour: the footprint cell opposite the outside
    for (const [dx, dz] of DIRS) {
      if (!exposedTo(x, z, dx, dz)) continue;
      const ix = x - dx, iz = z - dz;
      if (!inF(ix, iz) || isWall(ix, iz) || y >= top(ix, iz) || y === 4) break;
      g.set(ix, y, iz, "glowstone");
      break;
    }
  }
}

// 4. the tower's top: a stepped cap of stairs round a 2x2 core, and a lantern, all on the 9 tier
const tx = [3, 6], tz = [2, 5];
for (let x = tx[0]; x <= tx[1]; x++) for (let z = tz[0]; z <= tz[1]; z++) {
  if (!inF(x, z)) continue;
  const edgeN = z === tz[0], edgeS = z === tz[1], edgeW = x === tx[0], edgeE = x === tx[1];
  if (edgeN || edgeS || edgeW || edgeE) {
    const facing = edgeN && !(edgeW || edgeE) ? "south" : edgeS && !(edgeW || edgeE) ? "north" : edgeW && !(edgeN || edgeS) ? "east" : "west";
    const corner = (edgeN || edgeS) && (edgeW || edgeE);
    if (corner) g.set(x, 9, z, "deepslate_tile_slab", { type: "bottom", waterlogged: "false" });
    else g.set(x, 9, z, "deepslate_tile_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
  } else g.set(x, 9, z, "deepslate_tiles");
}
g.set(4, 10, 3, "lantern", { hanging: "false", waterlogged: "false" });

// 5. rooftop plant on the nave: a 2x2 iron-block unit on the hall's cap
for (const [x, z] of [[2, 10], [3, 10], [2, 11], [3, 11]]) g.set(x, 7, z, "iron_block");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65251.nbt";
const res = g.save(out);
console.log(JSON.stringify(res));
