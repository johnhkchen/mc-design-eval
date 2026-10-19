// NYC1083721: 1345 Avenue of the Americas, a 1968 Midtown office block. A granite plinth and shopfront on the
// avenue face (x = 12), a curtain wall of stained glass in dark mullions with light spandrel lines, and a stepped
// massing from the lidar roof: two-storey wings, a three-storey middle and a four-storey core with a plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1083721.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));

// Lidar roof, smoothed by the median of its footprint neighbours, then snapped to three flat tiers. Storeys are
// 3 blocks and the ground floor starts at y 1, so a tier's top is 7, 10 or 13.
const top = new Map();
for (const [x, z] of cells) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (roof.has(key(x + dx, z + dz))) near.push(roof.get(key(x + dx, z + dz)));
  near.sort((a, b) => a - b);
  const m = near[Math.floor(near.length / 2)];
  top.set(key(x, z), m <= 8 ? 7 : m <= 11 ? 10 : 13);
}
const T = (x, z) => top.get(key(x, z));                        // undefined outside the footprint
const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// The faces that look out: a neighbour outside the footprint, or one that stops below this block.
const outFaces = (x, y, z) => sides.filter(([dx, dz]) => { const t = T(x + dx, z + dz); return t === undefined || t <= y; });

const v = new Voxels([13, 25, 22]);
const door = (half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, g] of cells) {
  const t = T(x, z);
  for (let y = 0; y < g; y++) v.set(x, y, z, "polished_granite");          // foundation under the ground
  for (let y = g; y < t; y++) {
    const s = Math.floor((y - 1) / 3), k = (y - 1) % 3;                     // storey s; k 0 = floor line, 1-2 = window band
    const out = outFaces(x, y, z);
    if (y === t - 1) { v.set(x, y, z, out.length ? "smooth_quartz" : "gray_concrete"); continue; }   // cornice and roof
    if (x === 12 && s === 0 && (z === 10 || z === 11) && y <= 2) {        // entrance vestibule: doors and glass
      if (z === 10) v.set(x, y, z, "iron_door", door(y === 1 ? "lower" : "upper"));
      else v.set(x, y, z, "glass");
      continue;
    }
    if (k === 0) { v.set(x, y, z, !out.length ? "light_gray_concrete" : s === 0 ? "polished_granite" : "smooth_quartz"); continue; }
    if (!out.length) continue;                                              // air behind the glass
    const [dx, dz] = out[0];
    const u = dx ? z : x, bay = Math.floor(u / 3);
    const pier = u % 3 === 0;
    if (s === 0) v.set(x, y, z, pier ? "polished_granite" : "glass");       // shopfront
    else v.set(x, y, z, pier ? "gray_concrete" : (bay + s) % 2 ? "light_blue_stained_glass" : "cyan_stained_glass");
    // A warm light a block inside some windows: shroomlights upstairs, glowstone in the lobby.
    const lit = k === 1 && !pier && (s === 0 ? bay % 2 === 0 : (bay * 5 + s * 3 + dx) % 4 === 0);
    if (!lit) continue;
    const ix = x - dx, iz = z - dz;
    if (T(ix, iz) > y && !outFaces(ix, y, iz).length) v.set(ix, y, iz, s === 0 ? "glowstone" : "shroomlight");
  }
}

// Entrance canopy over the vestibule, carried inward as a soffit, with a lantern hung beneath it.
for (let x = 10; x <= 12; x++) for (let z = 9; z <= 12; z++) v.set(x, 3, z, "smooth_quartz");
v.set(11, 2, 11, "lantern", { hanging: "true", waterlogged: "false" });

// Plant room on the four-storey core: cells whose eight neighbours are all core stand a storey higher, inset from the walls.
for (const [x, z] of cells) {
  if (T(x, z) !== 13) continue;
  let core = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (T(x + dx, z + dz) !== 13) core = false;
  if (!core) continue;
  v.set(x, 13, z, "light_gray_concrete");
  v.set(x, 14, z, x % 2 === 0 ? "iron_block" : "light_gray_concrete");
  v.set(x, 15, z, "smooth_quartz");
}

console.log(v.save(`${DIR}/NYC1083721.nbt`));
