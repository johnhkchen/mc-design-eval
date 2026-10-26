// 1225 Connecticut Ave NW: a mid-century Modern office block. White precast-look concrete bands with quartz mullions,
// a granite base, cyan glass in a 2-block storey rhythm (spandrel row + window row), a stepped massing from the lidar
// roof: wings at 12, a setback ring at 14, a tower core at 16. The stub on the south face is the entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${FILL}/DC58992.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const WING = 12, SETBACK = 14, TOWER = 16;

// Smooth the lidar roof into three tiers: >= 15 is the tower mass, 13-14 the setback, else the wings. The tower's outer
// ring steps down to the setback tier so the core rises out of a terrace.
const roofAt = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const tower = new Set([...roofAt].filter(([, r]) => r >= 15).map(([k]) => k));
const tierOf = new Map();
for (const k of roofAt.keys()) {
  if (tower.has(k)) {
    const [x, z] = k.split(",").map(Number);
    const edge = NB.some(([dx, dz]) => !tower.has(key(x + dx, z + dz)));
    tierOf.set(k, edge ? SETBACK : TOWER);
  } else tierOf.set(k, roofAt.get(k) >= 13 ? SETBACK : WING);
}
const tierAt = (x, z) => tierOf.get(key(x, z));
const inside = (x, z) => tierOf.has(key(x, z));

// a wall is any cell with an edge to outside the footprint or to a different tier
const differs = (x, z, [dx, dz]) => !inside(x + dx, z + dz) || tierAt(x + dx, z + dz) !== tierAt(x, z);
const wall = (x, z) => NB.some((d) => differs(x, z, d));
const zFace = (x, z) => differs(x, z, [0, 1]) || differs(x, z, [0, -1]);
const xFace = (x, z) => differs(x, z, [1, 0]) || differs(x, z, [-1, 0]);
const exposedTop = (x, z) => NB.some(([dx, dz]) => !inside(x + dx, z + dz) || tierAt(x + dx, z + dz) < tierAt(x, z));

// storey rhythm: floor and roof slabs on odd rows from 3 (row 0 is the floor), window rows 1-2 (shopfront) then even rows
const SLAB = new Set([0, 3, 5, 7, 9, 11, 13, 15]);
const isWindowRow = (y, top) => y === 1 || y === 2 || (y >= 4 && y <= top - 2 && y % 2 === 0);

const M = {
  base: "polished_andesite", spandrel: "white_concrete", floor: "smooth_stone", mullion: "smooth_quartz",
  shop: "glass", pane: "cyan_stained_glass_pane", cap: "smooth_quartz_slab", canopy: "gray_concrete",
  unit: "light_gray_concrete", lamp: "glowstone", lamp2: "shroomlight", penthouse: "smooth_quartz",
};
const paneState = (zf) => (zf
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const g = new Voxels([31, 28, 16]);
const lamps = [];

for (const k of roofAt.keys()) {
  const [x, z] = k.split(",").map(Number);
  const top = tierAt(x, z), w = wall(x, z), zf = zFace(x, z), xf = xFace(x, z);
  const corner = zf && xf;
  const pos = zf ? x : z;                       // along the facade: x on a z-face, z on an x-face
  for (let y = 0; y < top; y++) {
    if (SLAB.has(y)) {
      g.set(x, y, z, w ? (y === 0 ? M.base : M.spandrel) : M.floor);
    } else if (isWindowRow(y, top)) {
      if (!w) continue;                         // interior: air behind the glass
      if (corner || pos % 3 === 0) g.set(x, y, z, M.mullion);
      else if (y <= 2) g.set(x, y, z, M.shop);
      else g.set(x, y, z, M.pane, paneState(zf));
      // a warm light behind some panes: the room cell inward, on the floor slab
      if (w && !corner && pos % 3 !== 0 && y > 2) {
        const inward = NB.find(([dx, dz]) => inside(x + dx, z + dz) && tierAt(x + dx, z + dz) === top && !wall(x + dx, z + dz));
        const h = x * 7 + z * 3 + y * 5;
        if (inward && h % 19 === 0) lamps.push([x + inward[0], y, z + inward[1], M.lamp]);
        else if (inward && h % 53 === 0) lamps.push([x + inward[0], y, z + inward[1], M.lamp2]);
      }
    }
  }
  // parapet cap on any edge that stands above the ground outside it or a lower tier
  if (exposedTop(x, z)) g.set(x, top, z, M.cap, { type: "bottom", waterlogged: "false" });
}

for (const [x, y, z, b] of lamps) g.set(x, y, z, b);

// roof plant: light-grey units on the wing roofs, a penthouse on the tower core
for (const k of roofAt.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (tierAt(x, z) === WING && !wall(x, z) && x % 9 === 5 && z % 6 === 2) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (inside(x + dx, z + dz) && tierAt(x + dx, z + dz) === WING) g.set(x + dx, WING, z + dz, M.unit);
    g.set(x, WING + 1, z, M.unit);
  }
  if (tierAt(x, z) === TOWER && !wall(x, z) && x >= 12 && x <= 14 && z >= 6 && z <= 8) {
    g.set(x, TOWER, z, M.penthouse); g.set(x, TOWER + 1, z, M.penthouse);
  }
}

// the entrance: a double dark-oak door in the south stub (the two footprint cells at z 15), with a dark canopy over it
const DOOR = { facing: "south", open: "false", powered: "false" };
for (const x of [22, 23]) {
  const hinge = x === 22 ? "left" : "right";
  g.set(x, 1, 15, "dark_oak_door", { ...DOOR, half: "lower", hinge });
  g.set(x, 2, 15, "dark_oak_door", { ...DOOR, half: "upper", hinge });
  g.set(x, 3, 15, M.canopy);
}

const out = `${FILL}/DC58992.nbt`;
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
