import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020146";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 9;
const ROOF = 11;          // roof top about 11 blocks above lowest ground
const STOREY1_TOP = 4;    // ground storey runs gr+1..4
const BELT = 5;           // storey line / belt course
const STOREY2_TOP = 9;    // upper storey runs 6..9
const CORNICE = 10;       // cornice and roof structure
const DOOR_X = 5;

const g = new Voxels([W, H, D]);
const occ = new Map();
for (const [x, z, gr] of cells) occ.set(`${x},${z}`, gr);
const has = (x, z) => occ.has(`${x},${z}`);

// Facing outward for each exposed side
const OUT = {
  north: { dx: 0, dz: -1, opp: "south" },
  south: { dx: 0, dz: 1, opp: "north" },
  west: { dx: -1, dz: 0, opp: "east" },
  east: { dx: 1, dz: 0, opp: "west" },
};

const pane = (x, y, z, axisEW) => {
  // connect along the wall run where neighbouring footprint cells exist
  const p = axisEW
    ? { north: "false", south: "false", east: has(x + 1, z) ? "true" : "false", west: has(x - 1, z) ? "true" : "false" }
    : { east: "false", west: "false", north: has(x, z - 1) ? "true" : "false", south: has(x, z + 1) ? "true" : "false" };
  g.set(x, y, z, "glass_pane", { ...p, waterlogged: "false" });
};

for (const [x, z, gr] of cells) {
  if (gr >= ROOF) continue;
  const faces = [];
  if (!has(x, z - 1)) faces.push("north");
  if (!has(x, z + 1)) faces.push("south");
  if (!has(x - 1, z)) faces.push("west");
  if (!has(x + 1, z)) faces.push("east");
  const exterior = faces.length > 0;
  const corner = faces.length >= 2;

  // 1. Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // 2. Ground floor slab / base course
  g.set(x, gr, z, exterior ? "stone_bricks" : "smooth_stone");

  // 3. Floor slabs and roof structure across every storey line
  if (!exterior) {
    g.set(x, BELT, z, "smooth_stone");
    g.set(x, CORNICE, z, "smooth_stone");
  }

  // 4. Roof: parapet on the edge, flat roof surface inside
  g.set(x, ROOF, z, exterior ? "white_concrete" : "light_gray_concrete");

  if (!exterior) continue;

  // 5. Exterior envelope
  // Belt course and cornice wrap the whole perimeter
  g.set(x, BELT, z, "smooth_quartz");
  g.set(x, CORNICE, z, "stone_bricks");

  const storeyRows = [[gr + 1, STOREY1_TOP, true], [BELT + 1, STOREY2_TOP, false]];

  if (corner) {
    // Quoined corner pillars, full height
    for (let y = gr; y <= CORNICE; y++) {
      if (y === BELT || y === CORNICE) continue;
      if (y === gr) continue;
      g.set(x, y, z, "smooth_quartz");
    }
    continue;
  }

  const face = faces[0];
  const idx = (face === "north" || face === "south") ? x : z;
  const isSouthDoor = face === "south" && idx === DOOR_X;

  for (const [lo, hi, ground] of storeyRows) {
    for (let y = lo; y <= hi; y++) {
      if (lo > hi) break;
      if (isSouthDoor && ground && y <= gr + 3) {
        // Entrance: door on the ground storey, red signband above
        if (y === gr + 1) {
          g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (y === gr + 2) {
          g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (y === gr + 3) {
          g.set(x, y, z, "red_concrete");
        }
        continue;
      }
      if (isSouthDoor && ground && y === STOREY1_TOP) {
        g.set(x, y, z, "smooth_quartz");
        continue;
      }
      const isSill = y === lo;
      const isHeader = y === hi;
      if (idx % 2 === 1) {
        // Window bay: sill and header in quartz, glass between
        if (isSill || isHeader) g.set(x, y, z, "smooth_quartz");
        else pane(x, y, z, face === "north" || face === "south");
      } else {
        // Solid spandrel bay
        g.set(x, y, z, ground ? "white_concrete" : "white_concrete");
      }
    }
  }

  // 6. Warm light behind some glass: place inside the air gap, one cell inward
  const { dx, dz } = OUT[face];
  for (const y of [gr + 2, 7]) {
    if (idx % 4 === 1 && has(x - dx, z - dz)) {
      const lx = x - dx, lz = z - dz;
      // skip if this would land on the door's interior zone
      if (!(isSouthDoor && y <= gr + 2)) {
        g.set(lx, y, lz, (y === 7) ? "shroomlight" : "glowstone");
      }
    }
  }
}

// 7. Roof plant: a couple of AC cabinets on interior roof cells
let plant = 0;
for (const [x, z, gr] of cells) {
  if (plant >= 2) break;
  const interior = has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z);
  if (interior && gr < ROOF && x % 3 === 1 && z % 3 === 1) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    plant++;
  }
}

g.save(`${DIR}/${ID}.nbt`);
