// DC69581: a five-storey Federal Triangle-style office block (Indiana limestone over a granite plinth, flat roof, stone parapet).
// Massing follows the lidar roof per cell, snapped to whole storeys (4 blocks) so every tier is a clean floor stack:
// core 20, ring 16, wings 12 and 8. Storey lines sit on y % 4 == 0 (belt courses), windows are 2 tall between them, with
// a spandrel above. Facade faces are exposed where a cell stands above its neighbour (setbacks read as stepped tiers).
// Interior is solid stone, with an air pocket behind each window (the glass has an air gap behind it), so no floor floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69581.cells.json", "utf8"));

// lidar roof -> whole storeys; a lidar roof under 6 blocks is the single-storey wing, not noise to drop
const snap = (r) => (r >= 19 ? 20 : r >= 14 ? 16 : r >= 10 ? 12 : r >= 6 ? 8 : 4);
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, T: snap(roof) });
const top = (x, z) => cell.get(`${x},${z}`)?.T ?? 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the faces of cell (x, z) that are visible at height y: a neighbour that is lower (or absent) leaves the face open
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => y >= top(x + dx, z + dz))
  .sort((a, b) => (top(x + a[0], z + a[1]) === 0 ? -1 : 0) - (top(x + b[0], z + b[1]) === 0 ? -1 : 0));

const W = 26, H = 32, D = 23;
const g = new Voxels([W, H, D]);

const pockets = new Set(), windows = new Map();
const key = (x, y, z) => `${x},${y},${z}`;

// pass 1: decide every cell of every column from y 0 up to its roof
for (const [k, { ground, T }] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    const fs = faces(x, z, y);
    if (!fs.length) continue; // interior: solid unless a window pocket below marks it as air
    const [dx, dz] = fs[0];
    const along = dx !== 0 ? z : x;
    const ry = y % 4;
    let b;
    if (y === 0) b = { block: "polished_granite" };
    else if (y === T - 1) b = { block: "stone_brick_wall" }; // parapet crowns every tier
    else if (ry === 0) b = { block: "smooth_quartz" };     // floor belt course
    else if (ry === 3) b = { block: "smooth_quartz" };     // spandrel under the slab
    else {
      // window zone: two bays of glass, one pier between; the pocket behind is inward and must be interior air
      const inX = x - dx, inZ = z - dz;
      const inT = top(inX, inZ);
      const pocketOk = inT > y && !faces(inX, inZ, y).length;
      if (along % 3 !== 0 && pocketOk) {
        const pane = dx !== 0 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
        b = { block: "light_gray_stained_glass_pane", state: pane };
        pockets.add(key(inX, y, inZ));
        windows.set(key(x, y, z), key(inX, y, inZ));
      } else b = { block: "calcite" };
    }
    g.set(x, y, z, b.block, b.state);
  }
}
// interior: solid stone, air only in the window pockets
for (const [k, { T }] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    if (faces(x, z, y).length || pockets.has(key(x, y, z))) continue;
    g.set(x, y, z, "stone");
  }
}

// the entrance: the southern face nearest the middle of the front, a dark oak door in a granite surround
let door = null;
for (const [k, { T }] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (T < 8 || top(x, z + 1) !== 0 || Math.abs(x - 12) > 2) continue;
  if (!door || z > door.z || (z === door.z && Math.abs(x - 12) < Math.abs(door.x - 12))) door = { x, z };
}
if (door) {
  const { x, z } = door;
  for (const y of [1, 2]) {
    g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x - 1, y, z, "polished_granite"); g.set(x + 1, y, z, "polished_granite");
    g.set(x, y, z - 1, "air");
  }
  g.set(x - 1, 3, z, "polished_granite"); g.set(x + 1, 3, z, "polished_granite");
  g.set(x, 3, z, "smooth_quartz");
  g.set(x, 2, z - 1, "lantern", { hanging: "true", waterlogged: "false" }); // hangs from the solid ceiling at y 3
}

// warm light behind some windows: glowstone in the pocket (air gap stays, the lamp sits in it)
for (const pk of pockets) {
  const [x, y, z] = pk.split(",").map(Number);
  if ((x * 5 + y * 3 + z * 7) % 13 === 0) g.set(x, y, z, "glowstone");
}

// roof equipment on the core: a few stone plant boxes and a shroomlight skylight on the tallest tier
let eq = 0;
for (const [k, { T }] of cell) {
  if (T !== 20) continue;
  const [x, z] = k.split(",").map(Number);
  if (x >= 12 && x <= 15 && z >= 9 && z <= 12 && !faces(x, z, 19).length && (x + z) % 2 === 0) {
    g.set(x, 20, z, eq % 2 ? "shroomlight" : "smooth_stone");
    g.set(x, 21, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    eq++;
  }
}

// roof deck for interior cells: the top layer is a stone deck, not a stone wall
for (const [k, { T }] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (!faces(x, z, T - 1).length) g.set(x, T - 1, z, "smooth_stone");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69581.nbt");
console.log({ cells: cell.size, windows: windows.size, pockets: pockets.size, door, roofEquipment: eq, blocks: g.count() });
