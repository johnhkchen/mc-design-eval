// DC59340: a 9 x 9 Federal-style office block (1920s-30s, brick on a stone base, white stone piers and cornice),
// three storeys of 1-block windows separated by 1-block floor slabs, with a flat roof and a mechanical penthouse.
// Ground (cells.json) is 0 on the north/west side and 1 on the south/east, so y0 is filled everywhere and the
// slab stands on the lower cells; the lidar roof is 7 with 8s in the middle, read as one penthouse tier at y7.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59340.cells.json", "utf8"));
const fp = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { ground: g, roof: r }]));
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// the building's levels: y0 slab (plinth), y1 ground storey, y2 slab, y3 storey 2, y4 slab, y5 storey 3, y6 roof, y7 penthouse
const SLABS = [0, 2, 4, 6];
const WINDOW_ROWS = [1, 3, 5];
const blocks = new Map();                       // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);

const perimeter = (x, z) => ["north", "south", "west", "east"].some((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));
// piers at the corners and every 4th cell along each face (the front door sits on the centre pier)
const pier = (x, z) => {
  const ns = !inFp(x, z - 1) || !inFp(x, z + 1), ew = !inFp(x - 1, z) || !inFp(x + 1, z);
  return (x % 4 === 0 && ns) || (z % 4 === 0 && ew) || (ns && ew);
};
const DOOR = { x: 4, z: 0 };                    // centre of the lower (north) face, at grade

// 1. floor slabs and the roof deck across the whole footprint (nothing floats)
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (const y of SLABS) put(x, y, z, y === 0 ? "stone_bricks" : "smooth_stone");
}
// 2. the shell: piers (white stone), window rows (glass), spandrels (brick), base (stone brick), cornice (white stone)
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!perimeter(x, z)) continue;
  const isPier = pier(x, z);
  for (const y of [1, 2, 3, 4, 5]) {
    if (WINDOW_ROWS.includes(y)) {
      put(x, y, z, isPier ? "smooth_quartz" : "glass_pane");
    } else {
      put(x, y, z, isPier ? "smooth_quartz" : "bricks");
    }
  }
  put(x, 0, z, "stone_bricks");
  put(x, 6, z, "smooth_quartz");
}
// 3. the entrance: a dark oak door in the centre of the north face, with a stone surround
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
put(DOOR.x, 1, DOOR.z, "dark_oak_door", { ...door, half: "lower" });
put(DOOR.x, 2, DOOR.z, "dark_oak_door", { ...door, half: "upper" });
// 4. the penthouse: a mechanical tier on the roof, where the lidar reads 8 (x 3..5, z 3..5 inside the footprint)
for (let x = 3; x <= 5; x++) for (let z = 3; z <= 5; z++) if (inFp(x, z)) put(x, 7, z, "smooth_quartz");
// 5. warm light behind some windows: lanterns and glowstone on interior air cells in the ground and top storeys
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (perimeter(x, z)) continue;
  if ((x * 2 + z * 3) % 7 === 0) put(x, 1, z, "glowstone");
  if ((x + z * 2) % 9 === 4) put(x, 5, z, "shroomlight");
}
// 6. glass panes connect to their neighbours (solid or pane), so a window row reads as one band
for (const [key, v] of [...blocks]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const state = {};
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = at(x + dx, y, z + dz);
    state[d] = n && (n.block === "glass_pane" || (n.block !== "glowstone" && n.block !== "shroomlight")) ? "true" : "false";
  }
  v.state = state;
}

const g = new Voxels([9, 20, 9]);
for (const [key, { block, state }] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59340.nbt";
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
