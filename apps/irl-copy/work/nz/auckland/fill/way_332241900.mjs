// The Fabric Store (way 332241900): a 1920s brick commercial block, three storeys on the high side and four on the low,
// with a timber shopfront and striped awning on its west and south faces, cream terracotta bands, a parapet, and a
// rooftop plant room. The lidar roof is snapped to two flat tiers (8 and 12 blocks); each cell's ground is its foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241900.cells.json", "utf8"));
const W = 36, H = 25, D = 34;
const g = new Voxels([W, H, D]);

// Per column: ground (foundation top) and roof (flat tier: 12 for the main block, 8 for the lower wings).
const COL = new Map();
for (const [x, z, ground, roof] of cells) COL.set(`${x},${z}`, { g: ground, r: roof >= 10 ? 12 : 8 });
const col = (x, z) => COL.get(`${x},${z}`) ?? null;
const occ = (x, y, z) => { const c = col(x, z); return !!c && y >= 0 && y < c.r; };
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Storey lines: floor slabs at y 4 and 8; the ground storey runs from the cell's ground to 3; the lid is at r-1.
// Interior air is every storey cell whose four neighbours are occupied: no rooms, and an air gap behind each pane.
function carved(x, y, z) {
  const c = col(x, z); if (!c) return false;
  const lo = Math.max(c.g, 1), hi = c.r - 2;
  if (y < lo || y > hi || y === 4 || y === 8) return false;
  return NB.every(([dx, dz]) => occ(x + dx, y, z + dz));
}
const solid = (x, y, z) => occ(x, y, z) && !carved(x, y, z);
// horizontal faces where the voxel is on the outside of the envelope
const faces = (x, y, z) => NB.filter(([dx, dz]) => !occ(x + dx, y, z + dz));

// The frontage: west (-x) and south (+z). The lowest ground is on the west side, so the shops face the street there.
const FRONT = ([dx, dz]) => (dx === -1 && dz === 0) || (dx === 0 && dz === 1);
const FACE_PRIORITY = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const primaryFace = (fs) => FACE_PRIORITY.find((p) => fs.some(([dx, dz]) => dx === p[0] && dz === p[1]));
// the along-the-face coordinate: x on north and south faces, z on east and west faces
const along = ([dx, dz], x, z) => (dz !== 0 ? x : z);
const bay = (u) => u % 3 === 0;   // one pier brick, then two panes: the rhythm of every storey

// The entrance: the west-face cell nearest the middle of the frontage, on the lowest ground.
const westCells = [];
for (const [x, z, gg] of cells) if (gg <= 1 && col(x, z).r >= 12 && !occ(x - 1, 1, z)) westCells.push([x, z]);
westCells.sort((a, b) => a[1] - b[1]);
const door = westCells[Math.floor(westCells.length / 2)];

// Panes connect to the solid wall on either side in their own plane
function paneState(x, y, z, face) {
  const s = { north: "false", south: "false", east: "false", west: "false" };
  if (face[1] !== 0) {     // a north or south face: panes connect east and west
    if (solid(x + 1, y, z)) s.east = "true";
    if (solid(x - 1, y, z)) s.west = "true";
  } else {                 // an east or west face: panes connect north and south
    if (solid(x, y, z + 1)) s.south = "true";
    if (solid(x, y, z - 1)) s.north = "true";
  }
  return s;
}

// What a solid voxel is made of: foundation, cream band, quoin, shopfront, window bay, brick.
function place(x, y, z) {
  const c = col(x, z);
  const fs = faces(x, y, z);
  const exposed = fs.length > 0;
  const lo = Math.max(c.g, 1);
  if (y < lo) return exposed ? ["stone_bricks"] : ["smooth_stone"];                // foundation and floor layer
  if (y === 4 || y === 8 || y === c.r - 1) return exposed ? ["white_terracotta"] : ["smooth_stone"];  // bands, cornice
  if (!exposed) return ["smooth_stone"];                                             // floor slabs and roof deck
  const face = primaryFace(fs);   // a stair-stepped edge has two exposed faces too; it takes the face's pattern, not a quoin
  const u = along(face, x, z);
  const ground = y <= 3;
  if (ground && FRONT(face)) {
    if (y === 3) {         // the fascia over the shopfront; striped awning over the entrance
      if (face[0] === -1 && x === door[0] && Math.abs(z - door[1]) <= 1) return [z % 2 ? "red_wool" : "white_wool"];
      return ["dark_oak_planks"];
    }
    if (face[0] === -1 && x === door[0] && z === door[1])
      return ["dark_oak_door", { facing: "east", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    if (bay(u)) return ["bricks"];
    return ["glass_pane", paneState(x, y, z, face)];
  }
  if (ground) return bay(u) ? ["bricks"] : ["glass_pane", paneState(x, y, z, face)];
  if (y === 7 && y !== c.r - 1) return ["bricks"];                                   // brick lintel
  if (bay(u)) return ["bricks"];
  return ["glass_pane", paneState(x, y, z, face)];
}

// The envelope: every solid voxel that is not interior air
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = col(x, z); if (!c) continue;
  for (let y = 0; y < c.r; y++) {
    if (!solid(x, y, z)) continue;
    const [block, state] = place(x, y, z);
    g.set(x, y, z, block, state);
  }
}

// Warm lights standing inside some windows: one interior cell in front of a pane every fourth window bay
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = col(x, z); if (!c) continue;
  for (const y of [Math.max(c.g, 1), 5, 9]) {
    if (y >= c.r - 1 || !carved(x, y, z)) continue;
    const win = NB.find(([dx, dz]) => solid(x + dx, y, z + dz) && place(x + dx, y, z + dz)[0] === "glass_pane");
    if (!win) continue;
    if ((along(win, x, z) + y) % 4 !== 0) continue;
    g.set(x, y, z, "lantern", { hanging: "false" });
  }
}

// Plant room on the roof of the main block, with a vent
for (let z = 13; z <= 18; z++) for (let x = 15; x <= 19; x++) {
  const c = col(x, z);
  if (!c || c.r !== 12 || faces(x, 11, z).length) continue;
  g.set(x, 12, z, "stone_bricks");
  const top = (x + z) % 3 === 0;
  g.set(x, 13, z, top ? "stone_brick_slab" : "stone_bricks", top ? { type: "bottom", waterlogged: "false" } : undefined);
}
g.set(17, 14, 15, "iron_block");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241900.nbt");
