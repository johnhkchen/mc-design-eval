import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76944.cells.json`, "utf8"));

// 8 x 19 footprint, 35 blocks tall (roof ~23 blocks, room for roof plant above)
const W = 8, H = 35, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const c of cells) {
  const [x, z, ground, roof] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  info.set(key(x, z), {
    ground: Math.max(0, Math.min(H - 6, Math.round(ground))),
    roof: Math.max(6, Math.min(H - 4, Math.round(roof))),
  });
}

// 1980s Class-A office: granite plinth, pale quartz storey lines, tinted glass,
// quartz mullions, light parapet. Storeys are 2 blocks: slab band + glass row.
const GRANITE = "polished_granite";
const SLAB = "smooth_quartz";
const CAP = "smooth_quartz";
const GLASS = "light_blue_stained_glass";
const MULLION = "quartz_pillar";
const ROOF_PLANT = "light_gray_concrete";
const INTERIOR_CAP = "light_gray_concrete";
const FIRST_FLOOR = 3;

const isEdge = (x, z) =>
  !info.has(key(x - 1, z)) || !info.has(key(x + 1, z)) ||
  !info.has(key(x, z - 1)) || !info.has(key(x, z + 1));

// Entrance bays: centred on the two long faces (z=0 and z=D-1), x = 3..4
const isEntranceCell = (x, z) =>
  (z === 0 || z === D - 1) && (x === 3 || x === 4);

for (const [k, cell] of info) {
  const [x, z] = k.split(",").map(Number);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const edge = isEdge(x, z);
  const { ground, roof } = cell;
  const top = roof;

  // Foundation / plinth: solid from y0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, GRANITE);

  // Massing from ground up to the roof
  for (let y = ground; y < top; y++) {
    if (y === top - 1) {
      g.set(x, y, z, edge ? CAP : INTERIOR_CAP);
      continue;
    }
    if (y < FIRST_FLOOR) {
      g.set(x, y, z, GRANITE);
      continue;
    }
    const rel = (y - FIRST_FLOOR) % 2;
    if (rel === 0) {
      g.set(x, y, z, SLAB);
    } else {
      if (edge) {
        // mullions on alternating bays; corners always mullion
        const bay = (x === 0 || x === W - 1) ? z : x;
        const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
        const isMullion = corner || bay % 2 === 0;
        g.set(x, y, z, isMullion ? MULLION : GLASS, isMullion ? { axis: "y" } : undefined);
      } else {
        if ((x * 3 + z * 5 + y) % 13 === 0) g.set(x, y, z, "glowstone");
      }
    }
  }

  // Roof plant on some interior roof cells (rests on the roof cap)
  if (!edge && x >= 2 && x <= 5 && (x * 3 + z) % 5 === 0 && top + 2 <= H) {
    g.set(x, top, z, ROOF_PLANT);
    g.set(x, top + 1, z, ROOF_PLANT);
  }
}

// Entrances: recessed lobby bays on both long faces
for (const z of [0, D - 1]) {
  const outward = z === 0 ? "north" : "south";
  const inward = z === 0 ? "south" : "north";
  for (const x of [3, 4]) {
    const cell = info.get(key(x, z));
    if (!cell) continue;
    const gy = cell.ground;
    if (gy + 3 >= H) continue;
    const hinge = x === 3 ? "left" : "right";

    // Door: two blocks tall, sitting on the ground at this cell
    g.set(x, gy, z, "dark_oak_door", {
      facing: outward, half: "lower", hinge, open: "false", powered: "false",
    });
    g.set(x, gy + 1, z, "dark_oak_door", {
      facing: outward, half: "upper", hinge, open: "false", powered: "false",
    });

    // Canopy band over the entrance (a course above the door, same footprint)
    g.set(x, gy + 2, z, GRANITE);
  }

  // Quartz surround flanking the door and warm lobby lights
  for (const x of [2, 5]) {
    const cell = info.get(key(x, z));
    if (!cell) continue;
    const gy = cell.ground;
    if (gy + 2 >= H) continue;
    g.set(x, gy, z, SLAB);
    g.set(x, gy + 1, z, MULLION, { axis: "y" });
    g.set(x, gy + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC76944.nbt`);
