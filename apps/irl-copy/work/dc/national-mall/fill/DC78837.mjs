// DC78837: N St NW, Washington DC. A narrow 1920s brick commercial block: a stone-based shopfront, one
// upper storey (north wing 6 blocks, south wing 5), a calcite storey band and cornice, dark-wood shopfront
// piers, and a street door on the east face. Hollow middle column, floor slabs in the north wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78837.cells.json", "utf8"));

// the footprint, and the lidar roof smoothed into two flat tiers: north (z 0..7) at 6, south (z 8..11) at 5
const has = new Set(cells.map(([x, z]) => `${x},${z}`));
const at = (x, z) => has.has(`${x},${z}`);
const roofOf = (z) => (z <= 7 ? 6 : 5);
const DOOR = { x: 2, z: 9 };

const g = new Voxels([3, 18, 12]);
const panes = [];

// the one-cell-thick shell: the street (east) face, the back (west), and the ends and notch faces
function exposed(x, z) {
  return {
    east: !at(x + 1, z), west: !at(x - 1, z), north: !at(x, z - 1), south: !at(x, z + 1),
  };
}

// upper-storey row: 4 in the north wing (6 high), 3 in the south wing (5 high)
const upperY = (R) => (R === 6 ? 4 : 3);

function skin(x, z, y, R) {
  const e = exposed(x, z);
  if (y === 0) return x === DOOR.x && z === DOOR.z ? ["dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" }] : ["stone_bricks"];
  if (y === R - 1) return ["calcite"];
  if (R === 6 && y === 3) return ["calcite"];                                   // storey band

  if (e.east && x === 2) {
    if (y <= 2) {
      if (z === DOOR.z) return y === 1 ? ["dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" }] : ["glass_pane"];
      if ([0, 4, 8, 11].includes(z)) return ["dark_oak_planks"];                  // shopfront piers
      return ["glass_pane"];
    }
    if (y === upperY(R)) {
      if (R === 5 && z === DOOR.z) return ["calcite"];                          // lintel over the door
      return z % 2 === 1 ? ["glass_pane"] : ["bricks"];
    }
  }
  if (e.west && x === 0 && y === upperY(R)) return z % 2 === 1 ? ["glass_pane"] : ["bricks"];
  if (e.west && x === 2 && z >= 4 && z <= 7 && y === upperY(R)) return z % 2 === 1 ? ["glass_pane"] : ["bricks"];
  if (y === upperY(R) && x === 1 && (z === 0 || z === 3 || z === 8 || z === 11)) return ["glass_pane"];
  return ["bricks"];
}

for (const [x, z] of cells) {
  const R = roofOf(z), e = exposed(x, z);
  const perimeter = e.east || e.west || e.north || e.south;
  for (let y = 0; y < R; y++) {
    if (!perimeter) {
      // the hollow middle: floor slab at the base and (north wing) at the storey line, roof cap on top
      if (y === 0 || (R === 6 && y === 3)) g.set(x, y, z, "stone_bricks");
      else if (y === R - 1) g.set(x, y, z, "stone");
      continue;
    }
    if (y === R - 1) { g.set(x, y, z, "calcite"); continue; }
    const [block, state] = skin(x, z, y, R);
    g.set(x, y, z, block, state);
    if (block === "glass_pane") panes.push([x, y, z]);
  }
}

// the roof of the hollow middle, the flat tar roof, is "stone" under the calcite cornice ring; a warm light
// behind the glass where a window looks onto the middle column
for (const [x, y, z, block] of [[1, 1, 1, "glowstone"], [1, 1, 10, "glowstone"], [1, 4, 1, "shroomlight"]]) g.set(x, y, z, block);

// panes connect to any solid neighbour in the wall plane, as they do in game
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, y, z] of panes) {
  const state = {
    north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
    east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)),
  };
  g.set(x, y, z, "glass_pane", state);
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78837.nbt");
console.log(JSON.stringify(info));
